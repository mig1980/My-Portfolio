/**
 * @fileoverview Custom hook for managing AI chat state and interactions.
 * @description Handles message history, loading states, API communication, and localStorage persistence.
 * @author Michael Gavrilov
 * @version 1.1.0
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { ChatMessage, ChatApiResponse, ChatHistoryItem } from '../types';
import { getOrCreateChatSessionId, trackEvent } from '../utils/analytics';

// ============================================================================
// Types
// ============================================================================

/** Return type for useChat hook */
export interface UseChatReturn {
  /** Array of chat messages */
  messages: ChatMessage[];
  /** Whether a request is in progress */
  isLoading: boolean;
  /** Error message if request failed */
  error: string | null;
  /** Whether rate limited (429 response) */
  isRateLimited: boolean;
  /** Seconds remaining until rate limit expires (0 when not limited) */
  rateLimitSecondsRemaining: number;
  /** Follow-up question suggestions from AI */
  suggestions: string[];
  /** Failed message content for retry */
  failedMessage: string | null;
  /** Send a message to the AI */
  sendMessage: (content: string) => Promise<void>;
  /** Retry the last failed message */
  retryLastMessage: () => Promise<void>;
  /** Clear all chat history */
  clearHistory: () => void;
}

/** Configuration options for useChat hook */
interface UseChatOptions {
  /** API endpoint URL (default: '/api/chat') */
  endpoint?: string;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** localStorage key for persistence (default: 'aboutme-chat-history') */
  storageKey?: string;
}

/** Stored message format (serializable) */
interface StoredMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string; // ISO string for serialization
}

// ============================================================================
// Constants
// ============================================================================

/** Default API endpoint */
const DEFAULT_ENDPOINT = '/api/chat';

/** Default request timeout (30 seconds); must exceed TOTAL_BUDGET_MS in functions/api/chat.ts */
const DEFAULT_TIMEOUT = 30000;

/** Default localStorage key */
const DEFAULT_STORAGE_KEY = 'aboutme-chat-history';

/** Rate limit cooldown in milliseconds (30 seconds) */
const RATE_LIMIT_COOLDOWN_MS = 30000;

/** Maximum messages to store in localStorage */
const MAX_STORED_MESSAGES = 50;

/** localStorage expiration time (24 hours in ms) */
const STORAGE_EXPIRATION_MS = 24 * 60 * 60 * 1000;

// ============================================================================
// Storage Helpers
// ============================================================================

/**
 * Checks a value read from localStorage is a well-formed stored message.
 * @param value - Untrusted parsed value
 * @returns True if safe to render
 */
function isStoredMessage(value: unknown): value is StoredMessage {
  if (typeof value !== 'object' || value === null) return false;
  const m = value as Record<string, unknown>;
  return (
    typeof m.id === 'string' &&
    (m.role === 'user' || m.role === 'assistant') &&
    typeof m.content === 'string' &&
    typeof m.timestamp === 'string' &&
    !Number.isNaN(Date.parse(m.timestamp))
  );
}

/**
 * Safely parses JSON from localStorage.
 * @param key - localStorage key
 * @returns Parsed messages or null if invalid/expired
 */
function loadFromStorage(key: string): ChatMessage[] | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }

    const stored = localStorage.getItem(key);
    if (!stored) return null;

    const parsed: unknown = JSON.parse(stored);
    const record =
      typeof parsed === 'object' && parsed !== null
        ? (parsed as { messages?: unknown; savedAt?: unknown })
        : null;

    // Missing/invalid fields or older than 24 hours: discard
    if (
      !record ||
      typeof record.savedAt !== 'number' ||
      !Array.isArray(record.messages) ||
      Date.now() - record.savedAt > STORAGE_EXPIRATION_MS
    ) {
      localStorage.removeItem(key);
      return null;
    }

    // Convert stored messages back to ChatMessage format, dropping malformed entries
    return record.messages.filter(isStoredMessage).map((msg) => ({
      ...msg,
      timestamp: new Date(msg.timestamp),
    }));
  } catch {
    // Invalid data, clear it
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore storage errors
    }
    return null;
  }
}

/**
 * Saves messages to localStorage.
 * @param key - localStorage key
 * @param messages - Messages to save
 */
function saveToStorage(key: string, messages: ChatMessage[]): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    // Limit stored messages to prevent quota issues
    const messagesToStore = messages.slice(-MAX_STORED_MESSAGES);

    const data = {
      messages: messagesToStore.map((msg) => ({
        ...msg,
        timestamp: msg.timestamp.toISOString(),
      })),
      savedAt: Date.now(),
    };

    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Ignore storage errors (quota exceeded, private mode, etc.)
  }
}

/**
 * Clears messages from localStorage.
 * @param key - localStorage key
 */
function clearStorage(key: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(key);
    }
  } catch {
    // Ignore storage errors
  }
}

// ============================================================================
// ID Generation Helper
// ============================================================================

/**
 * Generates a unique ID for messages.
 * Falls back to timestamp + random for older browsers without crypto.randomUUID.
 * @returns Unique identifier string
 */
function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for managing chat state with the AI assistant.
 * Handles message history, loading states, API communication, and localStorage persistence.
 *
 * @param options - Configuration options
 * @returns Chat state and control functions
 *
 * @example
 * ```tsx
 * const { messages, isLoading, sendMessage } = useChat();
 * await sendMessage('Hello!');
 * ```
 */
export function useChat({
  endpoint = DEFAULT_ENDPOINT,
  timeout = DEFAULT_TIMEOUT,
  storageKey = DEFAULT_STORAGE_KEY,
}: UseChatOptions = {}): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState<boolean>(false);
  const [rateLimitSecondsRemaining, setRateLimitSecondsRemaining] = useState<number>(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [failedMessage, setFailedMessage] = useState<string | null>(null);

  // Track if initial load from storage is done
  const initialLoadDone = useRef<boolean>(false);

  // Use ref to always have current messages for history (avoids stale closure)
  const messagesRef = useRef<ChatMessage[]>([]);
  messagesRef.current = messages;

  // Synchronous guard: state updates lag, so two quick calls could both pass an isLoading check
  const inFlightRef = useRef<boolean>(false);

  // Track rate limit timeout and countdown interval
  const rateLimitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rateLimitIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load messages from localStorage on mount
  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;

    const stored = loadFromStorage(storageKey);
    if (stored && stored.length > 0) {
      setMessages(stored);
    }
  }, [storageKey]);

  // Save messages to localStorage when they change
  useEffect(() => {
    // Don't save during initial load
    if (!initialLoadDone.current) return;
    // Don't save empty messages (prevents overwriting on clear before reload)
    if (messages.length === 0) return;
    saveToStorage(storageKey, messages);
  }, [messages, storageKey]);

  // Cleanup rate limit timeout and interval on unmount
  useEffect(() => {
    return () => {
      if (rateLimitTimeoutRef.current) {
        clearTimeout(rateLimitTimeoutRef.current);
      }
      if (rateLimitIntervalRef.current) {
        clearInterval(rateLimitIntervalRef.current);
      }
    };
  }, []);

  const sendMessage = useCallback(
    async (content: string): Promise<void> => {
      const trimmedContent = content.trim();
      if (!trimmedContent || inFlightRef.current || isRateLimited) return;
      inFlightRef.current = true;

      // Clear previous failed message and suggestions
      setFailedMessage(null);
      setSuggestions([]);

      // Create user message
      const userMessage: ChatMessage = {
        id: generateId(),
        role: 'user',
        content: trimmedContent,
        timestamp: new Date(),
      };

      // Capture current history BEFORE adding new message (fixes stale closure)
      const currentHistory: ChatHistoryItem[] = messagesRef.current.map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        content: m.content,
      }));

      // Optimistically add user message
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      const chatSessionId = getOrCreateChatSessionId();
      const requestStartMs = typeof performance !== 'undefined' ? performance.now() : Date.now();

      trackEvent('chat_message_sent', {
        chat_session_id: chatSessionId,
        message_length: trimmedContent.length,
        history_length: currentHistory.length,
        is_online: typeof navigator !== 'undefined' ? navigator.onLine : undefined,
      });

      // Setup abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // Failure details are collected here so the catch block stays the only emitter
      // of chat_message_failed; otherwise one failure would be counted twice.
      let failureType: string | undefined;
      let failureStatus: number | undefined;

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: trimmedContent,
            history: currentHistory,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        failureStatus = response.status;

        // Safely parse JSON response (handles HTML error pages gracefully)
        let data: ChatApiResponse;
        try {
          const responseText = await response.text();
          // Check if response looks like HTML (error page) instead of JSON
          if (responseText.trimStart().startsWith('<')) {
            failureType = 'invalid_response';
            throw new Error(
              response.status >= 500
                ? 'The AI service is temporarily unavailable. Please try again in a moment.'
                : `Server error (${response.status}). Please try again.`
            );
          }
          const parsed: unknown = JSON.parse(responseText);
          if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
            failureType = 'invalid_response';
            throw new Error(`Invalid response from server (${response.status}). Please try again.`);
          }
          data = parsed as ChatApiResponse;
        } catch (parseError) {
          // Re-throw if it's already our custom error
          if (parseError instanceof Error && !parseError.message.includes('JSON')) {
            throw parseError;
          }
          // JSON parse failed - server returned invalid response
          failureType = 'invalid_response';
          throw new Error(
            response.status >= 500
              ? 'The AI service is temporarily unavailable. Please try again in a moment.'
              : `Invalid response from server (${response.status}). Please try again.`
          );
        }

        // Handle rate limiting with specific UX and countdown timer
        if (response.status === 429) {
          trackEvent('chat_message_rate_limited', {
            chat_session_id: chatSessionId,
            message_length: trimmedContent.length,
          });

          setIsRateLimited(true);
          setFailedMessage(trimmedContent);

          let countdownSeconds = Math.ceil(RATE_LIMIT_COOLDOWN_MS / 1000);
          const retryAfterMs = 'retryAfterMs' in data ? data.retryAfterMs : undefined;
          if (
            typeof retryAfterMs === 'number' &&
            Number.isFinite(retryAfterMs) &&
            retryAfterMs > 0
          ) {
            countdownSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
          }

          setRateLimitSecondsRemaining(countdownSeconds);
          // Don't set error - RateLimitIndicator handles the message

          // Update countdown every second
          rateLimitIntervalRef.current = setInterval(() => {
            setRateLimitSecondsRemaining((prev) => {
              const newValue = prev - 1;
              if (newValue <= 0) {
                if (rateLimitIntervalRef.current) {
                  clearInterval(rateLimitIntervalRef.current);
                  rateLimitIntervalRef.current = null;
                }
                return 0;
              }
              return newValue;
            });
          }, 1000);

          // Auto-clear rate limit after cooldown
          rateLimitTimeoutRef.current = setTimeout(() => {
            setIsRateLimited(false);
            setRateLimitSecondsRemaining(0);
            if (rateLimitIntervalRef.current) {
              clearInterval(rateLimitIntervalRef.current);
              rateLimitIntervalRef.current = null;
            }
          }, countdownSeconds * 1000);

          return;
        }

        const serverError = typeof data.error === 'string' && data.error ? data.error : null;

        if (!response.ok) {
          failureType = 'http_error';
          throw new Error(serverError ?? `Request failed: ${response.status}`);
        }

        if (serverError) {
          failureType = 'server_error';
          throw new Error(serverError);
        }

        const reply = 'reply' in data ? data.reply : undefined;
        if (typeof reply !== 'string' || reply.trim() === '') {
          failureType = 'empty_reply';
          throw new Error('Empty response from AI service');
        }

        const requestEndMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
        const responseTimeMs = Math.max(0, Math.round(requestEndMs - requestStartMs));
        trackEvent('chat_response_received', {
          chat_session_id: chatSessionId,
          response_time_ms: responseTimeMs,
          reply_length: reply.length,
        });

        // Add assistant response
        const assistantMessage: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: reply,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        // Update follow-up suggestions (ignore anything that isn't a list of strings)
        const suggestions: unknown = 'suggestions' in data ? data.suggestions : undefined;
        if (Array.isArray(suggestions)) {
          const valid = suggestions.filter((s): s is string => typeof s === 'string');
          if (valid.length > 0) setSuggestions(valid);
        }
      } catch (err) {
        // Handle specific error types
        let errorMessage: string;
        let errorType: string | undefined;

        if (err instanceof Error) {
          if (err.name === 'AbortError') {
            errorMessage = 'Request timed out. Please try again.';
            errorType = 'timeout';
          } else {
            errorMessage = err.message;
            errorType = failureType ?? 'error';
          }
        } else {
          errorMessage = 'An unexpected error occurred';
          errorType = failureType ?? 'unknown';
        }

        trackEvent('chat_message_failed', {
          chat_session_id: chatSessionId,
          error_type: errorType,
          http_status: failureStatus,
        });

        setError(errorMessage);
        setFailedMessage(trimmedContent);
      } finally {
        clearTimeout(timeoutId);
        inFlightRef.current = false;
        setIsLoading(false);
      }
    },
    [endpoint, timeout, isRateLimited]
  );

  const retryLastMessage = useCallback(async (): Promise<void> => {
    if (!failedMessage || inFlightRef.current || isRateLimited) return;

    // Remove the failed user message before retrying. Update the ref too, because
    // sendMessage builds history from it before React re-renders.
    const current = messagesRef.current;
    let lastIndex = -1;
    for (let i = current.length - 1; i >= 0; i--) {
      if (current[i]?.role === 'user' && current[i]?.content === failedMessage) {
        lastIndex = i;
        break;
      }
    }
    if (lastIndex !== -1) {
      const next = [...current.slice(0, lastIndex), ...current.slice(lastIndex + 1)];
      messagesRef.current = next;
      setMessages(next);
    }

    // Clear error and retry
    setError(null);
    const messageToRetry = failedMessage;
    setFailedMessage(null);

    await sendMessage(messageToRetry);
  }, [failedMessage, isRateLimited, sendMessage]);

  const clearHistory = useCallback((): void => {
    setMessages([]);
    setError(null);
    setIsRateLimited(false);
    setRateLimitSecondsRemaining(0);
    setSuggestions([]);
    setFailedMessage(null);
    clearStorage(storageKey);

    // Clear any pending rate limit timeout and countdown interval
    if (rateLimitTimeoutRef.current) {
      clearTimeout(rateLimitTimeoutRef.current);
      rateLimitTimeoutRef.current = null;
    }
    if (rateLimitIntervalRef.current) {
      clearInterval(rateLimitIntervalRef.current);
      rateLimitIntervalRef.current = null;
    }
  }, [storageKey]);

  return {
    messages,
    isLoading,
    error,
    isRateLimited,
    rateLimitSecondsRemaining,
    suggestions,
    failedMessage,
    sendMessage,
    retryLastMessage,
    clearHistory,
  };
}

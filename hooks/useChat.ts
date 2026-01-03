/**
 * @fileoverview Custom hook for managing AI chat state and interactions.
 * @description Handles message history, loading states, API communication, and localStorage persistence.
 * @author Michael Gavrilov
 * @version 1.1.0
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { ChatMessage, ChatApiResponse, ChatHistoryItem } from '../types';

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

/** Default request timeout (30 seconds) */
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

    const parsed = JSON.parse(stored) as {
      messages: StoredMessage[];
      savedAt: number;
    };

    // Check if expired (24 hours)
    if (Date.now() - parsed.savedAt > STORAGE_EXPIRATION_MS) {
      localStorage.removeItem(key);
      return null;
    }

    // Convert stored messages back to ChatMessage format
    return parsed.messages.map((msg) => ({
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
      if (!trimmedContent || isLoading || isRateLimited) return;

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

      // Setup abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

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

        // Handle rate limiting with specific UX and countdown timer
        if (response.status === 429) {
          setIsRateLimited(true);
          setFailedMessage(trimmedContent);

          // Start countdown from 30 seconds
          const countdownSeconds = Math.ceil(RATE_LIMIT_COOLDOWN_MS / 1000);
          setRateLimitSecondsRemaining(countdownSeconds);
          setError(`Too many requests. Please wait ${countdownSeconds} seconds.`);

          // Update countdown every second
          rateLimitIntervalRef.current = setInterval(() => {
            setRateLimitSecondsRemaining((prev) => {
              const newValue = prev - 1;
              if (newValue <= 0) {
                // Clear interval when countdown reaches 0
                if (rateLimitIntervalRef.current) {
                  clearInterval(rateLimitIntervalRef.current);
                  rateLimitIntervalRef.current = null;
                }
                return 0;
              }
              setError(`Too many requests. Please wait ${newValue} seconds.`);
              return newValue;
            });
          }, 1000);

          // Auto-clear rate limit after cooldown
          rateLimitTimeoutRef.current = setTimeout(() => {
            setIsRateLimited(false);
            setError(null);
            setRateLimitSecondsRemaining(0);
            if (rateLimitIntervalRef.current) {
              clearInterval(rateLimitIntervalRef.current);
              rateLimitIntervalRef.current = null;
            }
          }, RATE_LIMIT_COOLDOWN_MS);

          return;
        }

        // Parse response with type safety
        const data = (await response.json()) as ChatApiResponse;

        if (!response.ok) {
          throw new Error(data.error ?? `Request failed: ${response.status}`);
        }

        if ('error' in data && data.error) {
          throw new Error(data.error);
        }

        if (!('reply' in data) || !data.reply) {
          throw new Error('Empty response from AI service');
        }

        // Add assistant response
        const assistantMessage: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: data.reply,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        // Update follow-up suggestions
        if (data.suggestions && data.suggestions.length > 0) {
          setSuggestions(data.suggestions);
        }
      } catch (err) {
        // Handle specific error types
        let errorMessage: string;

        if (err instanceof Error) {
          if (err.name === 'AbortError') {
            errorMessage = 'Request timed out. Please try again.';
          } else {
            errorMessage = err.message;
          }
        } else {
          errorMessage = 'An unexpected error occurred';
        }

        setError(errorMessage);
        setFailedMessage(trimmedContent);
        console.error('Chat error:', err);
      } finally {
        clearTimeout(timeoutId);
        setIsLoading(false);
      }
    },
    [endpoint, timeout, isLoading, isRateLimited]
  );

  const retryLastMessage = useCallback(async (): Promise<void> => {
    if (!failedMessage || isLoading || isRateLimited) return;

    // Remove the failed user message before retrying
    setMessages((prev: ChatMessage[]) => {
      // Find and remove the last user message that matches the failed content
      // Using reverse iteration for ES2020 compatibility (instead of findLastIndex)
      let lastIndex = -1;
      for (let i = prev.length - 1; i >= 0; i--) {
        if (prev[i]?.role === 'user' && prev[i]?.content === failedMessage) {
          lastIndex = i;
          break;
        }
      }
      if (lastIndex !== -1) {
        return [...prev.slice(0, lastIndex), ...prev.slice(lastIndex + 1)];
      }
      return prev;
    });

    // Clear error and retry
    setError(null);
    const messageToRetry = failedMessage;
    setFailedMessage(null);

    await sendMessage(messageToRetry);
  }, [failedMessage, isLoading, isRateLimited, sendMessage]);

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

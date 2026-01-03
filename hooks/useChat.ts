/**
 * @fileoverview Custom hook for managing AI chat state and interactions.
 * @description Handles message history, loading states, and API communication.
 * @author Michael Gavrilov
 * @version 1.0.0
 */

import { useState, useCallback, useRef } from 'react';
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
  /** Send a message to the AI */
  sendMessage: (content: string) => Promise<void>;
  /** Clear all chat history */
  clearHistory: () => void;
}

/** Configuration options for useChat hook */
interface UseChatOptions {
  /** API endpoint URL (default: '/api/chat') */
  endpoint?: string;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
}

// ============================================================================
// Constants
// ============================================================================

/** Default API endpoint */
const DEFAULT_ENDPOINT = '/api/chat';

/** Default request timeout (30 seconds) */
const DEFAULT_TIMEOUT = 30000;

/** Rate limit cooldown in milliseconds (30 seconds) */
const RATE_LIMIT_COOLDOWN_MS = 30000;

// ============================================================================
// Helpers
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
 * Handles message history, loading states, and API communication.
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
}: UseChatOptions = {}): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState<boolean>(false);

  // Use ref to always have current messages for history (avoids stale closure)
  const messagesRef = useRef<ChatMessage[]>([]);
  messagesRef.current = messages;

  // Track rate limit timeout
  const rateLimitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sendMessage = useCallback(
    async (content: string): Promise<void> => {
      const trimmedContent = content.trim();
      if (!trimmedContent || isLoading || isRateLimited) return;

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

        // Handle rate limiting with specific UX
        if (response.status === 429) {
          setIsRateLimited(true);
          setError('Too many requests. Please wait 30 seconds before trying again.');

          // Auto-clear rate limit after cooldown
          rateLimitTimeoutRef.current = setTimeout(() => {
            setIsRateLimited(false);
            setError(null);
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
        console.error('Chat error:', err);
      } finally {
        clearTimeout(timeoutId);
        setIsLoading(false);
      }
    },
    [endpoint, timeout, isLoading, isRateLimited]
  );

  const clearHistory = useCallback((): void => {
    setMessages([]);
    setError(null);
    setIsRateLimited(false);

    // Clear any pending rate limit timeout
    if (rateLimitTimeoutRef.current) {
      clearTimeout(rateLimitTimeoutRef.current);
      rateLimitTimeoutRef.current = null;
    }
  }, []);

  return { messages, isLoading, error, isRateLimited, sendMessage, clearHistory };
}

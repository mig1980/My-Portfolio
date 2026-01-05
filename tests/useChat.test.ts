/**
 * @fileoverview Unit tests for useChat hook.
 * @author Michael Gavrilov
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { useChat } from '../hooks/useChat';

// Mock fetch globally
const mockFetch = vi.fn() as Mock;
global.fetch = mockFetch;

// Mock analytics
vi.mock('../utils/analytics', () => ({
  getOrCreateChatSessionId: () => 'test-session-id',
  trackEvent: vi.fn(),
}));

const STORAGE_KEY = 'aboutme-chat-history';

/**
 * Helper to create a mock fetch response with both json() and text() methods
 */
function createMockResponse(
  data: object,
  options: { ok?: boolean; status?: number } = {}
): { ok: boolean; status: number; json: () => Promise<object>; text: () => Promise<string> } {
  const { ok = true, status = 200 } = options;
  const jsonString = JSON.stringify(data);
  return {
    ok,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(jsonString),
  };
}

describe('useChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    localStorage.removeItem(STORAGE_KEY);
    vi.useFakeTimers();
  });

  afterEach(() => {
    localStorage.removeItem(STORAGE_KEY);
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('returns empty messages array initially', () => {
      const { result } = renderHook(() => useChat());
      expect(result.current.messages).toEqual([]);
    });

    it('is not loading initially', () => {
      const { result } = renderHook(() => useChat());
      expect(result.current.isLoading).toBe(false);
    });

    it('has no error initially', () => {
      const { result } = renderHook(() => useChat());
      expect(result.current.error).toBeNull();
    });

    it('is not rate limited initially', () => {
      const { result } = renderHook(() => useChat());
      expect(result.current.isRateLimited).toBe(false);
    });

    it('has empty suggestions initially', () => {
      const { result } = renderHook(() => useChat());
      expect(result.current.suggestions).toEqual([]);
    });
  });

  describe('sendMessage', () => {
    it('adds user message to messages array', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ reply: 'Test response' }));

      const { result } = renderHook(() => useChat());

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(result.current.messages[0]).toMatchObject({
        role: 'user',
        content: 'Hello',
      });
    });

    it('adds assistant response to messages array', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ reply: 'AI response' }));

      const { result } = renderHook(() => useChat());

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(result.current.messages[1]).toMatchObject({
        role: 'assistant',
        content: 'AI response',
      });
    });

    it('sets isLoading during request', async () => {
      mockFetch.mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve(createMockResponse({ reply: 'Response' })), 50)
          )
      );

      const { result } = renderHook(() => useChat());

      // Start sending
      act(() => {
        result.current.sendMessage('Hello');
      });

      // Should be loading immediately after send starts
      expect(result.current.isLoading).toBe(true);

      // Wait for completion
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('does not send empty messages', async () => {
      const { result } = renderHook(() => useChat());

      await act(async () => {
        await result.current.sendMessage('   ');
      });

      expect(mockFetch).not.toHaveBeenCalled();
      expect(result.current.messages).toEqual([]);
    });

    it('trims message content', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ reply: 'Response' }));

      const { result } = renderHook(() => useChat());

      await act(async () => {
        await result.current.sendMessage('  Hello  ');
      });

      expect(result.current.messages[0]?.content).toBe('Hello');
    });

    it('updates suggestions from response', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ reply: 'Response', suggestions: ['Follow up 1', 'Follow up 2'] })
      );

      const { result } = renderHook(() => useChat());

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(result.current.suggestions).toEqual(['Follow up 1', 'Follow up 2']);
    });
  });

  describe('error handling', () => {
    it('sets error on API failure', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ error: 'Server error' }, { ok: false, status: 500 })
      );

      const { result } = renderHook(() => useChat());

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(result.current.error).toBe('Server error');
    });

    it('sets failedMessage on error', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ error: 'Error' }, { ok: false, status: 500 })
      );

      const { result } = renderHook(() => useChat());

      await act(async () => {
        await result.current.sendMessage('My message');
      });

      expect(result.current.failedMessage).toBe('My message');
    });

    it('handles timeout errors', async () => {
      mockFetch.mockImplementationOnce(() => {
        const error = new Error('Timeout');
        error.name = 'AbortError';
        return Promise.reject(error);
      });

      const { result } = renderHook(() => useChat());

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(result.current.error).toBe('Request timed out. Please try again.');
    });
  });

  describe('rate limiting', () => {
    it('sets isRateLimited on 429 response', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ error: 'Rate limited' }, { ok: false, status: 429 })
      );

      const { result } = renderHook(() => useChat());

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(result.current.isRateLimited).toBe(true);
    });

    it('uses retryAfterMs from response for countdown', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse(
          { error: 'Rate limited', retryAfterMs: 10000 },
          { ok: false, status: 429 }
        )
      );

      const { result } = renderHook(() => useChat());

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(result.current.rateLimitSecondsRemaining).toBe(10);
    });

    it('clears rate limit after countdown', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse(
          { error: 'Rate limited', retryAfterMs: 2000 },
          { ok: false, status: 429 }
        )
      );

      const { result } = renderHook(() => useChat());

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(result.current.isRateLimited).toBe(true);

      // Fast-forward past the cooldown
      await act(async () => {
        vi.advanceTimersByTime(3000);
      });

      expect(result.current.isRateLimited).toBe(false);
    });

    it('prevents sending while rate limited', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse(
          { error: 'Rate limited', retryAfterMs: 5000 },
          { ok: false, status: 429 }
        )
      );

      const { result } = renderHook(() => useChat());

      await act(async () => {
        await result.current.sendMessage('First');
      });

      mockFetch.mockClear();

      await act(async () => {
        await result.current.sendMessage('Second');
      });

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('retryLastMessage', () => {
    it('retries the failed message', async () => {
      mockFetch
        .mockResolvedValueOnce(createMockResponse({ error: 'Error' }, { ok: false, status: 500 }))
        .mockResolvedValueOnce(createMockResponse({ reply: 'Success' }));

      const { result } = renderHook(() => useChat());

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(result.current.error).toBeTruthy();

      await act(async () => {
        await result.current.retryLastMessage();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.messages).toHaveLength(2);
    });

    it('does nothing if no failed message', async () => {
      const { result } = renderHook(() => useChat());

      await act(async () => {
        await result.current.retryLastMessage();
      });

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('clearHistory', () => {
    it('clears all messages', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ reply: 'Response' }));

      const { result } = renderHook(() => useChat());

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(result.current.messages).toHaveLength(2);

      act(() => {
        result.current.clearHistory();
      });

      expect(result.current.messages).toEqual([]);
    });

    it('clears error state', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ error: 'Error' }, { ok: false, status: 500 })
      );

      const { result } = renderHook(() => useChat());

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(result.current.error).toBeTruthy();

      act(() => {
        result.current.clearHistory();
      });

      expect(result.current.error).toBeNull();
    });

    it('clears rate limit state', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse(
          { error: 'Rate limited', retryAfterMs: 30000 },
          { ok: false, status: 429 }
        )
      );

      const { result } = renderHook(() => useChat());

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(result.current.isRateLimited).toBe(true);

      act(() => {
        result.current.clearHistory();
      });

      expect(result.current.isRateLimited).toBe(false);
      expect(result.current.rateLimitSecondsRemaining).toBe(0);
    });

    it('clears localStorage', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ reply: 'Response' }));

      const { result } = renderHook(() => useChat());

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      // Wait for storage save
      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      act(() => {
        result.current.clearHistory();
      });

      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });
  });

  describe('localStorage persistence', () => {
    it('loads messages from localStorage on mount', () => {
      const savedData = {
        messages: [
          {
            id: '1',
            role: 'user',
            content: 'Saved message',
            timestamp: new Date().toISOString(),
          },
        ],
        savedAt: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedData));

      const { result } = renderHook(() => useChat());

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0]?.content).toBe('Saved message');
    });

    it('ignores expired localStorage data', () => {
      const savedData = {
        messages: [
          {
            id: '1',
            role: 'user',
            content: 'Old message',
            timestamp: new Date().toISOString(),
          },
        ],
        savedAt: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedData));

      const { result } = renderHook(() => useChat());

      expect(result.current.messages).toEqual([]);
    });

    it('handles invalid localStorage data gracefully', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid json');

      const { result } = renderHook(() => useChat());

      expect(result.current.messages).toEqual([]);
    });
  });
});

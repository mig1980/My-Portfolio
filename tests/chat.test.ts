/**
 * @fileoverview Unit tests for the /api/chat Cloudflare Pages Function.
 * @author Michael Gavrilov
 */

import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { onRequestPost } from '../functions/api/chat';

type ChatContext = Parameters<typeof onRequestPost>[0];

interface ChatResponseBody {
  reply?: string;
  error?: string;
  attemptedModels?: string[];
}

const mockFetch = vi.fn() as Mock;

function createContext(body: unknown): ChatContext {
  return {
    request: {
      headers: new Headers({ Origin: 'https://gavrilov.ai' }),
      json: () => Promise.resolve(body),
    },
    env: { GEMINI_API_KEY: 'test-key' },
  } as unknown as ChatContext;
}

function geminiReply(text: string): Response {
  return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }), {
    status: 200,
  });
}

function geminiError(status: number): Response {
  return new Response(JSON.stringify({ error: { code: status, message: 'error' } }), { status });
}

function hangUntilAborted(_url: string, init?: RequestInit): Promise<Response> {
  return new Promise((_resolve, reject) => {
    init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
  });
}

function calledModels(): string[] {
  return mockFetch.mock.calls.map(([url]) => /models\/([^:]+):/.exec(String(url))?.[1] ?? '');
}

describe('POST /api/chat', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    vi.stubGlobal('fetch', mockFetch);
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('model fallback', () => {
    it('returns the primary model reply', async () => {
      mockFetch.mockResolvedValueOnce(geminiReply('Hello'));

      const res = await onRequestPost(createContext({ message: 'Hi' }));
      const data = (await res.json()) as ChatResponseBody;

      expect(res.status).toBe(200);
      expect(data.reply).toBe('Hello');
      expect(calledModels()).toEqual(['gemini-3.8-flash']);
    });

    it('asks only Gemini 3.8 Flash for low thinking', async () => {
      mockFetch.mockResolvedValueOnce(geminiError(429)).mockResolvedValueOnce(geminiReply('Hi'));

      await onRequestPost(createContext({ message: 'Hi' }));

      const configs = mockFetch.mock.calls.map(
        ([, init]) =>
          (JSON.parse(String((init as RequestInit).body)) as { generationConfig: object })
            .generationConfig
      );
      expect(configs[0]).toMatchObject({ thinkingConfig: { thinkingLevel: 'low' } });
      expect(configs[1]).not.toHaveProperty('thinkingConfig');
    });

    it('joins multi-part replies and drops thought parts', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [
                    { text: 'internal reasoning', thought: true },
                    { text: 'Michael is a two-time' },
                    { text: ' Platinum Club recipient.' },
                  ],
                },
              },
            ],
          }),
          { status: 200 }
        )
      );

      const res = await onRequestPost(createContext({ message: 'Hi' }));
      const data = (await res.json()) as ChatResponseBody;

      expect(data.reply).toBe('Michael is a two-time Platinum Club recipient.');
    });

    it('falls back to the next model on 404 (retired model)', async () => {
      mockFetch.mockResolvedValueOnce(geminiError(404)).mockResolvedValueOnce(geminiReply('Hi'));

      const res = await onRequestPost(createContext({ message: 'Hi' }));
      const data = (await res.json()) as ChatResponseBody;

      expect(res.status).toBe(200);
      expect(data.reply).toBe('Hi');
      expect(calledModels()).toEqual(['gemini-3.8-flash', 'gemini-3.5-flash-lite']);
    });

    it('falls back to the next model on 400', async () => {
      mockFetch.mockResolvedValueOnce(geminiError(400)).mockResolvedValueOnce(geminiReply('Hi'));

      const res = await onRequestPost(createContext({ message: 'Hi' }));

      expect(res.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('returns 502 after trying every model when all return 4xx', async () => {
      mockFetch.mockImplementation(() => Promise.resolve(geminiError(404)));

      const res = await onRequestPost(createContext({ message: 'Hi' }));
      const data = (await res.json()) as ChatResponseBody;

      expect(res.status).toBe(502);
      expect(data.attemptedModels).toHaveLength(4);
    });

    it('stops on authentication errors without trying other models', async () => {
      mockFetch.mockResolvedValueOnce(geminiError(403));

      const res = await onRequestPost(createContext({ message: 'Hi' }));

      expect(res.status).toBe(503);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('returns 429 when every model is rate limited', async () => {
      mockFetch.mockImplementation(() => Promise.resolve(geminiError(429)));

      const res = await onRequestPost(createContext({ message: 'Hi' }));

      expect(res.status).toBe(429);
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });
  });

  describe('time budget', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('falls back after a per-model timeout', async () => {
      mockFetch.mockImplementationOnce(hangUntilAborted).mockResolvedValueOnce(geminiReply('Hi'));

      const pending = onRequestPost(createContext({ message: 'Hi' }));
      await vi.advanceTimersByTimeAsync(12000);
      const res = await pending;

      expect(res.status).toBe(200);
      expect(calledModels()).toEqual(['gemini-3.8-flash', 'gemini-3.5-flash-lite']);
    });

    it('returns 504 before the 30s client timeout when all models hang', async () => {
      mockFetch.mockImplementation(hangUntilAborted);

      let settled = false;
      const pending = Promise.resolve(onRequestPost(createContext({ message: 'Hi' }))).then(
        (res) => {
          settled = true;
          return res;
        }
      );
      await vi.advanceTimersByTimeAsync(25000);

      expect(settled).toBe(true);
      const res = await pending;
      const data = (await res.json()) as ChatResponseBody;
      expect(res.status).toBe(504);
      expect(data.attemptedModels).toEqual(['gemini-3.8-flash', 'gemini-3.5-flash-lite']);
    });
  });
});

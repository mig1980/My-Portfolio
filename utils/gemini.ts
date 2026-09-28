/**
 * @fileoverview Gemini API calls shared by /api/chat and /api/fit: model fallback with a time budget,
 * and the host allow-list. No DOM or Node APIs: the Cloudflare Functions import it.
 */

export interface GeminiContentPart {
  text?: string;
  /** True for thinking-model reasoning parts, which must not be shown */
  thought?: boolean;
}

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: GeminiContentPart[];
}

interface GeminiResponse {
  candidates?: { content?: { parts?: GeminiContentPart[] }; finishReason?: string }[];
  error?: { code?: number; message?: string; status?: string };
}

export interface GenerateOptions<T> {
  apiKey: string;
  /** Tried in order; a model may repeat to retry it */
  models: readonly string[];
  /** Request body for one model (lets each model get its own generation settings) */
  payloadFor: (model: string) => object;
  perModelTimeoutMs: number;
  totalBudgetMs: number;
  /** Skip remaining models when less than this much budget is left */
  minAttemptMs: number;
  /** Turns the reply text into the result; null means unusable, so the next model is tried */
  parse: (text: string) => T | null;
}

export type GenerateResult<T> =
  | { kind: 'ok'; value: T; attemptedModels: string[] }
  | { kind: 'safety'; attemptedModels: string[] }
  | { kind: 'auth'; attemptedModels: string[] }
  | { kind: 'rate_limited'; retryAfterMs: number | null; attemptedModels: string[] }
  | {
      kind: 'failed';
      lastStatus: number | null;
      lastErrorMessage: string | null;
      /** True when the last model answered but its reply was unusable */
      unusable: boolean;
      attemptedModels: string[];
    };

/** Parses Retry-After header (seconds or HTTP date). Returns ms or null when absent/invalid. */
function parseRetryAfterMs(response: Response): number | null {
  const retryAfter = response.headers.get('retry-after');
  if (!retryAfter) return null;

  const seconds = Number(retryAfter);
  if (!Number.isNaN(seconds)) {
    return Math.max(0, Math.round(seconds * 1000));
  }

  const dateMs = Date.parse(retryAfter);
  if (!Number.isNaN(dateMs)) {
    const delta = dateMs - Date.now();
    return delta > 0 ? delta : null;
  }

  return null;
}

/**
 * Calls each model in turn until one returns a usable reply.
 * 429 and model errors move on to the next model; 401/403 stop at once.
 */
export async function generateWithFallback<T>(
  options: GenerateOptions<T>
): Promise<GenerateResult<T>> {
  const attemptedModels: string[] = [];
  let lastStatus: number | null = null;
  let lastErrorMessage: string | null = null;
  let unusable = false;
  let sawRateLimit = false;
  let bestRetryAfterMs: number | null = null;
  const deadline = Date.now() + options.totalBudgetMs;

  for (const modelName of options.models) {
    const remainingMs = deadline - Date.now();
    if (remainingMs < options.minAttemptMs) {
      break;
    }

    attemptedModels.push(modelName);
    unusable = false;

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      Math.min(options.perModelTimeoutMs, remainingMs)
    );

    let geminiResponse: Response;
    try {
      geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${options.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(options.payloadFor(modelName)),
          signal: controller.signal,
        }
      );
    } catch (fetchError) {
      lastStatus = 504;
      lastErrorMessage = fetchError instanceof Error ? fetchError.message : 'Request failed';
      continue;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!geminiResponse.ok) {
      lastStatus = geminiResponse.status;
      lastErrorMessage = await geminiResponse.text();

      const retryAfterMs = parseRetryAfterMs(geminiResponse);
      if (retryAfterMs !== null) {
        bestRetryAfterMs = Math.max(bestRetryAfterMs ?? 0, retryAfterMs);
      }

      if (geminiResponse.status === 429) {
        sawRateLimit = true;
        continue;
      }

      if (geminiResponse.status === 401 || geminiResponse.status === 403) {
        return { kind: 'auth', attemptedModels };
      }

      // Other 4xx (e.g. 404 for a retired model) and 5xx are model-specific: try next model
      continue;
    }

    let data: GeminiResponse;
    try {
      data = (await geminiResponse.json()) as GeminiResponse;
    } catch {
      lastStatus = 502;
      lastErrorMessage = 'Invalid JSON from model';
      continue;
    }

    if (data.error) {
      lastStatus = geminiResponse.status || 502;
      lastErrorMessage = data.error.message ?? 'Unknown model error';
      continue;
    }

    const firstCandidate = data.candidates?.[0];
    if (!firstCandidate) {
      lastStatus = geminiResponse.status || 502;
      lastErrorMessage = 'No candidates in response';
      continue;
    }

    if (firstCandidate.finishReason === 'SAFETY') {
      return { kind: 'safety', attemptedModels };
    }

    // Newer models may split the answer across several parts
    const text = (firstCandidate.content?.parts ?? [])
      .filter((part) => !part.thought && typeof part.text === 'string')
      .map((part) => part.text)
      .join('');

    const value = text.trim().length > 0 ? options.parse(text) : null;
    if (value === null) {
      lastStatus = geminiResponse.status || 502;
      lastErrorMessage = 'Unusable reply';
      unusable = true;
      continue;
    }

    return { kind: 'ok', value, attemptedModels };
  }

  if (sawRateLimit) {
    return { kind: 'rate_limited', retryAfterMs: bestRetryAfterMs, attemptedModels };
  }

  return { kind: 'failed', lastStatus, lastErrorMessage, unusable, attemptedModels };
}

const PRODUCTION_HOSTS: readonly string[] = ['gavrilov.ai', 'www.gavrilov.ai'];
const LOCAL_HOSTS: readonly string[] = ['localhost', '127.0.0.1'];

/**
 * The Cloudflare rate-limit rule only covers gavrilov.ai, so the AI endpoints refuse *.pages.dev
 * unless ALLOW_PAGES_DEV is "true" (set it only in the Pages Preview environment).
 */
export function isAllowedAiHost(requestUrl: string, allowPagesDev: boolean): boolean {
  let hostname: string;
  try {
    hostname = new URL(requestUrl).hostname;
  } catch {
    return false;
  }
  if (PRODUCTION_HOSTS.includes(hostname) || LOCAL_HOSTS.includes(hostname)) return true;
  return allowPagesDev && hostname.endsWith('.pages.dev');
}

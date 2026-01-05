/**
 * @fileoverview Cloudflare Pages Function for AI chat proxy.
 * @description Securely proxies requests to Google's Gemini API.
 * @author Michael Gavrilov
 * @version 1.0.0
 */

/// <reference types="@cloudflare/workers-types" />

// ============================================================================
// Type Definitions
// ============================================================================

/** Cloudflare Pages Function type */
type PagesFunction<E = unknown> = (
  context: EventContext<E, string, Record<string, unknown>>
) => Response | Promise<Response>;

interface Env {
  GEMINI_API_KEY: string;
}

interface ChatHistoryItem {
  role: 'user' | 'model';
  content: string;
}

interface ChatRequest {
  message: string;
  history?: ChatHistoryItem[];
}

interface GeminiContentPart {
  text?: string;
}

interface GeminiContent {
  parts?: GeminiContentPart[];
}

interface GeminiCandidate {
  content?: GeminiContent;
  finishReason?: string;
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
}

interface ApiSuccessResponse {
  reply: string;
  suggestions?: string[];
}

interface ApiErrorResponse {
  error: string;
  retryAfterMs?: number;
  attemptedModels?: string[];
}

type ApiResponse = ApiSuccessResponse | ApiErrorResponse;

// ============================================================================
// Constants
// ============================================================================

/** Maximum allowed message length (aligned with frontend) */
const MAX_MESSAGE_LENGTH = 500;

/** Maximum conversation history items to include */
const MAX_HISTORY_ITEMS = 10;

/** API request timeout in milliseconds */
const API_TIMEOUT_MS = 25000;

/** Ordered model fallback chain (first = primary) */
const MODEL_CHAIN: readonly string[] = [
  'gemini-3-flash',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemma-3-27b-it',
] as const;

/** Allowed production origins */
const ALLOWED_ORIGINS: readonly string[] = [
  'https://gavrilov.ai',
  'https://www.gavrilov.ai',
  'https://aboutme-portfolio.pages.dev',
] as const;

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Type guard to validate ChatRequest structure.
 * @param body - Unknown request body to validate
 * @returns True if body is a valid ChatRequest
 */
function isValidChatRequest(body: unknown): body is ChatRequest {
  if (typeof body !== 'object' || body === null) {
    return false;
  }

  const obj = body as Record<string, unknown>;

  // message is required and must be a string
  if (typeof obj.message !== 'string') {
    return false;
  }

  // history is optional, but if present must be an array
  if (obj.history !== undefined) {
    if (!Array.isArray(obj.history)) {
      return false;
    }

    // Validate each history item
    for (const item of obj.history) {
      if (typeof item !== 'object' || item === null) {
        return false;
      }
      const historyItem = item as Record<string, unknown>;
      if (
        (historyItem.role !== 'user' && historyItem.role !== 'model') ||
        typeof historyItem.content !== 'string'
      ) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Checks if origin is a valid localhost URL.
 * Uses strict prefix matching to prevent malicious-localhost.com attacks.
 * @param origin - Origin header value
 * @returns True if origin is localhost
 */
function isLocalhostOrigin(origin: string): boolean {
  return (
    origin.startsWith('http://localhost:') ||
    origin.startsWith('https://localhost:') ||
    origin === 'http://localhost' ||
    origin === 'https://localhost'
  );
}

/**
 * Sanitizes user input to prevent injection attacks.
 * @param input - Raw user input
 * @returns Sanitized input string
 */
function sanitizeInput(input: string): string {
  // Remove control characters (ASCII 0-8, 11, 12, 14-31, 127)
  // eslint-disable-next-line no-control-regex
  const controlCharsRegex = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;
  return input.trim().slice(0, MAX_MESSAGE_LENGTH).replace(controlCharsRegex, '');
}

// ============================================================================
// System Context
// ============================================================================

const SYSTEM_CONTEXT = `You are an AI assistant for Michael Gavrilov's professional portfolio website.
Answer questions about Michael based ONLY on the verified facts in this context.

Verified facts.
Michael Gavrilov is a Strategic Account Director at Microsoft in Healthcare and Life Sciences. He leads AI transformation for a strategic pharmaceutical customer, aligning Microsoft technologies to customer priorities.
He has 20+ years of experience in technology and enterprise sales and has been at Microsoft since 2006. He is based in New York City.

Industries.
Healthcare and Life Sciences, including pharma. He has also supported enterprise accounts across sectors such as transportation and manufacturing.

Operating model and portfolio breadth.
He leads cross-functional virtual teams and works across Azure, Microsoft 365 (including Copilot), and Security to drive targeted business outcomes.

Quantified outcomes.
He has architected complex, multi-year agreements totaling more than $250M in total contract value (TCV). In prior enterprise roles, he generated an average of about $20M annually. Earlier in his Microsoft career, he led partner programs that drove a 150% increase in partner-influenced revenue. In an IT operations leadership role, he delivered process improvements and automation that increased operational efficiency by 25%.

Awards and recognition.
He is a 2-time Microsoft Platinum Club recipient and a 2-time Gold Club Award recipient. He received a Champion Award in FY23 Q4 and achieved 100% attainment in FY25.

Education.
Master's degree in Management of Technology from NYU Tandon School of Engineering. Master's degree in Information Systems Engineering and Bachelor's degree in Computer Engineering from Bauman Moscow State Technical University.

Certifications and executive education.
Microsoft Certified: Azure Solutions Architect Expert. AWS Certified Cloud Practitioner. Selling to the C-Suite from Wharton Executive Education. Business Strategy and Financial Acumen from INSEAD Executive Education. Value Negotiation from INSEAD Executive Education.

Contact methods.
LinkedIn is linkedin.com/in/mgavrilov. Email is contact@gavrilov.ai. Resume is available at /CV/Michael-Gavrilov-Resume.pdf.

Response rules.
Write in plain text only. Do not use markdown, headings, bullets, or code formatting. Keep responses concise and professional, under 150 words unless more detail is requested. Only answer questions related to Michael's professional background. If asked about something not in the verified facts, say you do not have that information and offer the LinkedIn or email contact option.

Style guidance (not facts).
Use strategic, outcome-oriented phrasing. When helpful, connect technology work to targeted business outcomes, adoption, and governance or security alignment. Avoid internal Microsoft leveling terms such as IC4 or IC6.`;

// ============================================================================
// Follow-up Suggestion Generator
// ============================================================================

/**
 * Generates contextual follow-up questions based on the response.
 * Returns 2-3 relevant questions to keep the conversation going.
 */
function generateFollowUpSuggestions(
  userMessage: string,
  aiResponse: string,
  history: ChatHistoryItem[]
): string[] {
  const messageLower = userMessage.toLowerCase();
  const responseLower = aiResponse.toLowerCase();
  const historyTopics = history.map((h) => h.content.toLowerCase()).join(' ');

  // Track what's already been discussed to avoid repetition
  const discussed = {
    experience: historyTopics.includes('experience') || historyTopics.includes('career'),
    education: historyTopics.includes('education') || historyTopics.includes('degree'),
    achievements: historyTopics.includes('achievement') || historyTopics.includes('award'),
    skills: historyTopics.includes('skill') || historyTopics.includes('technical'),
    contact: historyTopics.includes('contact') || historyTopics.includes('linkedin'),
  };

  const suggestions: string[] = [];

  // Context-aware suggestions based on what was just discussed
  if (responseLower.includes('microsoft') || messageLower.includes('role')) {
    if (!discussed.achievements) suggestions.push('What awards has he won?');
    if (!discussed.skills) suggestions.push('What are his key skills?');
  }

  if (responseLower.includes('award') || responseLower.includes('platinum')) {
    if (!discussed.experience) suggestions.push('Tell me about his career journey');
    suggestions.push('What deals did he close?');
  }

  if (responseLower.includes('education') || responseLower.includes('degree')) {
    if (!discussed.skills) suggestions.push('Is he technical?');
    suggestions.push('What certifications does he have?');
  }

  if (responseLower.includes('technical') || responseLower.includes('azure')) {
    suggestions.push('What industries has he worked in?');
    if (!discussed.education) suggestions.push('Where did he study?');
  }

  if (responseLower.includes('healthcare') || responseLower.includes('pharma')) {
    suggestions.push('What AI solutions does he specialize in?');
    suggestions.push('How long has he been at Microsoft?');
  }

  // Default suggestions if none matched
  if (suggestions.length === 0) {
    if (!discussed.experience) suggestions.push("What's his experience?");
    if (!discussed.achievements) suggestions.push('Key achievements?');
    if (!discussed.contact) suggestions.push('How can I contact him?');
  }

  // Return 2-3 unique suggestions, prioritizing less-discussed topics
  return [...new Set(suggestions)].slice(0, 3);
}

// ============================================================================
// Response Helpers
// ============================================================================

/**
 * Creates a JSON response with consistent headers.
 * @param data - Response data object
 * @param status - HTTP status code
 * @param origin - Request origin for CORS
 * @returns Response object
 */
function jsonResponse(data: ApiResponse, status: number, origin: string): Response {
  const isAllowedOrigin = ALLOWED_ORIGINS.includes(origin) || isLocalhostOrigin(origin);
  const corsOrigin = isAllowedOrigin ? origin : (ALLOWED_ORIGINS[0] ?? '');

  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': corsOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'no-store',
    },
  });
}

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

// ============================================================================
// Main Handler
// ============================================================================

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const origin = context.request.headers.get('Origin') ?? '';

  try {
    // Parse and validate request body
    let body: unknown;
    try {
      body = await context.request.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON in request body' }, 400, origin);
    }

    if (!isValidChatRequest(body)) {
      return jsonResponse(
        { error: 'Invalid request format. Expected { message: string, history?: Array }' },
        400,
        origin
      );
    }

    const { message, history = [] } = body;

    // Validate message
    const sanitizedMessage = sanitizeInput(message);
    if (sanitizedMessage.length === 0) {
      return jsonResponse({ error: 'Message cannot be empty' }, 400, origin);
    }

    // Get API key from environment
    const apiKey = context.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY not configured');
      return jsonResponse({ error: 'AI service not configured' }, 503, origin);
    }

    // Build conversation with system context
    // Limit history to prevent context overflow
    const recentHistory = history.slice(-MAX_HISTORY_ITEMS);

    const contents = [
      // System context as first user message
      { role: 'user', parts: [{ text: SYSTEM_CONTEXT }] },
      // Model acknowledgment
      {
        role: 'model',
        parts: [
          {
            text: 'I understand. I will answer questions about Michael Gavrilov based only on the professional information provided, being concise and helpful.',
          },
        ],
      },
      // Previous conversation history
      ...recentHistory.map((msg) => ({
        role: msg.role,
        parts: [{ text: sanitizeInput(msg.content) }],
      })),
      // Current user message
      { role: 'user', parts: [{ text: sanitizedMessage }] },
    ];

    // Shared request payload
    const requestPayload = {
      contents,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 500,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      ],
    } as const;

    const attemptedModels: string[] = [];
    let lastStatus: number | null = null;
    let lastErrorMessage: string | null = null;
    let sawRateLimit = false;
    let bestRetryAfterMs: number | null = null;

    for (const modelName of MODEL_CHAIN) {
      attemptedModels.push(modelName);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

      let geminiResponse: globalThis.Response;
      try {
        geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestPayload),
            signal: controller.signal,
          }
        );
      } catch (fetchError) {
        clearTimeout(timeoutId);
        lastStatus = 504;
        lastErrorMessage = fetchError instanceof Error ? fetchError.message : 'Request failed';
        // Timeout or network error: try next model
        continue;
      } finally {
        clearTimeout(timeoutId);
      }

      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text();
        lastStatus = geminiResponse.status;
        lastErrorMessage = errorText;

        const retryAfterMs = parseRetryAfterMs(geminiResponse);
        if (retryAfterMs !== null) {
          bestRetryAfterMs = Math.max(bestRetryAfterMs ?? 0, retryAfterMs);
        }

        if (geminiResponse.status === 429) {
          sawRateLimit = true;
          // Try next model with remaining quota
          continue;
        }

        if (geminiResponse.status === 401 || geminiResponse.status === 403) {
          console.error('Gemini API authentication error');
          return jsonResponse({ error: 'AI service authentication error' }, 503, origin);
        }

        // Retry with next model on 5xx; otherwise stop
        if (geminiResponse.status >= 500) {
          continue;
        }

        return jsonResponse({ error: 'AI service temporarily unavailable' }, 502, origin);
      }

      let data: GeminiResponse;
      try {
        data = (await geminiResponse.json()) as GeminiResponse;
      } catch {
        lastStatus = 502;
        lastErrorMessage = 'Invalid JSON from model';
        // Try next model
        continue;
      }

      if (data.error) {
        lastStatus = geminiResponse.status || 502;
        lastErrorMessage = data.error.message ?? 'Unknown model error';
        // Try next model
        continue;
      }

      const candidates = data.candidates;
      if (!candidates || candidates.length === 0) {
        lastStatus = geminiResponse.status || 502;
        lastErrorMessage = 'No candidates in response';
        continue;
      }

      const firstCandidate = candidates[0];
      if (!firstCandidate) {
        lastStatus = geminiResponse.status || 502;
        lastErrorMessage = 'Empty candidate';
        continue;
      }

      if (firstCandidate.finishReason === 'SAFETY') {
        return jsonResponse(
          {
            reply:
              "I'm sorry, but I can't respond to that type of question. Please ask about Michael's professional background.",
          },
          200,
          origin
        );
      }

      const parts = firstCandidate.content?.parts;
      if (!parts || parts.length === 0) {
        lastStatus = geminiResponse.status || 502;
        lastErrorMessage = 'No content parts';
        continue;
      }

      const reply = parts[0]?.text;
      if (!reply || reply.trim().length === 0) {
        lastStatus = geminiResponse.status || 502;
        lastErrorMessage = 'Empty text in AI response';
        continue;
      }

      const suggestions = generateFollowUpSuggestions(sanitizedMessage, reply, recentHistory);
      return jsonResponse({ reply: reply.trim(), suggestions }, 200, origin);
    }

    if (sawRateLimit) {
      return jsonResponse(
        {
          error: 'Too many requests. Please wait a moment and try again.',
          retryAfterMs: bestRetryAfterMs ?? undefined,
          attemptedModels,
        },
        429,
        origin
      );
    }

    console.error('Gemini API fallback exhausted', {
      lastStatus,
      lastErrorMessage,
      attemptedModels,
    });
    const statusCode = lastStatus === 504 ? 504 : 502;
    const errorMessage =
      statusCode === 504
        ? 'Request timed out. Please try again.'
        : 'AI service temporarily unavailable';

    return jsonResponse({ error: errorMessage, attemptedModels }, statusCode, origin);
  } catch (error) {
    console.error('Chat API error:', error);
    return jsonResponse({ error: 'An unexpected error occurred. Please try again.' }, 500, origin);
  }
};

/**
 * Handle CORS preflight requests.
 */
export const onRequestOptions: PagesFunction<Env> = async (context) => {
  const origin = context.request.headers.get('Origin') ?? '';
  const isAllowedOrigin = ALLOWED_ORIGINS.includes(origin) || isLocalhostOrigin(origin);
  const corsOrigin = isAllowedOrigin ? origin : (ALLOWED_ORIGINS[0] ?? '');

  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': corsOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
};

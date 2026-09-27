/**
 * @fileoverview Cloudflare Pages Function for AI chat proxy.
 * @description Securely proxies requests to Google's Gemini API.
 * @author Michael Gavrilov
 * @version 1.0.0
 */

/// <reference types="@cloudflare/workers-types" />

import { MAX_CHAT_MESSAGE_LENGTH as MAX_MESSAGE_LENGTH } from '../../utils/chatLimits';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Simplified PagesFunction type for this endpoint.
 * While @cloudflare/workers-types provides PagesFunction, we define a simpler
 * version here for clarity and to avoid complex generic parameters.
 */
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
  /** True for thinking-model reasoning parts, which must not be shown */
  thought?: boolean;
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

/** Maximum conversation history items to include */
const MAX_HISTORY_ITEMS = 10;

/** Timeout for a single model attempt in milliseconds */
const PER_MODEL_TIMEOUT_MS = 12000;

/** Total time budget across all model attempts; must stay below the client timeout in hooks/useChat.ts */
const TOTAL_BUDGET_MS = 25000;

/** Skip remaining models when less than this much budget is left */
const MIN_ATTEMPT_MS = 3000;

/**
 * Ordered model fallback chain (first = primary). Free-tier daily limits (Sept 2026):
 * 3.8 Flash 20/day, 3.5 & 3.1 Flash-Lite 500/day each, Gemma 4 26B 14,400/day.
 */
const MODEL_CHAIN: readonly string[] = [
  'gemini-3.8-flash', // Primary: best quality
  'gemini-3.5-flash-lite', // Fallback: fast, high free quota
  'gemini-3.1-flash-lite', // Fallback: separate high free quota
  'gemma-4-26b-a4b-it', // Fallback: open model, largest free quota
] as const;

/** Thinking tokens count toward maxOutputTokens; short factual answers only need low. */
const THINKING_LEVEL: Readonly<Record<string, string>> = {
  'gemini-3.8-flash': 'low',
};

/** Allowed production origins */
const ALLOWED_ORIGINS: readonly string[] = [
  'https://gavrilov.ai',
  'https://www.gavrilov.ai',
  'https://my-portfolio-bu2.pages.dev',
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
Michael Gavrilov is a Strategic Account Director at Microsoft in Healthcare and Life Sciences. He owns C-suite relationships and the multi-year technology and AI strategy for a top-5 global pharmaceutical company, one of Microsoft's strategic Healthcare and Life Sciences accounts. Do not name the customer.
He has 20+ years of experience in technology and enterprise sales and has been at Microsoft since 2006. He is based in New York City.

Industries.
Healthcare and Life Sciences, including pharma. He has also supported enterprise accounts across sectors such as transportation and manufacturing.

Career path: engineer, architect, strategist, strategic account leader.
He started his career building and operating technology, then became an architect, a strategist, and eventually a strategic account leader. His mindset never changed: understand the problem, challenge assumptions, bring the right people together, and make the solution work. Today, the systems are bigger.
IT Operations Manager and Team Lead at Allied Testing (Apr 2002 to July 2005): led a team of 8 systems engineers responsible for enterprise IT operations across physical and virtual environments.
IT Solutions Architect at Systematica Group (July 2005 to Oct 2006): led architecture and technical strategy for complex enterprise IT solutions in pre-sales engagements, translating business requirements into solution architectures.
Partner Technology Strategist at Microsoft (Oct 2006 to July 2008): built go-to-market strategies with systems integrators and ISV partners and enabled partner technical teams. Then Account Technology Strategist (July 2008 to Mar 2011): trusted advisor to CIOs across multinational enterprise accounts, building multi-year technology roadmaps and driving adoption and value-realization programs.
Senior Account Executive, Enterprise Accounts at Microsoft (Apr 2011 to Jan 2017): owned executive relationships, account strategy and commercial execution for multinational enterprise customers across multiple industries; led complex enterprise agreement renewals and expansions spanning Office 365, Azure, Dynamics and Microsoft cloud services; orchestrated sales, technical, services and partner teams around customer priorities, technology adoption and long-term account growth; recognized with Microsoft Gold Club and 100% attainment. Then Strategic Account Director, Healthcare and Life Sciences (Jan 2017 to present).

How he thinks.
Go deep: understand the technology well enough to challenge assumptions. Zoom out: find the business problem behind the technology conversation. Connect the room: create alignment across people with different priorities and incentives. Make it real: turn strategy into commitments, execution, and measurable outcomes.
His motto: go deep enough to understand the technology, go high enough to understand the business, and stay close enough to make it happen.
On enterprise AI, he pairs technical depth with business focus, and challenges legacy assumptions with data-driven, security-aware recommendations so adoption can accelerate without increasing risk.

What he has built.
QuantumInvestor.net is his personal, public experiment testing whether AI can improve investment research and decision-making, with weekly picks, documented performance and transparent results, no paywalls. It is not financial advice.
He also designed, built and open-sourced this portfolio website (github.com/mig1980/My-Portfolio).
Earlier in his career he built and ran IT systems and led engineering teams, and he holds degrees in Computer Engineering and Information Systems Engineering.

Operating model and portfolio breadth.
He scales generative and agentic AI from experimentation to enterprise deployment, navigating the technical, governance, and organizational complexity of regulated environments. He leads a 30+ person virtual team spanning specialist sales, engineering, customer success, support, services and global system integrator partners. He establishes executive governance and quarterly business reviews with CIO, CDO and business leadership, aligning Microsoft roadmaps with priorities across R&D, manufacturing and commercial functions. He leads complex, multi-stakeholder negotiations, balancing customer outcomes, transformation investments, risk and long-term partnership economics.

Quantified outcomes.
He structures strategic agreements exceeding $500M in total contract value, expanding the partnership across AI, Azure, Data, Security, Modern Work and Business Applications. In prior enterprise roles, he delivered average annual revenue exceeding $20M. Earlier in his Microsoft career, he led partner programs that drove a 150% increase in partner-influenced revenue. In an IT operations leadership role, he delivered process improvements and automation that increased operational efficiency by 25%.

Awards and recognition.
He is a 2-time Microsoft Platinum Club recipient and a 3-time Gold Club Award recipient. He received a Champion Award in FY23 Q4. He has achieved consistent quota attainment across multiple fiscal years. Do not state a specific number of attainment awards.

Education.
Master's degree in Management of Technology from NYU Tandon School of Engineering. Master's degree in Information Systems Engineering and Bachelor's degree in Computer Engineering from Bauman State Technical University.

Certifications and executive education.
Microsoft Certified: Azure Solutions Architect Expert. AWS Certified Cloud Practitioner. Selling to the C-Suite from Wharton Executive Education. Business Strategy and Financial Acumen from INSEAD Executive Education. Value Negotiation from INSEAD Executive Education.

Contact methods.
LinkedIn is linkedin.com/in/mgavrilov. Email is contact@gavrilov.ai. Resume is available at /CV/Michael-Gavrilov-Resume.pdf.

Response rules.
Write in plain text only. Do not use markdown, headings, bullets, or code formatting. Keep responses concise and professional. Aim for 100-200 words, but always complete your thoughts and lists fully rather than cutting off mid-sentence. Only answer questions related to Michael's professional background. If asked about something not in the verified facts, say you do not have that information and offer the LinkedIn or email contact option.

Style guidance.
Sound like a technical builder who became a strategic enterprise account leader: concise, confident, plain language. Avoid corporate buzzwords and sales clichés. When helpful, connect technology work to business results, adoption, and security. Avoid internal Microsoft leveling terms such as IC4 or IC6.`;

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
    if (!discussed.achievements) suggestions.push('What awards has Michael won?');
    if (!discussed.skills) suggestions.push('How does Michael approach complex problems?');
  }

  if (responseLower.includes('award') || responseLower.includes('platinum')) {
    if (!discussed.experience)
      suggestions.push('How did Michael move from engineer to strategic account leader?');
    suggestions.push('How has Michael led strategic enterprise relationships?');
  }

  if (responseLower.includes('education') || responseLower.includes('degree')) {
    if (!discussed.skills) suggestions.push('What has Michael built?');
    suggestions.push('What certifications does Michael have?');
  }

  if (responseLower.includes('technical') || responseLower.includes('azure')) {
    suggestions.push('What industries has Michael worked in?');
    if (!discussed.education) suggestions.push('Where did Michael study?');
  }

  if (responseLower.includes('healthcare') || responseLower.includes('pharma')) {
    suggestions.push("What's Michael's philosophy on enterprise AI?");
    suggestions.push('How long has Michael been at Microsoft?');
  }

  // Default suggestions if none matched
  if (suggestions.length === 0) {
    if (!discussed.experience)
      suggestions.push('How did Michael move from engineer to strategic account leader?');
    if (!discussed.achievements) suggestions.push('What awards has Michael won?');
    if (!discussed.contact) suggestions.push('How can I contact Michael?');
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
        maxOutputTokens: 2048,
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
    const deadline = Date.now() + TOTAL_BUDGET_MS;

    for (const modelName of MODEL_CHAIN) {
      const remainingMs = deadline - Date.now();
      if (remainingMs < MIN_ATTEMPT_MS) {
        break;
      }

      attemptedModels.push(modelName);

      const thinkingLevel = THINKING_LEVEL[modelName];
      const modelPayload = thinkingLevel
        ? {
            ...requestPayload,
            generationConfig: {
              ...requestPayload.generationConfig,
              thinkingConfig: { thinkingLevel },
            },
          }
        : requestPayload;

      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        Math.min(PER_MODEL_TIMEOUT_MS, remainingMs)
      );

      let geminiResponse: globalThis.Response;
      try {
        geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(modelPayload),
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

        // Other 4xx (e.g. 404 for a retired model) and 5xx are model-specific: try next model
        continue;
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

      // Newer models may split the answer across several parts
      const reply = parts
        .filter((part) => !part.thought && typeof part.text === 'string')
        .map((part) => part.text)
        .join('');
      if (reply.trim().length === 0) {
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

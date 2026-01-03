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
Answer questions about Michael based ONLY on the following verified information.

================================================================================
PROFESSIONAL SUMMARY
================================================================================

- **Current Role**: Strategic Account Director at Microsoft, Healthcare & Life Sciences
- **Experience**: 20+ years in technology and enterprise sales
- **Location**: New York City
- **Specialization**: AI transformation, complex deal closure, C-suite partnerships

================================================================================
CAREER HISTORY
================================================================================

## Microsoft (2006-Present)

1. **Strategic Account Director | Healthcare & Life Sciences** (Jan 2017 - Present)
   - Lead AI transformation for strategic pharmaceutical customers
   - Navigate complex, multi-stakeholder negotiations with C-suite executives
   - Architect novel deal structures totaling $250M+ TCV
   - Build and sustain trusted executive relationships across global accounts

2. **Senior Account Executive | Enterprise Accounts** (Apr 2011 - Jan 2017)
   - Managed robust sales pipelines across Sales, Engineering, and Delivery
   - Consistently exceeded revenue targets (~$20M annually)
   - Covered Pharma, Transportation, and Manufacturing sectors

3. **Account Technology Strategist** (July 2008 - Mar 2011)
   - Advised senior executives on AI-driven technology strategies
   - Drove adoption strategies ensuring sustained momentum and value

4. **Partner Technology Strategist** (Oct 2006 - July 2008)
   - Structured platform partnerships and joint go-to-market strategies
   - Led programs resulting in 150% increase in partner-influenced revenue

## Previous Experience
- **IT Solutions Architect** at Systematica Group (2005-2006)
- **IT Operations Manager** at Allied Testing (2002-2005)

================================================================================
RECOGNITION & AWARDS
================================================================================

- 🏆 **2x Microsoft Platinum Club** - Top performers worldwide
- 🥇 **2x Gold Club Award** - Outstanding contribution to revenue growth
- 🏅 **Champion Award FY23 Q4** - Transformational deals recognition
- ✅ **100% Attainment FY25** - Full quota achievement

================================================================================
EDUCATION
================================================================================

- **Master's, Management of Technology** - NYU Tandon School of Engineering
- **Master's, Information Systems Engineering** - Bauman Moscow State Technical University
- **Bachelor's, Computer Engineering** - Bauman Moscow State Technical University

================================================================================
CERTIFICATIONS
================================================================================

- Microsoft Certified: Azure Solutions Architect Expert
- AWS Certified Cloud Practitioner
- Wharton Executive Education: Selling to the C-Suite
- INSEAD Executive Education: Business Strategy & Financial Acumen
- INSEAD Executive Education: Value Negotiation

================================================================================
CORE COMPETENCIES
================================================================================

**Strategic Leadership**: Complex Deal Closure ($250M+ TCV), C-Suite Partnerships, AI-First Strategy
**AI & Cloud**: Generative AI Strategy, Azure, Copilot Enablement, Solutions Architecture
**Sales**: Value Negotiation, Strategic Account Planning, Go-to-Market Strategy
**Partnerships**: Transformational Partnerships, Novel Deal Structures, Platform Economics

================================================================================
PERSONAL INTERESTS
================================================================================

Continuous Learning, Investing, Swimming, Boxing, Snowboarding, Horseback Riding, Golfing

================================================================================
CONTACT INFORMATION
================================================================================

- **LinkedIn**: linkedin.com/in/mgavrilov
- **Email**: contact@gavrilov.ai
- **Resume**: Available on the website at /CV/Michael-Gavrilov-Resume.pdf

================================================================================
RESPONSE GUIDELINES
================================================================================

1. Be concise, professional, and helpful
2. Only answer questions related to Michael's professional background
3. If asked about something not in the context, politely redirect
4. Do NOT make up information not provided above
5. For detailed inquiries, suggest connecting via LinkedIn or email
6. Keep responses under 150 words unless more detail is requested
7. Use plain text only - NO markdown formatting (no **, *, #, or bullet symbols)
8. For lists, use simple dashes (-) or numbered lists (1. 2. 3.)
9. Write in a natural, conversational tone

================================================================================
PERSONALITY & TONE
================================================================================

You are friendly, approachable, and enthusiastic about Michael's work. Think of yourself 
as a knowledgeable colleague who genuinely wants to help visitors learn about Michael.

- Be warm but professional - like a helpful recruiter or colleague
- Show genuine enthusiasm when discussing achievements
- Use conversational language, not corporate jargon
- Be humble when redirecting off-topic questions
- Add brief context to make answers more engaging
- Vary your sentence structure to sound natural

================================================================================
EXAMPLE CONVERSATIONS (Follow this style)
================================================================================

Q: "What does Michael do?"
A: "Michael is a Strategic Account Director at Microsoft, where he leads AI transformation initiatives for major pharmaceutical companies. He's been with Microsoft since 2006 and has built an impressive track record - including architecting deals worth over $250 million. His sweet spot is helping healthcare and life sciences companies adopt cutting-edge AI solutions."

Q: "Is he technical?"
A: "Absolutely! Michael has deep technical roots. He started his career as an IT Solutions Architect and holds certifications like Azure Solutions Architect Expert and AWS Cloud Practitioner. What makes him unique is that he bridges the gap between technical teams and C-suite executives - he can speak both languages fluently."

Q: "What are his biggest achievements?"
A: "Michael has some standout accomplishments! He's a 2-time Microsoft Platinum Club member, which puts him in the top tier of performers globally. He's also achieved 100% quota attainment in FY25 and won the Champion Award for transformational deals. Perhaps most impressively, he's architected deals totaling over $250 million in total contract value."

Q: "Where did he go to school?"
A: "Michael has a strong educational foundation. He earned his Master's in Management of Technology from NYU Tandon School of Engineering, plus two degrees from Bauman Moscow State Technical University - a Master's in Information Systems Engineering and a Bachelor's in Computer Engineering. He's also invested in executive education at Wharton and INSEAD."

Q: "Can you help me with my homework?"
A: "Ha! I appreciate the creativity, but I'm specifically here to chat about Michael's professional background. If you have questions about his experience, skills, or career journey, I'd love to help with those instead!"

Q: "What's Michael's salary?"
A: "That's not something I have information about - and honestly, it wouldn't be appropriate for me to share even if I did! But if you're curious about his professional accomplishments or career trajectory, I'm happy to tell you more about those."

================================================================================
CONVERSATION CONTEXT AWARENESS
================================================================================

When there is conversation history, acknowledge it naturally:
- Reference previous topics when relevant (e.g., "Building on what we discussed about his Microsoft role...")
- Avoid repeating information already shared unless explicitly asked
- Use phrases like "As I mentioned...", "Going deeper into...", "Related to your earlier question..."
- Connect new information to previously discussed topics when possible

================================================================================
INTENT DETECTION - SPECIAL ROUTING
================================================================================

For these intents, provide helpful direct links:

CONTACT REQUESTS (e.g., "How can I contact Michael?", "I want to reach out"):
- LinkedIn: linkedin.com/in/mgavrilov
- Email: contact@gavrilov.ai
- Encourage professional networking

RESUME REQUESTS (e.g., "Can I see his resume?", "Where's his CV?"):
- Direct to: /CV/Michael-Gavrilov-Resume.pdf (downloadable on the website)
- Mention it contains full career details

JOB OPPORTUNITY DISCUSSIONS:
- Encourage reaching out via LinkedIn or email
- Mention he's always open to interesting conversations`;

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

    // Call Gemini API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    let geminiResponse: globalThis.Response;
    try {
      geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
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
          }),
          signal: controller.signal,
        }
      );
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return jsonResponse({ error: 'Request timed out. Please try again.' }, 504, origin);
      }
      throw fetchError;
    } finally {
      clearTimeout(timeoutId);
    }

    // Handle non-OK responses
    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', geminiResponse.status, errorText);

      // Handle specific error codes
      if (geminiResponse.status === 429) {
        return jsonResponse(
          { error: 'Too many requests. Please wait a moment and try again.' },
          429,
          origin
        );
      }

      if (geminiResponse.status === 401 || geminiResponse.status === 403) {
        console.error('Gemini API authentication error');
        return jsonResponse({ error: 'AI service authentication error' }, 503, origin);
      }

      return jsonResponse({ error: 'AI service temporarily unavailable' }, 502, origin);
    }

    // Parse Gemini response
    let data: GeminiResponse;
    try {
      data = (await geminiResponse.json()) as GeminiResponse;
    } catch {
      console.error('Failed to parse Gemini response as JSON');
      return jsonResponse({ error: 'Invalid response from AI service' }, 502, origin);
    }

    // Check for API-level errors
    if (data.error) {
      console.error('Gemini API returned error:', data.error);
      return jsonResponse(
        { error: 'AI service error: ' + (data.error.message ?? 'Unknown') },
        502,
        origin
      );
    }

    // Extract response text with proper null checking
    const candidates = data.candidates;
    if (!candidates || candidates.length === 0) {
      console.error('No candidates in Gemini response:', JSON.stringify(data));
      return jsonResponse(
        { error: 'I could not generate a response. Please try rephrasing your question.' },
        200,
        origin
      );
    }

    const firstCandidate = candidates[0];
    if (!firstCandidate) {
      return jsonResponse({ error: 'Empty response from AI. Please try again.' }, 200, origin);
    }

    // Check if response was blocked by safety filters
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
      return jsonResponse({ error: 'No content in AI response. Please try again.' }, 200, origin);
    }

    const reply = parts[0]?.text;
    if (!reply || reply.trim().length === 0) {
      return jsonResponse({ error: 'Empty text in AI response. Please try again.' }, 200, origin);
    }

    // Generate follow-up suggestions based on conversation context
    const suggestions = generateFollowUpSuggestions(sanitizedMessage, reply, recentHistory);

    return jsonResponse({ reply: reply.trim(), suggestions }, 200, origin);
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

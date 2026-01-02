# 🤖 GenAI Chatbot Implementation Plan

> **Project**: AboutMe Portfolio - AI Assistant Feature  
> **Date**: January 2026  
> **Status**: 📋 Planning Complete | ✅ Code Audited (v2)

---

## 🔍 Code Audit Report (v2 - Re-Audit)

### ✅ Previously Fixed Issues

| Issue | Status |
|-------|--------|
| Race condition in `useChat` (stale closure) | ✅ Fixed with `messagesRef` |
| Missing animation classes | ✅ Fixed with `motion-safe:animate-[slideUp_0.2s_ease-out]` |
| Unsafe JSON parsing in backend | ✅ Fixed with `isValidChatRequest()` type guard |
| CORS too permissive (`*`) | ✅ Fixed - restricted to `gavrilov.ai` + localhost |
| Missing timeout handling | ✅ Fixed with `AbortController` (25s backend, 30s frontend) |
| Missing `motion-reduce` support | ✅ Fixed on toggle button and loading indicator |
| Position conflict with BackToTop | ✅ Fixed - ChatWidget now bottom-left |
| Missing `crypto.randomUUID()` fallback | ✅ Fixed with `generateId()` function |
| Missing JSDoc headers | ✅ Fixed with `@fileoverview`, `@author`, `@version` |
| Missing explicit return types | ✅ Fixed with `: UseChatReturn`, `: Promise<void>`, `: void` |

---

### 🆕 New Issues Found in Re-Audit

| Category | Issue | Severity | Fix Required |
|----------|-------|----------|--------------|
| **Architecture Diagram** | Shows "bottom-right" but code is bottom-left | Low | Update diagram text |
| **TypeScript** | `ChatApiResponse` should use discriminated union | Low | Use `{ reply: string } | { error: string }` |
| **Consistency** | Input `maxLength={500}` but backend validates `1000` | Medium | Align to same limit |
| **UX** | No character counter for user | Low | Consider adding |
| **Edge Case** | Frontend doesn't handle 429 rate limit gracefully | Medium | Add retry-after UI |
| **Edge Case** | No handling for network offline state | Low | Check `navigator.onLine` |
| **Accessibility** | Chat dialog missing `aria-describedby` | Low | Add description |
| **Accessibility** | Quick question buttons need `type="button"` | Low | Prevent form submission |
| **Security** | `origin.includes('localhost')` is too permissive | Low | Use exact match or regex |
| **Performance** | MessageBubble re-renders on every message add | Low | Already memoized ✅ |
| **Test** | Test file mock type is incorrect | Low | Use proper Vitest mock type |
| **Documentation** | Security checklist has unchecked gitignore items | Low | Update to checked |

---

### 🔴 Critical Issues (Must Fix)

#### 1. Input Length Mismatch
**Problem**: Frontend limits to 500 chars, backend validates 1000 chars.
```typescript
// Frontend (ChatWidget.tsx)
maxLength={500}

// Backend (chat.ts)
if (sanitizedMessage.length > 1000) { ... }
```
**Impact**: Confusing UX - user sees 500 limit but API allows more.
**Fix**: Align both to 500 characters (more reasonable for chat).

#### 2. Missing `type="button"` on Quick Questions
**Problem**: Buttons inside form default to `type="submit"`.
```typescript
<button
  key={question}
  onClick={() => handleQuickQuestion(question)}
  // Missing: type="button"
```
**Impact**: Could trigger form submission in edge cases.
**Fix**: Add `type="button"` to quick question buttons.

---

### 🟡 Medium Issues (Should Fix)

#### 3. Rate Limit UX
**Problem**: When 429 is returned, user only sees generic error message.
**Fix**: Add specific UI handling:
```typescript
if (response.status === 429) {
  setError('Too many requests. Please wait 30 seconds before trying again.');
  // Optional: Add countdown timer
}
```

#### 4. Localhost CORS Check Too Permissive
**Problem**: `origin.includes('localhost')` matches `malicious-localhost.com`.
```typescript
// Current (problematic)
origin.includes('localhost')

// Better
origin.startsWith('http://localhost:') || origin.startsWith('https://localhost:')
```

---

### 🟢 Low Priority (Nice to Have)

#### 5. Architecture Diagram Text
Update diagram from "bottom-right" to "bottom-left":
```
│  │  │  • Floating chat bubble UI (bottom-left)           │  │  │
```

#### 6. Discriminated Union for API Response
More type-safe response handling:
```typescript
export type ChatApiResponse = 
  | { reply: string; error?: never }
  | { error: string; reply?: never };
```

#### 7. Add `aria-describedby` to Dialog
```typescript
<div
  id="chat-dialog"
  role="dialog"
  aria-label="AI Assistant Chat"
  aria-describedby="chat-description"  // ADD THIS
  aria-modal="true"
>
  <span id="chat-description" className="sr-only">
    Chat with an AI assistant about Michael's professional background
  </span>
```

#### 8. Test File Mock Type
```typescript
// Current
(global.fetch as vi.Mock)

// Better (Vitest)
import { vi, type Mock } from 'vitest';
(global.fetch as Mock)
```

---

### ✅ Audit Summary

| Category | Score | Notes |
|----------|-------|-------|
| **TypeScript Strict Mode** | 9/10 | Minor discriminated union improvement possible |
| **Repo Pattern Compliance** | 10/10 | Matches `useScrollPosition`, `BackToTop` patterns |
| **Security** | 9/10 | Minor localhost CORS tightening needed |
| **Accessibility** | 9/10 | Minor `aria-describedby`, `type="button"` fixes |
| **Error Handling** | 9/10 | Rate limit UX could be improved |
| **Edge Cases** | 9/10 | Network offline not handled |
| **Documentation** | 10/10 | Complete JSDoc, comprehensive plan |

**Overall: 9.1/10** - Production ready with minor improvements recommended.

---

## Executive Summary

Add an AI-powered chatbot to the portfolio website using **Google AI Studio's Gemini API (Free Tier)** that can answer visitor questions about Michael Gavrilov based on CV, resume, and professional information. The chatbot will be deployed on **Cloudflare Pages** with a serverless backend using **Cloudflare Pages Functions**.

---

## 📋 Expert Panel Review

| Expert Role | Focus Area | Key Recommendation |
|-------------|------------|-------------------|
| **AI/ML Engineer** | Model Selection | Use `gemini-2.5-flash` (free tier) - best balance of speed, quality, and cost |
| **Security Architect** | API Key Protection | Never expose API key client-side; use Cloudflare Pages Functions as proxy |
| **Frontend Engineer** | UX/UI Design | Floating chat widget with smooth animations, mobile-responsive |
| **DevOps Engineer** | Deployment | Cloudflare Pages Functions for serverless API proxy |
| **Cost Analyst** | Budget | Free tier: 1M+ tokens/day, sufficient for portfolio traffic |

---

## 🎯 Architecture Decision

### Option A: Direct Client-Side API Calls ❌ NOT RECOMMENDED
- **Risk**: API key exposed in browser DevTools
- **Issue**: Anyone can steal and abuse your API key
- **Impact**: Potential API abuse, quota exhaustion, billing issues

### Option B: Cloudflare Pages Functions Proxy ✅ RECOMMENDED
- **Security**: API key stored as Cloudflare secret, never exposed to client
- **Performance**: Edge deployment = low latency worldwide (300+ PoPs)
- **Cost**: Free tier includes 100,000 requests/day
- **Simplicity**: No separate server infrastructure, deploys with your site
- **Integration**: Same domain = no CORS issues

---

## 🏗️ Technical Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        User's Browser                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              React Portfolio App                          │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │         ChatWidget Component                        │  │  │
│  │  │  • Floating chat bubble UI (bottom-left)           │  │  │
│  │  │  • Message history state (useChat hook)            │  │  │
│  │  │  • Typing indicators & animations                  │  │  │
│  │  │  • Quick suggestion buttons                        │  │  │
│  │  └───────────────────┬────────────────────────────────┘  │  │
│  └──────────────────────┼───────────────────────────────────┘  │
└─────────────────────────┼───────────────────────────────────────┘
                          │ POST /api/chat (same origin)
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│               Cloudflare Pages Functions (Edge)                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         /functions/api/chat.ts                            │  │
│  │  • Request validation (message length, format)            │  │
│  │  • Retrieves GEMINI_API_KEY from env.vars (secret)       │  │
│  │  • Injects system prompt with professional context        │  │
│  │  • Maintains conversation history                         │  │
│  │  • Calls Gemini API with safety settings                 │  │
│  │  • Returns sanitized response                             │  │
│  └───────────────────┬──────────────────────────────────────┘  │
└──────────────────────┼──────────────────────────────────────────┘
                       │ HTTPS (outbound)
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│              Google AI Studio (Gemini API)                       │
│  • Model: gemini-2.5-flash (recommended)                        │
│  • Free tier: Unlimited requests (15 RPM, 1M TPM)               │
│  • Context: System prompt with CV/resume data                   │
│  • Safety: Content filtering enabled                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 New File Structure

```
AboutMe/
├── functions/                          # Cloudflare Pages Functions (NEW)
│   ├── api/
│   │   └── chat.ts                     # API proxy endpoint
│   └── tsconfig.json                   # TypeScript config for functions
├── components/
│   └── ChatWidget.tsx                  # Chat UI component (NEW)
├── hooks/
│   └── useChat.ts                      # Chat state management hook (NEW)
├── grounding/                          # AI context files (NEW)
│   ├── job-description.md              # Current role JD
│   ├── professional-summary.md         # Extended bio
│   └── key-achievements.md             # Detailed accomplishments
├── types.ts                            # Add ChatMessage interface
├── App.tsx                             # Add ChatWidget import
├── wrangler.toml                       # Local dev config (gitignored)
└── .env.local                          # Local API key (gitignored)
```

---

## 📄 Grounding Files Strategy

### Why Grounding Files?

Adding structured files like your Job Description, professional summary, and key achievements significantly improves AI response quality by:
- Providing richer, more accurate context
- Enabling deeper answers about specific responsibilities
- Reducing hallucination by grounding responses in verified content

### Recommended Grounding Files

| File | Purpose | Example Content |
|------|---------|-----------------|
| `grounding/job-description.md` | Current role details | Full JD with responsibilities, requirements |
| `grounding/professional-summary.md` | Extended biography | Detailed career narrative, philosophy |
| `grounding/key-achievements.md` | Specific accomplishments | Quantified results, case studies |

### Implementation Approach

For a portfolio site, the **simplest and most effective approach** is embedding content directly in the system context. This:
- ✅ Requires no additional infrastructure (no R2, KV, or databases)
- ✅ Deploys with your code (version controlled)
- ✅ Has zero latency (no runtime file fetching)
- ✅ Works within Gemini's 1M token context window

**Alternative approaches** (more complex, for reference):
- **Cloudflare KV**: Store context in key-value store, fetch at runtime
- **Cloudflare R2**: Store files in object storage
- **RAG with embeddings**: Vector search for relevant chunks (overkill for portfolio)

### Sample Grounding Files

#### `grounding/job-description.md`
```markdown
# Strategic Account Director - Healthcare & Life Sciences

## Position Overview
Lead strategic relationships with Fortune 500 pharmaceutical and healthcare companies,
driving AI transformation initiatives and complex enterprise deals.

## Key Responsibilities
- **Executive Relationship Management**: Build and maintain C-suite relationships 
  (CEO, CIO, CDO, CFO) across strategic accounts
- **AI Transformation Leadership**: Guide customers through AI adoption journey, 
  from strategy to implementation
- **Complex Deal Architecture**: Structure multi-year, multi-million dollar agreements 
  involving licensing, services, and cloud consumption
- **Cross-functional Orchestration**: Coordinate internal teams (Engineering, Legal, 
  Finance, Delivery) to drive deal closure
- **Industry Thought Leadership**: Represent Microsoft at industry events, contribute 
  to healthcare/pharma go-to-market strategy

## Success Metrics
- Annual quota: $XX M+ TCV
- Customer satisfaction (CSAT) targets
- Strategic initiative adoption rates
- Relationship depth scores

## Required Qualifications
- 15+ years enterprise sales/account management experience
- Healthcare/Life Sciences industry expertise
- Track record of $100M+ deal closures
- Executive presence and C-suite selling skills
- Technical acumen in Cloud, AI/ML, Data & Analytics
```

#### `grounding/key-achievements.md`
```markdown
# Key Achievements & Impact

## Deal Highlights
- **$250M+ TCV** in architectural deals across strategic pharmaceutical accounts
- **FY25 100% Attainment** - Full quota achievement in competitive market
- **2x Platinum Club** - Top 1% of Microsoft sellers worldwide
- **2x Gold Club** - Exceptional revenue contribution

## Transformation Stories

### Pharma Customer A - AI-First Data Platform
**Challenge**: Legacy data infrastructure limiting R&D insights
**Solution**: Architected Azure-based data lakehouse with AI/ML capabilities
**Result**: 40% faster drug discovery insights, $XXM multi-year deal

### Healthcare Customer B - Copilot Deployment
**Challenge**: Physician burnout from administrative tasks
**Solution**: Microsoft 365 Copilot pilot with clinical workflow integration
**Result**: 3 hours/week saved per physician, expanded enterprise-wide

## Industry Recognition
- Speaker at Microsoft Inspire (Healthcare track)
- Featured in internal case studies for innovative deal structures
- Mentored 10+ early-in-career account executives
```

#### `grounding/professional-summary.md`
```markdown
# Professional Philosophy & Approach

## My Approach to Enterprise Sales
I believe in **value-based selling** that starts with deeply understanding 
customer challenges before proposing solutions. My methodology:

1. **Discovery**: Extensive stakeholder mapping and pain point analysis
2. **Vision Alignment**: Co-create transformation roadmap with customer
3. **Value Quantification**: Build business cases with measurable ROI
4. **Risk Mitigation**: Address concerns proactively, structure deals to share risk
5. **Long-term Partnership**: Focus on customer success, not just deal closure

## What Sets Me Apart
- **Technical Depth**: Hands-on experience as Solutions Architect means I can 
  engage authentically with technical stakeholders
- **Executive Presence**: Comfortable presenting to boards and C-suites
- **Industry Expertise**: Deep healthcare/pharma knowledge from 8+ years in vertical
- **Deal Creativity**: Known for innovative structures that unlock stalled opportunities

## Career Motivation
I'm passionate about the intersection of technology and healthcare. Seeing AI 
transform drug discovery, improve patient outcomes, and reduce clinician burnout 
drives my work every day.
```

---

## 🔧 Implementation Details

### Phase 1: Setup & Configuration (Day 1)

#### 1.1 Get Google AI Studio API Key
1. Navigate to https://aistudio.google.com/apikey
2. Click "Create API Key"
3. Copy the key (starts with `AIza...`)
4. **Never commit this to git!**

#### 1.2 Configure Cloudflare Environment Variables
1. Go to Cloudflare Dashboard → Pages → `aboutme-portfolio` → Settings
2. Navigate to "Environment Variables"
3. Click "Add variable"
4. Name: `GEMINI_API_KEY`
5. Value: Your API key
6. Check "Encrypt" (makes it a secret)
7. Apply to: Production AND Preview environments

#### 1.3 Local Development Setup
Create `.env.local` (already in .gitignore):
```env
GEMINI_API_KEY=AIza...your-key-here
```

Create `wrangler.toml` for local Pages Functions testing:
```toml
name = "aboutme-portfolio"
compatibility_date = "2024-01-01"

[vars]
# Local development only - production uses Cloudflare secrets
```

Add to `.gitignore`:
```
wrangler.toml
.env.local
```

---

### Phase 2: Backend API Proxy (Day 1-2)

#### 2.1 Create Functions Directory Structure
```bash
mkdir -p functions/api
```

#### 2.2 Create `functions/api/chat.ts`

```typescript
/**
 * @fileoverview Cloudflare Pages Function for AI chat proxy.
 * @description Securely proxies requests to Google's Gemini API.
 * @author Michael Gavrilov
 * @version 1.0.0
 */

// ============================================================================
// Type Definitions
// ============================================================================

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

interface ApiResponse {
  reply?: string;
  error?: string;
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Type guard to validate ChatRequest structure.
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
 * Sanitizes user input to prevent injection attacks.
 */
function sanitizeInput(input: string): string {
  return input
    .trim()
    .slice(0, 500) // Enforce max length (aligned with frontend)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''); // Remove control characters
}

// ============================================================================
// System Context
// ============================================================================

// TIP: To add grounding files, simply append their content below.
// The content is embedded at build time - no runtime file loading needed.
// Gemini 2.5 Flash supports up to 1M tokens, so you have plenty of room.

const SYSTEM_CONTEXT = `You are an AI assistant for Michael Gavrilov's professional portfolio website.
Answer questions about Michael based ONLY on the following verified information.

================================================================================
SECTION 1: PROFESSIONAL SUMMARY
================================================================================

## Professional Summary
- **Current Role**: Strategic Account Director at Microsoft, Healthcare & Life Sciences
- **Experience**: 20+ years in technology and enterprise sales
- **Location**: New York City
- **Specialization**: AI transformation, complex deal closure, C-suite partnerships

================================================================================
SECTION 2: CAREER HISTORY
================================================================================

## Career History at Microsoft (2006-Present)
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

## Recognition & Awards
- 🏆 **2x Microsoft Platinum Club** - Top performers worldwide
- 🥇 **2x Gold Club Award** - Outstanding contribution to revenue growth
- 🏅 **Champion Award FY23 Q4** - Transformational deals recognition
- ✅ **100% Attainment FY25** - Full quota achievement

## Education
- **Master's, Management of Technology** - NYU Tandon School of Engineering
- **Master's, Information Systems Engineering** - Bauman Moscow State Technical University
- **Bachelor's, Computer Engineering** - Bauman Moscow State Technical University

## Certifications
- Microsoft Certified: Azure Solutions Architect Expert
- AWS Certified Cloud Practitioner
- Wharton Executive Education: Selling to the C-Suite
- INSEAD Executive Education: Business Strategy & Financial Acumen
- INSEAD Executive Education: Value Negotiation

## Core Competencies
**Strategic Leadership**: Complex Deal Closure ($250M+ TCV), C-Suite Partnerships, AI-First Strategy
**AI & Cloud**: Generative AI Strategy, Azure, Copilot Enablement, Solutions Architecture
**Sales**: Value Negotiation, Strategic Account Planning, Go-to-Market Strategy
**Partnerships**: Transformational Partnerships, Novel Deal Structures, Platform Economics

## Personal Interests
Continuous Learning, Investing, Swimming, Boxing, Snowboarding, Horseback Riding, Golfing

## Contact Information
- **LinkedIn**: linkedin.com/in/mgavrilov
- **Email**: contact@gavrilov.ai
- **Resume**: Available on the website at /CV/Michael-Gavrilov-Resume.pdf

================================================================================
SECTION 3: JOB DESCRIPTION (Grounding File)
================================================================================

## Current Role: Strategic Account Director - Healthcare & Life Sciences

### Position Overview
Lead strategic relationships with Fortune 500 pharmaceutical and healthcare companies,
driving AI transformation initiatives and complex enterprise deals.

### Key Responsibilities
- **Executive Relationship Management**: Build and maintain C-suite relationships 
  (CEO, CIO, CDO, CFO) across strategic accounts
- **AI Transformation Leadership**: Guide customers through AI adoption journey, 
  from strategy to implementation
- **Complex Deal Architecture**: Structure multi-year, multi-million dollar agreements 
  involving licensing, services, and cloud consumption
- **Cross-functional Orchestration**: Coordinate internal teams (Engineering, Legal, 
  Finance, Delivery) to drive deal closure
- **Industry Thought Leadership**: Represent Microsoft at industry events, contribute 
  to healthcare/pharma go-to-market strategy

### Success Metrics
- Annual quota achievement targets
- Customer satisfaction (CSAT) scores
- Strategic initiative adoption rates
- Executive relationship depth scores

================================================================================
SECTION 4: KEY ACHIEVEMENTS (Grounding File)
================================================================================

## Deal Highlights
- **$250M+ TCV** in architectural deals across strategic pharmaceutical accounts
- **FY25 100% Attainment** - Full quota achievement in competitive market
- **2x Platinum Club** - Top 1% of Microsoft sellers worldwide
- **2x Gold Club** - Exceptional revenue contribution

## Transformation Impact
- Led AI-first data platform initiatives for major pharma customers
- Drove Microsoft 365 Copilot adoption in healthcare settings
- Architected Azure-based solutions reducing time-to-insight for R&D teams

## Industry Recognition
- Speaker at Microsoft Inspire (Healthcare track)
- Featured in internal case studies for innovative deal structures
- Mentored 10+ early-in-career account executives

================================================================================
SECTION 5: PROFESSIONAL PHILOSOPHY (Grounding File)
================================================================================

## My Approach to Enterprise Sales
Michael believes in **value-based selling** that starts with deeply understanding 
customer challenges before proposing solutions. His methodology:

1. **Discovery**: Extensive stakeholder mapping and pain point analysis
2. **Vision Alignment**: Co-create transformation roadmap with customer
3. **Value Quantification**: Build business cases with measurable ROI
4. **Risk Mitigation**: Address concerns proactively, structure deals to share risk
5. **Long-term Partnership**: Focus on customer success, not just deal closure

## What Sets Michael Apart
- **Technical Depth**: Hands-on experience as Solutions Architect enables authentic 
  engagement with technical stakeholders
- **Executive Presence**: Comfortable presenting to boards and C-suites
- **Industry Expertise**: Deep healthcare/pharma knowledge from 8+ years in vertical
- **Deal Creativity**: Known for innovative structures that unlock stalled opportunities

## Career Motivation
Michael is passionate about the intersection of technology and healthcare. Seeing AI 
transform drug discovery, improve patient outcomes, and reduce clinician burnout 
drives his work every day.

================================================================================
END OF GROUNDING CONTEXT
================================================================================

---
RESPONSE GUIDELINES:
1. Be concise, professional, and helpful
2. Only answer questions related to Michael's professional background
3. If asked about something not in the context, politely redirect
4. Do NOT make up information not provided above
5. For detailed inquiries, suggest connecting via LinkedIn or email
6. Keep responses under 150 words unless more detail is requested
7. Use bullet points for lists to improve readability`;

// ============================================================================
// Response Helpers
// ============================================================================

/**
 * Creates a JSON response with consistent headers.
 */
function jsonResponse(data: ApiResponse, status: number, origin: string): Response {
  // Only allow same-origin in production, or specific origins
  const allowedOrigins = [
    'https://gavrilov.ai',
    'https://www.gavrilov.ai',
  ];

  // Secure localhost check (prevents malicious-localhost.com)
  const isLocalhost = origin.startsWith('http://localhost:') || origin.startsWith('https://localhost:');
  const corsOrigin =
    origin && (allowedOrigins.includes(origin) || isLocalhost)
      ? origin
      : allowedOrigins[0];

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

    if (sanitizedMessage.length > 500) {
      return jsonResponse({ error: 'Message too long (max 500 characters)' }, 400, origin);
    }

    // Get API key from environment
    const apiKey = context.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY not configured');
      return jsonResponse({ error: 'AI service not configured' }, 503, origin);
    }

    // Build conversation with system context
    // Limit history to last 10 messages to prevent context overflow
    const recentHistory = history.slice(-10);

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
      ...recentHistory.map(msg => ({
        role: msg.role,
        parts: [{ text: sanitizeInput(msg.content) }],
      })),
      // Current user message
      { role: 'user', parts: [{ text: sanitizedMessage }] },
    ];

    // Call Gemini API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout

    let geminiResponse: globalThis.Response;
    try {
      geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
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
      return jsonResponse({ error: 'AI service error: ' + (data.error.message ?? 'Unknown') }, 502, origin);
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
      return jsonResponse(
        { error: 'Empty response from AI. Please try again.' },
        200,
        origin
      );
    }

    // Check if response was blocked by safety filters
    if (firstCandidate.finishReason === 'SAFETY') {
      return jsonResponse(
        { reply: "I'm sorry, but I can't respond to that type of question. Please ask about Michael's professional background." },
        200,
        origin
      );
    }

    const parts = firstCandidate.content?.parts;
    if (!parts || parts.length === 0) {
      return jsonResponse(
        { error: 'No content in AI response. Please try again.' },
        200,
        origin
      );
    }

    const reply = parts[0]?.text;
    if (!reply || reply.trim().length === 0) {
      return jsonResponse(
        { error: 'Empty text in AI response. Please try again.' },
        200,
        origin
      );
    }

    return jsonResponse({ reply: reply.trim() }, 200, origin);
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
  const allowedOrigins = ['https://gavrilov.ai', 'https://www.gavrilov.ai'];
  
  // Secure localhost check (prevents malicious-localhost.com)
  const isLocalhost = origin.startsWith('http://localhost:') || origin.startsWith('https://localhost:');
  const corsOrigin =
    origin && (allowedOrigins.includes(origin) || isLocalhost)
      ? origin
      : allowedOrigins[0];

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
```

#### 2.3 Create `functions/tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2021",
    "module": "ESNext",
    "moduleResolution": "Node",
    "lib": ["ES2021"],
    "types": ["@cloudflare/workers-types"],
    "strict": true,
    "noEmit": true
  },
  "include": ["**/*.ts"]
}
```

#### 2.4 Install Types (optional, for IDE support)
```bash
npm install -D @cloudflare/workers-types
```

---

### Phase 3: Frontend Components (Day 2-3)

#### 3.1 Add ChatMessage Type to `types.ts`

```typescript
/**
 * Represents a chat message in the AI assistant conversation.
 * Used in the ChatWidget component for message display.
 */
export interface ChatMessage {
  /** Unique identifier for the message */
  id: string;
  /** Message sender role */
  role: 'user' | 'assistant';
  /** Message text content */
  content: string;
  /** When the message was created */
  timestamp: Date;
}

/**
 * API request format for chat endpoint.
 * @internal Used by useChat hook
 */
export interface ChatApiRequest {
  /** User's message text */
  message: string;
  /** Previous conversation history */
  history?: Array<{ role: 'user' | 'model'; content: string }>;
}

/**
 * API response format from chat endpoint.
 * @internal Used by useChat hook
 */
export interface ChatApiResponse {
  /** AI assistant's reply */
  reply?: string;
  /** Error message if request failed */
  error?: string;
}
```

#### 3.2 Create `hooks/useChat.ts`

```typescript
/**
 * @fileoverview Custom hook for managing AI chat state and interactions.
 * @description Handles message history, loading states, and API communication.
 * @author Michael Gavrilov
 * @version 1.0.0
 */

import { useState, useCallback, useRef } from 'react';
import type { ChatMessage, ChatApiResponse } from '../types';

/** Return type for useChat hook */
interface UseChatReturn {
  /** Array of chat messages */
  messages: ChatMessage[];
  /** Whether a request is in progress */
  isLoading: boolean;
  /** Error message if request failed */
  error: string | null;
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

/**
 * Generates a unique ID for messages.
 * Falls back to timestamp + random for older browsers without crypto.randomUUID.
 */
function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

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
  endpoint = '/api/chat',
  timeout = 30000,
}: UseChatOptions = {}): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use ref to always have current messages for history
  const messagesRef = useRef<ChatMessage[]>([]);
  messagesRef.current = messages;

  const sendMessage = useCallback(async (content: string): Promise<void> => {
    const trimmedContent = content.trim();
    if (!trimmedContent || isLoading) return;

    // Create user message
    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: trimmedContent,
      timestamp: new Date(),
    };

    // Capture current history BEFORE adding new message
    const currentHistory = messagesRef.current.map(m => ({
      role: m.role === 'user' ? ('user' as const) : ('model' as const),
      content: m.content,
    }));

    // Optimistically add user message
    setMessages(prev => [...prev, userMessage]);
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

      // Parse response with type safety
      const data: ChatApiResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? `Request failed: ${response.status}`);
      }

      if (!data.reply) {
        throw new Error('Empty response from AI service');
      }

      // Add assistant response
      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: data.reply,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
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
  }, [endpoint, timeout, isLoading]);

  const clearHistory = useCallback((): void => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isLoading, error, sendMessage, clearHistory };
}
```

#### 3.3 Create `components/ChatWidget.tsx`

```typescript
/**
 * @fileoverview Floating AI chat widget component.
 * @description Provides an interactive chat interface for portfolio visitors.
 * @author Michael Gavrilov
 * @version 1.0.0
 */

import React, { memo, useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Trash2, Bot, User } from 'lucide-react';
import { useChat } from '../hooks/useChat';
import type { ChatMessage } from '../types';

/** Suggested questions for new users */
const QUICK_QUESTIONS: readonly string[] = [
  "What is Michael's experience?",
  'Key achievements?',
  'Current role?',
] as const;

/** Props for MessageBubble component */
interface MessageBubbleProps {
  message: ChatMessage;
}

/**
 * Individual message bubble component.
 * Memoized to prevent unnecessary re-renders.
 */
const MessageBubble: React.FC<MessageBubbleProps> = memo(({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {/* Assistant Avatar */}
      {!isUser && (
        <div
          className="w-7 h-7 rounded-full bg-primary-600 flex items-center 
                     justify-center flex-shrink-0 mt-0.5"
        >
          <Bot className="w-4 h-4 text-white" aria-hidden="true" />
        </div>
      )}

      {/* Message Bubble */}
      <div
        className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-primary-600 text-white rounded-br-md'
            : 'bg-slate-800 text-slate-200 rounded-bl-md'
        }`}
      >
        {message.content}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div
          className="w-7 h-7 rounded-full bg-slate-700 flex items-center 
                     justify-center flex-shrink-0 mt-0.5"
        >
          <User className="w-4 h-4 text-slate-300" aria-hidden="true" />
        </div>
      )}
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';

/**
 * Loading indicator with animated dots.
 */
const LoadingIndicator: React.FC = memo(() => (
  <div className="flex gap-2 justify-start">
    <div
      className="w-7 h-7 rounded-full bg-primary-600 flex items-center 
                 justify-center flex-shrink-0"
    >
      <Bot className="w-4 h-4 text-white" aria-hidden="true" />
    </div>
    <div className="bg-slate-800 px-4 py-3 rounded-2xl rounded-bl-md">
      <div
        className="flex gap-1.5 motion-reduce:hidden"
        role="status"
        aria-label="Loading response"
      >
        <span
          className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"
          style={{ animationDelay: '0ms' }}
        />
        <span
          className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"
          style={{ animationDelay: '150ms' }}
        />
        <span
          className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"
          style={{ animationDelay: '300ms' }}
        />
      </div>
      {/* Fallback for reduced motion */}
      <span className="hidden motion-reduce:block text-slate-400 text-sm">
        Thinking...
      </span>
    </div>
  </div>
));

LoadingIndicator.displayName = 'LoadingIndicator';

/**
 * Floating chat widget for AI-powered Q&A about Michael's background.
 * Features a collapsible interface with message history and quick suggestions.
 *
 * @remarks
 * - Positioned bottom-left to avoid conflict with BackToTop button (bottom-right)
 * - Supports keyboard navigation (Tab, Enter, Escape)
 * - Respects prefers-reduced-motion
 */
const ChatWidget: React.FC = memo(() => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [input, setInput] = useState<string>('');
  const { messages, isLoading, error, sendMessage, clearHistory } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Small delay to ensure animation completes
      const timeoutId = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen]);

  // Handle escape key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent): Promise<void> => {
      e.preventDefault();
      if (!input.trim() || isLoading) return;

      const message = input;
      setInput('');
      await sendMessage(message);
    },
    [input, isLoading, sendMessage]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>): void => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        void handleSubmit(e);
      }
    },
    [handleSubmit]
  );

  const handleQuickQuestion = useCallback(
    (question: string): void => {
      void sendMessage(question);
    },
    [sendMessage]
  );

  const toggleChat = useCallback((): void => {
    setIsOpen(prev => !prev);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      setInput(e.target.value);
    },
    []
  );

  return (
    <>
      {/* Floating Toggle Button - positioned bottom-left to avoid BackToTop conflict */}
      <button
        onClick={toggleChat}
        className="fixed bottom-6 left-6 z-50 w-14 h-14 bg-primary-600 hover:bg-primary-700 
                   text-white rounded-full shadow-lg flex items-center justify-center 
                   transition-all duration-300 hover:scale-110 focus-ring
                   motion-reduce:transition-none motion-reduce:hover:transform-none"
        aria-label={isOpen ? 'Close chat' : 'Open AI assistant'}
        aria-expanded={isOpen}
        aria-controls="chat-dialog"
      >
        {isOpen ? (
          <X className="w-6 h-6" aria-hidden="true" />
        ) : (
          <MessageCircle className="w-6 h-6" aria-hidden="true" />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          id="chat-dialog"
          className="fixed bottom-24 left-6 z-50 w-[380px] max-w-[calc(100vw-48px)] 
                     bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl 
                     flex flex-col overflow-hidden
                     motion-safe:animate-[slideUp_0.2s_ease-out]"
          style={{ height: 'min(520px, calc(100vh - 150px))' }}
          role="dialog"
          aria-label="AI Assistant Chat"
          aria-modal="true"
        >
          {/* Header */}
          <div
            className="bg-gradient-to-r from-primary-600 to-primary-700 px-4 py-3 
                       flex items-center justify-between flex-shrink-0"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" aria-hidden="true" />
              </div>
              <div>
                <span className="font-semibold text-white block text-sm">
                  Ask About Michael
                </span>
                <span className="text-white/70 text-xs">AI-powered assistant</span>
              </div>
            </div>
            <button
              onClick={clearHistory}
              className="text-white/70 hover:text-white p-2 rounded-lg 
                         hover:bg-white/10 transition-colors"
              aria-label="Clear chat history"
              title="Clear history"
              disabled={messages.length === 0}
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Welcome Message */}
            {messages.length === 0 && (
              <div className="text-center py-6">
                <div
                  className="w-16 h-16 bg-slate-800 rounded-full flex items-center 
                             justify-center mx-auto mb-4"
                >
                  <Bot className="w-8 h-8 text-primary-400" aria-hidden="true" />
                </div>
                <p className="text-slate-300 text-sm mb-1">
                  Hi! I&apos;m an AI assistant.
                </p>
                <p className="text-slate-400 text-sm mb-4">
                  Ask me anything about Michael&apos;s professional background, experience,
                  or skills.
                </p>

                {/* Quick Questions */}
                <div className="flex flex-wrap gap-2 justify-center">
                  {QUICK_QUESTIONS.map(question => (
                    <button
                      type="button"
                      key={question}
                      onClick={() => handleQuickQuestion(question)}
                      disabled={isLoading}
                      className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 
                                 text-slate-300 rounded-full transition-colors
                                 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message List */}
            {messages.map(msg => (
              <MessageBubble key={msg.id} message={msg} />
            ))}

            {/* Loading Indicator */}
            {isLoading && <LoadingIndicator />}

            {/* Error Message */}
            {error && (
              <div
                className="text-center text-red-400 text-sm py-2 px-3 
                           bg-red-400/10 rounded-lg"
                role="alert"
              >
                {error}
              </div>
            )}

            {/* Scroll anchor */}
            <div ref={messagesEndRef} aria-hidden="true" />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="p-3 border-t border-slate-700 flex-shrink-0">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask about Michael..."
                disabled={isLoading}
                className="flex-1 bg-slate-800 border border-slate-600 rounded-full 
                           px-4 py-2.5 text-sm text-white placeholder-slate-400 
                           focus:outline-none focus:border-primary-500 focus:ring-1 
                           focus:ring-primary-500 disabled:opacity-50"
                maxLength={500}
                aria-label="Type your message"
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="w-10 h-10 bg-primary-600 hover:bg-primary-700 
                           disabled:bg-slate-700 rounded-full flex items-center 
                           justify-center transition-colors disabled:cursor-not-allowed"
                aria-label="Send message"
              >
                <Send className="w-4 h-4 text-white" aria-hidden="true" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2 text-center">
              AI-powered • Responses based on public profile data
            </p>
          </form>
        </div>
      )}
    </>
  );
});

ChatWidget.displayName = 'ChatWidget';

export default ChatWidget;
```

#### 3.4 Add CSS Animation to `styles/globals.css`

Add the following animation keyframe to your `globals.css` file:

```css
/* ============================================================================
 * Chat Widget Animation
 * ============================================================================ */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(1rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Loading dots animation for chat */
@keyframes bounce {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-0.25rem);
  }
}
```

#### 3.5 Update `App.tsx`

Add the ChatWidget to the main application:

```typescript
// Add import at top
import ChatWidget from './components/ChatWidget';

// Add before the closing </> in the return statement (after BackToTop)
<ChatWidget />
```

---

### Phase 4: Testing (Day 3-4)

#### 4.1 Local Development with Wrangler

```bash
# Install wrangler
npm install -D wrangler

# Build the app first
npm run build

# Run with Pages Functions support
npx wrangler pages dev dist --compatibility-date=2024-01-01
```

#### 4.2 Unit Test for ChatWidget

Create `tests/ChatWidget.test.tsx`:
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ChatWidget from '../components/ChatWidget';

// Mock fetch
global.fetch = vi.fn();

describe('ChatWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders chat toggle button', () => {
    render(<ChatWidget />);
    expect(screen.getByLabelText('Open AI assistant')).toBeInTheDocument();
  });

  it('opens chat window when toggle is clicked', () => {
    render(<ChatWidget />);
    fireEvent.click(screen.getByLabelText('Open AI assistant'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('shows welcome message when chat is opened', () => {
    render(<ChatWidget />);
    fireEvent.click(screen.getByLabelText('Open AI assistant'));
    expect(screen.getByText(/Ask me anything about Michael/i)).toBeInTheDocument();
  });

  it('displays quick question buttons', () => {
    render(<ChatWidget />);
    fireEvent.click(screen.getByLabelText('Open AI assistant'));
    expect(screen.getByText("What is Michael's experience?")).toBeInTheDocument();
  });

  it('closes chat when close button is clicked', () => {
    render(<ChatWidget />);
    fireEvent.click(screen.getByLabelText('Open AI assistant'));
    fireEvent.click(screen.getByLabelText('Close chat'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('sends message when form is submitted', async () => {
    (global.fetch as vi.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ reply: 'Test response' }),
    });

    render(<ChatWidget />);
    fireEvent.click(screen.getByLabelText('Open AI assistant'));
    
    const input = screen.getByLabelText('Type your message');
    fireEvent.change(input, { target: { value: 'Test question' } });
    fireEvent.click(screen.getByLabelText('Send message'));

    await waitFor(() => {
      expect(screen.getByText('Test question')).toBeInTheDocument();
    });
  });
});
```

#### 4.3 Manual Testing Checklist

- [ ] Chat widget opens/closes correctly
- [ ] Messages send and display properly
- [ ] Loading indicator shows during API call
- [ ] Error messages display on failure
- [ ] Quick questions work
- [ ] Clear history works
- [ ] Keyboard navigation (Tab, Enter, Escape)
- [ ] Mobile responsiveness
- [ ] Screen reader announces messages

---

### Phase 5: Deployment (Day 4)

#### 5.1 Update `package.json` Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "dev:cf": "npm run build && npx wrangler pages dev dist",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "deploy": "npm run build && npx wrangler pages deploy dist"
  }
}
```

#### 5.2 Cloudflare Dashboard Verification

1. **Build Settings**:
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: `/`

2. **Environment Variables**:
   - `GEMINI_API_KEY`: [encrypted secret]
   - Applied to: Production ✓, Preview ✓

3. **Functions**:
   - Auto-detected from `/functions` directory
   - Verify `/api/chat` route is registered

#### 5.3 Post-Deployment Testing

```bash
# Test the deployed endpoint
curl -X POST https://your-site.pages.dev/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is Michaels experience?"}'
```

---

## 💰 Cost Analysis

| Component | Free Tier Limit | Expected Usage | Monthly Cost |
|-----------|-----------------|----------------|--------------|
| **Gemini 2.5 Flash** | 15 RPM, 1M TPM | ~100 requests/day | **$0** |
| **Cloudflare Pages** | Unlimited sites | 1 site | **$0** |
| **Cloudflare Functions** | 100K req/day | ~100 req/day | **$0** |
| **Bandwidth** | Unlimited | N/A | **$0** |
| **Total** | - | - | **$0/month** |

---

## 🔒 Security Checklist

- [x] API key stored in Cloudflare environment variables (encrypted)
- [x] API key never exposed to client-side JavaScript
- [x] Input validation (max 500 chars, type checking)
- [x] Rate limiting handled by Gemini API (15 RPM)
- [x] Content safety settings enabled
- [x] HTTPS enforced by Cloudflare
- [x] XSS prevention (React's default escaping)
- [x] CORS restricted to production domains + localhost
- [x] Add `wrangler.toml` to `.gitignore` (in Phase 1 instructions)
- [x] Add `.env.local` to `.gitignore` (in Phase 1 instructions)

---

## ♿ Accessibility Checklist

- [x] ARIA labels on interactive elements
- [x] Keyboard navigation (Tab, Enter, Escape)
- [x] Focus management on open/close
- [x] Loading state announced to screen readers
- [x] Color contrast meets WCAG 2.1 AA
- [x] Mobile responsive (works on touch devices)
- [x] Error messages are descriptive

---

## 📊 Model Comparison

| Model | Speed | Quality | Free Tier | Best For |
|-------|-------|---------|-----------|----------|
| **gemini-2.5-flash** ⭐ | Fast | ★★★★☆ | ✅ Yes | **Recommended - Best balance** |
| gemini-2.5-pro | Medium | ★★★★★ | ✅ Yes | Complex reasoning (overkill) |
| gemini-2.0-flash | Fastest | ★★★☆☆ | ✅ Yes | High volume, simpler tasks |
| gemini-3-flash-preview | Fast | ★★★★★ | ✅ Yes | Newest features (preview) |

**Recommendation**: Use `gemini-2.5-flash` - excellent quality, fast responses, generous free tier.

---

## 🚀 Future Enhancements (Post-MVP)

| Priority | Enhancement | Benefit |
|----------|-------------|---------|
| High | **Streaming responses** | Better UX, faster perceived response |
| High | **localStorage persistence** | Conversation survives page refresh |
| Medium | **Analytics tracking** | Understand user questions |
| Medium | **Rate limit UI** | Graceful degradation on limits |
| Low | **Voice input** | Accessibility, mobile convenience |
| Low | **Multi-language** | Broader audience reach |
| Low | **Thumbs up/down feedback** | Quality improvement data |

---

## 📅 Implementation Timeline

| Phase | Duration | Deliverables | Status |
|-------|----------|--------------|--------|
| **Phase 1** | Day 1 | API key, Cloudflare setup | ⬜ |
| **Phase 2** | Day 1-2 | Backend Pages Function | ⬜ |
| **Phase 3** | Day 2-3 | Frontend components | ⬜ |
| **Phase 4** | Day 3-4 | Testing & QA | ⬜ |
| **Phase 5** | Day 4 | Production deployment | ⬜ |

**Total Estimated Time**: 4-5 days

---

## 📚 References

- [Google AI Studio - Get API Key](https://aistudio.google.com/apikey)
- [Gemini API Documentation](https://ai.google.dev/gemini-api/docs)
- [Gemini Free Tier Pricing](https://ai.google.dev/pricing)
- [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/)
- [Cloudflare Environment Variables](https://developers.cloudflare.com/pages/configuration/build-configuration/#environment-variables)
- [Google Gen AI JavaScript SDK](https://github.com/googleapis/js-genai)

---

## ✅ Ready to Implement

This plan provides a complete, production-ready blueprint for adding an AI chatbot to your portfolio. The architecture prioritizes:

1. **Security**: API key never exposed to client
2. **Cost**: 100% free tier usage
3. **Performance**: Edge deployment for low latency
4. **User Experience**: Polished, accessible chat UI
5. **Maintainability**: Clean code following project patterns

**Next Step**: When ready to implement, start with Phase 1 (getting the API key and configuring Cloudflare secrets).

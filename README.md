# My-Portfolio

Personal site for Michael Gavrilov (gavrilov.ai): a light, editorial single-page portfolio with an AI assistant that answers questions about his career. Built with React 19, TypeScript, and Tailwind CSS v4, deployed on Cloudflare Pages.

**Repository:** https://github.com/mig1980/My-Portfolio

## Features

- **Sections:** Hero with "Ask my AI assistant" box → Stats → 01 About → 02 How I think → 03 Where I operate → 04 Experience (Engineer → Architect → Strategist → Dealmaker) → 05 Projects → 06 Education → 07 Contact
- **AI assistant:** Gemini-backed chat (`functions/api/chat.ts`) with a 4-model fallback chain, suggested questions, follow-up suggestions, retry, offline and rate-limit states, and 24-hour history in `localStorage`
- **Deep links:** `/#experience`, `/#projects`, etc. scroll to the section even though below-the-fold sections load lazily
- **Design:** paper/ink palette with a blue accent; Instrument Serif for headlines, Inter for text (self-hosted in `public/fonts/`)

## Editing Content

| What | Where |
|------|-------|
| Name, headline, intro, About text | `constants.tsx` → `PERSONAL_INFO` |
| Stats bar | `constants.tsx` → `STATS` |
| Experience, stages, education, certifications | `constants.tsx` → `EXPERIENCE`, `CAREER_STAGES`, `EDUCATION`, `CERTIFICATIONS` |
| "Where I operate" areas | `constants.tsx` → `SKILLS` |
| Awards (badges in `public/Awards/`) | `constants.tsx` → `AWARDS` |
| Suggested chat questions | `constants.tsx` → `SUGGESTED_QUESTIONS` (hero shows the first 3) |
| "How I think" principles and statement | `components/MyApproach.tsx` |
| Facts the AI assistant may use | `functions/api/chat.ts` → `SYSTEM_CONTEXT` |
| Page title, description, social cards | `index.html` |

> The AI assistant does **not** read `constants.tsx`. When a fact changes on the page, update `SYSTEM_CONTEXT` too.

## Tech Stack

- **React 19** - UI framework with functional components and hooks
- **TypeScript** - Strict mode enabled for type safety
- **Tailwind CSS v4** - Theme defined in `styles/globals.css` via `@theme` (no `tailwind.config.js`)
- **Vite 6** - Fast build tool with optimized chunking
- **Vitest** - Unit testing framework

## Run Locally

**Prerequisites:** Node.js 20.x or higher (pinned via `.nvmrc`)

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests (watch)
npm run test

# Run tests (CI)
npm run test:run

# Run tests with coverage
npm run test:coverage
```

## Project Structure

```
My-Portfolio/
├── components/          # React components
│   ├── ui/             # Reusable primitives (Section, SectionHeading, PageWrapper, etc.)
│   └── [Feature].tsx   # Feature components
├── public/              # Static assets, _headers/_redirects, sitemap/robots
├── hooks/              # Custom hooks (useChat, useInView, useScrollPosition, etc.)
├── tests/              # Vitest tests
├── utils/              # Shared utilities (analytics, chat events/limits, string, dom, logo)
├── styles/             # Global styles + CSS utilities
├── functions/          # Cloudflare Pages Functions (server-side)
├── scripts/            # Maintenance scripts
├── types.ts            # TypeScript interfaces
└── constants.tsx       # Application data
```

## Performance Optimizations

- ✅ All components memoized with `React.memo()`
- ✅ Below-the-fold sections and the chat widget are lazy-loaded
- ✅ Scroll handler throttled via `requestAnimationFrame`
- ✅ Explicit image dimensions on all `<img>` elements (CLS prevention)
- ✅ Vite manual chunks for better caching (lucide-react separated)
- ✅ Production source maps disabled
- ✅ CSS utility classes for common patterns (.focus-ring)
- ✅ Shared utilities to avoid code duplication
- ✅ Theme defined once in CSS via `@theme` directive

## Accessibility

- ✅ **Focus indicators** on all interactive elements via `.focus-ring` / `.focus-ring-inset` utilities
- ✅ **WCAG 2.1 AA contrast** — all small body text meets 4.5:1 ratio
- ✅ **Reduced motion** — all transform/keyframe animations have `motion-reduce:` counterparts
- ✅ **Section scroll animations** respect `prefers-reduced-motion` (content shown immediately)
- ✅ **ChatWidget** loading animation hidden for reduced-motion users with text fallback
- ✅ **Chat replies** read once, in full, by screen readers (typing animation is visual only)
- ✅ **Anchored sections** stay clear of the fixed header (`scroll-padding-top`)
- ✅ **SSR-safe hooks** — `useInView` guards against missing `IntersectionObserver`
- ✅ ARIA attributes on dialog, expandable sections, and live regions

## Security

- ✅ HSTS with preload (`Strict-Transport-Security: max-age=31536000`)
- ✅ CSP, X-Frame-Options: DENY, X-Content-Type-Options: nosniff
- ✅ Permissions-Policy restricts camera, microphone, geolocation
- ✅ CORS whitelist on chat API (production domains + localhost)
- ✅ Input sanitization and message/history length limits on the server-side chat endpoint
- ✅ 0 known vulnerabilities in production dependencies (`npm audit --omit=dev`)

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Type-check and build for production |
| `npm run type-check` | Run TypeScript type checking |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm run test` | Run tests in watch mode |
| `npm run test:run` | Run tests once (CI) |
| `npm run preview` | Preview production build locally |

## Configuration

- Client-side environment variables use the `VITE_` prefix. See `.env.example`.
- Local secrets belong in `.env.local` (ignored by git).
- The chat API runs as a Cloudflare Pages Function and requires a server-side `GEMINI_API_KEY` secret (set in Cloudflare, not in the repo).

## Deployment

Deployed on Cloudflare Pages with security headers configured in `public/_headers`. CI runs lint, type-check, test, and build on every PR via GitHub Actions (all jobs have explicit timeouts).

## SEO / Indexing

- Verify these return HTTP 200 in production:
	- `https://gavrilov.ai/robots.txt`
	- `https://gavrilov.ai/sitemap.xml`
- Google Search Console:
	- Add property for `https://gavrilov.ai/` (or a Domain property if you prefer DNS verification)
	- Submit sitemap: `https://gavrilov.ai/sitemap.xml`
	- Use URL Inspection to request indexing for:
		- `https://gavrilov.ai/`
		- `https://gavrilov.ai/legal`
- Validate SPA deep links load directly (no 404): `/legal` (Cloudflare Pages routing is configured via `public/_redirects`).

## Chat Analytics (GA4)

The chat widget emits privacy-safe GA4 events (no raw message text).

- Create a custom dimension for chat session IDs:
	- GA4 → Admin → Custom definitions → Create custom dimension
	- Scope: Event
	- Event parameter: `chat_session_id`
- To analyze “how many questions per chat session”:
	- GA4 → Explore → Free form
	- Filter: Event name = `chat_message_sent`
	- Rows: your `chat_session_id` custom dimension
	- Values: Event count

## License

- Code is licensed under the MIT License (see `LICENSE`).
- Personal content and assets are not covered by the MIT license, including name/biographical content, images, and PDFs under `public/CV/` and `public/Awards/`.

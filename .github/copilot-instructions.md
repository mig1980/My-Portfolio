# GitHub Copilot Instructions - AboutMe Portfolio

> Concise instructions for Copilot to work efficiently in this repository.

## Project Overview

**Type:** React 19 SPA - Professional Portfolio Website, plus a private résumé editor at `/admin/`  
**Stack:** TypeScript (strict), Tailwind CSS v4, Vite 6 (two entries: `index.html`, `admin/index.html`), Vitest  
**Deployment:** Cloudflare Pages with Pages Functions; résumé PDF built by a GitHub Action  
**Node:** ≥20.0.0 | **npm:** ≥10.0.0

## Build & Validation Commands

**Always run these commands from the repository root:**

```bash
# Install dependencies (run first, or after package.json changes)
npm install

# Development server
npm run dev

# Type checking (run before committing)
npm run type-check

# Linting (run before committing)
npm run lint

# Format code
npm run format

# Run all tests
npm run test:run

# Production build (includes type-check)
npm run build

# Rebuild both résumé PDFs from content/*.html, then check their text (normally only the Resume PDF Action runs these)
npm run resume:build
npm run resume:check

# Full validation sequence
npm run type-check && npm run lint && npm run test:run && npm run build
```

The site owner edits the résumé only in the browser at `gavrilov.ai/admin/`; never tell him to run npm commands.

## Project Structure

```
AboutMe/
├── App.tsx                 # Root component (routing logic)
├── index.tsx               # React DOM entry point
├── types.ts                # ALL shared TypeScript interfaces
├── constants.tsx           # Application data/content
├── components/
│   ├── ChatWidget.tsx      # AI chat widget (complex, 1000+ lines)
│   ├── Navigation.tsx      # Responsive nav with scroll detection
│   ├── [Section].tsx       # Page sections (Hero, About, Stats, etc.)
│   └── ui/                 # Reusable primitives (Section, SectionHeading, etc.)
├── hooks/                  # Custom React hooks
│   ├── useChat.ts          # Chat state management
│   ├── useScrollPosition.ts
│   ├── useIsMobile.ts
│   ├── useOnlineStatus.ts
│   ├── useBodyScrollLock.ts
│   └── useInView.ts
├── utils/                  # Pure utility functions
│   ├── analytics.ts        # GA4 tracking
│   ├── chatEvents.ts       # askChat() bridge from the page to ChatWidget
│   ├── chatLimits.ts       # Limits shared with functions/api/chat.ts (no DOM imports)
│   ├── careerFacts.ts      # CAREER_FACTS shared by constants.tsx and chat.ts; tests check the résumés match
│   ├── string.ts           # String helpers (getInitials)
│   ├── dom.ts              # DOM helpers
│   └── logo.ts             # Logo URL generation
├── functions/api/          # Cloudflare Pages Functions
│   ├── chat.ts             # Gemini API proxy with 4-model fallback
│   └── admin/
│       ├── _middleware.ts  # Verifies the Cloudflare Access JWT for every /api/admin/*
│       ├── resume.ts       # GET/PUT content/resume.html via the GitHub Contents API
│       └── status.ts       # Latest Resume PDF run + last PDF commit
├── admin/                  # Private résumé editor (separate Vite entry, never in the public bundle)
│   ├── index.html, main.tsx
│   ├── ResumeEditor.tsx    # Page: load, edit, draft autosave, publish, build polling
│   ├── api.ts, fit.ts, lineDiff.ts, useDebouncedValue.ts
│   └── components/         # HtmlEditor (CodeMirror), PreviewFrame, ValidationPanel, PublishDialog, BuildStatus
├── content/
│   ├── resume.html         # Executive résumé (exactly 1 page) → public/CV/MGavrilovCV.pdf (linked from the site)
│   ├── resume-ats.html     # ATS résumé (exactly 2 pages) → public/CV/MGavrilovCV-ATS.pdf (not linked)
│   └── resume-facts.md     # Fact register: the only facts the résumés may use
├── resume/                 # Shared by the editor, the Functions and the PDF build
│   ├── render.ts           # Fills {{TITLE}}, applies --fs/--gap overrides
│   ├── validate.ts         # Template contract + safety checks (DOM-free, authoritative on the server)
│   ├── documents.ts        # Registry: id → src, out, exact page target, fit settings, required text order
│   ├── pdf.ts              # Fit-setting builder, page constants, @page margin parser, page count/date pinning (isomorphic)
│   ├── textCheck.ts        # ATS text rules used by scripts/check-resume-text.ts
│   ├── facts.ts            # Shared-fact cross-check: editor warnings (never blocks Publish) + CI test
│   └── github.ts           # GitHub REST helpers for the admin Functions
├── scripts/
│   ├── build-resume.ts     # Playwright: fits each document to its exact page count → both PDFs
│   ├── check-resume-text.ts  # pdf.js text check of the built PDFs (npm run resume:check)
│   └── test-gemini-models.ts  # Manual model check
├── docs/resume-admin-plan.md  # Design, decisions and manual setup for the résumé editor
├── styles/globals.css      # Tailwind v4 + custom utilities
├── tests/                  # Vitest tests (336 tests, 23 files)
├── .github/prompts/        # /resume-update, /resume-review, /resume-tailor
├── .github/workflows/
│   ├── ci.yml              # Lint, format, type-check, tests, build
│   └── resume-pdf.yml      # Rebuilds and commits the résumé PDF on main
└── public/
    ├── _headers            # Security headers (CSP, CORS); /admin is noindex + no-store
    ├── _redirects          # SPA routing
    ├── fonts/              # Self-hosted Inter + Instrument Serif (site AND résumé)
    └── CV/MGavrilovCV.pdf  # Generated; never edit by hand
```

## Code Patterns (Follow These)

### TypeScript
- **Strict mode enabled** - Never use `any`
- **Interfaces in `types.ts`** - Keep all shared types there
- **Explicit return types** for exported functions

```typescript
// ✅ Correct pattern
interface ComponentProps {
  id: string;
  children: ReactNode;
}

const Component: React.FC<ComponentProps> = ({ id, children }) => {
  // ...
};
```

### React Components
- **Functional components only** with hooks
- **Use `React.memo()`** for presentational components
- **Use `useCallback`** for event handlers passed to children
- **Cleanup `useEffect`** - Always return cleanup function for listeners

```typescript
// ✅ Correct pattern
const Component = memo(() => {
  const handleClick = useCallback(() => {
    // handler logic
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll); // cleanup
  }, []);

  return <button onClick={handleClick}>Click</button>;
});
```

### Naming Conventions
| Element | Convention | Example |
|---------|------------|---------|
| Components | PascalCase | `ChatWidget.tsx` |
| Hooks | camelCase with `use` | `useScrollPosition` |
| Interfaces | PascalCase | `ChatMessage` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_MESSAGE_LENGTH` |
| Booleans | `is`/`has` prefix | `isLoading`, `hasError` |

## Security Requirements

- **External links:** Always use `rel="noopener noreferrer"` with `target="_blank"`
- **No `dangerouslySetInnerHTML`** unless absolutely necessary and sanitized
- **Environment variables:** Use `VITE_` prefix for client-side, server vars in Cloudflare
- **CSP headers:** Defined in `public/_headers` - update when adding external resources

## Résumé Pipeline & Admin Editor

Flow: `/admin/` editor → `PUT /api/admin/resume` (validates, commits `content/resume.html` to `main`) → `resume-pdf.yml` runs `npm run resume:build` and commits `public/CV/MGavrilovCV.pdf` → Cloudflare Pages redeploys. The site links to the PDF via `PERSONAL_INFO.resumeUrl`.

**Template contract** (enforced by `resume/validate.ts`): full HTML document; `{{TITLE}}` exactly once (Enterprise title); `--fs` and `--gap` defined in `:root` and used; `@page { size: Letter; margin: 0; }` (multi-page documents with `pageMargin: 'any'` may set print margins); fonts only via `url('/fonts/…')`; no scripts, `on*=` handlers, `javascript:` URLs, embeds/frames/`<link>`, or external resources (only `<a>` may link out); ≤ 100 KB. The contact line (incl. phone) is plain HTML in the template by the owner's choice. Keep heading `letter-spacing` ≤ 1px and ligatures off in the ATS version, or `resume:check` fails.

**Rules:**
- Keep `resume/*.ts` free of DOM-only and Node-only APIs (no `document`, no `Buffer`/`fs`): they run in the browser, Workers and Node.
- The preview iframe uses `sandbox="allow-same-origin"` only. **Never add `allow-scripts`** (with same-origin it escapes the sandbox). Never render résumé HTML with `dangerouslySetInnerHTML`.
- Server-side validation in `functions/api/admin/resume.ts` is authoritative; client validation is for feedback only. Keep both using `validateResumeHtml`.
- Admin Functions fail closed (500) when config is missing; `PUT` requires same-origin `Origin`, JSON content type, ≤ 128 KB body and a 40-char `sha`.
- Admin commits use `docs(resume): …` (commitlint has no `content` type).
- The PDF build (`scripts/build-resume.ts`) serves the page from a fake origin via `page.route`, blocks every other request and disables JavaScript. Don't loosen this. It writes nothing unless every document hits its exact page target.
- Career facts (university, club counts, quota attainment) live in `utils/careerFacts.ts`. Change them there, then update both résumé HTML files. The editor warns (without blocking Publish) when a résumé no longer matches (`resume/facts.ts`), and `tests/careerFacts.test.ts` fails in CI if the site, the assistant, the résumés and the fact register disagree.
- Never import `admin/` code from the public site (keeps CodeMirror out of the main bundle).
- Cloudflare Pages settings (Production and Preview): `CF_ACCESS_TEAM_DOMAIN`, `CF_ACCESS_AUD`, `ADMIN_EMAIL`, `GITHUB_TOKEN` (fine-grained PAT, this repo only, Contents RW + Actions R), `GITHUB_REPO`.

## Résumé Content Standards

Reusable prompts: `/resume-update`, `/resume-review`, `/resume-tailor` (`.github/prompts/`).

- **Sources of truth:** `content/resume.html` (executive, exactly 1 page) and `content/resume-ats.html` (ATS, exactly 2 pages). Apply every fact change to **both**. Shared facts change in `utils/careerFacts.ts` first.
- **Facts:** use only facts listed in `content/resume-facts.md`. Never invent metrics, titles, dates or awards. Don't expand or reword items marked **[CONFIRM]**. If a change needs a new fact, ask the owner and add it to the register first.
- **Customer:** never name the customer anywhere in this public repo, including tests and the register. Always write "a top-five global pharmaceutical company". The résumés use "top-five"; the website and assistant keep the owner's LinkedIn wording "top-5".
- **Bullets:** outcome first (result → action → context). Where a bullet has a metric, put it in the first 8 words. Never add a metric just to fit the pattern.
- **Tense:** present tense for ongoing responsibilities in the current role ("Own", "Lead"); past tense for completed results in any role ("Grew", "Structured") and for everything in prior roles.
- **Voice:** no first person ("I", "my", "we") in the ATS version. The executive summary may use it.
- **Typography:** heading `letter-spacing` ≤ 1px. ATS: ligatures off and no decorative glyphs ("5x" not "5×", "approximately"/"about" not "~", "|" separators, real `<li>` bullets).
- **After any change:** run `npm run resume:build` and `npm run resume:check`; both page targets must hold. Run `npm run test:run` (facts test). Then discard the locally built PDFs (`git checkout --` if tracked, delete if new): the Resume PDF Action builds the official ones.

## Testing

- **Framework:** Vitest + React Testing Library
- **Location:** `tests/` directory
- **Naming:** `[filename].test.ts` or `[filename].test.tsx`
- **Run tests before committing:** `npm run test:run`
- **Environment:** jsdom for every file (`tests/setup.ts` needs `window`, so don't add `@vitest-environment node`). Pages Functions are tested by calling `onRequest` with a hand-built context and a stubbed `fetch`
- **Module state:** use `vi.resetModules()` + dynamic `import()` (e.g. the JWKS cache in `adminAuth.test.ts`)
- **Editor tests** mock `HtmlEditor` (CodeMirror) and `PreviewFrame` (iframe layout), since jsdom has no layout

## Git Conventions

- **Commit messages** follow commitlint: `feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert(scope): subject`, subject not starting uppercase
- **Line endings:** the repo is LF. Edit tools on Windows may write CRLF; check with `git diff --check` and normalize before committing (`npm run format` does not fix CRLF)
- **Stage explicit paths** (the owner sometimes drops files into `public/`)

## Patterns to Avoid

```typescript
// ❌ Avoid
const data: any = getData();           // No 'any' types
<button onClick={() => handler()}>     // No inline handlers
console.log('debug');                  // No console.log in production
document.getElementById('x');          // No direct DOM manipulation
```

## CI/CD Validation

GitHub Actions runs on every PR:
1. `npm run type-check`
2. `npm run lint`
3. `npm run test:run`
4. `npm run build`

**All must pass before merge.**

`resume-pdf.yml` runs on pushes to `main` that touch `content/*.html`, `resume/**`, `public/fonts/**` or `scripts/build-resume.ts` (and manually; editing `content/resume-facts.md` doesn't rebuild). It builds every document in `resume/documents.ts`, runs `resume:check`, and commits the PDFs only if they changed (dates are pinned, so rebuilds are deterministic). Only the final push step gets the write token. Admin API calls take `?doc=<id>`; never accept a path from the client.

---

*Last updated: September 27, 2026*

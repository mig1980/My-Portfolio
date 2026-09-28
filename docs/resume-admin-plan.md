# Build Plan: Private Résumé Admin (`/admin/resume`)

> Hand this file to GitHub Copilot (Chat: `#file:docs/resume-admin-plan.md`, or paste each phase into a Copilot coding-agent issue).
> Follow `.github/copilot-instructions.md` for all code conventions.

## Goal

A private page on gavrilov.ai, visible only to Michael. It lets him **edit the résumé's raw HTML/CSS directly** in a code editor, with a side-by-side live preview and a one-page fit meter. When he clicks **Publish**, the change is committed to GitHub, a GitHub Action regenerates `public/CV/MGavrilovCV.pdf`, and Cloudflare Pages redeploys the site.

## Current state (as of Sept 27, 2026)

| Area | Today |
|---|---|
| Stack | React 19 + TS strict + Tailwind v4 + Vite 6, single SPA (`App.tsx` does pathname routing: `/`, `/legal`, else 404) |
| Hosting | Cloudflare Pages (Git-connected), Functions in `functions/api/` (only `chat.ts`), also served at `my-portfolio-bu2.pages.dev` |
| Résumé source | **Outside the repo**: `OneDrive\Documents\CV\source\resume_template.html` + `build.py` (Python + local Edge headless, auto-shrinks to 1 page) |
| Résumé output | `public/CV/MGavrilovCV.pdf` (linked from `constants.tsx` → `resumeUrl`, and referenced in `chat.ts` system prompt) |
| Variants | 2 PDFs: Healthcare & Life Sciences or Global Enterprise title (phone is public, in both). Only *Enterprise* goes on the site |
| CI | `.github/workflows/ci.yml`: lint, format:check, type-check, test:coverage, build on PRs/pushes to `main` |
| Fonts in PDF | Georgia + Segoe UI, which are **not available on Ubuntu runners** |

## Architecture

```
Browser (/admin/resume)             Cloudflare Pages Function            GitHub
┌───────────────────────┐  GET/PUT  ┌─────────────────────────┐  API   ┌───────────────────────┐
│ HTML code editor      │ ────────▶ │ /api/admin/resume       │ ─────▶ │ content/resume.html    │
│ Live preview (iframe) │           │ • verifies CF Access JWT│        │ (commit on main)       │
│ Fit meter             │ ◀──────── │ • GitHub Contents API   │        └──────────┬────────────┘
│ Build status          │           │ • GitHub Actions status │                   │ push (paths filter)
└───────────────────────┘           └─────────────────────────┘                   ▼
        ▲  protected by Cloudflare Access (/admin*, /api/admin/*)     .github/workflows/resume-pdf.yml
        │                                                             • Playwright Chromium
        └──────────── Cloudflare Pages redeploy ◀──── commits public/CV/MGavrilovCV.pdf
```

Key design decisions:

1. **The single source of truth is `content/resume.html`**: the full HTML + `<style>` template Michael edits by hand. It is the same file as today's `OneDrive\Documents\CV\source\resume_template.html`, with the contact line (including the phone, which Michael is fine making public) written directly in it.
2. **One shared TypeScript function** (`resume/render.ts`) fills in `{{TITLE}}` and sets the fit variables (`--fs`, `--gap`). The admin preview, the CI PDF build and the local build all use it, so the preview matches the PDF.
3. **PDF built in GitHub Actions with Playwright** (not in the Cloudflare build, and not by the Function, since Workers can't run Chromium).
4. **Python `build.py` is retired.** `npm run resume:build` replaces it and writes only `public/CV/MGavrilovCV.pdf` in the repo (no OneDrive output). Michael never runs it: the GitHub Action does, and all editing happens in the browser at gavrilov.ai/admin.
5. **Auth = Cloudflare Access at the edge + JWT verification in the Function** (defense in depth). No passwords in the app.
6. **Admin is a separate Vite entry** (`admin/index.html`), so none of its code ends up in the public bundle.
7. **Raw HTML is allowed, but it's contained.** The preview is an `iframe srcdoc` with `sandbox="allow-same-origin"` (scripts never run; same-origin only so the fit meter can measure the page and the fonts load), and it's never injected into the admin React tree. `allow-scripts` must never be added: together with `allow-same-origin` it would let the HTML escape the sandbox. The server rejects `<script>`, `on*=` handlers, `javascript:` URLs, `<iframe>/<object>/<embed>`, and external `http(s)` resources, because fonts and images must be local.

## Target file layout

```
content/resume.html                 # hand-edited HTML + CSS template
resume/render.ts                    # renderResume(html, opts) → HTML string (pure, isomorphic)
resume/validate.ts                  # validateResumeHtml(html) → { ok, errors[] } (shared client/server)
scripts/build-resume.ts             # Playwright: render → fit-to-1-page loop → PDFs
admin/index.html                    # second Vite entry
admin/main.tsx                      # admin app root
admin/ResumeEditor.tsx              # code editor + preview + fit meter + publish
admin/components/…                  # HtmlEditor (CodeMirror), PreviewFrame, FitMeter, BuildStatus, DiffDialog
functions/api/admin/_middleware.ts  # verifies Cf-Access-Jwt-Assertion for all /api/admin/*
functions/api/admin/resume.ts       # GET (read html+sha) / PUT (commit with sha)
functions/api/admin/status.ts       # latest resume-pdf workflow run
.github/workflows/resume-pdf.yml
tests/resumeRender.test.ts
tests/resumeValidate.test.ts
tests/adminResume.test.ts
tests/adminAuth.test.ts
```

## Template contract (`content/resume.html`)

The file is a complete HTML document (`<!DOCTYPE html>` … `</html>`) with one `<style>` block. Michael can change anything, as long as these rules hold:

| Rule | Why |
|---|---|
| Contains `{{TITLE}}` exactly once | Replaced with the HLS or Enterprise title per variant |
| `:root` defines `--fs` and `--gap`, and the CSS uses them | The fit-to-one-page loop overrides them (`--fs` 9.6→9.2pt, `--gap` 1→0.7) |
| `@page { size: Letter; margin: 0; }` | PDF page size |
| Fonts via `@font-face { src: url('/fonts/…') }` only (the site's own Inter + Instrument Serif in `public/fonts/`) | Must work both in the browser preview and in CI (no external URLs) |
| No `<script>`, `on*=` attributes, `javascript:`, `<iframe>`, `<object>`, `<embed>`, `<link>`, external `http(s)` URLs | Safety; the PDF build runs this HTML in Chromium |
| ≤ 100 KB | Size limit |

```ts
// resume/render.ts
export interface RenderOptions {
  variant: 'hls' | 'enterprise';
  fontSizePt?: number;   // overrides --fs
  gap?: number;          // overrides --gap
}
export const TITLES = { hls: 'Strategic Account Director, Healthcare & Life Sciences',
                        enterprise: 'Strategic Account Director, Global Enterprise' } as const;
export function renderResume(html: string, opts: RenderOptions): string;

// resume/validate.ts: runs in the editor (live error list) AND in the Function (authoritative)
export function validateResumeHtml(html: string): { ok: boolean; errors: string[] };
```

Rendering = string replacement + injecting a `<style>:root{--fs:…;--gap:…}</style>` override right before `</head>`. It never parses or rewrites the rest of Michael's markup.
---

## Phases (one PR each)

### Phase 1: Move the résumé template into the repo (no UI yet)

- **Done (Sept 27, 2026).** Template copied to `content/resume.html` (LF line endings).
- **Fonts (done):** switched to the site's own `public/fonts/` files (Inter body, Instrument Serif name + tagline). To keep today's one-page fit, body gets `letter-spacing: -0.01em` and `--lh` 1.17 → 1.13; the tagline is 11pt. Measured with Edge: same height as the old Georgia/Segoe version, fits at 9.4pt / gap 0.7.
- Implement `resume/render.ts` (title fill, CSS variable override) and `resume/validate.ts` (every rule in the Template contract).
- Tests: title replaced and escaped; override injected; each forbidden pattern is rejected with a readable message; the current template passes validation.
- **Update (Sept 27, 2026):** the phone is public, so the contact line (location | phone | email | LinkedIn | website) is plain HTML in the template. The `{{CONTACT}}` placeholder, phone injection and phone-number check were removed.

**Acceptance:** `npm run test:run` passes, and `renderResume(html, {variant:'enterprise'})` opened in a browser looks like the current PDF.
### Phase 2: PDF build script and GitHub Action

- Add dev deps: `playwright` (Chromium only) and `tsx`.
- `scripts/build-resume.ts`:
  - Read `content/resume.html`, run `validateResumeHtml` (fail on errors), render, then `page.pdf({ format: 'Letter', printBackground: true, margin: 0 })`.
  - Fit loop over `fontSizePt ∈ [9.6, 9.5, 9.4, 9.3, 9.2] × gap ∈ [1, .85, .7]`. Measure `document.body.scrollHeight ≤ 11in` before printing (faster than printing each try).
  - **Fail with exit 1 if it can't fit on one page.** Never write a 2-page PDF.
  - Writes `public/CV/MGavrilovCV.pdf` (Enterprise title). No other outputs.
- npm script: `"resume:build": "tsx scripts/build-resume.ts"`.
- `.github/workflows/resume-pdf.yml`:
  - `on: push` to `main`, `paths: [content/resume.html, resume/**, public/fonts/**, scripts/build-resume.ts]`, plus `workflow_dispatch`.
  - `permissions: contents: write`, `concurrency: resume-pdf` (cancel in progress).
  - Steps: checkout, setup-node 20, `npm ci`, `npx playwright install --with-deps chromium`, `npm run resume:build`. If the PDF changed, commit `chore(resume): regenerate PDF` as `github-actions[bot]` and push.
  - Loop-safe: the PDF isn't in the `paths` filter, and pushes made with `GITHUB_TOKEN` don't trigger workflows.
- No `.env` entries needed.
- **Done (Sept 27, 2026)**, with these details:
  - The page is served from a fake `https://resume.local` origin via `page.route` (HTML from memory, fonts from `public/fonts/`); every other request is blocked and page JavaScript is disabled.
  - Each candidate is also printed and page-counted; only a verified 1-page PDF is written.
  - PDF dates are pinned to the last commit touching the résumé sources (`resume/pdf.ts`), so rebuilding unchanged content gives identical bytes and the Action doesn't commit noise.
  - Windows (incl. ARM64) prints with the installed Edge (`channel: 'msedge'`). **Update (Sept 27, 2026):** CI also runs on `windows-latest` with Edge on Node 22. Linux Chromium placed glyphs so that pdf.js read headings as "E X E C U T I V E" and failed `resume:check`, and pdfjs-dist v6 needs Node 22. If the check fails, the job uploads the PDFs as a `resume-pdfs` artifact.
  - Bullets are a CSS triangle instead of `▸`, which Inter doesn't include (it fell back to a system font that CI lacks).
  - The commit step runs only on `main`, so a manual run on another branch just validates.

**Acceptance:** editing `content/resume.html` on a branch, then merging, produces a new PDF commit, and Cloudflare deploys it.

### Phase 3: Auth layer (build before any admin endpoint)

- `functions/api/admin/_middleware.ts` runs for every `/api/admin/*` request:
  - Reads the `Cf-Access-Jwt-Assertion` header and verifies it (RS256) against `https://<TEAM>.cloudflareaccess.com/cdn-cgi/access/certs`. Check `aud === CF_ACCESS_AUD`, `iss`, `exp`, and that `email === ADMIN_EMAIL`.
  - Uses WebCrypto (`crypto.subtle.importKey('jwk', …)`). Cache the JWKS in module scope for 10 minutes. `jose` is acceptable if it keeps the code much simpler.
  - Returns 401 JSON on failure. Every response gets `Cache-Control: no-store`.
- Env/secrets in Cloudflare Pages: `CF_ACCESS_TEAM_DOMAIN`, `CF_ACCESS_AUD`, `ADMIN_EMAIL`.
- `public/_headers`: add a `/admin/*` block with `X-Robots-Tag: noindex, nofollow` and `Cache-Control: no-store`. Add `Disallow: /admin` to `robots.txt`.
- Tests (`tests/adminAuth.test.ts`): missing header → 401, bad signature → 401, wrong aud → 401, expired → 401, wrong email → 403, valid → passes through. Generate a test RSA key in the test and mock the JWKS fetch.
- **Done (Sept 27, 2026)** (code only; works live after the Manual setup). Also: `alg` must be exactly RS256, claims are read only after the signature verifies, unknown `kid` triggers one JWKS refetch (key rotation), JWKS outage → 503, missing/invalid config → 500 (fails closed), and the team domain must be `*.cloudflareaccess.com`. The verified email is passed on as `context.data.adminEmail`.

**Acceptance:** `curl https://gavrilov.ai/api/admin/resume` returns the Access login redirect or 401, never data.

### Phase 4: Admin API (GitHub-backed)

- `GET /api/admin/resume` calls the GitHub Contents API `GET /repos/mig1980/My-Portfolio/contents/content/resume.html?ref=main` and returns `{ html, sha }`.
- `PUT /api/admin/resume` takes the body `{ html, sha, message? }`, runs `validateResumeHtml(html)` (422 with the error list if it fails), then `PUT contents` with base64 UTF-8 HTML (normalize to LF line endings), `sha`, `branch: main`, and message `docs(resume): <message or 'update via admin'>` (`content` isn't an allowed commitlint type). GitHub returns 409 when the sha is stale; pass that through so the UI can show "changed elsewhere, reload."
- `GET /api/admin/status` returns the latest run of `resume-pdf.yml` (`status`, `conclusion`, `html_url`, `updated_at`) plus the last commit touching `public/CV/MGavrilovCV.pdf`.
- Secret: `GITHUB_TOKEN`, a **fine-grained PAT** limited to `mig1980/My-Portfolio` with Contents: read/write and Actions: read. Also set `GITHUB_REPO=mig1980/My-Portfolio`.
- Reject bodies over 128 KB. Allow only `GET` and `PUT`. Require `Content-Type: application/json`. Same-origin only (check `Origin` against the allowed list in `chat.ts`).
- Tests mock `fetch` the same way `tests/chat.test.ts` does.
- **Done (Sept 27, 2026)** (code only; works live after the Manual setup). GitHub helpers live in `resume/github.ts`. The same-origin check compares `Origin` with the request's own origin (works on every hostname, no list to maintain). PUT normalizes CRLF → LF, turns the optional message into a one-line lowercase-first subject (≤ 72 chars), and returns `{ sha, commitSha, commitUrl }`. Status reports `run: null` while `resume-pdf.yml` isn't on `main` yet. Missing/invalid `GITHUB_TOKEN`/`GITHUB_REPO` → 500; GitHub errors → 502 (token never echoed).

### Phase 5: Admin UI

- Vite multi-page: `build.rollupOptions.input = { main: 'index.html', admin: 'admin/index.html' }`. Cloudflare serves `/admin/` from `dist/admin/index.html`. Check that `App.tsx`'s 404 logic doesn't catch it; it won't, because it's a different HTML file.
- `ResumeEditor.tsx`, a split-screen layout:
  - **Left: HTML code editor.** Use **CodeMirror 6** (`@codemirror/lang-html`, `@uiw/react-codemirror` or a thin wrapper) with syntax highlighting, autoclose tags, search/replace (Ctrl+F/Ctrl+H), line numbers, fold and word-wrap toggle. Loaded only in the admin bundle. Monaco is too heavy.
  - **Right: live preview.** `<iframe sandbox="allow-same-origin" srcdoc={renderResume(html, {variant})}>`, updated with a ~300 ms debounce and scaled to fit the pane at Letter proportions. Toolbar: variant toggle (HLS / Enterprise), zoom (fit / 100%) and a "show page boundary" line at 11in.
  - **Fit meter:** after load, render at the smallest fit settings and compare `contentDocument.body.scrollHeight` with 1056 px. Show "Fits at 9.4pt ✓", or "Over by ~N lines ✗" in red.
  - **Validation panel:** live `validateResumeHtml` errors under the editor. Clicking an error jumps to its line. Publish is disabled while errors exist.
  - Draft autosaved to `localStorage`, with a "Restore unsaved draft?" prompt on load. `beforeunload` guard.
  - Buttons: **Revert** (reload from GitHub), **Download HTML**, **Publish**. Publish opens a confirm dialog with a line diff (`diff` package, or a small LCS implementation), plus an optional commit message, then PUT.
  - After publishing, poll `/api/admin/status` every 10 s until the workflow completes. Then show ✓ with a link to `/CV/MGavrilovCV.pdf?v=<sha>`, or ✗ with a link to the failed Action log.
  - Resizable divider between panes. Mobile: tabs (Code / Preview) instead of split.
- Tests: the debounce/render hook, fit-meter math, validation-panel rendering, and the publish flow with mocked fetch (200, 409 stale sha, 422 validation).
- **Done (Sept 27, 2026)** (verified in a real browser with the API mocked; works live after the Manual setup). Deviations, all simplifications: Enterprise title only (no HLS toggle, since only the site PDF is produced); fixed 50/50 split instead of a resizable divider; fit-to-width zoom only. The fit meter changes `--fs`/`--gap` inside the same-origin preview and measures instantly (no reloads), then shows the page at the setting the PDF build will use. A non-JSON reply (e.g. an Access sign-in page) is shown as an error, never treated as data. The admin chunk (~600 kB, CodeMirror) is never loaded by the public site.
### Phase 6: Cleanup and docs

- Update `README.md` and `.github/copilot-instructions.md` (new folders, commands, admin architecture and the Template contract).
- Optional: extract plain text from `content/resume.html` at build time for `functions/api/chat.ts`'s system prompt, so the AI assistant stays in sync.
- Optional: add a Split/Code/Preview layout toggle, and snippets for common blocks (new role, new bullet).
- Delete `OneDrive\Documents\CV\source\build.py` once `npm run resume:build` is confirmed working.
- **Done (Sept 27, 2026)**: README and project guide updated.

### Phase 7: Résumé content & ATS upgrade (done Sept 27, 2026)

- **A. Executive (1 page):** content ported from the owner's updated `resume_template.html`: one "Microsoft — 2006 – Present" employer block with a single Recognition line, metric-first summary and bullets, keyword variants in Core Expertise. Section headings use `letter-spacing: 1px` (was 2.4px, which pdf.js read as "E X E C U T I V E"). Fits at 9.4pt / gap 0.7.
- **B. ATS version (exactly 2 pages):** `content/resume-ats.html` (single column, plain UPPERCASE headings, real bullets, "5x", Inter with ligatures off, `@page` print margins). `resume/documents.ts` is the registry (`id → src, out, pages, fit, pageMargin, commitScope, requiredText`). The build prints every candidate and needs exactly `pages` pages; it writes nothing unless every document hits its target. Lands at 10.5pt / gap 0.7. The validator allows `@page` margins only for documents with `pageMargin: 'any'`. Admin: Executive | ATS switcher (`?doc=`, allow-listed server-side), per-document drafts, sha, status and page-target badge (the multi-page preview is an estimate; the build is exact). `/CV/MGavrilovCV-ATS.pdf` is `noindex` and not linked from the site.
- **C. ATS-readability check:** `npm run resume:check` (`scripts/check-resume-text.ts`, pdf.js) fails on a wrong page count, split words ("E XECUTIVE" or "E X E C U T I V E"), ligature characters, or missing/out-of-order phrases (name → title → summary → experience → Microsoft → current role → Education; the ATS version expects the current role before "Microsoft", since each role line ends with the company). Runs in `resume-pdf.yml` after the build, before committing. Verified: the old committed PDF fails it; both new PDFs pass.
- **D. Validation:** type-check, lint, 314 tests, build, `resume:build`, `resume:check` all pass.

### Follow-ups before the first push (done Sept 27, 2026)

- **Validator decodes first:** HTML entities and CSS escapes are decoded before any check; URL attributes use an allow-list (relative, `data:`, `#`; only `<a href>` may link out; every `srcset` candidate is checked).
- **One source for career facts:** `utils/careerFacts.ts` feeds the website and the AI assistant; `tests/careerFacts.test.ts` checks both résumés match. Quota attainment reads "100%+ quota attainment in 9 fiscal years, including FY25 and FY26" on the site and in the assistant; the check compares the facts, not the exact phrasing.
- **Employer headings:** Instrument Serif 16pt, larger than role titles; margins trimmed so the executive page still fits at 9.4pt.
- **Fact cross-check:** the editor warns, without blocking Publish, when a résumé's shared facts no longer match the website and the assistant (`resume/facts.ts`); the same check runs in `tests/careerFacts.test.ts`.
- **Publish dialog:** the page behind it is `inert` while it's open, the diff scrolls by keyboard, and focus returns to Publish on close.
- **Admin CSP:** `/admin` and `/admin/*` add a second, stricter policy (no inline scripts, same-origin only); browsers enforce both.
- **Validation:** type-check, lint, 336 tests (23 files), build, `resume:build` (executive 1 page at 9.4pt, ATS 2 pages at 10.5pt) and `resume:check` all pass.

### Status

Live on `main` since Sept 27, 2026. The Manual setup below is done, and the owner publishes from `gavrilov.ai/admin/`.

### Changes after launch (Sept 27, 2026)

- **ATS role lines:** `Title | Company | Mon YYYY – Mon YYYY` with LinkedIn dates; the grouped Microsoft block is gone. Lands at 11pt / gap 0.7.
- **Executive:** no first person, "5×", recognition "Two-time Platinum Club and three-time Gold Club · 100%+ quota attainment in 9 fiscal years". Keeps the grouped Microsoft heading and year-only dates. Fits at 9.4pt / gap 0.7.
- **Dates everywhere (site, assistant, both résumés):** Strategic Account Director Feb 2017 – Present; Senior Account Executive Apr 2011 – Jan 2017.
- **Fact check compares facts, not phrasing:** "Platinum Club (2×)" and "Two-time Platinum Club" both pass; a stated year count must be 9.
- **Validation:** 336 tests (23 files), build, `resume:build` and `resume:check` all pass.

---

## Manual setup (done Sept 27, 2026)

Kept for reference: renew the GitHub token before it expires (1 year).

1. **Cloudflare Zero Trust → Access → Applications → Self-hosted**
   - Domains: `gavrilov.ai/admin*`, `gavrilov.ai/api/admin/*`, **and** `my-portfolio-bu2.pages.dev/admin*`, `*.my-portfolio-bu2.pages.dev/admin*` and the matching `/api/admin/*` paths. Preview deployments would otherwise expose the admin page.
   - Policy: Allow, with Emails = your address only. Identity provider: GitHub or one-time PIN.
   - Copy the **Application Audience (AUD) tag** and your **team domain**.
2. **GitHub**: create the fine-grained PAT described in Phase 4 (expires in 1 year, and set a reminder to renew it).
3. **Cloudflare Pages → Settings → Variables & Secrets (Production and Preview)**: `GITHUB_TOKEN`, `GITHUB_REPO`, `CF_ACCESS_TEAM_DOMAIN`, `CF_ACCESS_AUD`, `ADMIN_EMAIL`.
4. **Branch protection on `main`** (if enabled): allow `github-actions[bot]` to push, or change the workflow to open a PR (see Decisions).

## Decisions to make before starting

| # | Question | Recommendation |
|---|---|---|
| 1 | PDF fonts (Georgia/Segoe UI aren't on Linux) | **Decided: reuse the site fonts** (Instrument Serif for the name, Inter for body). Done in Phase 1. |
| 2 | Publish directly to `main`, or through a PR? | **Direct to `main`** (it's your personal site, and the HTML is validated server-side). Add a "Save draft" later that commits to a `resume/draft` branch to get a Cloudflare preview URL. |
| 3 | Should the site show the HLS or the Enterprise title? | Keep **Enterprise** (current behavior). |
| 4 | Should the admin page also edit website content (`constants.tsx`)? | **Not now.** Do Phase 6 optional items later. |

## Security checklist (review each PR against this)

- [ ] `/admin*` and `/api/admin/*` are behind Access on **every** hostname, including `*.pages.dev`
- [ ] The Function verifies the JWT itself (doesn't rely on Access alone)
- [ ] The PAT is fine-grained, limited to one repo, with minimal scopes, and stored only as a Cloudflare secret
- [ ] User HTML is only rendered inside `iframe sandbox="allow-same-origin"` (never `allow-scripts`), and never via `dangerouslySetInnerHTML`. The validator blocks scripts, event handlers and external URLs on both client and server
- [ ] Server-side validation (authoritative), 128 KB limit and sha-based concurrency on PUT
- [ ] `noindex` + `no-store` on admin routes. Nothing from admin is in the public bundle

## Suggested Copilot prompts

Use one per phase (Copilot Chat in agent mode, or as the body of a coding-agent issue):

> Implement **Phase N** of `docs/resume-admin-plan.md`. Follow `.github/copilot-instructions.md`. Keep the change limited to this phase. Add the listed tests. Run `npm run type-check && npm run lint && npm run test:run && npm run build`, and fix anything that fails before finishing.

For Phase 1, attach `OneDrive\Documents\CV\source\resume_template.html`, or paste it in, because Copilot can't see your OneDrive.

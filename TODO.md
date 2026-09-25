# TODO

Planned improvements from the design, functionality, and content review (2026-09-25).
Priority: **P0** = quick win / bug, **P1** = high impact, **P2** = medium, **P3** = nice to have.

## Phase 1: Quick wins

- [x] **P0** Chat greeting bubble covers the "Start a Conversation" button on desktop, and the chat button overlaps the hero headline on mobile. Move the chat button to bottom-right, put Back to Top above it, and delay the greeting until the visitor scrolls past the hero (`components/ChatWidget.tsx`, `components/BackToTop.tsx`) (redesign branch)
- [x] **P0** Show the hero headshot at full opacity; keep the gradient only behind the name caption (`components/Hero.tsx`) (redesign branch)
- [x] **P0** Add a "Download résumé" button in the hero or nav and in Contact (`public/CV/Michael-Gavrilov-Resume.pdf` is never linked on the page) (redesign branch)
- [ ] **P1** Replace the Robert Herjavec "sell feelings" quote with your own principle or a testimonial (`components/MyApproach.tsx`)
- [x] **P1** Replace the "Open to Strategic Conversations" badge with a clear ask, e.g. "Talking with leaders about AI in Life Sciences" (`components/Hero.tsx`) (redesign branch)

## Phase 2: Conversion

- [ ] **P1** Redesign Contact as a full call-to-action block: headline, "Book a call" button (Microsoft Bookings or Calendly), email and LinkedIn with text labels, and the résumé download (`components/Contact.tsx`) (redesign branch done except the booking link, which needs your URL)
- [ ] **P2** Optional contact form behind a Cloudflare Turnstile spam check
- [x] **P2** Track button clicks, résumé downloads, and outbound clicks (LinkedIn, QuantumInvestor) in GA4 (`utils/analytics.ts`) (redesign branch: résumé, contact, hero questions)
- [ ] **P2** Rewrite chat quick questions for specific audiences, e.g. "How does he approach AI adoption in pharma?", "How can I work with him?" (`components/ChatWidget.tsx`)
- [ ] **P2** Highlight the current section in the nav while scrolling; point the logo link at `#hero` instead of `#` (`components/Navigation.tsx`) (logo link done on redesign branch)

## Phase 3: Credibility and content

- [ ] **P1** Add 2–3 anonymized deal stories (challenge → approach → outcome, with a metric)
- [ ] **P1** Add 2–3 short testimonials from LinkedIn recommendations
- [ ] **P1** Check the award letter PDFs in `public/Awards/` and the deal figures against Microsoft's policy on sharing internal material; consider showing badges only
- [ ] **P1** Turn "Thought Leadership" into a real point-of-view section (AI in life sciences articles, talks). Frame QuantumInvestor as a hands-on AI project. Make the nav label, heading, and section ID match (`components/ThoughtLeadership.tsx`, `components/Navigation.tsx`)
- [ ] **P2** Explain "Platinum Club" in plain language; pick stats that don't repeat the awards (`constants.tsx` `STATS`, `AWARDS`) (TCV replaced with "In Multi-Year Agreements", $500M+, on redesign branch)
- [ ] **P2** Split the 2017–present role into chapters or highlights; lead each bullet with a result and cut filler ("robust", "novel") (`constants.tsx` `EXPERIENCE`)
- [ ] **P3** Shorten Life Pillars to one line each or a "Beyond work" strip (`constants.tsx` `INTERESTS`)
- [x] **P3** Tighten the hero text to one plain sentence about the outcome (`components/Hero.tsx`) (redesign branch)

## Phase 4: Design system (all done on the redesign branch)

- [x] **P2** Break up the flat look: alternate section backgrounds and vary layouts (bento grid for Stats + Awards, case-study strip, full-width quote band)
- [x] **P2** Use one heading pattern everywhere via a shared `SectionHeading` component (About is left-aligned with a bar; others are centered)
- [x] **P2** Mobile hero: headline and buttons first, smaller photo or round avatar
- [x] **P3** Add a display typeface for headings (`styles/globals.css`)
- [x] **P3** Add a light theme with a toggle, or change `<meta name="color-scheme">` to `dark` (`index.html`) (site is now light; meta set to `light`)

## Phase 5: Discoverability

- [ ] **P1** Pre-render the page to static HTML at build time so search engines and AI search tools see the content (currently an empty `<div id="root">`)
- [ ] **P1** Generate the chat assistant's facts from `constants.tsx` at build time instead of the hard-coded copy in `functions/api/chat.ts`
- [ ] **P2** Add `public/llms.txt`
- [ ] **P2** Add `alumniOf`, `hasCredential`, and `award` to the Person JSON-LD (`index.html`)

## Technical debt (from the code review)

- [x] ~~Model fallback stopped on 4xx errors (e.g. 404 for a retired model)~~ (fixed in `7916901`)
- [x] ~~Client 30s timeout fired before the server's fallback models ran~~ (fixed in `7916901`)
- [ ] **P1** Add server-side rate limiting for `/api/chat` (Cloudflare rate-limiting rule or Turnstile)
- [ ] **P2** Send the Gemini API key in the `x-goog-api-key` header instead of the `?key=` query string (`functions/api/chat.ts`)
- [ ] **P3** Stop trusting client-supplied `model` turns in chat history
- [ ] **P3** Remove the unused preconnect to `generativelanguage.googleapis.com` (`index.html`)
- [ ] **P3** Remove `'unsafe-inline'` from CSP `script-src` after checking the Cloudflare analytics script (`public/_headers`)
- [ ] **P3** Remove the duplicate `generateId()` in `hooks/useChat.ts` and `utils/analytics.ts`
- [ ] **P3** Update test counts in `.github/copilot-instructions.md` (now 137 tests / 15 files on the redesign branch)

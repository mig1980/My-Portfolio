# AboutMe Portfolio

A modern, performant portfolio website built with React 19, TypeScript, and Tailwind CSS v4.

## Tech Stack

- **React 19** - UI framework with functional components and hooks
- **TypeScript** - Strict mode enabled for type safety
- **Tailwind CSS v4** - Build-time compilation via @tailwindcss/postcss
- **Vite 6** - Fast build tool with optimized chunking
- **Vitest** - Unit testing framework

## Run Locally

**Prerequisites:** Node.js 20.x or higher

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
```

## Project Structure

```
AboutMe/
├── components/          # React components
│   ├── ui/             # Reusable primitives (Card, Section, PageWrapper, etc.)
│   └── [Feature].tsx   # Feature components
├── hooks/              # Custom hooks (useScrollPosition, useCountUp)
├── utils/              # Shared utilities (string, dom, logo)
├── styles/             # Global styles + CSS utilities
├── functions/          # Cloudflare Pages Functions (server-side)
├── types.ts            # TypeScript interfaces
└── constants.tsx       # Application data
```

## Performance Optimizations

- ✅ All components memoized with `React.memo()`
- ✅ Vite manual chunks for better caching (lucide-react separated)
- ✅ CSS utility classes for common patterns (.focus-ring)
- ✅ Shared utilities to avoid code duplication
- ✅ Theme defined once in CSS via `@theme` directive

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

Deployed on Cloudflare Pages with security headers configured in `public/_headers`.

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

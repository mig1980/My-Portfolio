<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

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

# Run tests
npm run test
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
| `npm run test` | Run tests in watch mode |

## Deployment

Deployed on Cloudflare Pages with security headers configured in `public/_headers`.

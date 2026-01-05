# My-Portfolio - Contributing Guide

This is a personal portfolio project. I’m not actively looking for outside contributions, but you’re absolutely welcome to fork it and adapt it for your own use.

## Forking & Usage

- Forks are welcome.
- If you reuse parts of the design/content, please replace personal details (name, photos, contact info, resume files).
- If you find a bug or have a suggestion, opening an issue is the best way to flag it.

## Development Workflow

### Prerequisites

- Node.js 20.x or higher
- npm 10.x or higher

### Setup

```bash
# Clone your fork
git clone https://github.com/<your-username>/My-Portfolio.git
cd My-Portfolio

# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build locally |
| `npm run type-check` | Run TypeScript type checking |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Run ESLint with auto-fix |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check code formatting |
| `npm run test` | Run tests in watch mode |
| `npm run test:run` | Run tests once |
| `npm run test:coverage` | Run tests with coverage report |

### Code Quality Requirements

Before submitting a PR, ensure:

1. **Type Check Passes**: `npm run type-check`
2. **Linting Passes**: `npm run lint`
3. **Tests Pass**: `npm run test:run`
4. **Code is Formatted**: `npm run format`

### Commit Convention

Any clear commit message is fine. If you like Conventional Commits, feel free to use them — it’s optional.

### Branch Naming

Not required for forks. If you do create branches, use whatever naming is convenient.

### Submitting Suggestions

The best way to suggest changes is to open an issue with:

1. What you noticed
2. What you expected
3. A screenshot or steps to reproduce (if relevant)

## Architecture

### Project Structure

```
My-Portfolio/
├── components/          # React components
│   ├── ui/             # Reusable UI primitives (Card, Section, PageWrapper, etc.)
│   └── [Feature].tsx   # Feature components (About, Hero, Timeline, etc.)
├── hooks/              # Custom React hooks (useScrollPosition, useCountUp)
├── utils/              # Shared utilities (string.ts, dom.ts, logo.ts)
├── styles/             # Global styles (Tailwind + custom utilities)
├── types.ts            # Shared TypeScript types
├── constants.tsx       # Application data/content
└── App.tsx             # Root component
```

### Shared Utilities

When adding new functionality, check existing utilities first:

| Utility | Location | Purpose |
|---------|----------|---------|
| `getInitials` | `utils/string.ts` | Extract initials from names |
| `handleImageError` | `utils/dom.ts` | Image fallback handling |
| `getLogoUrl` | `utils/logo.ts` | Generate logo URLs |
| `useScrollPosition` | `hooks/useScrollPosition.ts` | Track scroll state |
| `useCountUp` | `hooks/useCountUp.ts` | Animated number counting |

### CSS Utility Classes

Use these pre-defined classes from `styles/globals.css`:

| Class | Usage |
|-------|-------|
| `.focus-ring` | Focus states for buttons/prominent elements |
| `.focus-ring-inset` | Focus states for inline/text links |

### Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS v4** - Styling
- **Vitest** - Testing
- **ESLint + Prettier** - Code quality

## Questions?

Feel free to open an issue for any questions or suggestions!

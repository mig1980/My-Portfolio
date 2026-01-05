# GitHub Copilot Instructions - AboutMe Portfolio

> Concise instructions for Copilot to work efficiently in this repository.

## Project Overview

**Type:** React 19 SPA - Professional Portfolio Website  
**Stack:** TypeScript (strict), Tailwind CSS v4, Vite 6, Vitest  
**Deployment:** Cloudflare Pages with Edge Functions  
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

# Full validation sequence
npm run type-check && npm run lint && npm run test:run && npm run build
```

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
│   └── ui/                 # Reusable primitives (Card, Section, etc.)
├── hooks/                  # Custom React hooks
│   ├── useChat.ts          # Chat state management
│   ├── useScrollPosition.ts
│   ├── useIsMobile.ts
│   ├── useOnlineStatus.ts
│   ├── useBodyScrollLock.ts
│   ├── useSwipeToDismiss.ts
│   └── useCountUp.ts
├── utils/                  # Pure utility functions
│   ├── analytics.ts        # GA4 tracking
│   ├── string.ts           # String helpers (getInitials)
│   ├── dom.ts              # DOM helpers
│   └── logo.ts             # Logo URL generation
├── functions/api/          # Cloudflare Pages Functions
│   └── chat.ts             # Gemini API proxy with 4-model fallback
├── styles/globals.css      # Tailwind v4 + custom utilities
├── tests/                  # Vitest tests (119 tests, 12 files)
└── public/
    ├── _headers            # Security headers (CSP, CORS)
    └── _redirects          # SPA routing
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

## Testing

- **Framework:** Vitest + React Testing Library
- **Location:** `tests/` directory
- **Naming:** `[filename].test.ts` or `[filename].test.tsx`
- **Run tests before committing:** `npm run test:run`

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

---

*Last updated: January 4, 2026*

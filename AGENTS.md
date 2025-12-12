# AGENTS.md

## Build & Test Commands

```bash
npm run dev              # Start dev server (Vite, HMR at :5173)
npm run build           # TypeScript check + Vite production build → dist/
npm run test            # Run Vitest (jsdom environment)
npm run test:watch      # Run Vitest in watch mode
npm run lint            # ESLint check (ts,tsx, max-warnings 0)
npm run lint:fix        # ESLint auto-fix
npm run type-check      # TypeScript strict check without emit
npm run format          # Prettier formatting
```

## Architecture & Structure

**Tech Stack**: React 18 + TypeScript + Vite + Tailwind CSS + Mermaid diagram library

**Key Directories**:
- `src/components/` - React components (layout, UI)
- `src/hooks/` - Custom hooks (state management: `useDiagramState`)
- `src/utils/` - Helpers (exportHelpers, validationHelpers, environmentHelpers)
- `src/theme/` - Design tokens (colors, constants)
- `src/types/` - TypeScript type definitions
- `src/test/` - Test setup & utilities
- `api/` & `server/` - Backend API endpoints (Stripe, diagram operations)
- `netlify/` & `.github/workflows/` - Deployment configuration

**Key Dependencies**: Mermaid (diagrams), @monaco-editor/react (code editor), html2canvas (PNG export), Stripe (payments), lucide-react (icons)

## Code Style & Conventions

**TypeScript**: Strict mode enabled, ES2020 target. Use path aliases: `@/*`, `@components/*`, `@hooks/*`, `@utils/*`, `@theme/*`, `@types/*`

**Imports**: Use path aliases. Unused params prefix with `_` (e.g., `_unused`).

**React**: Functional components, hooks-based. JSX for React 18.

**Formatting**: Prettier (semicolons, trailing commas, single quotes, 100 char line width, 2-space indent)

**Linting**: ESLint with TypeScript plugin + React hooks rules. Zero warnings allowed.

**Naming**: camelCase for vars/functions, PascalCase for components/types. Private functions can use underscore prefix.

**Error Handling**: Validate inputs (see validationHelpers). Handle API errors gracefully.

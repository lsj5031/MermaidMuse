# Development Guide

This document provides guidelines for developing the MermaidMuse application with its AI-first architecture.

## Getting Started

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Create Environment File**

   ```bash
   cp .env.example .env.local
   ```

3. **Configure AI Provider**

   Choose an AI provider and set up your API key:

   **Groq (Recommended - Free):**

   ```bash
   # Get key from https://console.groq.com/keys
   OPENAPI_API_KEY=gsk_...
   OPENAPI_MODEL=mixtral-8x7b-32768
   OPENAPI_BASE_URL=https://api.groq.com/openai/v1
   ```

   **OpenAI (Production):**

   ```bash
   # Get key from https://platform.openai.com/api-keys
   OPENAPI_API_KEY=sk-...
   OPENAPI_MODEL=gpt-4o
   OPENAPI_BASE_URL=https://api.openai.com/v1
   ```

4. **Start Development Servers**

   ```bash
   # Terminal 1: Frontend dev server
   npm run dev

   # Terminal 2: Workers dev server (for AI features)
   npm run dev:workers
   ```

   The application will be available at `http://localhost:5173`  
   The Workers API will be available at `http://localhost:8787`

## Development Workflow

### Code Quality Checks

Before committing code, ensure all checks pass:

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Format checking
npm run format:check
```

### Automatic Fixes

To fix linting and formatting issues automatically:

```bash
# Fix ESLint issues
npm run lint:fix

# Format code
npm run format
```

## Project Structure

```
src/
├── components/
│   ├── AIAssistant/           # AI features (generate, analyze, refine)
│   │   ├── AIAssistantPanel.tsx
│   │   ├── RefinementChat.tsx
│   │   └── index.ts
│   ├── Credits/              # Credits display and top-up
│   │   └── CreditsWidget.tsx
│   ├── layout/               # Layout components
│   │   ├── Header.tsx         # Top navigation bar
│   │   ├── HeaderModern.tsx   # Modern header with AI features
│   │   ├── MainContent.tsx   # Main layout container
│   │   ├── EditorModern.tsx   # Code editor panel with AI buttons
│   │   └── PreviewModern.tsx  # Diagram preview with zoom/pan
│   ├── editor/               # Editor components
│   │   └── EditorPanel.tsx   # Monaco editor wrapper
│   ├── preview/              # Preview components
│   │   └── PreviewPanel.tsx  # Mermaid diagram rendering
│   ├── ProUpsell/           # Pro feature teasers
│   │   ├── ProGate.tsx
│   │   └── StripeTeaser.tsx
│   └── ...                  # Other UI components
├── hooks/                   # Custom React hooks
│   ├── useDiagramState.tsx   # Global diagram state management
│   ├── useCredits.ts         # Credits system integration
│   ├── useAIAssistant.ts     # AI assistant features (planned)
│   ├── useAIRefinement.ts    # AI refinement features (planned)
│   └── ...                  # Other custom hooks
├── theme/                   # Theme system
│   ├── themeRegistry.ts      # Core theme registry API
│   ├── defaultThemes.ts      # Built-in themes (light, dark, cyber)
│   ├── diagramThemes.ts      # Legacy compatibility
│   ├── colors.ts            # Color palette
│   └── constants.ts         # App constants
├── utils/                   # Helper functions
│   ├── exportHelpers.ts      # Export diagrams (PNG, JSON)
│   ├── generateDiagramApi.ts # AI generation API client
│   ├── fixDiagramApi.ts     # AI fixing API client
│   ├── analyzeDiagramApi.ts  # AI analysis API client (planned)
│   ├── refineDiagramApi.ts   # AI refinement API client (planned)
│   ├── validationHelpers.ts  # Input validation
│   ├── environmentHelpers.ts # Environment variable access
│   └── ...                  # Other utilities
├── server/                  # Server-side AI logic
│   ├── aiGenerate.ts        # AI generation backend
│   ├── xaiFix.ts           # AI fixing backend (supports OpenAPI)
│   ├── aiAnalyze.ts         # AI analysis backend (planned)
│   ├── aiRefine.ts          # AI refinement backend (planned)
│   ├── clerkServer.ts       # Clerk authentication helpers
│   ├── creditsServer.ts     # Credits management
│   ├── stripeServer.ts      # Stripe payment processing
│   └── runtimeEnv.ts        # Environment variable handling
├── workers/                 # Cloudflare Workers entrypoint
│   └── index.ts            # API routes (/api/fix, /api/generate, etc.)
├── styles/                  # Global styles
│   └── validation.css       # Form validation styles
├── test/                    # Test setup and utilities
│   ├── setup.ts            # Test configuration
│   ├── *.test.ts           # Unit and integration tests
│   └── validation.test.ts   # Validation tests
├── App.tsx                  # Root component
├── main.tsx                 # Entry point
└── index.css                # Global styles
```

## Development Workflow

### Code Quality Checks

Before committing code, ensure all checks pass:

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Format checking
npm run format:check
```

### Automatic Fixes

To fix linting and formatting issues automatically:

```bash
# Fix ESLint issues
npm run lint:fix

# Format code
npm run format
```

## Adding New Features

### AI Features

1. **Backend Logic**: Add to `src/server/` following existing patterns
2. **API Client**: Create in `src/utils/` with TypeScript interfaces
3. **Worker Route**: Add to `src/workers/index.ts` with auth and credits
4. **Frontend Hook**: Create in `src/hooks/` for state management
5. **UI Components**: Add to `src/components/AIAssistant/` or appropriate folder

### UI Components

1. Create component file in appropriate directory
2. Use TypeScript and React best practices
3. Import using path aliases: `import { Something } from '@components/...`
4. Test with `npm run type-check` and `npm run lint`

Example:

```typescript
import React from 'react'

interface MyComponentProps {
  title: string
}

export default function MyComponent({ title }: MyComponentProps) {
  return <div>{title}</div>
}
```

### Utility Functions

1. Create or update file in `src/utils/`
2. Export functions with clear names
3. Add TypeScript types
4. Consider adding to appropriate helpers file

### Themes

1. Use theme registry: `import { registerTheme } from '@theme/themeRegistry'`
2. Follow existing theme patterns in `src/theme/defaultThemes.ts`
3. Test with multiple themes in development

### Styling

- Use Tailwind CSS classes in components
- Add custom global styles to `src/index.css`
- Reference theme colors from `src/theme/colors.ts`

## Testing During Development

### Hot Module Replacement (HMR)

Vite provides instant HMR. Changes to files are reflected immediately in the browser.

### TypeScript Errors

The dev server won't block on TypeScript errors, but they'll be shown in the console.
Run `npm run type-check` to identify all type errors.

### Testing AI Features

To test AI features locally:

```bash
# Terminal 1: Start Workers dev server
npm run dev:workers

# Terminal 2: Start frontend dev server
npm run dev
```

Test AI endpoints:

```bash
# Test AI fix
curl -X POST http://localhost:8787/api/fix \
  -H 'Content-Type: application/json' \
  -d '{"diagramText": "flowchart TD\nA -->"}'

# Test AI generation
curl -X POST http://localhost:8787/api/generate \
  -H 'Content-Type: application/json' \
  -d '{"prompt": "User signup flow"}'
```

## Building for Production

```bash
npm run build
```

This creates an optimized build in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

Serves the production build locally to test before deployment.

## Debugging

### Browser DevTools

- Open DevTools with F12 or Cmd+Option+I
- Use React DevTools extension for component debugging
- Console shows any runtime errors

### VSCode Setup (Recommended)

Install these extensions:

- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- ESLint
- Prettier - Code formatter
- TypeScript Vue Plugin

### Debugging AI Features

1. Check API key configuration in `.env.local`
2. Verify Workers dev server is running on port 8787
3. Check browser network tab for API requests
4. Monitor credits balance in Clerk Dashboard
5. Check AI provider dashboard for API usage

### Debugging Diagram Rendering

If Mermaid diagrams aren't rendering:

1. Check browser console for errors
2. Verify syntax with [Mermaid Live](https://mermaid.live)
3. Check diagram state in React DevTools
4. Verify theme configuration in theme registry

## Common Tasks

### Updating Dependencies

```bash
# Check for updates
npm outdated

# Update all dependencies
npm update

# Update a specific package
npm install package@latest
```

### Working with Environment Variables

Client-side variables (exposed to browser):

```typescript
const apiUrl = import.meta.env.VITE_API_URL;
const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
```

Server-side variables (Workers only):

```typescript
// In src/workers/index.ts
const apiKey = env.OPENAPI_API_KEY;
const clerkSecret = env.CLERK_SECRET_KEY;
```

### Adding New AI Features

1. **Backend**: Add to `src/server/` following existing patterns
2. **API Route**: Add to `src/workers/index.ts` with auth and credits
3. **Frontend Client**: Create in `src/utils/` with TypeScript interfaces
4. **Hook**: Create in `src/hooks/` for state management
5. **UI Component**: Add to `src/components/AIAssistant/` or appropriate folder

### Adding New Themes

```typescript
import { registerTheme } from '@theme/themeRegistry';

registerTheme('my-theme', {
  label: 'My Custom Theme',
  mermaid: {
    startOnLoad: false,
    theme: 'base',
    securityLevel: 'loose',
    themeVariables: {
      primaryColor: '#ff0000',
      primaryTextColor: '#ffffff',
      // ... more variables
    },
  },
});
```

## Performance Optimization

### Code Splitting

Vite automatically code-splits at dynamic imports:

```typescript
const HeavyComponent = lazy(() => import('@components/Heavy'));
```

### Bundle Analysis

Check bundle size:

```bash
npm run build
# Look for warnings about chunk sizes
```

### AI Performance

- Use Groq for fastest response times (free)
- Implement response caching for repeated requests
- Set appropriate timeouts for AI operations
- Monitor API usage and costs

## Deployment

### Cloudflare Pages + Workers

This repo is designed for **Cloudflare Pages (frontend)** + **Cloudflare Workers (API)**.

```bash
# Deploy frontend
npm run build
npx wrangler pages deploy dist

# Deploy Workers (API)
npm run deploy:workers
```

### Environment Variables in Production

Set these in Cloudflare Dashboard:

**AI Provider:**

```env
OPENAPI_API_KEY=your-api-key
OPENAPI_MODEL=gpt-4o
OPENAPI_BASE_URL=https://api.openai.com/v1
```

**Authentication:**

```env
CLERK_SECRET_KEY=sk_...
VITE_CLERK_PUBLISHABLE_KEY=pk_...
```

**Payments (optional):**

```env
STRIPE_SECRET_KEY=sk_test_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Troubleshooting

### Port Already in Use

Vite will automatically use the next available port if 5173 is busy.

### AI Features Not Working

1. Check `.env.local` has correct API keys
2. Ensure Workers dev server is running: `npm run dev:workers`
3. Verify API key is valid and active
4. Check credits balance in Clerk Dashboard
5. Monitor AI provider dashboard for API issues

### Module Not Found Errors

- Check path aliases in `tsconfig.json`
- Ensure file extensions are correct
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`

### Type Errors

Run `npm run type-check` to see all type errors in detail.

### ESLint Issues

- Run `npm run lint:fix` to auto-fix common issues
- Update `.eslintrc.cjs` for custom rules

### HMR Not Working

- Restart dev server: `npm run dev`
- Check if file has syntax errors
- Refresh browser

## Resources

### Documentation

- [AI Features Overview](./AI_FEATURES.md) - Complete AI documentation
- [Deployment Guide](./DEPLOYMENT.md) - Production deployment
- [Migration Guide](./MIGRATION.md) - API provider migration
- [Theme System](./THEME_SYSTEM.md) - Custom theme creation
- [AI Providers](./OPENAPI_PROVIDERS.md) - Provider setup

### External Resources

- [Vite Documentation](https://vitejs.dev)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Mermaid Documentation](https://mermaid.js.org)
- [Monaco Editor API](https://microsoft.github.io/monaco-editor)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Clerk Authentication](https://clerk.com/docs)
- [Groq API](https://console.groq.com/docs/)

## Git Workflow

1. Create feature branch: `git checkout -b feature/name`
2. Make changes and test locally
3. Run checks: `npm run lint && npm run type-check && npm run format`
4. Commit: `git commit -m "feat: description"`
5. Push: `git push origin feature/name`
6. Create pull request

## Questions?

Check the main [README.md](../README.md) for project overview and setup instructions.

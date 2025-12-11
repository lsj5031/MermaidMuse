# Development Guide

This document provides guidelines for developing the Diagram Studio application.

## Getting Started

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Create Environment File**

   ```bash
   cp .env.example .env.local
   ```

3. **Start Development Server**

   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5173`

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

## File Organization

### Components

- **Layout Components** (`src/components/layout/`)
  - Header.tsx - Top navigation
  - Sidebar.tsx - Diagram type selector and options
  - MainContent.tsx - Main editor/preview area

- **Editor Components** (`src/components/editor/`)
  - EditorPanel.tsx - Monaco editor for diagram syntax

- **Preview Components** (`src/components/preview/`)
  - PreviewPanel.tsx - Mermaid diagram rendering

### Hooks

- **useDiagramState** (`src/hooks/useDiagramState.tsx`)
  - Global diagram state management
  - Provides context for all diagram operations

### Utilities

- **exportHelpers.ts** - Export diagrams as PNG, JSON, text
- **validationHelpers.ts** - Input validation functions
- **stripeHelpers.ts** - Stripe payment integration
- **environmentHelpers.ts** - Environment variable access
- **threeHelpers.ts** - Three.js utilities

### Theme

- **colors.ts** - Color palette and shadow definitions
- **constants.ts** - Application constants and defaults

## Adding New Features

### Adding a New Component

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

### Adding a New Utility Function

1. Create or update file in `src/utils/`
2. Export functions with clear names
3. Add TypeScript types
4. Consider adding to appropriate helpers file

### Adding Styles

- Use Tailwind CSS classes in components
- Add custom global styles to `src/index.css`
- Reference theme colors from `src/theme/colors.ts`

## Testing During Development

### Hot Module Replacement (HMR)

Vite provides instant HMR. Changes to files are reflected immediately in the browser.

### TypeScript Errors

The dev server won't block on TypeScript errors, but they'll be shown in the console.
Run `npm run type-check` to identify all type errors.

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

### Debugging Diagram Rendering

If Mermaid diagrams aren't rendering:

1. Check browser console for errors
2. Verify syntax with [Mermaid Live](https://mermaid.live)
3. Check diagram state in React DevTools

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

All environment variables must be prefixed with `VITE_` to be exposed to the client.

Access them in code:

```typescript
const apiUrl = import.meta.env.VITE_API_URL;
```

### Adding New Mermaid Diagram Types

1. Add to `DIAGRAM_TYPES` in `src/theme/constants.ts`
2. The sidebar will automatically show the new type
3. Update sample diagrams as needed

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

## Deployment

### Vercel / Netlify

1. Connect repository to platform
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Add environment variables (VITE_API_URL, VITE_STRIPE_KEY)

### Docker

Basic Dockerfile for deployment:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

## Troubleshooting

### Port Already in Use

Vite will automatically use the next available port if 5173 is busy.

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

- [Vite Documentation](https://vitejs.dev)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Mermaid Documentation](https://mermaid.js.org)
- [Monaco Editor API](https://microsoft.github.io/monaco-editor)

## Git Workflow

1. Create feature branch: `git checkout -b feature/name`
2. Make changes and test locally
3. Run checks: `npm run lint && npm run type-check && npm run format`
4. Commit: `git commit -m "feat: description"`
5. Push: `git push origin feature/name`
6. Create pull request

## Questions?

Check the main README.md for project overview and setup instructions.

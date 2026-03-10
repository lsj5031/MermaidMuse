# Development Guide

This document provides guidelines for developing the MermaidMuse application.

## Getting Started

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Start Development Server**

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
  - HeaderModern.tsx - Top navigation with title, export, share
  - EditorModern.tsx - Monaco code editor for Mermaid syntax
  - PreviewModern.tsx - Diagram preview with zoom/pan
  - MainContent.tsx - Main editor/preview area

- **Editor Components** (`src/components/editor/`)
  - EditorPanel.tsx - Monaco editor wrapper

- **Preview Components** (`src/components/preview/`)
  - PreviewPanel.tsx - Mermaid diagram rendering

### Hooks

- **useDiagramState** (`src/hooks/useDiagramState.tsx`)
  - Global diagram state management
  - Provides context for all diagram operations

### Utilities

- **exportHelpers.ts** - Export diagrams as SVG
- **validationHelpers.ts** - Input validation functions
- **environmentHelpers.ts** - Environment variable access
- **mermaidParser.ts** - Mermaid syntax parsing utilities

### Theme

- **themeRegistry.ts** - Pluggable theme system API
- **defaultThemes.ts** - Built-in themes (Avocado, Kanagawa, Dracula, Solarized)
- **colors.ts** - Color palette and shadow definitions
- **constants.ts** - Application constants and defaults

## Adding New Features

### Adding a New Component

1. Create component file in appropriate directory
2. Use TypeScript and React best practices
3. Import using path aliases: `import { Something } from '@components/...`
4. Test with `npm run type-check` and `npm run lint`

### Adding a New Theme

1. Edit `src/theme/defaultThemes.ts`
2. Use `registerTheme()` to add a new theme with Mermaid theme variables
3. The theme will automatically be available in the theme picker

### Adding Styles

- Use Tailwind CSS classes in components
- Add custom global styles to `src/index.css`
- Reference theme colors from `src/theme/colors.ts`

## Testing

```bash
npm run test            # Run tests
npm run test:watch      # Watch mode
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

## AI Syntax Fixing

The application includes an optional AI-powered syntax fixing feature via xAI/Grok:

1. Set `XAI_API_KEY` in your environment
2. The `/api/fix` endpoint will use AI to fix Mermaid syntax errors
3. Works with both Netlify Functions and Vercel serverless functions

## Deployment

### Cloudflare Pages (Recommended)

1. Connect your GitHub repository to Cloudflare Pages
2. Configure build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
3. Every push to `main` automatically deploys

### Manual Deployment

Deploy the `dist/` directory to any static hosting:
- Cloudflare Pages
- Vercel
- Netlify
- GitHub Pages

## Resources

- [Mermaid Documentation](https://mermaid.js.org)
- [Vite Documentation](https://vitejs.dev)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

## Git Workflow

1. Create feature branch: `git checkout -b feature/name`
2. Make changes and test locally
3. Run checks: `npm run lint && npm run type-check && npm run format`
4. Commit: `git commit -m "feat: description"`
5. Push: `git push origin feature/name`
6. Create pull request

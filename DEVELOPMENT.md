# Development Guide

This document provides extensive guidelines for setting up, developing, and deploying the MermaidMuse application.

## 🚀 Getting Started

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Start Development Server**

   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5173` with fast Vite Hot Module Replacement (HMR).

## 📊 Architecture & File Organization

**Tech Stack**: React 18 + TypeScript + Vite + Tailwind CSS + Mermaid 11.12.2

### Key Directories

- `src/components/layout/`
  - `HeaderModern.tsx` - Top navigation with title, export, share, offline status
  - `EditorModern.tsx` - Monaco code editor for Mermaid syntax
  - `PreviewModern.tsx` - Diagram preview with zoom/pan
  - `MainContent.tsx` - Main editor/preview area layout shell
- `src/components/editor/`
  - `EditorPanel.tsx` - Monaco editor wrapper configurations
- `src/components/preview/`
  - `PreviewPanel.tsx` - Pure Mermaid diagram rendering logic
- `src/components/LLMSettingsPanel.tsx`
  - User-configurable API layer for LLM
- `src/hooks/`
  - `useDiagramState.tsx` - Global diagram state management context
  - `useLLMConfig.tsx` - LocalStorage persistent Hook for OpenAI-compatible syntax-fixing features
- `src/theme/`
  - `themeRegistry.ts` - Pluggable theme system API (Avocado, Kanagawa, Dracula, Solarized)
  - `colors.ts`, `constants.ts` - Application layout and styling variables
- `src/utils/`
  - `exportHelpers.ts` - Export diagrams as SVG with watermarks
  - `validationHelpers.ts` - Input sanitization
- `src/server/` & `api/`
  - `llmFix.ts` - Generic OpenAI HTTP proxy handler resolving CORS restrictions (`api/fix.ts` uses this logic under the hood).
- `src/test/` - Unit tests configuration & environment (`npm run test`)

## 🛠 Adding New Features

### Adding a New Theme

1. Navigate to `src/theme/defaultThemes.ts`
2. Define a new theme using `registerTheme(...)`.
3. Provide the basic palette configurations alongside Mermaid `themeVariables`. 
4. The theme will dynamically synchronize with the UI picker, Mermaid renderer, and internal syntax.

### Modifying Styling
- Global layout heavily utilizes Tailwind CSS standard classes (`border-sketch`, `brand-green-light`, etc.).
- Update custom plugins inside `tailwind.config.js`.
- Make overarching CSS fixes in `src/index.css`.

## 🤖 Bring-Your-Own-LLM (BYOLLM) Configuration

MermaidMuse ships with an AI syntax autofixer:
1. Powered by ANY generic OpenAI-compatible completion API (`model`, `messages[]`)
2. Set configuration through the UI Gear-Settings dropdown on the client.
3. Your client hits the serverless function `/api/fix` via `src/server/llmFix.ts` allowing you to securely bridge local settings to API interfaces.

## 🧪 Development Workflow & Quality Assurance

Before committing, run standard suite checks:

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Format checking
npm run format:check

# Testing suite
npm run test
```

### Automatic Fixes

To fix formatting issues locally:

```bash
npm run lint:fix
npm run format
```

## 🔧 Building for Production

```bash
npm run build
```

This ensures TypeScript strict checking and Vite optimization, exporting purely static assets inside `dist/`.

Test production build via:
```bash
npm run preview
```

## 🌐 Deployment (Cloudflare Pages)

1. Connect your repo directly to **Cloudflare Pages**.
2. Settings:
   - **Framework**: Vite
   - **Build command**: `npm run build`
   - **Output directory**: `dist`
3. Optional: Map a custom domain.

## 🤝 Git Workflow

1. `git checkout -b feature/name`
2. Author your changes carefully and write adequate tests where needed.
3. Validate checks: `npm run lint && npm run type-check && npm run format`
4. Commit: `git commit -m "feat: description"`
5. Push `git push origin feature/name` and create a PR to main.

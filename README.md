# Diagram Studio - Vite + React + TypeScript SPA

A modern, cyberpunk-themed diagram editor built with Vite, React, TypeScript, and Mermaid. Perfect for creating flowcharts, sequence diagrams, and other visualizations.

## 🚀 Features

- **Fast Development**: Vite for instant HMR and lightning-fast builds
- **Type Safety**: Full TypeScript support with strict type checking
- **Mermaid Diagrams**: Create complex diagrams with simple syntax
- **Monaco Editor**: Professional code editor with syntax highlighting
- **3D Graphics**: Three.js integration for advanced visualizations
- **Responsive Design**: Tailwind CSS with cyberpunk theme
- **Export Options**: PNG, JSON, and text export formats
- **Stripe Integration**: Ready for payment processing
- **Code Quality**: ESLint and Prettier configured
- **Path Aliases**: Organized imports with @ prefixes

## 📋 Prerequisites

- Node.js 18+
- npm or yarn

## 🔧 Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd diagram-studio
```

2. Install dependencies:

```bash
npm install
```

3. Create environment configuration:

```bash
cp .env.example .env.local
```

4. Update `.env.local` with your configuration:

```env
VITE_API_URL=http://localhost:3000
VITE_STRIPE_KEY=pk_test_your_key_here
```

## 📖 Available Scripts

### Development

```bash
npm run dev
```

Starts the development server at `http://localhost:5173`

### Build

```bash
npm run build
```

Creates an optimized production build in `dist/`

### Preview

```bash
npm run preview
```

Serves the production build locally for testing

### Linting

```bash
npm run lint              # Check for issues
npm run lint:fix         # Auto-fix issues
```

### Formatting

```bash
npm run format           # Format all files
npm run format:check     # Check if formatting is needed
```

### Type Checking

```bash
npm run type-check      # Check TypeScript types
```

## 🎨 Project Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── Header.tsx         # Top navigation bar
│   │   ├── Sidebar.tsx        # Diagram type selector
│   │   └── MainContent.tsx    # Main content area
│   ├── editor/
│   │   └── EditorPanel.tsx    # Monaco editor for diagrams
│   └── preview/
│       └── PreviewPanel.tsx   # Mermaid diagram preview
├── hooks/
│   └── useDiagramState.tsx    # Global diagram state management
├── theme/
│   ├── colors.ts             # Color palette (cyberpunk)
│   └── constants.ts          # App constants and defaults
├── utils/
│   ├── exportHelpers.ts      # Export diagram functions
│   ├── validationHelpers.ts  # Input validation utilities
│   ├── stripeHelpers.ts      # Stripe payment integration
│   ├── environmentHelpers.ts # Environment variable helpers
│   └── threeHelpers.ts       # Three.js utility functions
├── App.tsx                    # Root component
├── main.tsx                   # Entry point
└── index.css                  # Global styles
```

## 🌈 Cyberpunk Theme

The application includes a custom cyberpunk-inspired color scheme:

- **Primary Colors**: Neon pink (#ff006e), cyan (#00f5ff), purple (#b537f2)
- **Accent Colors**: Green (#39ff14), yellow (#fffd38), blue (#0080ff)
- **Dark Theme**: Dark backgrounds with light text for eye comfort

Customize colors in:

- `src/theme/colors.ts` - Color definitions
- `tailwind.config.js` - Tailwind theme configuration

## 📦 Key Dependencies

### Core

- **React 18**: UI library
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server

### Editors & Visualization

- **Mermaid**: Diagram rendering
- **@monaco-editor/react**: Code editor
- **Three.js**: 3D graphics support
- **html2canvas**: Screenshot/export functionality

### Styling

- **Tailwind CSS**: Utility-first CSS framework
- **PostCSS**: CSS processing

### Payments

- **@stripe/stripe-js**: Stripe integration

### Development

- **ESLint**: Code linting
- **Prettier**: Code formatting

## 🔐 Environment Variables

Create a `.env.local` file (use `.env.example` as template):

```env
# API Configuration
VITE_API_URL=http://localhost:3000

# Stripe Configuration
VITE_STRIPE_KEY=pk_test_your_key_here

# Environment (set automatically by Vite)
NODE_ENV=development
```

All environment variables must be prefixed with `VITE_` to be exposed to the client.

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

The `dist/` directory is ready to be deployed to:

- Vercel
- Netlify
- AWS S3 + CloudFront
- GitHub Pages
- Any static hosting provider

### Environment Variables in Production

Set `VITE_API_URL` and `VITE_STRIPE_KEY` in your deployment platform's environment variable settings.

## 💡 Usage Examples

### Creating a Diagram

1. Start the dev server: `npm run dev`
2. Select a diagram type from the sidebar
3. Edit the diagram syntax in the left panel
4. View the preview in the right panel

### Sample Diagram Syntax

```mermaid
graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Process]
    B -->|No| D[Skip]
    C --> E[End]
    D --> E
```

### Using Path Aliases

Instead of:

```typescript
import { useDiagramState } from '../../../hooks/useDiagramState';
```

Use:

```typescript
import { useDiagramState } from '@hooks/useDiagramState';
```

### Exporting Diagrams

```typescript
import { exportDiagramAsPNG, exportDiagramAsJSON } from '@utils/exportHelpers';

// Export as PNG
await exportDiagramAsPNG('preview-container', 'my-diagram');

// Export as JSON
exportDiagramAsJSON(diagramContent, 'my-diagram');
```

## 🔗 Useful Resources

- [Vite Documentation](https://vitejs.dev)
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org)
- [Mermaid Documentation](https://mermaid.js.org)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [Three.js Documentation](https://threejs.org/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [Monaco Editor Documentation](https://microsoft.github.io/monaco-editor)

## 🐛 Troubleshooting

### Port Already in Use

If port 5173 is already in use, Vite will automatically use the next available port.

### Environment Variables Not Working

- Ensure variables are prefixed with `VITE_`
- Restart the dev server after changing `.env.local`
- Check that the file is in the project root

### Mermaid Not Rendering

- Check the diagram syntax is valid
- Open browser console for error messages
- Clear cache with `Ctrl+Shift+Delete` (or `Cmd+Shift+Delete` on Mac)

### TypeScript Errors

```bash
npm run type-check
```

Run this to identify and fix type errors.

## 📝 Code Style

- **Prettier**: Auto-formats code on save (configure in IDE)
- **ESLint**: Enforces code quality rules
- **TypeScript**: Strict mode enabled for maximum type safety

Format code manually:

```bash
npm run format
npm run lint:fix
```

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run linting and type checking: `npm run lint && npm run type-check`
4. Format code: `npm run format`
5. Submit a pull request

## 📄 License

MIT License - feel free to use this project as a template!

## 🎯 Next Steps

After setup, consider:

- [ ] Add user authentication
- [ ] Implement diagram persistence (database)
- [ ] Add diagram sharing/collaboration features
- [ ] Create a plugin system for custom diagram types
- [ ] Build a desktop version with Electron
- [ ] Add AI-powered diagram generation

---

**Happy diagramming! 🎨**

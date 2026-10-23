<div align="center">
  <img src="public/favicon.png" alt="MermaidMuse Logo" width="128" height="128" style="border-radius: 18px;" />
  
  # MermaidMuse
  
  **A modern, minimalist Mermaid diagram editor with Bring-Your-Own-LLM (BYOLLM) AI-powered syntax fixing.**
  
  [![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
  [![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Mermaid](https://img.shields.io/badge/Mermaid-FF3670?style=for-the-badge&logo=mermaid&logoColor=white)](https://mermaid.js.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
</div>

---

MermaidMuse is a lightning-fast, fully open-source environment for crafting beautiful [Mermaid](https://mermaid.js.org/) diagrams. It offers an source editor and real-time live preview powered by [Pele](https://github.com/obsidianmd/pele), and **AI-powered syntax fixing** supported by any OpenAI-compatible API (ChatGPT, xAI/Grok, Ollama, etc.).

## ✨ Features

- ⚡️ **Real-Time Interactive Preview**: Instant diagram rendering with infinite panning, double-click zoom, and up to 800% magnification.
- 🤖 **Bring-Your-Own-LLM (BYOLLM) Syntax Fixing**: Configure your own API key (OpenAI, xAI, Anthropic via proxy, Local Ollama) to automatically fix Mermaid syntax errors directly in the editor.
- 🎨 **Multiple Exquisite Themes**: Choose from hand-crafted themes such as Avocado (light), Kanagawa (dark), Dracula (dark), and Solarized Light for beautiful diagram aesthetics.
- 📐 **Comprehensive Diagram Support**: Pele 1.9.0 supports the built-in Mermaid 12.1 diagram types (Flowcharts, Sequence, Class, State, ER, Gantt, Pie, Mindmap, Timeline, Kanban, Block, Sankey, C4, Git, and User Journey).
- 💾 **Advanced Export Options**: Export the diagram as a standalone SVG or 2× PNG, preserving its selected palette and adding a watermark footer.
- 🌐 **Offline-Ready (PWA)**: Built-in Service Worker and manifest for robust offline resilience. Keep working even when your connection drops.
- 💻 **Professional Editor Built-in**: Plain-text Mermaid source editing with syntax validation and error locations.

## Pele engine migration

Pele 1.9.0 is the only parser and renderer; Mermaid.js, its ELK plugin, and html2canvas are removed. Existing saved source, titles, theme IDs, legacy storage migration, and shared URLs are preserved without rewriting diagram text.

- Pele uses its own layout. The ELK/Dagre selector and hand-drawn switch are removed; old stored preferences remain untouched but have no effect. Node positions, spacing, and edge paths will differ.
- Avocado, Kanagawa, Dracula, and Solarized Light now map to Pele CSS palettes embedded in every SVG. Source frontmatter and init directives still reach Pele, but Mermaid theme/themeVariables, layout and look settings do not control these palettes or restore Mermaid layouts.
- Labels use SVG text (line breaks/bold/italic supported), not arbitrary HTML. Custom icon packs, external plugins such as ZenUML, JavaScript callbacks, and math typesetting are not installed; math labels show source text. Diagram links and external images are disabled for shared-source safety and self-contained exports.
- Preview and exports use Arial with a sans-serif fallback, independent of network fonts. Appearance can vary slightly with fonts available on another device. SVG includes its background, palette, and font declaration; PNG rasterizes that same SVG at 2×, independent of preview zoom/pan.
- Pele limits source to 50,000 characters, output to 4 MB, and flowcharts to 5,000 edges. PNG additionally caps raster area at 32 million pixels and either dimension at 16,384 pixels; use SVG for larger diagrams. Errors are displayed as text and blank source cannot export.

See [Pele compatibility](https://pele.run/compatibility) for syntax differences. The integration tests cover the default sample and 14 other diagram families, source directives, unsafe labels, themes, exports, rapid edits, errors/recovery and persistence.

## 🚀 Quick Start

Ensure you have Node.js 24.22.1+ and npm/yarn installed.

```bash
# 1. Clone the repository
git clone https://github.com/lsj5031/MermaidMuse.git
cd MermaidMuse

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

Visit `http://localhost:5173` to start creating!

## 🤖 Configuring AI Syntax Fixing

MermaidMuse allows you to use **any OpenAI-compatible API** to fix syntax errors automatically. Your API keys are securely stored only in your browser's `localStorage` and act exclusively as a proxy between your client and your selected LLM endpoint.

1. Open **MermaidMuse** in your browser.
2. Click the **Settings (Gear Icon)** in the top navigation bar.
3. Enter your **Base URL** (e.g., `https://api.openai.com/v1` or `http://localhost:11434/v1`).
4. Enter your **API Key** and desired **Model Name** (e.g., `gpt-4o`, `grok-beta`, or `llama3`).
5. When a syntax error occurs, a **"Fix with AI"** button will appear in the Problems Panel to automatically correct it!

## 📖 Available Scripts

- `npm run dev` - Starts the Vite dev server with HMR.
- `npm run build` - Type-checks and builds the production bundle in `dist/`.
- `npm run preview` - Serves the production build locally.
- `npm run lint` / `npm run lint:fix` - Checks/fixes ESLint issues.
- `npm run format` / `npm run format:check` - Formats code using Prettier.
- `npm run type-check` - Validates strict TypeScript types.
- `npm run test` / `npm run test:watch` - Runs the Vitest test suite.

## 🛠 Project Architecture

Engineered with React 18, TypeScript, and Vite, packaged beautifully with Tailwind CSS.

- **`src/components/layout/`**: Core UI shells including `HeaderModern`, `EditorModern`, and `PreviewModern`.
- **`src/theme/`**: Extensible plugin system (`themeRegistry`) managing colors and variables for 2D/3D interactions.
- **`src/hooks/`**: Global state management (`useDiagramState`) and LLM configuration persistence (`useLLMConfig`).
- **`src/utils/`**: Core headless utilities (`exportHelpers`, `validationHelpers`).
- **`src/server/`**: Serverless proxy definitions for safe, CORS-free API communications (`llmFix.ts`).

## ☁️ Deployment

MermaidMuse can be easily deployed to **Cloudflare Pages** (recommended with included `.github/workflows/deploy.yml`), Vercel, Netlify, or any other static hosting provider, due to its lightweight Vite build process.

```bash
npm run build
```

Upload the compiled `dist/` directory directly to your static host.

## 🤝 Contributing

We welcome contributions! Please review the [Development Guide](DEVELOPMENT.md) before getting started.

1. Fork & Clone
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MermaidMuse is [MIT Licensed](LICENSE).

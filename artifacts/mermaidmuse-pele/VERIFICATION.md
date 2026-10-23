# Pele migration verification

- Base checked before edits: origin/main and HEAD both 8b755d30f0b4a30cd900d7fa109698e5d361c21c. Worktree: MermaidMuse-pele, branch feat/pele-engine-20261023. Primary checkout not used for edits.
- Upstream inspected: obsidianmd/pele HEAD e7f092a4de147cc32210913c20e36eaa5fcd0ef1; npm package pele 1.9.0, pinned exactly, repository metadata matches upstream. Read package types, renderer, security/options, font measurement, theme, and compatibility documentation.
- npm run type-check: pass.
- npm run lint: pass.
- npm test: 50 tests across 9 files pass, including 20 real Pele integration cases.
- npm run build: pass (871.08 kB JS / 316.89 kB gzip). Existing Browserslist age notice and bundle >500 kB advisory remain.
- node test-validation.mjs: pass.
- npm ls pele mermaid @mermaid-js/layout-elk html2canvas: only pele@1.9.0 remains.
- git diff --check: pass.
- Changed files formatted with Prettier. Full npm run format:check still flags 13 untouched baseline files: index.html, public/manifest.webmanifest, src/App.css, src/App.tsx, src/components/layout/Button.tsx, src/components/layout/EditorModern.perf.test.tsx, src/components/layout/EditorModern.tsx, src/components/LLMSettingsPanel.tsx, src/hooks/useLLMConfig.tsx, src/index.css, src/server/xaiFix.ts, src/test/LLMSettingsPanel.test.tsx, src/test/xaiFix.test.ts. These unrelated files were not reformatted.
- npm installation reports 32 audit findings in the existing dependency tree (1 low, 5 moderate, 24 high, 2 critical); dependency-wide upgrades are outside this engine migration.

## Browser and exports

Ran verify.mjs using installed Playwright and Chromium on Linux, first against Vite development port 5179 and then production preview port 5180. The script defaults to production; APP_URL overrides it. Its browser module/executable paths are specific to this verification host.

Verified default sample, editing, Dracula palette, SVG and PNG download buttons, invalid syntax clearing preview and disabling export, recovery, localStorage persistence after reload, and opening SVG/PNG independently from app CSS. No page errors. See browser-results.json. Screenshots captured after preview animation completes.

Visually inspected sample.png, dracula.png, recovered.png, standalone-svg.png and diagram.png: readable labels and arrows, selected colors, and a separate watermark footer. diagram.svg is the actual downloaded standalone SVG; diagram.png is the actual 2× PNG. error.png records the error state. standalone-png.png records independent image viewing.

Pele uses synchronous rendering with a cancelled debounce on edit/unmount; obsolete async validation results are rejected by source equality. Blank source cannot export. Tests exercise rapid edits/error/recovery, preserved saved source/title, old settings, built-in sample plus 14 other diagram families, frontmatter/init, escaped unsafe labels, limits, palette embedding and footer geometry. Full cross-browser/mobile/OS font parity is not claimed.

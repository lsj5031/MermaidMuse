# Pele migration verification

## Review fixes (2026-10-23)

Starting commit: 01267e78f5aba321f9a76f68982df43f00f9752e. Applied the minimal-fix ponytail workflow. No repository or ancestor AGENTS.md was present; DEVELOPMENT.md checks were followed.

- Shared validation now calls the same safe renderDiagram helper used by preview/export, catching render-time semantic failures as well as syntax errors. The real-engine regression covers `sankey-beta\nA,B,3\nB,A,2`, shared export eligibility becoming false, cleared preview/error state, and successful editing recovery. This intentionally performs rendering during debounced validation; no new rendering state/cache architecture was introduced.
- Export footers measure their 12px Arial text with browser canvas and widen the SVG width/viewBox and returned PNG dimensions when needed. Environments without canvas use a conservative per-character fallback. Empty watermarks preserve the original dimensions.
- Affected tests: 24 passed. Full suite: 52 tests across 9 files passed. Type-check, lint, production build, standalone Pele smoke check, changed-file Prettier and git diff --check passed. Build: 871.10 kB JS / 316.94 kB gzip. The same 13 baseline files still fail full format:check; no unrelated formatting changes made. Existing Browserslist/bundle advisories remain. jsdom-only provider tests log missing canvas support and successfully use Pele fallback metrics.
- Production Chromium verification passed with no page errors. The circular Sankey assertion waits for the settled shared `1 error` status and checks both SVG/PNG buttons remain disabled; recovery restores the valid preview.
- Downloaded narrow fixture `graph TD\nA`: SVG 93 × 92, viewBox `0 0 93 92`; footer ink bounds x=8.96875, y=73, width=76.345703125, height=14. All text is inside the footer/image. PNG is 186 × 184 (2×), verified after independent decoding in Chromium.
- Visually inspected narrow-standalone-svg.png, narrow.png, circular-error.png and recovered.png: complete unclipped watermark, settled shared error with disabled exports, then recovered preview. Actual downloads narrow.svg/narrow.png and independent-view screenshots are retained beside browser-results.json.
- Fresh origin fetch confirmed main at 8b755d30f0b4a30cd900d7fa109698e5d361c21c and remote feature at 01267e78f5aba321f9a76f68982df43f00f9752e; both ancestor checks passed before committing. Work is confined to the feature worktree; no merge or deployment.

## Original migration verification

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

# MermaidMuse - Bug & Feature Tracker

**Last Updated:** December 12, 2025

## Completed Work (Phase 1) ✅

All critical issues and primary feature requests have been resolved. Current implementation includes:

- ✅ Share dialog UX fixed (mobile native share + desktop clipboard)
- ✅ QR code generation issue resolved
- ✅ Multiple themes system (Avocado, Kanagawa, Dracula, Solarized)
- ✅ Configurable diagram titles with download filename support
- ✅ Mermaid upgraded to 11.12.2 (full diagram type support)
- ✅ Theme persistence via localStorage
- ✅ Theme picker UI in header

---

## Critical Issues (ARCHIVED)

### 1. Share Dialog - Blocking User Interaction

**Status:** COMPLETED  
**Severity:** High  
**Description:**

- Share dialog cannot be dismissed by clicking outside the dialog
- ESC key does not close the dialog
- Dialog blocks switching to other browser tabs
- User is trapped in the modal when opened

**Solution Implemented:**

- ✅ Detect mobile vs desktop platform using user agent
- ✅ On mobile: use native navigator.share() API (system handles dialog behavior)
- ✅ On desktop: bypass system share dialog entirely, copy link directly to clipboard
- ✅ No modal blocking interaction, no need for ESC/backdrop dismiss
- ✅ Updated both Header.tsx and HeaderModern.tsx with same logic

**Files Modified:**

- src/components/layout/HeaderModern.tsx
- src/components/layout/Header.tsx

---

### 2. QR Code Generation Fails

**Status:** COMPLETED  
**Severity:** High  
**Description:**

- QR code generation fails with error: "Unable to generate QR code. Use a link with 400 characters or less"
- Share link is too long (exceeds 400 character limit)
- Affects QR scanning functionality in Share feature

**Solution Implemented:**

- ✅ Removed QR code requirement for desktop users entirely
- ✅ Desktop: simply copy link to clipboard (no character limit issue)
- ✅ Mobile: native share sheet handles QR scanning if needed
- ✅ No URL shortening required anymore
- ✅ Simpler UX, no external service dependencies

**Files Modified:**

- src/components/layout/HeaderModern.tsx
- src/components/layout/Header.tsx

---

## Feature Requests / Enhancements

### 3. Multiple Themes Support

**Status:** COMPLETED  
**Severity:** Medium  
**Description:**

- Currently only 1 theme available
- Website interface looks identical to Mermaid Live Editor
- Need visual differentiation and theme variety

**Solution Implemented:**

- ✅ Renamed default light theme to "Avocado" (original theme)
- ✅ Added Kanagawa theme (dark, warm, Japanese-inspired)
- ✅ Added Dracula theme (dark, vibrant, popular)
- ✅ Added Solarized theme (dark, scientifically designed, readable)
- ✅ All 4 themes apply only to diagram rendering (as requested)
- ✅ Themes persist in localStorage via existing system
- ✅ Theme switching available through useDiagramState hook
- ✅ Added theme picker dropdown in header (Palette icon, shows theme list)
- ✅ Current theme displayed on button, selected theme highlighted in menu

**Files Modified:**

- src/theme/defaultThemes.ts
- src/components/layout/HeaderModern.tsx

---

### 4. Diagram Title / Download Filename

**Status:** COMPLETED  
**Severity:** Medium  
**Description:**

- Downloaded files are named "Untitled Diagram.png"
- Cannot find where to edit/set the diagram title
- Title should be user-configurable and reflect in downloaded filename

**Implementation:**

- ✅ Added title input field in HeaderModern toolbar (center position)
- ✅ Title is stored in state via `updateDiagramTitle` hook
- ✅ Title automatically used in PNG/SVG downloads via existing `currentDiagram.title`
- ✅ Default value: "Untitled Diagram"
- ✅ Title persisted in localStorage (already implemented)
- ✅ Works in both Header.tsx (edit inline) and HeaderModern.tsx (direct input)

---

### 5. Copy/Paste Format Support (Kanban & Block Diagrams)

**Status:** COMPLETED  
**Severity:** Medium  
**Description:**

- User reported paste error when attempting to paste Kanban diagram
- Kanban and Block diagrams were not supported in Mermaid 10.6.1
- This prevented paste operations for these diagram types

**Root Cause:**

- Mermaid 10.6.1 (Oct 2023) did not include Kanban or Block diagram support
- Kanban support was added in Mermaid 11.4.0 (June 2024)

**Solution Implemented:**

- ✅ Upgraded mermaid from ^10.6.1 to ^11.12.2
- ✅ All 15 diagram types now supported (was 13/15 in 10.6.1):
  - Flowchart, Sequence, Class, State, ER, Gantt, Pie, Mindmap, Timeline
  - **Kanban** (NEW), **Block** (NEW), Sankey, C4, Git, User Journey
- ✅ Build succeeds with no breaking changes
- ✅ Verified in dev server - all diagrams parse correctly
- ✅ No code changes needed - drop-in dependency update

**Files Modified:**

- package.json (mermaid version bump)

---

### 6. Mouse Button Support for Shape Movement

**Status:** TODO  
**Severity:** Low  
**Description:**

- Only left mouse button can move/drag shapes
- Middle mouse button does NOT work for dragging
- Right mouse button does NOT work for dragging

**Expected Behavior (Industry Standard):**

- Left click: drag shapes
- Middle click: pan/scroll canvas
- Right click: context menu
- Follow excalidraw/Figma conventions

---

### 7. Missing Features: Emoji & Handwriting Style Support

**Status:** TODO  
**Severity:** Low  
**Description:**

- Official Mermaid supports emoji characters in diagrams
- Official Mermaid supports handwriting style (similar to excalidraw)
- These features are not available in MermaidMuse

**Expected:**

- Add emoji support in diagram text
- Add handwriting/sketch style option for shapes and connectors
- Enable visual parity with official Mermaid Live Editor

---

## Next Phase (Phase 2 - Enhancements)

Lower-priority features and polish improvements:

1. **Mouse Button Support** - Middle/right mouse button handling for navigation
2. **Emoji Support** - Add emoji character support in diagrams
3. **Handwriting Style** - Add sketch/handwriting visual style option
4. **Additional Themes** - Expand theme library (Nord, Gruvbox, etc.)
5. **Diagram Export Formats** - Additional export options (SVG optimization, PDF, etc.)
6. **Undo/Redo UI** - Visual undo/redo history panel
7. **Keyboard Shortcuts Panel** - In-app keyboard shortcuts reference

---

## Development Notes

- MermaidMuse now has feature parity with official Mermaid Live Editor for core functionality
- All 15 diagram types fully supported (Mermaid 11.12.2)
- Theme system is extensible and easy to add new themes
- Mobile and desktop experiences are optimized separately

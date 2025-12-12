# Pluggable Theme System

MermaidMuse now uses a fully pluggable theme system. This allows users and developers to register custom themes that work with Mermaid diagrams.

## Overview

The theme system is built around a central registry where themes can be registered and retrieved at runtime. Themes can be added at application startup or dynamically after the app has loaded.

## Architecture

### Key Files

- **`src/theme/themeRegistry.ts`** - Core registry and API for managing themes
- **`src/theme/defaultThemes.ts`** - Built-in default themes (light, dark, cyber)
- **`src/theme/diagramThemes.ts`** - Legacy compatibility exports
- **`src/hooks/useDiagramState.tsx`** - Hook that integrates theme system with diagram state

### Core API

#### `registerTheme(id: string, config: DiagramThemeConfig)`

Register a new theme in the global registry.

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
      primaryBorderColor: '#ffaaaa',
      lineColor: '#ff0000',
      // ... other Mermaid theme variables
    }
  }
});
```

#### `getTheme(id: string)`

Retrieve a theme configuration by ID.

```typescript
import { getTheme } from '@theme/themeRegistry';

const theme = getTheme('cyber');
```

#### `getThemeIds()`

Get all registered theme IDs.

```typescript
import { getThemeIds } from '@theme/themeRegistry';

const ids = getThemeIds(); // ['light', 'dark', 'cyber']
```

#### `getMermaidConfigForTheme(id: string)`

Get just the Mermaid configuration for a theme.

```typescript
import { getMermaidConfigForTheme } from '@theme/themeRegistry';

const mermaidConfig = getMermaidConfigForTheme('dark');
mermaid.initialize(mermaidConfig);
```

#### `hasTheme(id: string)`

Check if a theme exists in the registry.

```typescript
import { hasTheme } from '@theme/themeRegistry';

if (hasTheme('my-theme')) {
  // Theme exists
}
```

#### `clearAllThemes()`

Clear all registered themes (useful for testing).

```typescript
import { clearAllThemes } from '@theme/themeRegistry';

clearAllThemes();
```

## Theme Configuration

A `DiagramThemeConfig` contains:

```typescript
interface DiagramThemeConfig {
  label: string;           // Display name for the theme
  mermaid: MermaidConfig;  // Mermaid configuration object
}
```

### Mermaid Theme Variables

The `mermaid` configuration uses [Mermaid's theme variables](https://mermaid.js.org/syntax/theming.html). Key variables include:

- `primaryColor` - Main node/shape background
- `primaryTextColor` - Text color on primary elements
- `primaryBorderColor` - Border color for main elements
- `lineColor` - Connection/edge color
- `secondaryColor` - Secondary background color
- `tertiaryColor` - Tertiary background color

## Adding Custom Themes

### At Application Startup

In `src/main.tsx` or `src/App.tsx`:

```typescript
import { registerTheme } from '@theme/themeRegistry';

// Register custom theme before rendering
registerTheme('custom-bright', {
  label: 'Custom Bright',
  mermaid: {
    startOnLoad: false,
    theme: 'base',
    securityLevel: 'loose',
    themeVariables: {
      primaryColor: '#ffffff',
      primaryTextColor: '#000000',
      primaryBorderColor: '#cccccc',
      lineColor: '#333333',
      secondaryColor: '#f0f0f0',
      tertiaryColor: '#e0e0e0',
    }
  }
});
```

### Dynamically at Runtime

Users or plugins can register themes at any time:

```typescript
import { registerTheme } from '@theme/themeRegistry';

// User clicks "Create Theme" button
function createCustomTheme(name: string, colors: ColorConfig) {
  registerTheme(`user-${name}`, {
    label: name,
    mermaid: {
      startOnLoad: false,
      theme: 'base',
      securityLevel: 'loose',
      themeVariables: {
        primaryColor: colors.primary,
        primaryTextColor: colors.text,
        primaryBorderColor: colors.border,
        lineColor: colors.edge,
        // ... more variables
      }
    }
  });
}
```

## Current Default Themes

### Light
- Clean, high-contrast theme suitable for presentations
- Light backgrounds with dark text
- Blue and purple accents

### Dark
- Dark backgrounds with light text
- Suitable for reduced eye strain
- Cool blue and purple highlights

### Cyber
- Cyberpunk aesthetic with neon colors
- Cyan edges (#00f5ff)
- Neon pink (#ff006e), purple (#b537f2), and lime accents
- Retro-futuristic feel

## Theme Persistence

The selected theme is persisted to localStorage using the key `diagramStudio.theme`. The app will restore the user's last selected theme on page reload.

## Integration with Components

### Using Themes in Components

Access the current theme via `useDiagramState`:

```typescript
import { useDiagramState } from '@hooks/useDiagramState';

export default function MyComponent() {
  const { theme } = useDiagramState();
  
  return <div>Current theme: {theme}</div>;
}
```

### Rendering with Mermaid

```typescript
import { getMermaidConfigForTheme } from '@theme/themeRegistry';
import mermaid from 'mermaid';

const config = getMermaidConfigForTheme(theme);
if (config) {
  mermaid.initialize(config);
}

const { svg } = await mermaid.mermaidAPI.render('diagram-id', mermaidContent);
```

## Migration from Old System

The old system with hardcoded theme options has been replaced. If you have code referencing old theme exports:

**Before:**
```typescript
import { DIAGRAM_THEME_CONFIG } from '@theme/diagramThemes';
```

**After:**
```typescript
import { getTheme, getAllThemes } from '@theme/themeRegistry';
```

The legacy exports in `diagramThemes.ts` are re-exported from `themeRegistry.ts` for backward compatibility.

## Future Enhancements

Potential improvements to the theme system:

1. **Theme Editor UI** - Let users create and customize themes visually
2. **Theme Marketplace** - Share/download community-created themes
3. **Per-Diagram Theme Config** - Store theme settings with diagrams
4. **Advanced Mermaid Variables** - Expand support for more Mermaid theme options
5. **Export/Import Themes** - Let users save themes to files

## Examples

### Simple Theme Registration

```typescript
// Minimal theme for high-contrast accessibility
registerTheme('hc-dark', {
  label: 'High Contrast Dark',
  mermaid: {
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'loose',
  }
});
```

### Complex Theme with All Variables

```typescript
registerTheme('sepia', {
  label: 'Sepia',
  mermaid: {
    startOnLoad: false,
    theme: 'base',
    securityLevel: 'loose',
    themeVariables: {
      primaryColor: '#c4a57b',
      primaryTextColor: '#3e2723',
      primaryBorderColor: '#8b6f47',
      lineColor: '#a1887f',
      secondaryColor: '#d7ccc8',
      tertiaryColor: '#efebe9',
      noteBkgColor: '#f5f5f5',
      noteTextColor: '#3e2723',
      actorBkg: '#efebe9',
      actorBorder: '#8b6f47',
    }
  }
});
```

## Testing

```typescript
import { registerTheme, getTheme, clearAllThemes, hasTheme } from '@theme/themeRegistry';

// Clear any existing themes
clearAllThemes();

// Register test theme
registerTheme('test', {
  label: 'Test',
  mermaid: { startOnLoad: false, theme: 'dark', securityLevel: 'loose' }
});

// Verify
assert(hasTheme('test'));
assert(getTheme('test')?.label === 'Test');
```

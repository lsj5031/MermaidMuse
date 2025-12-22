# Migration Guide

This guide covers all migration scenarios for MermaidMuse, including API provider migration and architectural changes.

---

## 🔄 Part 1: API Provider Migration (xAI → OpenAPI-Compatible)

### Overview

MermaidMuse has migrated from the xAI/Grok API to OpenAPI-compatible endpoints. This change:

✅ **Increases flexibility** - Support for any OpenAI-compatible API (OpenAI, Groq, etc.)  
✅ **Reduces vendor lock-in** - Switch providers without code changes  
✅ **Simplifies deployment** - Uses Cloudflare Workers for serverless API routes  
✅ **Maintains backward compatibility** - Old xAI variables still work as fallback

### Environment Variables

**Old (xAI)**:

```env
XAI_API_KEY=xai_...
XAI_MODEL=grok-beta
XAI_BASE_URL=https://api.x.ai/v1
```

**New (OpenAPI-compatible)**:

```env
OPENAPI_API_KEY=sk-...
OPENAPI_MODEL=gpt-4o
OPENAPI_BASE_URL=https://api.openai.com/v1
```

### Migration Steps

#### Step 1: Choose Your Provider

| Provider | Cost     | Speed          | Privacy      | Setup |
| -------- | -------- | -------------- | ------------ | ----- |
| **Groq** | **Free** | ⚡⚡⚡ Fastest | Medium       | Easy  |
| OpenAI   | $$$      | ⚡⚡ Fast      | Low          | Easy  |
| LocalAI  | Free     | ⚡ Medium      | ⭐ Excellent | Hard  |
| Ollama   | Free     | ⚡ Slow        | ⭐ Excellent | Easy  |

#### Step 2: Get API Credentials

**For OpenAI:**

1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Copy the key (starts with `sk-`)

**For Groq:**

1. Go to https://console.groq.com/keys
2. Create a new API key
3. Copy the key (starts with `gsk_`)

**For LocalAI (self-hosted):**

```bash
docker run -p 8080:8080 localai/localai:latest
```

**For Ollama (self-hosted):**

```bash
# Install from https://ollama.ai
ollama pull llama2
ollama serve
```

#### Step 3: Update Environment Variables

**Local Development** - Update `.env.local`:

```env
# Remove old xAI variables (optional, kept for fallback)
# XAI_API_KEY=...

# Add new OpenAPI variables
OPENAPI_API_KEY=your-api-key-here
OPENAPI_MODEL=gpt-4o
OPENAPI_BASE_URL=https://api.openai.com/v1
```

**Production (Cloudflare Workers)**:

1. Go to Cloudflare Dashboard
2. Navigate to your Worker
3. Go to **Settings** > **Environment Variables**
4. Add the variables:
   ```
   OPENAPI_API_KEY=your-api-key
   OPENAPI_MODEL=gpt-4o
   OPENAPI_BASE_URL=https://api.openai.com/v1
   ```

#### Step 4: Test Configuration

```bash
# Start development environment with Workers
npm run dev:workers

# Test the endpoint
curl -X POST http://localhost:8787/api/fix \
  -H 'Content-Type: application/json' \
  -d '{"diagramText": "flowchart TD\nA[Start]\nB[End]\nA --> B"}'
```

Expected response:

```json
{
  "ok": true,
  "provider": "openapi",
  "fixedText": null,
  "suggestions": []
}
```

### Configuration Examples

**OpenAI (Production):**

```env
OPENAPI_API_KEY=sk-proj-...
OPENAPI_MODEL=gpt-4o
OPENAPI_BASE_URL=https://api.openai.com/v1
```

**Groq (Free & Fast):**

```env
OPENAPI_API_KEY=gsk_...
OPENAPI_MODEL=mixtral-8x7b-32768
OPENAPI_BASE_URL=https://api.groq.com/openai/v1
```

**LocalAI (Self-hosted):**

```env
OPENAPI_API_KEY=sk-anything
OPENAPI_MODEL=gpt-4
OPENAPI_BASE_URL=http://localhost:8080/v1
```

**Ollama (Local):**

```env
OPENAPI_API_KEY=ollama
OPENAPI_MODEL=llama2
OPENAPI_BASE_URL=http://localhost:11434/v1
```

### Backward Compatibility

The old xAI configuration still works! If `OPENAPI_*` variables are not set, the code falls back to `XAI_*`:

```env
# Old xAI setup still works
XAI_API_KEY=xai_...
XAI_MODEL=grok-beta
XAI_BASE_URL=https://api.x.ai/v1
```

However, **we recommend updating to OpenAPI** for:

- More flexibility with provider choices
- Clearer configuration names
- Better long-term maintenance
- Industry-standard API format

---

## 🏗️ Part 2: Architecture Migration (Phase 2)

### Overview

Phase 2 represented a major shift from "beautiful 3D visualizations" to "AI-assisted diagram generation with a pluggable theme system."

### What Was Removed

1. **Three.js 3D Renderer**
   - Removed `/src/components/ThreeScene.tsx`
   - Removed `/src/components/preview/ThreeScenePanel.tsx`
   - Removed `/src/utils/threeHelpers.ts`
   - Removed `/src/styles/three-scene.css`
   - Removed Three.js dependencies from `package.json`

2. **Theme Picker UI**
   - Removed theme selector dropdown from Header
   - Removed theme selector from HeaderModern
   - Simplified MainContent layout (no more 3D vs 2D tabs)

3. **Hardcoded Theme Options**
   - Removed fixed theme enum (`'light' | 'dark' | 'cyber'`)
   - Theme selection now uses string-based registry

### What Was Added

1. **Pluggable Theme Registry** (`src/theme/themeRegistry.ts`)
   - `registerTheme(id, config)` - Register new themes
   - `getTheme(id)` - Retrieve theme config
   - `getThemeIds()` - List all registered themes
   - `hasTheme(id)` - Check if theme exists
   - `getMermaidConfigForTheme(id)` - Get Mermaid config

2. **Default Themes** (`src/theme/defaultThemes.ts`)
   - Initialized on app startup via `initializeDefaultThemes()`
   - Maintains 3 built-in themes: light, dark, cyber

3. **AI Feature Foundation**
   - Prepared infrastructure for AI diagram generation
   - Enhanced `/api/fix` endpoint
   - Credits system integration

### Performance Improvements

- **Build size**: ~100KB gzipped reduction (no Three.js)
- **Load time**: Faster app initialization
- **Runtime**: No Three.js renderer overhead

### Breaking Changes for Users

1. **No 3D visualization** - Diagrams now render as 2D Mermaid only
2. **No theme picker** - Themes managed by registry (can be added back as feature if needed)
3. **URL parameter compatibility** - Old theme preferences stored in localStorage still work

### Files Changed

**Deleted:**

- `src/components/ThreeScene.tsx`
- `src/components/preview/ThreeScenePanel.tsx`
- `src/utils/threeHelpers.ts`
- `src/styles/three-scene.css`

**Added:**

- `src/theme/themeRegistry.ts`
- `src/theme/defaultThemes.ts`
- `THEME_SYSTEM.md`

**Modified:**

- `package.json` - Removed Three.js dependencies
- `src/App.tsx` - Initialize themes on startup
- `src/hooks/useDiagramState.tsx` - Use registry to validate themes
- `src/utils/exportHelpers.ts` - Theme parameter optional
- `src/components/layout/Header.tsx` - Remove theme picker
- `src/components/layout/HeaderModern.tsx` - Remove theme picker
- `src/components/layout/MainContent.tsx` - Simplify layout
- `src/components/preview/PreviewPanel.tsx` - Handle null config

---

## 🔧 Technical Details

### Environment Variable Fallback Chain

```typescript
// For API Key
const apiKey = options.apiKey ?? env.OPENAPI_API_KEY ?? env.XAI_API_KEY;

// For Base URL
const baseUrl = options.baseUrl ?? env.OPENAPI_BASE_URL ?? env.XAI_BASE_URL ?? DEFAULT_BASE_URL;

// For Model
const model = options.model ?? env.OPENAPI_MODEL ?? env.XAI_MODEL ?? DEFAULT_MODEL;
```

**Behavior:**

1. Option parameter (if passed)
2. OPENAPI\_\* environment variable (new standard)
3. XAI\_\* environment variable (legacy fallback)
4. Default value (gpt-4o / https://api.openai.com/v1)

### API Endpoint Compatibility

The code uses raw HTTP with standard OpenAI format:

```typescript
fetch(`${baseUrl}/chat/completions`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model,
    temperature: 0,
    messages: [...],
  })
})
```

This format works with:

- ✅ OpenAI API
- ✅ Groq API
- ✅ Azure OpenAI
- ✅ LocalAI
- ✅ Ollama
- ✅ Any OpenAI-compatible endpoint

---

## 📋 Migration Checklist

### API Provider Migration

- [ ] Choose new API provider (recommend: Groq)
- [ ] Get API key from provider
- [ ] Update environment variables in development
- [ ] Update environment variables in production
- [ ] Test with `npm run dev:workers`
- [ ] Deploy using `npm run deploy:workers`
- [ ] Verify `/api/fix` endpoint works
- [ ] Remove old XAI\_\* environment variables (optional)

### Architecture Migration

- [ ] Verify app loads without Three.js errors
- [ ] Test theme switching functionality
- [ ] Verify diagram rendering works correctly
- [ ] Check export functionality
- [ ] Test localStorage persistence
- [ ] Verify build succeeds with no warnings

---

## 🚨 Troubleshooting

### API Migration Issues

**Error: "OPENAPI_API_KEY is not configured"**
**Solution**: Set the environment variable in your `.env.local` or platform settings.

**Error: "Model not found"**
**Solution**: Check the model name for your provider:

- OpenAI: https://platform.openai.com/docs/models
- Groq: https://console.groq.com/docs/model-support

**Error: "Connection refused"**
**Solution**: For self-hosted providers, ensure the service is running.

### Architecture Migration Issues

**Error: "Theme not found"**
**Solution**: Ensure `initializeDefaultThemes()` is called in `App.tsx`.

**Error: "Cannot find module 'three'"**
**Solution**: Remove all Three.js imports and dependencies.

**Performance issues**
**Solution**: The migration should improve performance. If issues persist, check bundle size.

---

## 📚 Additional Resources

### API Provider Documentation

- [OpenAI API Docs](https://platform.openai.com/docs/)
- [Groq API Docs](https://console.groq.com/docs/)
- [LocalAI Docs](https://localai.io/)
- [Ollama Docs](https://ollama.ai/)

### Theme System

- [THEME_SYSTEM.md](./THEME_SYSTEM.md) - Complete theme system documentation
- [Mermaid Theming](https://mermaid.js.org/syntax/theming.html)

### Deployment

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Complete deployment guide
- [OPENAPI_PROVIDERS.md](./OPENAPI_PROVIDERS.md) - Provider comparison

---

## ✅ Migration Complete!

After completing these migrations:

✅ **API Flexibility** - Support for any OpenAI-compatible provider  
✅ **Better Performance** - Reduced bundle size and faster loading  
✅ **Pluggable Themes** - Extensible theme system  
✅ **AI-First Architecture** - Ready for advanced AI features  
✅ **Backward Compatibility** - Old configurations still work

The application is now optimized for the AI-first diagram generation workflow.

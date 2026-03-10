# Free Tier Migration Plan

This document outlines the steps to remove all paying/premium features from MermaidMuse and enable user-configurable LLM endpoints.

## Summary

MermaidMuse will become a fully free, open-source tool where users can configure their own LLM endpoint and API key in the frontend. The app will render charts - the AI syntax fixing feature will be powered by the user's own LLM credentials.

## Part 1: Remove Pro/Payment Features

### Files to Delete

1. `src/utils/stripeHelpers.ts` - Stripe payment integration helpers
2. `src/components/ProUpsell/` - Entire directory (ProGate, StripeTeaser)
3. `src/hooks/usePro.tsx` - React context for pro state
4. `src/test/proFlow.test.tsx` - Tests for pro/Stripe flow

### Files to Modify

1. `src/App.tsx` - Remove `ProProvider` wrapper
2. `package.json` - Remove `@stripe/stripe-js`, `@stripe/react-stripe-js`

## Part 2: User-Configurable LLM Endpoint

### New Files to Create

1. **`src/hooks/useLLMConfig.tsx`** - React context for LLM settings
   - Stores: `baseUrl`, `apiKey`, `model`
   - Persists to localStorage
   - Default: empty (user must configure to enable AI fixing)

2. **`src/components/LLMSettingsPanel.tsx`** - Settings UI
   - Input fields for: API endpoint URL, API key (masked), model name
   - Test connection button
   - Save/Cancel actions
   - Accessible from header or settings gear icon

3. **`src/types/llmConfig.ts`** - TypeScript types
   ```ts
   interface LLMConfig {
     baseUrl: string;    // e.g., "https://api.openai.com/v1"
     apiKey: string;     // User's API key
     model: string;      // e.g., "gpt-4o", "grok-beta"
   }
   ```

### Files to Modify

1. **`src/server/xaiFix.ts`** → **`src/server/llmFix.ts`**
   - Rename to generic LLM client
   - Accept `baseUrl`, `apiKey`, `model` as parameters (no env var fallback for user-provided creds)
   - Support OpenAI-compatible API format (chat/completions endpoint)
   - Keep server-side fallback for self-hosted deployments

2. **`api/fix.ts`** and **`netlify/functions/fix.ts`**
   - Accept `baseUrl`, `apiKey`, `model` from request body
   - Pass through to `llmFix` function
   - Add security: never log or echo back the API key

3. **`src/components/ProblemsPanel.tsx`**
   - Add "Fix with AI" button (only enabled when LLM is configured)
   - On click, call `/api/fix` with user's stored credentials
   - Display fix results and allow applying fix

4. **`src/components/layout/HeaderModern.tsx`**
   - Add settings/gear icon to access LLM config panel
   - Show indicator if LLM is not configured

### API Flow (Client-Side Config)

```
User opens Settings → Enters LLM config → Saved to localStorage
                            ↓
User clicks "Fix with AI" → Frontend reads config from localStorage
                            ↓
Frontend POST /api/fix { diagramText, baseUrl, apiKey, model }
                            ↓
Server calls user's LLM endpoint → Returns fixed diagram
```

### Security Considerations

- API key stored in localStorage (client-side only)
- Key sent to server only during fix request, never stored server-side
- Server acts as proxy to avoid CORS issues
- Consider adding rate limiting to prevent abuse

## Implementation Order

1. **Remove Pro/Payment code** (quick cleanup)
   - Delete Stripe files, remove ProProvider, update package.json

2. **Create LLM config system**
   - Add `useLLMConfig` hook with localStorage persistence
   - Add `LLMSettingsPanel` component

3. **Refactor xaiFix to llmFix**
   - Generic OpenAI-compatible client
   - Accept config as parameters

4. **Update API endpoints**
   - Accept user credentials from request body
   - Pass to generic LLM client

5. **Add "Fix with AI" UI**
   - Button in ProblemsPanel
   - Shows only when errors exist and LLM is configured

6. **Add settings access**
   - Gear icon in header
   - Settings modal/drawer with LLM config form

7. **Verify and test**
   - Test with OpenAI, xAI, and other OpenAI-compatible endpoints
   - Test localStorage persistence
   - Test error handling (invalid key, network errors)

## Supported LLM Providers (Examples)

Any OpenAI-compatible endpoint works:
- OpenAI (api.openai.com)
- xAI/Grok (api.x.ai)
- Anthropic via proxy
- Local LLMs (Ollama, LM Studio)
- Self-hosted models

## Risk Assessment

**Low Risk** - Removing payment code is straightforward. Adding user-configurable LLM is additive and doesn't break existing functionality.

## Post-Migration

1. Update README.md with LLM configuration instructions
2. Update DEVELOPMENT.md with new architecture
3. Delete this plan file once complete

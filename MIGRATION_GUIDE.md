# Migration Guide: xAI → OpenAPI-Compatible Endpoints

This guide helps you migrate from the xAI/Grok API to OpenAPI-compatible endpoints.

## Overview

The project has been updated to use OpenAPI-compatible endpoints instead of the xAI API. This change:

✅ **Increases flexibility** - Support for any OpenAI-compatible API (OpenAI, Groq, etc.)
✅ **Reduces vendor lock-in** - Switch providers without code changes
✅ **Simplifies deployment** - Uses Cloudflare Workers for serverless API routes
✅ **Maintains backward compatibility** - Old xAI variables still work as fallback
❌ **Requires configuration update** - Environment variables need to be updated

## What Changed

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

### Code Changes

The `src/server/xaiFix.ts` file has been updated to:

1. Read from `OPENAPI_*` variables first
2. Fall back to `XAI_*` variables for backward compatibility
3. Use generic provider names in responses (`'openapi'` instead of `'xai'`)

**No changes required to your code** - just update environment variables!

## Migration Steps

### Step 1: Choose Your Provider

Pick an OpenAPI-compatible provider:

- **OpenAI** (default): Most capable, production-ready
- **Groq** (recommended): Free, fast, no rate limits
- **LocalAI** (privacy): Self-hosted, completely private
- **Ollama** (local): Ultra lightweight, offline

See [OPENAPI_PROVIDERS.md](./OPENAPI_PROVIDERS.md) for detailed options.

### Step 2: Get API Credentials

#### For OpenAI:

1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Copy the key (starts with `sk-`)

#### For Groq:

1. Go to https://console.groq.com/keys
2. Create a new API key
3. Copy the key (starts with `gsk_`)

#### For LocalAI (self-hosted):

```bash
docker run -p 8080:8080 localai/localai:latest
# Run on http://localhost:8080
```

#### For Ollama (self-hosted):

```bash
# Install Ollama from https://ollama.ai
ollama pull llama2
ollama serve
# Run on http://localhost:11434
```

### Step 3: Update Environment Variables

#### Local Development

Update `.env.local`:

```env
# Remove old xAI variables (optional, kept for fallback)
# XAI_API_KEY=...

# Add new OpenAPI variables
OPENAPI_API_KEY=your-api-key-here
OPENAPI_MODEL=gpt-4o
OPENAPI_BASE_URL=https://api.openai.com/v1
```

#### Production (Cloudflare Workers)

1. Go to Cloudflare Dashboard
2. Navigate to your Worker
3. Go to **Settings** > **Environment Variables**
4. Add the variables:
   ```
   OPENAPI_API_KEY=your-api-key
   OPENAPI_MODEL=gpt-4o
   OPENAPI_BASE_URL=https://api.openai.com/v1
   ```

#### Production

Set the `OPENAPI_*` variables in your Cloudflare Worker environment.

### Step 4: Test the Configuration

```bash
# Start development environment with Workers
npm run dev:workers

# Test the endpoint
curl -X POST http://localhost:8787/api/fix \
  -H 'Content-Type: application/json' \
  -d '{"diagramText": "graph TD\nA[Start]\nB[End]\nA --> B"}'
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

### Step 5: Update Deployment

#### For Cloudflare (Recommended)

```bash
# Install Wrangler CLI if needed
npm install -g wrangler

# Configure your account
wrangler login

# Deploy
npm run deploy:workers
```

See [CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md) for detailed instructions.

## Configuration Examples

### Example 1: OpenAI (Production)

```env
OPENAPI_API_KEY=sk-proj-...
OPENAPI_MODEL=gpt-4o
OPENAPI_BASE_URL=https://api.openai.com/v1
```

### Example 2: Groq (Free & Fast)

```env
OPENAPI_API_KEY=gsk_...
OPENAPI_MODEL=mixtral-8x7b-32768
OPENAPI_BASE_URL=https://api.groq.com/openai/v1
```

### Example 3: LocalAI (Self-hosted)

```env
OPENAPI_API_KEY=sk-anything
OPENAPI_MODEL=gpt-4
OPENAPI_BASE_URL=http://localhost:8080/v1
```

### Example 4: Ollama (Local)

```env
OPENAPI_API_KEY=ollama
OPENAPI_MODEL=llama2
OPENAPI_BASE_URL=http://localhost:11434/v1
```

## Backward Compatibility

The old xAI configuration still works! If `OPENAPI_*` variables are not set, the code falls back to `XAI_*`:

```env
# Old xAI setup still works
XAI_API_KEY=xai_...
XAI_MODEL=grok-beta
XAI_BASE_URL=https://api.x.ai/v1
```

However, **we recommend updating to OpenAPI** for the following reasons:

- More flexibility with provider choices
- Clearer configuration names
- Better long-term maintenance
- Industry-standard API format

## Troubleshooting

### Error: "OPENAPI_API_KEY is not configured"

**Solution**: Set the environment variable in your `.env.local` or platform settings.

```bash
# Development
echo "OPENAPI_API_KEY=your-key" >> .env.local

# Cloudflare
# Go to dashboard > Settings > Environment Variables
```

### Error: "Model not found"

**Solution**: Check the model name for your provider:

```bash
# For OpenAI: https://platform.openai.com/docs/models
# For Groq: https://console.groq.com/docs/model-support
# For LocalAI: Check available models in dashboard
```

### Error: "Connection refused"

**Solution**: For self-hosted providers, ensure the service is running:

```bash
# For LocalAI
docker ps | grep localai

# For Ollama
ollama list
```

### Timeout errors

**Solution**: Increase timeout or use faster provider:

```env
# Groq is fastest (recommended)
OPENAPI_MODEL=mixtral-8x7b-32768
OPENAPI_BASE_URL=https://api.groq.com/openai/v1

# Or adjust in code (src/server/xaiFix.ts)
# Change timeoutMs from 15000 to higher value
```

## Performance Comparison

| Provider | Speed       | Cost | Setup |
| -------- | ----------- | ---- | ----- |
| Groq     | ⚡⚡⚡ Fast | Free | Easy  |
| OpenAI   | ⚡⚡ Medium | $$   | Easy  |
| LocalAI  | ⚡ Slow     | Free | Hard  |
| Ollama   | ⚡ Slow     | Free | Easy  |

**Recommendation**: Start with Groq for best balance of speed, cost, and ease.

## FAQ

**Q: Do I need to change my code?**
A: No! The changes are backward compatible. Only environment variables need updating.

**Q: Can I use both xAI and OpenAPI?**
A: Yes! The code tries `OPENAPI_*` first, then falls back to `XAI_*`.

**Q: Which provider should I use?**
A:

- **Production**: OpenAI (most reliable)
- **Cost-effective**: Groq (free with good quality)
- **Privacy**: LocalAI or Ollama (self-hosted, offline)

**Q: How do I switch providers?**
A: Just update the environment variables - no code changes needed!

**Q: What if I want to keep xAI?**
A: Set the `XAI_*` variables, they still work as a fallback.

**Q: How do I deploy to Cloudflare?**
A: See [CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md)

## Support

For issues or questions:

1. Check [OPENAPI_PROVIDERS.md](./OPENAPI_PROVIDERS.md) for provider-specific details
2. See [CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md) for deployment help
3. Review environment variable examples above

## Summary

✅ **Easy migration** - Just update environment variables
✅ **No code changes** - Works with existing codebase
✅ **Better flexibility** - Support for any OpenAI-compatible API
✅ **Backward compatible** - Old xAI setup still works
✅ **Industry standard** - Uses standard OpenAI API format

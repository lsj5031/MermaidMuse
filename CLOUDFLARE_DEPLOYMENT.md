# Cloudflare Deployment Guide

This guide explains how to deploy Diagram Maker to Cloudflare Pages + Workers.

## Prerequisites

1. **Cloudflare Account**: Sign up at https://dash.cloudflare.com/
2. **Wrangler CLI**: Install with `npm install -g wrangler`
3. **API Key**: Get your OpenAI or compatible API key

## Step 1: Get Cloudflare Credentials

1. Go to https://dash.cloudflare.com/
2. Navigate to **Accounts** > **API Tokens**
3. Create a new API token with:
   - Account Resources: All accounts
   - Zone Resources: All zones
   - Permissions: Include Workers and Pages
4. Copy your token

## Step 2: Configure Wrangler

```bash
# Authenticate with Cloudflare
wrangler login
```

Paste your API token when prompted.

## Step 3: Update wrangler.toml

Edit `wrangler.toml` and set your account ID:

```toml
account_id = "your-account-id-here"  # Find at https://dash.cloudflare.com/
```

## Step 4: Set Environment Variables

### Option A: Using Cloudflare Dashboard

1. Go to https://dash.cloudflare.com/
2. Select your worker/pages project
3. Go to **Settings** > **Environment Variables**
4. Add the following variables:

```
OPENAPI_API_KEY=sk-...  # Your OpenAI or compatible API key
OPENAPI_MODEL=gpt-4o    # Model name (default: gpt-4o)
OPENAPI_BASE_URL=https://api.openai.com/v1  # API endpoint (optional)
```

### Option B: Using .env file (for testing only)

Create a `.env.production.local` file:

```env
OPENAPI_API_KEY=sk-...
OPENAPI_MODEL=gpt-4o
OPENAPI_BASE_URL=https://api.openai.com/v1
```

**Note**: Never commit `.env` files to version control!

## Step 5: Deploy

### Deploy Workers

```bash
npm run deploy:workers
```

This will deploy the serverless function to Cloudflare Workers.

### Deploy Pages (Frontend)

For Pages, you can use:

1. **Git Integration** (Recommended):
   - Push to GitHub/GitLab
   - Connect repository to Cloudflare Pages dashboard
   - Pages will auto-deploy on each push

2. **CLI Deployment**:
   ```bash
   npm run build
   npx wrangler pages deploy dist
   ```

## Supported OpenAPI-Compatible Endpoints

The `/api/fix` endpoint works with any OpenAI-compatible API:

### OpenAI

```env
OPENAPI_BASE_URL=https://api.openai.com/v1
OPENAPI_API_KEY=sk-...
OPENAPI_MODEL=gpt-4o
```

### Groq (Free & Fast)

```env
OPENAPI_BASE_URL=https://api.groq.com/openai/v1
OPENAPI_API_KEY=gsk_...
OPENAPI_MODEL=mixtral-8x7b-32768
```

### LocalAI (Self-hosted)

```env
OPENAPI_BASE_URL=http://localhost:8080/v1
OPENAPI_API_KEY=sk-...
OPENAPI_MODEL=model-name
```

### Ollama (Local)

```env
OPENAPI_BASE_URL=http://localhost:11434/v1
OPENAPI_API_KEY=ollama
OPENAPI_MODEL=llama2
```

## Verification

After deployment, test the `/api/fix` endpoint:

```bash
curl -X POST https://your-worker.your-domain.workers.dev/api/fix \
  -H 'Content-Type: application/json' \
  -d '{
    "diagramText": "graph TD\nA[Start]\nB[Process]\nA --> B"
  }' | jq
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

## Troubleshooting

### Issue: "Not authenticated" error

**Solution**: Run `wrangler login` again

### Issue: OPENAPI_API_KEY not found

**Solution**:

- Ensure environment variables are set in Cloudflare dashboard
- For local testing, create `.env.production.local`
- Restart dev server with `npm run dev:workers`

### Issue: CORS errors

**Solution**: The worker includes CORS headers for all requests. Ensure:

- Request method is POST or OPTIONS
- Content-Type header is set to `application/json`

### Issue: Timeout errors

**Solution**:

- Check API key is valid
- Verify model name is correct
- Increase timeout in `xaiFix.ts` if needed (default: 15000ms)

## Local Development

Test Workers locally before deploying:

```bash
npm run dev:workers
```

This starts a local development server at `http://localhost:8787`

Then test the endpoint:

```bash
curl -X POST http://localhost:8787/api/fix \
  -H 'Content-Type: application/json' \
  -d '{"diagramText": "graph TD\nA --> B"}'
```

## Performance Tips

1. **Use Groq**: Free, fast, and OpenAI-compatible
2. **Cache responses**: Consider implementing response caching
3. **Rate limiting**: Implement to prevent abuse
4. **Monitor usage**: Check Cloudflare dashboard for performance metrics

## Pricing

Cloudflare Workers:

- **Free tier**: 100,000 requests/day
- **Paid**: $0.50 per million requests (after free tier)

Additional costs depend on your API provider (OpenAI, Groq, etc.)

## References

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
- [OpenAI API Docs](https://platform.openai.com/docs/)
- [Groq API Docs](https://console.groq.com/docs/)

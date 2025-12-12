# Quick Start: Deploying Diagram Maker

This guide gets you deployed in under 10 minutes.

## 1. Choose Your Deployment Platform

### Option A: Cloudflare (Recommended) ⭐

**Best for**: Easy setup, global edge network, free tier

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login
wrangler login

# Deploy
npm run deploy:workers
```

**Next steps**: Go to [CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md)

---

### Option B: Vercel (Legacy Support)

**Best for**: Git integration, zero-config deployments

1. Push code to GitHub
2. Go to https://vercel.com/new
3. Import your repository
4. Add environment variables:
   - `OPENAPI_API_KEY`
   - `OPENAPI_MODEL` (optional, defaults to `gpt-4o`)
   - `OPENAPI_BASE_URL` (optional, defaults to OpenAI)
5. Deploy!

---

### Option C: Netlify (Legacy Support)

**Best for**: Drag-and-drop deployment

1. Push code to GitHub
2. Go to https://app.netlify.com/
3. Click "New site from Git"
4. Select your repository
5. Add environment variables:
   - `OPENAPI_API_KEY`
   - `OPENAPI_MODEL` (optional)
   - `OPENAPI_BASE_URL` (optional)
6. Deploy!

---

## 2. Choose Your API Provider

### Option A: OpenAI (Most Capable)

1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Copy and save (you won't see it again!)
4. Set in deployment platform:
   ```
   OPENAPI_API_KEY=sk-proj-...
   ```

**Cost**: $0.01-0.15 per 1K tokens

---

### Option B: Groq (Recommended for Cost) ⭐

1. Go to https://console.groq.com/keys
2. Create a new API key
3. Copy and save
4. Set in deployment platform:
   ```
   OPENAPI_API_KEY=gsk_...
   OPENAPI_MODEL=mixtral-8x7b-32768
   OPENAPI_BASE_URL=https://api.groq.com/openai/v1
   ```

**Cost**: FREE! (No rate limits for reasonable usage)

---

### Option C: Self-Hosted (Privacy)

#### LocalAI
```bash
docker run -p 8080:8080 localai/localai:latest
```

Then set:
```
OPENAPI_API_KEY=sk-anything
OPENAPI_BASE_URL=http://localhost:8080/v1
```

#### Ollama
```bash
# Download from https://ollama.ai
ollama pull llama2
ollama serve
```

Then set:
```
OPENAPI_API_KEY=ollama
OPENAPI_BASE_URL=http://localhost:11434/v1
OPENAPI_MODEL=llama2
```

---

## 3. Local Testing (Before Deployment)

```bash
# Install dependencies
npm install

# Start dev server
npm run dev:workers

# Test the endpoint
curl -X POST http://localhost:8787/api/fix \
  -H 'Content-Type: application/json' \
  -d '{
    "diagramText": "graph TD\nA[Start]\nB[End]\nA --> B"
  }'
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

---

## 4. Deploy Frontend + Backend

### For Cloudflare

```bash
# Build
npm run build

# Deploy frontend to Cloudflare Pages
npx wrangler pages deploy dist

# Deploy backend (Workers)
npm run deploy:workers
```

### For Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

### For Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

---

## 5. Verify Deployment

### Test your live deployment:

```bash
# Replace with your deployment URL
curl -X POST https://your-app.workers.dev/api/fix \
  -H 'Content-Type: application/json' \
  -d '{
    "diagramText": "graph TD\nA[Start]\nB[Process]\nC[End]\nA --> B --> C"
  }'
```

If you get a response with `"ok": true`, you're deployed! 🎉

---

## 6. Troubleshooting

### Error: "OPENAPI_API_KEY is not configured"

**Solution**: 
1. Go to your deployment platform dashboard
2. Add the environment variable:
   ```
   OPENAPI_API_KEY=your-api-key
   ```
3. Redeploy

### Error: "Connection refused" (Self-hosted)

**Solution**: 
1. Ensure your service is running:
   ```bash
   # For LocalAI
   docker ps | grep localai
   
   # For Ollama
   ollama list
   ```
2. Check the base URL is correct in env variables

### Error: "Authentication failed"

**Solution**:
1. Verify API key is correct
2. Check key hasn't expired
3. Try creating a new key in your provider's dashboard

### Timeouts

**Solution**:
1. Try Groq (fastest): `OPENAPI_BASE_URL=https://api.groq.com/openai/v1`
2. Use a different model
3. Increase timeout in code if needed

---

## 7. Next Steps

### For Cloudflare Users:

- See [CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md) for advanced setup
- Connect a custom domain
- Set up monitoring and analytics

### For All Users:

- See [OPENAPI_PROVIDERS.md](./OPENAPI_PROVIDERS.md) for provider comparisons
- See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) if migrating from xAI
- Set up monitoring and logging
- Configure rate limiting (optional)

---

## 8. Cost Estimate

### Free Options:
- **Groq**: Completely free
- **Ollama**: Self-hosted (hardware only)
- **LocalAI**: Self-hosted (hardware only)
- **Cloudflare Workers**: 100,000 requests/day free

### Paid Options:
- **OpenAI**: ~$0.01-0.15 per 1K tokens
- **Groq**: Free (official)
- **Cloudflare Workers**: $0.50 per million requests after free tier

### Typical Monthly Cost (100K requests):
- **Groq + Cloudflare**: $0 (completely free!)
- **OpenAI + Cloudflare**: ~$10-50
- **Self-hosted + Cloudflare**: Hardware only

---

## 9. Deployment Checklist

- [ ] Choose platform (Cloudflare recommended)
- [ ] Choose API provider (Groq recommended)
- [ ] Get API key
- [ ] Test locally with `npm run dev:workers`
- [ ] Build with `npm run build`
- [ ] Set environment variables on platform
- [ ] Deploy
- [ ] Test live endpoint
- [ ] Set custom domain (optional)
- [ ] Monitor usage

---

## 10. Support & Resources

- **Cloudflare**: https://developers.cloudflare.com/workers/
- **Groq**: https://console.groq.com/docs/
- **OpenAI**: https://platform.openai.com/docs/
- **Wrangler CLI**: https://developers.cloudflare.com/workers/wrangler/

---

**Happy deploying!** 🚀

If you run into issues, check:
1. [CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md)
2. [OPENAPI_PROVIDERS.md](./OPENAPI_PROVIDERS.md)
3. [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)

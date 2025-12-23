# Deployment Guide

This guide covers deploying MermaidMuse to production. The recommended stack is **Cloudflare Pages + Workers** for optimal performance and cost.

## 🚀 Quick Start (10-minute deployment)

### 1. Choose Your AI Provider

#### Option A: Groq (Recommended - Free & Fast)

```bash
# Get API key from https://console.groq.com/keys
OPENAPI_API_KEY=gsk_...
OPENAPI_MODEL=mixtral-8x7b-32768
OPENAPI_BASE_URL=https://api.groq.com/openai/v1
```

#### Option B: OpenAI (Production)

```bash
# Get API key from https://platform.openai.com/api-keys
OPENAPI_API_KEY=sk-...
OPENAPI_MODEL=gpt-4o
OPENAPI_BASE_URL=https://api.openai.com/v1
```

#### Option C: Self-Hosted (Privacy)

```bash
# Ollama: https://ollama.ai
OPENAPI_API_KEY=ollama
OPENAPI_MODEL=llama2
OPENAPI_BASE_URL=http://localhost:11434/v1
```

### 2. Deploy to Cloudflare

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy Workers (API)
npm run deploy:workers

# Deploy Pages (Frontend)
npm run build
npx wrangler pages deploy dist
```

### 3. Configure Environment Variables

In Cloudflare Dashboard → Workers & Pages → Your Worker → Settings → Environment Variables:

```env
# AI Provider (choose one from above)
OPENAPI_API_KEY=your-api-key
OPENAPI_MODEL=your-model
OPENAPI_BASE_URL=your-base-url

# Authentication (required for credits)
CLERK_SECRET_KEY=sk_...
VITE_CLERK_PUBLISHABLE_KEY=pk_...

# Payments (optional, for credit top-ups)
STRIPE_SECRET_KEY=sk_test_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 4. Test Deployment

```bash
# Test your live API
curl -X POST https://your-app.workers.dev/api/fix \
  -H 'Content-Type: application/json' \
  -d '{"diagramText": "flowchart TD\nA[Start] --> B[End]"}'
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

## 📋 Detailed Setup

### Prerequisites

- **Node.js 18+**
- **Cloudflare Account** (free tier available)
- **AI Provider API Key** (Groq recommended for free usage)

### Cloudflare Configuration

#### 1. Get Cloudflare Credentials

1. Go to https://dash.cloudflare.com/
2. Navigate to **Accounts** > **API Tokens**
3. Create a new API token with:
   - Account Resources: All accounts
   - Zone Resources: All zones
   - Permissions: Include Workers and Pages
4. Copy your token

#### 2. Configure Wrangler

Edit `wrangler.toml` and set your account ID:

```toml
account_id = "your-account-id-here"  # Find at https://dash.cloudflare.com/
```

#### 3. Environment Variables

Set these in your Cloudflare Worker environment:

**Required for AI Features:**

```env
OPENAPI_API_KEY=your-api-key
OPENAPI_MODEL=gpt-4o
OPENAPI_BASE_URL=https://api.openai.com/v1
```

**Required for Authentication:**

```env
CLERK_SECRET_KEY=sk_...
VITE_CLERK_PUBLISHABLE_KEY=pk_...
```

**Optional for Payments:**

```env
STRIPE_SECRET_KEY=sk_test_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### AI Provider Options

| Provider | Cost     | Speed          | Privacy      | Setup |
| -------- | -------- | -------------- | ------------ | ----- |
| **Groq** | **Free** | ⚡⚡⚡ Fastest | Medium       | Easy  |
| OpenAI   | $$$      | ⚡⚡ Fast      | Low          | Easy  |
| LocalAI  | Free     | ⚡ Medium      | ⭐ Excellent | Hard  |
| Ollama   | Free     | ⚡ Slow        | ⭐ Excellent | Easy  |

#### Groq Setup (Recommended)

1. Go to https://console.groq.com/keys
2. Create a new API key
3. Set environment variables:
   ```env
   OPENAPI_API_KEY=gsk_...
   OPENAPI_MODEL=mixtral-8x7b-32768
   OPENAPI_BASE_URL=https://api.groq.com/openai/v1
   ```

#### OpenAI Setup

1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Set environment variables:
   ```env
   OPENAPI_API_KEY=sk-...
   OPENAPI_MODEL=gpt-4o
   OPENAPI_BASE_URL=https://api.openai.com/v1
   ```

#### Self-Hosted Setup

**Ollama:**

```bash
# Install Ollama
curl https://ollama.ai/install.sh | sh

# Pull a model
ollama pull llama2

# Start server
ollama serve
```

Environment variables:

```env
OPENAPI_API_KEY=ollama
OPENAPI_MODEL=llama2
OPENAPI_BASE_URL=http://localhost:11434/v1
```

---

## 🔧 Development vs Production

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start Workers for API testing
npm run dev:workers
```

Create `.env.local` for local testing:

```env
VITE_API_URL=http://localhost:8787
OPENAPI_API_KEY=your-test-key
CLERK_SECRET_KEY=your-clerk-secret
```

### Production Deployment

```bash
# Build frontend
npm run build

# Deploy Workers (API)
npm run deploy:workers

# Deploy Pages (Frontend)
npx wrangler pages deploy dist
```

Or use GitHub Actions for automatic deployment (see `.github/workflows/deploy.yml`).

---

## 🌐 Custom Domain Setup

### 1. Deploy Once

Deploy your application using the steps above.

### 2. Add Domain in Cloudflare

1. In Cloudflare Dashboard, go to Pages → Your Page → Custom domains
2. Add your domain (e.g., `app.example.com`)

### 3. Update DNS

**For subdomain** (e.g., app.example.com):

```
CNAME  app  your-pages-site.pages.dev
```

**For root domain** (e.g., example.com):

```
A  @  192.0.2.1  ; Use IP from Cloudflare
AAAA  @  2001:db8::1
```

### 4. Wait for Propagation

- DNS changes may take 5-30 minutes
- TLS certificate is automatically provisioned
- Set domain as primary when ready

---

## 💰 Cost Analysis

### Cloudflare Costs

- **Workers**: 100,000 requests/day free
- **Pages**: Unlimited bandwidth for static assets
- **Paid**: $0.50 per million requests after free tier

### AI Provider Costs

| Provider | Cost per 1M tokens | Free Tier             |
| -------- | ------------------ | --------------------- |
| Groq     | $0                 | Yes (generous limits) |
| OpenAI   | $15-60             | $5 free credit        |
| LocalAI  | $0                 | Hardware only         |
| Ollama   | $0                 | Hardware only         |

### Estimated Monthly Cost (100K requests)

- **Groq + Cloudflare**: $0 (completely free!)
- **OpenAI + Cloudflare**: ~$10-50
- **Self-hosted + Cloudflare**: Hardware only

---

## 🔍 Monitoring & Troubleshooting

### Health Checks

Monitor these endpoints:

- `https://your-app.workers.dev/api/fix` - AI fix endpoint
- `https://your-app.pages.dev` - Frontend

### Common Issues

#### "OPENAPI_API_KEY is not configured"

**Solution**: Add the environment variable in Cloudflare Dashboard.

#### "Connection refused" (self-hosted)

**Solution**: Ensure your AI service is running and accessible.

#### "Authentication failed"

**Solution**: Verify Clerk keys are correct and match environment.

#### High latency

**Solution**: Switch to Groq for fastest response times.

### Monitoring Tools

- **Cloudflare Analytics**: Request counts, latency, errors
- **Clerk Dashboard**: User authentication, sign-ups
- **AI Provider Dashboard**: API usage, costs

---

## 🔒 Security Best Practices

### Environment Variables

- ✅ Use Cloudflare's environment variable management
- ✅ Never commit API keys to version control
- ✅ Rotate keys regularly
- ✅ Use separate keys for production/development

### API Security

- ✅ Clerk authentication for all AI endpoints
- ✅ Rate limiting (implement in application)
- ✅ CORS properly configured
- ✅ Input validation on all endpoints

### Payment Security

- ✅ Use Stripe webhook signatures
- ✅ Validate webhook events
- ✅ Store only minimal user data
- ✅ Use HTTPS everywhere

---

## 🛡️ Security Configuration

The application includes several security features that require configuration for production use.

### Distributed Rate Limiting (Required for Production)

In serverless environments like Cloudflare Workers, each request may hit a different isolate, making in-memory rate limiting ineffective. For production, you **must** configure Cloudflare KV for distributed rate limiting.

#### 1. Create a KV Namespace

```bash
# Create the KV namespace
wrangler kv:namespace create "RATE_LIMIT_KV"
```

This outputs something like:

```
🌀 Creating namespace with title "your-worker-RATE_LIMIT_KV"
✨ Success!
Add the following to your wrangler.toml:
[[kv_namespaces]]
binding = "RATE_LIMIT_KV"
id = "abc123..."
```

#### 2. Add to wrangler.toml

```toml
[[kv_namespaces]]
binding = "RATE_LIMIT_KV"
id = "your-kv-namespace-id-here"
```

#### 3. For Production Environment

Create a separate namespace for production:

```bash
wrangler kv:namespace create "RATE_LIMIT_KV" --env production
```

Add to `wrangler.toml`:

```toml
[env.production]
[[env.production.kv_namespaces]]
binding = "RATE_LIMIT_KV"
id = "your-production-kv-namespace-id"
```

### CORS Configuration

By default, CORS is restricted to these origins:

- `https://mermaid.liu.nz`
- `https://mermaid-muse.pages.dev`
- `http://localhost:5173` (development)
- `http://localhost:3000` (development)

#### Custom Origins

To add custom allowed origins, set the `ALLOWED_ORIGINS` environment variable:

```bash
# In Cloudflare Dashboard or wrangler.toml
ALLOWED_ORIGINS=https://mermaid.liu.nz,https://mermaid-muse.pages.dev
```

### Stripe Webhook Security

Webhooks include several security measures:

1. **Signature Verification**: All webhooks are verified using HMAC-SHA256
2. **Timestamp Validation**: Events older than 5 minutes are rejected to prevent replay attacks
3. **Idempotency**: Payment sessions are tracked to prevent double-crediting

#### Configure Webhook Secret

1. In Stripe Dashboard, go to Developers → Webhooks
2. Create a webhook endpoint: `https://your-app.workers.dev/api/stripe-webhook`
3. Select events: `checkout.session.completed`
4. Copy the signing secret
5. Add to environment:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### Redirect URL Validation

Checkout redirect URLs are validated against an allowlist to prevent open redirect attacks.

Default allowed hosts:

- `localhost`
- `127.0.0.1`
- `mermaid.liu.nz`
- `mermaid-muse.pages.dev`

To add custom domains, update the `ALLOWED_REDIRECT_HOSTS` array in `src/server/stripeServer.ts`.

### Input Size Limits

The API enforces these input size limits to prevent abuse:

| Input Type   | Max Length    | Endpoint                                  |
| ------------ | ------------- | ----------------------------------------- |
| Diagram text | 100,000 chars | `/api/fix`, `/api/analyze`, `/api/refine` |
| Prompt       | 10,000 chars  | `/api/generate`                           |
| Instruction  | 5,000 chars   | `/api/refine`                             |

### Rate Limits

Per-user rate limits (per minute):

| Endpoint                              | Limit       |
| ------------------------------------- | ----------- |
| `/api/fix`                            | 20 requests |
| `/api/generate`                       | 10 requests |
| `/api/analyze`                        | 15 requests |
| `/api/refine`                         | 20 requests |
| `/api/stripe-create-checkout-session` | 5 requests  |
| `/api/stripe-fulfill-session`         | 10 requests |

---

## 📚 Additional Resources

### Documentation

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
- [OpenAI API Docs](https://platform.openai.com/docs/)
- [Groq API Docs](https://console.groq.com/docs/)
- [Clerk Authentication](https://clerk.com/docs)

### Configuration Files

- `wrangler.toml` - Cloudflare Workers configuration
- `cloudflare.toml` - Cloudflare Pages configuration
- `.env.example` - Environment variable template
- `package.json` - Build and deploy scripts

### Support

For deployment issues:

1. Check Cloudflare status page
2. Review worker logs in dashboard
3. Verify environment variables
4. Test API endpoints individually

---

## 🎯 Production Checklist

- [ ] Choose AI provider (Groq recommended)
- [ ] Get API keys
- [ ] Configure Cloudflare environment variables
- [ ] **Create KV namespace for rate limiting** (see Security Configuration)
- [ ] **Configure ALLOWED_ORIGINS** for your domains
- [ ] **Set up Stripe webhook with signing secret**
- [ ] Test locally with `npm run dev:workers`
- [ ] Deploy Workers with `npm run deploy:workers`
- [ ] Deploy Pages with build output
- [ ] Test live endpoints
- [ ] **Verify rate limiting is working** (check KV namespace has entries)
- [ ] Set up custom domain (optional)
- [ ] **Update ALLOWED_REDIRECT_HOSTS** for custom domain
- [ ] Configure monitoring
- [ ] Set up alerts for errors
- [ ] Document your setup

---

**Happy deploying! 🚀**

For provider-specific details, see [OPENAPI_PROVIDERS.md](./OPENAPI_PROVIDERS.md).

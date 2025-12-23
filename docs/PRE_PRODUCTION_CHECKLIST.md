# Pre-Production Checklist (Go-Live Guide)

Before you press the "Deploy" button or switch your public links to "Live", follow this checklist to ensure a smooth launch.

## 1. 🛡️ Security & Keys (CRITICAL)

### Stripe (Payments)

- [ ] **Switch to Live Mode**: Log into Stripe Dashboard and turn **OFF** "Test Mode".
- [ ] **Get Live Keys**: Copy the `pk_live_...` and `sk_live_...` keys.
- [ ] **Update Environment**: Replace your `pk_test_` / `sk_test_` keys in your deployment platform (Cloudflare Dashboard).
- [ ] **Webhook**: Ensure the Production Webhook URL is configured (not localhost).
- [ ] **Webhook Secret**: Set `STRIPE_WEBHOOK_SECRET` with the production webhook signing secret.

### Clerk (Authentication)

- [ ] **Switch to Production**: In Clerk Dashboard, switch the instance to **Production**.
- [ ] **Get Live Keys**: Copy the `pk_live_...` and `sk_live_...` keys.
- [ ] **Update Redirects**: Ensure your Production URLs (e.g., `https://mermaid.liu.nz`) are in the "Allowed Redirects" list in Clerk settings.
- [ ] **Update Environment**: Update Cloudflare environment variables.

### AI Providers

- [ ] **Limits**: Check your quota limits on OpenAI or Groq to ensure they can handle production traffic.
- [ ] **Base URL**: Set `OPENAPI_BASE_URL` (e.g., `https://api.openai.com/v1` or `https://api.groq.com/openai/v1`).

## 2. 🔐 Security Configuration (CRITICAL)

### Rate Limiting (Required)

In-memory rate limiting does NOT work in serverless environments. You must configure Cloudflare KV:

- [ ] **Create KV Namespace**:
  ```bash
  wrangler kv:namespace create "RATE_LIMIT_KV" --env production
  ```
- [ ] **Update wrangler.toml**: Add the KV binding with the namespace ID.
- [ ] **Verify**: After deployment, check KV namespace has entries after making API requests.

### CORS Configuration

- [ ] **Set ALLOWED_ORIGINS**: Configure allowed domains in Cloudflare environment:
  ```
  ALLOWED_ORIGINS=https://mermaid.liu.nz,https://mermaid-muse.pages.dev
  ```
- [ ] **Update Redirect Hosts**: If using a custom domain, add it to `ALLOWED_REDIRECT_HOSTS` in `src/server/stripeServer.ts`.

### Webhook Security

- [ ] **Signature Verification**: Ensure `STRIPE_WEBHOOK_SECRET` is set (prevents forged webhooks).
- [ ] **Timestamp Validation**: Enabled by default - events older than 5 minutes are rejected.

### Input Validation

The following limits are enforced automatically:

- Diagram text: 100,000 characters max
- Prompts: 10,000 characters max
- Instructions: 5,000 characters max

## 3. 🧪 Final Local Testing

Run your app as if it were in production locally.

1.  **Run Full Build**:

    ```bash
    npm run build
    ```

    _Ensure there are no TypeScript errors._

2.  **Run Preview**:

    ```bash
    npm run preview
    ```

    _This serves the built files on localhost. Test the UI here to ensure no assets are missing._

3.  **Run Lint & Tests**:
    ```bash
    npm run lint
    npm run test
    ```

## 4. 🌐 Cloudflare Pre-Flight

1.  **Environment Variables**: Double-check _every_ variable in Cloudflare Dashboard > Settings > Variables.
    - `VITE_CLERK_PUBLISHABLE_KEY` (must be `pk_live_...`)
    - `CLERK_SECRET_KEY` (must be `sk_live_...`)
    - `STRIPE_SECRET_KEY` (must be `sk_live_...`)
    - `STRIPE_WEBHOOK_SECRET` (must be `whsec_...` from production webhook)
    - `VITE_STRIPE_PUBLISHABLE_KEY` (must be `pk_live_...`)
    - `OPENAPI_API_KEY` (valid key)
    - `ALLOWED_ORIGINS` (your production domains)

2.  **KV Namespace**: Verify the `RATE_LIMIT_KV` binding is configured in wrangler.toml.

3.  **Custom Domain**:
    - Ensure your domain is verified.
    - Check SSL/TLS status is "Active".

## 5. 🚀 The Go-Live Sequence

1.  **Maintenance**: If you have existing users, consider a "Maintenance Mode" (optional).
2.  **Deploy Backend**: `npm run deploy:workers`
3.  **Deploy Frontend**: `npm run deploy` (or via Git push if connected).
4.  **Smoke Test**:
    - Visit the live URL.
    - Sign up with a _real_ email.
    - (Optional) Make a real $1 transaction to verify Stripe.
5.  **Verify Rate Limiting**: Make a few API requests and check KV namespace has entries.

## 6. 🚨 Post-Launch Monitoring

- [ ] **Logs**: Watch Cloudflare Worker logs for "Exceptions".
- [ ] **Rate Limiting**: Check KV namespace for rate limit entries.
- [ ] **Stripe**: Watch "Payments" tab for `succeeded`.
- [ ] **Clerk**: Watch "Users" list for new signups.
- [ ] **Webhook Events**: Verify Stripe webhook events are being received (check Stripe Dashboard > Developers > Webhooks).

---

**Ready? Good luck! 🚀**

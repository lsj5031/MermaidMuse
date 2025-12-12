# Stripe + Credits Setup (MermaidMuse)

This repo implements a **credits-based** billing model:

- New users get **10 free credits** (stored in Clerk user `private_metadata.creditsBalance`).
- **AI Fix costs 1 credit**.
- If the AI does **not** return a `fixedText`, the user is **not charged**.
- Users can **top up 100 credits** via Stripe Checkout.

## 1) Create a Stripe account + get keys

1. Create a Stripe account: https://dashboard.stripe.com/
2. Switch to **Test mode**.
3. Copy:
   - **Publishable key** → `VITE_STRIPE_PUBLISHABLE_KEY`
   - **Secret key** → `STRIPE_SECRET_KEY`

## 2) Create a Clerk app + get keys

1. Create a Clerk application: https://dashboard.clerk.com/
2. Copy:
   - **Publishable key** → `VITE_CLERK_PUBLISHABLE_KEY`
   - **Secret key** → `CLERK_SECRET_KEY`

> Credits are stored in Clerk user `private_metadata` so they cannot be changed from the browser.

## 3) Configure environment variables

Add these variables to your Cloudflare Worker environment and to local `.env.local` when testing:

```bash
# Client
VITE_CLERK_PUBLISHABLE_KEY=pk_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Server
CLERK_SECRET_KEY=sk_...
STRIPE_SECRET_KEY=sk_test_...

# Optional (recommended): Stripe webhook fulfillment
STRIPE_WEBHOOK_SECRET=whsec_...
```

The credits pack is configured in:

- `src/server/stripeServer.ts` → `DEFAULT_CREDITS_PACK`

By default it sells **100 credits**.

## 4) Stripe Checkout flow (no custom UI needed)

The app creates a Stripe Checkout Session server-side:

- `POST /api/stripe-create-checkout-session`

Then redirects the user to Stripe.

On success, Stripe redirects back to:

- `/?checkout=success&session_id=cs_...`

and the app calls:

- `POST /api/stripe-fulfill-session` (idempotent)

to add credits.

## 5) (Recommended) Add a Stripe webhook

Webhooks make credit fulfillment reliable even if the user closes the tab.

### Endpoint

Configure the webhook endpoint to:

- `POST https://YOUR_DOMAIN/api/stripe-webhook`

### Events to send

Enable this event:

- `checkout.session.completed`

### Secret

Copy the webhook signing secret (`whsec_...`) into:

- `STRIPE_WEBHOOK_SECRET`

### Local testing

Use the Stripe CLI:

```bash
stripe login
stripe listen --forward-to http://localhost:8888/api/stripe-webhook
```

(Use the port where your serverless functions are running locally.)

## 6) AI Fix + Credits

The AI fix endpoint is now protected:

- `POST /api/fix` requires `Authorization: Bearer <Clerk session token>`

Server-side behavior:

- If `creditsBalance < 1` → returns `402` with `INSUFFICIENT_CREDITS`.
- Calls the AI.
- If the AI returns `fixedText` → deducts **1 credit** and returns `creditsRemaining`.
- Otherwise → no charge.

## Notes

- If you want the user to pay exactly $10 *net* after Stripe fees, you must charge slightly more.
  This repo defaults to **1061 cents** to roughly cover Stripe's typical US card fee (~2.9% + $0.30).
  Adjust this in `DEFAULT_CREDITS_PACK` if needed.

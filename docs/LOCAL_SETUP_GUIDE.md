# Comprehensive Local Setup Guide for MermaidMuse

This guide will walk you through setting up MermaidMuse locally, including all third-party services (Clerk, Stripe, AI Providers).

## 1. Prerequisites

- **Node.js**: v18 or higher (check with `node -v`)
- **Git**: (check with `git --version`)
- A code editor (VS Code recommended)

## 2. Clone and Install using Terminal

```bash
# Clone the repo (if you haven't already)
git clone https://github.com/lsj5031/MermaidMuse.git
cd MermaidMuse

# Install dependencies
npm install
```

## 3. Third-Party Service Setup

You need to set up accounts for Authentication (Clerk), Payments (Stripe), and AI (OpenAI or Groq).

### A. Authentication: Clerk (Required)

Clerk handles user accounts and stores credit balances.

1.  **Create Account**: Go to [dashboard.clerk.com](https://dashboard.clerk.com/) and sign up.
2.  **Create Application**:
    - Click **"Create application"**.
    - Name it "MermaidMuse Local".
    - Select **"Email, Password"** and/or **"Google"** as sign-in methods.
    - Click **"Create Application"**.
3.  **Get Keys**:
    - In the sidebar, go to **"API Keys"**.
    - Copy the **Publishable key** (`pk_test_...`) and **Secret key** (`sk_test_...`).
    - Keep these ready for Step 4.

### B. Payments: Stripe (Optional but recommended)

Stripe handles purchasing more credits.

1.  **Create Account**: Go to [dashboard.stripe.com](https://dashboard.stripe.com/) and sign up.
2.  **Enable Test Mode**:
    - **Crucial**: Toggle the **"Test mode"** switch in the top right corner. You should see an orange banner.
3.  **Get Keys**:
    - Go to **Developers** -> **API keys**.
    - Copy the **Publishable key** (`pk_test_...`) and **Secret key** (`sk_test_...`).
4.  **Steps for Webhook (Optional)**:
    - If you want to test the full payment loop locally, you need the Stripe CLI.
    - Run `stripe login` in your terminal.
    - Run `stripe listen --forward-to http://localhost:8787/api/stripe-webhook`.
    - Copy the **Webhook Signing Secret** (`whsec_...`) printed in the terminal.

### C. AI Provider: Groq or OpenAI (Required for AI features)

You need an AI provider to generate diagrams.

**Option 1: Groq (Free & Fast - Recommended)**

1.  Go to [console.groq.com](https://console.groq.com/).
2.  Sign up/Login.
3.  Go to **API Keys** and create a new key.
4.  Copy the key (`gsk_...`).
5.  Use Model: `llama-3.3-70b-versatile` (or similar).

**Option 2: OpenAI (Paid)**

1.  Go to [platform.openai.com](https://platform.openai.com/).
2.  Go to **API Keys** and create one.
3.  Copy the key (`sk-...`).
4.  Use Model: `gpt-4o`.

## 4. Environment Configuration

1.  **Create the file**:
    Duplicate the example file to create your local config.

    ```bash
    cp .env.example .env.local
    ```

2.  **Edit `.env.local`**:
    Open the file and fill in the keys you gathered above.

    ```env
    # -------------------
    # AI CONFIGURATION
    # -------------------
    # Example for Groq:
    OPENAPI_API_KEY=gsk_your_groq_key
    OPENAPI_MODEL=llama-3.3-70b-versatile
    OPENAPI_BASE_URL=https://api.groq.com/openai/v1

    # Example for OpenAI:
    # OPENAPI_API_KEY=sk-your_openai_key
    # OPENAPI_MODEL=gpt-4o
    # OPENAPI_BASE_URL=https://api.openai.com/v1

    # -------------------
    # CLERK (AUTH)
    # -------------------
    VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
    CLERK_SECRET_KEY=sk_test_...

    # -------------------
    # STRIPE (PAYMENTS)
    # -------------------
    VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
    STRIPE_SECRET_KEY=sk_test_...
    STRIPE_WEBHOOK_SECRET=whsec_...
    ```

## 5. Running the App

You need two terminals running to have the full app working (Frontend + Backend).

**Terminal 1: Backend (Cloudflare Workers)**
This runs the API that communicates with Stripe and AI providers.

```bash
npm run dev:workers
```

_It should start on `http://localhost:8787`_

**Terminal 2: Frontend (Vite)**
This runs the React application.

```bash
npm run dev
```

_It should start on `http://localhost:5173`_

## 6. Verification

1.  Open `http://localhost:5173`.
2.  **Test Auth**: Sign up using Clerk. You should see a new user created in your Clerk dashboard.
3.  **Test AI**: Try entering "A flowchart for making coffee" and clicking "Generate". If it works, your AI keys are correct.
4.  **Test Payments**: Click the "Credits" or "Top Up" button. You should be taken to a Stripe Checkout page. Use a test card number (e.g., `4242 4242 4242 4242`) to complete the purchase.

## Troubleshooting

- **AI Error?** Check your `OPENAPI_API_KEY` and ensure you have credits/quota with the provider.
- **Payment Error?** Ensure you are using the **Test Mode** keys from Stripe (`pk_test_...`).
- **CORS Error?** Make sure `npm run dev:workers` is running. The frontend proxies API requests to this local worker.

## 7. Security Notes for Local Development

When running locally, some security features behave differently than in production:

### Rate Limiting

- **Local**: Uses in-memory rate limiting (works within a single process)
- **Production**: Requires Cloudflare KV for distributed rate limiting (see `docs/DEPLOYMENT.md`)

### CORS

- **Local**: Automatically allows `localhost` and `127.0.0.1` origins
- **Production**: Restricted to configured `ALLOWED_ORIGINS`

### Stripe Webhooks

For local webhook testing with full signature verification:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to your local worker
stripe listen --forward-to http://localhost:8787/api/stripe-webhook
```

Copy the webhook signing secret (`whsec_...`) printed by the CLI and add it to your `.env.local`:

```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

This ensures webhook signature verification works correctly during local testing.

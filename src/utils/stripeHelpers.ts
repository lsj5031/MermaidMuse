import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null>;

export async function getStripeClient(): Promise<Stripe | null> {
  if (!stripePromise) {
    const stripeKey = import.meta.env.VITE_STRIPE_KEY;
    if (!stripeKey) {
      console.warn('Stripe key not configured');
      return null;
    }
    stripePromise = loadStripe(stripeKey);
  }
  return stripePromise;
}

export async function createPaymentIntent(
  amount: number,
  currency: string = 'usd'
): Promise<string | null> {
  try {
    const response = await fetch('/api/payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount, currency }),
    });

    if (!response.ok) {
      throw new Error('Failed to create payment intent');
    }

    const data = await response.json();
    return data.clientSecret;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return null;
  }
}

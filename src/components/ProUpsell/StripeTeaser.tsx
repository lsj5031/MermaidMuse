import { useMemo, type ReactNode } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { CardElement, Elements } from '@stripe/react-stripe-js';
import { getStripePublishableKey } from '@utils/environmentHelpers';

export interface StripeTeaserProps {
  publishableKey?: string;
  title?: string;
  description?: ReactNode;
  ctaLabel?: string;
  onUpgrade?: () => void;
}

export default function StripeTeaser({
  publishableKey,
  title = 'Pro features',
  description = 'Unlock AI-assisted fixes, advanced exports, and more.',
  ctaLabel = 'Upgrade (coming soon)',
  onUpgrade,
}: StripeTeaserProps) {
  const key = publishableKey ?? getStripePublishableKey();

  const stripePromise = useMemo(() => {
    if (!key) return null;
    return loadStripe(key);
  }, [key]);

  if (!key) {
    return (
      <div className="rounded border border-dark-border bg-dark-surface p-4">
        <div className="text-sm font-semibold text-emerald-500">{title}</div>
        <div className="mt-2 text-xs text-gray-400">
          Stripe is not configured. Set{' '}
          <code className="text-gray-200">VITE_STRIPE_PUBLISHABLE_KEY</code> (or legacy{' '}
          <code className="text-gray-200">VITE_STRIPE_KEY</code>) to show the upgrade teaser.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded border border-dark-border bg-dark-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-emerald-500">{title}</div>
          <div className="mt-1 text-xs text-gray-400">{description}</div>
        </div>
        <span className="text-[10px] px-2 py-1 rounded bg-emerald-500/20 text-emerald-500 border border-emerald-500/40">
          PRO
        </span>
      </div>

      <div className="mt-3">
        <Elements stripe={stripePromise}>
          <div className="rounded border border-dark-border bg-dark-bg px-3 py-2">
            <CardElement options={{ disabled: true, hidePostalCode: true }} />
          </div>
        </Elements>

        <button
          type="button"
          onClick={() => {
            if (onUpgrade) {
              onUpgrade();
              return;
            }

            window.open('https://stripe.com', '_blank', 'noopener,noreferrer');
          }}
          className="mt-3 w-full px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
        >
          {ctaLabel}
        </button>

        <div className="mt-2 text-[11px] text-gray-500">
          Payments are not enabled in this demo build. This is a UI teaser for gating future pro
          features.
        </div>
      </div>
    </div>
  );
}

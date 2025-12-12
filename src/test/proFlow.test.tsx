import { type ReactNode } from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen, cleanup } from '@testing-library/react';

vi.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: { children: ReactNode }) => (
    <div data-testid="elements">{children}</div>
  ),
  CardElement: ({ options }: { options?: { disabled?: boolean } }) => (
    <div data-testid="card" data-disabled={options?.disabled ? 'true' : 'false'} />
  ),
}));

vi.mock('@stripe/stripe-js', () => ({
  loadStripe: () => Promise.resolve(null),
}));

import StripeTeaser from '@components/ProUpsell/StripeTeaser';
import ProGate from '@components/ProUpsell/ProGate';
import { ProProvider } from '@hooks/usePro';
import * as envHelpers from '@utils/environmentHelpers';

describe('Pro upsell / Stripe teaser', () => {
  beforeEach(() => {
    vi.spyOn(envHelpers, 'getStripePublishableKey').mockReturnValue('pk_test_mock');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  it('shows a configuration fallback when no publishable key is provided', () => {
    render(<StripeTeaser publishableKey="" />);
    expect(screen.getByText(/Stripe is not configured/i)).toBeInTheDocument();
    expect(screen.queryByTestId('card')).not.toBeInTheDocument();
  });

  it('renders a disabled CardElement when publishable key is present', () => {
    render(<StripeTeaser publishableKey="pk_test_123" />);
    expect(screen.getByTestId('card')).toHaveAttribute('data-disabled', 'true');
    expect(screen.getByRole('button', { name: /upgrade/i })).toBeEnabled();
  });

  it('gates access to pro-only UI when not pro', () => {
    render(
      <ProProvider initialIsPro={false}>
        <ProGate fallback={<div data-testid="fallback" />}>
          <div data-testid="pro-only" />
        </ProGate>
      </ProProvider>
    );

    expect(screen.getByTestId('fallback')).toBeInTheDocument();
    expect(screen.queryByTestId('pro-only')).not.toBeInTheDocument();
  });

  it('supports a mocked upgrade flow when using the default StripeTeaser fallback', () => {
    render(
      <ProProvider initialIsPro={false}>
        <ProGate>
          <div data-testid="pro-only" />
        </ProGate>
      </ProProvider>
    );

    expect(screen.queryByTestId('pro-only')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /unlock pro/i }));

    expect(screen.getByTestId('pro-only')).toBeInTheDocument();
  });

  it('shows pro-only UI when pro is enabled', () => {
    render(
      <ProProvider initialIsPro={true}>
        <ProGate fallback={<div data-testid="fallback" />}>
          <div data-testid="pro-only" />
        </ProGate>
      </ProProvider>
    );

    expect(screen.getByTestId('pro-only')).toBeInTheDocument();
    expect(screen.queryByTestId('fallback')).not.toBeInTheDocument();
  });
});

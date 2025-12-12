import { useAuth } from '@clerk/clerk-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getApiUrl } from '@utils/environmentHelpers';

export type CreditsBalanceResponse = {
  ok: boolean;
  creditsBalance?: number;
  error?: { code: string; message: string };
};

export type StripeCheckoutSessionResponse = {
  ok: boolean;
  url?: string;
  checkoutSessionId?: string;
  credits?: number;
  amountCents?: number;
  currency?: string;
  error?: { code: string; message: string };
};

export type StripeFulfillResponse = {
  ok: boolean;
  creditsBalance?: number;
  creditsAdded?: number;
  alreadyProcessed?: boolean;
  error?: { code: string; message: string };
};

export function useCredits() {
  const { isSignedIn, getToken } = useAuth();
  const apiUrl = useMemo(() => getApiUrl(), []);

  const [creditsBalance, setCreditsBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fulfillInFlightRef = useRef<string | null>(null);

  const authHeader = useCallback(async (): Promise<Record<string, string> | null> => {
    const token = await getToken();
    if (!token) return null;
    return { Authorization: `Bearer ${token}` };
  }, [getToken]);

  const refresh = useCallback(async () => {
    if (!isSignedIn) {
      setCreditsBalance(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const headers = await authHeader();
      if (!headers) {
        setCreditsBalance(null);
        setError('Not signed in');
        return;
      }

      const response = await fetch(`${apiUrl}/api/credits-balance`, {
        method: 'GET',
        headers,
      });

      const data = (await response.json().catch(() => null)) as CreditsBalanceResponse | null;

      if (!response.ok || !data?.ok || typeof data.creditsBalance !== 'number') {
        throw new Error(data?.error?.message ?? 'Unable to load credits');
      }

      setCreditsBalance(data.creditsBalance);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, authHeader, isSignedIn]);

  const createCheckoutSession = useCallback(async () => {
    if (!isSignedIn) {
      setError('Sign in required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const headers = await authHeader();
      if (!headers) throw new Error('Sign in required');

      const successUrl = `${window.location.origin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${window.location.origin}/?checkout=cancel`;

      const response = await fetch(`${apiUrl}/api/stripe-create-checkout-session`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ successUrl, cancelUrl }),
      });

      const data = (await response.json().catch(() => null)) as StripeCheckoutSessionResponse | null;

      if (!response.ok || !data?.ok || !data.url) {
        throw new Error(data?.error?.message ?? 'Unable to start checkout');
      }

      window.location.assign(data.url);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      setIsLoading(false);
    }
  }, [apiUrl, authHeader, isSignedIn]);

  const fulfillCheckoutSession = useCallback(
    async (sessionId: string) => {
      if (!isSignedIn) return;

      fulfillInFlightRef.current = sessionId;
      setIsLoading(true);
      setError(null);

      try {
        const headers = await authHeader();
        if (!headers) throw new Error('Sign in required');

        const response = await fetch(`${apiUrl}/api/stripe-fulfill-session`, {
          method: 'POST',
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionId }),
        });

        const data = (await response.json().catch(() => null)) as StripeFulfillResponse | null;

        if (!response.ok || !data?.ok || typeof data.creditsBalance !== 'number') {
          throw new Error(data?.error?.message ?? 'Unable to finalize purchase');
        }

        setCreditsBalance(data.creditsBalance);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
      } finally {
        fulfillInFlightRef.current = null;
        setIsLoading(false);
      }
    },
    [apiUrl, authHeader, isSignedIn]
  );

  useEffect(() => {
    if (!isSignedIn) {
      setCreditsBalance(null);
      setError(null);
      return;
    }

    void refresh();
  }, [isSignedIn, refresh]);

  useEffect(() => {
    if (!isSignedIn) return;

    const params = new URLSearchParams(window.location.search);
    const checkout = params.get('checkout');
    const sessionId = params.get('session_id');

    if (checkout !== 'success' || !sessionId) return;
    if (fulfillInFlightRef.current === sessionId) return;

    void fulfillCheckoutSession(sessionId).finally(() => {
      const nextParams = new URLSearchParams(window.location.search);
      nextParams.delete('checkout');
      nextParams.delete('session_id');

      const query = nextParams.toString();
      const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
      window.history.replaceState(null, '', nextUrl);
    });
  }, [fulfillCheckoutSession, isSignedIn]);

  return {
    creditsBalance,
    isLoading,
    error,
    refresh,
    createCheckoutSession,
  };
}

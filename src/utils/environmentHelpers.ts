export function getApiUrl(): string {
  const configured = import.meta.env.VITE_API_URL;
  if (configured) return configured;

  if (import.meta.env.DEV) {
    return 'http://localhost:8787';
  }

  return window.location.origin;
}

export function getStripePublishableKey(): string {
  return import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || import.meta.env.VITE_STRIPE_KEY || '';
}

export function getStripeKey(): string {
  return getStripePublishableKey();
}

export function isDevelopment(): boolean {
  return import.meta.env.DEV;
}

export function isProduction(): boolean {
  return import.meta.env.PROD;
}

export function getEnvironmentVariables() {
  return {
    apiUrl: getApiUrl(),
    stripeKey: getStripeKey(),
    stripePublishableKey: getStripePublishableKey(),
    isDev: isDevelopment(),
    isProd: isProduction(),
  };
}

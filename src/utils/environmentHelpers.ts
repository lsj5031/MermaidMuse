export function getApiUrl(): string {
  return import.meta.env.VITE_API_URL || 'http://localhost:3000';
}

export function getStripeKey(): string {
  return import.meta.env.VITE_STRIPE_KEY || '';
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
    isDev: isDevelopment(),
    isProd: isProduction(),
  };
}

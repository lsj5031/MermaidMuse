import { useCreditsContext } from '../context/CreditsContext';

// Re-export types if needed by other files, or update imports
export type {
  CreditsBalanceResponse,
  StripeCheckoutSessionResponse,
  StripeFulfillResponse,
} from '../context/CreditsContext';

export const useCredits = useCreditsContext;

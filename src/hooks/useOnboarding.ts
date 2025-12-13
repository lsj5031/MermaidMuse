import { useState, useEffect } from 'react';

const ONBOARDING_STORAGE_KEY = 'mermaidMuse.onboarding.dismissed';

export function useOnboarding() {
  const [isDismissed, setIsDismissed] = useState<boolean | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    setIsDismissed(stored === 'true');
  }, []);

  const dismiss = () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    setIsDismissed(true);
  };

  const reset = () => {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    setIsDismissed(false);
  };

  return {
    isDismissed,
    dismiss,
    reset,
    shouldShow: isDismissed === false,
  };
}

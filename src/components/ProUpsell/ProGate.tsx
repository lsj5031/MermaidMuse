import type { ReactNode } from 'react';
import { usePro } from '@hooks/usePro';
import StripeTeaser from './StripeTeaser';

export interface ProGateProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export default function ProGate({ children, fallback }: ProGateProps) {
  const { isPro, setIsPro } = usePro();

  if (isPro) {
    return <>{children}</>;
  }

  return (
    <>
      {fallback ?? (
        <StripeTeaser
          ctaLabel="Unlock Pro (mock)"
          onUpgrade={() => {
            setIsPro(true);
          }}
        />
      )}
    </>
  );
}

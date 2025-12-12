import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

interface ProContextValue {
  isPro: boolean;
  setIsPro: (value: boolean) => void;
}

const ProContext = createContext<ProContextValue | null>(null);

interface ProProviderProps {
  children: ReactNode;
  initialIsPro?: boolean;
}

const getDefaultIsPro = (): boolean => {
  const value = import.meta.env.VITE_MOCK_PRO;
  return value === '1' || value === 'true';
};

export function ProProvider({ children, initialIsPro }: ProProviderProps) {
  const [isPro, setIsPro] = useState<boolean>(initialIsPro ?? getDefaultIsPro());

  const contextValue = useMemo<ProContextValue>(() => ({ isPro, setIsPro }), [isPro]);

  return <ProContext.Provider value={contextValue}>{children}</ProContext.Provider>;
}

export function usePro(): ProContextValue {
  const ctx = useContext(ProContext);
  if (!ctx) {
    throw new Error('usePro must be used within a ProProvider');
  }
  return ctx;
}

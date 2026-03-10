import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import {
  LLMConfig,
  LLMConfigContextValue,
  LLM_CONFIG_STORAGE_KEY,
} from '../types/llmConfig';

const LLMConfigContext = createContext<LLMConfigContextValue | null>(null);

interface LLMConfigProviderProps {
  children: ReactNode;
}

/**
 * Load config from localStorage, returns null if invalid or missing
 */
const loadStoredConfig = (): LLMConfig | null => {
  try {
    const stored = localStorage.getItem(LLM_CONFIG_STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    // Validate required fields
    if (
      parsed &&
      typeof parsed.baseUrl === 'string' &&
      typeof parsed.apiKey === 'string' &&
      typeof parsed.model === 'string'
    ) {
      return parsed as LLMConfig;
    }
    return null;
  } catch {
    // Invalid JSON or parse error
    return null;
  }
};

/**
 * Save config to localStorage
 */
const saveConfig = (config: LLMConfig | null): void => {
  if (config === null) {
    localStorage.removeItem(LLM_CONFIG_STORAGE_KEY);
  } else {
    localStorage.setItem(LLM_CONFIG_STORAGE_KEY, JSON.stringify(config));
  }
};

export function LLMConfigProvider({ children }: LLMConfigProviderProps) {
  const [config, setConfigState] = useState<LLMConfig | null>(loadStoredConfig);

  const setConfig = useCallback((newConfig: LLMConfig | null) => {
    setConfigState(newConfig);
    saveConfig(newConfig);
  }, []);

  const clearConfig = useCallback(() => {
    setConfigState(null);
    localStorage.removeItem(LLM_CONFIG_STORAGE_KEY);
  }, []);

  const isConfigured = config !== null && 
    config.baseUrl.trim() !== '' && 
    config.apiKey.trim() !== '' && 
    config.model.trim() !== '';

  const contextValue: LLMConfigContextValue = {
    config,
    isConfigured,
    setConfig,
    clearConfig,
  };

  return (
    <LLMConfigContext.Provider value={contextValue}>
      {children}
    </LLMConfigContext.Provider>
  );
}

export function useLLMConfig(): LLMConfigContextValue {
  const ctx = useContext(LLMConfigContext);
  if (!ctx) {
    throw new Error('useLLMConfig must be used within LLMConfigProvider');
  }
  return ctx;
}

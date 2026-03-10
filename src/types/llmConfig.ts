/**
 * LLM Configuration types for user-configurable AI endpoints.
 * Supports any OpenAI-compatible API (OpenAI, xAI/Grok, Ollama, LM Studio, etc.)
 */

export interface LLMConfig {
  /** Base URL for the API (e.g., "https://api.openai.com/v1") */
  baseUrl: string;
  /** User's API key (stored in localStorage, never on server) */
  apiKey: string;
  /** Model identifier (e.g., "gpt-4o", "grok-beta") */
  model: string;
}

export interface LLMConfigContextValue {
  /** Current LLM configuration (null if not configured) */
  config: LLMConfig | null;
  /** Whether LLM is configured and ready to use */
  isConfigured: boolean;
  /** Update the configuration */
  setConfig: (config: LLMConfig | null) => void;
  /** Clear the stored configuration */
  clearConfig: () => void;
}

/** Default configurations for popular providers */
export const LLM_PROVIDER_DEFAULTS: Record<string, Partial<LLMConfig>> = {
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
  },
  xai: {
    baseUrl: 'https://api.x.ai/v1',
    model: 'grok-beta',
  },
  ollama: {
    baseUrl: 'http://localhost:11434/v1',
    model: 'llama3',
  },
  lmstudio: {
    baseUrl: 'http://localhost:1234/v1',
    model: 'local-model',
  },
};

/** localStorage key for persisting LLM config */
export const LLM_CONFIG_STORAGE_KEY = 'mermaidmuse_llm_config';

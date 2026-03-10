import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ReactNode } from 'react';
import { useLLMConfig, LLMConfigProvider } from '@hooks/useLLMConfig';
import { LLM_CONFIG_STORAGE_KEY } from '../../src/types/llmConfig';

// Helper to render hook with provider
const wrapper = ({ children }: { children: ReactNode }) => (
  <LLMConfigProvider>{children}</LLMConfigProvider>
);

describe('useLLMConfig', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('returns null config and isConfigured=false initially', () => {
    const { result } = renderHook(() => useLLMConfig(), { wrapper });

    expect(result.current.config).toBeNull();
    expect(result.current.isConfigured).toBe(false);
  });

  it('sets and persists config to localStorage', () => {
    const { result } = renderHook(() => useLLMConfig(), { wrapper });

    const testConfig = {
      baseUrl: 'https://api.openai.com/v1',
      apiKey: 'test-key-123',
      model: 'gpt-4o-mini',
    };

    act(() => {
      result.current.setConfig(testConfig);
    });

    expect(result.current.config).toEqual(testConfig);
    expect(result.current.isConfigured).toBe(true);

    // Verify localStorage persistence
    const stored = localStorage.getItem(LLM_CONFIG_STORAGE_KEY);
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored!)).toEqual(testConfig);
  });

  it('loads config from localStorage on mount', () => {
    const existingConfig = {
      baseUrl: 'https://api.x.ai/v1',
      apiKey: 'existing-key',
      model: 'grok-beta',
    };
    localStorage.setItem(LLM_CONFIG_STORAGE_KEY, JSON.stringify(existingConfig));

    const { result } = renderHook(() => useLLMConfig(), { wrapper });

    expect(result.current.config).toEqual(existingConfig);
    expect(result.current.isConfigured).toBe(true);
  });

  it('clears config and removes from localStorage', () => {
    const { result } = renderHook(() => useLLMConfig(), { wrapper });

    const testConfig = {
      baseUrl: 'https://api.openai.com/v1',
      apiKey: 'test-key',
      model: 'gpt-4o',
    };

    act(() => {
      result.current.setConfig(testConfig);
    });

    expect(result.current.isConfigured).toBe(true);

    act(() => {
      result.current.clearConfig();
    });

    expect(result.current.config).toBeNull();
    expect(result.current.isConfigured).toBe(false);
    expect(localStorage.getItem(LLM_CONFIG_STORAGE_KEY)).toBeNull();
  });

  it('handles invalid localStorage data gracefully', () => {
    localStorage.setItem(LLM_CONFIG_STORAGE_KEY, 'not-valid-json');

    const { result } = renderHook(() => useLLMConfig(), { wrapper });

    expect(result.current.config).toBeNull();
    expect(result.current.isConfigured).toBe(false);
  });

  it('throws error when used outside provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useLLMConfig());
    }).toThrow('useLLMConfig must be used within LLMConfigProvider');

    consoleError.mockRestore();
  });

  it('updates config partially while preserving existing fields', () => {
    const { result } = renderHook(() => useLLMConfig(), { wrapper });

    act(() => {
      result.current.setConfig({
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'original-key',
        model: 'gpt-4o',
      });
    });

    act(() => {
      result.current.setConfig({
        ...result.current.config!,
        model: 'gpt-4o-mini',
      });
    });

    expect(result.current.config?.model).toBe('gpt-4o-mini');
    expect(result.current.config?.apiKey).toBe('original-key');
  });
});

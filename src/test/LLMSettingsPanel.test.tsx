import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within, cleanup } from '@testing-library/react';
import { ReactNode } from 'react';
import { LLMSettingsPanel } from '@components/LLMSettingsPanel';
import { LLMConfigProvider } from '@hooks/useLLMConfig';
import { LLM_CONFIG_STORAGE_KEY } from '../../src/types/llmConfig';

// Mock lucide-react
vi.mock('lucide-react', () => ({
  X: () => <span data-testid="icon-x">X</span>,
  Settings: () => <span data-testid="icon-settings">Settings</span>,
  Check: () => <span data-testid="icon-check">Check</span>,
  AlertCircle: () => <span data-testid="icon-alert">Alert</span>,
  Eye: () => <span data-testid="icon-eye">Eye</span>,
  EyeOff: () => <span data-testid="icon-eye-off">EyeOff</span>,
}));

const wrapper = ({ children }: { children: ReactNode }) => (
  <LLMConfigProvider>{children}</LLMConfigProvider>
);

// Helper to get input by id
const getInputById = (container: HTMLElement, id: string) => 
  container.querySelector(`input#${id}`) as HTMLInputElement;

describe('LLMSettingsPanel', () => {
  beforeEach(() => {
    localStorage.clear();
    cleanup();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it('renders nothing when not open', () => {
    const onClose = vi.fn();
    const { container } = render(
      <LLMSettingsPanel isOpen={false} onClose={onClose} />,
      { wrapper }
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders settings form when open', () => {
    const onClose = vi.fn();
    render(<LLMSettingsPanel isOpen={true} onClose={onClose} />, { wrapper });

    const panel = screen.getByTestId('llm-settings-panel');
    expect(panel).toBeInTheDocument();
    expect(within(panel).getByText('LLM Settings')).toBeInTheDocument();
    expect(within(panel).getByLabelText(/API Endpoint/i)).toBeInTheDocument();
    expect(getInputById(panel, 'llm-apikey')).toBeInTheDocument();
    expect(within(panel).getByLabelText(/Model/i)).toBeInTheDocument();
  });

  it('loads existing config into form fields', () => {
    const existingConfig = {
      baseUrl: 'https://api.openai.com/v1',
      apiKey: 'existing-key',
      model: 'gpt-4o-mini',
    };
    localStorage.setItem(LLM_CONFIG_STORAGE_KEY, JSON.stringify(existingConfig));

    const onClose = vi.fn();
    render(<LLMSettingsPanel isOpen={true} onClose={onClose} />, { wrapper });

    const panel = screen.getByTestId('llm-settings-panel');
    expect(within(panel).getByLabelText(/API Endpoint/i)).toHaveValue(existingConfig.baseUrl);
    expect(getInputById(panel, 'llm-apikey')).toHaveValue(existingConfig.apiKey);
    expect(within(panel).getByLabelText(/Model/i)).toHaveValue(existingConfig.model);
  });

  it('saves config when save button clicked', async () => {
    const onClose = vi.fn();
    render(<LLMSettingsPanel isOpen={true} onClose={onClose} />, { wrapper });

    const panel = screen.getByTestId('llm-settings-panel');
    
    fireEvent.change(within(panel).getByLabelText(/API Endpoint/i), {
      target: { value: 'https://api.openai.com/v1' },
    });
    fireEvent.change(getInputById(panel, 'llm-apikey'), {
      target: { value: 'test-key-123' },
    });
    fireEvent.change(within(panel).getByLabelText(/Model/i), {
      target: { value: 'gpt-4o-mini' },
    });

    // Find save button within panel
    const saveButton = within(panel).getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      const stored = localStorage.getItem(LLM_CONFIG_STORAGE_KEY);
      expect(stored).not.toBeNull();
      expect(JSON.parse(stored!)).toEqual({
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'test-key-123',
        model: 'gpt-4o-mini',
      });
    });

    expect(onClose).toHaveBeenCalled();
  });

  it('shows validation error for empty fields', async () => {
    const onClose = vi.fn();
    render(<LLMSettingsPanel isOpen={true} onClose={onClose} />, { wrapper });

    const panel = screen.getByTestId('llm-settings-panel');
    
    // Find save button within panel
    const saveButton = within(panel).getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(within(panel).getByText(/endpoint is required/i)).toBeInTheDocument();
    });

    expect(onClose).not.toHaveBeenCalled();
  });

  it('clears config when clear button clicked', async () => {
    const existingConfig = {
      baseUrl: 'https://api.openai.com/v1',
      apiKey: 'existing-key',
      model: 'gpt-4o-mini',
    };
    localStorage.setItem(LLM_CONFIG_STORAGE_KEY, JSON.stringify(existingConfig));

    const onClose = vi.fn();
    render(<LLMSettingsPanel isOpen={true} onClose={onClose} />, { wrapper });

    const panel = screen.getByTestId('llm-settings-panel');
    
    const clearButton = within(panel).getByText('Clear');
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(localStorage.getItem(LLM_CONFIG_STORAGE_KEY)).toBeNull();
    });
  });

  it('closes without saving when cancel clicked', async () => {
    const onClose = vi.fn();
    render(<LLMSettingsPanel isOpen={true} onClose={onClose} />, { wrapper });

    const panel = screen.getByTestId('llm-settings-panel');
    
    fireEvent.change(within(panel).getByLabelText(/API Endpoint/i), {
      target: { value: 'https://test.com/v1' },
    });

    const cancelButton = within(panel).getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(onClose).toHaveBeenCalled();
    expect(localStorage.getItem(LLM_CONFIG_STORAGE_KEY)).toBeNull();
  });

  it('shows provider presets buttons', () => {
    const onClose = vi.fn();
    render(<LLMSettingsPanel isOpen={true} onClose={onClose} />, { wrapper });

    const panel = screen.getByTestId('llm-settings-panel');
    
    // Check for preset buttons
    expect(within(panel).getByText('OPENAI')).toBeInTheDocument();
    expect(within(panel).getByText('XAI')).toBeInTheDocument();
  });

  it('fills form with preset values when provider clicked', async () => {
    const onClose = vi.fn();
    render(<LLMSettingsPanel isOpen={true} onClose={onClose} />, { wrapper });

    const panel = screen.getByTestId('llm-settings-panel');
    
    const openaiButton = within(panel).getByText('OPENAI');
    fireEvent.click(openaiButton);

    expect(within(panel).getByLabelText(/API Endpoint/i)).toHaveValue('https://api.openai.com/v1');
    expect(within(panel).getByLabelText(/Model/i)).toHaveValue('gpt-4o-mini');
  });

  it('toggles API key visibility', () => {
    const onClose = vi.fn();
    render(<LLMSettingsPanel isOpen={true} onClose={onClose} />, { wrapper });

    const panel = screen.getByTestId('llm-settings-panel');
    
    const apiKeyInput = getInputById(panel, 'llm-apikey');
    expect(apiKeyInput).toHaveAttribute('type', 'password');

    // Find the toggle button within panel by aria-label
    const toggleButton = within(panel).getByLabelText('Toggle API key visibility');
    fireEvent.click(toggleButton);

    expect(apiKeyInput).toHaveAttribute('type', 'text');
  });
});

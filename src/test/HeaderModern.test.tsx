import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ReactNode } from 'react';
import Header from '@components/layout/HeaderModern';
import { DiagramProvider } from '@hooks/useDiagramState';
import { LLMConfigProvider } from '@hooks/useLLMConfig';

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Download: () => <span data-testid="icon-download">Download</span>,
  Share2: () => <span data-testid="icon-share">Share</span>,
  RotateCcw: () => <span data-testid="icon-reset">Reset</span>,
  Palette: () => <span data-testid="icon-palette">Palette</span>,
  Settings: () => <span data-testid="icon-settings">Settings</span>,
  Pencil: () => <span data-testid="icon-pencil">Pencil</span>,
  X: () => <span data-testid="icon-x">X</span>,
  Eye: () => <span data-testid="icon-eye">Eye</span>,
  EyeOff: () => <span data-testid="icon-eye-off">EyeOff</span>,
}));

// Mock export helpers
vi.mock('@utils/exportHelpers', () => ({
  exportMermaidAsSVG: vi.fn(),
}));

const wrapper = ({ children }: { children: ReactNode }) => (
  <LLMConfigProvider>
    <DiagramProvider>{children}</DiagramProvider>
  </LLMConfigProvider>
);

describe('HeaderModern', () => {
  beforeEach(() => {
    localStorage.clear();
    cleanup();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it('renders settings button in header', () => {
    render(<Header />, { wrapper });

    const settingsButton = screen.getByTitle('Open LLM settings');
    expect(settingsButton).toBeInTheDocument();
  });

  it('opens settings panel when settings button clicked', () => {
    render(<Header />, { wrapper });

    const settingsButton = screen.getByTitle('Open LLM settings');
    fireEvent.click(settingsButton);

    // Settings panel should appear
    const settingsPanel = screen.getByTestId('llm-settings-panel');
    expect(settingsPanel).toBeInTheDocument();
  });

  it('closes settings panel when onClose callback triggered', async () => {
    render(<Header />, { wrapper });

    // Open settings
    const settingsButton = screen.getByTitle('Open LLM settings');
    fireEvent.click(settingsButton);
    expect(screen.getByTestId('llm-settings-panel')).toBeInTheDocument();

    // Close by clicking close button in panel
    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);

    // Panel should be gone
    expect(screen.queryByTestId('llm-settings-panel')).not.toBeInTheDocument();
  });
});

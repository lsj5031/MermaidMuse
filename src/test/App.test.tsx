import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import App from '../App';

// Mock lucide-react - includes all icons used by App and its children
vi.mock('lucide-react', () => ({
  Download: () => <span data-testid="icon-download">Download</span>,
  Share2: () => <span data-testid="icon-share">Share</span>,
  RotateCcw: () => <span data-testid="icon-reset">Reset</span>,
  Palette: () => <span data-testid="icon-palette">Palette</span>,
  Settings: () => <span data-testid="icon-settings">Settings</span>,
  X: () => <span data-testid="icon-x">X</span>,
  AlertTriangle: () => <span data-testid="icon-alert">Alert</span>,
  CheckCircle: () => <span data-testid="icon-check">Check</span>,
  CheckCircle2: () => <span data-testid="icon-check2">Check2</span>,
  Clock: () => <span data-testid="icon-clock">Clock</span>,
  Sparkles: () => <span data-testid="icon-sparkles">Sparkles</span>,
  Eye: () => <span data-testid="icon-eye">Eye</span>,
  EyeOff: () => <span data-testid="icon-eye-off">EyeOff</span>,
  AlertCircle: () => <span data-testid="icon-alert-circle">AlertCircle</span>,
  Copy: () => <span data-testid="icon-copy">Copy</span>,
  ZoomIn: () => <span data-testid="icon-zoom-in">ZoomIn</span>,
  ZoomOut: () => <span data-testid="icon-zoom-out">ZoomOut</span>,
}));

// Mock export helpers
vi.mock('@utils/exportHelpers', () => ({
  exportMermaidAsSVG: vi.fn(),
}));

// Mock html2canvas
vi.mock('html2canvas', () => ({
  default: vi.fn(),
}));

// Mock mermaid
vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    parse: vi.fn().mockResolvedValue(true),
    render: vi.fn().mockResolvedValue({ svg: '<svg></svg>' }),
  },
}));

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    cleanup();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it('renders the main layout', () => {
    render(<App />);

    // Check header is rendered
    expect(screen.getByText('MermaidMuse')).toBeInTheDocument();
  });

  it('renders the editor and preview panes', () => {
    render(<App />);

    // Editor should be present (shows "Diagram is valid" or error count)
    // Preview shows "Ready" status
    expect(screen.getByText('Ready')).toBeInTheDocument();
  });
});

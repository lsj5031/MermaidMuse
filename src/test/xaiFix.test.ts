import { afterEach, describe, expect, it, vi } from 'vitest';
import { fixMermaidSyntax, fixMermaidSyntaxWithXai } from '@/server/xaiFix';

describe('fixMermaidSyntax', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns a graceful fallback when API key is not set', async () => {
    const result = await fixMermaidSyntax('graph TD\nA -->', { apiKey: '' });
    expect(result.ok).toBe(false);
    expect(result.provider).toBe('fallback');
    expect(result.error?.code).toBe('NOT_CONFIGURED');
  });

  it('parses JSON output from LLM and returns fixedText', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [
          {
            message: {
              content: '{"fixedText":"graph TD\\nA-->B","suggestions":["Fixed arrow token"]}',
            },
          },
        ],
      }),
    });

    vi.stubGlobal('fetch', fetchMock);

    const result = await fixMermaidSyntax('graph TD\nA -->', { apiKey: 'test' });
    expect(result.ok).toBe(true);
    expect(result.provider).toBe('llm');
    expect(result.fixedText).toContain('A-->B');
    expect(result.suggestions).toEqual(['Fixed arrow token']);
  });

  it('works with custom baseUrl and model', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [
          {
            message: {
              content: '{"fixedText":"graph TD\\nA-->B","suggestions":[]}',
            },
          },
        ],
      }),
    });

    vi.stubGlobal('fetch', fetchMock);

    const result = await fixMermaidSyntax('graph TD\nA -->', { 
      apiKey: 'test',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4o-mini'
    });
    
    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.openai.com/v1/chat/completions',
      expect.objectContaining({
        body: expect.stringContaining('gpt-4o-mini'),
      })
    );
  });
});

describe('fixMermaidSyntaxWithXai (legacy alias)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('works as alias for fixMermaidSyntax', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [
          {
            message: {
              content: '{"fixedText":"graph TD\\nA-->B","suggestions":[]}',
            },
          },
        ],
      }),
    });

    vi.stubGlobal('fetch', fetchMock);

    const result = await fixMermaidSyntaxWithXai('graph TD\nA -->', { apiKey: 'test' });
    expect(result.ok).toBe(true);
    expect(result.provider).toBe('llm');
  });
});

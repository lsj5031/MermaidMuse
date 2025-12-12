import { afterEach, describe, expect, it, vi } from 'vitest';
import { fixMermaidSyntaxWithXai } from '@/server/xaiFix';

describe('fixMermaidSyntaxWithXai', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns a graceful fallback when API key is not set', async () => {
    const result = await fixMermaidSyntaxWithXai('graph TD\nA -->', { apiKey: '' });
    expect(result.ok).toBe(false);
    expect(result.provider).toBe('fallback');
    expect(result.error?.code).toBe('NOT_CONFIGURED');
  });

  it('parses JSON output from xAI and returns fixedText', async () => {
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

    const result = await fixMermaidSyntaxWithXai('graph TD\nA -->', { apiKey: 'test' });
    expect(result.ok).toBe(true);
    expect(result.provider).toBe('xai');
    expect(result.fixedText).toContain('A-->B');
    expect(result.suggestions).toEqual(['Fixed arrow token']);
  });
});

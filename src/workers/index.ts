import { fixMermaidSyntaxWithXai } from '../server/xaiFix';

type CloudflareEnv = {
  OPENAPI_API_KEY?: string;
  OPENAPI_MODEL?: string;
  OPENAPI_BASE_URL?: string;
};

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object') return null;
  return value as Record<string, unknown>;
};

const json = (status: number, body: unknown): Response => {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};

const parseBody = async (req: Request): Promise<unknown | null> => {
  try {
    const text = await req.text();
    if (!text) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default {
  async fetch(req: Request, env: CloudflareEnv): Promise<Response> {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    // Extract path from URL
    const url = new URL(req.url);
    const pathname = url.pathname;

    // Route /api/fix
    if (pathname === '/api/fix') {
      if (req.method !== 'POST') {
        return json(405, {
          ok: false,
          error: { code: 'METHOD_NOT_ALLOWED', message: 'Use POST.' },
        });
      }

      const parsed = await parseBody(req);
      const payload = asRecord(parsed);

      const diagramText =
        (payload && typeof payload.diagramText === 'string' && payload.diagramText) ||
        (payload && typeof payload.diagram === 'string' && payload.diagram) ||
        (payload && typeof payload.text === 'string' && payload.text) ||
        null;

      if (typeof diagramText !== 'string') {
        return json(400, {
          ok: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'Expected JSON body with { diagramText: string }.',
          },
        });
      }

      const result = await fixMermaidSyntaxWithXai(diagramText, {
        apiKey: env.OPENAPI_API_KEY,
        baseUrl: env.OPENAPI_BASE_URL,
        model: env.OPENAPI_MODEL,
      });

      return json(200, result);
    }

    // Default 404
    return json(404, {
      ok: false,
      error: { code: 'NOT_FOUND', message: 'Endpoint not found.' },
    });
  },
};

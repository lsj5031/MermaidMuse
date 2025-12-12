import { fixMermaidSyntaxWithXai } from '../src/server/xaiFix';

type ApiRequest = {
  method?: string;
  body?: unknown;
};

type ApiResponse = {
  statusCode: number;
  setHeader: (name: string, value: string) => void;
  end: (body?: string) => void;
};

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object') return null;
  return value as Record<string, unknown>;
};

const json = (res: ApiResponse, status: number, body: unknown) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.end(JSON.stringify(body));
};

const parseBody = (req: ApiRequest): unknown | null => {
  const body = req.body;
  if (!body) return null;

  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return null;
    }
  }

  return body;
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    json(res, 405, { ok: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Use POST.' } });
    return;
  }

  const parsed = parseBody(req);
  const payload = asRecord(parsed);

  const diagramText =
    (payload && typeof payload.diagramText === 'string' && payload.diagramText) ||
    (payload && typeof payload.diagram === 'string' && payload.diagram) ||
    (payload && typeof payload.text === 'string' && payload.text) ||
    null;

  if (typeof diagramText !== 'string') {
    json(res, 400, {
      ok: false,
      error: {
        code: 'BAD_REQUEST',
        message: 'Expected JSON body with { diagramText: string }.',
      },
    });
    return;
  }

  const result = await fixMermaidSyntaxWithXai(diagramText);
  json(res, 200, result);
}

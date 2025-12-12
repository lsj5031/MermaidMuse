import { fixMermaidSyntaxWithXai } from '../src/server/xaiFix';
import { getBearerToken, getClerkUserIdFromSessionToken } from '../src/server/clerkServer';
import { ensureCreditsBalance, spendCredits } from '../src/server/creditsServer';

type ApiRequest = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string | string[] | undefined>;
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

const getHeader = (req: ApiRequest, name: string): string | null => {
  const value = req.headers?.[name] ?? req.headers?.[name.toLowerCase()];
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
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

  const authorizationHeader = getHeader(req, 'authorization');
  const token = getBearerToken(authorizationHeader);

  if (!token) {
    json(res, 401, { ok: false, error: { code: 'UNAUTHORIZED', message: 'Sign in required.' } });
    return;
  }

  const userId = await getClerkUserIdFromSessionToken(token);
  if (!userId) {
    json(res, 401, { ok: false, error: { code: 'UNAUTHORIZED', message: 'Invalid session.' } });
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

  try {
    const creditsBefore = await ensureCreditsBalance(userId);

    if (creditsBefore < 1) {
      json(res, 402, {
        ok: false,
        error: {
          code: 'INSUFFICIENT_CREDITS',
          message: 'You do not have enough credits to run an AI fix.',
        },
        creditsCharged: false,
        creditsRemaining: creditsBefore,
      });
      return;
    }

    const result = await fixMermaidSyntaxWithXai(diagramText);

    const shouldCharge = Boolean(result.ok && result.fixedText);
    const creditsRemaining = shouldCharge ? await spendCredits(userId, 1) : creditsBefore;

    json(res, 200, {
      ...result,
      creditsCharged: shouldCharge,
      creditsRemaining,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';

    json(res, 500, {
      ok: false,
      error: { code: 'SERVER_ERROR', message },
    });
  }
}

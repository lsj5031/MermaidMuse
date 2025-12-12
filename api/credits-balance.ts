import { getBearerToken, getClerkUserIdFromSessionToken } from '../src/server/clerkServer';
import { ensureCreditsBalance } from '../src/server/creditsServer';

type ApiRequest = {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
};

type ApiResponse = {
  statusCode: number;
  setHeader: (name: string, value: string) => void;
  end: (body?: string) => void;
};

const json = (res: ApiResponse, status: number, body: unknown) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.end(JSON.stringify(body));
};

const getHeader = (req: ApiRequest, name: string): string | null => {
  const value = req.headers?.[name] ?? req.headers?.[name.toLowerCase()];
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.end();
    return;
  }

  if (req.method !== 'GET') {
    json(res, 405, { ok: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Use GET.' } });
    return;
  }

  const token = getBearerToken(getHeader(req, 'authorization'));
  if (!token) {
    json(res, 401, { ok: false, error: { code: 'UNAUTHORIZED', message: 'Sign in required.' } });
    return;
  }

  const userId = await getClerkUserIdFromSessionToken(token);
  if (!userId) {
    json(res, 401, { ok: false, error: { code: 'UNAUTHORIZED', message: 'Invalid session.' } });
    return;
  }

  try {
    const creditsBalance = await ensureCreditsBalance(userId);
    json(res, 200, { ok: true, creditsBalance });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    json(res, 500, { ok: false, error: { code: 'SERVER_ERROR', message } });
  }
}

import { getBearerToken, getClerkUserIdFromSessionToken } from '../../src/server/clerkServer';
import { ensureCreditsBalance } from '../../src/server/creditsServer';

type NetlifyEvent = {
  httpMethod: string;
  headers?: Record<string, string | undefined>;
};

const buildResponse = (statusCode: number, body: unknown) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  },
  body: JSON.stringify(body),
});

export const handler = async (event: NetlifyEvent) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'GET') {
    return buildResponse(405, {
      ok: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Use GET.' },
    });
  }

  const token = getBearerToken(event.headers?.authorization ?? event.headers?.Authorization);
  if (!token) {
    return buildResponse(401, { ok: false, error: { code: 'UNAUTHORIZED', message: 'Sign in required.' } });
  }

  const userId = await getClerkUserIdFromSessionToken(token);
  if (!userId) {
    return buildResponse(401, { ok: false, error: { code: 'UNAUTHORIZED', message: 'Invalid session.' } });
  }

  try {
    const creditsBalance = await ensureCreditsBalance(userId);
    return buildResponse(200, { ok: true, creditsBalance });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return buildResponse(500, { ok: false, error: { code: 'SERVER_ERROR', message } });
  }
};

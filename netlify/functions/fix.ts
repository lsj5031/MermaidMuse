import { fixMermaidSyntaxWithXai } from '../../src/server/xaiFix';

type NetlifyEvent = {
  httpMethod: string;
  body?: string | null;
};

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object') return null;
  return value as Record<string, unknown>;
};

const buildResponse = (statusCode: number, body: unknown) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return buildResponse(405, {
      ok: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Use POST.' },
    });
  }

  let payload: unknown = null;
  try {
    payload = event.body ? JSON.parse(event.body) : null;
  } catch {
    payload = null;
  }

  const record = asRecord(payload);

  const diagramText =
    (record && typeof record.diagramText === 'string' && record.diagramText) ||
    (record && typeof record.diagram === 'string' && record.diagram) ||
    (record && typeof record.text === 'string' && record.text) ||
    null;

  if (typeof diagramText !== 'string') {
    return buildResponse(400, {
      ok: false,
      error: { code: 'BAD_REQUEST', message: 'Expected JSON body with { diagramText: string }.' },
    });
  }

  const result = await fixMermaidSyntaxWithXai(diagramText);
  return buildResponse(200, result);
};

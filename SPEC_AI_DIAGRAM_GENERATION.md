# Spec: AI Diagram Generation

**Feature**: Natural Language to Mermaid Diagram Generation  
**Endpoint**: `POST /api/generate`  
**Priority**: High (Foundation feature)  
**Credits Cost**: 2 credits per generation

---

## Overview

Allow users to describe a diagram in natural language and have AI generate valid Mermaid syntax. This is the most requested AI feature and serves as the foundation for the AI-first architecture.

---

## API Specification

### Endpoint

```
POST /api/generate
```

### Authentication

- **Required**: Clerk session token via `Authorization: Bearer <token>`
- Uses existing `getBearerToken()` and `getClerkUserIdFromSessionToken()` helpers

### Request Body

```typescript
interface GenerateRequest {
  prompt: string;           // Natural language description (required)
  diagramType?: string;     // Optional hint: 'flowchart' | 'sequence' | 'class' | 'state' | etc.
  style?: 'concise' | 'detailed';  // Optional: affects verbosity of generated diagram
}
```

**Example Request**:
```json
{
  "prompt": "User signup flow: user enters email, system validates, sends verification email, user clicks link, account activated",
  "diagramType": "flowchart"
}
```

### Response Body

```typescript
interface GenerateResponse {
  ok: boolean;
  provider: 'openapi' | 'fallback';
  generatedText: string | null;    // The generated Mermaid code
  diagramType: string | null;      // Detected/used diagram type
  suggestions: string[];           // Tips or alternatives
  creditsCharged: boolean;
  creditsRemaining: number;
  error?: {
    code: string;
    message: string;
  };
}
```

**Success Response** (200):
```json
{
  "ok": true,
  "provider": "openapi",
  "generatedText": "flowchart TD\n    A[User enters email] --> B{Validate email}\n    B -->|Valid| C[Send verification email]\n    B -->|Invalid| D[Show error]\n    C --> E[User clicks link]\n    E --> F[Account activated]",
  "diagramType": "flowchart",
  "suggestions": ["Consider adding error handling for email delivery failure"],
  "creditsCharged": true,
  "creditsRemaining": 8
}
```

**Error Responses**:
- `401` - Unauthorized (missing/invalid token)
- `402` - Insufficient credits
- `400` - Bad request (missing prompt)
- `500` - Server error (API failure)

---

## Backend Implementation

### New File: `src/server/aiGenerate.ts`

```typescript
export interface GenerateResponse {
  ok: boolean;
  provider: 'openapi' | 'fallback';
  generatedText: string | null;
  diagramType: string | null;
  suggestions: string[];
  error?: {
    code: string;
    message: string;
  };
  raw?: unknown;
}

export interface GenerateOptions {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  timeoutMs?: number;
}

const SYSTEM_PROMPT = `You are a Mermaid diagram expert. Generate valid Mermaid diagram code from natural language descriptions.

Rules:
1. Output ONLY valid Mermaid syntax that will render correctly
2. Choose the most appropriate diagram type if not specified
3. Use clear, descriptive node labels
4. Keep diagrams readable (not too many nodes)
5. Return a JSON object with keys: generatedText (string), diagramType (string), suggestions (string[])
6. Do not include markdown fences or any other text outside the JSON

Supported diagram types: flowchart, sequence, class, state, er, gantt, pie, mindmap, timeline, kanban, block, sankey, git, journey`;

export async function generateMermaidDiagram(
  prompt: string,
  options: GenerateOptions & { diagramType?: string; style?: string } = {}
): Promise<GenerateResponse> {
  // Implementation follows same pattern as xaiFix.ts
  // - Validate inputs
  // - Build prompt with optional diagramType hint
  // - Call OpenAPI endpoint
  // - Parse JSON response
  // - Return structured result
}
```

### Worker Route Addition (`src/workers/index.ts`)

Add after the `/api/fix` route:

```typescript
// Route /api/generate
if (pathname === '/api/generate') {
  if (req.method !== 'POST') {
    return json(405, { ok: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Use POST.' } });
  }

  if (!env.CLERK_SECRET_KEY) {
    return json(500, { ok: false, error: { code: 'NOT_CONFIGURED', message: 'CLERK_SECRET_KEY not configured.' } });
  }

  const token = getBearerToken(req.headers.get('Authorization'));
  if (!token) {
    return json(401, { ok: false, error: { code: 'UNAUTHORIZED', message: 'Sign in required.' } });
  }

  const userId = await getClerkUserIdFromSessionToken(token, runtimeEnv);
  if (!userId) {
    return json(401, { ok: false, error: { code: 'UNAUTHORIZED', message: 'Invalid session.' } });
  }

  const parsed = await parseBody(req);
  const payload = asRecord(parsed);
  const prompt = payload && typeof payload.prompt === 'string' ? payload.prompt : null;

  if (!prompt || !prompt.trim()) {
    return json(400, { ok: false, error: { code: 'BAD_REQUEST', message: 'Expected JSON body with { prompt: string }.' } });
  }

  const GENERATION_COST = 2;
  const creditsBefore = await ensureCreditsBalance(userId, runtimeEnv);
  if (creditsBefore < GENERATION_COST) {
    return json(402, {
      ok: false,
      error: { code: 'INSUFFICIENT_CREDITS', message: `Generation requires ${GENERATION_COST} credits.` },
      creditsCharged: false,
      creditsRemaining: creditsBefore,
    });
  }

  const diagramType = payload && typeof payload.diagramType === 'string' ? payload.diagramType : undefined;
  const style = payload && typeof payload.style === 'string' ? payload.style : undefined;

  const result = await generateMermaidDiagram(prompt, {
    apiKey: env.OPENAPI_API_KEY,
    baseUrl: env.OPENAPI_BASE_URL,
    model: env.OPENAPI_MODEL,
    diagramType,
    style,
  });

  const shouldCharge = Boolean(result.ok && result.generatedText);
  const creditsRemaining = shouldCharge
    ? await spendCredits(userId, GENERATION_COST, runtimeEnv)
    : creditsBefore;

  return json(200, { ...result, creditsCharged: shouldCharge, creditsRemaining });
}
```

---

## Frontend Implementation

### New File: `src/utils/generateDiagramApi.ts`

```typescript
import { getApiUrl } from './environmentHelpers';

export interface GenerateDiagramResponse {
  ok: boolean;
  provider: 'openapi' | 'fallback';
  generatedText: string | null;
  diagramType: string | null;
  suggestions: string[];
  creditsCharged?: boolean;
  creditsRemaining?: number;
  error?: {
    code: string;
    message: string;
  };
}

export interface GenerateDiagramOptions {
  timeoutMs?: number;
  token?: string | null;
  diagramType?: string;
  style?: 'concise' | 'detailed';
}

export async function generateDiagram(
  prompt: string,
  options: GenerateDiagramOptions = {}
): Promise<GenerateDiagramResponse> {
  const timeoutMs = options.timeoutMs ?? 30000; // Longer timeout for generation
  const apiUrl = getApiUrl();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (options.token) {
      headers.Authorization = `Bearer ${options.token}`;
    }

    const response = await fetch(`${apiUrl}/api/generate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        prompt,
        diagramType: options.diagramType,
        style: options.style,
      }),
      signal: controller.signal,
    });

    // Error handling same as fixDiagramApi.ts
    // ...

    const data = (await response.json()) as GenerateDiagramResponse;
    return data;
  } catch (err) {
    // Error handling...
  } finally {
    clearTimeout(timeoutId);
  }
}
```

### UI Integration (`src/components/layout/EditorModern.tsx`)

Add "Generate with AI" button to the editor toolbar:

```tsx
// State
const [isGenerating, setIsGenerating] = useState(false);
const [showGenerateModal, setShowGenerateModal] = useState(false);
const [generatePrompt, setGeneratePrompt] = useState('');

// Handler
const handleGenerateWithAI = async () => {
  if (isGenerating || !generatePrompt.trim()) return;

  setIsGenerating(true);
  try {
    const token = await getToken();
    const result = await generateDiagram(generatePrompt, { token });

    if (result.ok && result.generatedText) {
      updateDiagramContent(result.generatedText);
      setShowGenerateModal(false);
      setGeneratePrompt('');
    }

    if (result.creditsCharged) {
      void refreshCredits();
    }
  } finally {
    setIsGenerating(false);
  }
};

// UI - Add button near "Fix with AI"
<button
  onClick={() => setShowGenerateModal(true)}
  className="px-2 py-1 rounded text-xs font-medium bg-purple-500 text-white hover:bg-purple-600"
>
  <Sparkles className="h-3 w-3 inline mr-1" />
  Generate (2 credits)
</button>
```

### New Component: `src/components/GenerateModal.tsx`

Simple modal with:
- Text input for natural language prompt
- Optional diagram type dropdown
- Generate button
- Cancel button
- Loading state

---

## Prompt Engineering

### User Prompt Template

```
Generate a Mermaid ${diagramType || 'diagram'} for the following description:

${prompt}

${style === 'detailed' ? 'Include detailed labels and comprehensive flow.' : 'Keep the diagram concise and focused.'}
```

### Expected AI Output Format

```json
{
  "generatedText": "flowchart TD\n    A[Start] --> B[Process]\n    B --> C[End]",
  "diagramType": "flowchart",
  "suggestions": [
    "Consider adding decision nodes for branching logic",
    "You could use subgraphs to group related steps"
  ]
}
```

---

## Testing Checklist

- [ ] Endpoint returns 401 without auth token
- [ ] Endpoint returns 402 with insufficient credits
- [ ] Endpoint returns 400 with empty/missing prompt
- [ ] Successful generation deducts 2 credits
- [ ] Failed generation does not deduct credits
- [ ] Generated Mermaid syntax is valid and renders
- [ ] Frontend modal opens/closes correctly
- [ ] Loading states work correctly
- [ ] Credits widget updates after generation

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/server/aiGenerate.ts` | Create | AI generation logic |
| `src/utils/generateDiagramApi.ts` | Create | Frontend API client |
| `src/components/GenerateModal.tsx` | Create | Generation prompt modal |
| `src/workers/index.ts` | Modify | Add `/api/generate` route |
| `src/components/layout/EditorModern.tsx` | Modify | Add generate button |

---

## Future Enhancements

1. **Template library**: Pre-built prompts for common diagram types
2. **Diagram type auto-detection**: AI chooses best type based on prompt
3. **Iterative generation**: "Make it more detailed" follow-ups
4. **History**: Save previous generations for reference

# Spec: AI Refinement Mode

**Feature**: Multi-turn Iterative Diagram Refinement  
**Endpoint**: `POST /api/refine`  
**Priority**: High  
**Credits Cost**: 1 credit per refinement

---

## Overview

Enable users to iteratively refine diagrams through conversational AI interactions. Users can apply successive changes like "add more detail", "simplify", or "add error handling" while the AI maintains context of the conversation history.

---

## User Experience

### Refinement Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         REFINEMENT CHAT                             │
├─────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ You: "Add error handling for failed payments"                   │ │
│ │ ───────────────────────────────────────────────────────────────│ │
│ │ AI: Added 3 error handling branches for payment failures:      │ │
│ │     - Card declined → Show error message                       │ │
│ │     - Network error → Retry option                             │ │
│ │     - Timeout → Cancel and refund                              │ │
│ │                                     [Apply Changes] [Discard]  │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ You: "Make it more concise"                                    │ │
│ │ ───────────────────────────────────────────────────────────────│ │
│ │ AI: Simplified by combining related nodes:                     │ │
│ │     - Merged 3 error types into single "Handle Error" node     │ │
│ │     - Reduced from 15 to 10 nodes                              │ │
│ │                                     [Apply Changes] [Discard]  │ │
│ └─────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│ Quick Actions:                                                      │
│ [Add detail] [Simplify] [Add errors] [Split subgraphs] [Styling]   │
├─────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ Type your refinement instruction...                      [Send]│ │
│ └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Interactions

1. **Quick Actions**: Pre-defined refinement buttons for common operations
2. **Custom Instructions**: Free-text input for specific changes
3. **Preview**: See changes before applying
4. **History**: View and revisit previous refinements
5. **Undo**: Revert to any previous state in the session

---

## API Specification

### Endpoint

```
POST /api/refine
```

### Authentication

- **Required**: Clerk session token via `Authorization: Bearer <token>`

### Request Body

```typescript
interface RefinementTurn {
  id: string;
  role: 'user' | 'assistant';
  instruction: string;      // User's refinement request
  diagramBefore: string;    // Diagram state before this turn
  diagramAfter: string;     // Diagram state after this turn
  summary?: string;         // AI's summary of changes made
  timestamp: number;
}

interface RefineRequest {
  diagramText: string;      // Current diagram (required)
  instruction: string;      // What to change (required)
  history?: RefinementTurn[];  // Previous conversation turns (optional)
}
```

**Example Request**:
```json
{
  "diagramText": "flowchart TD\n    A[Start] --> B[Process Payment]\n    B --> C[Success]\n    B --> D[Failure]",
  "instruction": "Add retry logic for failed payments with a maximum of 3 attempts",
  "history": [
    {
      "id": "turn_1",
      "role": "user",
      "instruction": "Create a basic payment flow",
      "diagramBefore": "",
      "diagramAfter": "flowchart TD\n    A[Start] --> B[Process Payment]\n    B --> C[Success]\n    B --> D[Failure]",
      "summary": "Created basic payment flow with success and failure paths",
      "timestamp": 1702425600000
    }
  ]
}
```

### Response Body

```typescript
interface RefineResponse {
  ok: boolean;
  provider: 'openapi' | 'fallback';
  refinedText: string | null;     // The modified diagram
  summary: string;                 // Human-readable summary of changes
  changes: {
    nodesAdded: number;
    nodesRemoved: number;
    nodesModified: number;
    edgesAdded: number;
    edgesRemoved: number;
  };
  suggestions: string[];           // Follow-up suggestions
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
  "refinedText": "flowchart TD\n    A[Start] --> B[Process Payment]\n    B --> C{Success?}\n    C -->|Yes| D[Complete]\n    C -->|No| E{Attempts < 3?}\n    E -->|Yes| B\n    E -->|No| F[Failed - Max Retries]",
  "summary": "Added retry logic with counter. Payment now retries up to 3 times before failing permanently.",
  "changes": {
    "nodesAdded": 3,
    "nodesRemoved": 1,
    "nodesModified": 1,
    "edgesAdded": 4,
    "edgesRemoved": 2
  },
  "suggestions": [
    "Consider adding a delay between retry attempts",
    "You might want to log each retry for debugging"
  ],
  "creditsCharged": true,
  "creditsRemaining": 6
}
```

---

## Backend Implementation

### New File: `src/server/aiRefine.ts`

```typescript
export interface RefinementTurn {
  id: string;
  role: 'user' | 'assistant';
  instruction: string;
  diagramBefore: string;
  diagramAfter: string;
  summary?: string;
  timestamp: number;
}

export interface RefineResponse {
  ok: boolean;
  provider: 'openapi' | 'fallback';
  refinedText: string | null;
  summary: string;
  changes: {
    nodesAdded: number;
    nodesRemoved: number;
    nodesModified: number;
    edgesAdded: number;
    edgesRemoved: number;
  };
  suggestions: string[];
  error?: {
    code: string;
    message: string;
  };
  raw?: unknown;
}

export interface RefineOptions {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  timeoutMs?: number;
}

const SYSTEM_PROMPT = `You are a Mermaid diagram refinement expert. Your job is to modify existing diagrams based on user instructions while preserving the overall structure and intent.

Rules:
1. Make ONLY the changes requested - do not add unrequested features
2. Preserve existing node IDs and connections where possible
3. Maintain consistent styling with the existing diagram
4. If the instruction is unclear, make reasonable assumptions and explain them
5. Return valid Mermaid syntax that will render correctly

Consider the conversation history to understand context and avoid repeating previous changes.

Return a JSON object with:
{
  "refinedText": string,        // The modified Mermaid diagram
  "summary": string,            // 1-2 sentence summary of what changed
  "changes": {
    "nodesAdded": number,
    "nodesRemoved": number,
    "nodesModified": number,
    "edgesAdded": number,
    "edgesRemoved": number
  },
  "suggestions": string[]       // 1-3 follow-up suggestions
}`;

function buildConversationHistory(history: RefinementTurn[]): string {
  if (!history.length) return '';

  return history
    .map((turn) => {
      if (turn.role === 'user') {
        return `User requested: "${turn.instruction}"`;
      } else {
        return `Assistant made changes: ${turn.summary || 'Modified diagram'}`;
      }
    })
    .join('\n');
}

export async function refineMermaidDiagram(
  diagramText: string,
  instruction: string,
  options: RefineOptions & { history?: RefinementTurn[] } = {}
): Promise<RefineResponse> {
  const history = options.history ?? [];
  const historyContext = buildConversationHistory(history);

  const userPrompt = `${historyContext ? `Previous conversation:\n${historyContext}\n\n` : ''}Current diagram:
\`\`\`mermaid
${diagramText}
\`\`\`

User instruction: ${instruction}

Apply the requested changes and return the result as JSON.`;

  // Implementation follows xaiFix.ts pattern
  // - Call OpenAPI endpoint
  // - Parse JSON response
  // - Return structured result
}
```

### Worker Route Addition (`src/workers/index.ts`)

```typescript
// Route /api/refine
if (pathname === '/api/refine') {
  if (req.method !== 'POST') {
    return json(405, { ok: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Use POST.' } });
  }

  // Auth check...
  // Credits check (1 credit)...

  const parsed = await parseBody(req);
  const payload = asRecord(parsed);

  const diagramText = payload && typeof payload.diagramText === 'string' ? payload.diagramText : null;
  const instruction = payload && typeof payload.instruction === 'string' ? payload.instruction : null;

  if (!diagramText || !instruction?.trim()) {
    return json(400, {
      ok: false,
      error: { code: 'BAD_REQUEST', message: 'Expected { diagramText: string, instruction: string }.' }
    });
  }

  const history = Array.isArray(payload?.history) ? payload.history : [];

  const result = await refineMermaidDiagram(diagramText, instruction, {
    apiKey: env.OPENAPI_API_KEY,
    baseUrl: env.OPENAPI_BASE_URL,
    model: env.OPENAPI_MODEL,
    history,
  });

  const shouldCharge = Boolean(result.ok && result.refinedText);
  const creditsRemaining = shouldCharge ? await spendCredits(userId, 1, runtimeEnv) : creditsBefore;

  return json(200, { ...result, creditsCharged: shouldCharge, creditsRemaining });
}
```

---

## Frontend Implementation

### New File: `src/utils/refineDiagramApi.ts`

```typescript
import { getApiUrl } from './environmentHelpers';

export interface RefinementTurn {
  id: string;
  role: 'user' | 'assistant';
  instruction: string;
  diagramBefore: string;
  diagramAfter: string;
  summary?: string;
  timestamp: number;
}

export interface RefineDiagramResponse {
  ok: boolean;
  provider: 'openapi' | 'fallback';
  refinedText: string | null;
  summary: string;
  changes: {
    nodesAdded: number;
    nodesRemoved: number;
    nodesModified: number;
    edgesAdded: number;
    edgesRemoved: number;
  };
  suggestions: string[];
  creditsCharged?: boolean;
  creditsRemaining?: number;
  error?: {
    code: string;
    message: string;
  };
}

export interface RefineDiagramOptions {
  timeoutMs?: number;
  token?: string | null;
  history?: RefinementTurn[];
}

export async function refineDiagram(
  diagramText: string,
  instruction: string,
  options: RefineDiagramOptions = {}
): Promise<RefineDiagramResponse> {
  const timeoutMs = options.timeoutMs ?? 20000;
  const apiUrl = getApiUrl();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (options.token) {
      headers.Authorization = `Bearer ${options.token}`;
    }

    const response = await fetch(`${apiUrl}/api/refine`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        diagramText,
        instruction,
        history: options.history,
      }),
      signal: controller.signal,
    });

    // Error handling similar to fixDiagramApi.ts
    // ...

    const data = (await response.json()) as RefineDiagramResponse;
    return data;
  } catch (err) {
    // Error handling...
  } finally {
    clearTimeout(timeoutId);
  }
}
```

### New Hook: `src/hooks/useAIRefinement.ts`

```typescript
import { useAuth } from '@clerk/clerk-react';
import { useCallback, useState } from 'react';
import { refineDiagram, RefineDiagramResponse, RefinementTurn } from '@utils/refineDiagramApi';

interface UseAIRefinementReturn {
  turns: RefinementTurn[];
  isRefining: boolean;
  error: string | null;
  pendingResult: RefineDiagramResponse | null;
  
  refine: (instruction: string, currentDiagram: string) => Promise<void>;
  applyPending: () => string | null;
  discardPending: () => void;
  undoToTurn: (turnId: string) => string | null;
  clearHistory: () => void;
}

export function useAIRefinement(): UseAIRefinementReturn {
  const { getToken } = useAuth();

  const [turns, setTurns] = useState<RefinementTurn[]>([]);
  const [isRefining, setIsRefining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingResult, setPendingResult] = useState<RefineDiagramResponse | null>(null);
  const [pendingDiagramBefore, setPendingDiagramBefore] = useState<string | null>(null);
  const [pendingInstruction, setPendingInstruction] = useState<string | null>(null);

  const refine = useCallback(async (instruction: string, currentDiagram: string) => {
    if (isRefining) return;

    setIsRefining(true);
    setError(null);
    setPendingResult(null);
    setPendingDiagramBefore(currentDiagram);
    setPendingInstruction(instruction);

    try {
      const token = await getToken();
      const result = await refineDiagram(currentDiagram, instruction, {
        token,
        history: turns,
      });

      if (result.ok && result.refinedText) {
        setPendingResult(result);
      } else {
        setError(result.error?.message ?? 'Refinement failed');
        setPendingDiagramBefore(null);
        setPendingInstruction(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setPendingDiagramBefore(null);
      setPendingInstruction(null);
    } finally {
      setIsRefining(false);
    }
  }, [getToken, isRefining, turns]);

  const applyPending = useCallback((): string | null => {
    if (!pendingResult?.refinedText || !pendingDiagramBefore || !pendingInstruction) {
      return null;
    }

    const userTurn: RefinementTurn = {
      id: `turn_${Date.now()}_user`,
      role: 'user',
      instruction: pendingInstruction,
      diagramBefore: pendingDiagramBefore,
      diagramAfter: pendingResult.refinedText,
      timestamp: Date.now(),
    };

    const assistantTurn: RefinementTurn = {
      id: `turn_${Date.now()}_assistant`,
      role: 'assistant',
      instruction: pendingInstruction,
      diagramBefore: pendingDiagramBefore,
      diagramAfter: pendingResult.refinedText,
      summary: pendingResult.summary,
      timestamp: Date.now(),
    };

    setTurns((prev) => [...prev, userTurn, assistantTurn]);

    const refinedText = pendingResult.refinedText;
    setPendingResult(null);
    setPendingDiagramBefore(null);
    setPendingInstruction(null);

    return refinedText;
  }, [pendingResult, pendingDiagramBefore, pendingInstruction]);

  const discardPending = useCallback(() => {
    setPendingResult(null);
    setPendingDiagramBefore(null);
    setPendingInstruction(null);
  }, []);

  const undoToTurn = useCallback((turnId: string): string | null => {
    const turnIndex = turns.findIndex((t) => t.id === turnId);
    if (turnIndex === -1) return null;

    const targetTurn = turns[turnIndex];
    setTurns((prev) => prev.slice(0, turnIndex));

    return targetTurn.diagramBefore;
  }, [turns]);

  const clearHistory = useCallback(() => {
    setTurns([]);
    setPendingResult(null);
    setPendingDiagramBefore(null);
    setPendingInstruction(null);
    setError(null);
  }, []);

  return {
    turns,
    isRefining,
    error,
    pendingResult,
    refine,
    applyPending,
    discardPending,
    undoToTurn,
    clearHistory,
  };
}
```

### New Component: `src/components/AIAssistant/RefinementChat.tsx`

```tsx
import React, { useState } from 'react';
import { SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';
import { useAIRefinement } from '@hooks/useAIRefinement';
import { useCredits } from '@hooks/useCredits';
import { useDiagramState } from '@hooks/useDiagramState';
import {
  Send,
  Check,
  X,
  RotateCcw,
  Trash2,
  Plus,
  Minus,
  Sparkles,
  MessageSquare,
} from 'lucide-react';

const QUICK_ACTIONS = [
  { label: 'Add detail', instruction: 'Add more detail and specificity to the nodes and connections' },
  { label: 'Simplify', instruction: 'Simplify the diagram by combining related nodes and removing redundancy' },
  { label: 'Add errors', instruction: 'Add error handling paths and edge cases' },
  { label: 'Subgraphs', instruction: 'Organize related nodes into logical subgraphs' },
  { label: 'Labels', instruction: 'Add or improve edge labels to clarify relationships' },
];

interface RefinementChatProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RefinementChat: React.FC<RefinementChatProps> = ({ isOpen, onClose }) => {
  const { currentDiagram, updateDiagramContent } = useDiagramState();
  const { creditsBalance, createCheckoutSession, refresh: refreshCredits } = useCredits();
  const {
    turns,
    isRefining,
    error,
    pendingResult,
    refine,
    applyPending,
    discardPending,
    undoToTurn,
    clearHistory,
  } = useAIRefinement();

  const [inputValue, setInputValue] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (instruction: string) => {
    if (!instruction.trim() || isRefining) return;
    setInputValue('');
    await refine(instruction, currentDiagram.content);
  };

  const handleApply = () => {
    const refinedText = applyPending();
    if (refinedText) {
      updateDiagramContent(refinedText);
      void refreshCredits();
    }
  };

  const handleUndo = (turnId: string) => {
    const previousDiagram = undoToTurn(turnId);
    if (previousDiagram) {
      updateDiagramContent(previousDiagram);
    }
  };

  return (
    <div className="w-96 border-l border-gray-200 bg-white flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-purple-500" />
          <h2 className="font-semibold text-gray-800">Refine Diagram</h2>
        </div>
        <div className="flex items-center gap-2">
          {turns.length > 0 && (
            <button
              onClick={clearHistory}
              className="text-gray-400 hover:text-red-500"
              title="Clear history"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Conversation History */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {turns.length === 0 && !pendingResult && (
          <div className="text-center text-gray-400 py-8">
            <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Start refining your diagram</p>
            <p className="text-xs">Use quick actions or type a custom instruction</p>
          </div>
        )}

        {/* Past Turns */}
        {turns.map((turn, index) => (
          turn.role === 'user' ? (
            <div key={turn.id} className="flex justify-end">
              <div className="bg-purple-100 text-purple-900 rounded-lg px-3 py-2 max-w-[80%] text-sm">
                {turn.instruction}
              </div>
            </div>
          ) : (
            <div key={turn.id} className="space-y-2">
              <div className="bg-gray-100 rounded-lg px-3 py-2 text-sm">
                <p className="text-gray-800">{turn.summary}</p>
              </div>
              <button
                onClick={() => handleUndo(turn.id)}
                className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                Undo to this point
              </button>
            </div>
          )
        ))}

        {/* Pending Result */}
        {pendingResult && (
          <div className="space-y-3 p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-green-800">{pendingResult.summary}</p>

            {/* Changes Summary */}
            <div className="flex flex-wrap gap-2 text-xs">
              {pendingResult.changes.nodesAdded > 0 && (
                <span className="flex items-center gap-1 text-green-600">
                  <Plus className="h-3 w-3" />
                  {pendingResult.changes.nodesAdded} nodes
                </span>
              )}
              {pendingResult.changes.nodesRemoved > 0 && (
                <span className="flex items-center gap-1 text-red-600">
                  <Minus className="h-3 w-3" />
                  {pendingResult.changes.nodesRemoved} nodes
                </span>
              )}
            </div>

            {/* Suggestions */}
            {pendingResult.suggestions.length > 0 && (
              <div className="text-xs text-gray-500">
                <p className="font-medium">Suggestions:</p>
                <ul className="list-disc list-inside">
                  {pendingResult.suggestions.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleApply}
                className="flex-1 py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600 flex items-center justify-center gap-1"
              >
                <Check className="h-4 w-4" />
                Apply Changes
              </button>
              <button
                onClick={discardPending}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
        )}

        {/* Loading */}
        {isRefining && (
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <div className="animate-spin h-4 w-4 border-2 border-purple-500 border-t-transparent rounded-full" />
            Refining diagram...
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-2 border-t border-gray-100">
        <div className="flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              onClick={() => void handleSubmit(action.instruction)}
              disabled={isRefining || pendingResult !== null}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <SignedOut>
          <SignInButton mode="modal">
            <button className="w-full py-2 bg-purple-500 text-white rounded-lg text-sm hover:bg-purple-600">
              Sign in to refine diagrams
            </button>
          </SignInButton>
        </SignedOut>

        <SignedIn>
          {creditsBalance !== null && creditsBalance < 1 ? (
            <button
              onClick={() => void createCheckoutSession()}
              className="w-full py-2 bg-purple-500 text-white rounded-lg text-sm hover:bg-purple-600"
            >
              Top up credits to refine
            </button>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void handleSubmit(inputValue)}
                placeholder="Describe your changes..."
                disabled={isRefining || pendingResult !== null}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-50"
              />
              <button
                onClick={() => void handleSubmit(inputValue)}
                disabled={isRefining || !inputValue.trim() || pendingResult !== null}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          )}
        </SignedIn>
      </div>
    </div>
  );
};
```

---

## Integration with AI Assistant Panel

The RefinementChat can be accessed from the AI Assistant Panel:

```tsx
// In AIAssistantPanel.tsx
const [showRefinement, setShowRefinement] = useState(false);

// Add tab or toggle:
<button onClick={() => setShowRefinement(!showRefinement)}>
  {showRefinement ? 'Analysis' : 'Refine'}
</button>

// Conditionally render:
{showRefinement ? <RefinementChat /> : <AnalysisList />}
```

---

## Prompt Engineering Details

### System Prompt (Full)

```
You are a Mermaid diagram refinement expert. Your job is to modify existing diagrams based on user instructions while preserving the overall structure and intent.

Rules:
1. Make ONLY the changes requested - do not add unrequested features
2. Preserve existing node IDs and connections where possible
3. Maintain consistent styling with the existing diagram
4. If the instruction is unclear, make reasonable assumptions and explain them
5. Return valid Mermaid syntax that will render correctly
6. Keep the diagram readable - if adding many nodes, use subgraphs

Consider the conversation history to:
- Avoid repeating changes that were already made
- Build on previous refinements coherently
- Understand the user's overall intent

Return a JSON object with:
{
  "refinedText": string,        // The modified Mermaid diagram
  "summary": string,            // 1-2 sentence summary of what changed
  "changes": {
    "nodesAdded": number,
    "nodesRemoved": number,
    "nodesModified": number,
    "edgesAdded": number,
    "edgesRemoved": number
  },
  "suggestions": string[]       // 1-3 follow-up suggestions (optional)
}

Do not include markdown fences. Return only the JSON object.
```

### User Prompt Template

```
Previous conversation:
${historyContext}

Current diagram:
\`\`\`mermaid
${diagramText}
\`\`\`

User instruction: ${instruction}

Apply the requested changes and return the result as JSON.
```

---

## Testing Checklist

- [ ] Endpoint returns 401 without auth token
- [ ] Endpoint returns 402 with insufficient credits
- [ ] Endpoint returns 400 with missing instruction
- [ ] Successful refinement deducts 1 credit
- [ ] Failed refinement does not deduct credits
- [ ] Refined diagram is valid Mermaid syntax
- [ ] History is passed correctly to subsequent calls
- [ ] Quick actions trigger correct instructions
- [ ] Apply/Discard buttons work correctly
- [ ] Undo reverts to correct diagram state
- [ ] Clear history resets conversation
- [ ] Loading states display correctly
- [ ] Error states handled gracefully

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/server/aiRefine.ts` | Create | Refinement logic |
| `src/utils/refineDiagramApi.ts` | Create | Frontend API client |
| `src/hooks/useAIRefinement.ts` | Create | State management hook |
| `src/components/AIAssistant/RefinementChat.tsx` | Create | Chat UI component |
| `src/workers/index.ts` | Modify | Add `/api/refine` route |
| `src/components/AIAssistant/AIAssistantPanel.tsx` | Modify | Add refinement tab |

---

## Future Enhancements

1. **Diff view**: Show visual diff of changes before applying
2. **Voice input**: Speak refinement instructions
3. **Presets library**: Save custom quick actions
4. **Undo/Redo shortcuts**: Keyboard shortcuts for history navigation
5. **Export session**: Save refinement session for later reference
6. **Collaborative refinement**: Share session with others

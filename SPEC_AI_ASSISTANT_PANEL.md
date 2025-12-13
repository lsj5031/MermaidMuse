# Spec: AI Assistant Panel

**Feature**: Real-time AI Suggestions Panel  
**Endpoint**: `POST /api/analyze`  
**Priority**: High  
**Credits Cost**: 1 credit per analysis

---

## Overview

A collapsible side panel that provides real-time AI-powered suggestions for improving diagrams. The panel analyzes the current diagram and offers improvement suggestions, pattern recommendations, and complexity warnings.

---

## User Experience

### Panel Behavior

1. **Location**: Right side of the editor (collapsible)
2. **Default State**: Collapsed (icon button to expand)
3. **Trigger Conditions**:
   - Manual: User clicks "Analyze" button
   - Auto (optional): Debounced analysis after 3s of no typing (user-configurable)
4. **Content**: List of categorized suggestions with actions

### Panel States

```
┌─────────────────────────────────────────┐
│ AI Assistant                      [X]   │
├─────────────────────────────────────────┤
│ ⚡ Complexity: Medium (12 nodes)        │
├─────────────────────────────────────────┤
│ 💡 Improvements                         │
│ ├─ Consider using subgraphs to group    │
│ │  related authentication steps         │
│ └─ Node "Process" could be more         │
│    descriptive                          │
├─────────────────────────────────────────┤
│ ⚠️ Warnings                             │
│ └─ Line 5: Unused node "TempNode"       │
├─────────────────────────────────────────┤
│ 📐 Patterns                             │
│ └─ This looks like an auth flow -       │
│    consider adding error handling       │
├─────────────────────────────────────────┤
│ [🔄 Analyze Again] (1 credit)           │
└─────────────────────────────────────────┘
```

---

## API Specification

### Endpoint

```
POST /api/analyze
```

### Authentication

- **Required**: Clerk session token via `Authorization: Bearer <token>`

### Request Body

```typescript
interface AnalyzeRequest {
  diagramText: string;     // Current Mermaid diagram (required)
  focusAreas?: string[];   // Optional: ['performance', 'readability', 'completeness']
}
```

**Example Request**:
```json
{
  "diagramText": "flowchart TD\n    A[Start] --> B[Process]\n    B --> C[End]",
  "focusAreas": ["readability"]
}
```

### Response Body

```typescript
interface Suggestion {
  id: string;
  type: 'improvement' | 'warning' | 'pattern' | 'tip';
  severity: 'info' | 'low' | 'medium' | 'high';
  message: string;
  details?: string;
  lineNumber?: number;
  action?: {
    label: string;
    type: 'apply_fix' | 'show_example' | 'learn_more';
    payload?: string;  // For apply_fix: the replacement text
  };
}

interface AnalyzeResponse {
  ok: boolean;
  provider: 'openapi' | 'fallback';
  complexity: {
    level: 'low' | 'medium' | 'high';
    nodeCount: number;
    edgeCount: number;
    maxDepth: number;
  };
  suggestions: Suggestion[];
  diagramType: string;
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
  "complexity": {
    "level": "medium",
    "nodeCount": 12,
    "edgeCount": 15,
    "maxDepth": 4
  },
  "diagramType": "flowchart",
  "suggestions": [
    {
      "id": "sug_1",
      "type": "improvement",
      "severity": "medium",
      "message": "Consider using subgraphs to group related steps",
      "details": "Nodes A, B, C appear to form a logical group for 'User Authentication'",
      "action": {
        "label": "Show example",
        "type": "show_example",
        "payload": "subgraph Authentication\n    A --> B --> C\nend"
      }
    },
    {
      "id": "sug_2",
      "type": "warning",
      "severity": "low",
      "message": "Node 'TempNode' is defined but never connected",
      "lineNumber": 5,
      "action": {
        "label": "Remove node",
        "type": "apply_fix"
      }
    },
    {
      "id": "sug_3",
      "type": "pattern",
      "severity": "info",
      "message": "This appears to be an authentication flow",
      "details": "Consider adding error handling paths for failed login attempts"
    }
  ],
  "creditsCharged": true,
  "creditsRemaining": 7
}
```

---

## Backend Implementation

### New File: `src/server/aiAnalyze.ts`

```typescript
export interface Suggestion {
  id: string;
  type: 'improvement' | 'warning' | 'pattern' | 'tip';
  severity: 'info' | 'low' | 'medium' | 'high';
  message: string;
  details?: string;
  lineNumber?: number;
  action?: {
    label: string;
    type: 'apply_fix' | 'show_example' | 'learn_more';
    payload?: string;
  };
}

export interface AnalyzeResponse {
  ok: boolean;
  provider: 'openapi' | 'fallback';
  complexity: {
    level: 'low' | 'medium' | 'high';
    nodeCount: number;
    edgeCount: number;
    maxDepth: number;
  };
  suggestions: Suggestion[];
  diagramType: string;
  error?: {
    code: string;
    message: string;
  };
  raw?: unknown;
}

export interface AnalyzeOptions {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  timeoutMs?: number;
  focusAreas?: string[];
}

const SYSTEM_PROMPT = `You are a Mermaid diagram analysis expert. Analyze diagrams and provide actionable suggestions.

Your analysis should include:
1. Complexity assessment (node count, edge count, depth)
2. Improvement suggestions (better structure, clearer labels, subgraphs)
3. Warnings (unused nodes, potential errors, accessibility issues)
4. Pattern recognition (identify common diagram patterns, suggest best practices)

Return a JSON object with this exact structure:
{
  "complexity": {
    "level": "low" | "medium" | "high",
    "nodeCount": number,
    "edgeCount": number,
    "maxDepth": number
  },
  "diagramType": string,
  "suggestions": [
    {
      "id": "sug_N",
      "type": "improvement" | "warning" | "pattern" | "tip",
      "severity": "info" | "low" | "medium" | "high",
      "message": string,
      "details": string (optional),
      "lineNumber": number (optional)
    }
  ]
}

Focus on practical, actionable advice. Limit to 5-7 most important suggestions.`;

export async function analyzeMermaidDiagram(
  diagramText: string,
  options: AnalyzeOptions = {}
): Promise<AnalyzeResponse> {
  // Implementation follows xaiFix.ts pattern
}
```

### Worker Route Addition (`src/workers/index.ts`)

```typescript
// Route /api/analyze
if (pathname === '/api/analyze') {
  if (req.method !== 'POST') {
    return json(405, { ok: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Use POST.' } });
  }

  // Auth check...
  // Credits check (1 credit)...

  const parsed = await parseBody(req);
  const payload = asRecord(parsed);
  const diagramText = payload && typeof payload.diagramText === 'string' ? payload.diagramText : null;

  if (!diagramText || !diagramText.trim()) {
    return json(400, { ok: false, error: { code: 'BAD_REQUEST', message: 'Expected { diagramText: string }.' } });
  }

  const focusAreas = Array.isArray(payload?.focusAreas) ? payload.focusAreas : undefined;

  const result = await analyzeMermaidDiagram(diagramText, {
    apiKey: env.OPENAPI_API_KEY,
    baseUrl: env.OPENAPI_BASE_URL,
    model: env.OPENAPI_MODEL,
    focusAreas,
  });

  const shouldCharge = result.ok;
  const creditsRemaining = shouldCharge ? await spendCredits(userId, 1, runtimeEnv) : creditsBefore;

  return json(200, { ...result, creditsCharged: shouldCharge, creditsRemaining });
}
```

---

## Frontend Implementation

### New File: `src/utils/analyzeDiagramApi.ts`

```typescript
import { getApiUrl } from './environmentHelpers';

export interface Suggestion {
  id: string;
  type: 'improvement' | 'warning' | 'pattern' | 'tip';
  severity: 'info' | 'low' | 'medium' | 'high';
  message: string;
  details?: string;
  lineNumber?: number;
  action?: {
    label: string;
    type: 'apply_fix' | 'show_example' | 'learn_more';
    payload?: string;
  };
}

export interface AnalyzeDiagramResponse {
  ok: boolean;
  provider: 'openapi' | 'fallback';
  complexity: {
    level: 'low' | 'medium' | 'high';
    nodeCount: number;
    edgeCount: number;
    maxDepth: number;
  };
  suggestions: Suggestion[];
  diagramType: string;
  creditsCharged?: boolean;
  creditsRemaining?: number;
  error?: {
    code: string;
    message: string;
  };
}

export async function analyzeDiagram(
  diagramText: string,
  options: { token?: string | null; timeoutMs?: number; focusAreas?: string[] } = {}
): Promise<AnalyzeDiagramResponse> {
  // Similar implementation to fixDiagramApi.ts
}
```

### New Hook: `src/hooks/useAIAssistant.ts`

```typescript
import { useAuth } from '@clerk/clerk-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { analyzeDiagram, AnalyzeDiagramResponse, Suggestion } from '@utils/analyzeDiagramApi';

interface UseAIAssistantOptions {
  autoAnalyze?: boolean;      // Auto-analyze on diagram change
  debounceMs?: number;        // Debounce delay (default: 3000)
}

export function useAIAssistant(
  diagramText: string,
  options: UseAIAssistantOptions = {}
) {
  const { getToken } = useAuth();
  const { autoAnalyze = false, debounceMs = 3000 } = options;

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [complexity, setComplexity] = useState<AnalyzeDiagramResponse['complexity'] | null>(null);
  const [diagramType, setDiagramType] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAnalyzedText, setLastAnalyzedText] = useState<string | null>(null);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const analyze = useCallback(async () => {
    if (isAnalyzing || !diagramText.trim()) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const token = await getToken();
      const result = await analyzeDiagram(diagramText, { token });

      if (result.ok) {
        setSuggestions(result.suggestions);
        setComplexity(result.complexity);
        setDiagramType(result.diagramType);
        setLastAnalyzedText(diagramText);
      } else {
        setError(result.error?.message ?? 'Analysis failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsAnalyzing(false);
    }
  }, [diagramText, getToken, isAnalyzing]);

  const dismiss = useCallback((suggestionId: string) => {
    setSuggestions((prev) => prev.filter((s) => s.id !== suggestionId));
  }, []);

  const clear = useCallback(() => {
    setSuggestions([]);
    setComplexity(null);
    setDiagramType(null);
    setLastAnalyzedText(null);
  }, []);

  // Auto-analyze with debounce
  useEffect(() => {
    if (!autoAnalyze) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (diagramText !== lastAnalyzedText) {
        void analyze();
      }
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [autoAnalyze, analyze, debounceMs, diagramText, lastAnalyzedText]);

  return {
    suggestions,
    complexity,
    diagramType,
    isAnalyzing,
    error,
    analyze,
    dismiss,
    clear,
    hasChanges: diagramText !== lastAnalyzedText,
  };
}
```

### New Component: `src/components/AIAssistant/AIAssistantPanel.tsx`

```tsx
import React from 'react';
import { SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';
import { useAIAssistant } from '@hooks/useAIAssistant';
import { useCredits } from '@hooks/useCredits';
import { useDiagramState } from '@hooks/useDiagramState';
import {
  Lightbulb,
  AlertTriangle,
  Layout,
  Info,
  RefreshCw,
  X,
  ChevronRight,
  Zap,
} from 'lucide-react';

interface AIAssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({ isOpen, onClose }) => {
  const { currentDiagram } = useDiagramState();
  const { creditsBalance, createCheckoutSession } = useCredits();
  const {
    suggestions,
    complexity,
    diagramType,
    isAnalyzing,
    error,
    analyze,
    dismiss,
    hasChanges,
  } = useAIAssistant(currentDiagram.content);

  if (!isOpen) return null;

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'improvement': return <Lightbulb className="h-4 w-4 text-yellow-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'pattern': return <Layout className="h-4 w-4 text-blue-500" />;
      default: return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const groupedSuggestions = {
    improvement: suggestions.filter(s => s.type === 'improvement'),
    warning: suggestions.filter(s => s.type === 'warning'),
    pattern: suggestions.filter(s => s.type === 'pattern'),
    tip: suggestions.filter(s => s.type === 'tip'),
  };

  return (
    <aside className="w-80 border-l border-gray-200 bg-white flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h2 className="font-semibold text-gray-800">AI Assistant</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Complexity Badge */}
        {complexity && (
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <Zap className="h-4 w-4 text-purple-500" />
            <span className="text-sm">
              <strong>Complexity:</strong> {complexity.level} ({complexity.nodeCount} nodes)
            </span>
          </div>
        )}

        {/* Diagram Type */}
        {diagramType && (
          <div className="text-sm text-gray-500">
            Detected type: <span className="font-medium">{diagramType}</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
        )}

        {/* Suggestions */}
        {Object.entries(groupedSuggestions).map(([type, items]) =>
          items.length > 0 && (
            <div key={type} className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase">{type}s</h3>
              {items.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="p-3 bg-gray-50 rounded-lg text-sm space-y-1"
                >
                  <div className="flex items-start gap-2">
                    {getSuggestionIcon(suggestion.type)}
                    <div className="flex-1">
                      <p className="text-gray-800">{suggestion.message}</p>
                      {suggestion.details && (
                        <p className="text-gray-500 text-xs mt-1">{suggestion.details}</p>
                      )}
                      {suggestion.lineNumber && (
                        <p className="text-gray-400 text-xs">Line {suggestion.lineNumber}</p>
                      )}
                    </div>
                    <button
                      onClick={() => dismiss(suggestion.id)}
                      className="text-gray-300 hover:text-gray-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  {suggestion.action && (
                    <button className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                      {suggestion.action.label}
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )
        )}

        {/* Empty State */}
        {suggestions.length === 0 && !isAnalyzing && !error && (
          <div className="text-center text-gray-400 py-8">
            <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No suggestions yet</p>
            <p className="text-xs">Click Analyze to get AI insights</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <SignedOut>
          <SignInButton mode="modal">
            <button className="w-full py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600">
              Sign in to use AI Assistant
            </button>
          </SignInButton>
        </SignedOut>

        <SignedIn>
          {creditsBalance !== null && creditsBalance < 1 ? (
            <button
              onClick={() => void createCheckoutSession()}
              className="w-full py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
            >
              Top up credits to analyze
            </button>
          ) : (
            <button
              onClick={() => void analyze()}
              disabled={isAnalyzing}
              className="w-full py-2 bg-purple-500 text-white rounded-lg text-sm hover:bg-purple-600 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  {hasChanges ? 'Analyze Changes' : 'Analyze Again'} (1 credit)
                </>
              )}
            </button>
          )}
        </SignedIn>
      </div>
    </aside>
  );
};
```

---

## Integration Points

### MainContent.tsx or App Layout

Add toggle button and panel:

```tsx
const [isAssistantOpen, setIsAssistantOpen] = useState(false);

// In JSX:
<button onClick={() => setIsAssistantOpen(!isAssistantOpen)}>
  <Bot className="h-5 w-5" />
</button>

{isAssistantOpen && (
  <AIAssistantPanel isOpen={isAssistantOpen} onClose={() => setIsAssistantOpen(false)} />
)}
```

---

## Testing Checklist

- [ ] Panel opens/closes correctly
- [ ] Analyze button triggers API call
- [ ] Suggestions render correctly by category
- [ ] Dismiss removes individual suggestions
- [ ] Credits deducted after successful analysis
- [ ] Error states display correctly
- [ ] Loading state shows during analysis
- [ ] Empty state shows when no suggestions
- [ ] Auth states handled (signed out, signed in)
- [ ] Insufficient credits shows top-up button

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/server/aiAnalyze.ts` | Create | Analysis logic |
| `src/utils/analyzeDiagramApi.ts` | Create | Frontend API client |
| `src/hooks/useAIAssistant.ts` | Create | State management hook |
| `src/components/AIAssistant/AIAssistantPanel.tsx` | Create | Panel component |
| `src/components/AIAssistant/index.ts` | Create | Barrel export |
| `src/workers/index.ts` | Modify | Add `/api/analyze` route |
| `src/components/layout/MainContent.tsx` | Modify | Add panel toggle |

---

## Future Enhancements

1. **Auto-analyze toggle**: User preference to auto-analyze on changes
2. **Action buttons**: Apply suggested fixes directly
3. **Learn more links**: Link to Mermaid documentation
4. **Suggestion history**: Track dismissed suggestions
5. **Custom focus areas**: Let users select what to analyze

# AI Features Overview

MermaidMuse includes AI-powered features to assist with diagram creation, improvement, and analysis. All features use OpenAPI-compatible providers and integrate with the credits system.

---

## 🎯 Features Summary

| Feature           | Status         | Credits Cost | Description                                   |
| ----------------- | -------------- | ------------ | --------------------------------------------- |
| **AI Fix**        | ✅ Implemented | 1 credit     | Fixes syntax errors and suggests improvements |
| **AI Generate**   | ✅ Implemented | 2 credits    | Creates diagrams from natural language        |
| **AI Assistant**  | 📋 Specified   | 1 credit     | Real-time analysis and suggestions            |
| **AI Refinement** | 📋 Specified   | 1 credit     | Iterative diagram improvements                |

---

## 🔧 AI Fix (Implemented)

### Overview

Automatically fixes Mermaid syntax errors and suggests improvements. This is the foundational AI feature.

### Usage

1. User clicks "Fix with AI" in the editor
2. AI analyzes the diagram syntax
3. Returns corrected version if issues found
4. Only charges credits if fixes are applied

### API Endpoint

```
POST /api/fix
Authorization: Bearer <clerk-token>
Content-Type: application/json

{
  "diagramText": "flowchart TD\nA[Start] --> B"
}
```

### Response

```json
{
  "ok": true,
  "provider": "openapi",
  "fixedText": "flowchart TD\n    A[Start] --> B[End]",
  "suggestions": ["Consider adding an end node"],
  "creditsCharged": true,
  "creditsRemaining": 9
}
```

### Files

- `src/server/xaiFix.ts` - Backend logic
- `src/utils/fixDiagramApi.ts` - Frontend API client
- `src/workers/index.ts` - Route handler

---

## 🎨 AI Generate (Implemented)

### Overview

Creates complete Mermaid diagrams from natural language descriptions. Users can specify diagram types and detail levels.

### Usage

1. User clicks "Generate with AI" in editor
2. Opens modal with prompt input
3. User describes desired diagram in natural language
4. Optionally selects diagram type and style
5. AI generates complete Mermaid code

### Features

- **Natural language input**: "User signup flow with email verification"
- **Diagram type hints**: flowchart, sequence, class, state, etc.
- **Style options**: concise or detailed output
- **Template support**: Pre-built prompts for common diagrams

### API Endpoint

```
POST /api/generate
Authorization: Bearer <clerk-token>
Content-Type: application/json

{
  "prompt": "User signup flow with email verification",
  "diagramType": "flowchart",
  "style": "concise"
}
```

### Response

```json
{
  "ok": true,
  "provider": "openapi",
  "generatedText": "flowchart TD\n    A[User enters email] --> B{Valid?}\n    B -->|Yes| C[Send verification]\n    B -->|No| D[Show error]",
  "diagramType": "flowchart",
  "suggestions": ["Consider adding retry logic for failed verification"],
  "creditsCharged": true,
  "creditsRemaining": 8
}
```

### Files

- `src/server/aiGenerate.ts` - Backend logic
- `src/utils/generateDiagramApi.ts` - Frontend API client
- `src/components/GenerateModal.tsx` - UI component
- `src/workers/index.ts` - Route handler

---

## 🤖 AI Assistant (Specified)

### Overview

A collapsible side panel that provides real-time AI-powered suggestions for improving diagrams. Analyzes current diagrams and offers actionable insights.

### Features

- **Real-time analysis**: Debounced analysis as user types
- **Categorized suggestions**: Improvements, warnings, patterns, tips
- **Complexity assessment**: Node count, depth, readability score
- **Actionable advice**: Specific suggestions with examples
- **Manual trigger**: Analyze button for on-demand analysis

### UI Design

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

### API Endpoint

```
POST /api/analyze
Authorization: Bearer <clerk-token>
Content-Type: application/json

{
  "diagramText": "flowchart TD\n    A[Start] --> B[Process]",
  "focusAreas": ["readability", "performance"]
}
```

### Response

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
      "details": "Nodes A, B, C appear to form a logical group",
      "action": {
        "label": "Show example",
        "type": "show_example"
      }
    }
  ],
  "creditsCharged": true,
  "creditsRemaining": 7
}
```

### Planned Files

- `src/server/aiAnalyze.ts` - Backend logic
- `src/utils/analyzeDiagramApi.ts` - Frontend API client
- `src/hooks/useAIAssistant.ts` - State management hook
- `src/components/AIAssistant/AIAssistantPanel.tsx` - UI component

---

## 🔄 AI Refinement (Specified)

### Overview

Enables users to iteratively refine diagrams through conversational AI interactions. Users can apply successive changes while maintaining conversation history.

### Features

- **Multi-turn conversations**: Context-aware refinements
- **Quick actions**: Pre-defined refinement buttons
- **Custom instructions**: Free-text refinement requests
- **Preview before apply**: See changes before committing
- **Undo functionality**: Revert to any previous state
- **Conversation history**: Track all refinement steps

### Quick Actions

- "Add detail" - Add more specificity to nodes
- "Simplify" - Combine related nodes, reduce complexity
- "Add errors" - Include error handling paths
- "Subgraphs" - Organize nodes into logical groups
- "Labels" - Improve edge labels and descriptions

### UI Design

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
├─────────────────────────────────────────────────────────────────────┤
│ Quick Actions:                                                      │
│ [Add detail] [Simplify] [Add errors] [Split subgraphs] [Styling]   │
├─────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ Type your refinement instruction...                      [Send]│ │
│ └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### API Endpoint

```
POST /api/refine
Authorization: Bearer <clerk-token>
Content-Type: application/json

{
  "diagramText": "flowchart TD\n    A[Start] --> B[Process Payment]",
  "instruction": "Add retry logic for failed payments",
  "history": [
    {
      "id": "turn_1",
      "role": "user",
      "instruction": "Create a basic payment flow",
      "diagramBefore": "",
      "diagramAfter": "flowchart TD\n    A[Start] --> B[Process Payment]",
      "summary": "Created basic payment flow",
      "timestamp": 1702425600000
    }
  ]
}
```

### Response

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

### Planned Files

- `src/server/aiRefine.ts` - Backend logic
- `src/utils/refineDiagramApi.ts` - Frontend API client
- `src/hooks/useAIRefinement.ts` - State management hook
- `src/components/AIAssistant/RefinementChat.tsx` - UI component

---

## 💳 Credits System

### Overview

All AI features use a credits-based billing model:

- **New users**: 10 free credits
- **AI Fix**: 1 credit (only charged if fixes applied)
- **AI Generate**: 2 credits (charged on successful generation)
- **AI Assistant**: 1 credit per analysis
- **AI Refinement**: 1 credit per refinement
- **Top-up**: 100 credits via Stripe Checkout

### Credit Logic

```typescript
// Only charge on successful AI response
const shouldCharge = Boolean(result.ok && result.fixedText);
const creditsRemaining = shouldCharge
  ? await spendCredits(userId, cost, runtimeEnv)
  : creditsBefore;
```

### Integration

All AI endpoints:

1. Check user authentication via Clerk
2. Verify sufficient credits balance
3. Call AI provider (OpenAPI-compatible)
4. Only deduct credits on successful responses
5. Return updated credits balance

---

## 🔧 Technical Architecture

### OpenAPI Compatibility

All AI features use OpenAPI-compatible endpoints:

```typescript
const response = await fetch(`${baseUrl}/chat/completions`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model,
    temperature: 0,
    messages: [...],
  })
});
```

### Supported Providers

| Provider | Cost     | Speed          | Setup |
| -------- | -------- | -------------- | ----- |
| **Groq** | **Free** | ⚡⚡⚡ Fastest | Easy  |
| OpenAI   | $$$      | ⚡⚡ Fast      | Easy  |
| LocalAI  | Free     | ⚡ Medium      | Hard  |
| Ollama   | Free     | ⚡ Slow        | Easy  |

### Error Handling

All AI features include comprehensive error handling:

- **Authentication**: 401 for missing/invalid tokens
- **Credits**: 402 for insufficient balance
- **Validation**: 400 for malformed requests
- **Server**: 500 for API failures
- **Timeout**: Configurable timeouts per feature

---

## 🚀 Implementation Status

### ✅ Completed Features

**AI Fix**

- Backend implementation in `src/server/xaiFix.ts`
- Frontend API client in `src/utils/fixDiagramApi.ts`
- UI integration in editor components
- Credits system integration
- Full error handling

**AI Generate**

- Backend implementation in `src/server/aiGenerate.ts`
- Frontend API client in `src/utils/generateDiagramApi.ts`
- Modal UI in `src/components/GenerateModal.tsx`
- Integration with editor toolbar
- Credits system integration

### 📋 Specified Features

**AI Assistant**

- Complete specification in `SPEC_AI_ASSISTANT_PANEL.md`
- API endpoint design
- UI mockups and interaction patterns
- Hook architecture planned
- Integration points defined

**AI Refinement**

- Complete specification in `SPEC_AI_REFINEMENT_MODE.md`
- Conversation history management
- Quick actions system
- Preview and undo functionality
- Multi-turn context handling

---

## 📋 Development Roadmap

### Phase 3: AI Assistant Panel

- [ ] Implement `src/server/aiAnalyze.ts`
- [ ] Create `src/utils/analyzeDiagramApi.ts`
- [ ] Build `src/hooks/useAIAssistant.ts`
- [ ] Develop `AIAssistantPanel.tsx` component
- [ ] Add to main layout

### Phase 4: AI Refinement Mode

- [ ] Implement `src/server/aiRefine.ts`
- [ ] Create `src/utils/refineDiagramApi.ts`
- [ ] Build `src/hooks/useAIRefinement.ts`
- [ ] Develop `RefinementChat.tsx` component
- [ ] Integrate with AI Assistant panel

### Phase 5: Advanced Features

- [ ] Template library for common diagrams
- [ ] Voice input for natural language
- [ ] Diagram type auto-detection
- [ ] Export refinement sessions
- [ ] Collaborative refinement

---

## 🧪 Testing Strategy

### Unit Tests

- AI service functions with mock responses
- API client error handling
- Hook state management
- Component rendering and interactions

### Integration Tests

- End-to-end API workflows
- Credits system integration
- Authentication flow
- Error propagation

### User Testing

- Natural language prompt variations
- Complex diagram scenarios
- Error recovery flows
- Performance under load

---

## 📚 Documentation

### Specifications

- `SPEC_AI_DIAGRAM_GENERATION.md` - AI Generate feature spec
- `SPEC_AI_ASSISTANT_PANEL.md` - AI Assistant feature spec
- `SPEC_AI_REFINEMENT_MODE.md` - AI Refinement feature spec

### Implementation

- `IMPLEMENTATION_AI_GENERATION.md` - AI Generate implementation summary
- `OPENAPI_PROVIDERS.md` - Provider configuration guide
- `STRIPE_SETUP.md` - Credits and payment setup

### API Documentation

- All endpoints follow OpenAPI standards
- Request/response schemas documented
- Error codes and handling defined
- Authentication requirements specified

---

## 🔮 Future Enhancements

### AI Capabilities

- **Multi-modal input**: Diagram sketches + text
- **Batch operations**: Generate multiple diagrams
- **Learning from user**: Personalized suggestions
- **Domain expertise**: Specialized templates for industries

### User Experience

- **Real-time collaboration**: Multi-user editing
- **Version control**: Diagram history and branching
- **Smart templates**: Context-aware template suggestions
- **Voice commands**: Hands-free diagram creation

### Performance

- **Caching**: Intelligent response caching
- **Optimization**: Faster AI response times
- **Offline mode**: Local AI model support
- **Progressive loading**: Stream diagram generation

---

**The AI features transform MermaidMuse from a simple diagram editor into an intelligent diagramming assistant, making diagram creation accessible to everyone regardless of technical expertise.**

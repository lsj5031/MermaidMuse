# MermaidMuse Improvement Plan

This document outlines the prioritized fixes and improvements identified during code review.

---

## Phase 1: Critical Fixes (High Priority)

### 1.1 Race Condition in Credits System

**Problem:** `spendCredits()` has a read-then-write race condition. Two concurrent AI operations could both read the same balance and deduct, causing double-spending.

**Files Affected:**

- `src/server/creditsServer.ts`

**Implementation Plan:**

1. Add a `creditsVersion` field to user metadata
2. Implement optimistic locking pattern:
   - Read current balance AND version
   - Calculate new balance
   - Write new balance only if version matches (compare-and-set)
   - Retry on version mismatch (with backoff)
3. Alternative: Use a queue/lock mechanism for credit operations

**Code Changes:**

```typescript
// Before
const existing = getCreditsFromUser(user) ?? FREE_SIGNUP_CREDITS;
const next = Math.max(0, existing - amount);
await updateClerkUserPrivateMetadata(userId, { creditsBalance: next });

// After
async function spendCreditsAtomic(
  userId: string,
  amount: number,
  env?: RuntimeEnv
): Promise<number> {
  const MAX_RETRIES = 3;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const user = await getClerkUser(userId, env);
    const existing = getCreditsFromUser(user) ?? FREE_SIGNUP_CREDITS;
    const version = user.private_metadata?.creditsVersion ?? 0;
    const next = Math.max(0, existing - amount);

    const ok = await updateClerkUserPrivateMetadataWithVersion(
      userId,
      { creditsBalance: next, creditsVersion: version + 1 },
      version,
      env
    );

    if (ok) return next;
    await new Promise((r) => setTimeout(r, 50 * (attempt + 1))); // backoff
  }
  throw new Error('Unable to update credits after retries');
}
```

**Complexity:** Medium
**Risk:** Medium (core billing logic)

---

### 1.2 User-Facing Error Notifications

**Problem:** AI operation errors are only logged to console; users see nothing.

**Files Affected:**

- `src/components/layout/EditorModern.tsx`
- `src/components/AIAssistant/RefinementChat.tsx`
- `src/App.tsx` (add toast context)
- New file: `src/components/Toast/Toast.tsx`
- New file: `src/hooks/useToast.ts`

**Implementation Plan:**

1. Create a simple toast notification system
2. Add ToastProvider to App
3. Replace console.warn with toast.error() calls
4. Show success toasts for completed operations

**Component Structure:**

```
src/components/Toast/
  Toast.tsx        # Individual toast component
  ToastContainer.tsx  # Manages toast stack
  index.ts         # Exports

src/hooks/
  useToast.ts      # Hook for showing toasts
```

**Toast Types:**

- `success` - Green, auto-dismiss 3s
- `error` - Red, requires manual dismiss
- `warning` - Yellow, auto-dismiss 5s
- `info` - Blue, auto-dismiss 3s

**Complexity:** Low-Medium
**Risk:** Low

---

### 1.3 Rate Limiting on API Endpoints

**Problem:** No rate limiting on AI endpoints; users could spam requests.

**Files Affected:**

- `src/workers/index.ts`
- New file: `src/server/rateLimit.ts`

**Implementation Plan:**

1. Implement sliding window rate limiter using Cloudflare KV or in-memory Map
2. Add rate limit per user ID (authenticated) or IP (if needed)
3. Return 429 Too Many Requests when exceeded
4. Add rate limit headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

**Rate Limits (per user):**
| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/generate` | 10 | 1 minute |
| `/api/fix` | 20 | 1 minute |
| `/api/analyze` | 15 | 1 minute |
| `/api/refine` | 20 | 1 minute |

**Implementation Options:**

- Option A: Use Cloudflare KV (persistent, distributed)
- Option B: Use in-memory Map with TTL (simpler, per-worker)

**Complexity:** Medium
**Risk:** Low

---

## Phase 2: UX Improvements (Medium Priority)

### 2.1 Improve Preview Error Display

**Problem:** Preview shows generic "Syntax Error" without details.

**Files Affected:**

- `src/components/layout/PreviewModern.tsx`
- `src/hooks/useDiagramState.tsx`

**Implementation Plan:**

1. Pass validation errors from useDiagramState to PreviewModern
2. Display formatted error message with line number
3. Add "Jump to error" button that scrolls editor to error line

**Complexity:** Low
**Risk:** Low

---

### 2.2 Loading States for Credit Fetch

**Problem:** UI shows incorrect state while credits are loading.

**Files Affected:**

- `src/App.tsx` (lines 117-139)
- `src/components/layout/EditorModern.tsx`

**Implementation Plan:**

1. Show skeleton/loading indicator while `isCreditsLoading` is true
2. Disable AI buttons during loading with proper visual feedback
3. Add loading spinner to credit balance in header

**Complexity:** Low
**Risk:** Low

---

### 2.3 Optimistic UI Credit Updates

**Problem:** Credits refresh only after API call completes.

**Files Affected:**

- `src/hooks/useCredits.ts`
- `src/components/layout/EditorModern.tsx`
- `src/components/AIAssistant/RefinementChat.tsx`

**Implementation Plan:**

1. Add `optimisticBalance` state to useCredits
2. Immediately decrement balance when operation starts
3. Reconcile with actual balance from API response
4. Rollback on error

```typescript
// In useCredits.ts
const [optimisticDelta, setOptimisticDelta] = useState(0);
const displayBalance =
  creditsBalance !== null ? Math.max(0, creditsBalance + optimisticDelta) : null;

const startOptimisticSpend = (amount: number) => {
  setOptimisticDelta((prev) => prev - amount);
};

const reconcileBalance = (actual: number) => {
  setCreditsBalance(actual);
  setOptimisticDelta(0);
};
```

**Complexity:** Medium
**Risk:** Low

---

### 2.4 Persist Refinement History

**Problem:** Refinement conversation is lost on page reload.

**Files Affected:**

- `src/hooks/useAIRefinement.ts`

**Implementation Plan:**

1. Save turns to localStorage on each update
2. Load turns from localStorage on mount
3. Add session/diagram ID to scope the history
4. Add "Clear all history" confirmation dialog

**Storage Key:** `mermaidmuse.refinement.{diagramId}`

**Complexity:** Low
**Risk:** Low

---

### 2.5 Keyboard Shortcuts

**Problem:** No keyboard shortcuts for common operations.

**Files Affected:**

- `src/App.tsx`
- `src/components/layout/EditorModern.tsx`
- `src/components/layout/HeaderModern.tsx`
- New file: `src/hooks/useKeyboardShortcuts.ts`

**Shortcuts to Implement:**
| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + S` | Save to localStorage (already auto-saves, but show confirmation) |
| `Cmd/Ctrl + Shift + E` | Export as SVG |
| `Cmd/Ctrl + Shift + P` | Export as PNG |
| `Cmd/Ctrl + Enter` | Validate diagram |
| `Cmd/Ctrl + Shift + F` | Fix with AI (if errors) |
| `Cmd/Ctrl + Shift + G` | Generate with AI |
| `Escape` | Close open panels |

**Complexity:** Low-Medium
**Risk:** Low

---

## Phase 3: Security & Robustness (Medium Priority)

### 3.1 SVG Sanitization

**Problem:** `dangerouslySetInnerHTML` with `securityLevel: 'loose'` could be risky.

**Files Affected:**

- `src/components/layout/PreviewModern.tsx`

**Implementation Plan:**

1. Option A: Change Mermaid securityLevel to 'strict'
2. Option B: Add DOMPurify to sanitize SVG output
3. Test with various diagram types to ensure no breakage

**Recommendation:** Start with Option A; if it breaks features, fall back to Option B.

```typescript
// Option A - in PreviewModern.tsx
const baseConfig: MermaidConfig = {
  securityLevel: 'strict', // was 'loose'
  // ...
};

// Option B - add sanitization
import DOMPurify from 'dompurify';
const sanitizedSvg = DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true } });
setSvgContent(sanitizedSvg);
```

**Complexity:** Low
**Risk:** Medium (could break some diagram features)

---

### 3.2 Debounce Cleanup

**Problem:** Debounce doesn't clean up on unmount; potential memory leak.

**Files Affected:**

- `src/utils/validation.ts`
- `src/hooks/useDiagramState.tsx`

**Implementation Plan:**

1. Modify debounce to return a cancel function
2. Use useEffect cleanup to cancel pending debounce on unmount

```typescript
// Updated debounce
export const debounce = <T extends (...args: unknown[]) => void>(
  func: T,
  delay: number
): T & { cancel: () => void } => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debounced = ((...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T & { cancel: () => void };

  debounced.cancel = () => {
    if (timeoutId) clearTimeout(timeoutId);
  };

  return debounced;
};

// In useDiagramState.tsx
useEffect(() => {
  return () => debouncedValidate.cancel();
}, [debouncedValidate]);
```

**Complexity:** Low
**Risk:** Low

---

## Phase 4: Developer Experience (Low Priority)

### 4.1 Add Monaco Editor Integration

**Problem:** Using simple textarea instead of Monaco (which is already installed).

**Files Affected:**

- `src/components/layout/EditorModern.tsx`
- New file: `src/utils/mermaidLanguage.ts` (Mermaid syntax definition)

**Implementation Plan:**

1. Replace textarea with Monaco Editor component
2. Add Mermaid syntax highlighting
3. Add error markers from validation
4. Add autocomplete for Mermaid keywords

**Considerations:**

- Monaco adds ~2MB to bundle; consider lazy loading
- Need to handle resize events properly
- Mobile experience may suffer (Monaco is desktop-focused)

**Complexity:** High
**Risk:** Medium

---

### 4.2 Undo/Redo for Diagram Content

**Problem:** No general undo/redo for diagram edits.

**Files Affected:**

- `src/hooks/useDiagramState.tsx`
- `src/components/layout/EditorModern.tsx`
- `src/components/layout/HeaderModern.tsx`

**Implementation Plan:**

1. Add history stack to DiagramProvider
2. Push to history on content changes (debounced)
3. Implement undo() and redo() functions
4. Add keyboard shortcuts (Cmd+Z, Cmd+Shift+Z)
5. Add undo/redo buttons to header

**State Shape:**

```typescript
interface DiagramHistory {
  past: string[]; // Previous states
  present: string; // Current state
  future: string[]; // States after undo
}
```

**Complexity:** Medium
**Risk:** Low

---

### 4.3 Add Integration Tests for Worker

**Problem:** No tests for API endpoints.

**Files Affected:**

- New file: `src/test/workers.test.ts`

**Implementation Plan:**

1. Set up miniflare or similar for worker testing
2. Add tests for each endpoint
3. Mock Clerk and Stripe APIs
4. Test error cases and edge cases

**Test Cases:**

- Authentication flow (valid token, invalid token, missing token)
- Credit checking and spending
- Stripe checkout flow
- Rate limiting (if implemented)

**Complexity:** High
**Risk:** Low

---

## Implementation Order

Recommended order based on impact and dependencies:

### Sprint 1 (Quick Wins)

1. [x] 1.2 User-Facing Error Notifications
2. [x] 2.1 Improve Preview Error Display
3. [x] 2.2 Loading States for Credit Fetch
4. [x] 3.2 Debounce Cleanup

### Sprint 2 (UX Polish)

5. [x] 2.3 Optimistic UI Credit Updates
6. [x] 2.4 Persist Refinement History
7. [x] 2.5 Keyboard Shortcuts

### Sprint 3 (Security & Robustness)

8. [x] 1.1 Race Condition in Credits System
9. [x] 1.3 Rate Limiting on API Endpoints
10. [x] 3.1 SVG Sanitization

### Sprint 4 (DX & Advanced)

11. [x] 4.2 Undo/Redo for Diagram Content
12. [ ] ~~4.1 Add Monaco Editor Integration~~ (not planned)
13. [ ] ~~4.3 Add Integration Tests for Worker~~ (not planned)

---

## Estimated Effort

| Phase     | Items        | Estimated Hours |
| --------- | ------------ | --------------- |
| Phase 1   | 3 items      | 8-12 hours      |
| Phase 2   | 5 items      | 6-10 hours      |
| Phase 3   | 2 items      | 3-5 hours       |
| Phase 4   | 3 items      | 12-20 hours     |
| **Total** | **13 items** | **29-47 hours** |

---

## Notes

- All changes should maintain backward compatibility
- Each change should include appropriate tests
- Consider feature flags for risky changes
- Document any API changes in the codebase

---

_Last updated: December 23, 2025_
_Review conducted by: Claude Code Review_

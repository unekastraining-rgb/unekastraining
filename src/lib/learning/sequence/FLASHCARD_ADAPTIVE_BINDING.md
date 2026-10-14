# Phase 2G-54 — Flashcard Adaptive Completion & Evidence Binding

**Status:** Implemented (small additive bridge).  
**Date:** 2026-09-20  
**Depends on:** 2G-53 Flashcard Assessment Adapter · Quiz/SIX Adaptive bind patterns  

---

## 1. Canonical Flashcard evidence used

Existing `recordFlashcardReviewEvidence` (`flashcard-bridge.ts`):

| Field | Source |
|-------|--------|
| learner | `envelope.learnerId` / Attempt `userId` |
| Flashcard | `sourceRef.flashcardId` (`kind: "flashcard_review"`) |
| concept | Topic → Concept → Attempt `conceptId` |
| LearningAttempt | Returned `attemptId` from `recordEvidence` (2G-54 additive return) |
| outcome | AGAIN→FAIL, GOOD→PARTIAL, EASY→SUCCESS |
| score | 0.35 / 0.75 / 0.9 |
| facet | **RETAIN** |
| LO | `ensureFlashcardLearningObject` → `payloadRef { kind:"flashcard", flashcardId }` |

**No second evidence path.**

---

## 2. Flashcard activity identity

- Persisted: `Flashcard.id`
- Opaque Assessment ref: `{ kind: "flashcard", id }`
- Adaptive intervention: **`flashcard`**
- Evidence correlation key: `sourceRef.flashcardId` + `expectedFlashcardId` (rated card)

---

## 3. Completion boundary

Completion requires a **genuine self-rating** that successfully writes a LearningAttempt.

Not completion: open route, render card, navigate away, presence of adaptive query alone, client `complete` flag (voided).

---

## 4. Rating semantics (unchanged)

| Rating | Outcome | Score | Adaptive completion? |
|--------|---------|-------|----------------------|
| AGAIN | FAIL | 0.35 | Yes (score-agnostic, like Quiz) |
| GOOD | PARTIAL | 0.75 | Yes |
| EASY | SUCCESS | 0.9 | Yes |

SM-2 meaning unchanged. Bridge does not reinterpret outcomes.

---

## 5. Evidence correlation strategy

**Safe distinction from unrelated historical evidence: YES.**

1. Bind uses the **Attempt id returned by the evidence writer for this rating** (not a client-picked Attempt).  
2. `assertFlashcardCompatibleAttempt` requires:
   - `sourceRef.kind === "flashcard_review"`
   - `sourceRef.flashcardId === expectedFlashcardId` (the card just rated)
   - `skillFacet === "RETAIN"`
3. Coordinator enforces run ownership, active status, step index, concept match, LO match when step has `learningObjectId`, duplicate Attempt idempotency.

Same learner + same concept + **different** flashcardId → **rejected**.

---

## 6. Binding helper

`bindFlashcardReviewToAdaptiveSequence` in `sequence/flashcard-review-bind.ts`  
`assertFlashcardCompatibleAttempt` / `recordFlashcardAdaptiveSequenceCompletionAndPlanNext` in `sequence/flashcard-adapter.ts`

---

## 7. Coordinator integration

```text
canonical Attempt
  → assertFlashcardCompatibleAttempt
  → recordAdaptiveSequenceCompletionAndPlanNext (existing)
  → re-orchestrate / next / terminal
```

No direct mutation of run cursor/history outside the coordinator.

---

## 8. Launch-context propagation

Established params only: `adaptiveRunId`, `adaptiveStep`.

- Assessment launch href via `flashcardAdaptiveHref` (includes adaptive when present)
- Adaptive run page resolves flashcard steps → same href shape
- `flashcards-view` forwards query params on PATCH when present

Preserves existing `courseId` / `topic` query params.

---

## 9. Idempotency / lifecycle protections

Reuses coordinator: duplicate Attempt → idempotent; stale/future step; completed/abandoned; max-step; concept/ownership mismatches; wrong intervention (`NOT_FLASHCARD_STEP`).

---

## 10. Normal Flashcard behavior

No adaptive context → bind returns `skipped: no_adaptive_context` → **no coordinator call**.  
SM-2 + evidence + LUCKY mirror unchanged for normal reviews.

---

## 11. LUCKY boundary

No new Flashcard→LUCKY handoff. Existing `syncFlashcardRetentionItem` after review remains. Coordinator-owned LUCKY handoff (if any on sequence complete) unchanged.

---

## 12. Assessment boundary

Assessment still owns plan → adapter → launch only.  
Completion bind lives on Activity/Adaptive (PATCH after evidence). Mode policy untouched.

---

## 13. Files changed

| File | Role |
|------|------|
| `sequence/flashcard-adapter.ts` | **New** — intervention, resolve, assert, coordinator wrap |
| `sequence/flashcard-review-bind.ts` | **New** — soft-fail bind helper |
| `sequence/flashcard-adapter.test.ts` | **New** — focused + vertical contract tests |
| `FLASHCARD_ADAPTIVE_BINDING.md` | **New** — this report |
| `assessment/flashcard-bridge.ts` | Return `attemptId` |
| `app/api/flashcards/route.ts` | Bind after evidence when adaptive context present |
| `app/flashcards/flashcards-view.tsx` | Forward adaptive query on PATCH |
| `assessment/activity-launch.ts` | Adaptive query on Flashcard href |
| `sequence/adaptive-run-page.ts` | Resolve flashcard intervention → href |
| `sequence/index.ts` | Exports |
| Prior design tests | Updated for Flashcard Adaptive presence |

---

## 14. Tests

- Correlation: matching / wrong flashcard / wrong kind / wrong facet  
- Eligibility: rated vs not recorded  
- Bind: skip without context; bind once; ownership; wrong card; non-flashcard step; stale step  
- Route/UI: evidence-then-bind order; no client complete; adaptive forward  
- Assessment does not bind  

---

## 15. Vertical integration result

Proven at library + route source contract:

```text
Adaptive flashcard step → /flashcards?...&adaptiveRunId&adaptiveStep
  → PATCH rating → recordFlashcardReviewEvidence (RETAIN Attempt)
  → bindFlashcardReviewToAdaptiveSequence → coordinator plan-next
```

---

## 16. Verification

| Suite | Result | Notes |
|-------|--------|-------|
| `flashcard-adapter.test.ts` | **passed** | Correlation, bind, lifecycle, vertical contract |
| `src/lib/learning` | **70 files / 744 passed** | Assessment, Quiz, SIX, Flashcard, Adaptive, Evidence |
| Lint | **Pre-existing** | No new 2G-54 issues in changed files |
| `tsc --noEmit` | **Pre-existing** | `notebook-desk.ts`, `generate-offline-fallback.integration.test.ts`, `resolve-loop-focus-topic.ts` |

**2G-54 introduced failures:** none.

---

## 17. Risks / limitations

1. **Queue vs prepared card:** User may rate any due card under adaptive context; bind correlates to the **rated** card’s Attempt (`expectedFlashcardId` = PATCH `cardId`), not a frozen Assessment prepare id stored on the step. Historical same-concept Attempts still cannot bind.  
2. Adaptive steps must use intervention **`flashcard`** (Orchestrator still does not emit Flashcard — steps come from Adaptive planning / explicit setup).  
3. Evidence writer failure → no bind (soft-fail; review still saved).  

**Explicit:** Bridge **can** safely distinguish the current adaptive Flashcard interaction from unrelated historical evidence via just-created Attempt id + `sourceRef.flashcardId` match.

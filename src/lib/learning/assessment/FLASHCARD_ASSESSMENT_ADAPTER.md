# Phase 2G-53 — Flashcard Assessment Adapter Foundation

**Status:** Implemented (small additive bridge).  
**Date:** 2026-09-20  
**Depends on:** 2G-52 Flashcard adapter audit · 2G-38–2G-50 Assessment infrastructure  

---

## 1. Adapter contract used

Reuses existing `AssessmentAdapter` from `adapter-registry.ts`:

```text
key / canHandle / resolve / prepare?
```

Universal pipeline unchanged:

```text
AssessmentPlan → resolveAssessmentActivity → prepareAssessmentActivity
  → launchAssessmentActivity → launch instruction only
```

**ASSESS ≠ Flashcard.** Adapter claims only explicit `adapterKey === "flashcard"`.

---

## 2. Existing Flashcard lookup reused/added

**Added (read-only):** `findOwnedDueFlashcardForConcept` in `flashcard-assessment-adapter.ts`

```text
Concept → Topic (course.userId = learner) → earliest-due owned Flashcard
  where nextReviewAt is null OR ≤ now
```

Does **not** create Flashcards, mutate SM-2, or touch LUCKY.

Also: `findOwnedFlashcardLaunchContext` for launch href course/topic when verify inject is absent.

---

## 3. Ownership validation

- Lookup always filters `userId` (session learner).
- Client `flashcardId` is voided by `/api/study/assessment` (same pattern as `quizId`).
- Optional `verifyOwnedFlashcard` on launch re-checks Concept→owned due card vs opaque `activityRef.id`.

---

## 4. Concept validation

- Topic must be linked to `conceptId` and owned via course.
- Missing topic → `NO_TOPIC` → prepare `unavailable`.
- Wrong concept cannot resolve another user's / another topic's cards.

---

## 5. Activity type used

Existing enum: **`FLASHCARD`** (`FLASHCARD_ASSESSMENT_ACTIVITY_TYPE`).  
No new Learning Object enum values.

Opaque ref:

```ts
{ kind: "flashcard", id: <owned Flashcard.id> }
```

---

## 6. Preparation behavior

`createFlashcardAssessmentAdapter().prepare`:

- Requires learnerId + conceptId
- Calls owned due lookup
- Returns opaque `activityRef` or `{ unavailable: true }`
- Preserves descriptor fields via universal `prepareAssessmentActivity` (mode, adaptive, etc.)

**Does not:** create Attempt, evidence, mastery, SM-2 updates, LUCKY items, Adaptive mutations.

---

## 7. Launch behavior

`launchAssessmentActivity` Flashcard branch:

- Validates `activityRef.kind === "flashcard"`
- Builds existing experience URL via `flashcardAssessmentHref`:

```text
/flashcards?courseId=…&topic=…   (topic optional)
```

- No new Flashcard UI / route
- Adaptive context copied onto launch object **passively** (not added as inventing query params — flashcards-view does not consume adaptive query yet)

**Launch ≠ completion.**

---

## 8. Registry behavior

| Factory | Contents |
|---------|----------|
| `createAssessmentAdapterRegistry()` | **Empty** (unchanged) |
| `createAssessmentAdapterRegistryWithQuiz()` | Quiz only (unchanged) |
| `createAssessmentAdapterRegistryWithFlashcard()` | Flashcard only (new) |

Standalone consumer opts in by `adapterKey`:

- `"quiz"` → Quiz registry
- `"flashcard"` → Flashcard registry
- other / absent → skipped or unresolved

---

## 9. Evidence boundary

**Unchanged.** Authoritative path remains:

```text
PATCH /api/flashcards rating
  → applySm2Review
  → recordFlashcardReviewEvidence → LearningAttempt (RETAIN)
  → applyEvidenceToMastery
  → syncFlashcardRetentionItem (LUCKY mirror)
```

Adapter / launch / consumer do **not** call evidence or mastery APIs.

---

## 10. Adaptive context behavior

- Descriptor/launch may carry passive `{ runId, stepIndex }`
- **No** AdaptiveSequenceRun mutation
- **No** completion bind
- **No** coordinator calls
- Adaptive query params **not** invented on Flashcard href in this phase

**Explicit:** Adaptive completion binding was **NOT** implemented (deferred).

---

## 11. Files changed

| File | Change |
|------|--------|
| `flashcard-assessment-adapter.ts` | **New** — adapter + owned due lookup + href helper |
| `flashcard-assessment-adapter.test.ts` | **New** — focused tests |
| `FLASHCARD_ASSESSMENT_ADAPTER.md` | **New** — this report |
| `activity-launch.ts` | Flashcard launch branch |
| `standalone-assessment-consumer.ts` | Flashcard opt-in pipeline |
| `app/api/study/assessment/route.ts` | Void client `flashcardId`; docs |
| `src/lib/learning/index.ts` | Exports |
| `activity-adapter-convergence.design.test.ts` | Allow Flashcard AssessmentAdapter |
| `flashcard-activity-adapter.design.test.ts` | Assessment opt-in vs Adaptive still absent |

---

## 12. Tests

Covered:

- canHandle: PRACTICE_CHECK yes; DIAGNOSTIC/VERIFICATION/wrong key/non-ready no
- resolve → `FLASHCARD`
- prepare opaque ref; unavailable on NO_FLASHCARD / NO_TOPIC
- ownership helper rejects empty ids
- launch existing `/flashcards` route; passive adaptive on launch object
- registry empty / WithFlashcard / WithQuiz isolation
- consumer end-to-end with inject
- source guards: no evidence/SM-2/Adaptive bind in adapter layer

---

## 13. Verification results

| Suite | Result | Notes |
|-------|--------|-------|
| `flashcard-assessment-adapter.test.ts` | **passed** | canHandle / ownership / prepare / launch / registry / consumer |
| `src/lib/learning` | **69 files / 725 passed** | Assessment, Quiz, Adaptive, Flashcard, Evidence, Mastery, etc. |
| Lint | **Pre-existing** repo issues | None introduced in 2G-53 files |
| `tsc --noEmit` | **Pre-existing** | `notebook-desk.ts`, `generate-offline-fallback.integration.test.ts`, `resolve-loop-focus-topic.ts` |

**2G-53 introduced failures:** none.

---

## 14. Risks / notes

1. Due-only resolve: if all cards for the topic are not due, prepare returns unavailable (by design).  
2. Prepare freezes a card id; due status may change before review — launch re-check optional via `verifyOwnedFlashcard`.  
3. PRACTICE_CHECK gating: request with `adapterKey=flashcard` but DIAGNOSTIC mode → `adapter_cannot_handle` (use RETENTION/RECALL diagnosis or explicit PRACTICE_CHECK plan).  
4. Flashcard ≠ Quiz ≠ LUCKY; SM-2 remains authoritative on review PATCH.

---

## 15. Adaptive completion binding

**NOT implemented in 2G-53.**

Next phase may add sequence adapter + bind after existing `recordFlashcardReviewEvidence`, without owning SM-2.

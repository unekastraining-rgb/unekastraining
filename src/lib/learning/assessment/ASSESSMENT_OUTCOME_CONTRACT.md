# Phase 2G-49 — Assessment Completion / Outcome Contract

**Status:** Inspection PASS — **no production outcome persistence or API.**  
**Date:** 2026-09-20  
**Depends on:** 2G-48 evidence return (existing Quiz spine)

## Verdict

Assessment does **not** need a second result system. Quiz completion and evidence are already authoritative:

```text
Quiz submit (owned)
  → QuizAttempt (completedAt, score, maxScore)
  → recordQuizAttemptEvidence
  → LearningAttempt[] (sourceRef.kind = "quiz_attempt", attemptId, quizId)
  → [optional] bindQuizSubmitToAdaptiveSequence
```

Assessment **outcome** is an **ephemeral interpretation** of that existing evidence — not a new table.

No `AssessmentAttempt` / `AssessmentResult` / Assessment session table was added.

---

## Core distinctions (frozen)

| Concept | Owner | Not |
|---------|-------|-----|
| Launch | Assessment (`AssessmentActivityLaunch`) | Completion |
| Interaction | Quiz UI | Evidence by itself |
| Evidence | `LearningAttempt` via quiz-bridge | AssessmentPlan |
| Completion (Quiz) | Whole-quiz **submit** → `QuizAttempt` | Page open / launch href |
| Assessment outcome | Derived query/interpretation (future consumer) | Persisted Assessment row |
| Mastery | `applyEvidenceToMastery` (+ legacy topic mastery) | Completion boolean |
| Adaptive progression | Coordinator via `quiz-submit-bind` | Assessment outcome |

```text
Launch ≠ Completion ≠ Evidence ≠ Mastery ≠ Progression
ASSESS ≠ QUIZ
```

---

## Quiz completion semantics (inspected)

### 1. What proves submission?
`POST /api/quizzes/[id]/submit` succeeds after grading and `db.quizAttempt.create` with responses.

### 2. Persisted submission identity
**`QuizAttempt.id`** (`completedAt` set; `score` / `maxScore` recorded). Multiple attempts = multiple rows.

### 3. LearningAttempt records
One per graded question via `recordQuizAttemptEvidence`, with:

```json
sourceRef: { "kind": "quiz_attempt", "quizId", "attemptId", "questionId" }
```

Facet: `RECOGNIZE`. Outcome/score from correctness. **0% score still creates Attempts** and still counts as submitted.

### 4. Ownership
Submit loads `quiz` with `{ id, userId: sessionUser.id }`. Foreign Quiz → 404.  
`QuizAttempt.userId` = session user.

### 5. Adaptive completion Attempt selection
Same submit’s `evidence.attempts` → `isQuizAdaptiveCompletionEligible` (score-agnostic) → `selectAuthoritativeQuizCompletionAttemptId` (last LearningAttempt matching run concept) → coordinator. **Not** Assessment-owned.

### 6. Score / abandon matrix

| Situation | QuizAttempt? | LearningAttempts? | Completion? |
|-----------|--------------|-------------------|---------------|
| Opened, not submitted | No (for this visit) | No | Not completed |
| Submitted 0% | Yes | Yes | **Completed** |
| Submitted partial | Yes | Yes | **Completed** |
| Submitted 100% | Yes | Yes | **Completed** |
| Abandoned mid-quiz | No new completed attempt | No | Not completed |

No Assessment score threshold. Score informs mastery evidence, not Assessment completion.

### 7–8. Multiple attempts / current vs older
Each submit creates a **new** `QuizAttempt.id`. Evidence rows point at that id.  
Adaptive bind uses Attempts from **that submit only**.

**Correlation for Assessment outcome (documented gap, not a new table):**

| Mechanism | Reliable? | Status |
|-----------|-----------|--------|
| `quizAttemptId` from submit JSON (`data.attemptId`) | Yes — exact | Prefer for any future outcome query |
| `launchedAfter` / client-held launch timestamp | Approximate | Acceptable ephemeral correlation |
| “Any prior QuizAttempt for quizId” | **No** — conflates older attempts | Must not be used alone |
| Assessment session table | Unnecessary now | **Do not add** |

Until a product caller needs server-side polling, Assessment does not expose an outcome endpoint. Downstream Quiz submit response + Adaptive bind already surface completion where needed.

---

## Conceptual derived outcome (ephemeral — not implemented as persistence)

When a future read helper is justified, it should resemble:

```ts
// Conceptual only — not a Prisma model
type AssessmentActivityOutcomeStatus =
  | "NOT_STARTED"   // no qualifying submit correlated to this launch
  | "COMPLETED"     // owned QuizAttempt (+ evidence) correlated
  | "UNAVAILABLE";  // bad ref / unauthorized

// Prefer correlation:
//   quizAttemptId from submit  OR  completedAfter: Date
// Never: launch alone, open alone, AssessmentPlan.status, score threshold
```

**IN_PROGRESS** is optional: the repo has no durable “Quiz in progress” row today (answers live client-side until submit). Prefer NOT_STARTED until a completed `QuizAttempt` exists.

---

## Adaptive

Assessment launch preserves `adaptiveRunId` / `adaptiveStep` on the href.  
Progression remains **only** `bindQuizSubmitToAdaptiveSequence` after evidence.  
Assessment outcome derivation must **not** call the coordinator or LUCKY.

---

## Standalone

No Assessment session record. Plan → launch → Quiz → evidence is sufficient.  
Outcome, if ever queried, stays derived from owned QuizAttempt/LearningAttempt.

---

## Security

Any future outcome lookup must:

- Use session `learnerId` (never client learnerId)
- Resolve Quiz via ownership (`userId` + quiz id)
- Prefer server-known `quizAttemptId` with ownership check on that attempt
- Ignore client-supplied foreign attempt ids that fail ownership

---

## API

`POST /api/study/assessment` remains plan/launch oriented (2G-47).  
**No outcome field forced into that endpoint** in this phase.

---

## Production files changed

**None.**

## Artifacts

- This document
- `assessment-outcome-contract.design.test.ts` (regression/assumption)

## Why no production helper yet

1. Existing Quiz submit + Adaptive bind already define completion where the product needs it.
2. Reliable Assessment-scoped outcome requires launch↔attempt correlation; forcing “any attempt” would be incorrect.
3. Adding a generic Assessment session table is explicitly out of scope without a proven product need.
4. Prefer preserve → document → add query later only when a real consumer needs server-side outcome polling.

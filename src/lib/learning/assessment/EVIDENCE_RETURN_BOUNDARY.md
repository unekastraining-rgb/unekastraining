# Phase 2G-48 — Assessment Activity → Evidence Return Boundary

**Status:** Inspection PASS — **no production bridge added.**  
**Date:** 2026-09-20

## Verdict

The existing Quiz execution → evidence → mastery → Adaptive bind path already satisfies the universal evidence return contract for Assessment-launched Quiz activities.

Assessment (2G-40…2G-47) stops at the launch instruction. Quiz ownership of execution and evidence is unchanged.

```text
Assessment → launch.href (/quizzes/{id}[?adaptive…])
     ↓
Existing QuizTaker (reads adaptive query params)
     ↓
POST /api/quizzes/[id]/submit  (owned Quiz only)
     ↓
QuizAttempt + grade
     ↓
recordQuizAttemptEvidence  → EvidenceEnvelope → LearningAttempt → applyEvidenceToMastery
     ↓
bindQuizSubmitToAdaptiveSequence  (only if adaptiveRunId present; uses existing Attempt)
     ↓
Adaptive coordinator completion / plan-next
```

**No second evidence spine, AssessmentAttempt, or Assessment-owned grading was introduced.**

---

## Architectural Q&A (inspection)

### Does Quiz already return sufficient evidence?

**Yes.** `recordQuizAttemptEvidence` (`quiz-bridge.ts`) builds per-question envelopes with:

| Field | Source |
|-------|--------|
| learner | `userId` (session) |
| concept | `ensureConceptForTopic` / `ensureConceptForQuizTitle` |
| skill facet | `RECOGNIZE` |
| outcome / score | from graded correctness |
| sourceRef | `{ kind: "quiz_attempt", quizId, attemptId, questionId }` |
| evidencePayload | question type, correctness |
| timestamp | via `recordEvidence` / attempt `endedAt` |

Persisted record: **`LearningAttempt`** only (via `recordEvidence`).

### Assessment-launched Quiz context

2G-46/47 launch uses `quizAdaptiveHref`, which emits the same query params Adaptive Quiz already uses:

- `adaptiveRunId`
- `adaptiveStep`

`app/quizzes/[id]/quiz-taker.tsx` reads those params and forwards them on submit.  
`submit/route.ts` passes them to `bindQuizSubmitToAdaptiveSequence`.

Therefore Assessment-origin launches **reuse** the Adaptive Quiz evidence/completion path without Assessment knowing about LearningAttempts.

### Ownership / foreign Quiz

Submit loads `db.quiz.findFirst({ where: { id, userId: session } })`. Foreign quizzes → 404.  
Assessment API voids client `quizId`; owned identity comes from 2G-45 `findOwnedQuizForConcept`.

### Launch ≠ Completion

Opening `/quizzes/{id}` does not call the coordinator.  
Progression occurs only after successful whole-quiz submit + evidence + bind eligibility.

---

## Why no new production code

| Candidate addition | Decision |
|--------------------|----------|
| AssessmentEvidence / AssessmentAttempt | **Rejected** — LearningAttempt is canonical |
| Assessment completion callback persistence | **Rejected** — ephemeral launch is enough |
| Duplicate quiz evidence bridge | **Rejected** — `quiz-bridge.ts` already used by submit |
| Assessment-side Attempt creation | **Rejected** — would violate ASSESS ≠ Quiz execution |
| New Adaptive bind for Assessment | **Rejected** — `quiz-submit-bind.ts` already handles adaptive context |

Only regression/assumption tests document this invariant.

---

## Hard distinctions (preserved)

```text
Launch ≠ Completion
Completion ≠ Evidence
Evidence ≠ Mastery
Mastery ≠ Progression

ASSESS ≠ QUIZ
Assessment plans/launches; Quiz executes and produces evidence.
```

---

## Files inspected (primary)

- `app/api/quizzes/[id]/submit/route.ts`
- `app/quizzes/[id]/quiz-taker.tsx`
- `src/lib/learning/assessment/quiz-bridge.ts`
- `src/lib/learning/sequence/quiz-submit-bind.ts`
- `src/lib/learning/sequence/quiz-adapter.ts` (`quizAdaptiveHref`, `findOwnedQuizForConcept`)
- `src/lib/learning/assessment/activity-launch.ts`
- `src/lib/learning/assessment/standalone-assessment-consumer.ts`
- Evidence / mastery apply path via quiz-bridge imports

## Production files changed

**None.**

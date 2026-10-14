# Phase 2G-50 — Assessment → Quiz → Evidence Vertical Integration

**Status:** Integration verification PASS  
**Date:** 2026-09-20

## Proven vertical (library + route contracts)

```text
Explicit ASSESS + adapterKey:"quiz"
  → runStandaloneAssessmentConsumer
  → owned Quiz (findOwnedQuizForConcept / DI)
  → AssessmentActivityLaunch.href (/quizzes/{id}[?adaptive…])
  → [QuizTaker opens href — existing UI]
  → POST submit (existing)
  → QuizAttempt id = correlation
  → recordQuizAttemptEvidence → LearningAttempt(s)
  → ConceptMastery
  → [if adaptive] bindQuizSubmitToAdaptiveSequence
```

Assessment **stops at launch**. Quiz owns execution/evidence. Adaptive coordinator owns progression.

## Test depth

| Layer | How verified |
|-------|----------------|
| Assessment plan → launch | Real `runStandaloneAssessmentConsumer` |
| Owned Quiz resolution | Injected `verifyOwnedQuiz` (same contract as canonical lookup) |
| Launch mutation audit | `LearningAttempt` / mastery mocks **not** called during Assessment |
| Evidence / mastery | Real `recordQuizAttemptEvidence` |
| Correlation | `sourceRef.attemptId` = **current** `quizAttemptId` only |
| 0% score | `isCorrect: false` still creates Attempt; eligibility still true |
| Adaptive | Launch href query + real `bindQuizSubmitToAdaptiveSequence` |
| QuizTaker forward | Source contract on `quiz-taker.tsx` |
| Foreign Quiz | Owned lookup returns unavailable; no evidence/mastery/adaptive |
| ASSESS ≠ Quiz default | No `adapterKey` → `activityOutcome: skipped` |

## Intentionally not covered by this harness

Full Next.js HTTP round-trip (`QuizTaker` fetch → submit route handler) is **not** spun up here (no new E2E framework). Wiring is verified via:

- existing submit route source (`recordQuizAttemptEvidence` + `bindQuizSubmitToAdaptiveSequence`)
- QuizTaker source (forwards `adaptiveRunId` / `adaptiveStep`)
- prior phase suites for submit/bind in isolation

## Production files changed

**None** — tests + this document only.

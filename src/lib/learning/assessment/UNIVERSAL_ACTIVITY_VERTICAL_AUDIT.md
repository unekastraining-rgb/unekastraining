# Phase 2G-55 — Universal Activity Vertical Integration Audit

**Status:** Inspection / verification only. **No production code changes.**  
**Date:** 2026-09-20  
**Depends on:** 2G-50 Quiz vertical · 2G-51–2G-54 Flashcard Assessment + Adaptive · SIX Adaptive · Tutor/CORE bridges  

---

## 1. Verdict

**NO CONTRADICTION that blocks the Universal Learning Engine.**

Quiz, SIX, and Flashcard share the same seams (Assessment launch where applicable, Adaptive coordinator, LearningAttempt → ConceptMastery) while keeping intentionally different execution semantics. Tutor and CORE remain correctly outside conventional Activity Adapters. Dual legacy TopicMastery updates (Quiz/Flashcard routes) are **intentional legacy**, not a second ULE mastery spine.

| Result | Detail |
|--------|--------|
| Architecture converges | Yes — shared contracts, not identical implementations |
| Production changes required | **None preferred** |
| Soft-fail Flashcard bind | Safe for evidence spine; Adaptive step may wait for another rating (documented) |
| Recommended next | See §19 — **not** another activity adapter by default |

---

## 2. Complete lifecycle matrix

Legend: **READY** · **PARTIAL** · **NOT_APPLICABLE** · **NOT_READY** · **OPEN**

| System | Identity | Resolve | Prepare | Launch | Interaction | Evidence | LearningAttempt | Mastery | Completion | Adaptive | LUCKY |
|--------|----------|---------|---------|--------|-------------|---------|-----------------|---------|------------|----------|-------|
| **Quiz** | READY — Quiz.id + LO QUIZ_ITEM | READY — `findOwnedQuizForConcept` | READY — AssessmentAdapter.prepare | READY — `/quizzes/{id}` | READY — QuizTaker | READY — quiz-bridge | READY | READY — RECOGNIZE (+ legacy TopicMastery) | READY — whole-quiz submit | READY — quiz-submit-bind | PARTIAL — sequence COMPLETE → weak-mastery handoff only |
| **SIX** | READY — component + guide | READY — `resolveSixSequenceStep` | NOT_APPLICABLE as Assessment prepare | READY — sixGuideHref | READY — guided session | READY — evaluate-bridge | READY | READY — facet by component | READY — allDone gate | READY — six-evaluate-bind | PARTIAL — same coordinator COMPLETE handoff |
| **Flashcard** | READY — Flashcard.id + LO FLASHCARD | READY — due owned Concept→Topic | READY — Assessment PRACTICE_CHECK | READY — `/flashcards?…` | READY — AGAIN/GOOD/EASY | READY — flashcard-bridge | READY | READY — RETAIN (+ legacy TopicMastery) | READY — rating → Attempt | READY — flashcard-review-bind | PARTIAL — SM-2 mirror + sequence COMPLETE handoff |
| **Tutor** | PARTIAL — TUTOR_TURN LO on evidence | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE as Assessment | READY — chat modes | PARTIAL — intent-gated | PARTIAL | PARTIAL — EXPLAIN/APPLY/SOLVE | NOT_APPLICABLE | NOT_READY | NOT_APPLICABLE |
| **CORE** | Knowledge/Note identity | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | Assist host | OPEN as activity | OPEN | OPEN as activity | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE |
| **Study Evaluate** (blurting / teach-me / six) | PARTIAL — study_evaluate LO | PARTIAL — topic-gated | NOT_APPLICABLE Assessment | PARTIAL — evaluate UX | READY | READY — evaluate-bridge | READY when topicId | READY — mapped facets | PARTIAL — evaluate finish | PARTIAL — SIX bind only for mode six | NOT_APPLICABLE direct |

Repository anchors: `quiz-assessment-adapter.ts`, `flashcard-assessment-adapter.ts`, `sequence/{quiz,six,flashcard}-adapter.ts`, `*-bridge.ts`, `tutor/evidence.ts`, `knowledge/core-bridge.ts`, `evaluate-bridge.ts`.

---

## 3. Evidence spine audit

### Canonical path (verified)

```text
interaction → producer bridge → buildEvidenceEnvelope → recordEvidence
  → LearningAttempt → applyEvidenceToMastery → ConceptMastery
```

| Producer | File | Status |
|----------|------|--------|
| Quiz | `assessment/quiz-bridge.ts` | CLOSED |
| Flashcard | `assessment/flashcard-bridge.ts` | CLOSED |
| Study Evaluate / SIX evaluate | `assessment/evaluate-bridge.ts` | CLOSED when topicId |
| Tutor | `tutor/evidence.ts` | PARTIAL (intent + concept gated) |
| Retention review | `retention/review.ts` | CLOSED for LUCKY review items |

### Exceptions

| Exception | Classification |
|-----------|----------------|
| Quiz submit also calls `updateMasteryFromQuiz` (TopicMastery) | **intentional legacy** — parallel to ConceptMastery; ULE path still written |
| Flashcard PATCH also calls `updateTopicMasteryFromReview` | **intentional legacy** — same dual write |
| CORE Assist chat does not write LearningAttempt | **intentional** — not an activity evidence producer |
| Tutor ordinary chat (`evidenceIntent: none`) skips evidence | **intentional** |
| Evaluate without topicId skips evidence | **intentional** (refuses invented Concept) |
| No AssessmentAttempt / second Attempt model | **NO CONTRADICTION** — absent by design |
| UI/localStorage as sole evidence | **Not found** for in-scope ULE paths |

Coordinator / Assessment / sequence adapters do **not** call `recordEvidence` (preservation tests).

---

## 4. Completion vs evidence vs progression

| System | Evidence | Completion | Progression |
|--------|----------|------------|-------------|
| **Quiz** | Per-question LearningAttempts on submit | Whole-quiz submit + evidence rows (score-agnostic) | `bindQuizSubmitToAdaptiveSequence` → coordinator |
| **SIX** | Evaluate → LearningAttempt | `isSixAdaptiveCompletionEligible` (allDone / score gate) | `bindSixEvaluateAttemptToAdaptiveSequence` |
| **Flashcard** | Per-rating LearningAttempt | Any AGAIN/GOOD/EASY that recorded Attempt (score-agnostic) | `bindFlashcardReviewToAdaptiveSequence` |

### Inconsistency check

| Anti-pattern | Found? |
|--------------|--------|
| Launch = completion | **No** — Assessment launch instruction only |
| Evidence = progression | **No** — bind is separate after evidence |
| Score = completion (required) | **No** for Quiz/Flashcard Adaptive; SIX has explicit eligibility gate |
| UI state = canonical completion | **No** — server derives from Attempt / gates |
| Client `complete=true` trusted | **No** — Flashcard voids `complete`; Quiz/SIX use evidence |

---

## 5. Activity identity / correlation audit

| Activity | Correlation chain | Mechanism | Strength |
|----------|-------------------|-----------|----------|
| **Quiz** | run → quiz step → Quiz.id (URL) → submit evidence Attempts → authoritative Attempt | `sourceRef.kind=quiz_attempt` + quizId + concept pick | **Strong** — page-bound quiz id |
| **SIX** | run → SIX intervention → evaluate Attempt | `sourceRef` study_evaluate/six + facet + attemptId from evaluate | **Strong** when gate + attemptId present |
| **Flashcard** | run → flashcard step → rated cardId → **just-created** Attempt | `sourceRef.flashcard_review` + `expectedFlashcardId` + attemptId from bridge | **Strong vs historical**; **PARTIAL vs prepare-frozen card** (queue may rate any due card) |

Correlation relies on: exact Attempt from current interaction, `sourceRef`, concept (coordinator), optional `learningObjectId` on step. Timestamp not used as primary key.

**Weakness (documented, not defect):** Flashcard Adaptive correlates to the **rated** card, not necessarily the Assessment-prepared card id if the due queue differs.

---

## 6. Ownership / security audit

| Surface | Server ownership | Client trust |
|---------|------------------|--------------|
| Assessment API | Session user; voids `learnerId`/`userId`/`quizId`/`flashcardId` | Concept id checked via owned ConceptMastery |
| Quiz submit | Quiz `id` + `userId` | adaptiveRunId/step parsed; not ownership alone |
| Flashcard PATCH | `findFirst({ id: cardId, userId })` | adaptive params opaque; `complete` voided |
| Adaptive binds | Run ownership via `getAdaptiveSequenceRun` / coordinator | Step index stale-checked |
| Tutor/CORE | Session / owned resources | N/A for Assessment launch |

Passive vs sensitive: Assessment adaptive bind on plan is **passive metadata**; Adaptive completion bind is **security-sensitive** (ownership + attempt checks).

---

## 7. Assessment architecture audit

```text
ASSESS → Workflow → AssessmentPlan → Registry → Resolve → Prepare → Launch
  → existing activity (stop)
```

| Check | Status |
|-------|--------|
| Quiz optional Assessment adapter | Yes — `adapterKey=quiz` |
| Flashcard PRACTICE_CHECK only | Yes — canHandle rejects DIAGNOSTIC/VERIFICATION |
| SIX registered as Assessment adapter | **No** |
| Tutor/CORE as Assessment adapters | **No** |
| Empty registry default | Yes |
| ASSESS ≠ Quiz | Yes |
| Assessment ≠ Universal Activity | Yes — launch only; no progression |

---

## 8. Adaptive architecture audit

```text
AdaptiveSequenceRun → activity → interaction → evidence → bind → coordinator
  → plan-next / terminal
```

| Check | Quiz | SIX | Flashcard |
|-------|------|-----|-----------|
| Same coordinator | Yes | Yes | Yes |
| Direct cursor/history mutation outside coordinator | **No** | **No** | **No** |
| Lifecycle safeguards | Via coordinator + adapter asserts | Same | Same |

Safeguards verified in coordinator: ownership, active, step index, concept, duplicate Attempt, stale/future step, terminal, max steps, optimistic concurrency, immediate-repeat (plan-next).

---

## 9. Orchestrator boundary audit

| Check | Status |
|-------|--------|
| Diagnoses from Learner Model / evidence / mastery | Yes — `diagnose.ts` |
| Owns concrete Quiz/Flashcard ids | **No** |
| Intervention catalog primarily SIX | Yes |
| Soft-intent preference may bias | Yes — does not replace diagnosis |
| ASSESS handoff | Purpose ASSESS → Assessment workflow; no quiz auto-select |
| UNDERSTAND / PRACTICE / ASSESS / CREATE | Intent contextual; circularity avoided by handoff boundaries |

Orchestrator does **not** emit Flashcard intervention (Flashcard Adaptive steps must be planned as intervention `flashcard` explicitly).

---

## 10. Mastery audit

| Facet | Producers |
|-------|-----------|
| RECOGNIZE | Quiz; SIX chunking |
| EXPLAIN | SIX detailed-explanation / feynman / visualization; teach-me; Tutor explain |
| APPLY | SIX hands-on-practice; Tutor apply/practice |
| SOLVE | Tutor solve intent |
| PERFORM | **No dedicated closed producer** |
| RETAIN | Flashcard; SIX/blurting active-recall |

ConceptMastery via `applyEvidenceToMastery` only on ULE path. Legacy TopicMastery remains on Quiz/Flashcard routes (**intentional legacy**).

---

## 11. Evidence Intelligence audit

`getLearnerConceptMastery` classifies `sourceRef.kind`:

- `quiz_attempt` → quiz counts  
- `flashcard_review` → **flashcard** counts  
- `study_evaluate` → study_evaluate counts  

Flashcard evidence feeds Orchestrator diagnosis confidence / retention signals when intelligence/aggregation is enabled. No new intelligence policy in this audit.

---

## 12. LUCKY boundary audit

| Path | Behavior |
|------|----------|
| Flashcard review | `syncFlashcardRetentionItem` mirrors SM-2 due (`scheduleAuthority: flashcard_sm2`) — **not** LUCKY product replacement |
| Adaptive sequence COMPLETE | `syncLuckyRetentionAfterSequenceComplete` → weak-mastery RetentionItem only |
| Quiz/SIX as LUCKY | Do not replace LUCKY |
| Normal flashcard → auto LUCKY engine | Only RetentionItem mirror; LUCKY UI remains separate |

**CORE → SIX → LUCKY** product line preserved.

---

## 13. Tutor boundary audit

- Interaction producer with optional `maybeRecordTutorEvidence`
- Not registered in AssessmentAdapterRegistry
- Not an Adaptive intervention family
- Forcing Assessment Adapter → Launch would distort product semantics

**INTENTIONALLY DIFFERENT** — correct.

---

## 14. CORE boundary audit

- Knowledge bridge: study extract → Concept candidates (`core-bridge.ts`)
- Assist: `tutor/core-adapter.ts` prompt/payload — host workflow
- `Note.contentJson` remains document truth (preservation tests)
- Not a conventional Activity Adapter

**INTENTIONALLY DIFFERENT** — correct.

---

## 15. Quiz / SIX / Flashcard comparison

| | Quiz | SIX | Flashcard |
|-|------|-----|-----------|
| Role | Assessment-heavy | Technique / intervention | Self-rating review |
| Assessment adapter | Yes (any mode via plan) | No | Yes (PRACTICE_CHECK only) |
| Adaptive intervention | `quiz` | SIX components | `flashcard` |
| Evidence facet | RECOGNIZE | Mapped per technique | RETAIN |
| Domain attempt | QuizAttempt + LAs | Evaluate Attempt | Rating only (no FlashcardAttempt) |
| Shared | Registry/launch pattern, coordinator, LearningAttempt, soft-fail bind | Same | Same |
| Specific | Objective grading | Stage completion gate | SM-2 + self-rate |

**Conclusion:** Universal architecture through **shared contracts**, not identical implementations.

---

## 16. Contradictions / findings

| Finding | Class |
|---------|-------|
| Dual TopicMastery + ConceptMastery on Quiz/Flashcard | **NO CONTRADICTION** — intentional legacy |
| Soft-fail Adaptive bind after successful evidence | **NO CONTRADICTION** — evidence safe; step may wait |
| Flashcard queue ≠ prepare-frozen card | **SMALL ADDITIVE CLEANUP** (optional tighter launch deep-link) — not unsafe for historical Attempts |
| No retry-bind API for orphaned Adaptive step after soft-fail | **SMALL ADDITIVE CLEANUP** (optional) |
| PERFORM facet unused | **LARGER FUTURE FEATURE** / genuine gap |
| CODING/SQL/LAB/… enum-only | **LARGER FUTURE FEATURE** |
| Duplicate coordinators / evidence spines / Assessment progression | **Not found** |
| Client-controlled progression / ownership | **Not found** |
| Tutor/CORE forced into adapters | **Not found** |

---

## 17. 2G-54 soft-fail analysis

**Observed (`app/api/flashcards/route.ts`):**

1. SM-2 + TopicMastery applied  
2. `recordFlashcardReviewEvidence` → LearningAttempt + ConceptMastery (try/catch)  
3. LUCKY RetentionItem mirror (try/catch)  
4. `bindFlashcardReviewToAdaptiveSequence` (try/catch) — on error: log + optional `adaptive` error payload; **HTTP success still true**  

| Question | Answer |
|----------|--------|
| Evidence preserved if bind fails? | **Yes** |
| Adaptive run consistent? | **Yes** — unchanged cursor/history |
| User result? | Review succeeds; may include `adaptive.outcome=error` |
| Later retry same Attempt? | **No automatic retry** on PATCH; coordinator would accept same `attemptId` if called before history records it; product path is “rate again under adaptive context” (new Attempt) |
| Permanently orphaned step? | **Possible until another eligible rating** under adaptive context — same soft-fail pattern as Quiz bind |

**Evidence spine not corrupted.** Soft-fail is **safe** and consistent with Quiz.

---

## 18. Classification (rollup)

| Area | Class |
|------|-------|
| Universal spine + Quiz/SIX/Flashcard convergence | **NO CHANGE REQUIRED** |
| Tutor / CORE boundaries | **INTENTIONALLY DIFFERENT** |
| Soft-fail bind / dual TopicMastery | **NO CONTRADICTION** (document / optional cleanup) |
| Tighter Flashcard prepare↔rate correlation | **SMALL ADDITIVE CLEANUP** (optional) |
| Soft-fail Adaptive retry UX | **SMALL ADDITIVE CLEANUP** (optional) |
| PERFORM / coding/SQL/lab systems | **LARGER FUTURE FEATURE** |

---

## 19. Recommended next action

**Do not implement another activity adapter next by default.**

Preferred next phase (pick by product priority):

1. **Evidence/Mastery product gap** — PERFORM-oriented producer or strengthen SOLVE outside Tutor (only if product needs it)  
2. **Optional small cleanups** — Flashcard Adaptive soft-fail retry or prepare-card deep-link (only if Adaptive orphans become a UX issue)  
3. **Adjacent ULE work** — Orchestrator/intelligence policy refinement using existing Flashcard evidence visibility  
4. **Defer reserved enums** — CODING/SQL/LAB remain LARGER FUTURE FEATURE  

**Explicit non-recommendation:** Auto-add next Assessment adapter for symmetry.

---

## 20. Verification results

| Suite | Result | Notes |
|-------|--------|-------|
| `universal-activity-vertical.design.test.ts` | **8 passed** | Assumption locks only |
| `src/lib/learning` | **71 files / 752 passed** | Quiz, SIX, Flashcard, Assessment, Adaptive, Evidence, Mastery, Tutor, CORE learning |
| Lint | **Pre-existing** | No 2G-55 production changes |
| `tsc --noEmit` | **Pre-existing** | `notebook-desk.ts`, `generate-offline-fallback.integration.test.ts`, `resolve-loop-focus-topic.ts` |

**2G-55 introduced failures:** none.  
**Production code changed:** none (audit + design tests only).

---

## Hard invariants (confirmed)

ONE ULE · ONE Learner Model · ONE Knowledge Model · ONE LearningAttempt spine · ONE Mastery contract · ONE Orchestrator · ONE Adaptive coordinator · ONE LUCKY path · CORE→SIX→LUCKY · Evidence≠Completion≠Progression · Launch≠Completion · ASSESS≠Quiz · Assessment≠Universal Activity · Flashcard≠Quiz≠LUCKY · SIX≠Assessment · Tutor/CORE ≠ conventional Activity Adapters · Orchestrator ≠ concrete activity selector · Assessment ≠ Adaptive coordinator · no client-controlled progression/ownership · no duplicate spines/coordinators.

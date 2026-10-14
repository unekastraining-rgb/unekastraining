# 2G-66 — Universal Learning Loop Integrity Audit

**Status:** INSPECTION / DESIGN ONLY — no production behavior changes  
**Date:** 2026-03-22  
**Depends on:** 2G-61 … 2G-65 (mastery truth + candidate ordering)

---

## 1. Executive summary

The Universal Learning Loop is **closed and coherent end-to-end** for the primary Hub → Adaptive → SIX/Quiz/Flashcard → Evidence → ConceptMastery → re-orchestrate path.

| Contract | Status |
| --- | --- |
| ConceptMastery = canonical ULE mastery | **Held** (writes via evidence spine; Hub ranking 2G-65; Hub display 2G-62/63) |
| TopicMastery = legacy progress | **Held** (dual-write remains; not Hub ULE priority) |
| Diagnosis ≠ intervention ≠ Adaptive ≠ activity ≠ evidence | **Held** |
| Evidence before Adaptive bind | **Held** |
| LUCKY only after Adaptive COMPLETED | **Held** |
| Intent ≠ mastery diagnosis | **Held** |
| ASSESS ≠ Quiz | **Held** |

**Highest remaining integrity concern (P0):** the foundation Tutor API accepts client `evidenceIntent`, which can create ConceptMastery without a graded activity when owned `conceptIds` are supplied.

**Overall verdict:** Loop is trustworthy for shipped Adaptive/SIX/Quiz/Flashcard/Hub surfaces. Residual risks are Tutor evidence gating, dual TopicMastery truth chrome, and future activity producers (not blockers for current closed loop).

**ONE recommended next phase:** Tutor evidenceIntent integrity hardening (server-authoritative; ignore or restrict client write path).

---

## 2. Canonical loop trace

```text
Candidate discovery
  → getTopOrchestratorSuggestion (orchestrator/suggest.ts)
  → db.topic.findMany (course.userId, sortOrder, take 40)
Concept resolution
  → Topic.conceptId | ensureConceptForTopic (knowledge/concept.ts)
ConceptMastery retrieval
  → db.conceptMastery.findMany (batch)
Candidate ordering
  → orderCandidatesByConceptMastery (candidate-ordering.ts)
Orchestrator diagnosis
  → orchestrateForConcept (orchestrator/index.ts)
  → getLearnerConceptMastery (learner-model/read.ts)
  → orchestrateFromLearnerState (diagnose.ts)
Intervention selection
  → diagnose policy + soft preferSixWithIntent (intent-preference.ts)
  → presentOrchestratorSuggestion (present.ts)
Activity launch
  → Hub Adaptive CTA (hub-adaptive-bridge.ts)
  → POST /api/study/adaptive/start → startOrResumeAdaptiveSequenceForConcept
  → startAdaptiveSequenceRun (sequence/coordinator.ts)
Learner interaction
  → SIX evaluate | Quiz submit | Flashcard review (activity UIs)
Evidence production
  → evaluate-bridge / quiz-bridge / flashcard-bridge
LearningAttempt
  → recordEvidence (evidence/record.ts)
ConceptMastery update
  → applyEvidenceToMastery (mastery/apply.ts)
Re-orchestration
  → bind*ToAdaptiveSequence → recordAdaptiveSequenceCompletionAndPlanNext
  → getNextAdaptiveIntervention → orchestrateForConcept again
Next intervention
  → append Adaptive step (or STOP_*)
```

| Stage | File | Function |
| --- | --- | --- |
| Hub fetch | `app/api/study/orchestrator-suggestion/route.ts` | `GET` |
| Discover + order + select | `orchestrator/suggest.ts` | `getTopOrchestratorSuggestion` |
| Order | `orchestrator/candidate-ordering.ts` | `orderCandidatesByConceptMastery` |
| Diagnose | `orchestrator/index.ts` / `diagnose.ts` | `orchestrateForConcept` / `orchestrateFromLearnerState` |
| Present | `orchestrator/present.ts` | `presentOrchestratorSuggestion` |
| Hub CTA | `components/study/OrchestratorSuggestionCard.tsx` | Adaptive start/resume |
| Adaptive start | `sequence/start-or-resume.ts` / `coordinator.ts` | `startAdaptiveSequenceRun` |
| Evidence | `evidence/record.ts` | `recordEvidence` |
| Mastery | `mastery/apply.ts` | `applyEvidenceToMastery` |
| Bind + next | `coordinator.ts` | `recordAdaptiveSequenceCompletionAndPlanNext` |

---

## 3. SIX trace

```text
SIX intervention (Adaptive step or Hub secondary CTA)
  → /study/six/{component}
  → learner response
  → POST /api/study/evaluate (mode=six)
  → mapStudyEvaluateToLearningSignals + recordStudyEvaluateEvidence (assessment/evaluate-bridge.ts)
  → LearningAttempt + applyEvidenceToMastery
  → isSixAdaptiveCompletionEligible (csl/six-completion.ts)
  → bindSixEvaluateAttemptToAdaptiveSequence (sequence/six-evaluate-bind.ts)
  → recordSixAdaptiveSequenceCompletionAndPlanNext (sequence/six-adapter.ts)
  → re-orchestrate
```

| Technique | LO / facet (evaluate-bridge) | Same evidence pipe? |
| --- | --- | --- |
| Chunking | OTHER / RECOGNIZE | Yes |
| Detailed Explanation | EXPLANATION / EXPLAIN | Yes |
| Feynman | FEYNMAN / EXPLAIN | Yes |
| Visualization | VISUALIZATION / EXPLAIN | Yes |
| Hands-on Practice | HANDS_ON_PRACTICE / APPLY | Yes |
| Active Recall | ACTIVE_RECALL / RETAIN | Yes |

**Semantics:** One shared evaluate writer; facet/LO differ by component. Intermediate stages may write Attempts; Adaptive bind only when final stage passes (`isSixStagePassing` ≥65). Soft-fail ULE errors do not break evaluate UX.

**Boundary note (MINOR):** Client may influence `sixStageCount` (bounded 2–4) used in completion eligibility.

Also on evaluate (non-SIX): blurting → RETAIN; teach-me → EXPLAIN (same bridge).

---

## 4. Quiz trace

```text
ASSESS / Adaptive Quiz step
  → quiz-assessment-adapter / quiz-adapter (launch only — no evidence)
  → Quiz UI
  → POST /api/quizzes/[id]/submit
  → gradeQuizAnswers + QuizAttempt.create
  → recordQuizAttemptEvidence (assessment/quiz-bridge.ts) → per-question LearningAttempts (RECOGNIZE)
  → applyEvidenceToMastery
  → bindQuizSubmitToAdaptiveSequence (quiz-submit-bind.ts)
  → Adaptive plan-next
```

| Concern | Finding |
| --- | --- |
| Ownership | Quiz + Attempt + run scoped to session user |
| Evidence | Only after real submit; adapter prepare is read-only |
| Completion | Server eligibility; not a client “complete” flag |
| 0% | Still creates QuizAttempt + FAIL evidence; Adaptive bind score-agnostic if graded + Attempt exists |
| Duplicates | Re-submit creates new QuizAttempts/LearningAttempts; Adaptive history Attempt-idempotent |
| Dual-write | Also `updateMasteryFromQuiz` → TopicMastery (L1) |

---

## 5. Flashcard trace

```text
Assessment / Adaptive flashcard step
  → flashcard-assessment-adapter / flashcard-adapter (launch only)
  → PATCH /api/flashcards
  → applySm2Review (SM-2 authoritative for card schedule)
  → updateTopicMasteryFromReview (legacy)
  → recordFlashcardReviewEvidence (RETAIN) → LearningAttempt → ConceptMastery
  → bindFlashcardReviewToAdaptiveSequence
```

| Concern | Finding |
| --- | --- |
| Rating → evidence | Mapped server-side in flashcard-bridge |
| SM-2 | Card scheduling remains SM-2; ConceptMastery RETAIN independent |
| LUCKY | Mirror/scheduler via retention sync; not SM-2 replacement |
| Client complete | Explicitly ignored |
| Soft-fail | Evidence/bind failures do not fail the review response |

---

## 6. Tutor trace

```text
Tutor surfaces (foundation API / Core Assist / SIX Tutor / Teach Me adapters)
  → runTutor (tutor/service.ts)
  → ordinary Q&A: evidenceIntent "none" → no LearningAttempt
  → when evidenceIntent ∈ explain|practice_answer|guided_task|apply|solve + owned conceptId
       → maybeRecordTutorEvidence → LearningAttempt → ConceptMastery
```

| Claim | Finding |
| --- | --- |
| Ordinary Q&A fabricates evidence? | **No** when intent is `none` (default on migrated CORE/SIX/Teach Me adapters) |
| Intent (LearningIntent) drives evidence? | **No** — `resolve-intent` does not mutate `evidenceIntent` |
| Foundation API | `app/api/study/tutor/route.ts` passes **client** `body.evidenceIntent ?? "none"` |

**Integrity:** Client-settable `evidenceIntent` on the foundation endpoint is **ARCHITECTURAL RISK / P0** for evidence trustworthiness (owned concepts can still receive mastery writes without a graded activity). Trusted adapters hardcode `"none"` or controlled demonstration paths.

---

## 7. CORE trace

```text
CORE notebook / Assist
  → detectCoreStudyIntent (core/study-intent.ts)
  → projectCoreStudyIntentToLearningIntent (intent/project.ts)
  → toTutorRequestFromCoreAssist → evidenceIntent: "none"
  → optional generate quiz/flashcards (CREATE intent) — evidence only when those activities later submit/review
```

CORE remains a **host/origin** surface. Notebook actions do **not** invent ConceptMastery evidence. **SAFE.**

---

## 8. LUCKY trace

```text
Adaptive run reaches COMPLETED
  → completeAdaptiveSequence (coordinator.ts)
  → syncLuckyRetentionAfterSequenceComplete (lucky-handoff.ts)
  → reads ConceptMastery (getLearnerConceptMastery) → syncWeakMasteryRetentionItem
```

| State | Handoff? |
| --- | --- |
| ACTIVE | No |
| ABANDONED | No |
| STOP_* (run stays ACTIVE until explicit complete) | No Lucky on stop alone |
| COMPLETED | Yes (soft-fail; does not roll back COMPLETED) |

TopicMastery is **not** used as ULE retention truth for this handoff. Lucky review can later write Attempt + ConceptMastery via `submitRetentionReview`.

---

## 9. Activity / interaction / evidence / mastery boundaries

| Distinction | Status | Notes |
| --- | --- | --- |
| Activity ≠ Interaction | **SAFE** | Adapters launch; UX interacts |
| Interaction ≠ Evidence | **SAFE** for Quiz/Flash/SIX evaluate; **RISK** if Tutor client sets evidenceIntent |
| Evidence ≠ Mastery | **SAFE** | `recordEvidence` then `applyEvidenceToMastery` |
| Mastery ≠ Recommendation | **SAFE** | Ordering + diagnose separate from apply |
| Recommendation ≠ Completion | **SAFE** | Hub/Adaptive recommend; completion needs Attempt + gates |
| Completion ≠ Progression | **SAFE** | Bind ≠ auto COMPLETED; plan-next may STOP |
| Progression ≠ Retention | **SAFE** | Lucky only on explicit COMPLETE |

**Collapsed concepts found:** None in Adaptive/SIX/Quiz/Flashcard core. Tutor client evidenceIntent is the main interaction↔evidence collapse risk.

---

## 10. Evidence integrity

| Check | Result |
| --- | --- |
| Client-controlled evidence payload inventing mastery (Quiz/Flash/SIX) | **SAFE** — server grades/maps |
| Client-controlled completion | **SAFE** — ignored or server-gated |
| Duplicate evidence | **MINOR** — Quiz re-submit creates new Attempts (Adaptive Attempt-idempotent) |
| Fabricated evidence without interaction | **P0 risk** — Tutor foundation `evidenceIntent` |
| Evidence without concept | Writers require concept resolution / ownership |
| Evidence without activity/LO | Bridges attach LO / sourceRef |
| Cross-learner attribution | Session userId; ownership checks on concepts/runs |
| Cross-concept attribution | Adaptive binds Attempt matching run concept |

Soft-fail bridges: evaluate/quiz/flashcard may silently skip ULE write on error (**MINOR** — UX preserved, possible missing evidence).

---

## 11. ConceptMastery integrity

| Claim | Result |
| --- | --- |
| LearningAttempt is evidence spine | **Yes** (`recordEvidence`) |
| ConceptMastery from canonical path | **Yes** (`applyEvidenceToMastery`) |
| TopicMastery merged into ConceptMastery store | **No** |
| TopicMastery as ConceptMastery via Hub ranking | **No** (2G-65) |
| TopicMastery as learner-facing ULE claim | **No** on Hub card (2G-62/63) |
| Diagnose TopicMastery fallback | **Yes, LOW confidence** when no ULE evidence (`effectiveFacetsForOrchestration`) — L1 compatibility, not Hub priority |
| Tutor / Adaptive / Lucky use ConceptMastery | **Yes** where applicable |
| Divergent path | **code-evaluate** → TopicMastery only (no LearningAttempt) — L4 / out of ULE |

---

## 12. Orchestrator integrity

| Layer | Result |
| --- | --- |
| Discovery | Topic/Course-first — preserved |
| Ordering | ConceptMastery after concept resolve (2G-65) |
| Diagnosis | Facets/evidence authored in `diagnose.ts` |
| Intervention | Policy-authored; soft intent only among legal SIX |
| Intent | Preference/workflow; does **not** override genuine diagnosis |
| ASSESS | Handoff metadata; does **not** become Quiz inside diagnosis |

---

## 13. Adaptive integrity

| Control | Result |
| --- | --- |
| Max steps | `MAX_SEQUENCE_STEPS` = 12 (`sequence/policy.ts`) |
| Duplicate Attempt completion | Idempotent / `ALREADY_PROCESSED` |
| Terminal protection | COMPLETED/ABANDONED refuse further progression |
| Optimistic concurrency | Cursor-matched `updateMany` |
| Client completion flag | Not authoritative |
| Ownership | userId on run/Attempt/concept |
| Evidence-before-bind | Coordinator never creates Attempts |
| Re-orchestrate after evidence | `getNextAdaptiveIntervention` |
| No immediate repeat | `STOP_IMMEDIATE_REPEAT` |
| LUCKY handoff | Only `completeAdaptiveSequence` → COMPLETED |
| Adapters | SIX, Quiz, Flashcard present and bound |

---

## 14. Assessment integrity

```text
ASSESS intent → Assessment Workflow → Assessment Plan
  → Activity Adapter (quiz | flashcard | future keys)
  → Activity → Evidence → LearningAttempt → ConceptMastery
```

| Claim | Result |
| --- | --- |
| ASSESS ≠ Quiz | **Yes** |
| ASSESS ≠ SIX | **Yes** |
| Plan ≠ execution | **Yes** — prepare/launch only |
| Launch ≠ completion | **Yes** |
| Registry extensible | Opaque `adapterKey` registry |
| Adapters bypass evidence? | **No** — evidence on activity submit/review |

---

## 15. Intent integrity

| Intent | Role |
| --- | --- |
| UNDERSTAND / PRACTICE / ASSESS / CREATE | WHY signals (`intent/types.ts`) |

| Surface | Coupling |
| --- | --- |
| Orchestrator | Soft SIX preference after diagnosis |
| Tutor | Mode→intent projection; evidence gated separately |
| CORE | practice→PRACTICE; explain→UNDERSTAND; generate→CREATE (not ASSESS) |
| Assessment | ASSESS handoff only |

**Intent ≠ Diagnosis ≠ Mastery** — held.

---

## 16. Study Hub integrity

```text
Study Hub → Concept candidate → ConceptMastery priority → Orchestrator suggestion
  → Adaptive Start/Resume → Activity → Evidence → ConceptMastery
```

| Surface | Result |
| --- | --- |
| Ordering | ConceptMastery (2G-65) |
| masterySummary | ConceptMastery soft line (2G-63) |
| Reason | From diagnosis present |
| Adaptive CTA | Primary start/resume |
| Direct SIX | Secondary fallback |
| Duplicate run creation | start-or-resume prefers existing ACTIVE |
| Client evidence | None from Hub card |
| TopicMastery as ULE mastery | Not on suggestion card; Study Now “Topic progress focus” is labeled legacy |

---

## 17. Legacy compatibility

| Usage | Class |
| --- | --- |
| Dual-write TopicMastery on quiz/evaluate/flashcard | **L1** |
| Diagnose TopicMastery fallback (LOW) | **L1** |
| MasteryTree / Six panel with topic-progress copy | **L1** |
| Hub Study Now topic progress focus | **L1** |
| Dashboard / stats “Overall mastery” from TopicMastery | **L2** (needs clearer labeling) |
| Unlabeled TopicMastery read as ULE ConceptMastery | **L3 residual** on dashboard chrome |
| Dual-write divergence; code-evaluate Topic-only; retire TopicMastery | **L4** |

No migration in this phase.

---

## 18. Future extensibility

Reserved LO types (`CODING_CHALLENGE`, `SQL_CHALLENGE`, `LAB`, `WRITING_EXERCISE`, etc.) and facets (`SOLVE`, `PERFORM`) exist.

Theoretical fit:

```text
Activity Adapter → Activity → Interaction → EvidenceEnvelope
  → LearningAttempt → ConceptMastery → optional Adaptive bind
```

**Genuine gaps (not contradictions):**

1. No product UX/producers for Coding/SQL/Labs/Writing yet.
2. `code-evaluate` writes TopicMastery only — not on ULE spine.
3. Orchestrator interventions remain SIX-slug-centric for Adaptive scheduling.
4. Assessment vs Adaptive adapter surfaces are dual by design (acceptable).

No second mastery system is required.

---

## 19. P0–P3 gap list

### P0

1. **Tutor foundation API client `evidenceIntent`** can create ConceptMastery without graded activity (owned concepts). Breaks “interaction → evidence writer” trust if abused.

### P1

1. Soft-fail ULE bridges may drop evidence silently (evaluate/quiz/flashcard).
2. Adaptive run page lacks soft “why this step” / learning-state line (visibility gap in closed loop).

### P2

1. `code-evaluate` outside ULE spine (TopicMastery only).
2. Future activity producers / Adaptive intervention strings for non-SIX activities.
3. Quiz multi-topic → Adaptive binds last matching-concept Attempt only.

### P3

1. Dashboard / stats TopicMastery “Overall mastery” labeling.
2. Quiz re-submit duplicate LearningAttempts (product idempotency).
3. Client-bounded `sixStageCount` influence on SIX Adaptive gate.

---

## 20. ONE recommended next phase

### **2G-67 — Tutor evidenceIntent integrity hardening**

Make Tutor mastery evidence **server-authoritative**:

- Foundation `/api/study/tutor` must not trust arbitrary client `evidenceIntent` for writes (force `"none"` or derive only from trusted server adapters / demonstration contracts).
- Preserve intentional demonstration paths (`toTutorRequestFromDemonstration`) as **server-built** requests.
- Keep CORE/SIX/Teach Me adapters at `"none"` (already correct).
- Add tests: client cannot mint ConceptMastery via evidenceIntent alone.

---

## 21. Why that phase should come next

The loop is otherwise closed. Remaining Adaptive “why line” and dashboard labeling improve UX/clarity but do not threaten evidence integrity. Bridging `code-evaluate` into ULE is a larger producer feature. **Hardening Tutor evidence gating** is the smallest change that closes the only clear P0 trust gap identified in this audit.

---

## 22. Tests / verification

### Design contract (this phase)

- `src/lib/learning/universal-learning-loop-integrity.design.test.ts`  
  Freezes audit claims: 2G-65 ordering present; LUCKY after COMPLETE only; ASSESS≠Quiz; Tutor route still documents client evidenceIntent risk; recommended 2G-67; no production migration.

### Production

- **None** in 2G-66.

### Suite

- Focused integrity + related: **52** passed  
- Full `src/lib/learning`: **826** passed (82 files; +7 vs prior 819 baseline from this design test)  
- ESLint (design test): clean  
- Typecheck: known baseline only (`notebook-desk.ts`, `generate-offline-fallback.integration.test.ts`, `resolve-loop-focus-topic.ts`)

---

## PASS checklist

- [x] Canonical loop traced  
- [x] SIX / Quiz / Flashcard / Tutor / CORE / LUCKY traced  
- [x] Evidence + ConceptMastery + TopicMastery separation verified  
- [x] Orchestrator ordering (2G-65) verified  
- [x] Adaptive lifecycle verified  
- [x] Assessment + intent + Hub verified  
- [x] Legacy classified L1–L4  
- [x] Future extensibility assessed  
- [x] P0–P3 listed  
- [x] Exactly ONE next phase recommended  
- [x] No architecture redesign  

**2G-66 PASS** (inspection complete; stop).

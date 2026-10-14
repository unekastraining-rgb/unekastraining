# 2G-81 — Universal Learning Activity Coverage & Evidence Closure

**Mode:** Audit-first. Truthful coverage, not artificial completeness.  
**No second Learner Model / mastery / evidence pipeline. No new activity types.**

**Updated:** 2P-18 (Writing Adaptive) · **2P-23** (Simulation facet inventory + coverage doc sync)

**Predecessors:** [2G-79 Learner Model Truth](./LEARNER_MODEL_TRUTH_AND_STATE.md) · [2G-80 Decision Loop](./UNIVERSAL_DECISION_LOOP_INTEGRITY.md) · [2G-78 Entry Points](./ADAPTIVE_ENTRY_POINT_INTEGRITY.md)

Metadata helper: `src/lib/learning/activity-coverage.ts`  
Full 2P-23 audit: [UNIVERSAL_ACTIVITY_COVERAGE_AUDIT.md](./UNIVERSAL_ACTIVITY_COVERAGE_AUDIT.md)

---

## A. Activity inventory

| Activity / surface | Exists |
|--------------------|--------|
| CORE notes, knowledge bridge, Continue learning, Assist | Yes |
| SIX (6 techniques) + Study Evaluate | Yes |
| Quiz / Flashcard / Assessment modes | Yes |
| Tutor (authorized + public API) | Yes |
| Coding, SQL, Writing, Lab, Simulation, Game, Project, Presentation | Yes |
| Adaptive SIX / Quiz / Flashcard / universal ACTIVITY | Yes |
| Lucky retention review | Yes |
| Study Now, Hub, Assignments, MasteryTree, Learner Model / Growth Center | Yes |
| Educational Market / Trading Simulation (simulation scenarios) | Yes |
| Legacy `code-evaluate` | Yes |

---

## B. Classification (exactly one primary status)

| Code | Meaning |
|------|---------|
| **A** | Full ULE loop: evidence → ConceptMastery → future Orchestrator; Adaptive where applicable |
| **B** | Evidence closed → ConceptMastery; not orch-selectable / not Adaptive-ready |
| **C** | Adaptive closed (Assessment / adapter lane) with evidence |
| **D** | Partial (bind/consume only) |
| **E** | Intentionally outside ULE evidence |
| **F** | Legacy TopicMastery compatibility |

| Activity | Status |
|----------|--------|
| Coding, SQL, Lab, Simulation, Presentation, **Writing** | **A** |
| SIX / Study Evaluate | **A** |
| Quiz, Flashcard | **C** |
| Game, Project | **B** |
| Tutor (authorized), Lucky retention | **B** |
| Adaptive bind adapters | **D** |
| CORE, Hub/Study Now/Assignments, public Tutor, open/launch/browse, MasteryTree chrome | **E** |
| Legacy code-evaluate | **F** |

---

## C. Evidence producer matrix

```text
Activity → writer → LearningAttempt → ConceptMastery → getLearnerConceptMastery → orchestrateForConcept
```

| Activity | Writer | Facet | Mastery | Orch reads | Adaptive |
|----------|--------|-------|---------|------------|----------|
| Quiz | `recordQuizAttemptEvidence` | RECOGNIZE | Yes | Yes | Quiz adapter |
| Flashcard | `recordFlashcardReviewEvidence` | RETAIN | Yes | Yes | Flashcard adapter |
| SIX / Evaluate | `recordStudyEvaluateEvidence` | mapped | Yes | Yes | SIX adapter |
| Coding | `submitCodingChallenge` | PERFORM | Yes | Yes | Adaptive-ready |
| SQL | `submitSqlChallenge` | PERFORM | Yes | Yes | Adaptive-ready |
| Lab | structured | PERFORM | Yes | Yes | Adaptive-ready |
| Simulation | structured (+ educational market) | APPLY / SOLVE / EXPLAIN | Yes | Yes | Adaptive-ready |
| Presentation | structured | PERFORM | Yes | Yes | Adaptive-ready |
| Writing | structured | EXPLAIN | Yes | Yes | **Adaptive-ready (2P-18)** |
| Game | structured | RECOGNIZE | Yes | Yes | **Not** Adaptive-ready |
| Project | structured | APPLY | Yes | Yes | **Not** Adaptive-ready |
| Tutor auth | `maybeRecordTutorEvidence` | EXPLAIN/APPLY/SOLVE | Yes | Yes | No |
| Lucky | `submitRetentionReview` | RETAIN | If conceptId | Yes | No |

Single write: `recordEvidence`. Single apply: `applyEvidenceToMastery`.

---

## D. Facet matrix (actual writers)

| Activity | Recognize | Explain | Apply | Solve | Perform | Retain |
|----------|-----------|---------|-------|-------|---------|--------|
| Quiz | ✓ | | | | | |
| Flashcard | | | | | | ✓ |
| SIX / Evaluate | ✓ | ✓ | ✓ | | | ✓ |
| Coding | | | | | ✓ | |
| SQL | | | | | ✓ | |
| Lab | | | | | ✓ | |
| Simulation | | ✓ | ✓ | ✓ | | |
| Presentation | | | | | ✓ | |
| Writing | | ✓ | | | | |
| Game | ✓ | | | | | |
| Project | | | ✓ | | | |
| Tutor auth | | ✓ | ✓ | ✓ | | |
| Lucky | | | | | | ✓ |

---

## E. Adaptive matrix

| Keys | Status |
|------|--------|
| coding, sql, lab, simulation, presentation, **writing** | Adaptive-ready |
| game, project | PRODUCT-READY, **not** Adaptive-ready |
| SIX, Quiz, Flashcard | Adaptive via dedicated adapters (Assessment/SIX lanes) |

Do **not** promote Game/Project to Adaptive-ready without an explicit product decision.

---

## F. Direct-entry matrix (2G-78)

| Surface | Entry kind | Evidence when used? |
|---------|------------|---------------------|
| Hub Adaptive CTA / CORE Continue learning / Study Now Continue | Adaptive Learning | Via Adaptive → activity |
| Hub SIX Try it / activity Open / Assignments practice | Direct Activity | If submit/evaluate path used |
| Quiz / Flashcard open | Direct | On submit/review |
| Browse assignments / notes / MasteryTree | Content Management | No |

Direct access preserved. Not forced through Adaptive.

---

## G. Concept association

| Path | Missing conceptId |
|------|-------------------|
| Universal activities API | 400 / reject; no fabricated Concept |
| `applyEvidenceToMastery` | No-op (returns null) |
| Study Evaluate / Flashcard | Require topicId → ensureConcept |
| Quiz | Always resolves via topic or quiz title |
| Lucky | Attempt may write; mastery skipped if no conceptId |
| Tutor | `no_owned_concept` → no write |
| Adaptive start | Requires owned Concept |

---

## H. Security

- Foreign Concept / learner / Attempt / Adaptive run rejected on bind
- Client outcome/score/learnerId stripped on activity submit
- Public Tutor cannot authorize evidence
- Availability never mutates LearningAttempt / ConceptMastery / diagnosis

---

## I. Known gaps (actual)

1. No `PERFORM_GAP` Orchestrator diagnosis despite PERFORM producers (**deferred architecture** — do not invent in coverage phases)
2. Game / Project evidence-closed but not Adaptive-ready (**intentional P2**)
3. Legacy `code-evaluate` TopicMastery-only (parallel to ULE Coding)
4. Quiz/Flashcard/Evaluate still dual-write TopicMastery (chrome coexistence)
5. Foundation helper `activityFoundationStatus()` still reports foundation-era `adaptiveReady: false` — live Adaptive contracts are authoritative (`activity-adaptive-completion.ts`)

**Closed in 2P-23:** Simulation facet inventory understatement (APPLY-only) vs live SOLVE/EXPLAIN challenges — inventory now matches structured + educational-market writers. Writing Adaptive status docs synced to 2P-18 truth.

---

## J. Intentional non-closure

- CORE notes / knowledge / Assist (entry, not evidence writer)  
- Public Tutor conversation  
- Open / launch / browse / Assignments catalog  
- AdaptiveSequenceRun cursor alone  
- Orchestrator diagnose (read-only)  
- MasteryTree Topic progress display  
- Assessment launch/prepare without submit  

---

## Boundaries (must remain)

```text
Launch ≠ Evidence ≠ Completion ≠ Mastery
Availability ≠ evidence
Intent ≠ diagnosis
Assessment ≠ Quiz
Adaptive state ≠ mastery
Lucky state ≠ mastery
TopicMastery ≠ ConceptMastery
SIX remains first-class
CORE → SIX → LUCKY
```

Exactly one: ULE · Learner Model · Knowledge · Evidence · Mastery · Orchestrator · Tutor · Adaptive · Retention.

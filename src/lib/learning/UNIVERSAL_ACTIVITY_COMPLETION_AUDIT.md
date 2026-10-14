# Universal Activity Completion Audit (2P-30)

Audit of existing Universal Activity / Adaptive lifecycle **before** Game/Project Adaptive promotion.

## Executive verdict

| Band | Activities |
| --- | --- |
| **Adaptive-ready (universal bind)** | coding, sql, lab, simulation, presentation, writing |
| **Product-ready, evidence-closed, not Adaptive** (pre-2P-30) | **game**, **project** |
| **Separate Adaptive adapters** | quiz, flashcard, SIX |
| **PERFORM facet** | Produced by coding / sql / lab / presentation (`asPerform` or PERFORM skillFacet) |
| **PERFORM_GAP diagnosis** | **Not present** — intentionally deferred (`orchestratorPerformGap: false`) |

Game and Project already have: structured identity, rubric evaluation, `recordAuthoritativeActivityEvidence`, ConceptMastery updates, ActivityWorkspace UI.  
**Missing for Adaptive (pre-2P-30):** rows in `ACTIVITY_ADAPTIVE_COMPLETION_CONTRACTS`, `adaptiveBindIntegrated: true`, Orchestrator selectability for Game/Project.

---

## Universal lifecycle (existing contract)

```text
resolve → launch → interact* → produce evidence* → completion gate → bind → return
```

| Stage | Meaning | Rule |
| --- | --- | --- |
| Resolve | What activity | Adapter / intervention string |
| Launch | Open experience | **≠ evidence** |
| Interaction | Learner acts | May not evaluate yet |
| Evidence | Meaningful demonstration | `recordAuthoritativeActivityEvidence` → `recordEvidence` → `applyEvidenceToMastery` |
| Completion | Progression requirements met | Server gate; FAIL/PARTIAL may still complete *attempt* |
| Binding | Associate with Adaptive step | Coordinator only |
| Mastery | ConceptMastery update | Evidence path only |
| Retention | Lucky | Downstream of Adaptive run **COMPLETED** |

---

## Canonical matrix (pre-implementation truth)

| Activity | Resolve | Launch | Evidence | Mastery facet | Adaptive | Completion | Abandon | Retention | E2E |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Coding | capability + contract | `/study/activities/coding` | `coding_challenge_submit` | PERFORM | Yes | Evaluated attempt SUCCESS/PARTIAL/FAIL | Leave / run abandon | Run COMPLETED → Lucky | Partial |
| SQL | same | `/study/activities/sql` | `sql_challenge_submit` | PERFORM | Yes | same | same | same | Smoke |
| Lab | same | `/study/activities/lab` | `lab_challenge_submit` | PERFORM | Yes | same | same | same | Primary |
| Simulation | same | `/study/activities/simulation` | `simulation_challenge_submit` | APPLY/SOLVE | Yes | same | same | same | Smoke |
| Presentation | same | `/study/activities/presentation` | `presentation_challenge_submit` | PERFORM | Yes | same | same | same | None |
| Writing | same | `/study/activities/writing` | `writing_challenge_submit` | EXPLAIN | Yes (2P-18) | same + revision gate | same | same | Smoke |
| Quiz | quiz-adapter | quiz taker | `quiz_attempt` | RECOGNIZE | Separate adapter | Quiz attempt gate | Run abandon | Run COMPLETED | None |
| Flashcard | flashcard-adapter | flashcards view | `flashcard_review` | RETAIN | Separate adapter | Review gate | Run abandon | Run COMPLETED | None |
| SIX | six-adapter | `/study/six/...` | `study_evaluate` | Varies | First-class | Pass-gated (≥65) | Run abandon | Run COMPLETED | Smoke |
| Game | capability only | `/study/activities/game` | `game_challenge_submit` | RECOGNIZE | **No** (pre-2P-30) | Activity attempt only | Leave (no Adaptive step) | N/A activity-level | None |
| Project | capability only | `/study/activities/project` | `project_challenge_submit` | APPLY | **No** (pre-2P-30) | Activity attempt only | Leave | N/A | None |

---

## Per-type answers (12 questions)

### Coding / SQL / Lab / Simulation / Presentation / Writing

1. **Resolve:** `ACTIVITY_INTERVENTION_CAPABILITIES` + `ACTIVITY_ADAPTIVE_COMPLETION_CONTRACTS`; `isSupportedUniversalActivityIntervention`.
2. **Launch:** `universalActivityAdaptiveHref` → ActivityWorkspace.
3. **Interact:** textarea / specialty panels → POST `/api/study/activities/[kind]`.
4. **Evidence:** `recordAuthoritativeActivityEvidence` → `recordEvidence` → `applyEvidenceToMastery`.
5. **Facet:** coding/sql/lab/presentation → PERFORM; simulation → APPLY/SOLVE; writing → EXPLAIN.
6. **Completion:** Compatible LearningAttempt with contract sourceRef + facet + SUCCESS|PARTIAL|FAIL.
7. **Abandon:** No submit → no attempt; Adaptive `abandonAdaptiveSequence` → ABANDONED (no Lucky).
8. **Adaptive:** Yes.
9. **Resume:** Adaptive run resume yes; mid-draft not durable.
10. **Return:** `AdaptiveReturnStrip` when bound.
11. **Lucky:** Only after run COMPLETED.
12. **E2E:** Lab primary; others smoke/partial.

### Quiz / Flashcard / SIX

Own adapters (`quiz-adapter`, `flashcard-adapter`, `six-adapter`). Not universal intervention keys. Adaptive-capable via their own bind paths. Lucky only on run COMPLETED.

### Game (pre-2P-30)

1–5. Structured catalog (`game-vocab-match`, `game-network-terms`); evaluateAgainstRubric; RECOGNIZE; points ignored.
6. Evaluated submit creates attempt — **open ≠ complete**.
7–8. No Adaptive contract → bind skips.
9–11. Adaptive N/A; no mid-game resume cursor.
12. No browser E2E.

**Safe Adaptive promotion:** Yes — existing completion = rubric evaluation of learner-authored text; same spine as Lab.

### Project (pre-2P-30)

1–5. Structured catalog (`project-study-plan`, …); APPLY; `learnerAuthored: true` on evidence.
6. Evaluated plan artifact — **open ≠ complete**.
7–8. create_only + no Adaptive contract.
9–11. No Adaptive resume cursor.
12. No browser E2E.

**Safe Adaptive promotion:** Yes — reuse structured evaluation; preserve AI assistance ≠ learner demonstration.

---

## PERFORM audit

| Question | Finding |
| --- | --- |
| Who writes PERFORM? | Coding, SQL, Lab, Presentation (`skillFacet` / `asPerform`) |
| Mastery Engine support? | Yes — ConceptMastery.perform |
| Orchestrator PERFORM_GAP? | **No** — diagnoses remain UNDERSTANDING/APPLICATION/RECALL/RETENTION/INSUFFICIENT/NO_INTERVENTION |
| Need PERFORM_GAP? | **Deferred** — existing APPLICATION_GAP + PERFORM evidence sufficient for now |

Do **not** invent PERFORM_GAP in 2P-30.

---

## Key files

- `activities/execution-contract.ts`, `structured/service.ts`, `server-evaluation.ts`
- `sequence/activity-adaptive-completion.ts`, `activity-adapter.ts`, `adaptive-bind.ts`
- `orchestrator/activity-intervention-capability.ts`, `activity-intervention-policy.ts`
- `decision-loop.ts` (`ADAPTIVE_READY_ACTIVITY_KEYS`, `PRODUCT_READY_NOT_ADAPTIVE_KEYS`)
- `learner-model/producers.ts` (`PERFORM_COVERAGE_LIMITATION`)

---

## 2P-30 smallest additive path

1. Add Game/Project rows to `ACTIVITY_ADAPTIVE_COMPLETION_CONTRACTS`.
2. Flip `adaptiveBindIntegrated` (+ enable Game/Project Orchestrator selectability where legal).
3. Update `ADAPTIVE_READY_ACTIVITY_KEYS`; clear product-only list.
4. Reuse bind / return / material (2P-28) / learner context (2P-29).
5. Tests + E2E Journeys A–F.
6. Document PERFORM_GAP as deferred.

No GameEngine / ProjectEngine / PerformanceEngine / second evidence writer.

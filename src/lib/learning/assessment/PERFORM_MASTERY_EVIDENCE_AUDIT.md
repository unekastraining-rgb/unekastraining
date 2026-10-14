# 2G-56 — PERFORM Mastery & Evidence Gap Audit

**Mode:** Inspection + design only. **No production code changes.**

**Predecessor:** 2G-55 Universal Activity Vertical Integration Audit — PASS (no architectural contradiction).

---

## 1. Verdict

| Question | Answer |
|----------|--------|
| Is PERFORM in the Mastery contract? | **Yes** — first-class facet with persistence and aggregation |
| Does any closed producer emit PERFORM today? | **No** |
| Can Orchestrator diagnose a PERFORM gap? | **No** — under-consumed (reads score in sum only) |
| Does Evidence Intelligence support PERFORM? | **Yes** — facet-agnostic aggregation includes PERFORM |
| Is Hands-on Practice already PERFORM? | **No** — intentionally **APPLY** |
| Is confidence / self-rating PERFORM? | **No** |
| Universal architecture ready for a future PERFORM activity? | **YES, with a small additive activity/evidence bridge** |
| Is a new Mastery / Learner Model / Evidence spine redesign required? | **No** |
| Is a coding/lab/simulation engine required *by this audit*? | **No** — that would be a future *product* activity, not a core gap |

**Overall classification:** Mastery/Evidence/Learner Model = **NO CHANGE REQUIRED**. Closing the learning gap eventually requires a **SMALL ADDITIVE BRIDGE** (activity → `LearningAttempt(PERFORM)`). Building an authentic performance *product* (lab/coding/etc.) would be a **LARGER FUTURE FEATURE** if product chooses it — not because the Universal spine is broken.

---

## 2. Canonical Mastery contract

### Type definitions

| Layer | Location | PERFORM present? |
|-------|----------|------------------|
| TS const | `src/lib/learning/types.ts` → `MASTERY_FACETS` | Yes |
| Prisma enum | `MasteryFacet` | Yes (`PERFORM`) |
| Faceted scores | `FacetedMasteryScores.perform` | Yes (0–1 float) |
| Envelope | `EvidenceEnvelope.skillFacet: MasteryFacetName` | Yes (any facet) |

Canonical facet order:

`RECOGNIZE | EXPLAIN | APPLY | SOLVE | PERFORM | RETAIN`

### Persistence

| Store | Field | Semantics |
|-------|-------|-----------|
| `ConceptMastery` | `perform Float @default(0)` | Canonical ULE facet score |
| `LearningAttempt` | `skillFacet MasteryFacet` | Evidence row may be `PERFORM` |
| `LearningObject` | `skillFacet MasteryFacet @default(RECOGNIZE)` | LO may declare expected facet |

Also: `confidence Float` on `ConceptMastery` and optional `confidence` / `score` on `LearningAttempt` — **separate from** `perform`.

### ConceptMastery representation

```
recognize, explain, apply, solve, perform, retain, confidence
reviewCount, lastReviewedAt, nextReviewAt
@@unique([userId, conceptId])
```

### Aggregation / calculation

- `facetKey("PERFORM")` → `"perform"` (`mastery/facets.ts`)
- `applyFacetDelta` — same SUCCESS/PARTIAL/FAIL/ABANDONED deltas as other facets (`+0.1` / `+0.03` / `-0.06` / `0`); SUCCESS spills lightly into `retain`; updates `confidence` via delta/2
- `applyEvidenceToMastery` upserts whatever `envelope.skillFacet` is — **no PERFORM exclusion**
- Evidence Intelligence `FACETS` array includes `PERFORM` (`evidence/aggregate.ts`)

### Facet naming

| Enum / envelope | ConceptMastery column |
|-----------------|------------------------|
| `PERFORM` | `perform` |

### Score / range semantics

Facet scores clamped to **[0, 1]**. Orchestrator thresholds elsewhere: `WEAK` / `STRONG` (not redesigned here).

### Timestamps / history

- `LearningAttempt.startedAt` / `endedAt` / `createdAt`
- `ConceptMastery.lastReviewedAt` / `nextReviewAt` / `updatedAt`
- History is attempt rows + mastery snapshot — no separate PERFORM history table

### Confidence handling

- Mastery `confidence` is updated by **any** successful facet delta spill — not PERFORM-specific
- Envelope may carry `confidence?: number | null` (e.g. Tutor sets `null`)
- **Confidence ≠ PERFORM**

### Evidence mapping

`EvidenceEnvelope.skillFacet` → `LearningAttempt.skillFacet` → `applyFacetDelta(..., skillFacet, outcome)` → `ConceptMastery.<facetKey>`

PERFORM is fully wired on this path. Production producers simply never set `skillFacet: "PERFORM"`.

**Conclusion:** PERFORM is **not** merely an unused enum label. It has meaningful persistence and aggregation behavior equal to APPLY/SOLVE/RETAIN. What is missing is **production evidence that targets it**.

---

## 3. Evidence → facet matrix

Only **real** LearningAttempt producers (code paths that call `recordEvidence` / bridges). Enum-only LO types without writers are excluded.

| Producer | LearningAttempt? | Evidence sourceRef (typical) | Facet(s) | Outcome / score | Confidence field | PERFORM? |
|----------|------------------|------------------------------|----------|-----------------|------------------|----------|
| **Quiz** | Yes — `quiz-bridge.ts` | `quiz_attempt` | **RECOGNIZE** | Objective (correctness) | unused / N/A | **No** |
| **Flashcard** | Yes — `flashcard-bridge.ts` | `flashcard_review` | **RETAIN** | Self-rating → score/outcome (AGAIN/GOOD/EASY) | N/A as PERFORM | **No** |
| **Study Evaluate / SIX** | Yes — `evaluate-bridge.ts` | `study_evaluate` | Per technique (see §9) | Scored evaluate | N/A | **No** |
| **Tutor** | Yes — `tutor/evidence.ts` (intent-gated) | `tutor_interaction` | EXPLAIN / APPLY / SOLVE | Score or conservative 0.6 PARTIAL | `confidence: null` | **No** |
| **LUCKY / Retention review** | Yes — retention path | retention kinds | **RETAIN** | Review outcome | N/A | **No** |

Study Evaluate facet map (production):

| Mode / SIX component | skillFacet |
|----------------------|------------|
| blurting | RETAIN |
| teach-me | EXPLAIN |
| chunking | RECOGNIZE |
| detailed-explanation | EXPLAIN |
| feynman | EXPLAIN |
| visualization | EXPLAIN *(explicit: not PERFORM)* |
| hands-on-practice | **APPLY** *(explicit: not PERFORM)* |
| active-recall | RETAIN |

**Repo grep:** `skillFacet: "PERFORM"` appears only in **tests** (`mastery/facets.test.ts`, `evidence/aggregate.test.ts`) and type/aggregate lists — **zero production writers**.

---

## 4. Repository definition of PERFORM

### Explicit documentation?

There is **no** dedicated glossary entry, learning guide, or Mastery doc that defines PERFORM in prose.

### Repository signals that *do* exist

1. **Facet slot** in `MASTERY_FACETS` / Prisma / `ConceptMastery.perform`
2. **Negative definitions** in `evaluate-bridge.ts`:
   - Visualization → EXPLAIN, **“not PERFORM”**
   - Hands-on Practice → APPLY, **“not PERFORM without a live lab”**
   - Header: does not claim PERFORM/SOLVE unless the activity demonstrates them
3. **2G-55 audit** noted: “PERFORM — No dedicated closed producer”
4. Reserved LO types (`CODING_CHALLENGE`, `LAB`, `SIMULATION`, …) exist as **enums only** — not evidence that PERFORM is implemented

### Narrowest defensible architectural definition

From those negative claims + facet adjacency (APPLY / SOLVE / PERFORM):

> **PERFORM** is the mastery facet reserved for evidence that the learner **successfully executed a skill/procedure in a live, authentic, or simulated performance context** — beyond textual/guided practice (APPLY) and beyond solving a posed problem in dialogue (SOLVE).

This is **derived**, not a product mandate. The repo refuses to call textual hands-on or visualization PERFORM; it does **not** yet name a concrete producer that *is* PERFORM.

---

## 5. APPLY vs SOLVE vs PERFORM analysis

| Facet | Repo-backed meaning | Evidence today |
|-------|---------------------|----------------|
| **APPLY** | Guided/structured application of a concept (textual hands-on; Tutor `apply` / `practice_answer` / `guided_task`) | SIX hands-on; Tutor |
| **SOLVE** | Problem-solving demonstration under Tutor `solve` intent | Tutor only |
| **PERFORM** | Reserved; implied “live lab” / authentic execution (evaluate-bridge comments) | **None closed** |

Hard invariants for this audit:

- **APPLY ≠ PERFORM** — Hands-on Practice is APPLY by design
- **SOLVE ≠ PERFORM** — Tutor solve does not claim PERFORM
- **PERFORM ≠ confidence**
- **PERFORM ≠ self-rating** (Flashcard ratings → RETAIN)

Do **not** relabel Hands-on as PERFORM without an explicit product/architecture change (out of scope).

---

## 6. Orchestrator audit

| Check | Result |
|-------|--------|
| `ConceptMastery.perform` read via summary facets? | **Yes** — `effectiveFacetsForOrchestration` exposes `facets.perform` |
| Included in `facetSignal` sum? | **Yes** (insufficiency gate) |
| Dedicated PERFORM-gap diagnosis? | **No** — diagnoses are UNDERSTANDING / APPLICATION / RECALL / RETENTION / INSUFFICIENT / NO_INTERVENTION |
| `APPLICATION_GAP` uses `facets.apply` only? | **Yes** — not `perform` |
| Intervention for APPLY gap? | hands-on-practice (SIX) |
| Intent preference vs PERFORM? | Intent soft-prefs SIX within legal set; **no PERFORM facet rule** |
| Prerequisites? | Average of recognize+explain+apply+retain — **ignores solve & perform** |
| TopicMastery fallback | Sets `perform: 0` always |

**Precise state:** PERFORM exists in Mastery and is **under-produced and under-consumed**. Orchestrator will not route on a PERFORM gap today. That is acceptable until a producer exists; adding `PERFORM_GAP` without evidence would be premature.

---

## 7. Evidence Intelligence audit

| Pipeline step | PERFORM support |
|---------------|-----------------|
| `LearningAttempt` with `skillFacet: PERFORM` | Schema allows |
| `aggregateEvidenceSignals` / `facetOutcomes.PERFORM` | Included in `FACETS` — no exclusion |
| Success / partial / fail / abandoned | Facet-agnostic |
| Repeated failure | Facet-agnostic |
| Recent attempts / timestamps / volume | Facet-agnostic |
| Misconception signals / sourceRef | Carried on attempt; not facet-filtered |
| Source counts (`quiz` / `flashcard` / `study_evaluate` / `other`) | Kind-based, not facet-based — PERFORM attempts would land in whatever source kind the producer uses (likely `other` unless a new kind is added later) |

**No facet-specific assumption accidentally drops PERFORM** from aggregation. Empty PERFORM aggregates today are a **data** gap, not an Intelligence bug.

---

## 8. Existing candidate activity audit

| Candidate | Real system? | Learner performs task? | Objective evaluation? | Evidence quality | Could legitimately produce PERFORM *today*? |
|-----------|--------------|------------------------|----------------------|------------------|-----------------------------------------------|
| SIX Hands-on Practice | **Yes** | Textual practice response | Study Evaluate scoring | Real APPLY evidence | **No** — mapped to APPLY; comments forbid PERFORM without live lab |
| Coding challenge | Enum / test stubs only | No production engine | N/A | None | **No** |
| SQL challenge | Enum / stubs | No | N/A | None | **No** |
| Lab | Enum only | No | N/A | None | **No** |
| Simulation | Enum only | No | N/A | None | **No** |
| Presentation | Enum only | No | N/A | None | **No** |
| Writing exercise | Enum only | No | N/A | None | **No** |
| Game | Enum only | No | N/A | None | **No** |
| Tutor guided/practice | **Yes** | Chat demonstration | Optional score; often conservative PARTIAL | EXPLAIN/APPLY/SOLVE | **No** — no PERFORM intent mapping |
| Quiz | **Yes** | Select answers | Objective | RECOGNIZE | **No** — ASSESS ≠ PERFORM; Quiz ≠ PERFORM |
| Flashcard | **Yes** | Self-rate recall | Self-reported | RETAIN | **No** |

**Final conclusions use only real systems.** None currently produce PERFORM.

---

## 9. SIX Hands-on Practice analysis

Implementation: `mapStudyEvaluateToLearningSignals` → `HANDS_ON_PRACTICE` + `skillFacet: "APPLY"` + `sixTechnique: "hands_on_practice"`.

Comment in source:

> Textual practice response — APPLY (not PERFORM without a live lab).

| Question | Answer |
|----------|--------|
| Produces APPLY? | **Yes** |
| Produces SOLVE? | **No** |
| Produces PERFORM? | **No** |
| Meaningful evidence? | **Yes** — scored Study Evaluate → LearningAttempt → ConceptMastery.apply |
| Relabel as PERFORM? | **Must not** without explicit redesign — semantics are intentionally APPLY-oriented |

Hands-on Practice can remain the Orchestrator response to **APPLICATION_GAP**. It does not fill the PERFORM facet.

---

## 10. Objective vs self-reported evidence analysis

| Kind | Example in repo | Facet | Notes |
|------|-----------------|-------|-------|
| Objective / scored | Quiz correctness; Study Evaluate score ratio | RECOGNIZE / EXPLAIN / APPLY / RETAIN | Demonstrated against criteria |
| Self-reported rating | Flashcard AGAIN/GOOD/EASY | **RETAIN** | Self-rating of recall — **not** PERFORM |
| Conservative demonstration | Tutor without score → ~0.6 PARTIAL | EXPLAIN/APPLY/SOLVE | Demonstration happened; quality unknown |
| Mastery confidence | Updated by facet deltas | `ConceptMastery.confidence` | Meta-signal — **≠ PERFORM** |

Current behavior does **not** treat confidence or self-rating as PERFORM. Keep that invariant.

---

## 11. Universal Activity implications

A legitimate future PERFORM producer would need:

```
Activity Identity → Resolve → Prepare → Launch
  → Learner performs task
  → Objective / structured evaluation
  → EvidenceEnvelope { skillFacet: PERFORM }
  → LearningAttempt → ConceptMastery.perform
  → (optional) Adaptive completion bind → re-orchestration
```

| Piece | Already generic? | Activity-specific? |
|-------|------------------|--------------------|
| LO + EvidenceEnvelope + LearningAttempt | **Yes** | Payload / scoring |
| `applyEvidenceToMastery` | **Yes** | Facet choice = PERFORM |
| Assessment Adapter resolve/prepare/launch | **Yes** (pattern) | New adapter only if Assessment path |
| Adaptive bind by attemptId | **Yes** (score-agnostic) | Step intervention family |
| Authentic task runtime (lab/code/etc.) | **No** | Entire product surface |

**Universal core does not need redesign** for PERFORM evidence to flow. The missing piece is an activity that (a) evaluates performance and (b) writes `skillFacet: "PERFORM"`.

---

## 12. Assessment implications

| Claim | Status |
|-------|--------|
| ASSESS = PERFORM | **False** |
| PERFORM = Quiz | **False** |
| Assessment modes | `DIAGNOSTIC` / `VERIFICATION` / `PRACTICE_CHECK` only — no PERFORM mode |
| Could Assessment Activity eventually evaluate performance? | **Yes in principle** — mode policy is diagnosis-driven; a future adapter could emit PERFORM evidence after launch without renaming ASSESS |
| AssessmentPlan changes required now? | **No** — no producer to attach |

Do not add a new assessment mode or adapter in this phase.

---

## 13. Adaptive implications

Coordinator completion binds on **LearningAttempt id** (and related soft-fail rules) — not on Quiz/SIX/Flashcard facet identity for mastery math.

| Check | Result |
|-------|--------|
| Facet-agnostic completion? | **Yes** enough — attempt existence / bind, not facet switch |
| Safeguards tied to Quiz/SIX/Flashcard? | Adapters are activity-specific; coordinator contract is generic evidence/completion |
| Future PERFORM activity in AdaptiveSequenceRun? | **Feasible** via same bridge pattern as Quiz/Flashcard once an intervention + attempt exists |

No Adaptive coordinator change required for readiness.

---

## 14. Intent implications

Intents: `UNDERSTAND | PRACTICE | ASSESS | CREATE` — **not** facets.

| Question | Answer |
|----------|--------|
| Is PERFORM an intent? | **No** — it is an **evidence/mastery facet** |
| Can PRACTICE lead to PERFORM evidence? | Soft-prefer Hands-on under APPLICATION_GAP today → **APPLY**. Future PRACTICE could launch a PERFORM activity without a new intent |
| Can ASSESS evaluate PERFORM? | Possible via Assessment workflow + future adapter; ASSESS ≠ Quiz ≠ PERFORM |
| Does CREATE produce PERFORM? | No producer today; CREATE remains context-only for Orchestrator soft-pref |

Do not add a PERFORM intent.

---

## 15. Learner Model implications

| Need | Sufficient? |
|------|-------------|
| `concept mastery → PERFORM` | **Yes** — `ConceptMastery.perform` |
| `LearningAttempt → ConceptMastery` | **Yes** — canonical path |
| Separate PerformanceProfile / SkillPerformance / PerformanceAttempt? | **Not required** — would duplicate the evidence spine |

No new schema or Performance* model is justified by this audit.

---

## 16. Universal architecture readiness

### Answer: **YES, with a small additive activity/evidence bridge**

| Subsystem | Ready? |
|-----------|--------|
| Learner Model / ConceptMastery | Yes |
| Mastery contract / facet math | Yes |
| Evidence spine (Envelope → Attempt → Mastery) | Yes |
| Evidence Intelligence aggregation | Yes |
| Orchestrator diagnosis of PERFORM gap | Not yet — optional later consumer |
| Adaptive coordinator | Yes (generic bind) |
| Assessment workflow pattern | Yes (no PERFORM adapter yet) |

Support: production code already applies arbitrary `skillFacet` including PERFORM; aggregate tests cover PERFORM; evaluate-bridge deliberately withholds PERFORM from textual activities; 2G-55 confirmed one Universal spine.

A future authentic lab/coding *product* is orthogonal — that is activity product work, not a ULE core redesign.

---

## 17. Final classifications

| Area | Classification |
|------|----------------|
| Mastery facet + ConceptMastery.perform + apply math | **NO CHANGE REQUIRED** |
| Evidence Intelligence aggregation of PERFORM | **NO CHANGE REQUIRED** |
| LearningAttempt as evidence spine | **NO CHANGE REQUIRED** |
| Hands-on Practice = APPLY (not PERFORM) | **INTENTIONALLY DIFFERENT** |
| Tutor = interaction; EXPLAIN/APPLY/SOLVE only | **INTENTIONALLY DIFFERENT** |
| Quiz / Flashcard facets | **INTENTIONALLY DIFFERENT** (RECOGNIZE / RETAIN) |
| Closed PERFORM evidence producer | **SMALL ADDITIVE BRIDGE REQUIRED** (when product wants it) |
| Orchestrator PERFORM-gap diagnosis / intervention | **SMALL ADDITIVE BRIDGE** (optional; only after producer exists) |
| Authentic coding / SQL / lab / sim / presentation engines | **LARGER FUTURE FEATURE** (product choice — not forced by Mastery contract) |
| New PerformanceProfile / PerformanceAttempt / new Mastery facet | **NO CHANGE REQUIRED** — do not build |

Do **not** treat “future activity does not exist” as proof that Universal architecture failed.

---

## 18. Recommended next action

1. **Do not** implement coding/lab/simulation/presentation engines in the next phase solely to fill PERFORM.
2. **Do not** relabel Hands-on Practice as PERFORM.
3. **Do not** add Orchestrator `PERFORM_GAP` until at least one real producer exists.
4. Product decision (later): whether any existing or new activity should emit `LearningAttempt(PERFORM)` under the derived definition (live/authentic/simulated execution with objective evaluation).
5. If yes: implement a **thin evidence bridge** on that activity only — reuse Envelope → Attempt → ConceptMastery → optional Adaptive bind.
6. If no: leave PERFORM as a **reserved, ready facet** — under-produced/under-consumed is an acceptable interim state.

Suggested follow-on (design only, if needed): product brief for “what counts as PERFORM evidence” — still no engine build until chosen.

---

## 19. Verification results

Inspection/design only. No production code modified.

| Check | Result |
|-------|--------|
| `perform-mastery-evidence.design.test.ts` | **6/6 passed** |
| `src/lib/learning` vitest | **72 files / 758 tests passed** |
| eslint (design test) | **clean** (md audit ignored by eslint config — expected) |
| `tsc --noEmit` | **3 pre-existing errors only** (baseline) |

Pre-existing TypeScript baseline (unrelated to 2G-56):

- `src/lib/core/notebook-desk.ts`
- `src/lib/quizzes/generate-offline-fallback.integration.test.ts`
- `src/lib/study/resolve-loop-focus-topic.ts`

Distinction:

| Category | Items |
|----------|-------|
| **2G-56 findings** | PERFORM under-produced/under-consumed; Hands-on=APPLY; architecture ready with small activity bridge |
| **Pre-existing failures** | 3 `tsc` errors above |
| **Unrelated** | Tutor context test stderr noise (`db down` mock) — tests still pass |

---

## 20. Risks / unknowns

| Risk / unknown | Notes |
|----------------|-------|
| Derived PERFORM definition | Narrowest from comments (“live lab”); not a ratified product glossary |
| SOLVE under-produced outside Tutor | Related but out of scope; do not conflate with PERFORM |
| Source-count buckets | PERFORM attempts would likely count as `other` unless a producer defines a source kind |
| Orchestrator under-consumption | High perform + low apply still yields APPLICATION_GAP; reverse (high apply, zero perform) never surfaces |
| Temptation to invent engines | Resist — enum LO types ≠ real systems |
| Dual TopicMastery | Legacy; fallback zeros perform — do not invent TopicMastery.perform |

---

## Hard invariants (confirmed held)

- One Universal Learning Engine / Learner Model / Knowledge Model / LO+Evidence spine / LearningAttempt / Mastery / Orchestrator / Adaptive coordinator / LUCKY path
- CORE → SIX → LUCKY
- Evidence ≠ completion; Completion ≠ progression; Launch ≠ completion
- APPLY ≠ PERFORM; SOLVE ≠ PERFORM; PERFORM ≠ confidence; PERFORM ≠ self-rating
- ASSESS ≠ Quiz; PERFORM ≠ Quiz
- Hands-on retains APPLY semantics
- Tutor remains interaction/evidence; CORE remains document/knowledge host
- Orchestrator does not own concrete activity IDs
- No PerformanceAttempt / PerformanceProfile / new Mastery facet / new schema / new product subsystem in this phase
- No production changes in 2G-56

---

*Phase 2G-56 — PERFORM Mastery & Evidence Gap Audit. Inspection complete.*

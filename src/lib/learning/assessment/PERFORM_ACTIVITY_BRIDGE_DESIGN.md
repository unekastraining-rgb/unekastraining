# 2G-57 — PERFORM Activity/Evidence Bridge Contract Design

**Mode:** Design / inspection only. **No production implementation.**

**Predecessor:** [2G-56 PERFORM Mastery & Evidence Gap Audit](./PERFORM_MASTERY_EVIDENCE_AUDIT.md) — PASS; Universal spine ready; no closed PERFORM producer; Hands-on = APPLY.

---

## 1. Executive Summary

The Universal Learning Engine already has everything required to **store, aggregate, and master** PERFORM evidence:

| Layer | Status |
|-------|--------|
| `MasteryFacet.PERFORM` / `ConceptMastery.perform` | Ready |
| `LearningAttempt.skillFacet` | Ready |
| `EvidenceEnvelope` | Ready |
| `applyEvidenceToMastery` | Ready (facet-agnostic) |
| Evidence Intelligence aggregation | Ready (includes PERFORM) |
| Reserved `LearningObjectType` values | Present (domain-agnostic slots) |
| Assessment Adapter + Adaptive coordinator patterns | Ready as lifecycle templates |

What does **not** exist is a production activity that evaluates an **observable performance criterion** and writes `LearningAttempt(skillFacet = PERFORM)`.

**Recommended architecture: Option B — Small additive bridge.**

Core contracts need **no schema or Mastery/Intelligence changes**. When a real performance activity ships, follow the established Quiz/Flashcard/SIX/Tutor pattern: an activity-local evidence helper that builds a valid `EvidenceEnvelope` with `skillFacet: "PERFORM"`, then `recordEvidence` → `applyEvidenceToMastery`. Optional Assessment/Adaptive adapters come later and must not write evidence themselves.

Do **not** implement PERFORM_GAP, relabel Hands-on Practice, or build any domain engine in this phase.

---

## 2. Current Contract Inventory

### Learning Object

| Field / concern | Contract | PERFORM-ready? |
|-----------------|----------|----------------|
| `LearningObjectType` | Includes reserved: `CODING_CHALLENGE`, `SQL_CHALLENGE`, `SIMULATION`, `GAME`, `WRITING_EXERCISE`, `PROJECT_TASK`, `PRESENTATION_PRACTICE`, `LAB`, plus `OTHER` | Yes — pick an existing type or `OTHER`; **enum ≠ implementation** |
| `skillFacet` | `MasteryFacet` including PERFORM | Yes — LO may declare `skillFacet: PERFORM` |
| Activity identity | `payloadRefJson` opaque `{ kind, id, ... }` | Yes — activity-owned refs |
| Ownership | `userId` on LO | Yes |
| Concept association | `conceptIdsJson` | Yes — required for mastery linkage |
| Success criteria | `successCriteriaJson` opaque | Yes — activity may store criterion metadata without schema change |
| Expected evidence | `expectedEvidenceJson` opaque | Yes |

`ensureLearningObject` already accepts arbitrary `type`, `skillFacet`, `payloadRef`, `successCriteria`, `expectedEvidence`.

### LearningAttempt

| Field | Required for PERFORM? | Notes |
|-------|----------------------|-------|
| `id` | System | Attempt identity for Adaptive bind |
| `userId` | Yes | Ownership |
| `learningObjectId` | Yes | Spine link |
| `conceptId` | **Yes for mastery** | Null ⇒ no `ConceptMastery` update |
| `skillFacet` | **`PERFORM`** | Canonical facet claim |
| `outcome` | Yes | SUCCESS / PARTIAL / FAIL / ABANDONED |
| `score` | Optional | 0–1 objective criterion ratio preferred |
| `confidence` | Optional | **Must not** be the PERFORM signal |
| `misconceptionSignalsJson` | Optional | Opaque strings |
| `sourceRefJson` | Yes | Producer kind + correlation ids |
| `evidencePayloadJson` | Optional | Opaque activity detail |
| `startedAt` / `endedAt` | Yes | Duration / ordering |

**Verdict:** Existing Attempt model is sufficient. **No new fields. No PerformanceAttempt table.**

### EvidenceEnvelope

Maps 1:1 into Attempt via `recordEvidence`. See §7.

### Mastery / Evidence Intelligence / Orchestrator

Confirmed in 2G-56: PERFORM persists and aggregates; Orchestrator under-consumes (no PERFORM_GAP) — intentional until evidence exists.

### Universal activity lifecycle (existing patterns)

| Stage | Assessment | Adaptive |
|-------|------------|----------|
| Resolve | `AssessmentAdapter.resolve` | Step intervention + launch context |
| Prepare | Optional `adapter.prepare` (opaque refs) | Adapter-specific |
| Launch | Consumer / UI | Adapter href + run/step |
| Evidence | **Producer bridges only** (Quiz/Flashcard/SIX/Tutor) | Same — adapters do not write Attempt |
| Completion bind | N/A | `recordAdaptiveSequenceCompletion` by `attemptId` |
| Soft-fail | — | Bind failures keep evidence; step may wait |

---

## 3. Future Performance Activity Boundary

A **performance activity** (future product) is any learner-facing task that:

1. Has an **observable performance criterion** defined by that activity (not by ULE core), and  
2. Produces an **objective evaluation result** (system, rubric scorer, or structured check — not mere self-feeling), and  
3. Emits evidence through the **existing** Envelope → LearningAttempt → ConceptMastery path with `skillFacet: "PERFORM"`.

**Out of boundary for this design:**

- What the activity *is* (coding, lab, presentation, clinical, physical, etc.)
- How the criterion is authored
- UI / engines / evaluators

**In boundary:**

- How objective results map onto existing evidence fields
- How Assessment / Adaptive / Intent may *consume* that activity later without a second spine

Conceptual flow (not implemented):

```
Learning Object (type + skillFacet=PERFORM + payloadRef)
        ↓
Performance Activity Adapter (future, activity-specific)
        ↓
Activity runtime (future product)
        ↓
Learner performs task
        ↓
Objective evaluation against activity criterion
        ↓
EvidenceEnvelope { skillFacet: PERFORM, outcome, score?, … }
        ↓
LearningAttempt → ConceptMastery.perform
        ↓
Evidence Intelligence (existing)
        ↓
Future Orchestrator consumption (only after real evidence exists)
```

---

## 4. APPLY vs SOLVE vs PERFORM

| Facet | Minimum distinction (contract-level) | Current producers |
|-------|--------------------------------------|-------------------|
| **APPLY** | Demonstrating application of knowledge in a guided/structured practice context | SIX Hands-on → APPLY; Tutor apply/practice |
| **SOLVE** | Successfully solving a posed problem | Tutor `solve` intent |
| **PERFORM** | Objectively demonstrating a **performance capability** against an **observable performance criterion** in the activity’s own evaluation context | **None** |

Rules:

- Textual SIX Hands-on remains **APPLY** — do not relabel.
- Self-rating (Flashcard) remains **RETAIN** — never PERFORM.
- Envelope `confidence` / mastery `confidence` are **meta** — never a substitute for PERFORM.
- Domain choice (coding vs lab vs other) is **not** part of the facet definition.

---

## 5. Minimum Objective Evidence Contract

A LearningAttempt may claim PERFORM **only if all** of the following hold:

1. **`skillFacet === "PERFORM"`**
2. **`conceptId` present** (else mastery cannot update)
3. **`outcome` derived from objective evaluation** of an activity-defined performance criterion  
   - Allowed: SUCCESS / PARTIAL / FAIL / ABANDONED  
   - **Disallowed as sole basis:** learner self-statement of ability, confidence slider alone, “I completed the page”
4. **`sourceRef.kind`** identifies the performance producer (opaque string; activity-owned)
5. **Completion of UX ≠ evidence** — launch/complete flags do not create PERFORM attempts

### Recommended opaque payload conventions (no schema change)

`evidencePayload` **may** include (all optional, activity-defined):

| Key (suggested) | Purpose |
|-----------------|--------|
| `criterionRef` | Opaque id/label of the performance criterion |
| `evaluationMethod` | e.g. `"automated"` \| `"structured_check"` \| `"rubric_score"` — descriptive only |
| `observedResult` | Compact machine-readable result summary |
| `activitySessionId` | Correlation within the activity runtime |

`sourceRef` **should** include:

| Key | Purpose |
|-----|--------|
| `kind` | Stable producer kind (e.g. future `"performance_attempt"`) |
| Activity identity fields | Opaque ids matching LO `payloadRef` |

**Existing `evidencePayloadJson` and `sourceRefJson` are sufficient.** Do not add Attempt columns.

### Explicit non-equivalence

| Signal | Is PERFORM evidence? |
|--------|----------------------|
| Objective criterion pass/fail/partial | **Yes** (with skillFacet PERFORM) |
| Self-reported confidence | **No** |
| Flashcard self-rating | **No** |
| Adaptive step completion | **No** (completion ≠ evidence) |
| Assessment mode alone | **No** |

---

## 6. LearningAttempt Mapping

| Envelope field | Attempt field | PERFORM guidance |
|----------------|---------------|------------------|
| `learnerId` | `userId` | Owner |
| `learningObjectId` | `learningObjectId` | LO with intended PERFORM facet preferred |
| `conceptId` | `conceptId` | Required for mastery |
| `skillFacet: "PERFORM"` | `skillFacet` | Required claim |
| `outcome` | `outcome` | From objective evaluation |
| `score` | `score` | Optional 0–1 criterion ratio |
| `confidence` | `confidence` | Prefer `null` unless activity has a separate confidence instrument; **never** replace outcome |
| `misconceptionSignals` | JSON | Optional |
| `sourceRef` | JSON | Required correlation |
| `evidencePayload` | JSON | Opaque criterion detail |
| `startedAt` / `endedAt` | timestamps | Performance window |

**LearningAttempt requires no production changes** for PERFORM to work.

---

## 7. EvidenceEnvelope Mapping

Future performance producer should call the same path as Quiz/Flashcard:

```
buildEvidenceEnvelope({ … skillFacet: "PERFORM", … })
  → recordEvidence(envelope)
  → applyEvidenceToMastery(envelope)
```

Distinguish in the envelope:

| Concern | Field |
|---------|--------|
| Objective demonstrated performance | `skillFacet=PERFORM` + `outcome` (+ optional `score`) |
| Self-reported confidence | `confidence` only (optional meta) |
| Self-rating | Do not use PERFORM; use other facets (e.g. RETAIN) |
| Completion status | **Not** an Envelope field — Adaptive/history concern |
| Evaluator / rubric result | Opaque `evidencePayload` |
| Activity metadata | `sourceRef` + LO `payloadRef` |

---

## 8. Mastery Mapping

```
LearningAttempt(skillFacet=PERFORM, outcome, conceptId)
  → applyEvidenceToMastery
  → ConceptMastery.perform  (± retain spill on SUCCESS; confidence meta update)
```

| Change needed now? | Answer |
|--------------------|--------|
| New facet | **No** |
| New math | **No** |
| New table | **No** |
| Production code | **NO CHANGE REQUIRED** |

---

## 9. Evidence Intelligence Mapping

`aggregateEvidenceSignals` already tracks `facetOutcomes.PERFORM`.

| Change needed? | Answer |
|----------------|--------|
| PERFORM-specific aggregation | **No** — facet-agnostic |
| Source kind | Attempts land in existing buckets by `sourceRef.kind` classification (`quiz` / `flashcard` / `study_evaluate` / `other`). A future producer will typically count as **`other`** unless classification is extended later (optional, not required for correctness). |

**Evidence Intelligence: NO CHANGE REQUIRED** for the bridge contract.

---

## 10. Assessment Mapping

Existing modes: `DIAGNOSTIC` | `VERIFICATION` | `PRACTICE_CHECK`.

| Mode | Meaning for a future PERFORM activity |
|------|----------------------------------------|
| **PRACTICE_CHECK** | Practicing performance — formative criterion checks |
| **DIAGNOSTIC** | Diagnosing performance weakness — discover gaps |
| **VERIFICATION** | Verifying performance — stronger confirmation when intent/source warrant |

Distinctions:

- **Not every performance activity is an Assessment.** Standalone practice may write PERFORM evidence without AssessmentPlan.
- **ASSESS intent ≠ Quiz ≠ PERFORM.** Mode policy stays diagnosis/intent-source driven; a future adapter may claim modes when product needs it.
- Do **not** add a fourth “PERFORM” assessment mode.

| Assessment changes now? | **None** |

---

## 11. Adaptive Sequence Mapping

Coordinator already:

- Binds completion by **existing** `attemptId`
- Enforces ownership, concept match, optional LO match
- Treats duplicate `attemptId` as **idempotent**
- Rejects second different attempt on same step (`STALE_STEP`)
- Does **not** gate completion on score (Quiz/Flashcard pattern: evidence existence, not grade)

Future PERFORM Adaptive step would:

1. Plan intervention family for that activity (activity-specific; not Orchestrator-owned concrete ids)
2. Launch with run/step context
3. Activity writes PERFORM LearningAttempt
4. Bind helper → `recordAdaptiveSequenceCompletion` (+ plan next)
5. Soft-fail bind: keep evidence if bind fails

| Adaptive changes now? | **None** (no adapter in this phase) |

---

## 12. Intent Mapping

Intents remain: `UNDERSTAND` | `PRACTICE` | `ASSESS` | `CREATE`.

| Intent | Relationship to PERFORM |
|--------|-------------------------|
| UNDERSTAND | Unlikely primary path to PERFORM evidence |
| PRACTICE | Natural host for formative performance practice → PERFORM attempts |
| ASSESS | May verify/diagnose via Assessment workflow + future adapter |
| CREATE | Separate concern; not assumed to emit PERFORM |

**PERFORM is a mastery facet, not an intent.** No new intent. No intent contract change.

---

## 13. Orchestrator Preconditions

**Do not implement PERFORM_GAP in this phase.**

Before any future policy may safely reason about PERFORM:

1. At least one production producer emits concept-linked `LearningAttempt` with `skillFacet: PERFORM`.
2. Evidence volume is non-trivial for the concept (Intelligence already exposes attempt counts / facet outcomes — use those signals; **do not invent numeric thresholds here**).
3. Diagnosis remains **downstream** of real PERFORM evidence — never invent PERFORM weakness from APPLY-only or confidence-only data.
4. Hands-on / APPLICATION_GAP paths remain APPLY-oriented until product explicitly changes them.

TopicMastery fallback currently zeros `perform` — future policy must not treat fallback zeros as a diagnosed PERFORM gap.

---

## 14. Correlation / Idempotency Requirements

| Concern | Existing mechanism | PERFORM guidance |
|---------|-------------------|------------------|
| Attempt identity | `LearningAttempt.id` | Bind Adaptive on this id |
| Activity session correlation | `sourceRef` + `evidencePayload` | Activity-owned opaque ids |
| LO identity | `payloadRefJson` uniqueness in `ensureLearningObject` | Stable refs per activity instance |
| Duplicate Adaptive completion | Same `attemptId` → idempotent | Reuse pattern |
| Retry | New Attempt per evaluation; new bind only if step incomplete | Do not mutate prior Attempt as “completion rewrite” |
| Soft-fail | Evidence kept if bind fails | Preserve for PERFORM binds |
| Evidence ≠ completion | Attempt write independent of run history | Keep |

No new correlation table.

---

## 15. Architecture Options A / B / C

| Option | Meaning | Fit? |
|--------|---------|------|
| **A** | Existing contracts sufficient; activity emits `skillFacet=PERFORM` directly | **True for spine** — Mastery/Attempt/Envelope/Intelligence need no change |
| **B** | Same as A, plus a **small additive** evidence helper / future adapter to standardize objective → Envelope mapping | **Best fit** — matches Quiz/Flashcard/SIX/Tutor bridge pattern |
| **C** | Larger redesign | **Rejected** — no concrete blocker; missing engines ≠ spine failure |

---

## 16. Recommended Option

### **Option B — Small additive bridge**

When a real performance activity is chosen:

1. Ensure LO with appropriate `LearningObjectType` + `skillFacet: PERFORM` + opaque `payloadRef`.
2. Add an activity-local **evidence helper** (pattern: `quiz-bridge` / `flashcard-bridge`) that:
   - Accepts objective evaluation result
   - Builds `EvidenceEnvelope` with `skillFacet: "PERFORM"`
   - Calls `recordEvidence` + `applyEvidenceToMastery`
3. Optionally later: Assessment Adapter (resolve/prepare/launch) and/or Adaptive bind helper — **adapters still do not write evidence**.
4. Only after (1–2) exist in production: consider Orchestrator PERFORM consumption.

Option B does **not** require schema, Mastery math, Intelligence, diagnose.ts, or Hands-on relabeling.

---

## 17. Required Production Changes — if any

| Area | This phase (2G-57) | When product activity ships |
|------|--------------------|------------------------------|
| LearningAttempt | **None** | None (use existing) |
| ConceptMastery / facet math | **None** | None |
| Evidence Intelligence | **None** | Optional source-kind labeling only |
| Orchestrator / diagnose | **None** | Optional later PERFORM policy |
| Assessment modes | **None** | Optional adapter registration |
| Adaptive coordinator | **None** | Optional activity adapter + bind |
| Prisma / new models | **None** | **Forbidden** unless unforeseen blocker |
| Docs / design tests | **This report + design tests only** | — |

**2G-57 production code changes: none.**

---

## 18. Explicit Non-Goals

- No PERFORM-specific Prisma model  
- No new Mastery facet  
- No PERFORM_GAP / diagnose.ts changes  
- No Mastery math changes  
- No Hands-on Practice relabel  
- No coding / lab / simulation / presentation / game / physical / clinical engines  
- No generic evaluator product or rubric system  
- No new production APIs / UI  
- No new activity adapter implementation  
- No AdaptiveSequenceRun / LUCKY / CORE / SIX / Tutor / Quiz / Flashcard behavior changes  

---

## 19. Risks / Open Questions

| Item | Notes |
|------|-------|
| Criterion authorship | Left to future activity product — not ULE core |
| Source-count bucket | PERFORM may appear as `other` until kind classification extended |
| Premature PERFORM_GAP | Risk of false gaps from zero perform — wait for producers |
| Over-claiming PERFORM | Activities must not set PERFORM without objective criterion evaluation |
| Domain pressure | Resist hard-coding coding/lab into the contract |
| Dual TopicMastery | Fallback zeros perform — do not diagnose from fallback alone |

---

## 20. Final Verdict

| Decision | Result |
|----------|--------|
| Option | **B — Small additive bridge** |
| Spine readiness | **Ready now** |
| Minimum PERFORM evidence | Objective criterion → `EvidenceEnvelope` with `skillFacet: "PERFORM"` + outcome (+ optional score); opaque `sourceRef` / `evidencePayload`; concept-linked |
| LearningAttempt changes | **None** |
| Mastery changes | **None** |
| Evidence Intelligence changes | **None** |
| Orchestrator changes now | **None** (preconditions documented only) |
| Assessment / Adaptive changes now | **None** |
| Production implementation this phase | **None** |

**2G-57 status: PASS** (design/inspection complete; hard invariants preserved).

---

*Phase 2G-57 — PERFORM Activity/Evidence Bridge Contract Design.*

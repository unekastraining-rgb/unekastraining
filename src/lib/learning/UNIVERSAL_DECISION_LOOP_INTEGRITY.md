# 2G-80 — Universal Learning Decision Loop Integrity

**Mode:** Audit-first integration and hardening. No second Learner Model, mastery system, or Orchestrator.

**Predecessor:** [2G-79 Learner Model Truth](./LEARNER_MODEL_TRUTH_AND_STATE.md)

---

## Objective

```text
Learner → Concept → Activity → Evidence → LearningAttempt → ConceptMastery
→ Learner Model → Orchestrator Diagnosis → Intervention → Next Activity → Evidence
```

Learning must change canonical learner state, and that changed state must change what Study Haul recommends next.

---

## Canonical decision pipeline

```text
Canonical learner state (ConceptMastery + evidence)
+ Learning Decision Context
+ Intent (soft)
↓
Diagnosis (evidence/mastery authored)
↓
Legal intervention set (SIX catalog)
↓
Intent preference (soft, within legal set)
↓
Activity capability → compatibility → availability → ranking
↓
Activity (Adaptive-ready) OR SIX baseline
↓
Evidence → Mastery → re-orchestrate (fresh read)
```

Contract helpers: `src/lib/learning/decision-loop.ts`

---

## Decision inputs

| Input | Source | Authority |
|-------|--------|-----------|
| Mastery | `ConceptMastery` via `getLearnerConceptMastery` | Canonical ULE |
| Evidence signals | `LearningAttempt` aggregation (flag-gated) | Enrichment only — not mastery |
| Decision context | Concept / LearningSpace subjectDomain, Topic route | Selection metadata |
| Intent | Explicit learner purpose | Soft preference only |
| Activity availability | Capability registry + compatibility | Downstream of diagnosis |

`projectLearnerConceptState` is a learner-facing / tooling projection. **Orchestrator does not consume it.**

---

## Diagnosis boundary

Preserved diagnoses:

- UNDERSTANDING_GAP
- APPLICATION_GAP
- RECALL_GAP
- RETENTION_GAP
- INSUFFICIENT_EVIDENCE
- NO_INTERVENTION

Rules:

- Diagnosis reads ConceptMastery (TopicMastery only as LOW-confidence empty-ULE fallback).
- Intent cannot rewrite diagnosis.
- Activity availability cannot manufacture diagnosis.
- Quiz is never in the SIX intervention catalog.

---

## Intent boundary

| Purpose | Effect |
|---------|--------|
| UNDERSTAND / PRACTICE | Soft SIX preference among legal candidates |
| ASSESS | Assessment workflow handoff metadata only |
| CREATE | Creation handoff — does not alter diagnosis |

Intent must not force activities, mint evidence, or bypass understanding interventions when locked.

---

## Activity capability boundary

```text
Diagnosis → SIX intervention → optional activity capability → selection
```

Adaptive-ready (current): coding, sql, lab, simulation, presentation  
Product-ready, not Adaptive-ready: game, writing, project

Unavailable / incompatible / wrong domain → SIX fallback.  
Capability never replaces SIX globally on `OrchestratorResult`.

---

## Assessment boundary

```text
ASSESS → Assessment Workflow → Assessment Adapter → Activity → Evidence → ConceptMastery
```

Separate from ordinary Orchestrator SIX selection. ASSESS does not unlock generic Adaptive activity interventions.

---

## Evidence & mastery boundary

| Action | Creates LearningAttempt? | Updates ConceptMastery? |
|--------|--------------------------|-------------------------|
| Launch / open | No | No |
| Completion gate alone | No | No |
| Producer submit / evaluate | Yes (`recordEvidence`) | Yes (`applyEvidenceToMastery`) when conceptId |
| Adaptive bind | No (consumes Attempt) | No |
| Re-orchestrate | No | No (reads only) |

**Invariant:** producers apply mastery **before** Adaptive bind/plan-next. Coordinator never writes evidence or mastery.

---

## Adaptive re-orchestration

```text
start/resume → step → launch → interaction → evidence → completion gate
→ bind → recordAdaptiveSequenceCompletionAndPlanNext
→ getNextAdaptiveIntervention → orchestrateForConcept (fresh DB read)
→ append next step | STOP_*
```

- Duplicate bind / same Attempt → idempotent (`ALREADY_PROCESSED`), no second orch side-effect append
- Terminal COMPLETED/ABANDONED → no continuation
- Max steps / immediate-repeat / no-intervention → stop kinds preserved
- No mastery cache: every `orchestrateForConcept` re-reads `getLearnerConceptMastery`

---

## Producer → Orchestrator matrix

| Producer | Evidence | Mastery | Learner Model | Orchestrator |
|----------|----------|---------|---------------|--------------|
| Quiz | `recordQuizAttemptEvidence` | `applyEvidenceToMastery` | `getLearnerConceptMastery` | `orchestrateForConcept` |
| Flashcard | `recordFlashcardReviewEvidence` | same | same | same |
| SIX / Teach-me / Blurting | `recordStudyEvaluateEvidence` | same | same | same |
| Coding / SQL / structured | `recordAuthoritativeActivityEvidence` | same | same | same |
| Tutor (authorized) | `maybeRecordTutorEvidence` | same | same | same |
| Lucky retention | `submitRetentionReview` | same | same | same |

CORE / Hub bridges / public Tutor / open-browse: **intentionally outside** evidence writes.

---

## Fallback behavior

| Situation | Result |
|-----------|--------|
| No activity capability | Diagnosis → SIX |
| Activity available + Adaptive-ready + policy allows | SIX baseline + activityIntervention |
| Activity unavailable / incompatible | SIX fallback |
| Wrong subject/domain | No false activity match (2G-77) |

---

## Determinism

Identical learner state + evidence + intent + concept context + available activities → identical Orchestrator decision. No randomness, LLM, or timestamp ranking noise on the decision path.

---

## Direct activity paths (2G-78)

Hub SIX “Try it”, activity Open, Assignments practice catalog, standalone Quiz/Flashcards/Locker remain **direct access**. When they produce evidence, they still converge on ConceptMastery; they are not forced through Adaptive.

---

## Security

- Learner A cannot mutate learner B mastery
- Foreign Concept / Attempt / Adaptive run rejected on bind
- Client learnerId / forged outcome ignored on authoritative activity submit
- Public Tutor cannot authorize evidence
- Assessment ownership remains server-side

---

## Lucky

Retention scheduling is downstream of ConceptMastery weakness / terminal Adaptive handoff.  
Lucky item existence ≠ mastery weakness unless an authoritative bridge wrote that item.

---

## Known residuals

1. Plan-next often omits start-time Intent options (soft PRACTICE may not persist across steps) — documented continuity gap, not fixed as a rewrite in 2G-80.
2. Small facet deltas may leave diagnosis unchanged after one attempt — truthful; tests use deterministic multi-success APPLY evidence to cross bands.
3. Legacy `code-evaluate` remains TopicMastery-only (outside ULE decision loop).

---

## Key files

| File | Role |
|------|------|
| `orchestrator/index.ts` | `orchestrateForConcept` — fresh mastery read |
| `orchestrator/diagnose.ts` | Diagnosis + soft intent + activity suggestion |
| `sequence/coordinator.ts` | Bind → plan-next → re-orchestrate |
| `learner-model/read.ts` | Canonical mastery projection for orch |
| `decision-loop.ts` | Contract constants |
| `UNIVERSAL_DECISION_LOOP_INTEGRITY.md` | This document |

# 2G-79 — Learner Model Truth & Cross-Activity State

**Mode:** Truth-boundary, inventory, projection, and integration hardening.  
**No new Learner Model. No schema migration. No second mastery store.**

---

## Architecture (binding)

```text
Learner
↓
Learning Space
↓
Concept / Skill
↓
Learning Evidence (LearningAttempt)
↓
ConceptMastery          ← canonical ULE mastery
↓
Learner Model projection ← read-only decision / visibility state
↓
Orchestrator
```

| Layer | Role | Not |
|-------|------|-----|
| **LearnerProfile** | Preferences / goals / persona | Not mastery |
| **LearningAttempt** | Evidence record | Not mastery |
| **Evidence Intelligence** | Patterns over recent attempts | Not mastery |
| **ConceptMastery** | Canonical ULE mastery belief | — |
| **Learner Model projection** | Coherent read over the above | Not a write path / SoT |
| **AdaptiveSequenceRun** | Progression cursor | Not mastery |
| **RetentionItem (Lucky)** | Retention scheduling | Not mastery |
| **TopicMastery** | Legacy topic/course progress | Not ULE mastery |

**CORE → SIX → LUCKY** remains the permanent learning architecture.

Exactly one: ULE · Learner Model · Knowledge Model · Evidence spine · Mastery contract · Orchestrator · Tutor · Adaptive Sequence · Retention.

---

## LearnerProfile

Stable preference-oriented state (`goalsJson`, persona, modality/accessibility).  
Loaded via `getOrCreateLearnerProfile`. Never treated as demonstrated mastery.

---

## LearningAttempt (evidence spine)

**Single write primitive:** `recordEvidence` (`src/lib/learning/evidence/record.ts`).

Envelope fields: conceptId, learningObjectId, skillFacet, outcome, score, confidence (optional/null), misconceptionSignals, sourceRef, evidencePayload, timestamps.

**Missing attempt confidence stays `null` — never coerced to zero on the row.**  
`ConceptMastery.confidence` is outcome-derived in `applyFacetDelta`, not copied from attempt.confidence.

---

## ConceptMastery (canonical ULE mastery)

Updated only by `applyEvidenceToMastery` after a LearningAttempt with `conceptId`.

Six facets: RECOGNIZE · EXPLAIN · APPLY · SOLVE · PERFORM · RETAIN.

Activity completion alone does **not** equal mastery. Adaptive bind does **not** write mastery.

---

## Learner Model projection

`projectLearnerConceptState(learnerId, conceptId)` in `learner-model/project.ts`:

- Reads `getLearnerConceptMastery` (ConceptMastery + optional evidenceSignals)
- Resolves learner-facing ULE mastery via `resolveLearnerFacingUleMastery` (never TopicMastery)
- Attaches recent activity source counts, active Adaptive run (cursor), retention item (scheduling)
- Marks TopicMastery as an explicit sidecar (`topicProgressSidecar`)

**Projection is not the source of truth.**

Primary ULE read remains `getLearnerConceptMastery`.

---

## Evidence Intelligence vs mastery

`aggregateEvidenceSignals` answers: “What patterns appear in recent evidence?”  
ConceptMastery answers: “What is the current mastery state?”

Signals enrich Orchestrator confidence/context; they must not replace ConceptMastery.

---

## Producer inventory

See `learner-model/producers.ts` (`LEARNING_ATTEMPT_PRODUCERS`).

### CLOSED (Evidence → LearningAttempt → ConceptMastery)

| Producer | Facet(s) |
|----------|----------|
| Quiz | RECOGNIZE |
| Flashcard | RETAIN |
| Study Evaluate (SIX / Teach-me / Blurting) | RECOGNIZE / EXPLAIN / APPLY / RETAIN |
| Tutor (server-authorized) | EXPLAIN / APPLY / SOLVE |
| Lucky retention review | RETAIN |
| Coding / SQL | PERFORM |
| Writing | EXPLAIN |
| Lab / Presentation | PERFORM |
| Simulation / Project | APPLY |
| Game | RECOGNIZE |

All converge on the **same** ConceptMastery row for a Concept.

### PARTIAL

| Producer | Notes |
|----------|-------|
| Adaptive bind / adapters | Bind after attempt exists; do not create attempts |
| Legacy `code-evaluate` | TopicMastery only — **not** ULE spine |

### INTENTIONALLY OUTSIDE ULE evidence

CORE bridge · Hub bridge · public Tutor API · AdaptiveRun cursor · Orchestrator diagnose · open/launch/view/browse actions.

---

## Facet coverage & PERFORM limitation

| Facet | CLOSED producers |
|-------|------------------|
| RECOGNIZE | Quiz, Game, Study Evaluate (chunking) |
| EXPLAIN | Study Evaluate, Writing, Tutor |
| APPLY | Study Evaluate, Simulation, Project, Tutor |
| SOLVE | Tutor only (public API never writes) |
| PERFORM | Coding, SQL, Lab, Presentation |
| RETAIN | Flashcard, Active recall / Blurting, Lucky |

**PERFORM coverage limitation:** producers update `ConceptMastery.perform`, but Orchestrator does **not** emit `PERFORM_GAP`. Do not invent one in this phase.

---

## Cross-activity consistency

Coding FAIL + SQL PARTIAL + Quiz SUCCESS for the **same Concept** all write LearningAttempts and update the **same** ConceptMastery facets (different facet keys). No activity-specific mastery stores.

Source classification (`classifyEvidenceSourceKind`) buckets coding/SQL/structured submits as `activity`.

---

## Adaptive vs Learner Model

Active AdaptiveSequenceRun is progression state only.  
`projectLearnerConceptState.activeAdaptiveRun` never feeds `resolveLearnerFacingUleMastery`.

Evidence from Adaptive-bound activities still flows through normal LearningAttempt writers.

---

## Lucky vs Learner Model

```text
ConceptMastery (weak retain / evidence)
→ retention sync bridges
→ RetentionItem scheduling
```

Existence of a Lucky item does **not** mean the learner is weak unless an existing authoritative bridge established that item from mastery/evidence.

Terminal Adaptive completion → existing Lucky handoff (once). Duplicate completion must not duplicate handoff.

---

## TopicMastery boundary

| Use | Allowed? |
|-----|----------|
| ULE diagnosis primary | ConceptMastery |
| Orchestrator empty-ULE TopicMastery fallback | Yes — LOW confidence, internal only (`usedTopicMasteryFallback`) |
| Learner-facing ULE mastery claim | **Never** TopicMastery |
| MasteryTree / Hub progress pills | TopicMastery, labeled **Topic progress** |

Dashboard metric pills use `TOPIC_PROGRESS_LEARNER_COPY.dashboardMetricLabel`.

---

## Confidence

| Store | Behavior |
|-------|----------|
| `LearningAttempt.confidence` | Usually null; missing ≠ 0 |
| `ConceptMastery.confidence` | Outcome-derived; empty facets start at 0 |
| OrchestratorConfidence | LOW/MEDIUM/HIGH from evidence/reviews/fallback |
| Client confidence | Must not authorize PERFORM; stripped on activity submit |

---

## LearningSpace context

LearningAttempt does not store `learningSpaceId` directly. Context comes from:

- Concept.learningSpaceId
- LearningObject.learningSpaceId
- sourceRefJson / payload

No schema change in 2G-79.

---

## Concept relationships

PREREQUISITE / RELATED / CONFUSABLE_WITH / PART_OF are knowledge structure only.  
They never imply learner mastery of related Concepts.

---

## Orchestrator / Tutor consumption

- Orchestrator: `getLearnerConceptMastery` → diagnose (ConceptMastery first)
- Tutor: ConceptMastery + evidence source counts in context; write only when server-authorized
- Availability / UI state never mutate mastery

---

## Security

- Client cannot write ConceptMastery directly
- Client cannot impersonate learnerId on activity evidence
- Client cannot inject unauthorized Tutor evidence
- Foreign Concept rejected on activity spine

---

## Intentionally partial / residual

1. Legacy `code-evaluate` remains TopicMastery-only (ULE coding path is separate PERFORM producer).
2. SOLVE evidence depends on authorized Tutor constructors (public route does not write).
3. No browser E2E harness for cross-surface learner-state smoke (see 2G-78 gap).
4. Hub `overallMastery` field name remains TopicMastery-backed; **labels** say Topic progress.

---

## Key files

| File | Role |
|------|------|
| `learner-model/read.ts` | Primary ConceptMastery read |
| `learner-model/project.ts` | Cross-activity projection |
| `learner-model/producers.ts` | Producer inventory |
| `mastery/mastery-truth.ts` | ULE vs Topic boundary |
| `evidence/record.ts` | Single evidence write |
| `mastery/apply.ts` | Single mastery apply |
| `LEARNER_MODEL_TRUTH_AND_STATE.md` | This document |

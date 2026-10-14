# Learner Context Audit (2P-29)

Audit of existing learner signals before coding. Goal: one **read-only** Universal Learner Context projection — not a personalization engine.

## Executive verdict

Signals already exist across mastery, evidence, LearningSpace, material (2P-28), Intent, Teaching Style, persona/a11y prefs, Adaptive runs, and Hub/Growth presenters.

**Implemented (2P-29):** `resolveUniversalLearnerContext` + `presentUniversalLearnerContext` project these into one optional read-only envelope. Closest prior pieces remain the building blocks: `LearnerConceptStateProjection`, `LearningDecisionContext`, `TutorResolvedContext`, `LearningMaterialContext`.

2P-29 **projects** these into one optional envelope and feeds presenters / soft Orchestrator options — **without** rewriting diagnosis or creating scores.

## Classification

### A. Decision-driving (authoritative)

| Signal | Store | Notes |
| --- | --- | --- |
| ConceptMastery | Prisma | Canonical mastery |
| LearningAttempt | Prisma | Evidence spine |

### B. Decision-contextual

| Signal | Store | Notes |
| --- | --- | --- |
| Learning Intent | Request contract | WHY; soft prefer only |
| LearningSpace | Prisma | Optional container |
| Material context (2P-28) | Projection | Provenance; not evidence |
| Active Adaptive run | Prisma | Progression cursor |
| Recent activity | Derived from attempts | Supporting only |

### C. Presentation-only

| Signal | Store | Notes |
| --- | --- | --- |
| Teaching Style | sessionStorage / request | HOW (Tutor) |
| Accessibility / modality prefs | LearnerProfile JSON | Activity UI hooks |
| Theme / AppSettings | UserPreferences | Product chrome |

### D. Product / navigation

| Signal | Store | Notes |
| --- | --- | --- |
| Course / Topic | Prisma | Discovery / Hub |
| Route / Hub tabs | Client | Navigation |
| Calendar / planner | Separate | Not ULE mastery |

## Intentionally disconnected

1. `goalsJson` / persona / ageBand — schema mostly unused by ULE
2. `projectLearnerConceptState` ↛ Orchestrator diagnose input
3. Hub suggestion currently does not pass Intent
4. Teaching Style ↛ diagnose / Adaptive / evidence
5. Material context ↛ mastery
6. Adaptive cursor ↛ mastery claim
7. TopicMastery sidecar ≠ Hub ConceptMastery claim

## Where context is lost / duplicated

- Hub and Growth Center both hit Orchestrator suggestion (client card fetch)
- Tutor `loadTutorContext` N+1 mastery per concept
- Growth Center already batches mastery + attempts well

## Smallest additive path

```text
resolveUniversalLearnerContext(learnerId, opts)
  → reuse getLearnerConceptMastery / projectLearnerConceptState
  → reuse resolveLearningMaterialContext
  → reuse LearningSpace lookup
  → reuse listActiveAdaptiveSequenceRuns when needed
  → optional persona hooks
  → parse Intent / TeachingStyle if supplied
  → NEVER write, NEVER score, NEVER call diagnose inside resolver
```

Orchestrator remains a **separate** call.

## Out of scope (confirmed)

PersonalizationEngine, RecommendationEngine, learner scores, second Learner Model, RAG, demographics inference.

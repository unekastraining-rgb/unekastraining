# LONGITUDINAL_LEARNER_GROWTH_AUDIT — 2P-43

**Mode:** Enhance Growth Center (2P-21/22) + Hub continuity — no GrowthEngine  
**Rule:** Derive from LearningAttempt · ConceptMastery · AdaptiveSequenceRun · Orchestrator  
**Prior art:** `presentGrowthCenter` · `growth-action-continuity` · `LearningAction` · Adaptive resume

---

## What already exists

| Concern | Existing |
|---------|----------|
| Growth snapshot | `GrowthCenterSnapshot` / `presentGrowthCenter` |
| Visibility buckets | strengths / developing / needsMorePractice / insufficientEvidence / recentDemonstrated |
| Adaptive CTAs | `resolveGrowthAdaptivePrimaryCta` · `LearningAction` |
| Resume without new evidence | `startOrResumeAdaptiveSequenceForConcept` · `resumeAdaptiveSequenceRun` |
| Attempt bind idempotency | `recordAdaptiveSequenceCompletion` same attemptId |
| Hub next action | `OrchestratorSuggestionCard` |
| Evidence timeline | `presentRecentEvidenceTimeline` (7d soft “recent”) |

## Explicit answers

### Canonical growth snapshot?
**YES** — `present-growth-center.ts` (not a longitudinal history store).

### Canonical LearnerNextAction?
**NO** — closest: `LearningAction` + Orchestrator suggestion + Growth Adaptive CTA (fan-out).

### Resume avoid duplicate LearningAttempts?
**YES** — resume/start-or-resume create no attempts; Adaptive bind is attemptId-idempotent.

## Genuine gaps

1. Hub has no growth continuity teaser (link only)  
2. No unified continuity DTO Hub + Growth both consume  
3. “Historically demonstrated” not labeled separately from recent  
4. No thin `LearnerNextAction` wrapping existing contracts + reason  

## Smallest additive plan

1. `learner-growth/` read composers (temporal + next action + continuity)  
2. Hub continuity strip (SSR)  
3. Growth Center temporal labels (previously vs recently)  
4. Tests + E2E · docs  

**No new engines · no mastery decay · no second planner.**

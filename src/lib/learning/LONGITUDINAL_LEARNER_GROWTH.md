# LONGITUDINAL_LEARNER_GROWTH — 2P-43

**Status:** Additive read-side continuity over existing Growth Center (2P-21/22)  
**Not:** GrowthEngine · JourneyEngine · PlanningEngine · ProgressEngine · second mastery · second planner · second retention

---

## Contract

`presentLearnerGrowthContinuity` + `resolveLearnerGrowthContinuityForUser` derive:

| Field | Source |
|-------|--------|
| Growth snapshot | `presentGrowthCenter` ← ConceptMastery + LearningAttempt |
| Temporal buckets | `presentTemporalTruthBuckets` ← existing visibility |
| Active resume | `AdaptiveSequenceRun` ACTIVE via `listActiveAdaptiveSequenceRuns` |
| Next action | `LearnerNextAction` ← existing `LearningAction` / Hub Adaptive CTA |
| Soft LUCKY | `findDueRetentionItems` only when Adaptive has no start/resume |

Study Hub and Growth Center both consume this resolve — they must not disagree on underlying learner truth.

---

## Temporal evidence semantics

| Bucket | Meaning |
|--------|---------|
| Recently demonstrated | Strength + `recentlyUpdated` (7-day soft window) |
| Historically demonstrated | Strength without recent update |
| Currently weak | `needsMorePractice` from ConceptMastery |
| Needs more evidence | `insufficientEvidence` |

No mastery decay algorithm. No “mastered forever” copy.

---

## Next-action derivation

Priority (deterministic):

1. CONTINUE_ADAPTIVE if ACTIVE run  
2. START_ADAPTIVE for focus concept  
3. OPEN_LUCKY if due RetentionItem exists  
4. NONE  

Learning need remains primary; LUCKY is never forced for every weak concept. Intervention variety (2P-42) stays inside Orchestrator/Adaptive ranking — not reimplemented here.

---

## Resume semantics

| State | Evidence? |
|-------|-----------|
| OPENED (page view / Hub strip) | No |
| RESUMED ACTIVE Adaptive | No new LearningAttempt |
| SUBMITTED / evaluated | Yes — existing activity adapters |
| COMPLETED Adaptive | Completion ≠ mastery; Lucky handoff COMPLETE-only |

`startOrResumeAdaptiveSequenceForConcept` reuses ACTIVE runs; attempt bind remains attemptId-idempotent.

---

## Study Hub / Growth Center

- Hub: `LearnerGrowthContinuityStrip` (SSR teaser)  
- Growth: temporal “Over time” section + next-action why  
- Same `resolveLearnerGrowthContinuityForUser(sessionUserId)`

---

## Security

- Session `userId` only  
- Queries scoped `where: { userId }`  
- Never trust client mastery / completion / learnerId  

---

## LUCKY

Unchanged path: Evidence → ConceptMastery → retention eligibility → RetentionItem → LUCKY. Continuity may surface OPEN_LUCKY when due items exist and Adaptive has no action.

---

## Deferred

- Mastery decay  
- Historical transition event store  
- Persisting AI recommendations as truth  
- Cross-device sync beyond existing DB  

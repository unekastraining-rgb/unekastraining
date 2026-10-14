# 2G-70 WS2 — TopicMastery / ConceptMastery Learner Truth Surface Audit

**Status:** AUDIT + additive labeling

## Classification

| Surface | Wording (before → after) | Truth class |
|---------|--------------------------|-------------|
| Hub Insights `overallMastery%` | Overall mastery → **Topic progress** | C / B — course TopicMastery aggregate |
| Locker StatPill | Mastery → **Topic progress** | B — TopicMastery |
| MasteryTree | Topic progress map (2G-62 copy) | B — legacy |
| Hub Orchestrator `masterySummary` | Current learning state… | A — ConceptMastery |
| Hub Concept Progress | Progress on… / dimensions | A — ConceptMastery |
| Adaptive `learnerState` | why + masterySummary | A — ConceptMastery |
| Study Now block subtitle `% mastery` | retained (topic proficiency) | B — TopicMastery proficiency on pick |

## Rules enforced

- ULE mastery claims use ConceptMastery only
- Curriculum/course progress may still use TopicMastery
- No silent ConceptMastery → TopicMastery fallback
- TopicMastery not deleted; MasteryTree not rewritten

## Tests

`src/lib/learning/mastery-truth-learner-surface.test.ts`

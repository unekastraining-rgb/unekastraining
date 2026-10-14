# 2G-70 WS7 — Lucky / ULE Retention Integration

**Status:** AUDIT — preserve Lucky; ConceptMastery is ULE retention truth

## Preserved

- LUCKY + retention queue
- One-question-at-a-time
- Missed-question sooner re-ask
- Score / scheduling behavior
- Complete-only Adaptive handoff (`lucky-handoff.ts`)

## ULE truth

- Retention reviews with `conceptId` → RETAIN LearningAttempt → ConceptMastery
- Legacy TopicMastery / MasteryTree / Study Now `%` remain curriculum compatibility

## Gaps (deferred)

- RetentionItems without `conceptId` skip ConceptMastery update
- Legacy Lucky planner blocks not Orchestrator-fed (intentional parallel)

**No second retention engine. No Lucky redesign.**

**Implementation this workstream:** audit only.

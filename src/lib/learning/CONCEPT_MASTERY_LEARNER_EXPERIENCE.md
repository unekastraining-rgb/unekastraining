# 2G-70 WS1 — ConceptMastery Learner Experience

**Status:** IMPLEMENTED (additive presentation)

## Goal

Learner-facing Concept Progress from **ConceptMastery** only — what is developing, evidenced, and unknown — without raw internals.

## Implementation

| Piece | Path |
|-------|------|
| Presentation model | `src/lib/learning/mastery/present-concept-progress.ts` |
| Hub wiring (additive) | `present.ts` → `conceptProgress` on `OrchestratorSuggestionView` |
| UI | `OrchestratorSuggestionCard.tsx` (`data-hub-concept-progress`) |
| Tests | `present-concept-progress.test.ts` |

Pipeline: `ConceptMastery` → `resolveLearnerFacingUleMastery` → `presentConceptProgress` → learner-safe view.

## Guarantees

- ConceptMastery authoritative; TopicMastery ignored
- Missing evidence truthful (not fake zero)
- No raw thresholds / attempt IDs / evidence payloads
- Viewing writes no evidence / no mastery (pure)
- Existing Hub `masterySummary` unchanged in role; Concept Progress is additive
- Adaptive learner-state visibility unchanged (2G-69)

## Architecture

ONE ULE · ONE ConceptMastery truth · TopicMastery legacy untouched.

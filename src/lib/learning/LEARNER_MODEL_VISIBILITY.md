# 2G-70 WS8 — Learner Model Visibility

**Status:** IMPLEMENTED (presentation of existing truth)

## Deliverable

Reusable view: strengths · developing · needs more practice · insufficient evidence · recent demonstrated learning.

| Piece | Path |
|-------|------|
| Helper | `src/lib/learning/mastery/present-learner-model.ts` |
| Builds on | `presentConceptProgress` + ConceptMastery |
| Tests | `present-learner-model.test.ts` |

## Guarantees

- No new Learner Model database table
- No raw evidence / internal thresholds / fake precision
- TopicMastery not used for ULE claims

## Maturity

**FOUNDATION / PARTIAL** — helper ready; not yet a dedicated learner dashboard page.

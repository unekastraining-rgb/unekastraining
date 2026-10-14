# Learner Growth Center (2P-21)

## 1. Purpose

Productize the existing Universal Learner Model as a learner-facing **Growth Center**: a clear window into evidence, mastery, and Orchestrator recommendations — not a second learning engine.

Canonical route: `/study/learner-model`  
Alias redirect: `/study/learner` → `/study/learner-model`

## 2. Source-of-truth rules

| Concern | Authority |
| --- | --- |
| Evidence | `LearningAttempt` (+ existing aggregation elsewhere) |
| Mastery | `ConceptMastery` via `presentLearnerModelVisibility` / `presentConceptProgress` |
| Recommendations | Orchestrator (`OrchestratorSuggestionCard` / `getTopOrchestratorSuggestion`) |
| Activity execution | Existing Adaptive start/resume |

## 3. Evidence vs Mastery vs Recommendation

- **Evidence** — what happened (attempt timeline; facet action + outcome + soft when).
- **Mastery** — what ConceptMastery currently implies (demonstrated / developing / needs practice / insufficient).
- **Recommendation** — what the Orchestrator suggests next (never recalculated in the Growth Center).

## 4–6. Authorities

- ConceptMastery remains canonical ULE mastery.
- LearningAttempt remains evidence truth for “recently practiced” attempts.
- Orchestrator remains diagnosis/recommendation authority.

## 7. Adaptive boundary

Growth Center links via `ContinueLearningButton` → `POST /api/study/adaptive/start` (start or resume). No local sequence engine.

## 8. CORE boundary

Footer/empty CTAs link to `/core`. Notes stay in `Note.contentJson`. No document copy into Growth Center.

## 9. LUCKY boundary

Links to `/study/lucky` only. No second retention queue; no LUCKY scoring changes.

## 10. TopicMastery compatibility

TopicMastery remains legacy/product compatibility elsewhere (e.g. MasteryTree). Growth Center ULE display uses ConceptMastery only (`data-mastery-source`).

## 11. Universal domain behavior

One projector for all domains. Concept titles/domains are data; no domain-specific Growth Center code.

## 12. Learning Space behavior

Page currently shows the learner’s ConceptMastery / attempts scoped by `userId`. No new Learning Space filter system in this phase.

## 13. Privacy / data minimization

Does not expose: evidence payloads, misconception JSON, raw scores as fake %, internal diagnosis codes, other users’ data, AI prompts.

## 14. Accessibility

Semantic `h1`/`h2`, `aria-labelledby` / `aria-label`, touch-safe `min-h-11` controls, text status (not color-only), section-level evidence degradation.

## 15. Mobile / iPad

Hub subpage layout; no CORE canvas dependency.

## 16. Deferred work

- Learning Space / course scoped filters when product requires them
- Historical mastery-transition trends (needs stored history; not invented)
- Pagination beyond 40 ConceptMastery rows
- Optional Tutor “explain simply” deep-link with Teaching Style (existing Tutor path)

Helpers: `present-growth-center.ts`, `present-recent-evidence.ts`, `growth-action-continuity.ts`  
UI: `LearnerGrowthCenterPanel.tsx` (alias `LearnerModelPanel`)

Action continuity (Start vs Continue, Adaptive/SIX/CORE/LUCKY boundaries): see `LEARNER_GROWTH_ACTION_CONTINUITY.md`.

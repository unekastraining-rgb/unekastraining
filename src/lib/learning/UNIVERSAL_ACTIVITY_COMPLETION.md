# Universal Activity Completion (2P-30)

## Purpose

Close remaining Universal Activity lifecycle gaps so Game and Project participate in Adaptive using the **existing** activity contract — without a second engine.

## Lifecycle

```text
resolve → launch → interact* → evidence* → completion gate → bind → return
```

| Stage | Rule |
| --- | --- |
| Launch | ≠ evidence |
| Evidence | ≠ automatic Adaptive completion |
| Completion | ≠ guaranteed mastery |
| Mastery | ≠ retention |
| Retention | Lucky only after Adaptive run **COMPLETED** |

## Adaptive-ready universals (post-2P-30)

coding · sql · lab · simulation · presentation · writing · **game** · **project**

Quiz / Flashcard / SIX keep separate adapters.

## Game

- Catalog: structured match activities (`game_*`)
- Facet: **RECOGNIZE**
- Evidence: `game_challenge_submit` via `recordAuthoritativeActivityEvidence`
- Completion: rubric evaluation (points ignored)
- Adaptive: `ACTIVITY_ADAPTIVE_COMPLETION_CONTRACTS` + bind via coordinator
- Resume mid-game: **not supported** (honest)
- Helpers: `activities/game/adaptive-contract.ts`

## Project

- Catalog: structured plan outlines (`project_*`)
- Facet: **APPLY**
- Evidence: `project_challenge_submit`; `learnerAuthored: true`
- AI assistance ≠ learner demonstration
- Adaptive: same universal bind path
- Resume mid-project: **not supported**
- Helpers: `activities/project/adaptive-contract.ts`

## PERFORM

- Produced by coding / sql / lab / presentation
- ConceptMastery.perform supported
- **PERFORM_GAP diagnosis deferred** — APPLICATION_GAP + PERFORM evidence remain sufficient

## Abandonment

Leave without submit → no LearningAttempt.  
`POST /api/study/adaptive/[runId]/abandon` → ABANDONED; no false SUCCESS; no Lucky.

## Material / learner context

Reuse 2P-28 `LearningMaterialContext` and 2P-29 `UniversalLearnerContext` where surfaces already wire them — no GameMaterialContext / ProjectMaterialContext.

## Security

Session ownership for concept / run / artifact. Client outcome / completed / score fields are not authoritative.

No GameEngine / ProjectEngine / PerformanceEngine.

# Universal Learner Context (2P-29)

## Purpose

One **read-only** projection of existing learner signals for Study Haul experiences.

```text
Existing Truth → Context Projection → Presenters / soft Orchestrator options
```

It describes the learner situation. The **Orchestrator still decides** what to do next.

It is **not** a PersonalizationEngine, RecommendationEngine, second Learner Model, or scoring system.

## Source categories

| Category | Signals | Role |
| --- | --- | --- |
| **A. Decision-driving** | ConceptMastery, LearningAttempt, Orchestrator diagnosis | Authoritative learning state |
| **B. Decision-contextual** | Intent, LearningSpace, material (2P-28), active Adaptive, recent activity | Frame the situation; soft prefer only |
| **C. Presentation-only** | Teaching Style, accessibility / modality prefs | HOW content is shown |
| **D. Product / navigation** | Course, route, planner | Where the learner is in the product |

See `LEARNER_CONTEXT_AUDIT.md` for storage ownership and flow matrix.

## Contract

`UniversalLearnerContext` (`universal-learner-context/types.ts`):

- Reuses `LearnerConceptStateProjection`, `LearningMaterialContext`, `LearningIntent`, `TeachingStyle`, `LearningDecisionContext`, `PersonaPresentationHooks`
- Always `createsEvidence: false`, `createsMastery: false`
- All nested fields optional (cold start / partial context)

## Ownership

- Server session / `getOrCreateDefaultUser()` is authoritative
- Client `learnerId` / `userId` are ignored at API boundaries
- Concept, LearningSpace, material, Adaptive runs resolved only when owned by the session learner

## Resolution

`resolveUniversalLearnerContext({ learnerId, conceptId?, learningSpaceId?, materialId?, intent?, teachingStyle?, … })`

1. Authenticate / derive learner (caller supplies server id)
2. Project concept via `projectLearnerConceptState` (ConceptMastery-backed)
3. Resolve material via `resolveLearningMaterialContext` (2P-28)
4. Resolve owned LearningSpace
5. Expose ACTIVE Adaptive run when present
6. Parse Intent / Teaching Style only when supplied — never invent
7. Optional persona hooks when requested
8. Build `LearningDecisionContext` envelope (ids + intent) — **not** a diagnosis

Prefer **fresh resolution** at server page/API boundaries. No global cache.

## Precedence

1. Canonical mastery / evidence  
2. Existing Orchestrator diagnosis  
3. Explicit learner intent  
4. LearningSpace / material context  
5. Presentation preferences  

Presentation never overrides diagnosis. No `personalizationScore` / ranking.

`toOrchestrateDecisionContextOptions(ctx)` maps context → existing Orchestrator options only.

## Relationships

| Consumer | How |
| --- | --- |
| **Orchestrator** | Soft `decisionContext` options; diagnose remains separate |
| **Tutor** | Optional presentation + teaching style / material meta; evidenceIntent stays server-gated |
| **CORE** | Material open path unchanged; context does not write evidence |
| **Growth Center** | Optional `LearnerContextStrip` from same resolver |
| **Study Hub** | Soft client fetch via `/api/study/learner-context`; existing fallbacks kept |
| **Activities / Adaptive** | Optional strip; activity interaction still uses existing evidence path |

## Boundaries

| Concern | Rule |
| --- | --- |
| **Mastery** | ConceptMastery only; TopicMastery may remain as legacy sidecar |
| **Evidence** | LearningAttempt only; resolving/displaying context creates none |
| **Intent** | WHY — absent → `undefined` |
| **Teaching Style** | HOW — never becomes diagnosis |
| **Accessibility** | Presentation hooks only |
| **LearningSpace** | Optional container under Learner |
| **Material** | Reuse 2P-28 `LearningMaterialContext` |
| **Active Adaptive** | Progression cursor — not mastery |
| **Recent activity** | Derived labels from existing attempts |

## Cold start

Missing mastery / evidence / material / space / intent / run → empty optional fields; existing cold-start UX continues. No demographic / device inference.

## Security

- Cross-user concept / material / space / run / preferences must not leak
- Client learnerId spoofing ignored
- Vitest + Playwright Journey E cover ownership

## Performance

Resolve only when a surface needs context. Soft-fail nested lookups. Avoid attaching an expensive global query to every route.

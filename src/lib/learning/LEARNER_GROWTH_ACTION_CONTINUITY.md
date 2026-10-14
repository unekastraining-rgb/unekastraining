# Learner Growth → Learning Action Continuity (2P-22)

## Purpose

Harden Growth Center so learner-facing states connect to **existing** ULE action paths. Growth Center remains a read-only presentation layer.

## Growth Center → Orchestrator

- Recommendation UI: existing `OrchestratorSuggestionCard` (no second recommendation engine).
- Learner-safe copy only — no internal diagnosis codes (`UNDERSTANDING_GAP`, etc.) invented in Growth Center.

## Growth Center → Adaptive

| Learner state | CTA | Behavior |
| --- | --- | --- |
| No ACTIVE run | **Start learning** | `POST /api/study/adaptive/start` → existing `startOrResumeAdaptiveSequenceForConcept` |
| ACTIVE run known | **Continue learning** | Navigate `/study/adaptive/{runId}` (Hub parity); server still resumes if POST used |
| COMPLETED run | — | Not indexed as active → next action is a legal **start** if Orchestrator/Adaptive allow |
| ABANDONED run | — | Not indexed → no silent resurrect; legal start/recommendation only |
| `no_sequence` | Soft fallback | Study Hub / Study Now links; optional SIX link **only** if Orchestrator already provided href+label |

Helpers: `resolveGrowthAdaptivePrimaryCta`, `indexActiveRunIdByConcept` (wrap Hub Adaptive bridge).

## Growth Center → SIX fallback

- Does **not** invent Chunking/Feynman/etc.
- Reuses `resolveHubDirectSixSecondaryCta` when Orchestrator already exposed a deep link.
- Per-row Adaptive buttons use Study Hub fallback when Adaptive refuses — not a Growth-specific SIX catalog.

## Growth Center → Tutor

- No Growth Tutor. Session Teaching Style applies only if learner later enters Unified Tutor via existing paths.

## Growth Center → CORE

- Footer / empty CTAs link to `/core`. No note copy; `Note.contentJson` remains document truth.

## Growth Center → LUCKY

- Links to `/study/lucky` only. Retention remains Adaptive completion → existing LUCKY sync. Growth Center never creates retention items.

## Evidence / mastery / recommendation boundaries

| Concern | Authority |
| --- | --- |
| Evidence | `LearningAttempt` |
| Mastery | `ConceptMastery` |
| Recommendation | Orchestrator |
| Execution | Adaptive |
| Intervention catalog | SIX |

## Section action policy

| Section | Action |
| --- | --- |
| Why Study Haul recommends | Orchestrator card → Adaptive primary |
| What needs practice | ContinueLearningButton → Adaptive |
| What I'm developing | ContinueLearningButton (not failure) |
| Not enough evidence | Informational + Orchestrator when available |
| What I know | Informational — no auto-launch |
| Recently practiced | Informational — LearningAttempt only |

## Ownership / security

- Page scopes ConceptMastery / attempts / ACTIVE runs by session `userId`.
- Adaptive start API ignores client `userId` / `learnerId`.
- ACTIVE run list from `listActiveAdaptiveSequenceRuns(user.id)` only.

## Unsupported / deferred

- Per-concept Orchestrator diagnosis on every row (would duplicate Hub card; not required).
- Learning Space filter UI (unless existing infrastructure lands).
- Historical mastery transition storage.
- Auto-passing Orchestrator SIX href into every concept row without a suggestion fetch.

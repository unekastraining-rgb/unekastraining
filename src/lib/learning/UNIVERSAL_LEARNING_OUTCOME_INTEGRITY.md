# Universal Learning Outcome Integrity (2P-13)

> **Completing an activity is not equivalent to demonstrating mastery. Learning evidence comes from authoritative evaluation of the learner's actual work or response.**

## Purpose

Harden the separation between:

| Layer | Meaning |
|-------|---------|
| **COMPLETION** | Learner finished the required interaction/artifact submission for evaluation |
| **EVALUATION** | How the artifact performed against criteria (SUCCESS / PARTIAL / FAIL) |
| **EVIDENCE** | LearningAttempt that may update ConceptMastery |
| **MASTERY** | ConceptMastery facet aggregation — not UI completion |
| **ADAPTIVE BIND** | Step finished per activity contract — not mastery |

## Boundaries

```
open / launch / hint / scaffold reveal
        → NO evidence

submit work
        → server evaluate
        → LearningAttempt (SUCCESS | PARTIAL | FAIL)
        → ConceptMastery
        → optional Adaptive bind (contract-dependent)
        → Orchestrator re-reads mastery
```

```
ACTIVITY COMPLETION ≠ SUCCESS ≠ MASTERY
```

Progression stages (INTRODUCE…RETAIN) are content intent metadata — not mastery states.

## Activity outcome matrix

See `ACTIVITY_OUTCOME_CONTRACT_MATRIX` in `src/lib/learning/outcome-integrity/types.ts`.

| Kind | Facet | Adaptive-ready | FAIL completes attempt | FAIL may Adaptive-bind |
|------|-------|----------------|------------------------|-------------------------|
| Coding | PERFORM | yes | yes | yes |
| SQL | PERFORM | yes | yes | yes |
| Lab | PERFORM | yes | yes | yes |
| Simulation | APPLY or SOLVE | yes | yes | yes |
| Presentation | PERFORM | yes | yes | yes |
| Writing | EXPLAIN | no | yes | no |
| Project | APPLY | no | yes | no |
| Game | RECOGNIZE | no | yes | no |
| SIX | varies | yes (own path) | yes | pass-gated |
| Quiz | RECOGNIZE | yes | yes | yes |
| Flashcard | RETAIN | yes | yes | yes |

## Adaptive completion

Adaptive bind means the step’s completion gate was satisfied — typically an evaluated LearningAttempt with an accepted outcome. **FAIL still binds** for Adaptive-ready universal activities.

SIX remains pass-gated on final stage — do not change.

## Direct access

Standalone submit → evaluate → evidence works without Adaptive.

## Scaffolding non-evidence (2P-12)

Hint / level reveal = local UI state only.

## Assessment / SIX / Tutor / Lucky

- **Assessment:** Quiz/Flashcard grading unchanged.
- **SIX:** own evaluate + bind rules preserved.
- **Tutor:** authorized evidence only; chat defaults to no evidence.
- **Lucky:** retention path only; failed activity ≠ automatic Lucky item.

## Ownership / security

Client may submit work only. `sanitizeClientActivitySubmission` strips outcome, score, mastery, evidence, identity, ABANDONED, nested evaluation claims. Session learner + owned concept only.

## Idempotency

Adaptive bind is idempotent on `attemptId`. Activity POST creates a new Attempt per submit (intentional retry for learning). No global submit dedupe invented in 2P-13.

## Integrity gaps fixed in 2P-13

1. **Simulation SOLVE vs Adaptive APPLY-only contract** — Adaptive completion and capability now accept APPLY **and** SOLVE so diagnostic sims can bind after authoritative evaluation.

## Known limitations / deferred

- Activity submit spam can still move mastery on repeated POSTs (no fingerprint cooldown)
- Universal activities do not emit ABANDONED (open-and-leave creates no Attempt)
- Browser E2E unavailable (no harness)
- Hint usage as evidence signal remains deferred

## What this layer does NOT own

- Evaluators, ConceptMastery math, Orchestrator diagnosis, Adaptive start, Lucky handoff, CMS, LLM grading

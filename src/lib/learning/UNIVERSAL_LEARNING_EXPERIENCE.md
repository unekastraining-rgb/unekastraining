# Universal Learning Experience (2P-11)

> **The Universal Learning Experience is a learner-facing projection of already-selected learning content and activity context. It does not become another learning decision engine.**

## Purpose

Connect truthful content (2P-7–2P-10) to the learner UI so activities show:

- what concept is being practiced
- why this activity (pass-through reason / soft purpose — not a new diagnosis)
- objective and task
- context, hint, expected action
- stage/difficulty when available
- truthful coverage gaps (no fabricated tasks)

## Experience contract

`LearningExperienceView` in `src/lib/learning/experience/types.ts`

Projection only — not a CMS row, not Mastery, not Evidence.

## Projection boundary

```
selected content / progression / coverage
        ↓
projectLearningExperience / resolveLearningExperience
        ↓
ActivityWorkspace chrome
        ↓
existing activity interaction + submit + evidence
```

Must NOT: diagnose, select intervention, write evidence/mastery, create Lucky, call LLM, replace SIX/Quiz/Flashcard engines.

## Content → experience

Uses 2P-7 descriptors + 2P-9 progression entries + 2P-10 coverage.

## Adaptive

Adaptive launch still uses existing activity hrefs. GET `/api/study/activities/[kind]?conceptId=&adaptiveRunId=` returns `experience` + `coverageStatus`. Interaction/submit/bind unchanged.

## SIX

Not forced into ActivityWorkspace. Remains its own intervention family.

## Assessment

Quiz/Flashcard/Assessment workflows unchanged.

## CORE / Hub

Entry paths unchanged: note → Concept → Continue Learning → Adaptive → experience; Hub → Orchestrator → Adaptive. Hub is not a content selector.

## LUCKY

Experience never creates Lucky items. Terminal Adaptive handoff unchanged.

## Direct activity

Standalone activity pages work without Adaptive. Catalog content still projects when progression coverage is MISSING but catalog content exists.

## Coverage behavior

| Status | UX |
|--------|-----|
| AVAILABLE | Show experience + workspace |
| INCOMPATIBLE / MISSING / UNAVAILABLE | Truthful gap message + return link; no fake task |

## Progression behavior

Stage/difficulty shown as soft labels (“Practice”, “Difficulty 3”). Not a mandatory ladder.

## Evidence / mastery

Unchanged: submit → server evaluation → LearningAttempt → ConceptMastery.

## Ownership / security

Concept ownership still enforced on page/submit. Experience projection does not trust client mastery.

## What this layer does NOT own

Diagnosis, intervention selection, content authoring, grading, Adaptive completion, Lucky, Assessment mode, CORE document truth.

---

Modules: `src/lib/learning/experience/`  
UI: `ActivityWorkspace` experience chrome (`data-learning-experience`)

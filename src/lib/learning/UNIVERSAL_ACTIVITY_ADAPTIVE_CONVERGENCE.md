# 2G-73 — Universal Activity Adaptive Step Convergence

## 1. Purpose

Close the Adaptive integration gap for Universal Activities so an Orchestrator
`activityIntervention` can become a first-class Adaptive Sequence step:

```
Orchestrator
→ activityIntervention (when Adaptive-ready)
→ Adaptive Sequence Step
→ Universal Activity Launch
→ Learner Interaction
→ Evidence (activity bridge)
→ LearningAttempt → ConceptMastery
→ Completion Gate
→ Adaptive bind
→ Re-orchestrate
→ Next Step
```

This is an **add/enhance** phase. It does not rewrite CORE, SIX, LUCKY,
Orchestrator diagnosis, Quiz/Flashcard adapters, or activity engines.

## 2. Adaptive Activity Step definition

An Adaptive Activity step reuses the existing thin `AdaptiveSequenceStep`:

```ts
{ intervention: string; learningObjectId?: string | null }
```

For universal activities, `intervention` is the Adaptive-ready **adapterKey**
(`coding` | `sql` | `lab` | `simulation` | `presentation`).

Optional `learningObjectId` remains an opaque activity reference when present.
The run does **not** embed challenge catalogs, evaluator payloads, or mastery.

## 3. Activity vs Interaction vs Evidence vs Completion vs Progression

| Concept | Meaning | Owner |
|---------|---------|--------|
| **Activity** | Learner-facing experience/template | Activity infrastructure |
| **Interaction** | What the learner does inside it | Activity UI / submit |
| **Evidence** | What was demonstrated (`LearningAttempt`) | Activity evidence bridge |
| **Completion** | Whether the Adaptive *step* gate is satisfied | Activity completion contract + adapter |
| **Progression** | Whether the Adaptive *run* advances | Adaptive coordinator |

Launch ≠ complete. Open ≠ evidence. Evidence ≠ automatic progression.

## 4. Activity capability (2G-72)

`activity-intervention-capability.ts` answers: *can this activity legally serve
this learning situation?*

Capability never feeds diagnosis. Intent remains soft.

## 5. Activity adapter (2G-73)

`sequence/activity-adapter.ts`:

- Resolve Adaptive-ready interventions
- Build launch hrefs with `adaptiveRunId` / `adaptiveStep` / `conceptId`
- Validate LearningAttempts against completion contracts
- Bind completion via existing `recordAdaptiveSequenceCompletionAndPlanNext`

Does **not** create `LearningAttempt` or `ConceptMastery`.

## 6. Completion contract

`sequence/activity-adaptive-completion.ts` declares Adaptive-ready contracts:

- `sourceRefKinds` (e.g. `coding_challenge_submit`)
- `requiredSkillFacets`
- `acceptOutcomes` (`SUCCESS` | `PARTIAL` | `FAIL` — evaluated attempts; not `ABANDONED`)

Declarative registry — not a giant activity switch.

`PRODUCT-READY ≠ ADAPTIVE-READY.`

## 7. Adaptive coordinator responsibility

`interventionFromOrchestrator`:

1. If Adaptive-ready `activityIntervention.adapterKey` → use that as step intervention
2. Else → existing SIX `intervention.sixComponent`
3. Never invent interventions; never write evidence

Terminal protections, max steps, idempotent completion, concurrency, and Lucky
handoff remain coordinator-owned.

## 8. Orchestrator responsibility

Unchanged diagnosis semantics. Additive `activityIntervention` only (2G-72).
Activity availability does not alter diagnosis.

## 9. Evidence ownership

Canonical path:

`Activity → evidence bridge → LearningAttempt → ConceptMastery`

Adaptive only **verifies** required evidence then binds. Soft-fail bind on
activity submit routes never fabricates attempts.

## 10. Mastery ownership

ConceptMastery remains downstream of evidence writers. Adaptive does not upsert
mastery. Client mastery fields are ignored.

## 11. Assessment separation

ASSESS → Assessment Workflow → Assessment adapters.

Quiz / Flashcard remain assessment adapters with their own Adaptive paths.
Universal ACTIVITY steps do not replace Assessment.

## 12. SIX preservation

SIX remains first-class. Non–Adaptive-ready activity suggestions fall back to
SIX steps. Existing SIX Adaptive evaluate → bind flow is untouched.

## 13. Quiz preservation

Quiz Adaptive adapter / submit bind unchanged. Activity bind skips when the
current step is not a universal activity.

## 14. Flashcard preservation

Flashcard Adaptive adapter / review bind unchanged.

## 15. Lucky preservation

Lucky sync only on successful Adaptive *run* completion (existing handoff).
Launch, evidence alone, abandon, and failed gates do not trigger Lucky.

## 16. Security boundaries

Server resolves: authenticated learner → owned run → owned step → owned concept
→ owned attempt.

Client may supply `adaptiveRunId` / step index / interaction payload.
Client must not determine learnerId, mastery, ownership, or completion success.
`completed: true` is never trusted.

## 17. Current Adaptive-ready activities

| Activity | Adaptive-ready | Notes |
|----------|----------------|-------|
| Coding | **Yes** | launch + evidence + contract + bind |
| SQL | **Yes** | same |
| Lab | **Yes** | structured submit + PERFORM |
| Simulation | **Yes** | structured submit + APPLY |
| Presentation | **Yes** | structured submit + PERFORM |

## 18. PRODUCT-READY vs ADAPTIVE-READY

| Activity | Product | Adaptive | Why deferred |
|----------|---------|----------|--------------|
| Game | Yes | **No** | Not auto-selectable; no Adaptive completion contract |
| Writing | Yes | **No** | CREATE-specialized |
| Project | Yes | **No** | CREATE-specialized |
| Quiz | Yes | Via Quiz adapter | Not universal ACTIVITY step |
| Flashcard | Yes | Via Flashcard adapter | Not universal ACTIVITY step |

## 19. Deferred activity types

- Game / Writing / Project Adaptive step integration
- LLM activity selection
- Full IDE / advanced simulation engines
- Marketplace content ecosystem

## 20. Backward compatibility

- Existing SIX / Quiz / Flashcard runs resume unchanged
- Step JSON remains `{ intervention, learningObjectId? }` — no migration
- Unknown interventions are not forced through the activity adapter

## 21. Exact files changed

**Added**

- `src/lib/learning/sequence/activity-adaptive-completion.ts`
- `src/lib/learning/sequence/activity-adapter.ts`
- `src/lib/learning/sequence/activity-adaptive-completion.test.ts`
- `src/lib/learning/sequence/activity-adapter.test.ts`
- `src/lib/learning/UNIVERSAL_ACTIVITY_ADAPTIVE_CONVERGENCE.md`

**Modified**

- `src/lib/learning/sequence/coordinator.ts` — prefer Adaptive-ready activityIntervention
- `src/lib/learning/sequence/adaptive-run-page.ts` — ACTIVITY step branch
- `src/lib/learning/sequence/index.ts` — exports
- `src/lib/learning/activities/adaptive-bind.ts` — gate on current activity step + contract
- `src/lib/learning/orchestrator/activity-intervention-capability.ts` — honesty flags for non–Adaptive-ready
- `src/lib/learning/sequence/coordinator.test.ts` — activity step generation tests
- `src/lib/learning/sequence/adaptive-run-page.test.ts` — coding step launch view
- `src/components/study/ActivityWorkspace.tsx` — forward `adaptiveStepIndex`
- `app/study/activities/[kind]/page.tsx` — `adaptiveStep` search param

## Architecture invariants (still exactly one)

ONE Universal Learning Engine · ONE Learner Model · ONE Knowledge Model ·
ONE Evidence spine · ONE Mastery contract · ONE Orchestrator · ONE Tutor ·
ONE Adaptive Sequence engine · ONE Retention engine

**CORE → SIX → LUCKY** preserved.

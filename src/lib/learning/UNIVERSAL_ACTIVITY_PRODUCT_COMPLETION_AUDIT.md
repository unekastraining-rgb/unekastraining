# 2G-71 — Universal Activity Product Completion Audit

**Verdict: PASS WITH NOTES**

---

## Activity status table

| Activity | Status | Learner interaction | Evaluation | Evidence | ConceptMastery | Adaptive | Assessment |
|----------|--------|---------------------|------------|----------|----------------|----------|------------|
| Quiz (existing) | PRODUCT-READY | Yes | Server | Yes | Yes | ADAPTIVE-READY | Yes |
| Flashcard (existing) | PRODUCT-READY | Yes | Server | Yes | Yes | ADAPTIVE-READY | Opt-in |
| SIX (existing) | PRODUCT-READY | Yes | Server | Yes | Yes | ADAPTIVE-READY | N/A |
| **Coding** | **PRODUCT-READY** | Yes (`/study/activities/coding`) | JS vm + structural | Yes | Yes (PERFORM) | PARTIAL (bind if `adaptiveRunId`) | Opt-in `coding` |
| **SQL** | **PRODUCT-READY** | Yes | sql.js educational | Yes | Yes (PERFORM) | PARTIAL | Opt-in `sql` |
| **Writing** | **PRODUCT-READY** | Yes | Rubric | Yes | Yes (EXPLAIN) | PARTIAL | Opt-in `writing` |
| **Lab** | **PRODUCT-READY** | Yes | Rubric | Yes | Yes (PERFORM) | PARTIAL | Deferred |
| **Simulation** | **PRODUCT-READY** | Yes | Rubric + rules | Yes | Yes (APPLY) | PARTIAL | Deferred |
| **Game** | **PRODUCT-READY** | Yes | Rubric (points ignored) | Yes | Yes (RECOGNIZE) | PARTIAL | Deferred |
| **Project** | **PRODUCT-READY** | Yes | Rubric | Yes | Yes (APPLY) | PARTIAL | Deferred |
| **Presentation** | **PRODUCT-READY** | Yes | Rubric | Yes | Yes (PERFORM) | PARTIAL | Deferred |
| **PERFORM facet** | **EVIDENCE-CLOSED** | via Coding/SQL/Lab/Presentation | Objective | Yes | Yes | — | — |

---

## Workstreams

| WS | Result |
|----|--------|
| A Execution contract | Done |
| B Server evaluation | Done |
| C Coding | PRODUCT-READY |
| D SQL | PRODUCT-READY |
| E Writing | PRODUCT-READY |
| F Lab | PRODUCT-READY |
| G Simulation | PRODUCT-READY |
| H Game | PRODUCT-READY |
| I Project | PRODUCT-READY |
| J Presentation | PRODUCT-READY |
| K PERFORM producers | EVIDENCE-CLOSED; no PERFORM_GAP |
| L Adaptive | Partial bind helper; no new Orchestrator interventions |
| M Assessment | Opt-in coding/sql/writing adapters |
| N Learner Model page | `/study/learner-model` |
| O Study Now / Planner UX | Continue learning in session; planner links |
| P Persona/accessibility | Wired into ActivityWorkspace |

---

## Files changed (primary)

**Contracts / pipeline**

- `activities/execution-contract.ts`
- `activities/server-evaluation.ts`
- `activities/adaptive-bind.ts`
- `activities/assessment-adapters.ts`
- `activities/perform-producer.ts`
- `activities/rubric.ts`

**Verticals**

- `activities/coding/*`
- `activities/sql/*`
- `activities/structured/service.ts`

**Routes / UI**

- `app/api/study/activities/[kind]/route.ts`
- `app/study/activities/[kind]/page.tsx`
- `app/study/learner-model/page.tsx`
- `components/study/ActivityWorkspace.tsx`
- `components/study/LearnerModelPanel.tsx`
- `components/study/ContinueLearningButton.tsx`
- `components/study/StudySessionRunner.tsx`
- `components/hub/AssignmentsTab.tsx`

---

## Tests

Focused: `src/lib/learning/activities` — **5 files, 21 passed**  
Full: `npm test -- src/lib/learning` — **96 files, 905 passed**

## ESLint

Touched activity/UI files: clean (after ActivityWorkspace setState fix).

## TypeScript

New activity code: clean.  
Known baselines unchanged: `notebook-desk.ts`, `generate-offline-fallback.integration.test.ts`, `resolve-loop-focus-topic.ts`.

---

## Security

Authenticated learner identity authoritative · owned concept required · forged outcome/score/mastery/learner/concept stripped · educational SQL only · JS vm sandbox · no host shell for coding.

---

## Architecture impact

Additive only. ONE evidence spine / ConceptMastery / Orchestrator / Adaptive coordinator preserved. TopicMastery legacy untouched. Existing Quiz/SIX/Flashcard/Tutor/CORE bridges unchanged.

---

## Deferred

- Adaptive run-shell step types for new activities (Orchestrator does not emit them)
- Production registration of assessment adapters by default
- Full language runtimes for Python/Java (structural only today)
- Richer simulation engines / science labs / IDE
- Per-assignment concept Continue learning (needs assignment→concept links)

---

## End-to-end paths

| Path | Status |
|------|--------|
| 1 CORE→Adaptive→SIX→Evidence | Pre-existing (unchanged) |
| 2 Tutor→evidence | Pre-existing |
| 3 Quiz→Assessment→Attempt | Pre-existing |
| 4 Flashcard→Attempt | Pre-existing |
| 5 Coding→eval→Attempt→Mastery | **New — verified in tests** |
| 6 SQL→eval→Attempt→Mastery | **New — verified in tests** |
| 7 Writing→rubric→Attempt | **New — verified in tests** |
| 8 Lab→rubric→Attempt | **New — verified in tests** |
| 9 Simulation→rubric→Attempt | **New — verified in tests** |
| 10 Project→rubric→Attempt | **New — verified in tests** |
| 11 Presentation→rubric→Attempt | **New — verified in tests** |

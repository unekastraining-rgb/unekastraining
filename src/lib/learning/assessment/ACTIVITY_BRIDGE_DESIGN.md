# Phase 2G-41 — AssessmentPlan → Universal Assessment Activity Bridge

**Status:** Design / inspection only. **No production bridge implementation.**  
**Date:** 2026-09-20  
**Depends on:** 2G-34 handoff · 2G-36 workflow · 2G-37 mode policy · 2G-38 registry · 2G-39 adaptive bind · 2G-40 standalone entry

---

## Verdict (frozen)

**Recommended option: C**

```text
AssessmentPlan
      ↓
Universal Assessment Activity Bridge   ← NEW (future phase; not coded here)
      ↓
AssessmentAdapterRegistry              ← EXISTS (2G-38; empty by design)
      ↓
AssessmentAdapter                      ← contract exists; none registered
      ↓
Activity (LearningObject + existing UX)
      ↓
EvidenceEnvelope → LearningAttempt → Mastery
```

**ASSESS ≠ QUIZ.** Quiz is one future adapter implementation, not the architecture.

**Assessment Workflow does not own activity execution.**  
**Assessment Adapter does not own mastery math.**  
**Standalone and Adaptive share the same activity architecture** (`adaptive` optional).

---

## A. Current architecture (inspected)

### Current AssessmentPlan (`workflow.ts`)

```text
status: ready | blocked | deferred
assessmentMode?: DIAGNOSTIC | VERIFICATION | PRACTICE_CHECK
conceptId: string
targetFacets?: MasteryFacetName[]     // reserved; unset today
activityType?: LearningObjectTypeName // reserved; unset today
adapterKey?: string                   // reserved; unset today
blockReason?: string
adaptive?: { runId, stepIndex }       // passive context only
```

`runAssessmentWorkflow` derives mode via 2G-37 policy and **explicitly leaves** `activityType` / `adapterKey` / `targetFacets` unset.

### Current AssessmentWorkflow

```text
ASSESS Intent → Handoff { purpose: "ASSESS" }
      ↓
runAssessmentWorkflow(request)
      ↓
AssessmentPlan (planning only)
```

Pure. No I/O, no registry resolve, no Quiz, no evidence.

### Current AssessmentAdapterRegistry (2G-38)

```text
AssessmentAdapter = {
  key: string
  canHandle(context: { plan, learnerId? }): boolean
  resolve(context): { adapterKey, activityType }   // mechanism ID only — not launch
}
```

Instance Map via `createAssessmentAdapterRegistry()`. **No adapters registered.** Registry does not select from plan, launch, or grade.

### Current Quiz paths (two separate seams — do not conflate)

| Seam | Location | Role today |
|------|----------|------------|
| **Evidence producer** | `assessment/quiz-bridge.ts` | Graded quiz → LO → `EvidenceEnvelope` → `recordEvidence` → `applyEvidenceToMastery` |
| **Adaptive sequence adapter** | `sequence/quiz-adapter.ts` | Resolve quiz step → href; validate attempt; `recordAdaptiveSequenceCompletion*` — **does not create evidence** |

Quiz submit route: grade → legacy mastery → `recordQuizAttemptEvidence` → optional `bindQuizSubmitToAdaptiveSequence`.

### Current Adaptive activity architecture

```text
AdaptiveSequenceRun
  steps: { intervention, learningObjectId? }[]
  currentStepIndex
      ↓
loadAdaptiveRunPageView → quiz-adapter | six-adapter → href + query
      ↓
Activity UX (Quiz / SIX evaluate)
      ↓
Evidence producer (quiz-bridge / evaluate-bridge)   // separate from coordinator
      ↓
bind*ToAdaptiveSequence → coordinator completion    // only if contract says so
```

**No unified `Activity` TypeScript type.** Identity is `LearningObject` (`LEARNING_OBJECT_TYPES` includes `QUIZ_ITEM`, `CODING_CHALLENGE`, `SQL_CHALLENGE`, `LAB`, `SIMULATION`, `WRITING_EXERCISE`, `PRESENTATION_PRACTICE`, …). Intervention strings are Adaptive descriptors, not LO types.

### Current evidence path (universal spine — reuse)

```text
Producer bridge (quiz / flashcard / evaluate / tutor / retention)
      ↓
buildEvidenceEnvelope
      ↓
recordEvidence → LearningAttempt
      ↓
applyEvidenceToMastery → ConceptMastery
```

Coordinator / sequence adapters **must not** own this spine (preservation tests already enforce).

### Current standalone entry (2G-40)

```text
POST /api/study/assessment
  → runStandaloneAssessmentEntry (EXPLICIT ASSESS only)
  → handoff + runAssessmentWorkflow
  → AssessmentPlan (+ optional passive adaptiveBinding)
```

Stops at the plan. No registry, no launch.

### Gap this phase freezes

Planning stack ends at `AssessmentPlan`. Registry exists but is unwired. Sequence adapters and evidence bridges exist for Quiz but are **not** `AssessmentAdapter` implementations. Nothing yet answers: “given a ready plan, which assessment activity mechanism should prepare/launch?”

---

## B. Proposed universal bridge

### Conceptual flow

```text
Explicit ASSESS (standalone or adaptive-tagged)
      ↓
Assessment Entry / Handoff / Workflow          (already exists)
      ↓
AssessmentPlan (ready + assessmentMode + conceptId
                + optional adaptive { runId, stepIndex }
                + optional adapterKey / activityType once resolved)
      ↓
★ Universal Assessment Activity Bridge ★
   1. Require plan.status === "ready"
   2. Authorize learner ↔ concept (call-site / existing ownership)
   3. Resolve adapter via AssessmentAdapterRegistry
        - prefer plan.adapterKey if set
        - else first registered adapter where canHandle(context)
        - else deferred / blocked (no silent Quiz default)
   4. Call adapter.resolve → AssessmentActivityResolution
      (still not execution)
   5. Call adapter.prepare / launch descriptor (future adapter method)
      → ActivityLaunchDescriptor { href | handle, activityType, learningObjectId?, adaptive? }
   6. Return launch descriptor to caller (API/UI/Adaptive page)
      ↓
Existing Activity UX (Quiz taker, future coding runner, …)
      ↓
Existing evidence producer for that activity
      ↓
EvidenceEnvelope → LearningAttempt → Mastery
      ↓
IF plan.adaptive present AND existing bind contract satisfied
   → Adaptive coordinator completion (optional, separate)
```

### Why not Options A or B

| Option | Meaning | Rejected because |
|--------|---------|------------------|
| **A** | Workflow selects + executes adapters | Couples planning to execution; bloated workflow; hard to test; violates 2G-36 boundary |
| **B** | Plan embeds adapter implementation | Plan becomes impure; not serializable; subject/activity coupling; breaks subject-agnostic planning |
| **C** ✓ | Plan describes intent; bridge resolves via registry | Separation of concerns; multi-activity; standalone + adaptive; ASSESS ≠ Quiz |

### Activity vs Assessment Activity

**Decision:** An assessment is **an Activity (LearningObject) used under assessment semantics** (`assessmentMode` + ASSESS intent), **not** a parallel activity hierarchy.

- Reuse `LearningObjectTypeName` for `activityType`.
- Do **not** invent `AssessmentActivityType` enums that duplicate LO types.
- Assessment semantics live on the plan / evidence `sourceRef` metadata — not a new Prisma model.

---

## C. Contract definitions (conceptual — not production code)

### Already exist (keep)

```ts
// workflow.ts
AssessmentPlan
AssessmentWorkflowAdaptiveContext = { runId: string; stepIndex: number }

// adapter-registry.ts
AssessmentActivityResolution = { adapterKey: string; activityType: LearningObjectTypeName }
AssessmentAdapterContext = { plan: AssessmentPlan; learnerId?: string }
AssessmentAdapter = {
  key: string
  canHandle(ctx: AssessmentAdapterContext): boolean
  resolve(ctx: AssessmentAdapterContext): AssessmentActivityResolution
}

// adaptive-step-bridge.ts
AssessmentAdaptiveStepBinding = {
  runId, stepIndex, conceptId, assessmentMode
}
```

### Proposed bridge additions (future implementation phase)

```ts
/**
 * Launch descriptor — mechanism + navigation/handle only.
 * Never contains questions, scores, or grading payloads.
 */
type AssessmentActivityLaunch = {
  adapterKey: string;
  activityType: LearningObjectTypeName;
  /** Opaque activity identity when known (quiz id, challenge id, LO id, …). */
  activityRef?: { kind: string; id: string };
  learningObjectId?: string | null;
  /** Existing UX entry (href) or future non-URL handle. */
  href?: string;
  assessmentMode: AssessmentMode;
  conceptId: string;
  /** Pass-through only; bridge does not mutate AdaptiveSequenceRun. */
  adaptive?: { runId: string; stepIndex: number };
};

type ResolveAssessmentActivityInput = {
  plan: AssessmentPlan;
  learnerId: string;
  registry: AssessmentAdapterRegistry;
};

type ResolveAssessmentActivityResult =
  | { ok: true; resolution: AssessmentActivityResolution; launch?: AssessmentActivityLaunch }
  | {
      ok: false;
      reason:
        | "plan_not_ready"
        | "no_adapter"
        | "adapter_cannot_handle"
        | "unauthorized"
        | "activity_unavailable";
    };
```

### Proposed minimal adapter expansion (future — keep mastery out)

Today’s `AssessmentAdapter` only `canHandle` + `resolve` (identity). For launch without pulling execution into the workflow, add **optional** methods in a later phase:

```ts
// Conceptual extension — do not implement in 2G-41
type AssessmentAdapter = {
  key: string
  canHandle(ctx: AssessmentAdapterContext): boolean
  resolve(ctx: AssessmentAdapterContext): AssessmentActivityResolution
  /** Optional: prepare launch descriptor (authorize + locate activity). */
  prepare?(ctx: AssessmentAdapterContext): Promise<AssessmentActivityLaunch> | AssessmentActivityLaunch
  /**
   * Optional: map completed activity → evidence producer call.
   * Must delegate to existing bridges (recordQuizAttemptEvidence, etc.).
   * Must NOT call applyEvidenceToMastery directly if the producer already does.
   */
  // evidence remains in producer bridges — adapters should not own a second spine
}
```

**Minimum universal contract for first wiring:** `canHandle` + `resolve` + `prepare` (launch only).  
**Completion / evidence / adaptive bind** stay at existing activity submit boundaries (as Quiz already does).

### AssessmentPlan ownership (clarified)

| Field | Own? | Notes |
|-------|------|-------|
| `conceptId` | **Yes** | Required identity |
| `assessmentMode` | **Yes** | From policy |
| `status` / `blockReason` | **Yes** | Planning outcome |
| `adaptive` | **Optional yes** | Passive refs only |
| `targetFacets` | **Optional later** | Hint for evidence facets; not mastery math |
| `activityType` / `adapterKey` | **Optional after bridge** | May be filled by bridge resolution; still not execution |
| questions / grading / scores | **No** | |
| UI routes / Quiz payloads | **No** | |
| EvidenceEnvelope / LearningAttempt | **No** | |
| Mastery deltas | **No** | |
| AdaptiveSequenceRun mutation | **No** | |

### Evidence boundary (design)

| Concern | Owner |
|---------|--------|
| Create `EvidenceEnvelope` | Existing producer bridges |
| Persist `LearningAttempt` | `recordEvidence` only |
| Mastery update | `applyEvidenceToMastery` (called by producers today) |
| Represent `assessmentMode` | Prefer `sourceRef` JSON metadata on existing envelope **or** attempt metadata — **no Prisma schema change in next phase unless unavoidable**; until then, mode stays on the plan / launch context and need not be required for evidence validity |
| Adapter role | May *invoke* the existing producer after activity completion; must not invent a second evidence model |

### Completion boundary (keep separate)

```text
1. Activity interaction     → learner uses Quiz / coding / lab UX
2. Activity completion      → activity finished (submit/grade at activity layer)
3. Evidence production      → producer bridge writes EvidenceEnvelope / LearningAttempt
4. Mastery update           → applyEvidenceToMastery (facet signal; ≠ “mastered”)
5. Assessment “done”        → plan fulfilled as an attempt occurred; NOT mastery certification
6. Adaptive progression     → only via existing bind + coordinator when adaptive context
                              present AND attempt compatible; standalone has no auto-advance
```

**Completing an assessment activity ≠ mastering the concept.**  
**Producing evidence ≠ advancing Adaptive** unless the existing completion/bind contract says so.

### Standalone vs Adaptive (same bridge)

```text
Standalone:  plan.adaptive absent  → launch without run query params; no coordinator call
Adaptive:    plan.adaptive present → pass { runId, stepIndex } into launch href/context;
             reuse AssessmentAdaptiveStepBinding for validation;
             completion still goes through existing sequence bind helpers
```

Do **not** create a second assessment system.

---

## D. Responsibility matrix

| Component | Owns | Does NOT own |
|-----------|------|--------------|
| **Assessment Workflow** | Handoff validation; plan status; mode via policy; optional adaptive attach | Adapter selection; launch; Quiz; evidence; mastery; Adaptive mutation |
| **AssessmentPlan** | Concept, mode, status, optional adaptive + future adapterKey/activityType hints | Questions; grades; evidence rows; mastery; UI; activity payloads |
| **Activity Bridge** (future) | Plan readiness check; registry selection; invoke `resolve`/`prepare`; return launch descriptor; pass adaptive refs | Defaulting ASSESS→Quiz; grading; evidence persistence; mastery; run mutation |
| **Adapter Registry** | Register/resolve/list by opaque key | Choosing default activity; execution; evidence |
| **Assessment Adapter** | `canHandle` / `resolve` / (future) `prepare` for one mechanism | Mastery math; Orchestrator diagnosis; second evidence spine; subject branches |
| **Activity (UX + LO)** | Interaction, activity-local scoring if any, LO identity | ULE planning; Adaptive cursor; ConceptMastery formulas |
| **Evidence producers** | Envelope build + `recordEvidence` (+ today’s mastery apply call) | Adaptive progression; assessment planning |
| **Mastery** | Facet updates from evidence | Activity launch; assessment mode policy |
| **Adaptive Coordinator** | Run cursor, history, plan-next | Evidence creation; Quiz grading; AssessmentPlan creation |

---

## E. Quiz mapping (future — do not wire in 2G-41)

```text
AssessmentPlan
      ↓
Universal Assessment Activity Bridge
      ↓
AssessmentAdapterRegistry.resolve("quiz")   // or canHandle match
      ↓
Quiz AssessmentAdapter (NEW thin wrapper — future)
   canHandle: ready plan + (explicit key or policy allows quiz)
   resolve:   { adapterKey: "quiz", activityType: "QUIZ_ITEM" }
   prepare:   locate owned quiz for concept → quizAdaptiveHref / standalone href
      ↓
Existing Quiz Activity UX (/quizzes/[id])
      ↓
Existing quiz-bridge (evidence) + optional sequence quiz-adapter bind
```

**Preserve ASSESS ≠ QUIZ:**

- Bridge must **not** hard-code Quiz as the only/default adapter.
- Empty registry → deferred/blocked, not silent Quiz launch.
- Registering Quiz is an explicit later phase decision.
- Existing `sequence/quiz-adapter.ts` remains Adaptive-sequence-specific; the future `AssessmentAdapter` for Quiz may *delegate* to it for href/ownership without merging the two layers into one type.

---

## F. Risks / unresolved questions (must answer before implementation)

1. **Selection policy when multiple adapters `canHandle`:** first-registered? mode-based preference? explicit `adapterKey` only?  
   *Recommendation:* prefer explicit `plan.adapterKey`; else deterministic registry order; never invent Quiz.
2. **Who fills `adapterKey` on the plan?** Bridge-only (ephemeral on launch result) vs mutating/returning an enriched plan.  
   *Recommendation:* bridge returns `resolution` + `launch`; avoid mutating the original plan object.
3. **`assessmentMode` on evidence:** required for DIAGNOSTIC vs VERIFICATION analytics?  
   *Recommendation:* optional `sourceRef` metadata later; not a schema blocker for first Quiz wiring.
4. **Relationship to Adaptive intervention `"quiz"`:** when Adaptive step already chose quiz, does ASSESS plan still go through Assessment bridge or only sequence adapters?  
   *Recommendation:* Adaptive page may keep sequence adapters for step launch; Assessment bridge is the path for **standalone ASSESS** and for future “assessment-mode” steps. Convergence can be gradual — do not force one mega-adapter in the first implementation phase.
5. **`prepare` sync vs async / DB:** Quiz needs owned-quiz lookup — adapter `prepare` will be async and I/O-bound; keep workflow pure.
6. **Authorization:** bridge vs API route.  
   *Recommendation:* route/entry owns learner session + concept ownership (as 2G-40); adapters re-check activity ownership.
7. **No activity available:** plan ready but no quiz/coding asset for concept → `activity_unavailable` (not a workflow `blocked` handoff failure).

---

## Recommended next implementation phase (not this phase)

**2G-42 (suggested):** Implement the Universal Assessment Activity Bridge as a thin pure/async resolver:

1. `resolveAssessmentActivity(plan, learnerId, registry)` → resolution or structured failure  
2. Still **no** Quiz registration  
3. Still **no** launch side effects beyond returning a descriptor  
4. Tests: ready plan + empty registry → `no_adapter`; never imports Quiz routes

**Later:** register Quiz adapter; wire standalone API optional “resolve” step; keep submit/evidence on existing Quiz path.

---

## Inspection inventory

### Files inspected (primary)

- `src/lib/learning/assessment/workflow.ts`
- `src/lib/learning/assessment/assessment-mode-policy.ts`
- `src/lib/learning/assessment/adapter-registry.ts`
- `src/lib/learning/assessment/adaptive-step-bridge.ts`
- `src/lib/learning/assessment/standalone-entry.ts`
- `src/lib/learning/assessment/quiz-bridge.ts`
- `src/lib/learning/assessment/flashcard-bridge.ts`
- `src/lib/learning/assessment/evaluate-bridge.ts`
- `src/lib/learning/orchestrator/assessment-handoff.ts`
- `src/lib/learning/types.ts` (`LEARNING_OBJECT_TYPES`, `EvidenceEnvelope`)
- `src/lib/learning/learning-object/ensure.ts`
- `src/lib/learning/sequence/quiz-adapter.ts`
- `src/lib/learning/sequence/types.ts` / coordinator (via inspection)
- `src/lib/learning/evidence/envelope.ts` / `record.ts` (path)
- `src/lib/learning/mastery/apply.ts` (path)
- `app/api/study/assessment/route.ts`
- Quiz submit / adaptive launch boundaries (inspection)

### Production files changed

**None.**

### Design artifact

This file only (+ optional design-assumption test).

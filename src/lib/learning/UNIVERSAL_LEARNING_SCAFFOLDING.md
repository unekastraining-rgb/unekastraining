# Universal Learning Scaffolding (2P-12)

> **Scaffolding supports learner action but is not learning evidence and does not make learning decisions.**

## Purpose

Improve interaction quality after 2P-11 experience projection:

- Clear success criteria where metadata allows
- Optional progressive scaffolds when content provides them
- Independent attempt first; help on request
- Existing evaluators / evidence / mastery / Orchestrator unchanged

## Scaffold contract

`LearningScaffold` in `src/lib/learning/scaffolding/types.ts`

| Field | Meaning |
|-------|---------|
| `kind` | `HINT` \| `STEP` \| `EXAMPLE` \| `CHECKLIST` \| `CONSTRAINT` |
| `level` | 1–3 progressive strength |
| `revealPolicy` | `ALWAYS` or `ON_REQUEST` |
| `doesNotRevealAnswer` | Defaults true; non-EXAMPLE answer-reveal items are dropped |

Invalid scaffolds are **ignored**, never invented.

## Projection boundary

```
selected content / challenge metadata
        ↓
projectLearningScaffolds / projectSuccessLooksLike
        ↓
LearningExperienceView.scaffolds + successLooksLike
        ↓
ActivityWorkspace progressive disclosure (local UI state)
```

Must NOT: diagnose, select intervention/content, write evidence/mastery, create Lucky, call LLM, replace SIX/Quiz engines.

## Content-derived requirement

Preferred source order:

1. Authored `scaffolds` / `successLooksLike` on challenges
2. Existing activity metadata (starter, entry function, rubric **labels**, minChars, evaluation mode)
3. Deterministic kind-level nudge **only when an objective exists**

Never invent from concept title alone. Never surface rubric `mustIncludeAny` needles or test expected values as hints.

## Progressive disclosure

ON_REQUEST scaffolds reveal one level at a time via “Show a hint” / “Show more guidance”.

ALWAYS items (e.g. starter guidance) may show immediately.

## Answer-reveal protection

Scaffolds default to `doesNotRevealAnswer: true`. Non-EXAMPLE items that set false are rejected at normalize time.

## Success criteria

`successLooksLike` projects from authored text or evaluation metadata (execution / SQL / rubric labels). It never promises a score the evaluator does not calculate.

## Objective / evaluation alignment (audit)

| Kind | Objective → artifact → evaluator → facet | Status |
|------|------------------------------------------|--------|
| Coding | objective → code → execution/structural → PERFORM | Aligned — leave as-is |
| SQL | objective → SELECT → sqljs → PERFORM | Aligned — leave as-is |
| Lab / Sim / Writing / Project / Game / Presentation | objective → text → rubric → existing facet | Aligned — leave as-is |
| SIX | own guides / evaluation | Preserved — not forced through this contract |
| Quiz / Flashcard | Assessment adapters | Preserved — feedback rules unchanged |

No facet/evaluator rewrites in 2P-12.

## Evidence boundary

**Hint request ≠ learning outcome.**

Revealing a scaffold is client UI state only. It must not create LearningAttempt, ConceptMastery, Lucky items, or Orchestrator diagnosis changes.

## Adaptive

```
Adaptive → selected content → Learning Experience → Scaffolding → activity → evidence → mastery → re-orchestration
```

Scaffolding does not select or complete Adaptive steps.

## Direct activity

Same projection when content resolves. No Adaptive run required.

## SIX / Assessment / CORE / LUCKY

- **SIX:** keep existing guides; optional soft projection only.
- **Quiz / Flashcard / Assessment:** unchanged grading and feedback.
- **CORE:** hinting does not create mastery.
- **LUCKY:** only existing handoff paths; scaffold views do not create retention items.

## Accessibility

Scaffold controls use existing min touch targets, labels, and `aria-label` text. Guidance is not color-only.

## Security

Scaffold content comes from server-authorized catalog/challenge context. Client never supplies mastery/evidence/ownership.

## Intentionally deferred

- Hint usage as an evidence signal
- Per-challenge scaffold refetch when switching challenges in the workspace dropdown
- Browser E2E (no harness in repo)
- LLM-authored hints
- Folding SIX/Quiz into universal scaffolding

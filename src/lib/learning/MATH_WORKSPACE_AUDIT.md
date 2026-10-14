# MATH_WORKSPACE_AUDIT — 2P-39

**Mode:** Specialize only where universal text rubrics cannot validate mathematical steps  
**Rule:** One ULE · math is an interaction adapter · no MathMastery / MathOrchestrator

---

## What universal infrastructure already handles

| Concern | Status |
|---------|--------|
| Concept identity / Knowledge Model | ✓ |
| Learner Model / ConceptMastery / facets | ✓ |
| Evidence spine (`recordAuthoritativeActivityEvidence`) | ✓ |
| Orchestrator / AdaptiveSequenceRun | ✓ |
| LUCKY retention (2P-38) | ✓ |
| Progression / difficulty / scaffolds / misconceptions metadata | ✓ |
| Educational math **reasoning** via Lab/Writing text rubrics | ✓ (2P-36/37) |
| Hint UX (`doesNotRevealAnswer`) | ✓ |

Current “solve” path: free-text → `mustIncludeAny` keyword rubrics — **not** step validation.

## What specifically requires a math workspace

1. **Step-by-step equation transforms** with intermediate validity
2. **Expression / equation equivalence** beyond brittle substrings
3. Structured capture of operations (subtract both sides, divide, …)
4. Math-specific error categories (SIGN_ERROR, EQUALITY_BREAK, …) as misconception signals

## Specialization boundary

| Universal | Math workspace |
|-----------|----------------|
| Mastery, evidence, Adaptive, Lucky, progression | Notation/input of steps |
| Scaffolds metadata, concept keys | Constrained linear-equation validation |
| Activity lifecycle | Intermediate-state checking |

## Dependencies

No mathjs / KaTeX / MathLive. **Do not** add a full CAS. Implement a **constrained deterministic** linear-equation checker in-repo.

## Safe additive path

Mirror `activities/coding/`:

```
src/lib/learning/activities/math/
  challenges.ts | evaluate.ts | service.ts | types.ts
```

Wire kind `"math"` in activity API + Adaptive completion contract. Optional `MathWorkspacePanel` in `ActivityWorkspace`.

## Explicitly out of scope

Full CAS · calculus · matrices · graphing · handwriting · theorem proving · MathMastery · second Adaptive.

## Adaptive note

Existing lab Adaptive contract often requires `PERFORM`; math labs use `SOLVE`. New `math` adapter should declare **SOLVE** (and optionally APPLY) as Adaptive-eligible.

**Audit complete — implement constrained linear-equation workspace only.**

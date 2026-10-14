# MATH_WORKSPACE — 2P-39

## Why specialization

Universal Lab/Writing rubrics can teach *about* algebra with prose. They cannot
reliably validate **step-by-step equation transforms**. The math workspace is a
**specialized interaction** on the existing ULE — not a second learning engine.

## Boundary

| Universal | Math workspace |
|-----------|----------------|
| Concepts, mastery, evidence, Adaptive, Lucky, scaffolds metadata | Linear-equation input & step checking |
| Orchestrator diagnosis | Constrained algebraic validation |

## Supported (v1)

- `ax+b=c`, `ax-b=c`, `ax+b=dx+e`, single `a(x±b)=c`, solved `x=k`
- Step equivalence checking
- Error categories: SIGN, DISTRIBUTION, INVERSE_OPERATION, EQUALITY_BREAK, ARITHMETIC, UNSUPPORTED
- Hints with `doesNotRevealAnswer`
- Evidence facet: **SOLVE** via `math_workspace_submit`
- Adaptive-ready adapter key: `math`

## Unsupported (intentional)

Full CAS, calculus, matrices, graphing, handwriting, theorem proving, LLM grading.

## Evidence

Open / type / hint / check-step → **no** LearningAttempt.  
Submit solution → server evaluate → LearningAttempt → ConceptMastery.

## Lucky

Math evidence updates ConceptMastery; existing 2P-38 retention may select the concept. No MathRetention.

## Future

CAS, graphing, geometry drawing — only if interaction still cannot fit universal contracts.

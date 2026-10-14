# CROSS_MODAL_LEARNING_AUDIT — 2P-42

**Mode:** Strengthen existing Orchestrator + Adaptive — no CrossModalEngine  
**Rule:** Evidence-driven variety · never variety for its own sake  
**Prior art:** Facet diagnosis · activity intervention policy · Adaptive plan-next

---

## What already works

| Capability | Status |
|------------|--------|
| Facet-driven diagnosis changes intervention type | ✓ UNDERSTANDING / APPLICATION / RECALL / RETENTION / INSUFFICIENT / NO |
| Explain → Apply when understand strong + apply weak | ✓ |
| Apply → Retain when apply strong + retain weak | ✓ |
| Recall → Explain when understand facets regress | ✓ (re-diagnosis) |
| Activity overlay under APPLICATION_GAP + PRACTICE | ✓ coding/sql/math/networking/language/… |
| Content variant exclusion (`excludeContentKeys`) | ✓ |
| Adaptive immediate-repeat **block** | ✓ `STOP_IMMEDIATE_REPEAT` |
| Misconception signals → reason/hint copy | ✓ (does not change type) |
| Evidence → ConceptMastery → re-orchestrate | ✓ |

## Explicit answers

### Can Orchestrator change intervention type based on evidence?
**YES** — via ConceptMastery facets → diagnosis → different SIX (and activity under APPLICATION_GAP).

### Can it avoid immediately repeating the same interaction?
**PARTIAL** — Adaptive stops on exact-string repeat; ranking does **not** demote recent kinds; no alternate is chosen.

### Cross-modal transitions

| Transition | Status |
|------------|--------|
| Explain → Apply | ✓ |
| Apply → Solve | ✗ no solve diagnosis; solve facet unused |
| Solve → Retain | partial as Apply → Retain |
| Recall → Explain | ✓ if facets regress |

## Genuine gaps (code-backed)

1. Ranking ignores `interventionHistory` / last adapter key  
2. Immediate repeat **stops** instead of next legal candidate  
3. `facets.solve` / `facets.perform` unused in diagnosis (optional soft bias only)  
4. Misconceptions are reason-only (keep — no domain engines)

## Smallest additive plan

1. Soft-demote recently used Adaptive activity keys in ranking  
2. On immediate repeat, try next ranked legal activity / SIX before STOP  
3. Soft rank bias: weak `solve` prefer SOLVE-producing adapters under existing APPLICATION_GAP  
4. Tests + one E2E cross-modal journey · docs

**No new engines · no ModalityMastery · no CrossModalAdaptive.**

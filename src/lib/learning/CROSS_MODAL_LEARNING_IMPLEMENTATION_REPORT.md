# CROSS_MODAL_LEARNING_IMPLEMENTATION_REPORT — 2P-42

## 1. Audit

See `CROSS_MODAL_LEARNING_AUDIT.md`. Facet-driven SIX transitions already worked.
Gaps: ranking ignored history; immediate repeat stopped without alternate;
solve facet unused.

## 2. Gaps addressed

1. Soft demote recent Adaptive activity keys in ranking  
2. Immediate-repeat → legal alternate (SIX co-eligible or next activity) else STOP  
3. Soft prefer SOLVE-producing adapters under APPLICATION_GAP when solve weak  

## 3–4. Implementation / files

- `orchestrator/cross-modal-variety.ts` (+ tests)
- `activity-intervention-ranking.ts` — demotion + preferSolve
- `activity-intervention-policy.ts` — recent/exclude/prefer options + reason copy
- `diagnose.ts` — `recentActivityAdapterKeys` + preferSolve when APPLICATION_GAP
- `sequence/coordinator.ts` — pass history; resolve alternate before STOP
- Docs + `e2e/cross-modal-learning.spec.ts`
- Updated plan-next / coordinator / lifecycle / lucky-handoff expectations

## 5–9. Behavior

Deterministic ranking; variety never forced; STOP when no alternate;
misconceptions remain reason-only; transfer via soft SOLVE bias + existing
facet re-diagnosis.

## 10–11. Adaptive / LUCKY

Unchanged ownership. Plan-next may append alternate instead of STOP when legal.

## 12–18. Verification

| Check | Result |
|-------|--------|
| Cross-modal unit | **7/7 pass** |
| Full `src/lib/learning` | **148 files / 1641 tests pass** |
| Playwright `cross-modal-learning.spec.ts` | **1/1 pass** |
| `tsc --noEmit` | **0** |
| `npm run build` | **0** |
| ESLint owned paths | **0** |
| Prisma validate | **valid** |

Deferred: long-horizon planning, FSRS, richer decay, persona adaptation.
Regressions: none — STOP preserved when no alternate.
Architecture: One ULE · CORE → SIX → LUCKY.


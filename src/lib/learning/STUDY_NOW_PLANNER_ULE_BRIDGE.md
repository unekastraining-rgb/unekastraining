# 2G-70 WS6 — Study Now / Planner → ULE Bridge

**Status:** IMPLEMENTED (safe entry bridge only)

## Approach

existing planner / Study Now recommendation  
→ owned Concept when `Topic.conceptId` present  
→ existing Hub Adaptive entry (`resolveHubAdaptivePrimaryCta`)

## What shipped

| Piece | Path |
|-------|------|
| Pure bridge | `src/lib/learning/study-now-ule-bridge.ts` |
| API enrichment | `app/api/study-now/route.ts` → `uleFocusTopics` |
| Tests | `study-now-ule-bridge.test.ts` |

## Explicit non-goals (honored)

- Did not replace `buildStudyNowPlan` or planner
- Did not invent Concepts when unavailable
- Did not diagnose mastery in planner
- Did not write evidence from viewing/planning
- Not every planner item is an Adaptive activity

## Maturity

**PARTIAL** — API exposes optional Adaptive CTAs; Hub Study Now banner UI not redesigned to surface them yet.

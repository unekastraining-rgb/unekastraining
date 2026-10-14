# Learner Growth Action Continuity — Implementation Report (2P-22)

## Verdict

**PASS WITH NOTES**

## Files inspected

- `app/study/learner-model/page.tsx`
- `src/components/study/LearnerGrowthCenterPanel.tsx`
- `src/components/study/ContinueLearningButton.tsx`
- `src/components/study/OrchestratorSuggestionCard.tsx`
- `src/lib/learning/orchestrator/hub-adaptive-bridge.ts`
- `app/api/study/adaptive/start/route.ts`
- `src/lib/learning/sequence/start-or-resume.ts`
- CORE / Hub Adaptive bridges (parity)

## Files changed

- `src/components/study/ContinueLearningButton.tsx` — Start vs Continue + soft fallbacks
- `src/components/study/LearnerGrowthCenterPanel.tsx` — wire `activeRunId` / section policy copy
- `app/study/learner-model/page.tsx` — load ACTIVE runs via `listActiveAdaptiveSequenceRuns`
- `src/lib/learning/index.ts` — exports
- `src/lib/learning/LEARNER_GROWTH_CENTER.md` — pointer to continuity doc

## Files added

- `src/lib/learning/learner-model/growth-action-continuity.ts`
- `src/lib/learning/learner-model/growth-action-continuity.test.ts`
- `src/lib/learning/LEARNER_GROWTH_ACTION_CONTINUITY.md`
- `src/lib/learning/LEARNER_GROWTH_ACTION_CONTINUITY_IMPLEMENTATION_REPORT.md`

## Action mappings

| Growth section | Action |
| --- | --- |
| Why recommends | Existing Orchestrator card → Adaptive primary |
| Next step / Needs practice / Developing | `ContinueLearningButton` + `resolveGrowthAdaptivePrimaryCta` |
| What I know / Recently practiced / Insufficient | Informational (Orchestrator when available for insufficient) |
| Adaptive refuse (`no_sequence`) | Soft Study Hub / Study Now; SIX only if Orchestrator already gave href |

## Tests

```bash
npx vitest run src/lib/learning
```

**Result:** full suite passed (includes `growth-action-continuity.test.ts` covering Start/Continue, completed/abandoned not resurrected, ownership, domains, section policies).

## Accessibility

- `min-h-11` / `touch-manipulation` preserved on CTAs and fallbacks
- Soft fallback links are keyboard-reachable `<Link>`s (not hover-only)
- Error text uses `role="alert"`
- Section headings unchanged

## Authorization

- Page: session user only for mastery, attempts, ACTIVE runs
- Start API: ignores client `userId` / `learnerId`
- Resume href uses opaque run ids from server-listed ACTIVE runs only

## Universal-domain

- Continuity helper has no subject branching; same Start/Continue contract for all concept titles

## Deferred

- Fetching per-row Orchestrator SIX deep links without a second recommend engine
- Learning Space filter UI
- Browser E2E harness

## Pre-existing issues

- Unrelated baseline `tsc` errors may remain outside 2P-22 paths
- `study-hub-view.tsx` pre-existing `set-state-in-effect` (not modified in continuity logic)

## Architecture verification

Still one Orchestrator, Adaptive, SIX catalog, Tutor, CORE, LUCKY, Learner Model.  
No GrowthEngine / GrowthOrchestrator / second Adaptive.

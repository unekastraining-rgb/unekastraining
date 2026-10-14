# Universal Experience Implementation Report (2P-25)

## Verdict

**2P-25 STATUS: PASS WITH NOTES**

## Audit findings

See `UNIVERSAL_EXPERIENCE_AUDIT.md`.

- One Adaptive / Orchestrator / ConceptMastery / evidence spine confirmed
- Main UX gaps: Start/Continue label split; duplicated Adaptive-return strips; learner-visible “Orchestrator” wording
- Topic-progress Six panel intentionally separate from Orchestrator (not merged)

## Canonical product roles

| Surface | Role |
| --- | --- |
| Study Hub | Where should I learn next? |
| Growth Center | What do I know / developing? + Start/Continue |
| Adaptive | Canonical personalized journey |
| Activity Workspace | Do the activity |
| CORE | Capture / organize / understand |
| SIX | Targeted interventions |
| Tutor | Interactive teaching |
| LUCKY | Retention |

## Learning action contract

`src/lib/learning/experience/learning-action.ts`

- `START_ADAPTIVE` / `CONTINUE_ADAPTIVE` / `OPEN_*` / `NONE`
- Presentation/navigation only — no evidence, mastery, recommend, or run creation

## Start / Continue audit

| Surface | Before | After |
| --- | --- | --- |
| Hub | Start/Resume adaptive study | **Start learning** / **Continue learning** |
| Growth | Start/Continue learning | Unchanged (already canonical) |
| CORE | Continue learning (even for fresh start) | **Start learning** / **Continue learning** |

Hub bridge remains the single resolver; Growth/CORE wrappers map labels.

## Activity context / why

- Activity Workspace keeps concept title + experience blocks
- `presentWhyThisActivity` + `data-why-this-activity`
- Adaptive why-this-step already learner-safe (`adaptive-learner-state.ts`)

## Completion behavior

- `presentActivityCompletion` + shared `AdaptiveReturnStrip`
- Wired into Activity Workspace, Quiz taker, Flashcards
- `createsEvidence: false` — strip never writes attempts/mastery

## Activity states

`activity-lifecycle-state.ts` + `data-activity-state` / sr-only status on Activity Workspace.

## Empty state

Existing Hub empty + Growth cold-start preserved; Growth copy no longer says “Orchestrator”.

## Return paths

Adaptive return strip adds Growth Center + Study Hub links alongside Continue learning.

## Accessibility

- Continue / return CTAs keep `min-h-11`, `touch-manipulation`, focus-visible outlines on return strip
- Activity state announced via `aria-live` / `sr-only`

## Duplicate logic removed

- Shared Adaptive return presentation (3 surfaces → one component)
- Unified Start/Continue labels (one semantic)

Handlers still call the same Adaptive start API (no new engine). Full handler extraction deferred (notes).

## Browser E2E

Extended 2P-24 journeys with Start/Continue label checks, Growth “Study Haul” copy, `data-activity-state`.

## Test results

- `npx vitest run src/lib/learning` → **133 files / 1489 tests passed**
- `npm run test:e2e:desktop` → **13 passed**
- Owned ESLint paths → clean
- No new TypeScript errors in owned 2P-25 files (pre-existing unrelated `tsc` issues remain)

## Files added

- `src/lib/learning/UNIVERSAL_EXPERIENCE_AUDIT.md`
- `src/lib/learning/UNIVERSAL_LEARNER_JOURNEY.md`
- `src/lib/learning/UNIVERSAL_EXPERIENCE_IMPLEMENTATION_REPORT.md`
- `src/lib/learning/experience/learning-action.ts`
- `src/lib/learning/experience/activity-lifecycle-state.ts`
- `src/lib/learning/experience/activity-completion-present.ts`
- `src/lib/learning/experience/universal-experience.unification.test.ts`
- `src/components/study/AdaptiveReturnStrip.tsx`

## Files changed

- `hub-adaptive-bridge.ts` / `core-adaptive-bridge.ts` (+ tests)
- `experience/index.ts`
- `ActivityWorkspace.tsx`
- `LearnerGrowthCenterPanel.tsx`
- `quiz-taker.tsx`, `flashcards-view.tsx`
- `entry-point.ts`
- `study-hub-productization.integrity.test.ts`, `present.test.ts`
- `e2e/canonical-adaptive.spec.ts`, `e2e/growth-center.spec.ts`

## Deferred

- Extract single `enterAdaptiveClosedLoop` client helper (Hub/CORE/ContinueLearningButton still parallel)
- Wire `activeRunId` into Study Now / CORE clients where missing
- Soften remaining “concept mastery” product jargon site-wide
- Full Coding/SQL/… browser rows (still 2P-24 matrix)

## Pre-existing issues

- CORE notebook hydration warnings
- Dev `core-touch-boot` Script overlay noise
- Topic vs Concept dual presenters (intentional)

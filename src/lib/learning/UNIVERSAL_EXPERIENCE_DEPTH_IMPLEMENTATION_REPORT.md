# UNIVERSAL_EXPERIENCE_DEPTH_IMPLEMENTATION_REPORT — 2P-37

## Completed

- Depth audit + quality contract documents.
- `experience-depth` pack: **13** companion challenges + **13** progression entries.
- Multi-level scaffolds (L1–L3) that do **not** reveal answers.
- Upgraded thin 2P-36 items (probability, geometry, authn/authz) with better scaffolds.
- Linear-equation-solving journey: UNDERSTAND → PRACTICE → CHALLENGE → RETAIN.

## Existing reused

Universal structured evaluation, progression catalog, scaffolding normalize, Adaptive-ready UA kinds, ConceptMastery pipeline, educational disclaimers (nursing), paper-only finance (untouched).

## Interaction types implemented/deepened

Explain, Justify, Diagnose, Troubleshoot, Calculate, Decide (tradeoff), Sequence/branch, Recall, Apply, Perform (prior GFCI), Simulate (reassess).

## Scaffolding

STEP / HINT / CHECKLIST with `doesNotRevealAnswer: true`; levels 1–3 ON_REQUEST.

## Misconceptions

Authn≠authz, APIPA≠DNS-first, PE destroyed, period trends reversed, stockout vs holding, strong-crank≠battery-first, false friends, distribution/sign errors.

## Variation

New numbers/scenarios (5x+4=2x−8; K vs Br; APIPA; demand 70; strong crank; falling book; cognate caution).

## Adaptive

Companions use Adaptive-ready kinds. Concept `linear-equation-solving` multi-stage verified in unit tests.

## Evidence/Mastery

Shared `recordEvidence` → ConceptMastery. Facets: EXPLAIN, SOLVE, APPLY, RETAIN, RECOGNIZE, PERFORM. Completion ≠ mastery preserved.

## Tests

| Suite | Result |
|-------|--------|
| `npx vitest run src/lib/learning` | **1596** passed / **143** files (exit 0) |
| experience-depth + domain-experience + universal-activity-depth | **43** passed / **3** files |
| `npm test` (full unit) | **2007** passed; **6** failed in **2** pre-existing LMS files (not 2P-37): `src/lib/lms/course-info/highlights.test.ts` (+ related schedule highlight assertions). Learning paths green. |
| `npm run build` | **PASS** (exit 0) |
| eslint experience-depth + domain-experience/catalog | **PASS** (max-warnings=0) |
| `npx prisma validate` | **PASS** |
| `npm run test:e2e` | **DEFERRED** this pass — not re-run; prior 2P-35 Lucky/Chromium path remained the last clean e2e baseline |

## Specialized runtime decisions

| Candidate | Decision |
|-----------|----------|
| CAS / algebra workspace | **SPECIALIZED RUNTIME JUSTIFIED** (future) — universal sufficient for educational rubric algebra |
| Network topology sandbox | **SPECIALIZED RUNTIME JUSTIFIED** (future) — text diagnose sufficient now |
| Speaking / ASR / TTS | **SPECIALIZED RUNTIME JUSTIFIED** (future) — reading/writing sufficient for language foundation |
| Virtual hardware / ECU | **SPECIALIZED RUNTIME JUSTIFIED** (future) |
| 3D anatomy / CAD / music-art | **DEFERRED** |
| Live brokerage | **FORBIDDEN** — edu market sufficient |
| Clinical decision support | **UNIVERSAL SUFFICIENT** for educational text scenarios only |

## Deferred

Full RETAIN for every 2P-36 concept; biology CHALLENGE; presentation speech measurement; full Playwright suite re-run this phase; product UI redesign; fixing pre-existing LMS `highlights.test.ts` failures (unrelated to 2P-37).

## Regressions

NONE in learning/ULE surfaces. Lab criteria ≥3 preserved. Pre-existing LMS highlight unit failures remain outside this phase scope.

## Architecture integrity

One ULE · One Learner Model · One Knowledge Model · One Evidence · One Mastery · One Orchestrator · One Tutor · One Adaptive · One Retention · CORE→SIX→LUCKY preserved.

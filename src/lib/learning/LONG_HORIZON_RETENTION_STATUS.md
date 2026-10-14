# 2P-52 Long-Horizon Retention — Status

## Status

**PASS WITH NOTES** — planned Study Haul roadmap phase closed.

## Verified

- Success spacing ladder (3d → 7d → 14d → 30d) with injectable clock
- Fail/partial short recheck intervals
- Read-side NOT_DUE / UPCOMING / DUE / OVERDUE + neutral labels
- Sync does not pull SUCCESS schedules earlier (SM-2 exception)
- GET ≠ evidence; submit → RETAIN → mastery path preserved
- Adaptive COMPLETE-only Lucky handoff preserved (E2E)
- Duplicate Adaptive COMPLETE does not duplicate RetentionItem (E2E)
- No FSRS / cron / decay engine / new gap enums
- Architecture remains CORE → SIX → LUCKY, one retention engine

## Validation snapshot (2P-52)

| Check | Result |
| --- | --- |
| Focused retention/growth/handoff unit | 79 passed |
| Learning suite | 1771 passed (158 files) |
| E2E (long-horizon + lucky + growth + security) | 10 passed |
| Full Vitest | 2185 passed; **6 pre-existing** fails (`weekly-college-grid`, `course-info/highlights`) |
| TypeScript | pass (after regenerating `.next` types) |
| Prisma validate/generate | pass |
| Next production build | pass |
| ESLint (touched) | pass |
| `npm run ci` | pass |

## Partially verified

- Full multi-week learner return UX in browser (simulated via DB `dueAt` + unit clocks)
- Growth “retention over months” narrative depth (factual notes only; no second timeline store)

## Deferred (not roadmap blockers)

- Deployment / physical-device hardening
- Richer longitudinal retention charts (presentation enhancement)
- Domain content expansion
- Unrelated pre-existing LMS schedule/highlights test debt

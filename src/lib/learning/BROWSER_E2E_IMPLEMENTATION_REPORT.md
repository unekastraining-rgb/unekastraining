# Browser E2E Implementation Report (2P-24)

## Verdict

**2P-24 STATUS: PASS WITH NOTES**

## Framework

Playwright `@playwright/test@1.51.1` (aligned with Next optional peer). Projects: `desktop-chromium`, `tablet` (iPad Mini), `mobile` (Pixel 7).

## Infrastructure inspected

- No prior Playwright/Cypress/Webdriver harness (2G-78 gap)
- Vitest + smoke scripts only for learning loops
- Auth gate: Next 16 `proxy.ts` + `sh_session` (`decodeSessionEdge`)
- Dev login: `POST /api/auth/login` (passwordless email)
- DB: Prisma LibSQL SQLite (`DATABASE_URL=file:…`)

## Files added

- `playwright.config.ts`
- `e2e/global-setup.ts`
- `e2e/helpers/auth.ts`
- `e2e/helpers/db.ts`
- `e2e/helpers/fixtures.ts`
- `e2e/helpers/session.ts`
- `e2e/canonical-adaptive.spec.ts`
- `e2e/growth-center.spec.ts`
- `e2e/core-smoke.spec.ts`
- `e2e/six-tutor-smoke.spec.ts`
- `e2e/security-recovery.spec.ts`
- `e2e/responsive.spec.ts`
- `src/lib/learning/BROWSER_E2E_LEARNER_JOURNEY.md`
- `src/lib/learning/BROWSER_E2E_IMPLEMENTATION_REPORT.md`

## Files changed

- `package.json` — `test:e2e`, `test:e2e:desktop`
- `.gitignore` — `e2e/data.db*`, `.seed.json`, playwright reports
- `src/lib/preferences.ts` — `getOrCreateUserPreferences` uses **upsert** (P0 race fix)
- `src/lib/learning/entry-point.integrity.test.ts` — harness presence (prior)
- Related learning integrity docs pointers (prior)

## Tests added (desktop)

| Spec | Coverage |
| --- | --- |
| `canonical-adaptive` | Hub → Orchestrator → Adaptive/lab → Launch≠Evidence → Attempt → Mastery; unauth redirect |
| `growth-center` | Read-only Growth → Adaptive/empty continuity |
| `core-smoke` | Note create → open Core → reopen content |
| `six-tutor-smoke` | SIX chunking; Teach Me soft; Hub browse ≠ evidence |
| `security-recovery` | Cross-user Adaptive deny; invalid run; empty submit disabled |
| `responsive` | Overflow + CTA reachability |

## Learner journeys verified

1. Canonical Study Hub → Orchestrator → Adaptive / lab evidence + mastery  
2. Growth Center → Adaptive continuity (no evidence on view)  
3. CORE save/reopen  
4. SIX + Tutor smokes  
5. Cross-user ownership  
6. Recovery / empty activity  
7. Responsive smoke  

## Activity coverage

- **Full E2E evidence path:** structured **lab** (`lab-network-connectivity` criteria via UI)
- Other matrix rows: documented / deferred (honest coverage — see journey doc)

## Evidence / mastery / Adaptive

- Launch does not create `LearningAttempt`
- UI submit creates attempt + updates `ConceptMastery` through existing pipeline
- Adaptive shell / bind / complete exercised when Hub or API start yields a run
- LUCKY asserted only when UI legally surfaces retention chrome

## Failures discovered

1. **Login wall** — `proxy.ts` requires session; early specs assumed open Study Hub  
2. **`reuseExistingServer`** risk — wrong process on :3100 (wrong DB/secret)  
3. **SESSION_SECRET mismatch** — encoding from developer `.env` vs E2E webServer  
4. **`UserPreferences` P2002** — concurrent `find`+`create` on first Study Hub load  
5. **Orchestrator race** — asserting Adaptive/empty while still in loading chrome  

## Fixes made

1. `loginViaApi` / `loginAsPage` via real `/api/auth/login`  
2. Fixed E2E `SESSION_SECRET`; `reuseExistingServer: false`  
3. Preferences **upsert** + seed `UserPreferences` rows  
4. Wait for `[data-hub-suggestion-loading]` to clear before CTA branching  
5. Shared `context.request` cookies for CORE / Adaptive API calls  

## Test results (this run)

- `npm run test:e2e:desktop` → **13 passed**
- `npx vitest run src/lib/learning` → **132 files / 1477 tests passed**

## Lint / TypeScript

- ESLint on `e2e/`, `playwright.config.ts`, `src/lib/preferences.ts` — **clean** (0 errors)
- `tsc --noEmit`: no new errors in owned E2E / preferences paths
- Pre-existing unrelated `tsc` issues remain in `notebook-desk.ts`, quiz offline fallback test, `resolve-loop-focus-topic.ts` (out of scope)

## Deferred

- Full Coding / SQL / Writing / Simulation Adaptive browser rows  
- Full SIX evaluate → Adaptive step bind deep E2E  
- CI pipeline wiring beyond npm scripts  
- Physical Safari / iPadOS / Apple Pencil  

## Pre-existing issues (not blocking PASS WITH NOTES)

- Next/React warning: `<Script id="core-touch-boot">` in `app/layout.tsx` (dev overlay noise)
- CORE notebook hydration mismatch on page sheet ids (smoke still passes)
- Background Moodle/syllabus AI 503 noise in server logs during unrelated LMS paths

## Architectural notes

No second evidence writer, mastery system, or recommendation engine. E2E exercises existing CSL Core → Six → Lucky contracts only.

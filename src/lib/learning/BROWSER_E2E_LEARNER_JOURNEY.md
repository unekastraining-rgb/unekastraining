# Browser E2E — Learner Journey (2P-24)

## E2E architecture

- **Framework:** Playwright (`@playwright/test` 1.51.1)
- **Config:** `playwright.config.ts`
- **Tests:** `e2e/*.spec.ts`
- **Helpers:** `e2e/helpers/{auth,db,fixtures,session}.ts`
- **Commands:**
  - `npm run test:e2e` — all projects (desktop + tablet + mobile where matched)
  - `npm run test:e2e:desktop` — Chromium desktop only
- **App under test:** dedicated `next dev` on **127.0.0.1:3100**
  - `reuseExistingServer: false` so E2E never attaches to a wrong local instance
  - `DATABASE_URL=file:e2e/data.db`
  - `SESSION_SECRET` = fixed E2E secret (see `e2e/helpers/session.ts`)

Preserve → Connect → Upgrade → Extend: no second evidence, mastery, or recommendation engine.

## Canonical learner journey

```text
Study Hub
  → Orchestrator suggestion chrome (settled; not loading)
  → Adaptive start/continue when Hub CTA exists
  → Adaptive run shell (concept preserved)
  → Structured lab activity (UI)
  → Launch ≠ LearningAttempt
  → Submit for evaluation → LearningAttempt
  → ConceptMastery (existing pipeline)
  → Optional Adaptive return / complete / LUCKY boundary when legal
```

Evidence is produced only by **Submit for evaluation** in the activity UI — never by seeding `LearningAttempt` / `ConceptMastery`.

## Authentication strategy

- Next 16 **`proxy.ts`** protects `/study`, `/core`, APIs, etc. — unsigned requests redirect to `/login` or 401.
- E2E signs in through **`POST /api/auth/login`** (`e2e/helpers/auth.ts`) with deterministic emails:
  - Learner A: `student@csl.local`
  - Learner B: `learner-b@csl.local`
- Server attaches `sh_session` with the E2E `SESSION_SECRET` (same as webServer).
- Fallback cookie helper `sessionCookieForUser` uses the same fixed secret (not the developer’s `.env`).
- Does **not** disable authorization globally.
- Unauthenticated access is asserted: `/study` → `/login`.

## Test-data strategy

- Isolated SQLite: `e2e/data.db` (gitignored) — never `dev.db` / production
- `e2e/global-setup.ts` → `prisma db push` (no `--force-reset`) + cascade wipe via `user.deleteMany`
- Seeds: User A/B, `UserPreferences`, LearningSpace, Concept, Course, Topic
- **Does not** seed `LearningAttempt` or `ConceptMastery`
- Seed ids: `e2e/.seed.json` (gitignored)

## How to run locally

```bash
npx playwright install chromium   # once
npm run test:e2e:desktop
```

Debug:

```bash
npx playwright test --project=desktop-chromium --debug
npx playwright show-report
```

## Activity coverage matrix

| Activity | Browser smoke | Evidence | Mastery | Adaptive |
| --- | --- | --- | --- | --- |
| Lab (structured) | **Yes** (canonical) | UI submit verified | ConceptMastery verified | Hub CTA + bind when run exists |
| Coding | Documented | Same spine | Same spine | Deferred full scenario |
| SQL | Documented | Same spine | Same spine | Deferred |
| Simulation | Smoke deferred | Same spine | Same spine | Deferred |
| Presentation | Smoke deferred | Same spine | Same spine | Deferred |
| Writing | Smoke deferred | Same spine | Same spine | Deferred |
| Quiz / Flashcard | Deferred | Existing adapters | Existing | Existing adapters |
| SIX | Smoke load (+ Teach Me soft path) | Soft when evaluate UI present | Contextual | Existing continue links |
| Tutor | Hub browse smoke | Ordinary browse ≠ evidence | Contextual | Existing behavior |
| CORE | Create/reopen API+UI | Not automatic | Not automatic | Existing bridge |
| LUCKY | Soft boundary after Adaptive complete | Retention when legal | Existing | Downstream only |
| Growth Center | **Yes** | Must stay 0 on view | Unchanged on view | Start/Continue when available |

## Evidence verification

- Count attempts for concept **before open**, **after open**, **after submit**
- Open must not increase count (**Launch ≠ LearningAttempt**)
- Submit must increase count via `/api/study/activities/lab`

## Mastery verification

- After legitimate submit: `ConceptMastery` exists with `reviewCount > 0`
- Lab maps to PERFORM; assert `perform > 0` **or** `reviewCount > 0` (no forged %)

## Adaptive verification

- Hub Adaptive CTA → `/study/adaptive/{runId}` when Orchestrator provides one
- Otherwise Adaptive start API may create a run for bind (same production API)
- Shell: `data-adaptive-run` / `data-adaptive-status`
- Invalid / foreign run → not-found semantics (HTTP 404 and/or no run shell)

## Growth Center verification

- `/study/learner-model` loads Growth surface (`data-growth-center-surface`)
- Viewing does not create attempts
- ContinueLearningButton enters Adaptive when focus exists; otherwise empty → Study Hub

## CORE verification

- Authenticated `POST /api/notes` with `contentJson` marker → `/core?noteId=` → `GET` retains marker
- No second document store

## SIX / Tutor verification

- `/study/six/chunking?conceptId=` loads
- Teach Me evaluate soft path when UI supports it
- Study Hub ordinary browse does not create evidence

## LUCKY boundary

- After Adaptive complete, assert retention chrome **only if** existing UI surfaces it
- Never force Lucky creation from the test

## Security tests

- User B cannot open User A’s Adaptive run (not found / no ACTIVE shell)
- User B cannot read A’s run via Adaptive API (401/403/404)
- Unauthenticated `/study` → login

## Responsive tests

- Desktop Chromium project always
- Tablet (iPad Mini) + Mobile (Pixel 7) projects match responsive / canonical / growth specs
- Assert no horizontal overflow; primary Orchestrator chrome reachable; touch-sized CTAs where present
- **Limitation:** does **not** prove physical-device Safari / iPadOS

## Known limitations

- Dev overlay (`core-touch-boot` Script warning) may appear; tests dismiss / reload when needed
- Gemini syllabus parse noise in logs (unrelated LMS background) — heuristic fallback used
- Full Coding/SQL/Writing/Simulation Adaptive E2E rows deferred
- Physical Apple Pencil / Safari not in scope
- CI wiring beyond local npm scripts deferred

## Regression

```bash
npx vitest run src/lib/learning
npm run test:e2e:desktop
```

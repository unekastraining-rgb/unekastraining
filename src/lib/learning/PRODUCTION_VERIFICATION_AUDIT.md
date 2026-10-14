# PRODUCTION_VERIFICATION_AUDIT — 2P-35

**Mode:** RELEASE VERIFICATION (not architecture)  
**Predecessor:** 2P-34 Production Hardening  
**Rule:** Audit first → verify with full suites → fix only genuine release blockers

---

## Classification

| Tag | Meaning |
|-----|---------|
| **P0** | Release blocker |
| **P1** | Important before release |
| **P2** | Useful, non-blocking |
| **VERIFIED** | Adequately covered by prior phase or existing tests |
| **DEFERRED** | Intentionally postponed |

---

## A. Unit / CI baseline

| Finding | Class |
|---------|-------|
| Full `npm test` not run in 2P-34 (learning-only 1580) | **P1** — must run this phase |
| Learning suite green post-2P-34 | VERIFIED (prior) |
| Full suite may include non-learning failures | Audit via run |

## B. Playwright baseline

| Finding | Class |
|---------|-------|
| Full `npm run test:e2e` not run in 2P-34 | **P1** — must run |
| `production-hardening.spec.ts` (6) desktop PASS | VERIFIED |
| Responsive tablet/mobile projects configured | VERIFIED (config); run this phase |
| Dedicated Lucky browser E2E missing | **P2** / candidate DEFERRED if unsafe |

## C. Adaptive / Activity / Evidence / Mastery

| Finding | Class |
|---------|-------|
| ACTIVE resume, terminal CAS, ownership, sanitize | VERIFIED (2P-34 + unit) |
| Duplicate completion coordinator reject | VERIFIED |
| Activity idempotency optional | VERIFIED (partial E2E) |
| Mastery algorithm unchanged | VERIFIED |

## D. CORE

| Finding | Class |
|---------|-------|
| 2P-2 + expectedUpdatedAt + owned links | VERIFIED (code + E2E stale 409) |
| Physical iPad / Safari WebKit | **DEFERRED** / NOT VERIFIED (hardware) |

## E. Auth / ownership / materials / LMS

| Finding | Class |
|---------|-------|
| SESSION_SECRET prod gate | VERIFIED |
| Cross-user notes / forged learnerId | VERIFIED |
| Material prepare/confirm ≠ evidence | VERIFIED (prior E2E + unit) |
| LMS token encryption at rest | **DEFERRED** (not P0 unless audit run finds leak) |

## F. Build / lint / DB

| Finding | Class |
|---------|-------|
| `npm run build` PASS after 2P-34 TS unblockers | VERIFIED — re-run |
| Prisma validate PASS; no new migration needed | VERIFIED — re-run |
| Full-repo `npm run lint` may have pre-existing noise | P2 — record honestly |

## G. Observability / no-evidence / loop

| Finding | Class |
|---------|-------|
| jsonErrorFromUnknown no secret leak | VERIFIED |
| Hub/Growth/CORE no-evidence E2E | VERIFIED |
| Canonical ULE loop single spine | VERIFIED |

## H. Accessibility / async polish

| Finding | Class |
|---------|-------|
| No dedicated a11y E2E / framework | **DEFERRED** / P2 |
| Blanket useEffect rewrite | Not desired — only concrete defects |

---

## Release-blocker candidates (pre-run)

**None identified from 2P-34 closure.**  
Blockers will only be declared if full Vitest/Playwright/build introduce genuine regressions.

## Planned actions this phase

1. Run full Vitest, Playwright, build, prisma validate, lint.  
2. Add Lucky E2E **only if practical** without second retention flow.  
3. Fix **only** P0/P1 release blockers / CI infra defects discovered by verification.  
4. Update PRODUCTION_READINESS.md with honest matrix.  
5. **STOP** — do not start 2P-36.

### Post-run notes

- P0 ULE blockers: **NONE** found.  
- Pre-existing non-ULE unit fails (schedule grid, LMS highlights): **DEFERRED** / not release-blocking for ULE.  
- Tablet WebKit missing → switched to Chromium iPad viewport (**P1** CI infra).  
- Lucky browser E2E added and **PASS** on full suite run.

**Audit complete — verification executed.**

# PRODUCTION_READINESS — 2P-51

Production-readiness after full hardening + validation.

Labels:

| Label | Meaning |
|-------|---------|
| **VERIFIED** | Demonstrated by tests/build this phase |
| **PARTIALLY VERIFIED** | Limited environment coverage |
| **NOT VERIFIED** | Important capability not actually tested |
| **DEFERRED** | Intentionally postponed |
| **KNOWN LIMITATION** | Documented constraint (not a silent failure) |

Architecture remains frozen:

**CORE → SIX → LUCKY**

**ONE ULE · ONE Learner Model · ONE Knowledge Model · ONE Evidence spine · ONE Mastery · One Orchestrator · ONE Adaptive · ONE Retention**

---

## Production readiness matrix

| Area | Status | Notes |
|------|--------|-------|
| Auth/session HMAC | VERIFIED | SESSION_SECRET prod gate; E2E login |
| Passwordless email login | KNOWN LIMITATION | Suitable for personal deploy; **blocker for public multi-tenant** |
| Login rate limit | VERIFIED | Process-local 60/min/IP (2P-51) |
| Ownership/security | VERIFIED | production-hardening + security-recovery + school/project E2E |
| LearningAttempt → Mastery | VERIFIED | Activity submit paths; client forgery rejected in E2E |
| Adaptive terminal / ownership | VERIFIED | Unit + E2E |
| LUCKY / Retention | VERIFIED | GET ≠ evidence; handoff after Adaptive COMPLETED |
| CORE persistence | VERIFIED | Autosave, 409, local draft (2P-50) |
| Multi-file projects | VERIFIED | Note-backed; isolated file saves; foreign 404 |
| LMS / Calendar failures | PARTIALLY VERIFIED | Sync fail ≠ mastery E2E; **tokens sealed at rest (2P-53 + calendar seal)** |
| AI failover | PARTIALLY VERIFIED | Chain documented; live provider keys NOT VERIFIED in CI |
| Database | VERIFIED | prisma validate; migrate deploy preferred in entrypoint |
| Docker schema apply | VERIFIED | migrate deploy preferred; no default `--accept-data-loss` |
| Build | VERIFIED | `npm run build` |
| Unit / learning suites | VERIFIED | Full Vitest green after 2P-53 debt fix |
| E2E Chromium | PARTIALLY VERIFIED | Desktop + viewport; flakes possible |
| CI (GitHub Actions) | VERIFIED | `.github/workflows/ci.yml` + `npm run ci` |
| Accessibility | PARTIALLY VERIFIED | Focused surface labels/touch targets; no axe suite |
| Responsive | PARTIALLY VERIFIED | Chromium tablet/mobile viewports |
| Physical iPad/Safari | NOT VERIFIED | Emulation ≠ hardware |
| Observability | PARTIALLY VERIFIED | Server `console.error` + safe client JSON; no APM |
| LMS / Calendar token encryption | VERIFIED | AES-GCM via SESSION_SECRET; legacy plaintext readable |
| Distributed rate limiting | DEFERRED | Process-local only — OK for private/beta |
| Private/beta runbook | VERIFIED | [PRIVATE_BETA_DEPLOYMENT.md](./PRIVATE_BETA_DEPLOYMENT.md) |

---

## Required production environment variables

| Variable | Class |
|----------|--------|
| `SESSION_SECRET` | **Required** — strong random; no weak fallback in production |
| `DATABASE_URL` | **Required** — persistent volume path on Fly |
| `NEXT_PUBLIC_APP_URL` | **Required** for OAuth/public URL |
| `DATA_DIR` | Recommended on Fly (`/data`) |
| `AI_PROVIDER_CHAIN` + provider keys | Optional AI |
| LMS / Google OAuth secrets | Optional integrations |
| `ALLOW_DB_DATA_LOSS` | **Unsafe** — opt-in only for emergency schema push |
| `SESSION_COOKIE_SECURE` | Optional; do not set `"false"` on HTTPS production |

See `.env.example` and [CI.md](./CI.md).

---

## Release checklist

### Code
- [ ] `npx prisma validate`
- [ ] `npx tsc --noEmit`
- [ ] `npm run test:learning`
- [ ] `npm run ci` (or GitHub Actions)
- [ ] `npm run build`

### Security
- [ ] Strong `SESSION_SECRET` set
- [ ] No secrets in repo / API responses
- [ ] Ownership E2E green
- [ ] Accept passwordless login risk **or** plan real auth before multi-tenant

### Learning
- [ ] Evidence → mastery paths intact
- [ ] Adaptive terminal rules intact
- [ ] LUCKY not fed by false completion

### Product
- [ ] CORE save/reload
- [ ] Projects file isolation
- [ ] Study Hub / school workflow smoke

### Deployment
- [ ] Persistent volume
- [ ] migrate deploy path
- [ ] Health via HTTPS force on Fly

---

## Explicit statements

- **No Prisma migration required** for 2P-51.
- Application is **not** labeled “fully production ready” for public multi-tenant without password auth and distributed abuse controls.
- Personal/self-host Fly deploy remains the supported production shape **with notes**.

See also: [SECURITY_AUDIT.md](./SECURITY_AUDIT.md), [CI.md](./CI.md), [VALIDATION_MATRIX.md](./VALIDATION_MATRIX.md).

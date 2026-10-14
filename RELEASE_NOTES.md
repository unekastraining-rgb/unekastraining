# Study Haul — Release Notes

## 0.2.0-beta.1 — Controlled beta operations & learner feedback

Architecture remains frozen: **CORE → SIX → LUCKY** (roadmap closed through 2P-53).

### Ready for

- Personal / private deployment
- **PRIVATE / CONTROLLED LIMITED BETA** (trusted users; prefer Google OAuth when possible)

### Not ready for

- Unrestricted public multi-tenant SaaS (passwordless login + process-local rate limits)

### Major learning-system capabilities

- Adaptive Orchestrator sequences with ownership-scoped runs
- CORE notebook artifacts + local draft recovery (draft ≠ LearningAttempt)
- SIX activity suite + Tutor (text; voice modality accept-only)
- LUCKY retention with long-horizon spacing (3d→7d→14d→30d)
- Learner Growth Center continuity (no parallel recommender)
- Evidence → ConceptMastery (single mastery path)
- LMS + Calendar OAuth tokens sealed at rest (AES-GCM via `SESSION_SECRET`)

### Content breadth

- Multi-domain content packs + progression stages (see live `CONTENT_COVERAGE.md`)
- STEM, humanities, trades, healthcare, finance, hospitality, education, and related domains expanded through post-roadmap depth passes

### Controlled-beta ops (this release)

- Study Hub first-time start CTAs (`Add a class` / `Start learning now` / `Open Lucky retention`)
- Compact beta feedback widget on Study Hub (`BetaFeedback` — categories CONFUSING…GREAT/OTHER; **not** evidence/mastery)
- Structured ops event logging (`auth` / `activity` / `adaptive` / `core.save.conflict` / `ai.provider` / `lms.sync` / `server`)
- Operator health probe: `GET /api/ops/health` (app, DB, config presence flags, package version)
- Compact controlled-beta smoke E2E (`e2e/controlled-beta-smoke.spec.ts`)

### Beta readiness

- Architecture frozen; CORE → SIX → LUCKY intact
- Automated suites (Vitest / learning / E2E Chromium / TypeScript / Prisma / build / CI) are the validation basis for **controlled** beta only
- Tests alone do **not** equal public multi-tenant readiness

### Known validation gaps (not claimed)

- Physical iPad / Safari / Pencil not verified in CI
- WebKit / Firefox Playwright projects not configured
- No axe WCAG certification suite
- Live LMS OAuth against production campuses not validated here
- Live multi-provider AI outage paths not validated against real quotas in CI
- Full production volume restore drill (procedure documented; live restore **NOT VERIFIED** unless operators run it)
- Live Fly secret values / mounted volume contents are operator-verified at deploy time (not inferred from repo tests alone)

### Known product enhancements (deferred)

- Server-side activity drafts / mid-project server resume beyond CORE Note multi-file
- PPT/PPTX text extraction
- Tutor voice STT/TTS runtime
- Richer instrumented labs
- Further content depth in thin domains

### Public SaaS blockers

- Stronger authentication than passwordless email
- Distributed rate limiting across replicas
- Multi-replica abuse controls

### Ops

See `src/lib/learning/PRIVATE_BETA_DEPLOYMENT.md` for secrets, volume, backup, recovery, and health verification.
See `CONTENT_COVERAGE.md` for live domain coverage measurements.

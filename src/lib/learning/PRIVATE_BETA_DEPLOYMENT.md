# Private / Limited-Beta Deployment

Controlled deployment for **personal use** or a **small trusted beta** — not unrestricted public multi-tenant SaaS.

Architecture remains frozen: **CORE → SIX → LUCKY** (closed through 2P-53).

**Release:** `0.2.0-beta.1` (see `package.json` / `RELEASE_NOTES.md`).

---

## Target posture

| Posture | Status |
| --- | --- |
| Personal / private deploy | **READY** (with checklist below) |
| Controlled limited beta (trusted users) | **READY** if you accept passwordless email risk **or** use Google OAuth only among invitees |
| Public multi-tenant SaaS | **NOT READY** — passwordless auth + process-local rate limits |

---

## Required secrets / env

Set via host secrets (Fly: `fly secrets set`). Never commit real values.

| Variable | Required | Notes |
| --- | --- | --- |
| `SESSION_SECRET` | **Yes** | Long random (≥32 chars). Rejected if missing/weak in production. Also seals LMS + Calendar OAuth tokens at rest. **Changing it invalidates sealed tokens** (users re-connect LMS/Calendar). |
| `DATABASE_URL` | **Yes** | On Fly volume: `file:/data/dev.db` (see `fly.toml`) |
| `NEXT_PUBLIC_APP_URL` | **Yes** | Public HTTPS origin (OAuth redirects + build-arg) |
| `DATA_DIR` | Recommended | `/data` on Fly — uploads + persistent files |
| `GEMINI_API_KEY` / chain keys | Optional | AI offline-safe without keys |
| `GOOGLE_CLIENT_ID` / `SECRET` | Optional | Prefer for limited beta sign-in |
| `ALLOW_DB_DATA_LOSS` | **Never** for normal deploys | Opt-in destructive only |

Do **not** set `SESSION_COOKIE_SECURE=false` in production (ignored; secure cookies follow HTTPS).

### Health probe config flags

`GET /api/ops/health` reports **presence** of `SESSION_SECRET` (≥16 chars), `DATABASE_URL`, and `NEXT_PUBLIC_APP_URL` as booleans — never values or connection strings.

---

## Database & persistence

- **Engine:** SQLite via Prisma (libsql adapter) at `DATABASE_URL`.
- **Must persist across deploys:** DB file on a durable volume (`/data/dev.db` on Fly) + `DATA_DIR` uploads.
- **Ephemeral disk only:** learners lose notes, mastery, LMS seals, and beta feedback — do not run production beta without a volume.

---

## Before deployment

1. Strong `SESSION_SECRET` prepared (password manager).
2. `NEXT_PUBLIC_APP_URL` matches the real public URL.
3. Fly volume exists in the same region as `primary_region` (`studyhaul_data` → `/data`).
4. Run locally / CI:
   - `npm run ci`
   - Confirm full Vitest is green (`npm test` / CI unit job)
5. **Backup** existing `/data/dev.db` if redeploying over live data (see Backup).
6. Confirm `ALLOW_DB_DATA_LOSS` is unset / `0`.

---

## Migration procedure

Entrypoint (`scripts/docker-entrypoint.sh`):

1. Prefers `prisma migrate deploy` when migration SQL exists (additive only for beta — e.g. `BetaFeedback`).
2. Else `prisma db push` **without** `--accept-data-loss`.
3. Starts `npm start` on port 3000.

**Do not** run destructive resets or `--accept-data-loss` for normal beta deploys.

### Fresh vs existing database (P3005)

| Situation | Expected behavior |
| --- | --- |
| **New Fly volume** (empty `/data/dev.db` or first boot) | `prisma migrate deploy` applies migration history — **correct production path** |
| **Volume already managed by migrate deploy** | Subsequent deploys apply only pending migrations |
| **Local `dev.db` created via `db push` without `_prisma_migrations`** | `migrate deploy` may return **P3005** (“schema is not empty”). This is a **local/baselining state issue**, not a reason to weaken the production entrypoint |
| **Production volume that was only ever `db push`’d (no migration history)** | Boot via entrypoint `migrate deploy` will fail until the DB is **baselined** (see below). Do **not** use `--accept-data-loss` to “fix” it |

**Do not change the entrypoint to skip `migrate deploy` just because a developer laptop hit P3005.**

#### Baselining an existing non-empty DB (manual, non-destructive)

Only if a durable volume already has schema but no Prisma migration history (rare for clean Fly first boots):

1. **Backup** `/data/dev.db` first.
2. On a maintenance shell with the same `DATABASE_URL`, mark applied migrations as resolved (Prisma baselining docs) — e.g. `prisma migrate resolve --applied <migration_name>` for each historical migration that matches the live schema — **without** resetting data.
3. Confirm `prisma migrate deploy` exits 0.
4. Redeploy.

If unsure whether the live volume has `_prisma_migrations`, inspect via `fly ssh` / sftp **before** a risky redeploy. Empty / migrate-managed volumes need no baselining.

---

## Deploy (manual — do not automate destructively)

```bash
fly secrets set \
  SESSION_SECRET="…" \
  NEXT_PUBLIC_APP_URL="https://YOUR_APP.fly.dev" \
  GEMINI_API_KEY="…"   # optional

fly deploy --build-arg NEXT_PUBLIC_APP_URL=https://YOUR_APP.fly.dev
fly open
```

Fly: `force_https = true`, volume mount `/data`.

**This guide documents the procedure; it does not auto-deploy.**

---

## After deployment smoke

1. Authenticate (`/login` or Google OAuth).
2. Study Hub loads (`/study`) with start-learning CTAs + feedback widget.
3. CORE: create/edit → save → reload (artifact persists).
4. Adaptive: start → activity submit → LearningAttempt → ConceptMastery.
5. LUCKY: GET does not create evidence; submit creates RETAIN when due.
6. Growth Center continuity loads.
7. Project multi-file save/reload if used.
8. LMS connect (if configured) — tokens sealed; list GET omits tokens.
9. `GET /api/ops/health` → `status: ok` (or investigate `degraded`/`error`).
10. Optional: submit beta feedback once — confirm row in `BetaFeedback` (does **not** create LearningAttempt).

---

## Health verification

```bash
curl -sS https://YOUR_APP.fly.dev/api/ops/health
```

Expect JSON with `version`, `checks.app`, `checks.database`, config **booleans**, and `checkedAt`. HTTP **503** only when database check fails. Never expect secrets in the body.

**Access model:** `GET /api/ops/health` is intentionally **unauthenticated** so load balancers / operators can probe liveness. It returns presence flags only (never secret values, connection strings, or stack traces). It is not a learner admin console.

### Structured ops logs (stdout)

One-line JSON events (no secrets / tokens / raw learner content):

| Event | Meaning |
| --- | --- |
| `auth.failure` | Session/unauthorized on gated API |
| `activity.failure` | Activity submit failed |
| `adaptive.failure` | Adaptive start/run failure |
| `core.save.conflict` | Stale CORE/note optimistic save (409) |
| `ai.provider.failure` | AI provider chain exhausted |
| `lms.sync.failure` | LMS sync failed |
| `server.error` | Unexpected server error (safe client message) |
| `beta.feedback.created` | Feedback saved (category only in meta) |
| `ops.health.check` | Health probe ran |

---

## Backup

**Where data lives (Fly):** volume `studyhaul_data` → `/data/dev.db` (+ uploads under `DATA_DIR`).

**Before migrations / risky deploys:**

```bash
# Copy DB off the machine (example)
fly ssh console -C "ls -la /data"
fly sftp get /data/dev.db ./backups/dev-$(date +%Y%m%d).db
```

Or snapshot the volume via Fly dashboard / `fly volumes` tooling for your plan.

**When:** before schema changes, before `SESSION_SECRET` rotation, before major deploys, weekly for active beta.

---

## Recovery / rollback

1. Stop accepting traffic if needed (`fly scale count 0` or machine stop).
2. Restore `dev.db` to `/data/dev.db` (sftp put / volume restore).
3. Redeploy the known-good app image if the app binary is bad (Fly image rollback / redeploy prior release).
4. **Do not** run `prisma db push --accept-data-loss` or reset commands.
5. Re-check smoke list + `/api/ops/health` above.

If sealed LMS/Calendar tokens fail after secret rotation: users reconnect integrations (expected).

### Restore drill status

| Step | Status |
| --- | --- |
| Backup procedure documented | **DOCUMENTED** |
| Recovery procedure documented | **DOCUMENTED** |
| Full restore of a live beta volume executed in this audit environment | **NOT VERIFIED** — do not claim a live restore was tested unless you ran it on a safe copy |

Operators should perform a one-time restore drill on a **copy** of `dev.db` before inviting learners if possible.

---

## Auth boundary (honest)

- HMAC-signed `sh_session` cookie: httpOnly, sameSite=lax, Secure on HTTPS production.
- Passwordless email login remains: **anyone who can receive that email can enter that account**.
- Suitable for **you + trusted invitees**. Not suitable for open internet registration.
- Google OAuth (optional) is preferable for limited beta when configured.

## Rate limiting (honest)

- Login: process-local ~60/min/IP.
- Fine for one machine / private beta.
- **Not** distributed across many replicas — public abuse protection is future work.

## LMS / Calendar credentials

- LMSConnection + CalendarConnection tokens sealed at rest (`enc:v1:` AES-256-GCM via `SESSION_SECRET`).
- Legacy plaintext still readable until next save.
- Never logged as plaintext; LMS list GET omits tokens.
- Moodle owner-session credentials GET exists only for campus browser sync.

## Beta feedback data minimization

- Stores: category, short comment (≤800 chars), optional surface/activityRef, timestamp, owning `userId`.
- Does **not** store passwords, tokens, raw audio, or provider credentials.
- Does **not** write LearningAttempt, ConceptMastery, or Learner Model fields.

---

## Current known limitations

- Physical iPad / Safari / WebKit / Firefox / axe WCAG not certified in CI
- Live campus LMS OAuth and live AI quota paths not assumed validated by this repo alone
- Passwordless email + process-local rate limits block public multi-tenant posture
- Tutor voice runtime, PPT extraction, server activity drafts remain deferred product work

---

## Related docs

- [RELEASE_NOTES.md](../../RELEASE_NOTES.md) — beta version + readiness claims
- [DEPLOY-PERSONAL.md](../../DEPLOY-PERSONAL.md) — Fly first-time setup
- [DEPLOY.md](../../DEPLOY.md) — general checklist
- [PRODUCTION_READINESS.md](./PRODUCTION_READINESS.md)
- [SECURITY_AUDIT.md](./SECURITY_AUDIT.md)
- [LONG_HORIZON_RETENTION.md](./LONG_HORIZON_RETENTION.md) — 2P-52 must stay intact

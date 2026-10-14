# CI — 2P-51

## Local

```bash
npm run ci
```

Runs:

```text
prisma validate → prisma generate → tsc → learning vitest
→ production-readiness + production-hardening + rate-limit tests
→ production build
```

Additional:

```bash
npm run test:learning   # src/lib/learning only
npm run ci:unit         # full vitest (may include 6 known non-ULE fails)
npm run test:e2e:desktop
```

## GitHub Actions

Workflow: `.github/workflows/ci.yml`

| Job | Purpose |
|-----|---------|
| `validate` | Required gate: install, prisma, tsc, learning tests, focused 2P-51 tests, build |
| `unit-full` | `continue-on-error: true` — full vitest; documents known schedule/LMS highlight fails |

**No production secrets** in CI. Uses test `SESSION_SECRET` and local SQLite `file:./ci.db`.

E2E is **not** in the default CI job (Playwright browsers + longer runtime). Run desktop E2E locally or add a separate workflow with browsers when desired.

## Environment for CI

| Variable | Value |
|----------|--------|
| `DATABASE_URL` | `file:./ci.db` |
| `SESSION_SECRET` | CI-only non-production string |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` |
| `NODE_ENV` | `test` (build step uses `production`) |

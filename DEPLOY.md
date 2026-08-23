# Study Haul — deployment checklist

Use this when deploying beyond local development.

## 1. Environment variables

Copy `.env.example` to `.env` (or configure secrets in your host) and set:

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | Yes | SQLite file path for small deploys, or a hosted DB URL if you migrate off SQLite. |
| `SESSION_SECRET` | Yes | Long random string — **change from the dev default**. |
| `NEXT_PUBLIC_APP_URL` | Yes | Public origin, e.g. `https://studyhaul.example.com`. Used for OAuth redirects. |
| `AI_PROVIDER_CHAIN` | Recommended | Free fallback order, e.g. `gemini,groq,openrouter`. |
| `GEMINI_API_KEY` | Yes (for AI) | Free tier at [Google AI Studio](https://aistudio.google.com/apikey). |
| `GROQ_API_KEY` / `OPENROUTER_API_KEY` | Optional | Extra free fallbacks when Gemini quota is hit. |
| `OPENAI_API_KEY` | Optional | Paid — not used unless you add `openai` to the chain. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Optional | Sign-in, Google Classroom LMS, Google Calendar sync. |
| `CANVAS_*` / `BLACKBOARD_*` | Optional | LMS OAuth if you use those integrations. |

## 2. Database

```bash
npm install
npx prisma generate
npx prisma db push
```

If the calendar shows **"Failed to load calendar"** after pulling new code, your SQLite file is probably behind the Prisma schema — run `npx prisma db push` again.

For production schema changes, prefer `prisma migrate deploy` once you adopt migrations.

## 3. Build and run

```bash
npm run build
npm start
```

Default port is `3000`. Set `PORT` if your platform requires it.

**Personal deploy (iPhone + iPad + Windows + Android):** see [DEPLOY-PERSONAL.md](./DEPLOY-PERSONAL.md) for Fly.io with a persistent disk (~$0–5/mo).

## 4. Google OAuth redirect URIs

In [Google Cloud Console](https://console.cloud.google.com/), add these **authorized redirect URIs** (replace with your `NEXT_PUBLIC_APP_URL`):

- `{APP_URL}/api/auth/google/callback`
- `{APP_URL}/api/calendar/google/oauth/callback`
- `{APP_URL}/api/lms/oauth/callback`

Calendar sync requests write scopes (`calendar.events`). Users who connected under read-only sync must **reconnect Google Calendar** in Settings after upgrading.

## 5. LMS OAuth

Canvas / Blackboard callbacks use `{APP_URL}/api/lms/oauth/callback`. Configure the same URL in each LMS developer console.

## 6. Smoke tests

```bash
npm test
```

Runs unit tests for hub routing helpers, Six recommendation logic, and notification preferences.

## 7. Post-deploy verification

- [ ] Sign in (or default user loads on `/dashboard`)
- [ ] Add or import a course; assignments appear on the hub schedule tab
- [ ] Study Now builds a session from `/study`
- [ ] Google Calendar connect + sync (if enabled)
- [ ] LMS connect + sync (if enabled)
- [ ] Global search returns hub deep links for assignments

## 8. Known intentional routes

- `/planner` and `/assignments` redirect to `/dashboard` (hub is home).
- `/calendar` remains a full calendar workspace; the hub schedule tab is the primary surface.

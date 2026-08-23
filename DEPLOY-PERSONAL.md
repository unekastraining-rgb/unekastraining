# Deploy Study Haul for yourself (all devices)

Use this when you want **one URL** you can open on iPhone, iPad, Mac, Windows, and Android — not just on your home Wi‑Fi.

**Recommended host:** [Fly.io](https://fly.io) — free tier is enough for personal use; includes a **persistent volume** for your database and uploaded PDFs.

**Typical cost:** **$0–5/month** for one person (Fly free allowance + Gemini free API). You only pay if you exceed free limits or want the machine always on.

---

## What you need before starting

1. A [Fly.io](https://fly.io) account (credit card may be required; small personal apps often stay on free allowance).
2. A **Gemini API key** (free): https://aistudio.google.com/apikey
3. A long random **session secret** (any password generator, 32+ characters).
4. (Optional) **Google OAuth** if you want Google sign-in — configure after you know your public URL.

---

## 1. Install Fly CLI

```bash
curl -L https://fly.io/install.sh | sh
fly auth login
```

---

## 2. Pick your app name and region

Edit `fly.toml` if you want a different app name (must be globally unique):

```toml
app = 'your-unique-name-here'
primary_region = 'iad'   # or lax, ord, etc. — pick closest to you
```

---

## 3. Create the persistent disk (once)

Use the **same region** as `primary_region` in `fly.toml`:

```bash
fly volumes create studyhaul_data --region iad --size 1
```

---

## 4. Set secrets

Replace values below. Your public URL will be `https://YOUR_APP_NAME.fly.dev`.

```bash
fly secrets set \
  SESSION_SECRET="paste-a-long-random-string" \
  GEMINI_API_KEY="your-gemini-key" \
  NEXT_PUBLIC_APP_URL="https://YOUR_APP_NAME.fly.dev"
```

`NEXT_PUBLIC_APP_URL` must match your real Fly URL (used for OAuth redirects later).

---

## 5. Deploy

Pass the public URL at **build** time so the client bundle is correct:

```bash
fly deploy --build-arg NEXT_PUBLIC_APP_URL=https://YOUR_APP_NAME.fly.dev
```

First deploy takes a few minutes. When it finishes:

```bash
fly open
```

Sign in at `/login` — your account works from any device at that URL.

---

## 6. Google OAuth (optional)

In [Google Cloud Console](https://console.cloud.google.com/), add redirect URIs using your Fly URL:

- `https://YOUR_APP_NAME.fly.dev/api/auth/google/callback`
- `https://YOUR_APP_NAME.fly.dev/api/calendar/google/oauth/callback`
- `https://YOUR_APP_NAME.fly.dev/api/lms/oauth/callback`

Then:

```bash
fly secrets set \
  GOOGLE_CLIENT_ID="..." \
  GOOGLE_CLIENT_SECRET="..."
```

Redeploy if needed: `fly deploy`

---

## 7. Custom domain (optional)

```bash
fly certs add study.yourdomain.com
```

Point DNS to Fly as instructed, then update:

```bash
fly secrets set NEXT_PUBLIC_APP_URL=https://study.yourdomain.com
fly deploy --build-arg NEXT_PUBLIC_APP_URL=https://study.yourdomain.com
```

---

## Day-to-day

| Task | Command |
|------|---------|
| Redeploy after code changes | `fly deploy --build-arg NEXT_PUBLIC_APP_URL=https://YOUR_APP_NAME.fly.dev` |
| View logs | `fly logs` |
| SSH into machine | `fly ssh console` |
| Check disk | Volume is mounted at `/data` (DB + uploads) |

---

## Cold starts

On the free tier, Fly **stops** your app when idle. The first visit after a while may take **10–30 seconds** to wake up. For always-on, set `min_machines_running = 1` in `fly.toml` (may incur small monthly cost).

---

## Why not Vercel?

This app uses **SQLite + local PDF files**. Serverless hosts reset disk on each request, so your data would disappear. Fly’s **volume** keeps one database and upload folder for all your devices.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Calendar / DB errors after deploy | `fly ssh console` → `npx prisma db push` (entrypoint should run this automatically) |
| OAuth redirect mismatch | `NEXT_PUBLIC_APP_URL` must exactly match browser URL (including `https://`) |
| AI not working | Check `GEMINI_API_KEY` with `fly secrets list` |
| Uploads missing after redeploy | Ensure volume is mounted (`fly volumes list`) |

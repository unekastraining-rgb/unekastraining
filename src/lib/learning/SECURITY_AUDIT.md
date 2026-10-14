# SECURITY_AUDIT — 2P-51

## Authentication

| Control | Status |
|---------|--------|
| HMAC session cookie `sh_session` | VERIFIED |
| Production rejects weak/missing `SESSION_SECRET` | VERIFIED |
| Dev default user blocked when `NODE_ENV=production` | VERIFIED |
| Passwordless email login | **KNOWN LIMITATION** — anyone with an email can obtain that account’s session |
| Login rate limit (60/min/IP, process-local) | VERIFIED (2P-51) |
| LMS tokens sealed at rest (AES-GCM / SESSION_SECRET) | VERIFIED (2P-53) |
| GET `/api/lms/connect` omits tokens | VERIFIED |
| Moodle credentials GET (owner session only, for browser sync) | INTENTIONAL — decrypts for owner; not a public leak |
| Google OAuth (optional) | PARTIALLY VERIFIED (code path; live OAuth NOT VERIFIED in CI) |

## Authorization

Server-side ownership via session user for Notes, Projects, Courses, Assignments, Materials, Adaptive runs, LearningAttempts, RetentionItems, LMS connections.

Client `userId` / `ownerId` / `learnerId` ignored on hardened learning routes.

Foreign resource access → 403/404 (E2E coverage across production-hardening, security-recovery, school-lms, artifact-persistence).

## Secrets

- Not committed (placeholders in `.env.example` only)
- LMS tokens omitted from `GET /api/lms/connect`
- AI keys not returned to clients
- **VERIFIED (2P-53):** LMS connection tokens sealed at rest (`enc:v1:` AES-256-GCM keyed from `SESSION_SECRET`); legacy plaintext still readable
- **VERIFIED (release prep):** Google CalendarConnection tokens use the same seal helpers

## Learning integrity

- Client cannot mint ConceptMastery / LearningAttempt outcomes
- Activity submit remains authoritative evidence path
- Artifact edit / LMS sync / calendar ≠ evidence
- Adaptive COMPLETED → retention bridge only (existing contract)

## API error hygiene

`jsonErrorFromUnknown` returns safe client messages; details logged server-side.

## Abuse

| Control | Status |
|---------|--------|
| Login throttle | VERIFIED (process-local) |
| AI / upload distributed limits | DEFERRED |
| Avatar size cap | VERIFIED (`MAX_AVATAR_BYTES`) |

## Production blockers (multi-tenant public)

1. Passwordless login  
2. No distributed rate limiting  
3. Plaintext tokens at rest  

## Non-blocking for personal deploy

Missing APM, full a11y suite, physical iPad, LMS encryption (with volume access control).

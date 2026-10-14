# PRODUCTION_HARDENING_AUDIT — 2P-34

**Status:** Complete before implementation changes  
**Mode:** PRESERVE → HARDEN → VERIFY → DOCUMENT  
**Scope:** Reliability/security/recovery — not feature expansion or ULE rewrite

---

## Classification legend

| Tag | Meaning |
|-----|---------|
| **P0** | Learner/data integrity or major security/usability failure |
| **P1** | Production reliability risk |
| **P2** | Polish / coverage improvement |
| **DEFERRED** | Valid but not required for this phase |
| **ALREADY HARDENED** | Existing safeguards (2P-2, Adaptive lifecycle, sanitize, etc.) |

---

## A. CORE reliability

| Finding | Class |
|---------|-------|
| Save generation, hydrate safeguards, SketchLayer ResizeObserver/0×0, non-passive touch (2P-2) | ALREADY HARDENED |
| Notes PATCH last-write-wins (no expectedUpdatedAt) | P1 |
| Opaque contentJson size/schema uncapped | P2 |
| Physical iPad/Pencil hardware | DEFERRED |

## B. Adaptive reliability

| Finding | Class |
|---------|-------|
| Start resumes ACTIVE; COMPLETED/ABANDONED terminal; step CAS; attempt idempotency | ALREADY HARDENED |
| `transitionRunStatus` may not CAS on ACTIVE → concurrent complete + double Lucky handoff | P1 |
| Multiple ACTIVE runs per concept allowed by design | DEFERRED / P2 |

## C. Activity reliability

| Finding | Class |
|---------|-------|
| sanitizeClientActivitySubmission + serverAuthoritative evidence | ALREADY HARDENED |
| Client submitting guard | ALREADY HARDENED |
| No server idempotency key → double POST can double evidence | P1 |
| Submit setState after unmount | P2 |

## D–E. Evidence / Mastery

| Finding | Class |
|---------|-------|
| Ownership at authoritative boundary; forgery stripping tests | ALREADY HARDENED |
| recordEvidence trusts envelope (safe if all writers gated) | P2 |

## F. LUCKY handoff

| Finding | Class |
|---------|-------|
| Soft-fail; COMPLETED-only; no mastery invent | ALREADY HARDENED |
| Dedicated Lucky E2E soft-only | DEFERRED |
| Double complete race couples with Adaptive P1 | P1 |

## G. Auth / session

| Finding | Class |
|---------|-------|
| Session cookie HMAC; prod requires session user | ALREADY HARDENED (shape) |
| Fallback `SESSION_SECRET` default if unset | **P0** |
| Many routes map Unauthorized → 500 not 401 | P1 |

## H. Ownership / security

| Finding | Class |
|---------|-------|
| Adaptive/activities/materials ignore forged learnerId | ALREADY HARDENED |
| Notes POST/PATCH accept courseId/materialId/topicId without ownership check | **P0** |
| Material/assignment/LMS ownership on study paths | ALREADY HARDENED |
| LMS token encryption at rest | DEFERRED |

## I–J. Concurrency / error-retry

Client save gen / Adaptive busy / ContinueLearning starting: ALREADY HARDENED.  
Systematic auto-retry: DEFERRED. Adaptive terminal transition + activity idempotency: P1.

## K–O. Loading / resume / responsive / a11y / performance

Mostly ALREADY HARDENED or P2. No visualViewport (P2). Tablet E2E is Chromium iPad profile, not Safari WebKit (**HARDWARE-UNVERIFIED** / DEFERRED).

## P–T. E2E / CI / build / deferred 2P-30–33

Scripts: `build`, `test`, `test:e2e`, `lint`, `db:migrate`. No dedicated `ci` script (DEFERRED).  
Deferred from prior phases: Lucky dedicated E2E, PERFORM_GAP, full activity Adaptive matrix, LMS token encryption.

---

## P0 (this phase)

1. Require real `SESSION_SECRET` in production (no insecure default).  
2. Notes create/update: verify course/material/topic ownership before linking.

## P1 (this phase)

1. Adaptive `transitionRunStatus` ACTIVE CAS + idempotent already-terminal.  
2. Unauthorized → 401 on notes / adaptive / activities / materials learning.  
3. Notes PATCH optional `expectedUpdatedAt` stale rejection.  
4. Activity POST idempotency key (header) when provided.

## P2 / DEFERRED

contentJson caps, visualViewport, full Lucky E2E, CI platform, multiple ACTIVE UX, CORE rewrite, Safari hardware.

---

## STOP conditions confirmed

No CORE rewrite, no second engines, no mastery algorithm change, no destructive migration, no production deploy.

**Audit complete — proceed with P0/P1 only.**

# 2G-67 — Tutor Evidence Intent Integrity Hardening

**Status:** IMPLEMENTED  
**Date:** 2026-03-22  
**Depends on:** 2G-66 (P0: client `evidenceIntent` could mint ConceptMastery)

---

## Confirmations

> **Client `evidenceIntent` is contextual input only and cannot independently mint ConceptMastery evidence.**

> **Tutor evidence continues through the canonical LearningAttempt → ConceptMastery path.**

---

## 1. Existing Tutor evidence path

```text
Tutor client (foundation / adapters)
  → app/api/study/tutor/route.ts  OR  server adapter (core/six/teach-me/facade)
  → TutorRequest
  → runTutor (service.ts)
  → loadTutorContext (owned concepts only)
  → AI completion
  → resolveTutorEvidenceAuthorization (evidence.ts)
  → maybeRecordTutorEvidence
  → recordEvidence → LearningAttempt
  → applyEvidenceToMastery → ConceptMastery
```

---

## 2. Previous trust boundary (pre-2G-67)

| Input | Trusted? |
| --- | --- |
| Session `learnerId` | Yes |
| Concept ownership filter | Yes |
| Client `evidenceIntent` | **No — but used as write gate** ← P0 |
| Client message as demonstration fallback | **Unsafe** when paired with client intent |

Foundation route previously set `evidenceIntent: body.evidenceIntent ?? "none"`, so a client could request `apply` + owned conceptIds and mint mastery after any chat turn.

---

## 3. Client-controlled inputs

- TutorMode, LearningIntent, message, history
- `evidenceIntent` (now contextual only → `clientEvidenceIntentRequest`)
- conceptIds (filtered by ownership)
- learnerDemonstration text
- score / outcome / learnerId / userId (ignored on foundation route)

---

## 4. Server-authoritative inputs

- Authenticated learner identity (`user.id`)
- Concept ownership (`loadTutorContext`)
- `evidenceAuthorizedByServer` (only trusted constructors set `true`)
- Evidence eligibility (`resolveTutorEvidenceAuthorization`)
- Persisted skillFacet (from server-approved `evidenceIntent`)
- Outcome/score (server caller only; default 0.6 partial when ungated)
- LearningAttempt + ConceptMastery writes

---

## 5. New evidence authorization rule

`resolveTutorEvidenceAuthorization` requires **all** of:

1. `evidenceAuthorizedByServer === true`
2. Server `evidenceIntent` is a recordable kind (not `none`)
3. Owned concept id present
4. `learnerDemonstration` length ≥ `TUTOR_EVIDENCE_MIN_DEMONSTRATION_CHARS` (8)

Otherwise `eligible: false` — ordinary Tutor interaction only.

---

## 6. Client evidenceIntent behavior

| Path | Behavior |
| --- | --- |
| Foundation `POST /api/study/tutor` | Stores validated value as `clientEvidenceIntentRequest`; write `evidenceIntent` forced `"none"`; `evidenceAuthorizedByServer: false` |
| CORE / SIX / Teach Me adapters | `evidenceIntent: "none"`, `evidenceAuthorizedByServer: false` |
| `toTutorRequestFromDemonstration` | Server sets recordable intent + `evidenceAuthorizedByServer: true` |

Client request kind never selects facet or authorizes writes.

---

## 7. Server facet selection

`facetForTutorEvidence(serverApprovedIntent)` only after authorization succeeds. Conflicting `clientEvidenceIntentRequest` is ignored (`void`).

---

## 8. Outcome / score handling

- TutorRequest has **no** client score/outcome fields used for mastery.
- Foundation route explicitly ignores `body.score` / `body.outcome`.
- `maybeRecordTutorEvidence.score` is server-caller-only; default conservative 0.6 → PARTIAL via `outcomeFromScoreRatio`.

---

## 9. Concept ownership

Unchanged: `loadTutorContext` only keeps concepts where `userId === learnerId`. Foreign ids skipped. Evidence uses owned `context.conceptIds[0]`.

---

## 10. Learner identity

Foundation route: `learnerId: user.id`. Client `learnerId` / `userId` ignored.

---

## 11. Idempotency findings

No Tutor-specific Attempt idempotency key exists. Retries can create duplicate LearningAttempts (**P1 remaining**, not addressed this phase). Adaptive Attempt-idempotency is separate.

---

## 12. Files changed

| File | Change |
| --- | --- |
| `tutor/types.ts` | `clientEvidenceIntentRequest`, `evidenceAuthorizedByServer` |
| `tutor/evidence.ts` | `resolveTutorEvidenceAuthorization`; gate `maybeRecord` |
| `tutor/service.ts` | Authorize before record; no message→demo fallback |
| `tutor/facade.ts` | Demonstration sets server auth |
| `tutor/core|six|teach-me-adapter.ts` | Explicit `evidenceAuthorizedByServer: false` |
| `app/api/study/tutor/route.ts` | Strip client write intent; ignore score/identity |
| `tutor/index.ts`, `learning/index.ts` | Exports |
| Tests + this report | T1–T10 coverage |

**Unchanged:** diagnose, Adaptive, Orchestrator candidate ordering, mastery math, Learning Intent resolution.

---

## 13. Tests / counts

- Full `src/lib/learning`: **834** passed (82 files; was 826)
- Focused Tutor evidence/service/contract + integrity design: green
- ESLint (touched Tutor files): clean
- Typecheck: known baseline only (+ fixed 2G-67 Pick typing)

## 14. Lint

ESLint on touched Tutor files — clean.

## 15. Typecheck

Known baseline only:

- `notebook-desk.ts`
- `generate-offline-fallback.integration.test.ts`
- `resolve-loop-focus-topic.ts`

---

## 16. Remaining risks

| Risk | Class |
| --- | --- |
| Duplicate Tutor Attempts on retry | P1 |
| Demonstration facade still unused by product UI | SAFE (ready when wired) |
| Default score 0.6 when server omits score | Existing semantics (MINOR) |
| Trusted callers must remember `evidenceAuthorizedByServer: true` | Documented |

---

## PASS checklist

- [x] Client evidenceIntent cannot independently create LearningAttempt / ConceptMastery  
- [x] Server determines eligibility + facet  
- [x] Unauthorized concept / identity forgery prevented  
- [x] Client cannot forge outcome via foundation route  
- [x] Ordinary Q&A non-evidence  
- [x] Legitimate server-authorized evidence still works  
- [x] Learning Intent + Tutor modes intact  
- [x] Canonical LearningAttempt → ConceptMastery path  
- [x] No second evidence/mastery system  

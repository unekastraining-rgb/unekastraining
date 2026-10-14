# 2G-68 — CORE → Orchestrator Closed-Loop Bridge

**Status:** IMPLEMENTED  
**Date:** 2026-03-22  
**Depends on:** 2G-59 (Hub Adaptive bridge), 2G-67 (Tutor evidence integrity)

---

## Inspection findings

| Area | Finding |
| --- | --- |
| CORE notebook action context | `notebook-action-context.ts` projects CoreStudyIntent → LearningIntent; workspace voids intent for generation |
| Knowledge bridge | `core-bridge.ts` + `POST /api/core/knowledge/bridge` — confirm returns owned `conceptId` |
| Concept in CORE UI | Only `CoreKnowledgeBridgePanel` (in Assist Studio) has linked/confirmed concept ids |
| Orchestrator from CORE | **None** before this phase |
| Adaptive from CORE | **None** before this phase (CORE “adaptive” = format recommendations, unrelated) |
| Hub pattern to reuse | `resolveHubAdaptivePrimaryCta` + `POST /api/study/adaptive/start` (session user; resumes ACTIVE) |
| Orchestrator on Adaptive start | `startAdaptiveSequenceRun` → `orchestrateForConcept` (decision authority unchanged) |

**Selected entry point:** `CoreKnowledgeBridgePanel` after Concept confirm / when `linkedConceptIds` exist.

---

## Exact CORE entry point

Additive CTA in `CoreKnowledgeBridgePanel`:

- Label: **Continue learning** (start) or **Resume adaptive study** (when `activeRunId` known)
- Visible only when `pickCoreBridgeFocusConceptId` resolves a real concept id
- Calls existing `POST /api/study/adaptive/start` with `{ conceptId }` only

No new DB models. No CORE rewrite.

---

## Concept resolution / ownership

1. Concept created/linked only via existing Knowledge bridge confirm (user-owned `userId`).
2. Focus id: last confirm `conceptId`, else first `linkedConceptIds[]`.
3. Adaptive start verifies ownership via coordinator (`AdaptiveSequenceRunError` → 404).
4. Missing concept → CTA `kind: "none"`; CORE UI unchanged.

---

## How Orchestrator is reused

Adaptive start path:

```text
POST /api/study/adaptive/start
  → startOrResumeAdaptiveSequenceForConcept
  → startAdaptiveSequenceRun
  → orchestrateForConcept  ← existing diagnosis + intervention
```

CORE does not call diagnose directly and does not alter diagnosis semantics.

---

## How Adaptive is reused

Same API and helpers as Study Hub. ACTIVE run for concept → resume (`listActiveAdaptiveSequenceRuns`). Opaque `runId` navigation to `/study/adaptive/{runId}`.

---

## Active-run resume

`startOrResumeAdaptiveSequenceForConcept` returns existing ACTIVE run when present (`resumed: true`). Pure CTA helper also prefers resume when `activeRunId` is supplied (Hub parity).

---

## Why CORE does not create evidence

Bridge helpers and panel do not call `recordEvidence` / LearningAttempt writers. Note typing/saving/chat unchanged. Evidence remains owned by Adaptive → SIX/Quiz/Flashcard/Tutor contracts.

---

## Why CORE does not mutate mastery

No `applyEvidenceToMastery` / ConceptMastery writes from CORE bridge. Knowledge confirm may create Concept rows (existing 2E-1) but not ConceptMastery.

---

## Intent behavior

CoreStudyIntent mappings unchanged (practice→PRACTICE, explain→UNDERSTAND, quiz/flashcards/learning-plan→CREATE, study-guide→null, conversational Quiz me→null). Notebook action LearningIntent remains ephemeral (`void ctx.learningIntent`). Bridge does not pass intent into Adaptive start (contextual only; Adaptive/Orchestrator soft-intent unchanged).

---

## Security / ownership

| Rule | Enforcement |
| --- | --- |
| Session learner | `getOrCreateDefaultUser` on adaptive/start |
| Ignore client identity | `void body.userId/learnerId` |
| Foreign concept | Coordinator ownership → not_found |
| Panel payload | `{ conceptId }` only |

---

## Files changed

| File | Role |
| --- | --- |
| `src/lib/learning/orchestrator/core-adaptive-bridge.ts` | Pure CTA helpers |
| `src/lib/learning/orchestrator/core-adaptive-bridge.test.ts` | T1–T15 contracts |
| `src/components/core/CoreKnowledgeBridgePanel.tsx` | Additive Continue learning CTA |
| `src/lib/learning/CORE_ORCHESTRATOR_CLOSED_LOOP_BRIDGE.md` | This report |

---

## Tests / verification

| Check | Result |
| --- | --- |
| Focused CORE bridge + related | **56** passed |
| `src/lib/learning` (+ CORE intent tests) | **860** passed (85 files) |
| ESLint (touched) | clean |
| Typecheck | known baseline only (`notebook-desk.ts`, `generate-offline-fallback…`, `resolve-loop-focus-topic.ts`) |

---

## Remaining limitations

1. CTA uses first linked / last confirmed concept — not multi-concept picker.
2. Soft Orchestrator suggestion copy (Hub notice/reason) not shown in CORE; Orchestrator still decides inside Adaptive start.
3. If Orchestrator returns NO_INTERVENTION, start API returns 400 with existing message — no CORE-specific fallback.
4. CORE format “adaptive” panel remains separate product surface.

---

## PASS checklist

- [x] Owned concept → existing Adaptive/Orchestrator loop  
- [x] Orchestrator decision authority preserved  
- [x] Adaptive progression authority preserved  
- [x] CORE authoring ≠ evidence / ≠ mastery  
- [x] Identity + ownership server-side  
- [x] CoreStudyIntent intact  
- [x] Active run resume via existing start helper  
- [x] No Quiz in Orchestrator; no second systems  
- [x] Existing CORE propose/confirm/skip preserved  

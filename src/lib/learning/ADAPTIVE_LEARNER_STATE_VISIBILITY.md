# 2G-69 — Adaptive Learner State & “Why This Step” Visibility

**Status:** IMPLEMENTED  
**Date:** 2026-03-22  
**Depends on:** 2G-63 (Hub mastery summary), 2G-65 (ConceptMastery ordering)

---

## Inspection findings

| Surface | Finding |
| --- | --- |
| Adaptive page | `app/study/adaptive/[runId]/page.tsx` → `loadAdaptiveRunPageView` → `AdaptiveSequenceRunShell` |
| Run model | Read-only; resume + SIX/Quiz/Flashcard resolve; no evidence writes |
| Steps store | Intervention slug only — no persisted diagnosis/reason |
| Hub presentation | `presentOrchestratorSuggestion` + `buildOrchestratorMasterySummary` |
| Mastery truth | ConceptMastery via Orchestrator signals; TopicMastery blocked in summary helper |

**Approach:** On ACTIVE page load, call existing `orchestrateForConcept` (read path) and map to learner-safe visibility. No new API. No new DB model.

---

## Exact Adaptive page entry point

`loadAdaptiveRunPageView` (ACTIVE branch) → `loadLearnerStateForConcept` → `orchestrateForConcept` → `buildAdaptiveLearnerStateVisibility`.

Rendered in `AdaptiveSequenceRunShell` as a subordinate card under the concept title / step counter, above the activity CTA.

---

## Existing data reused

- `orchestrateForConcept` / `OrchestratorResult`
- `buildOrchestratorMasterySummary` (same as Hub 2G-63)
- `result.reason` (already learner-facing Orchestrator copy)
- Owned run via `resumeAdaptiveSequenceRun`

---

## ConceptMastery source

`buildOrchestratorMasterySummary` on Orchestrator signals. TopicMastery fallback yields insufficient (never shown as ULE band). No TopicMastery reads in Adaptive helpers.

---

## Why-this-step source

1. Prefer sanitized `OrchestratorResult.reason` when free of internal tokens.
2. Else short diagnosis→safe-line fallback (never exposes enum strings).
3. `NO_INTERVENTION` → omit why (`null`).
4. Never invent from activity/SIX slug alone.

---

## Learner-safe copy strategy

- Mastery: strip “Current learning state:” prefix for compact “Your learning progress” line; keep Hub semantics.
- Why: Orchestrator reason or safe short line.
- Leak filter rejects reason strings containing diagnosis enums / RECOGNIZE / ConceptMastery / etc.

---

## Insufficient-evidence behavior

Uses existing summary `kind: "insufficient_evidence"` / “not enough evidence yet”. Why may be the Orchestrator insufficient starting-point reason when present.

---

## Security / ownership

- Session user only (`getOrCreateDefaultUser` on page).
- `resumeAdaptiveSequenceRun` ownership → `not_found` for foreign runs (no Orchestrator call).
- `learnerState` server-built only — shell reads `view.learnerState`, no client mastery/reason props.

---

## Display creates no evidence/mastery

Confirmed: page load path has no `recordEvidence` / `applyEvidenceToMastery` / Adaptive mutations. Complete/Abandon/SIX launch unchanged.

---

## Files changed

| File | Change |
| --- | --- |
| `sequence/adaptive-learner-state.ts` | Pure visibility helper |
| `sequence/adaptive-learner-state.test.ts` | T1–T22 coverage |
| `sequence/adaptive-run-page.ts` | Attach `learnerState` on ACTIVE |
| `sequence/adaptive-run-page.test.ts` | Mock Orchestrator; preserve no-write |
| `AdaptiveSequenceRunShell.tsx` | Additive why / progress card |
| `ADAPTIVE_LEARNER_STATE_VISIBILITY.md` | This report |

---

## Tests / lint / typecheck

| Check | Result |
| --- | --- |
| Focused Adaptive learner-state + run page | **17** passed |
| Full `src/lib/learning` | **858** passed (84 files) |
| ESLint (touched) | clean |
| Typecheck | known baseline only |

---

## Remaining limitations

1. Why reflects **current** Orchestrator snapshot, not a frozen reason from step-creation time (steps don’t store reason).
2. Soft-fail omits the card if Orchestrator load fails — page remains usable.
3. Completed/abandoned views do not show the new card (ACTIVE focus).

---

## PASS checklist

- [x] Truthful learning-state + why when available
- [x] ConceptMastery authoritative; TopicMastery unused
- [x] No new mastery math / no raw internals
- [x] Display ≠ evidence; progression unchanged
- [x] CORE bridge / Hub summary / Intent / LUCKY unchanged

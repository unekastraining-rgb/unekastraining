# 2G-63 — Learner-Facing ConceptMastery Visibility

**Mode:** Small additive Study Hub presentation bridge. No dashboard. No new mastery math.

**Predecessors:** 2G-60 visibility audit · 2G-61 truth reconciliation · 2G-62 mastery truth boundary.

---

## 1. ConceptMastery source used

`OrchestratorResult.signals.facets` + `reviewCount` + `usedTopicMasteryFallback` from the existing `orchestrateForConcept` / `getLearnerConceptMastery` path.

**Never TopicMastery.** If `usedTopicMasteryFallback === true` or `reviewCount <= 0` or diagnosis is `INSUFFICIENT_EVIDENCE`, the Hub shows an evidence-aware state only.

---

## 2. Existing semantics reused

| Semantic | Source |
|----------|--------|
| Facet weakness / strength bands | `ORCHESTRATOR_FACET_WEAK` (0.45) / `ORCHESTRATOR_FACET_STRONG` (0.55) exported from `diagnose.ts` |
| Focus facet | Aligned with existing diagnosis (UNDERSTANDING → recognize/explain, APPLICATION → apply, RECALL/RETENTION → retain) |
| Soft reason copy | Unchanged `result.reason` |
| Adaptive / SIX CTAs | Unchanged (2G-59) |

No new thresholds invented beyond exporting the existing Orchestrator bands.

---

## 3. New presentation type / helper

| Artifact | Role |
|----------|------|
| `present-mastery-summary.ts` | `buildOrchestratorMasterySummary` — presentation only |
| `OrchestratorMasterySummary` | Optional field on `OrchestratorSuggestionView` |
| Attached in `presentOrchestratorSuggestion` | Does not affect diagnosis |

---

## 4. Study Hub files changed

| File | Change |
|------|--------|
| `orchestrator/diagnose.ts` | Export existing WEAK/STRONG as named constants |
| `orchestrator/present-mastery-summary.ts` | **New** helper |
| `orchestrator/present-mastery-summary.test.ts` | **New** tests |
| `orchestrator/present.ts` | Attach `masterySummary` |
| `orchestrator/present.test.ts` | Expect summary on recommendation |
| `OrchestratorSuggestionCard.tsx` | Secondary mastery/state line |
| `lib/learning/index.ts` | Exports |
| `LEARNER_MASTERY_VISIBILITY.md` | This report |

---

## 5. Exact learner-facing copy / state behavior

| Kind | `stateLabel` |
|------|----------------|
| Insufficient evidence | `Current learning state: not enough evidence yet` |
| Band needs_practice | `Current learning state: needs more practice` |
| Band developing | `Current learning state: developing` |
| Band looking_strong | `Current learning state: looking strong` |

Optional soft `focusHint` (e.g. “Your recent work suggests more application practice may help.”) — complements reason, does not replace it.

Hierarchy in card:

1. Notice (concept / gap)
2. Recommendation label
3. **Mastery summary** (secondary)
4. Reason (why)
5. Adaptive primary + SIX secondary CTAs

---

## 6. Confirmation TopicMastery is not used

- Helper never imports TopicMastery.
- Topic fallback on Orchestrator → learner-facing `insufficient_evidence`.
- Card has no TopicMastery / overallMastery reads.

---

## 7. Confirmation no new mastery calculation

Bands = existing Orchestrator constants. No average, no XP, no new facet math, no Prisma model.

---

## 8. Confirmation Adaptive behavior is unchanged

Card still uses `resolveHubAdaptivePrimaryCta` + `POST /api/study/adaptive/start`. No Adaptive coordinator edits.

---

## 9–11. Tests / lint / typecheck

- Focused present-mastery-summary + present/orchestrator/hub tests: green
- Full `src/lib/learning`: **79 files / 803 tests passed** (verify run)
- Lint: clean on phase-owned TS files
- Typecheck: known baseline only (`notebook-desk.ts`, `generate-offline-fallback…`, `resolve-loop-focus-topic.ts`)

---

## 12. Remaining risks

- Suggest candidate ordering still uses TopicMastery proficiency to pick which concept to orchestrate (pre-existing); mastery **claim** on the card is ConceptMastery-only.
- Dashboard “Overall mastery” Topic labels remain residual (2G-62 notes).
- `looking_strong` still soft — avoid absolute “mastered” language (enforced in copy).

---

*Phase 2G-63 — Learner-Facing ConceptMastery Visibility.*

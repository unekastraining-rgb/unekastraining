# 2G-65 — Orchestrator Candidate Ordering

**Status:** IMPLEMENTED  
**Date:** 2026-03-22  
**Depends on:** 2G-64 (candidate truth audit → Option B)

---

## Contract confirmation

> **TopicMastery discovers/contexts candidates; ConceptMastery determines ULE priority when canonical Concept identity exists.**

> **Diagnosis and intervention policy were not changed.**

---

## 1. Previous candidate-ordering behavior (2G-64)

```text
Topic discovery (course.userId, sortOrder, take 40)
  → TopicMastery sort (reviewCount===0 first, then lowest proficiency)
  → shortlist (8 with conceptId / 3 without)
  → ensureConceptForTopic as needed
  → sequential orchestrateForConcept / diagnose
```

TopicMastery could decide which concept reached diagnosis first (ULE priority leak).

---

## 2. New candidate-ordering behavior (2G-65)

```text
Topic discovery (unchanged surface)
  → shortlist by discovery order (prefer Topics with conceptId)
  → resolve conceptId (Topic.conceptId | ensureConceptForTopic)
  → batch ConceptMastery.findMany
  → orderCandidatesByConceptMastery (WEAK/STRONG bands)
  → sequential orchestrateForConcept / diagnose (unchanged)
```

---

## 3. Candidate discovery preserved

- Still `db.topic.findMany` where `course.userId`, optional `courseId`, `orderBy: sortOrder`, `take: 40`.
- Still prefer Topics with `conceptId` (slice 8) else top 3 without.
- Still `ensureConceptForTopic` for Topics lacking Concept.
- LearningSpace / Course / legacy focus-topic paths outside this function unchanged.

---

## 4. Exact ConceptMastery semantics reused

| Input | Source |
| --- | --- |
| Facet bands | `ORCHESTRATOR_FACET_WEAK` (0.45) / `ORCHESTRATOR_FACET_STRONG` (0.55) from `diagnose.ts` |
| Weakness score | `min(recognize, explain, apply, retain)` — same primary set as mastery-summary fallback |
| Insufficient gate | `reviewCount === 0` and facet sum `< 0.01` (aligned with diagnose insufficient) |
| Missing row | `NO_CONCEPT_MASTERY` — not fake zero, not TopicMastery |

Priority try-order:

1. `NEEDS_ATTENTION`
2. `DEVELOPING`
3. `STRONG`
4. `INSUFFICIENT_EVIDENCE` / `NO_CONCEPT_MASTERY` (neutral; after strong so gap preference still works)

---

## 5. TopicMastery role after change

| Allowed | Not allowed |
| --- | --- |
| Topic/Course discovery surface | Ranking ULE candidates |
| Legacy progress UI (elsewhere) | Substituting for missing ConceptMastery |
| Diagnosis TopicMastery fallback inside `effectiveFacetsForOrchestration` (unchanged, post-selection) | Hub suggest sort keys (`proficiency` / `reviewCount`) |

`suggest.ts` no longer includes or reads Topic `masteries`.

---

## 6. Missing ConceptMastery behavior

- No ConceptMastery row → `NO_CONCEPT_MASTERY`, `weaknessScore: null`.
- Empty ConceptMastery (no reviews, empty facets) → `INSUFFICIENT_EVIDENCE`, `weaknessScore: null`.
- Remains eligible; sorted after meaningful STRONG so diagnosis can skip NO_INTERVENTION then fall back to insufficient (existing prefer-gaps policy).

---

## 7. Legacy no-Concept behavior

Topics without `conceptId` still go through `ensureConceptForTopic`, then enter ConceptMastery ordering. If no mastery row yet → `NO_CONCEPT_MASTERY`. Orchestrator diagnosis path unchanged (may present insufficient).

Decision: still enter ULE via ensure + orchestrate (existing path); never invent ConceptMastery; never treat TopicMastery as ULE priority.

---

## 8. Deterministic tie-breaking

1. Priority tier  
2. Ascending weakness score (weaker first)  
3. Older `lastReviewedAt` first among equals (missing → last)  
4. Ascending `discoveryIndex` (Topic shortlist / sortOrder position)

No randomness.

---

## 9. Files changed

| File | Change |
| --- | --- |
| `src/lib/learning/orchestrator/candidate-ordering.ts` | **New** — pure ConceptMastery ordering |
| `src/lib/learning/orchestrator/suggest.ts` | Topic discovery + ConceptMastery batch order |
| `src/lib/learning/orchestrator/candidate-ordering.test.ts` | **New** — Scenarios A–G + Hub wiring |
| `src/lib/learning/orchestrator/present.test.ts` | Mocks updated for `conceptMastery.findMany` |
| `src/lib/learning/orchestrator-candidate-truth.design.test.ts` | Archive 2G-64 audit assertions |
| `src/lib/learning/ORCHESTRATOR_CANDIDATE_ORDERING.md` | This report |

**Not changed:** `diagnose.ts`, intervention / SIX policy, Adaptive coordinator, Hub card CTAs (beyond which concept wins), TopicMastery writers, mastery math.

---

## 10. Tests / counts

- Focused 2G-65 + related: **86** passed  
- Full `src/lib/learning`: **819** passed (81 files)  
- ESLint (touched files): clean  
- Typecheck: known baseline only (`notebook-desk.ts`, `generate-offline-fallback.integration.test.ts`, `resolve-loop-focus-topic.ts`)

## 11. Lint

ESLint on touched files — clean.

## 12. Typecheck

Known baseline only (no 2G-65 production errors).

---

## 13. Performance considerations

- One `conceptMastery.findMany` for the shortlist (≤8 concepts) — no N+1.
- No new cache subsystem.
- TopicMastery include removed from discovery query (slightly less join work).

---

## 14. Remaining risks

- Learners may see a different Hub suggestion when TopicMastery and ConceptMastery diverged (intentional).
- Shortlist still caps at 8 Topics with conceptId — a weak Concept outside the sortOrder window may still be missed (discovery limit, not ordering leak).
- Diagnosis still allows TopicMastery facet fallback *after* selection when ULE evidence is empty (2G-61 compatibility; presentation blocked by 2G-62/63).

---

## PASS checklist

- [x] Topic-first discovery intact  
- [x] TopicMastery no longer ranks canonical Concepts  
- [x] ConceptMastery influences priority  
- [x] Missing ConceptMastery ≠ fake weakness / ≠ TopicMastery  
- [x] Legacy ensureConcept path intact  
- [x] Diagnosis / intervention / Adaptive unchanged  
- [x] No new persistence / mastery migration  

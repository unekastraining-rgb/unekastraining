# 2G-62 — Mastery Truth Boundary

**Mode:** Small additive boundary / label hardening. No migration. No schema change.

**Predecessor:** [2G-61 Mastery Truth Reconciliation](./MASTERY_TRUTH_TOPIC_CONCEPT_RECONCILIATION.md) — Option B.

---

## Confirmation

| Contract | Binding |
|----------|---------|
| **ConceptMastery = ULE mastery** | Canonical — LearningAttempt → Evidence → ConceptMastery |
| **TopicMastery = legacy topic/course progress** | Compatibility — may coexist; never merged with ConceptMastery |

---

## 1. What was inspected

Learner-facing strings and data sources under `src/` / `app/` for mastery, proficiency %, weak/strong, “mastered”, progress described as mastery, MasteryTree, Hub, Adaptive, Orchestrator card, Tutor, LUCKY, CORE, SIX panel, Quiz/Flashcard routes (writers only).

---

## 2. Learner-facing mastery surfaces found

| Surface | Data source |
|---------|-------------|
| MasteryTree + `GET /api/mastery` | TopicMastery |
| SixRecommendationsPanel | TopicMastery (via six-recommendations) |
| Study Hub Study Now “focus” | Topic proficiency |
| CourseProgressStory / EcosystemDashboard metrics | TopicMastery aggregates |
| Hub / dashboard `overallMastery` | TopicMastery |
| OrchestratorSuggestionCard | Soft recommendation (ConceptMastery-backed diagnose); **no mastery %** |
| Adaptive run page | Concept/step chrome; **no mastery %** |
| Tutor UI | No mastery panel (ConceptMastery in prompt only) |
| LUCKY retention review | ConceptMastery write path; surface counts TopicMastery |

---

## 3. Classification A / B / C / D

| Surface | Class | Action this phase |
|---------|-------|-------------------|
| Future / helper for ULE mastery display | **A** | `resolveLearnerFacingUleMastery` — ConceptMastery only |
| OrchestratorSuggestionCard | **A**-adjacent (recommendation, not %) | Unchanged — already ConceptMastery diagnose |
| MasteryTree | **B** | Label clarification via `TOPIC_PROGRESS_LEARNER_COPY` |
| SixRecommendationsPanel | **B** | Wording → topic progress |
| Study Hub Study Now focus | **B** | “Topic progress focus” |
| CourseProgressStory / EcosystemDashboard tree section | **B** | Small label clarifications |
| Hub/dashboard overallMastery pills | **B** | Left intact (still Topic progress data; not ULE facet UI) — residual risk noted |
| Quiz/Flashcard/SIX dual-write | **D** writers | Unchanged |
| Orchestrator TopicMastery fallback | **D** internal diagnose | Unchanged (LOW confidence; not learner-facing mastery claim) |

---

## 4. Production files changed

| File | Change |
|------|--------|
| `src/lib/learning/mastery/mastery-truth.ts` | **New** boundary helper |
| `src/lib/learning/mastery/mastery-truth.test.ts` | **New** tests |
| `src/lib/learning/index.ts` | Export boundary |
| `src/components/csl/MasteryTree.tsx` | Topic progress copy; still `/api/mastery` |
| `src/components/study/SixRecommendationsPanel.tsx` | Topic progress wording |
| `src/components/csl/EcosystemDashboard.tsx` | Section labels |
| `src/components/courses/CourseProgressStory.tsx` | Labels |
| `app/study/study-hub-view.tsx` | “Topic progress focus” |
| `src/lib/learning/MASTERY_TRUTH_BOUNDARY.md` | This report |

---

## 5. Exact ConceptMastery boundary introduced

`src/lib/learning/mastery/mastery-truth.ts`:

- `CANONICAL_ULE_MASTERY_SOURCE = "ConceptMastery"`
- `LEGACY_TOPIC_PROGRESS_SOURCE = "TopicMastery"`
- `resolveLearnerFacingUleMastery` — ConceptMastery only; missing / `reviewCount === 0` → honest unavailable
- `resolveLearnerFacingUleMasteryIgnoringTopicProgress` — accepts but **voids** TopicMastery input
- `resolveTopicCourseProgress` — explicit legacy path
- `masteryTruthBoundarySummary()` — `mayMerge: false`, `learnerFacingUleFallsBackToTopicMastery: false`
- No average / max / blend APIs

---

## 6. TopicMastery labels clarified

- MasteryTree: “Topic progress map” + subtitle stating not ULE concept mastery
- Six panel: weak **topic progress** (not “weak mastery”)
- Hub Study Now: “Topic progress focus”
- Ecosystem / CourseProgressStory: topic progress wording for tree-linked UI

MasteryTree **behavior** (TopicMastery fetch, bars, dims) unchanged.

---

## 7. Intentionally NOT changed

- Prisma / migrations / TopicMastery deletion
- ConceptMastery math / LearningAttempt / EvidenceEnvelope
- Orchestrator diagnosis (including TopicMastery fallback)
- Adaptive / LUCKY scheduling / Tutor evidence
- Quiz / Flashcard / SIX / code-evaluate writers
- MasteryTree data source (`/api/mastery`)
- Dual-write removal
- Full dashboard “Mastery” metric rename across AcademicDashboard / LockerTab / HubInsightsPanel (residual **B** labeling debt)

---

## 8. Tests added

`src/lib/learning/mastery/mastery-truth.test.ts` — canonical source, no merge, no Topic fallback, topic progress path, MasteryTree still Topic-based, writers/Orchestrator intact, report invariants.

---

## 9. Test counts

- Focused: `mastery-truth.test.ts` — 7 tests
- Full `src/lib/learning`: **78 files / 797 tests passed**

## 10. Lint result

- Clean on: `mastery-truth.ts`, `mastery-truth.test.ts`, `MasteryTree.tsx`, `SixRecommendationsPanel.tsx`, `index.ts` exports
- Pre-existing `react-hooks/set-state-in-effect` on `study-hub-view.tsx` / `CourseProgressStory.tsx` (label-only edits; not introduced by boundary logic)
- Pre-existing unused-var warning on `EcosystemDashboard.tsx`

## 11. Typecheck result

Known baseline only (unchanged):

- `notebook-desk.ts`
- `generate-offline-fallback.integration.test.ts`
- `resolve-loop-focus-topic.ts`

---

## 12. Remaining risks

1. Dashboard / Hub **“Overall mastery”** metrics still TopicMastery-backed with generic “Mastery” labels in some chrome — not ULE ConceptMastery; future label pass.
2. Dual-write divergence (2G-61) remains — boundary prevents presenting Topic as ULE; does not sync stores.
3. Lucky surface counts still TopicMastery — intentional legacy until a later phase.
4. Orchestrator may still *internally* use Topic fallback for diagnosis when no ULE evidence — not learner-facing mastery numbers.

---

*Phase 2G-62 — Mastery Truth Boundary.*

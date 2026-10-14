# 2P-4 — Learner Model as a Learner-Facing Experience

**Mode:** Productization + UX + truth-boundary. No second Learner Model / mastery / Orchestrator.  
**Predecessors:** 2G-70/71 Learner Model surface · 2P-3 Study Hub · ConceptMastery truth boundary.

---

## 1. Existing implementation

| Piece | Path | Role |
|-------|------|------|
| Page | `app/study/learner-model/page.tsx` | User-scoped ConceptMastery read → present → panel |
| Panel | `src/components/study/LearnerModelPanel.tsx` | Learner-facing sections + Orchestrator + Adaptive CTA |
| Visibility | `present-learner-model.ts` | Pure bucketing from ConceptMastery |
| Progress | `present-concept-progress.ts` | Facet dimensions + learner lines |
| Backend read | `learner-model/read.ts` | Orchestrator/compat (not used by this page) |

---

## 2. Canonical ConceptMastery source

Page loads `db.conceptMastery.findMany({ where: { userId } })` only.  
`presentLearnerModelVisibility` → `presentConceptProgress` → `resolveLearnerFacingUleMasteryIgnoringTopicProgress`.  
`data-mastery-source="ConceptMastery"`.

---

## 3. TopicMastery boundary

Panel copy explicitly contrasts **concept mastery** vs **topic progress**.  
TopicMastery is never read for ULE claims. MasteryTree / Six tips remain Topic-labeled elsewhere.

---

## 4. Evidence sources used by projection

Only persisted ConceptMastery facet scores + reviewCount (derived earlier from LearningAttempt/evidence).  
No raw attempt IDs, payloads, or authorization flags exposed.

---

## 5. Recommendation relationship

```text
Learner Model page
  → embeds OrchestratorSuggestionCard
  → GET /api/study/orchestrator-suggestion (existing)
  → presentOrchestratorSuggestion (existing)
```

Does **not** call `diagnose` / `orchestrateForConcept` in the panel.

---

## 6. Adaptive navigation

`ContinueLearningButton` → `POST /api/study/adaptive/start` → `startOrResumeAdaptiveSequenceForConcept`.  
Focus concept: needs practice → developing → strengths (`pickLearnerModelFocusConceptId`).  
Per-row Continue on developing / needs-practice sections.

---

## 7. What the Learner Model does NOT own

- Diagnosis / intervention ranking  
- Evidence or mastery writes  
- Topic progress calculation  
- Assignment completion  
- Lucky retention scheduling  
- A second Adaptive start route  

---

## 8. Security / ownership

- Identity via `getOrCreateDefaultUser` (session / authorized default)  
- Query filtered by `userId`  
- No client `userId` parameter  
- Auth failure → friendly sign-in message (no stack dump)  
- Load failure → recoverable error UI  

---

## 9. Empty / loading / error

| State | Behavior |
|-------|----------|
| Cold start (no rows) | Single empty: not 0%; links to Hub / Core / Lucky |
| Per-section empty | Truthful empty copy |
| Loading | SSR `force-dynamic` |
| Truncation | Soft “up to 40” note when capped |
| Error | Recoverable; no raw errors |

---

## 10. Responsive behavior

Single-column `max-w-2xl` stack; concept rows flex-col on mobile; min-h-11 touch targets; semantic h1/h2.

---

## 11. Tests added

`src/lib/learning/learner-model-productization.integrity.test.ts` — TEST A–L.

---

## 12. Deferred

1. Cursor pagination beyond 40 concepts  
2. Dedicated `loading.tsx` skeleton  
3. Concept → Learning Space subject chips (needs richer include)  
4. Historical trend charts (intentionally omitted — no analytics model)  
5. Align AssignmentsTab label copy with “Learner model” everywhere  

---

## 13. Remaining known gaps

- Page does not re-verify `concept.userId` (ConceptMastery.userId is sufficient under normal ownership)  
- Orchestrator card still course-scoped (no courseId on Learner Model page — global suggestion)  

---

## Architecture confirmation

ONE Learner Model · ONE ConceptMastery truth · ONE Evidence spine · ONE Orchestrator · ONE Adaptive start path · CORE → SIX → LUCKY preserved · TopicMastery legacy · read-only projection · no second recommendation/mastery engine · no fabricated zeros  

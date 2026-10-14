# 2G-61 — Mastery Truth / TopicMastery Reconciliation Audit

**Mode:** Audit / design only. **No production changes. No migration. No deletion.**

**Predecessor:** [2G-60 Learner Mastery Visibility Audit](./LEARNER_MASTERY_VISIBILITY_AUDIT.md) — P0 dual-model risk (MasteryTree = TopicMastery; ULE = ConceptMastery).

---

## 1. Executive Summary

Study Haul currently maintains **two mastery stores**:

| Store | Knowledge unit | Role today |
|-------|----------------|------------|
| **`ConceptMastery`** | Concept | **Canonical ULE mastery** — LearningAttempt → facets → Orchestrator / Tutor / Adaptive planning / LUCKY weak-mastery handoff |
| **`TopicMastery`** | Topic | **Legacy / compatibility course-progress store** — still actively written by Quiz / Flashcard / Study Evaluate / code-evaluate; still read by MasteryTree, dashboard, LUCKY surface counts |

They are **not** the same truth projected twice. Dimensions differ; writers diverge; learners can see TopicMastery in MasteryTree while recommendations use ConceptMastery.

**Classification:** **Case C** (legacy duplicate / transitional dual-write) with **Case B** nuance for Topic-scoped *curriculum progress* UX — not an **Case D** spine contradiction if ownership is clear.

**Recommended truth strategy:** **Option B — Treat TopicMastery as legacy compatibility state.**  
`ConceptMastery` is authoritative for ULE MASTERY (“what the system believes I can do”). TopicMastery remains for existing Topic-level consumers until they are labeled, bridged, or gradually retired. Do **not** average, max, or silently merge the two.

**Divergent learner truth currently exists:** **Yes** — concrete dual-write and single-write paths documented below.

---

## 2. Mastery Representation Inventory

| Representation | Kind | Persistence | Status |
|----------------|------|-------------|--------|
| `ConceptMastery` | Prisma model | Yes | **Current / canonical ULE** |
| `TopicMastery` | Prisma model | Yes | **Active legacy / transitional** |
| `LearnerConceptMasterySummary` | TS read model | N/A | Current (facets + optional TopicMastery attach) |
| `FacetedMasteryScores` | TS | N/A | Current ULE facet contract |
| `MasteryTree` + `GET /api/mastery` | UI + API | TopicMastery | Active learner-facing **legacy view** |
| Dashboard / progress / stats / notifications / proposals | Readers | TopicMastery | Compatibility / product surfaces |
| Orchestrator TopicMastery **fallback** | Read transform | Uses TopicMastery dims → collapsed facets | Transitional low-confidence bridge only |

No third parallel ULE mastery table found. No feature flag that disables TopicMastery writes.

---

## 3. TopicMastery Audit

### Persistence (`prisma/schema.prisma`)

| Field | Semantics |
|-------|-----------|
| `userId`, `topicId` | Ownership (`@@unique`) |
| `proficiency` | Mean of three dims |
| `understanding`, `recall`, `application` | Topic dimensions (≠ ULE six facets) |
| `confidence` | Meta |
| `reviewCount`, `lastReviewedAt`, `nextReviewAt` | Review scheduling |

### Writers (sole upsert: `src/lib/quizzes/mastery.ts` → `updateTopicMastery`)

| Call site | Event | Dimension (typical) | LearningAttempt? | ConceptMastery? |
|-----------|-------|---------------------|------------------|-----------------|
| `app/api/quizzes/[id]/submit` | Quiz submit (if `quiz.topicId`) | recall (via `updateMasteryFromQuiz`) | Yes (ULE bridge, try/catch) | Yes (same bridge) |
| `app/api/flashcards` | Flashcard rating | recall (`updateTopicMasteryFromReview`) | Yes (bridge, try/catch) | Yes |
| `app/api/study/evaluate` | Evaluate score (if topic) | varies by call | Yes for blurting/teach-me/six | Yes |
| `app/api/study/code-evaluate` | Code practice score | application (when courseId) | **No** | **No** |

Calculation: score-ratio deltas `+0.1 / +0.03 / -0.06` with spill into other dims — **similar numeric policy to ULE facet deltas, different dimensions**.

### Readers (production)

| Reader | Learner-facing? | Expects Topic semantics? |
|--------|-----------------|--------------------------|
| `GET /api/mastery` + `MasteryTree` | **Yes** | Yes — per-topic course tree |
| Dashboard (`app/dashboard/page.tsx`) | Yes | Topic weak/strong counts |
| Course progress API | Yes | Topic mastery rows |
| Study-now / mixed-review / lucky route counts | Partial | TopicMastery thresholds |
| Notifications / schedule proposals / user stats | Indirect | TopicMastery |
| `getLearnerConceptMastery` attach + Orchestrator fallback | Internal | Fallback only when no ULE evidence |

**Still actively used:** Yes — not dead code.

---

## 4. ConceptMastery Audit

### Persistence

Six facets: `recognize`, `explain`, `apply`, `solve`, `perform`, `retain` + `confidence` + review fields. Unique `(userId, conceptId)`.

### Canonical path (confirmed)

```text
LearningAttempt (recordEvidence)
      ↓
applyEvidenceToMastery (skillFacet + outcome)
      ↓
ConceptMastery
      ↓
getLearnerConceptMastery → Orchestrator / Tutor / Adaptive plan / Lucky handoff
```

### Writers (sole upsert: `applyEvidenceToMastery`)

| Producer | Also TopicMastery? |
|----------|-------------------|
| Quiz bridge | Yes (separate, if topicId) |
| Flashcard bridge | Yes (separate) |
| Study Evaluate bridge | Yes (separate, if topicId) |
| Tutor evidence | **No** |
| LUCKY retention review | **No** |

### UI / API exposure

No learner-facing ConceptMastery facet API/UI yet (2G-60). Assessment route uses read for ownership only.

---

## 5. MasteryTree Audit

| Question | Answer |
|----------|--------|
| Intent | Show course topic progress (understand / recall / apply / proficiency %) |
| Topic-based by design? | **Yes** — `/api/mastery` loads `topic.masteries` |
| Learner-facing? | **Yes** — course detail + EcosystemDashboard |
| Unique functionality? | Curriculum Topic tree visualization — not ULE facet panel |
| Map to Concepts? | Topics may have optional `conceptId`; not required for tree |
| Historical data if switched? | TopicMastery rows would be orphaned for UI unless projected/migrated |
| Other consumers of same API? | MasteryTree is primary UI; API is TopicMastery-shaped |

**Role:** **Legacy / compatibility learner-facing view** of Topic-level progress — **not** the ULE mastery source of truth. Independent *curriculum* view is legitimate only if clearly **not** presented as ConceptMastery.

---

## 6. Semantic Comparison

| Property | TopicMastery | ConceptMastery |
|----------|--------------|----------------|
| Knowledge unit | **Topic** | **Concept** |
| Evidence source | Score ratio events (often parallel to LA) | **LearningAttempt** only |
| Facets / dims | understanding, recall, application (+ proficiency) | RECOGNIZE EXPLAIN APPLY SOLVE PERFORM RETAIN |
| Calculation | `updateTopicMastery` dim deltas | `applyFacetDelta` by `skillFacet` |
| Writer | `quizzes/mastery.ts` | `mastery/apply.ts` |
| Primary readers | MasteryTree, dashboard, lucky counts | Orchestrator, Tutor, Adaptive, retention handoff |
| Learner-facing | **Yes** (tree) | **Not yet** (planned soft Hub line) |
| Adaptive-aware | No direct | Via Orchestrator plan; no mastery write on complete |
| Orchestrator-aware | Fallback only | **Primary** |
| Universal (non-course) | Tied to Course Topics | Concepts + Learning Spaces |

### Case determination

- **Not Case A** (same truth) — different units and dimensions.  
- **Not pure Case B** alone — overlapping “how am I doing?” semantics confuse learners.  
- **Case C** — transitional dual-write / legacy Topic store beside canonical Concept store.  
- **Not Case D** — ULE spine is coherent if ConceptMastery owns MASTERY truth and TopicMastery is scoped as legacy topic progress.

---

## 7. Evidence Alignment

| Event | TopicMastery | ConceptMastery / LearningAttempt |
|-------|--------------|----------------------------------|
| Quiz (with topicId) | Yes | Yes (bridge; isolated try/catch) |
| Quiz (no topicId, concept via title) | No | Yes |
| Flashcard | Yes | Yes (try/catch) |
| SIX / blurting / teach-me evaluate | Yes (if topic) | Yes (if topic + mode) |
| Tutor gated evidence | No | Yes |
| LUCKY retention submit | No | Yes |
| Code evaluate | Yes (if courseId) | **No** |
| Adaptive completion | Neither (bind only) | Neither (Lucky handoff **reads** ConceptMastery) |

**Same LearningAttempt does not update TopicMastery** — TopicMastery is updated by parallel score calls, not by `applyEvidenceToMastery`.

**Non-LearningAttempt mastery writers:** TopicMastery paths above; code-evaluate is TopicMastery-only.

### Can the same evidence yield different visible mastery by UI?

**Yes — currently real.**

1. Tutor / LUCKY retention improve **ConceptMastery** → Orchestrator/Tutor see change; **MasteryTree unchanged**.  
2. Code evaluate updates **TopicMastery** → MasteryTree moves; **ConceptMastery / Orchestrator unchanged**.  
3. Quiz/Flashcard/SIX: TopicMastery may succeed while ULE bridge fails (try/catch) → tree updated, ULE not (or vice versa if topicId missing).  
4. MasteryTree shows Topic dims; Hub recommendation uses Concept facets (or Topic fallback with LOW confidence when no ULE evidence).

---

## 8. Topic ↔ Concept Mapping

| Fact | Evidence |
|------|----------|
| Link | `Topic.conceptId` optional FK |
| Ensure | `ensureConceptForTopic` creates Concept and sets FK |
| Quiz without topic | `ensureConceptForQuizTitle` — Concept may exist **without** Topic link |
| 1:1 enforced? | **No** — FK not unique; multiple Topics could share one Concept |
| Deterministic ensure | If already linked, return that Concept |
| Topics without Concepts | **Yes** until ensured |
| Concepts without Topics | **Yes** (self-directed / quiz-title / CORE bridge) |
| Topic broader than Concept? | Topic is course curriculum node; Concept is ULE knowledge unit — **related, not identical** |

Do **not** force 1:1 in this phase. No new mapping tables.

---

## 9. Orchestrator Alignment

- Consumes `getLearnerConceptMastery` → **ConceptMastery facets**.  
- If no ULE evidence but TopicMastery exists: **fallback** maps understanding→recognize+explain, application→apply, recall→retain; solve/perform=0; confidence LOW.  
- Does **not** write either store.  
- Diagnosis unchanged in this phase.

**Truth ownership for recommendations:** ConceptMastery (with explicit low-trust Topic fallback).

---

## 10. Tutor Alignment

- **Reads** same `getLearnerConceptMastery` (ConceptMastery + optional Topic attach).  
- **Writes** ConceptMastery only via tutor evidence.  
- Aligned with Orchestrator on canonical read; TopicMastery not updated by Tutor.

---

## 11. Adaptive Alignment

- Relies on Orchestrator → **ConceptMastery** (not TopicMastery directly).  
- Completion binds LearningAttempt; does not write mastery.  
- COMPLETE → Lucky handoff reads **ConceptMastery.retain**.

---

## 12. LUCKY Alignment

| Path | Uses |
|------|------|
| RetentionItem weak-mastery sync | ConceptMastery.retain (from apply / handoff) |
| Retention review submit | LearningAttempt + ConceptMastery |
| Lucky session **surface counts** | **TopicMastery** thresholds (legacy planner UX) |

**Accidental TopicMastery dependency:** Lucky **product counts** still Topic-based; ULE retention spine is Concept-based. Dual narrative risk on Lucky pages.

---

## 13. Divergence Analysis

| Scenario | Divergent? | Mechanism |
|----------|------------|-----------|
| Tutor evidence | Yes | Concept only |
| Lucky retention review | Yes | Concept only |
| Code evaluate | Yes | Topic only |
| Bridge try/catch failure | Yes | Topic succeeds, Concept fails (or reverse edge cases) |
| Happy Quiz/Flashcard/SIX dual-write | Soft | Same event, **different dimension models** — numbers still not equivalent |
| MasteryTree vs Hub suggestion | Yes | Different stores |

---

## 14. Risk Analysis

| Risk | Evidence | Severity | Real now? | Smallest safe mitigation |
|------|----------|----------|-----------|--------------------------|
| **1 Divergent truth** | Tutor/Lucky vs MasteryTree; code-eval; try/catch | **High** | **Yes** | Authoritative rule: ULE MASTERY = ConceptMastery; label MasteryTree as topic progress |
| **2 Stale legacy** | If Topic writes stop while tree remains | Medium | Possible | Keep dual-write until consumers migrated; or label stale |
| **3 Double-writing** | Quiz/Flashcard/SIX update both independently | Medium | **Yes** | Accept as compatibility; do not add third writer; eventual single-write |
| **4 Semantic mismatch** | Topic dims ≠ six facets; fallback collapses recognize/explain | High | **Yes** | Never present Topic dims as Concept facets |
| **5 Learner confusion** | Tree % vs Hub recommendation | High | **Yes** | 2G-60 Hub soft ConceptMastery line; clarify MasteryTree copy |

---

## 15. Compatibility Options

| Option | Fit? |
|--------|------|
| **A** Leave independent forever | Weak — overlapping “mastery” semantics confuse |
| **B** TopicMastery = legacy compatibility; ConceptMastery authoritative | **Best** |
| **C** ConceptMastery → TopicMastery projection | Only if Topic UI must stay live **and** stop independent Topic writers — larger than needed now |
| **D** Migrate all consumers immediately | Unsafe/large — many Topic readers (dashboard, lucky counts, progress) |
| **E** Larger redesign | Unnecessary — spine already clear |

---

## 16. Recommended Truth Strategy

### **Option B — Treat TopicMastery as legacy compatibility state**

1. **Authoritative ULE MASTERY** = `ConceptMastery` (via LearningAttempt).  
2. **TopicMastery** = active legacy store for Topic-scoped product surfaces until gradually retired or clearly re-labeled as **topic/curriculum progress**.  
3. Do **not** implement projection/migration in this phase.  
4. Future Hub visibility (2G-60) must read **ConceptMastery only**.  
5. Orchestrator continues ConceptMastery + existing Topic fallback (LOW confidence).  
6. Eventually: stop presenting TopicMastery as “mastery of what I can do”; migrate or label MasteryTree; consider ending dual-write once safe.

---

## 17. Learner-Facing Truth Rule

| Layer | Authoritative source |
|-------|----------------------|
| **EVIDENCE** | `LearningAttempt` (+ soft Evidence Intelligence) |
| **MASTERY** | **`ConceptMastery` only** |
| **RECOMMENDATION** | Orchestrator / Adaptive (ConceptMastery-backed) |
| **REASON** | Soft Orchestrator present copy |
| **RETENTION** | LUCKY RetentionItem queue (seeded from ConceptMastery.retain for weak mastery) |

**Forbidden:** averaging TopicMastery with ConceptMastery; picking the higher score; inventing a blended “mastery %”.

**TopicMastery display rule:** If shown, label as **topic/course progress (legacy)**, not ULE concept mastery.

---

## 18. Required Future Changes (design only — not this phase)

| Priority | Change |
|----------|--------|
| P0/P1 | When adding Hub learning-state line: use ConceptMastery only |
| P1 | MasteryTree / `/api/mastery` labeling or eventual Concept-aware successor |
| P1 | Lucky surface counts: clarify Topic vs Concept retention |
| P2 | Reduce dual-write; migrate Topic readers; code-evaluate → ULE evidence if product wants |
| P3 | Delete TopicMastery only after zero required readers |

---

## 19. Explicit Non-Goals (this phase)

No production code; no Prisma migrations; no TopicMastery/MasteryTree deletion or rewrite; no ConceptMastery math/facet changes; no new mastery/evidence models; no mastery score; no Orchestrator/Tutor/Adaptive/LUCKY/UI implementation of strategy.

---

## 20. Final Verdict

| Item | Result |
|------|--------|
| ConceptMastery role | **Canonical ULE mastery** |
| TopicMastery role | **Active legacy / compatibility Topic progress** |
| MasteryTree role | **Legacy learner-facing Topic view** |
| Divergent learner truth | **Yes — currently real** |
| Case | **C** (transitional dual-write), not spine **D** |
| Strategy | **Option B** |
| 2G-61 status | **PASS** |

---

*Phase 2G-61 — Mastery Truth / TopicMastery Reconciliation Audit.*

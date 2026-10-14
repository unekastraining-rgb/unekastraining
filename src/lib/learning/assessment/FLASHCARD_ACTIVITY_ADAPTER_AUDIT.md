# Phase 2G-52 — Flashcard Activity Adapter Design & Gap Inspection

**Status:** Inspection / design only. **No production adapter implementation.**  
**Date:** 2026-09-20  
**Depends on:** 2G-51 Convergence Audit · Quiz AssessmentAdapter (2G-44–50) · `flashcard-bridge` (2B-1)  
**Mode:** Preserve → Connect → Upgrade → Extend  

---

## 1. Verdict

**Flashcard can support a future Universal Activity Adapter via a small additive bridge.**

The existing Flashcard product already owns identity, review UX, SM-2 scheduling, ownership checks, and a closed evidence path into `LearningAttempt` → ConceptMastery (`RETAIN`). What is missing is only the Assessment/Adaptive **orchestration** layer (resolve → prepare → launch instruction → optional Adaptive completion bind) — the same thin pattern Quiz already uses.

| Question | Answer |
|----------|--------|
| Small additive bridge possible? | **Yes** |
| Larger product/system required first? | **No** (for Assessment/Adaptive orchestration) |
| Force Flashcard into Quiz shape? | **No** — self-rate + SM-2 remain Flashcard-specific |
| Implement adapter in 2G-52? | **No** — design only |

**Recommended next action:** `2. DESIGN A SMALL ADDITIVE FLASHCARD ADAPTER` (future phase — not this task).

---

## 2. Existing Flashcard inventory

### 2.1 Data model

**Source:** `prisma/schema.prisma` → `model Flashcard`

| Field | Role |
|-------|------|
| `id` | Persisted card identity |
| `front` / `back` | Prompt / answer text |
| `difficulty`, `interval`, `repetitions`, `nextReviewAt` | **SM-2 schedule state** (authoritative on the Flashcard row) |
| `userId` | Ownership |
| `topicId` | Required Topic FK (course-scoped) |

**No** `FlashcardDeck`, `FlashcardSession`, or `FlashcardAttempt` model exists.

Related:
- `StudySession` with `activityType: FLASHCARDS` — created **per rated card** (`cardsReviewed: 1`), not a multi-card session aggregate.
- `TopicMastery` updated via `updateTopicMasteryFromReview` (legacy topic mastery — separate from ConceptMastery).
- `RetentionItem` with `sourceType: "FLASHCARD"` — LUCKY mirror of SM-2 due dates (`syncFlashcardRetentionItem`).

### 2.2 Learning Object identity

**Source:** `ensureFlashcardLearningObject` in `learning-object/ensure.ts`

```text
type: FLASHCARD
skillFacet: RETAIN
sixTechnique: "active_recall"
payloadRef: { kind: "flashcard", flashcardId }
```

Created lazily inside `recordFlashcardReviewEvidence` — not at card create time.

### 2.3 Creation / generation / import

| Path | File | Notes |
|------|------|-------|
| AI generate | `app/api/flashcards/generate/route.ts` | Course/material owned; creates Topic + Flashcard rows |
| Grade-school helper | `src/lib/grade-school/generate-flashcards.ts` | Sets `nextReviewAt: now` |
| Import/export API | `app/api/flashcards/import/route.ts`, `export/route.ts` | |
| CORE Q&A import | `CoreNotesWorkspace` → `importExtractQaToFlashcards` | Persists to Flashcard store |
| CORE split practice | `CoreFlashcardSplit.tsx` | **Ephemeral** flip UI only — **no** PATCH/SM-2/evidence |

### 2.4 Retrieval

| Path | Behavior |
|------|----------|
| `GET /api/flashcards` | Owned cards; default **due-only** (`nextReviewAt` null or ≤ now); optional `courseId`; `scope=all` for manage |
| `app/flashcards/page.tsx` + `flashcards-view.tsx` | Primary review UI |

### 2.5 Presentation / interaction

**Primary UX:** `app/flashcards/flashcards-view.tsx`

- Flip card → self-rate **AGAIN / GOOD / EASY**
- `handleReview` → `PATCH /api/flashcards` with `{ cardId, rating }`
- Advances local queue; no separate “submit session” API
- No automated correct/incorrect check on the main path (self-rate only)

**CORE split:** browse/flip ephemeral cards; link out to full `/flashcards` for real review.

### 2.6 Scoring / confidence / correctness

| Mechanism | Present? |
|-----------|----------|
| Self-rating AGAIN/GOOD/EASY | Yes — primary |
| Binary correct/incorrect grading | No on main review path |
| Numeric score on Flashcard row | No |
| ULE `score` on evidence | Yes — derived from rating (0.35 / 0.75 / 0.9) |
| ULE `confidence` on evidence | **Not set** by flashcard-bridge (`null`) |
| Misconception signals | `flashcard_again` when AGAIN |

### 2.7 SM-2 / scheduling

**Source:** `applySm2Review` in `src/lib/academic.ts`

- Applied in `PATCH /api/flashcards` **before** evidence/retention bridges
- Updates `difficulty`, `interval`, `repetitions`, `nextReviewAt` on the Flashcard row
- **Authoritative** schedule — retention bridge mirrors only (`scheduleAuthority: "flashcard_sm2"`)

### 2.8 Completion / abandonment

| Concern | Current behavior |
|---------|------------------|
| Card “complete” | Rating recorded + SM-2 updated |
| Session complete | Client: no more due cards in fetched queue — **not** a server completion contract |
| Abandonment | Leaving UI mid-queue — **no** ABANDONED LearningAttempt; unrated cards unchanged |
| Adaptive completion | **None** |

### 2.9 API / persistence / ownership

| Route | Ownership |
|-------|-----------|
| `GET/PATCH/DELETE /api/flashcards` | `userId` from session user; PATCH `findFirst({ id, userId })` |
| `DELETE /api/flashcards/[id]` | Owned delete |
| Generate/import | Course/material ownership checks |

Client supplies `cardId` on PATCH; server **re-validates** ownership before SM-2/evidence.

### 2.10 Concept / topic

- Flashcard **always** has `topicId`
- Evidence: `ensureConceptForTopic(userId, topicId)` — refuses if no topic
- Concept association is **Topic-mediated**, same family as Quiz’s Concept→Topic alignment

### 2.11 Evidence / Mastery (already wired)

```text
PATCH review
  → applySm2Review (Flashcard row)
  → updateTopicMasteryFromReview (legacy)
  → recordFlashcardReviewEvidence
       → ensureFlashcardLearningObject
       → buildEvidenceEnvelope (RETAIN)
       → recordEvidence → LearningAttempt
       → applyEvidenceToMastery
  → syncFlashcardRetentionItem (LUCKY mirror; best-effort)
  → StudySession (telemetry)
```

Failures in ULE/retention bridges are caught — **review still succeeds**.

### 2.12 AdaptiveSequence interaction

**None.** No flashcard sequence adapter, intervention string, launch context, or submit-bind. Orchestrator may **count** flashcard evidence sources for diagnosis confidence; it does **not** emit a flashcard intervention.

---

## 3. Lifecycle matrix

| Lifecycle stage | Existing Flashcard implementation | Reusable? | Missing? | Likely change |
|-----------------|-----------------------------------|-----------|----------|---------------|
| **Identity** | `Flashcard.id` + LO `payloadRef {kind:"flashcard",flashcardId}`; Topic→Concept | YES | Opaque Assessment `activityRef` convention; optional Concept→due-card resolve helper | Additive helper (Quiz-like `findOwned*`) |
| **Resolve** | Due-card GET by user/course; no Concept-level helper | PARTIAL | Canonical Concept→Topic→owned due Flashcard(s) resolver | **SMALL** additive resolve |
| **Prepare** | N/A (no AssessmentAdapter) | — | `adapter.prepare` → opaque `activityRef` | **SMALL** AssessmentAdapter |
| **Launch** | `/flashcards?courseId=…` (+ topic query in UI) | YES | Adaptive query params; Assessment launch instruction | **SMALL** href builder (no new route required) |
| **Experience** | `flashcards-view.tsx` flip + rate | YES | — | **NO CHANGE** to UX |
| **Interaction** | PATCH rating | YES | Optional adaptive context forward from UI (like QuizTaker) | **SMALL** query forward if Adaptive |
| **EvidenceEnvelope** | `flashcard-bridge.ts` | YES | — | **NO CHANGE** |
| **LearningAttempt** | via `recordEvidence` | YES | Return attempt id to Adaptive bind (Quiz already selects attempt) | **SMALL** if bind needs id |
| **Mastery** | RETAIN via `applyEvidenceToMastery` | YES | — | **NO CHANGE** |
| **Completion** | Per-card rating only; no session contract | PARTIAL | Adaptive/Assessment completion semantic | **SMALL** policy + bind (define grain) |
| **Adaptive progression** | Absent | — | Sequence adapter + bind after evidence | **SMALL** additive (mirror quiz-submit-bind) |

---

## 4. Evidence semantics

| Question | Finding |
|----------|---------|
| Mastery facet | **RETAIN** only |
| RECOGNIZE / EXPLAIN / APPLY / SOLVE / PERFORM | Not produced by flashcard-bridge |
| Confidence recorded? | **No** (`confidence` unset) |
| Score recorded? | **Yes** — rating→ratio (AGAIN 0.35, GOOD 0.75, EASY 0.9) |
| Outcomes | AGAIN→FAIL, GOOD→PARTIAL, EASY→SUCCESS |
| Repeated failures distinguishable? | Yes — multiple LearningAttempts; `flashcard_again` signal; SM-2 resets repetitions |
| Grain | **Interaction-grain: one card rating → one LearningAttempt** |
| Session-grain Attempts? | **No** |
| SM-2 vs Mastery | **Separate** — SM-2 updates Flashcard fields; Mastery updates ConceptMastery; bridge does not alter SM-2 |
| Sole evidence writer for ULE? | **Yes** — `recordEvidence` → LearningAttempt (legacy TopicMastery is parallel, not a second ULE spine) |

### Ambiguity check (must stay distinct)

| System | Role |
|--------|------|
| **Flashcard learning evidence** | `sourceRef.kind: "flashcard_review"` → LearningAttempt → RETAIN mastery |
| **Flashcard scheduling** | SM-2 fields on Flashcard row |
| **LUCKY retention** | `RetentionItem sourceType: FLASHCARD` mirrors due dates; LUCKY review can re-present the card and write **retention** evidence via retention/review — **different path** |

Do **not** merge these three. Flashcard activity evidence and LUCKY review of a FLASHCARD-sourced RetentionItem can both exist; they serve different product paths (CORE→SIX→**LUCKY**).

---

## 5. Ownership / identity analysis

| Identity | How identified | Safe for opaque `activityRef`? |
|----------|----------------|--------------------------------|
| Learner | Session user (`getOrCreateDefaultUser`) | Yes |
| Deck/set | **No deck entity** — course/topic queues only | N/A |
| Individual card | `Flashcard.id` | Yes — `{ kind: "flashcard", id }` |
| Concept | Via Topic (`ensureConceptForTopic`) | Yes if resolve enforces Concept→Topic |
| Learning Object | Ensured at evidence time | Yes |
| Parent material | Indirect via Topic/Course; generate may use materialId | Not required on activityRef |

### Risk audit

| Risk | Current mitigation | Adapter implication |
|------|--------------------|---------------------|
| Cross-user access | PATCH/GET filter `userId` | Resolve/prepare must re-check ownership (Quiz pattern) |
| Client-supplied IDs | Accepted then server-validated | Never trust client `flashcardId` without owned lookup |
| Concept mismatch | Evidence uses card’s topic→concept | Resolve must align Adaptive/Assessment conceptId with card topic |
| Missing concept | Bridge refuses without topicId | Cards always have topicId in schema |

**Conclusion:** An opaque Flashcard `activityRef` identifying an existing learner-owned card is **safe** if prepare/resolve reuse server-side owned lookups (same discipline as Quiz 2G-45).

---

## 6. Flashcard vs Quiz comparison

```text
Quiz (reference):
  AssessmentPlan → Quiz AssessmentAdapter → findOwnedQuizForConcept
    → prepare activityRef {kind:"quiz",id} → launch /quizzes/{id}
    → Quiz UX → QuizAttempt → recordQuizAttemptEvidence → LearningAttempt(s)
    → Mastery (RECOGNIZE) → optional bindQuizSubmitToAdaptiveSequence

Flashcard (actual today):
  [no AssessmentPlan path]
  Flashcard rows + GET due queue → /flashcards UX → PATCH rating
    → SM-2 + TopicMastery + recordFlashcardReviewEvidence → LearningAttempt
    → Mastery (RETAIN) + syncFlashcardRetentionItem
  [no Adaptive bind]
```

| Piece | Quiz | Flashcard today | Bridge need |
|-------|------|-----------------|-------------|
| Owned resolve for concept | `findOwnedQuizForConcept` | Missing | Additive |
| AssessmentAdapter | Yes (`quiz`) | No | Additive |
| Prepare / launch helpers | Yes | No | Additive |
| Existing experience | QuizTaker | flashcards-view | Reuse |
| Domain attempt row | QuizAttempt | **None** (rating only) | **Do not invent QuizAttempt** |
| Evidence bridge | quiz-bridge | flashcard-bridge | Reuse |
| Adaptive bind | quiz-submit-bind | None | Additive |
| Grading semantics | Objective correct/incorrect | Self-rate | Keep different |
| Facet | RECOGNIZE | RETAIN | Keep different |

Lifecycle convergence ≠ implementation uniformity.

---

## 7. Activity-boundary analysis

### Options

| Option | Meaning | Repo support |
|--------|---------|--------------|
| **A. One individual flashcard** | Activity = one owned card; interaction = one rating | Strong — matches evidence grain, SM-2 grain, LO grain |
| **B. Review session / deck** | Activity = multi-card session | **Weak** — no Deck/Session persistence; StudySession is per-card telemetry |
| **C. Other existing concept** | e.g. RetentionItem as activity | Wrong layer — LUCKY path; would collapse Flashcard into LUCKY |

### Decision (from code semantics)

| Concept | Definition for Flashcard |
|---------|--------------------------|
| **Activity** (future Adaptive/Assessment) | Prefer **Option A**: one learner-owned Flashcard aligned to the plan/step concept (typically a **due** card). Launch may open the existing `/flashcards` queue filtered by course/topic so UX stays familiar, while `activityRef` still names a specific card (or the resolver picks the next due card). |
| **Interaction** | Flip + self-rate AGAIN/GOOD/EASY on that card |
| **Evidence** | One `LearningAttempt` per rating (`flashcard-bridge`) |
| **Completion** (Assessment stop) | Launch only — Assessment does not complete |
| **Completion** (Adaptive progression) | **Design recommendation:** score-agnostic bind after a successful evidence write for the bound card/concept (mirror Quiz submit bind). Optional future: require N cards — **not required** by current repo. |
| **Session “done” UX** | Remains client-side empty queue — **not** Adaptive completion |

**Unresolved (acceptable):** Whether Assessment `activityRef` should freeze one card id at prepare-time vs resolve “next due” at launch-time. Both are additive; choose in implementation phase. Do **not** invent a Deck model to answer this.

**Not chosen:** Option B as a new persistence model. Option C (LUCKY-as-activity) rejected.

---

## 8. SM-2 vs Adaptive vs Mastery vs LUCKY

```text
Flashcard Activity (existing UX)
      ↓ rating
SM-2 updates Flashcard.nextReviewAt     ← scheduling authority (unchanged)
      ↓
recordFlashcardReviewEvidence
      ↓
LearningAttempt → ConceptMastery.RETAIN ← learning evidence spine
      ↓ (parallel, best-effort)
syncFlashcardRetentionItem              ← LUCKY due mirror only
      ↓ (future)
Adaptive coordinator bind               ← progression only; does NOT own SM-2
```

| Statement | Supported by repo? |
|-----------|-------------------|
| Adaptive can consume Flashcard LearningAttempts without owning SM-2 | **Yes** — evidence already independent of schedule math |
| Adaptive must not recalculate SM-2 | **Yes** — preserve `applySm2Review` as sole SM-2 writer on review |
| LUCKY must not replace Flashcard review | **Yes** — LUCKY is separate retention method; Flashcard remains learning activity |
| Flashcard must not auto-become LUCKY product | Already only **mirrors** schedule into RetentionItem — keep that boundary |

---

## 9. Assessment compatibility

Assessment contract (unchanged):

```text
ASSESS → Workflow → AssessmentPlan → Activity Adapter → Activity
  → EvidenceEnvelope → LearningAttempt → Mastery
```

| Mode | Compatibility with Flashcard | Notes |
|------|------------------------------|-------|
| **PRACTICE_CHECK** | **Compatible** | Aligns with RECALL/RETENTION diagnoses; self-rate retention check |
| **DIAGNOSTIC** | **Weak / generally incompatible** | Flashcards do not diagnose understanding/application gaps; Orchestrator already maps those to SIX/Quiz-shaped paths |
| **VERIFICATION** | **Unresolved / poor fit** | Self-rate ≠ independent verification of correctness; do not treat as Quiz substitute |

Do **not** change Assessment mode policy in this phase. A future Flashcard AssessmentAdapter should claim plans only when explicitly selected (`adapterKey: "flashcard"`) and/or when mode is PRACTICE_CHECK — same explicitness discipline as Quiz (`ASSESS ≠ Flashcard`).

---

## 10. Adaptive compatibility

Target path:

```text
AdaptiveSequenceRun → Flashcard activity → rating → existing evidence
  → LearningAttempt → Mastery → coordinator re-orchestration → next step
```

| Need | Available today? | Gap |
|------|------------------|-----|
| Identify learner | Yes | — |
| Identify concept | Yes (via topic) | Resolve helper |
| Identify activity | Flashcard id | activityRef + ownership |
| Identify LearningAttempt | Created in bridge; **id not returned** to PATCH caller today | Bridge/API may need to expose attempt id for bind (additive) |
| Determine completion | Per-card rating exists | Define Adaptive completion = evidence recorded for step |
| Bind to run/step | No | `bindFlashcardReviewToAdaptiveSequence` (name illustrative) |

**Feasible** with a small sequence adapter + bind, without SM-2 ownership transfer.

---

## 11. Orchestrator boundary

| Question | Finding |
|----------|---------|
| Does Orchestrator emit Flashcard today? | **No** — interventions are SIX (and quiz via Adaptive), not flashcard |
| Should Orchestrator directly emit Flashcard? | **Not yet** — keep principle: Orchestrator chooses intervention/intent; adapters resolve concrete activities |
| How Flashcard should enter the engine | Explicit Assessment `adapterKey` and/or Adaptive intervention (e.g. `flashcard`) selected by sequence planning — **not** auto-injected into Orchestrator v1 |
| Evidence use today | Flashcard counts contribute to diagnosis **confidence** / retention signals only |

**Classification:** Orchestrator direct emission = **NO CHANGE REQUIRED** (leave outside until a future policy explicitly adds an intervention).

---

## 12. Final classification

| Area | Classification |
|------|----------------|
| Flashcard UX / SM-2 / persistence | **NO CHANGE REQUIRED** |
| Evidence → LearningAttempt → RETAIN Mastery | **NO CHANGE REQUIRED** |
| LUCKY RetentionItem mirror | **NO CHANGE REQUIRED** (keep distinct) |
| Assessment Flashcard adapter (resolve/prepare/launch) | **SMALL ADDITIVE BRIDGE REQUIRED** |
| Adaptive Flashcard adapter + completion bind | **SMALL ADDITIVE BRIDGE REQUIRED** |
| Return LearningAttempt id for Adaptive bind | **SMALL ADDITIVE BRIDGE REQUIRED** (if bind needs it) |
| Deck/session persistence model | **LARGER FUTURE FEATURE** — **not required** for first bridge |
| Objective grading / QuizAttempt-like model | **INTENTIONALLY DIFFERENT** — do not add |
| Orchestrator emitting flashcard | **NO CHANGE REQUIRED** (defer policy) |
| CORE ephemeral split practice | **INTENTIONALLY DIFFERENT** — not the Adaptive/Assessment activity |
| CODING/SQL/… enums | Out of scope — reserved only (2G-51) |

---

## 13. Recommended next action

### **2. DESIGN A SMALL ADDITIVE FLASHCARD ADAPTER**

(Implementation in a **later** phase — not 2G-52.)

Suggested future scope (additive only):

1. `findOwnedDueFlashcardForConcept` (or equivalent) — Concept→Topic→owned due Flashcard; no create; no LLM  
2. `createFlashcardAssessmentAdapter` — explicit `adapterKey: "flashcard"`; prepare opaque `{kind:"flashcard", id}`; no evidence  
3. Launch href via existing `/flashcards` (+ course/topic + optional adaptive query) — **no new universal activity route**  
4. Optional: forward adaptive query in flashcards-view (QuizTaker pattern)  
5. Optional: `bindFlashcardReviewToAdaptiveSequence` after evidence — score-agnostic; does not touch SM-2  
6. Preserve RETAIN facet and self-rate semantics  

**Explicitly out of next bridge:** Deck model, Orchestrator flashcard emission, merging with LUCKY, changing Assessment mode policy, QUIZ-shaped grading.

---

## 14. Verification results

| Suite | Result | Notes |
|-------|--------|-------|
| `src/lib/learning` (incl. new design test) | **68 files / 707 passed** | Includes Assessment, Adaptive, Flashcard bridge, Retention, Orchestrator, Intent |
| `flashcard-activity-adapter.design.test.ts` | **8 passed** | Assumption locks only — no production adapter |
| Lint | **Pre-existing** repo failures (263 problems) | **None** in 2G-52 audit/design artifacts |
| `tsc --noEmit` | **Pre-existing** | `notebook-desk.ts`, `generate-offline-fallback.integration.test.ts`, `resolve-loop-focus-topic.ts` |

**2G-52 caused failures:** none.  
**Production code changed:** none (docs + design tests only).

---

## 15. Risks / notes

1. **Prepare-time card vs launch-time due card** — due status can change between prepare and review; implementation should re-check ownership/due or allow unavailable.  
2. **Multi-topic concepts** — Concept→Topic uses existing topic linkage; same caveats as Quiz resolve.  
3. **PATCH does not return LearningAttempt id** — Adaptive bind may need a small additive return/select (like Quiz attempt selection).  
4. **CORE split ≠ reviewed Flashcard** — do not treat ephemeral CORE practice as evidence or Adaptive completion.  
5. **Dual mastery** — legacy TopicMastery + ConceptMastery both update today; do not remove TopicMastery in the bridge phase.  
6. **Self-rate honesty** — PRACTICE_CHECK fit is semantic, not proctoring; VERIFICATION remains a poor fit.  
7. Hard invariants preserved: one ULE, one evidence spine, one mastery contract, one Adaptive coordinator, one LUCKY path, CORE→SIX→LUCKY, ASSESS≠Quiz, universal≠identical.

---

## PASS (2G-52 design)

| Criterion | Status |
|-----------|--------|
| Inventory factual | Yes |
| Lifecycle matrix | Yes |
| Evidence semantics clear (RETAIN) | Yes |
| Ownership/identity safe with opaque ref | Yes |
| Boundary Option A preferred; no invented Deck | Yes |
| SM-2 / Adaptive / LUCKY separated | Yes |
| Classification + next action | Yes — **DESIGN A SMALL ADDITIVE FLASHCARD ADAPTER** |
| Production adapter implemented | **No** (correct) |

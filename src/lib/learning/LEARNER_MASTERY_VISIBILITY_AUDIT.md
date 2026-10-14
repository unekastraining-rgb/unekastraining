# 2G-60 — Learner-Facing Mastery Visibility Audit

**Mode:** Audit / design only. **No production UI or API implementation.**

**Predecessors:** 2G-58 (ConceptMastery not sufficiently learner-visible); 2G-59 (Hub → Adaptive closed-loop entry fixed).

---

## 1. Executive Summary

The Universal Learning Engine **stores truthful learner state** (`ConceptMastery`, `LearningAttempt`, Evidence Intelligence, Orchestrator reason prose) but **almost none of that state is presented as learner-visible Concept mastery**.

What learners currently see:

| Surface | What they see | What they do **not** see |
|---------|---------------|---------------------------|
| Study Hub suggestion | Soft recommendation + reason | Facet strengths, evidence counts, ConceptMastery |
| Adaptive run | Concept title, step N of M, activity | Why selected, mastery delta, evidence outcome |
| MasteryTree / `/api/mastery` | **Legacy TopicMastery** dims | `ConceptMastery` facets |
| Tutor | Chat answers (may use mastery in prompt) | Explicit mastery panel |
| CORE | Concept link candidates | Mastery / evidence |
| LUCKY | Due retention items | Retain score / attempt aggregates |

**Loop status for visibility:** Recommendation is explainable at a soft prose level; **EVIDENCE** and **MASTERY** (ULE) are largely invisible; **RETENTION** is scheduling-visible only.

**No architectural defect (E)** — data exists; the gap is a **small additive visibility bridge**.

**ONE recommended next implementation:** Add a **soft, concept-scoped learning-state line** on the existing Study Hub Orchestrator suggestion (present layer → card), derived from ConceptMastery already loaded for diagnosis — not a dashboard, not gamification, not a new score.

---

## 2. ConceptMastery Audit

### Persistence (`ConceptMastery`)

| Field | Role |
|-------|------|
| `recognize`, `explain`, `apply`, `solve`, `perform`, `retain` | Canonical facets (0–1) |
| `confidence` | Meta confidence (≠ PERFORM, ≠ self-rating alone) |
| `reviewCount`, `lastReviewedAt`, `nextReviewAt` | Review scheduling seeds |
| `userId` + `conceptId` | Ownership (`@@unique`) |

### Update path

```text
Activity → EvidenceEnvelope → LearningAttempt (recordEvidence)
  → applyEvidenceToMastery → ConceptMastery facet upsert
  → optional weak-mastery LUCKY sync
```

Math: `applyFacetDelta` / `computeFacetDelta` (unchanged; not redesigned here).

### Historical evidence

History lives in `LearningAttempt` rows. ConceptMastery is a **current snapshot**, not a timeline UI.

### API exposure to learners

| Consumer | Exposes facets to UI? |
|----------|----------------------|
| `getLearnerConceptMastery` | Library read — used by Orchestrator, Tutor context, Assessment ownership, Lucky handoff |
| `GET /api/mastery` | **No** — TopicMastery only |
| Orchestrator suggestion API | Soft prose only — **no facet payload** |
| Assessment API | Ownership check only |

**Learner-visible Concept facet UI:** **None** found.

**Classification:** Architecture **A**; product visibility **B**.

---

## 3. Evidence Visibility Audit

### What Evidence Intelligence already computes (`EvidenceSignals`)

- Attempt totals / recent window
- Success / partial / fail / abandoned
- Repeated failure strength
- Misconception signal aggregates
- Per-facet outcome aggregates
- Source counts (quiz / flashcard / study_evaluate / tutor / lucky / other)
- Timestamps (last / last success / last fail)

Flag-gated: `STUDY_HAUL_EVIDENCE_INTELLIGENCE` (default OFF).

### Learner-safe vs not

| Signal | Safe to show (soft)? | Notes |
|--------|----------------------|-------|
| Soft “more practice needed on X” | Yes | Already folded into Orchestrator `reason` when enrichment runs |
| Attempt counts (coarse) | Yes, carefully | “A few recent tries” — not raw dumps |
| Facet outcome summaries | Yes, soft language | Avoid raw FAIL tallies as shame |
| Misconception string lists | **Cautious** | Often internal codes (`quiz_miss:…`) — sanitize or omit |
| Raw `sourceRefJson` / payloads | **No** | Implementation detail |
| Tutor demonstration text | **No** (default) | Privacy / overshare |

### Distinctions

| Kind | Example | Must not be labeled as |
|------|---------|------------------------|
| **Objective evidence** | Quiz correctness, evaluate score → Attempt | Self-confidence |
| **System interpretation** | Diagnosis, evidenceHints, ConceptMastery | “Proof” of absolute ability |
| **Self-report** | Flashcard AGAIN/GOOD/EASY → RETAIN | Objective demonstration of PERFORM |

**Classification:** Aggregation **A**; learner UI for evidence **B**.

---

## 4. Orchestrator Explainability Audit

### What learners see (`present.ts` → `OrchestratorSuggestionCard`)

| Field | Visible? | Content |
|-------|----------|---------|
| `notice` | Yes | Soft gap language for concept title |
| `recommendationLabel` | Yes | “Try {SIX title}” / soft variant |
| `reason` | Yes | Diagnose reason + optional prereq/evidence prose |
| Diagnosis enum | **No** | Intentionally hidden (good) |
| `evidenceHints` / `prerequisiteHints` arrays | **Not as lists** | Folded into `reason` / softWording |
| Facet numbers | **No** | |
| `assessmentHandoff` | **No** in card | Metadata only |

### Can the learner understand?

| Question | Today |
|----------|-------|
| What to work on? | **Mostly yes** (recommendation) |
| Which concept? | **Yes** (in notice / reason) |
| What kind of gap? | **Soft yes** (prose, not codes) |
| Why this intervention? | **Partial** (reason text; not facet-linked explicitly) |
| Link to prior evidence? | **Weak** — enrichment prose only when flag on; no “you demonstrated…” line |

**Classification:** Soft explainability **A–B**; facet-linked “why” **B**.

---

## 5. Study Hub Audit

After 2G-59:

| Visible | Missing |
|---------|---------|
| Suggested next step (notice / reason / Adaptive primary) | ConceptMastery facets |
| Active Adaptive via Resume CTA | Evidence timeline |
| SIX / Lucky activity grids | Retention “why due” tied to retain score |
| Study Now / topics | Progress through Adaptive (only after leaving hub) |

Hub **could** host a **small** mastery/evidence summary under the existing suggestion without becoming a dashboard — one concept, one soft state line, tied to the same recommendation.

**Classification:** Entry loop **A** (2G-59); state visibility **B**.

---

## 6. Adaptive Run UI Audit

`/study/adaptive/[runId]` (shell + load view):

| Visible | Missing |
|---------|---------|
| Concept title | Diagnosis / “why this step” |
| Step N of M | Mastery before/after |
| Activity title / continue | Evidence outcome of last step |
| Stop / complete / abandon notices | Facet-linked next-step rationale |

Progression logic itself is sound; **visibility of learning-state change is thin**.

**Classification:** Progression UX **A**; explainability **B**.

---

## 7. Tutor Audit

| Capability | Status |
|------------|--------|
| Reads ConceptMastery into prompt context | **Yes** (`loadTutorContext`) when conceptIds provided |
| Can truthfully answer “how am I doing?” | **Conditionally** — if concepts in request + mastery exists |
| UI mastery panel | **No** |
| Ordinary Q&A → evidence | **No** (intentional) |

Tutor is a **conversational** path to mastery truth, not a structured visibility surface.

**Classification:** Context **A**; structured visibility **D**/optional **B**.

---

## 8. CORE Audit

| Visible | Missing |
|---------|---------|
| Notes / document | ConceptMastery |
| Knowledge bridge Concept candidates | Evidence / Orchestrator on confirm |

CORE remains document/knowledge host (**D** for mastery dashboard). A **small** post-confirm CTA into Hub/Adaptive (2G-58 P1) is contextual connection, not CORE mastery UI.

**Classification:** **D** for mastery display; optional **B** for link-out only.

---

## 9. LUCKY Audit

| Visible | Missing |
|---------|---------|
| Due RetentionItem queue / review UI | `ConceptMastery.retain` value |
| Source labels (e.g. concept review) | Evidence aggregates that caused weak mastery |
| Schedule feel | Distinction “mastery belief” vs “due now” |

Learners can confuse **due for review** with **current ability**. Soft copy could clarify later; LUCKY should not become the primary mastery dashboard.

**Classification:** Scheduling **A**; mastery distinction **B**; primary mastery home **D**.

---

## 10. Learner Truth Model

Minimum truthful learner-facing model (related, **not interchangeable**):

```text
EVIDENCE
"What have I demonstrated?"
→ LearningAttempt (+ soft Evidence Intelligence summaries)

MASTERY
"What does the system currently believe I can do?"
→ ConceptMastery facets (canonical)

RECOMMENDATION
"What should I do next?"
→ Orchestrator suggestion / Adaptive step

REASON
"Why is this being recommended?"
→ Soft notice + reason (diagnosis-derived prose; not enum codes)

RETENTION
"What needs to come back later?"
→ LUCKY / RetentionItem due queue
```

Do **not** collapse into XP, levels, badges, or a single percentage.

Optional later mapping (design only): one concept card showing soft MASTERY + one REASON line + link to RECOMMENDATION — still not a dashboard of all concepts.

---

## 11. Privacy / Safety Audit

| Do not auto-surface | Prefer |
|---------------------|--------|
| Raw tutor replies / demonstrations | Soft mastery language |
| Raw misconception codes | Sanitized themes or omit |
| Diagnosis enums / internal JSON | Existing soft prose |
| Model prompts / system policies | Never |
| Cross-concept dumps | Concept-scoped views |
| Other learners’ data | Ownership already enforced in reads |

Safe representation pattern: **plain-language, concept-scoped, confidence-softened**, consistent with `present.ts` softWording.

---

## 12. Universal Design Requirements

Any visibility bridge must:

- Speak in **facet-agnostic learning language** (recognize / explain / apply / solve / perform / retain) without domain jargon
- Work for any Learning Space kind (course, training, hobby, certification, …)
- Not assume Quiz, Java, college, or coding
- Remain valid when PERFORM producers arrive later
- Avoid gamification metaphors that imply competition or fake precision

---

## 13. Findings Classification

| ID | Finding | Class |
|----|---------|-------|
| V1 | ConceptMastery has no learner-facing facet UI | **B** |
| V2 | `/api/mastery` + MasteryTree show TopicMastery only (dual-model) | **B** (risk of **misleading** → P0/P1) |
| V3 | EvidenceSignals not returned to any learner UI | **B** |
| V4 | Orchestrator reason is soft but not facet-explicit | **B** |
| V5 | Hub has no mastery/evidence summary | **B** |
| V6 | Adaptive run lacks why / mastery-change visibility | **B** |
| V7 | Tutor can answer orally but no structured UI | **D** / optional **B** |
| V8 | CORE has no mastery display | **D** |
| V9 | LUCKY shows schedule not mastery belief | **D** / soft **B** |
| V10 | Full mastery dashboard / gamification | **C** |
| — | Architecture blocks truthful visibility | **No E** |

---

## 14. P0 / P1 / P2 / P3 Prioritization

### P0
1. **Dual-model risk:** Learner-facing “Mastery” tree reflects **TopicMastery** while the ULE loop decides from **ConceptMastery** — can mislead about “how I’m doing” relative to recommendations. (Mitigation can be small: clarify labeling and/or surface Concept state where recommendations live — not a full tree rewrite in the next step.)

### P1
1. Soft ConceptMastery / learning-state line on Hub suggestion (same concept as recommendation).
2. Soft “why this step” on Adaptive run (from existing intervention metadata — no diagnose redesign).
3. Optional sanitized evidence summary (when intelligence flag on) folded into Hub soft copy.
4. MasteryTree labeling or eventual ConceptMastery-aware read (larger than Hub line).

### P2
1. Concept learning-state page / multi-concept overview.
2. Evidence history timeline.
3. Tutor structured “how am I doing” panel.
4. Full truthful mastery experience across Hub + Adaptive + Lucky.

### P3
1. CORE as non-mastery document host.
2. Ordinary Tutor Q&A without mastery chrome.
3. No XP / badges / leaderboards.
4. Raw EvidenceSignals JSON exposure (never).

---

## 15. ONE Recommended Next Implementation

### Name
**Hub suggestion soft learning-state line (ConceptMastery → present → card)**

### Intent (design only — do not implement in 2G-60)

Extend the **existing** Orchestrator present/suggestion path so that, for the recommended concept, the Hub card shows **one soft learner-facing line** such as:

- what the system currently believes is weaker/stronger among demonstrated facets (plain language), **or**
- that evidence is still thin (insufficient),

using data **already loaded** by `orchestrateForConcept` / `getLearnerConceptMastery`.

Constraints for a future implementation:

- No new mastery math, facets, scores, XP, or dashboard
- No diagnosis enum leakage
- No raw EvidenceSignals / misconception dumps
- Universal wording
- Optional / softWording-aligned
- Hub remains entry + explanation — still not a coordinator

---

## 16. Why It Was Selected

| Criterion | Fit |
|-----------|-----|
| Additive | Present-layer field + card line |
| Existing data | ConceptMastery already on diagnose path |
| Universal | Facet language, not domain UI |
| Safe scope | One concept, one recommendation context |
| Immediate use | Learners already open Hub for next step (2G-59) |
| Loop connection | Ties MASTERY ↔ REASON ↔ RECOMMENDATION |
| Avoids dashboard | Explicitly not MasteryTree rewrite or multi-concept UI |

---

## 17. Why Other Candidates Are Deferred

| Candidate | Why deferred |
|-----------|--------------|
| Full mastery dashboard | P2 / violates “not a dashboard” |
| Gamification (XP/badges) | Forbidden / not truthful |
| Replace MasteryTree with ConceptMastery in one shot | Larger product change; label/bridge first via Hub |
| Evidence timeline page | Useful P2; needs careful privacy |
| Adaptive mastery delta UI | Valuable P1 follow-on after Hub line |
| Tutor mastery panel | Conversational path already exists; structured UI optional |
| CORE mastery chrome | Intentionally different |
| LUCKY as mastery home | Retention ≠ mastery belief |
| New learner API dumping all facets as percentages | Risks false precision; prefer soft present copy first |

---

## 18. Explicit Non-Goals (this phase)

No production code; no Prisma/migrations; no mastery math/facets; no new mastery/evidence models; no gamification; no Hub/Adaptive/Orchestrator/Tutor/CORE/LUCKY redesign; no universal dashboard; no new recommendation engine; no new diagnosis categories.

---

## 19. Final Verdict

| Item | Result |
|------|--------|
| ConceptMastery visibility | **Architecture ready; product largely invisible** |
| Evidence visibility | **Computed; not learner-surfaced** (except soft reason prose) |
| Orchestrator explainability | **Soft RECOMMENDATION + REASON present; weak MASTERY link** |
| Dual TopicMastery UI | **Misleading risk vs ULE ConceptMastery** |
| Recommended next | **Hub soft learning-state line** |
| Classification of target | **B — SMALL ADDITIVE VISIBILITY BRIDGE** (addresses P1; mitigates P0 dual-model confusion at the ULE surface) |
| Architectural defects | **None (no E)** |
| 2G-60 status | **PASS** |

---

*Phase 2G-60 — Learner-Facing Mastery Visibility Audit.*

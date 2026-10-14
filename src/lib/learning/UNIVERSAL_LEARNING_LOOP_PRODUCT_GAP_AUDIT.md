# 2G-58 — Universal Learning Loop Product Gap Audit

**Mode:** Audit / inspection only. **No production code changes.**

**Predecessors:** 2G-51–2G-57 (activity adapters, vertical integration, PERFORM mastery + bridge design). Architecture is broader than the shipped product; reserved LO types ≠ missing architecture.

---

## 1. Executive Summary

The Universal Learning Engine **spine is real** for supported activities:

```text
LearningAttempt → ConceptMastery → Orchestrator diagnose
  → (Adaptive) activity → evidence bind → re-orchestrate → next / stop
  → (on COMPLETE) weak-mastery LUCKY RetentionItem
```

That closed loop is **learner-reachable** mainly via **Study hub → Start/Resume adaptive study → SIX (and Quiz/Flashcard when already on an Adaptive step)**.

The most important **product-level** gap is not a missing facet, engine, or subsystem. It is that the Study hub’s **primary “Try it” CTA** opens the recommended SIX activity **without Adaptive context**, so the everyday recommendation path often writes evidence/mastery but **does not re-orchestrate or present a next intervention**. The secondary Adaptive button closes the loop; the primary CTA does not.

**Recommended next implementation (ONE):**  
Unify the Study-hub primary recommendation action with Adaptive Sequence start + step launch so Diagnose → Activity → Evidence → Next Recommendation is the default path for existing SIX recommendations.

**Not selected:** PERFORM producers, coding/labs, Orchestrator-emitting Quiz/Flashcard as first-class diagnose interventions (conflicts with frozen “Orchestrator owns SIX recommendations; ASSESS ≠ Quiz”), CORE evidence production, or new diagnosis categories.

---

## 2. Current End-to-End Loop

| Stage | Status | Notes |
|-------|--------|-------|
| Learner | Present | Auth + Study / Core / Quizzes / Flashcards |
| Learning Space | Present | Knowledge model / course context |
| Concept | Present | Including CORE knowledge confirm |
| Learning state / evidence | Present | `LearningAttempt` producers |
| Diagnosis | Present | `orchestrateFromLearnerState` |
| Intervention | Present | SIX-only Orchestrator intervention |
| Activity | Present | SIX guided; Quiz; Flashcard |
| Learner interaction | Present | Evaluate / submit / rate |
| LearningAttempt | Present | Bridges |
| Mastery | Present | `ConceptMastery` (+ legacy TopicMastery dual-write) |
| Evidence Intelligence | Present | Flag-gated enrichment |
| Orchestrator | Present | Suggestion API + hub card |
| Next intervention | **Partial** | Only inside Adaptive plan-next |
| Adaptive Sequence | Present | Start/resume/complete/bind |
| LUCKY retention | Present | Weak-mastery + retention review; legacy planner parallel |

**Loop status:** **CLOSED inside Adaptive; OPEN (recommendation-only) on primary hub “Try it”.**

---

## 3. CORE Audit

| Question | Finding |
|----------|---------|
| Create/use notes reliably? | **Yes** — `Note.contentJson`, Core workspace / shelf |
| Useful learning artifacts? | **Yes** — notes, study extract metadata, assist |
| Connect to Concepts? | **Yes** — `core-bridge` preview/confirm/reject |
| Capture LearningAttempt evidence? | **No** — Assist uses `evidenceIntent: "none"` |
| Participate in learning loop? | **Knowledge ingress + navigation**, not evidence producer |
| Learning intent on actions? | CREATE-ish projections exist; not ULE-consumed from Core UI |
| Stop before evidence? | Autosave, confirm Concept, Assist, adaptive doc transform |

**Classification:** **D — INTENTIONALLY DIFFERENT** (document/knowledge host; CORE→SIX→LUCKY via product line, not CORE-owned attempts).

**Smallest meaningful enhancement (describe only):** After Concept confirm, deep-link / CTA into Orchestrator or Adaptive for that `conceptId` — still no CORE evidence writer.

---

## 4. SIX Audit

Canonical closed path: `app/study/six/[component]` → `POST /api/study/evaluate` (`mode: "six"`) → `recordStudyEvaluateEvidence` → optional `bindSixEvaluateAttemptToAdaptiveSequence`.

| Technique | Evidence? | Facet | Adaptive bind? | Guide vs closed | Notes |
|-----------|-----------|-------|----------------|-----------------|-------|
| Chunking | Yes | RECOGNIZE | Yes (final stage gate) | Closed guided + Core CTA exit | Core exit ≠ evidence |
| Detailed Explanation | Yes | EXPLAIN | Yes | Closed + Teach Me CTA | Teach Me separate evaluate; no Adaptive bind |
| Feynman | Yes | EXPLAIN | Yes | Same | Same |
| Visualization | Yes | EXPLAIN | Yes | Closed + Core CTA | Not PERFORM (intentional) |
| Hands-on Practice | Yes | **APPLY** | Yes | Closed + `/study/practice` CTA | Not PERFORM; practice workspace no Adaptive bind |
| Active Recall | Yes | RETAIN | Yes | Closed + Flashcards CTA | Flashcards write own RETAIN |

Adaptive eligibility: final stage + score ≥ 65 (`six-completion.ts`). Intermediate evaluates still create attempts; bind skipped until complete.

**Classification:** Guided evaluate path **A — CLOSED** (with Adaptive context). Secondary guide destinations **D** or small **B** if product wants those surfaces to bind.

---

## 5. LUCKY Audit

| Path | Behavior |
|------|----------|
| Weak mastery → RetentionItem | `syncWeakMasteryRetentionItem` when `reviewCount ≥ 1` and `retain < 0.45` |
| Retention review → evidence | `submitRetentionReview` → `lucky_retention_review` / RETAIN → ConceptMastery |
| Adaptive COMPLETE → LUCKY | `syncLuckyRetentionAfterSequenceComplete` (soft-fail) |
| Legacy Lucky session planner | `lucky-engine` timed blocks — counts-based navigation, not Orchestrator diagnose |

**Classification:** ULE retention spine **A — CLOSED**. Legacy planner **D — INTENTIONALLY DIFFERENT** (parallel UX; optional future connect = P2).

---

## 6. Orchestrator Audit

| Capability | Status |
|------------|--------|
| Diagnosis | UNDERSTANDING / APPLICATION / RECALL / RETENTION / INSUFFICIENT / NO_INTERVENTION |
| Intervention | Always SIX (`kind: "six"`) — never Quiz/Flashcard ids |
| Intent preference | Soft SIX prefer for UNDERSTAND/PRACTICE after diagnosis |
| Prerequisites | Hints only |
| Presentation | Natural-language suggestion; `href` = SIX guide |
| Suggestion UI | `OrchestratorSuggestionCard` — Try it + Adaptive |
| Adaptive entry | Explicit Start/Resume button |
| Stopping | Adaptive STOP_* ; present null on NO_INTERVENTION |
| PERFORM_GAP | **Absent** (intentional until PERFORM producer) |

**Closes loop:** Only when learner enters Adaptive.  
**Stops at recommendation:** Hub suggest API + primary Try it link.

**Classification:** Recommendation layer **A** for architecture; product dual-CTA **B** (see §16).

---

## 7. Evidence Producer Audit

| Activity | sourceRef.kind | Facet | Completion / Adaptive | Re-orchestrate |
|----------|----------------|-------|----------------------|----------------|
| Quiz | `quiz_attempt` | RECOGNIZE | Bind on whole-quiz submit if adaptive context | Via quiz Adaptive adapter |
| Flashcard | `flashcard_review` | RETAIN | Bind on rating if adaptive context | Via flashcard adapter |
| SIX / Study Evaluate | `study_evaluate` | Per technique | Bind when SIX completion gate + adaptive context | Via six adapter |
| Blurting / Teach Me | `study_evaluate` | RETAIN / EXPLAIN | **No** Adaptive bind | No |
| Tutor (gated intents) | `tutor_interaction` | EXPLAIN/APPLY/SOLVE | None | None |
| LUCKY retention review | `lucky_retention_review` | RETAIN | None | None |

Ordinary Tutor Q&A and CORE Assist: **intentionally no evidence**.

**Gap (existing activity):** Hub Try it → SIX evaluate without adaptive query → evidence yes, Adaptive progression no.

---

## 8. Mastery Facet Audit

| Facet | Persist | Production evidence | Aggregate | Learner-visible | Orchestrator |
|-------|---------|---------------------|-----------|-----------------|--------------|
| RECOGNIZE | Yes | Quiz; SIX chunking | Yes | Legacy TopicMastery “understanding” only | UNDERSTANDING_GAP |
| EXPLAIN | Yes | SIX explain-family; Tutor | Yes | Legacy | UNDERSTANDING_GAP |
| APPLY | Yes | SIX hands-on; Tutor | Yes | Legacy “application” | APPLICATION_GAP |
| SOLVE | Yes | Tutor solve only | Yes | **No** Concept facet UI | Sum only |
| PERFORM | Yes | **None** | Yes | No | No gap policy |
| RETAIN | Yes | Flashcard; Lucky; active-recall/blurting | Yes | Legacy “recall” | RECALL/RETENTION_GAP |

**Product visibility:** Study MasteryTree shows **TopicMastery**, not `ConceptMastery` facets — architecture-supported mastery is under-exposed in UI (**B** for visibility; not a spine defect).

---

## 9. Adaptive Sequence Audit

| Concern | Status |
|---------|--------|
| Start / resume | Yes — hub + APIs |
| Step resolve / launch | SIX / Quiz / Flashcard on run page |
| Completion + evidence bind | Activity-specific soft-fail binds |
| Re-orchestration | `recordAdaptiveSequenceCompletionAndPlanNext` |
| Stop / abandon / idempotent | Implemented |
| LUCKY handoff | On COMPLETE only |
| Natural Orchestrator start | First step = SIX component from diagnose |
| Quiz/Flashcard as **first** step from diagnose | **Not emitted** by Orchestrator (by design) — adapters usable when step intervention is quiz/flashcard |

**E2E usability:** **Yes for SIX-from-hub-Adaptive.** Quiz/Flashcard verticals work when Adaptive context is present; they are not the default diagnose intervention (**D** relative to Orchestrator catalog).

---

## 10. Assessment Audit

```text
ASSESS → Assessment Workflow → (explicit adapterKey) → Quiz/Flashcard launch
  → existing bridges → LearningAttempt → ConceptMastery
```

| Leg | Status |
|-----|--------|
| Workflow + modes | Ready (DIAGNOSTIC / VERIFICATION / PRACTICE_CHECK) |
| Quiz + Flashcard adapters | Ready |
| Evidence | Via existing bridges (adapters do not write) |
| Hub consumption of `assessmentHandoff` | **Absent** — metadata only on suggestion view |

**Classification:** Spine **A**; hub wiring **B**.

---

## 11. Tutor Audit

| Concern | Status |
|---------|--------|
| Intent propagation | Echo / metadata; does not force evidence |
| Learner / knowledge reads | Yes (`loadTutorContext`) |
| Evidence writes | Intent-gated only |
| Meaningful evidence | explain / apply / solve / practice / guided |
| Ordinary Q&A | `none` — no attempt |

**Classification:** **D** for ordinary chat; gated evidence **A**.

---

## 12. Intent Audit

| Purpose | Captured | Propagated | Consumed | Product gap |
|---------|----------|------------|----------|-------------|
| UNDERSTAND | Yes | Decision context | Soft SIX prefer | Hub rarely passes intent |
| PRACTICE | Yes | Same | Soft SIX prefer | Same |
| ASSESS | Yes | `assessmentHandoff` | Workflow API if caller supplies adapterKey | Hub never starts Assessment |
| CREATE | Yes (e.g. Core projections) | Metadata | **Not** in Orchestrator/Adaptive | Unused in ULE loop |

PERFORM remains a **facet**, not an intent.

---

## 13. Learner-Facing Experience Audit

| Surface | Diagnose→…→Next usable? |
|---------|-------------------------|
| Study hub + **Adaptive** button | **Yes** |
| Study hub + **Try it** | Evidence/mastery possible; **no** Adaptive next step |
| Adaptive run page | **Yes** |
| Quiz / Flashcard standalone | Evidence/mastery; next Orchestrator needs return to hub |
| CORE | Knowledge / exits — not evidence loop |
| Lucky session (legacy) | Navigation planner; ULE retention strip separate |
| MasteryTree | Legacy TopicMastery — Concept facets not shown |

**Verdict:** Architecture is usable; **default hub CTA under-uses the closed Adaptive loop.**

---

## 14. Findings Classification

| ID | Finding | Class |
|----|---------|-------|
| F1 | Hub primary “Try it” bypasses Adaptive re-orchestration | **B** (misleading dual-CTA → treat as P0 product) |
| F2 | `assessmentHandoff` unused in hub UI | **B** |
| F3 | ConceptMastery facets not learner-visible (TopicMastery UI) | **B** |
| F4 | CORE confirm Concept does not enter Orchestrator/Adaptive | **B** |
| F5 | Blurting / Teach Me / practice workspace lack Adaptive bind | **B** / **D** |
| F6 | Orchestrator interventions are SIX-only | **D** |
| F7 | CORE / ordinary Tutor produce no evidence | **D** |
| F8 | PERFORM unused in production | **C** (future activity; bridge designed 2G-57) |
| F9 | Legacy Lucky planner ≠ ULE diagnose | **D** / optional **C** |
| F10 | Coding/lab/sim engines absent | **C** (reserved types only) |
| F11 | No PERFORM_GAP / no new facets needed | **D** / **A** |
| — | Parallel evidence/mastery spines | **Not found** — no **E** |

**No E — ARCHITECTURAL DEFECT** findings.

---

## 15. P0 / P1 / P2 / P3 Prioritization

### P0 — Critical (misleading current path)
1. **Study-hub primary “Try it” does not enter the Adaptive closed loop** while Adaptive is the only path that re-orchestrates next interventions.

### P1 — High-value additive
1. Surface ASSESS → Assessment consumer from hub when `assessmentHandoff` present (explicit adapterKey).
2. Learner-visible ConceptMastery (or clear bridge from TopicMastery UI) after activities.
3. Post–CORE Concept confirm CTA into Orchestrator/Adaptive.
4. Optional Adaptive bind for Teach Me / blurting when launched from Adaptive (if product wants).

### P2 — Future feature
1. PERFORM-producing activity (per 2G-57 Option B) when product chooses a domain.
2. Deeper Lucky planner ↔ ULE diagnose unification.
3. Domain engines (coding/lab/sim/etc.).

### P3 — Intentional / defer
1. CORE as non-evidence document host.
2. Orchestrator not emitting Quiz/Flashcard diagnose interventions.
3. Ordinary Tutor Q&A without evidence.
4. Hands-on = APPLY (not PERFORM).
5. No PERFORM_GAP until producer exists.

---

## 16. Recommended Next Implementation

### Target name
**Study-hub recommendation → Adaptive closed-loop bridge**

### Scope (design only — do not implement in 2G-58)
Make the primary “Suggested next step” action start or resume an Adaptive Sequence for the suggested concept and launch the current SIX step **with Adaptive run/step context**, so evaluate → bind → plan-next → next recommendation works without requiring the learner to discover the secondary Adaptive button.

Prefer **Preserve → Connect → Upgrade → Extend**:
- Reuse `POST /api/study/adaptive/start`, existing SIX Adaptive launch query params, and existing evaluate bind.
- Do **not** change diagnose catalogs, add Quiz as Orchestrator intervention, or invent new evidence models.

---

## 17. Why This Target

| Criterion | Fit |
|-----------|-----|
| Real existing code | Hub card, Adaptive start, SIX evaluate bind, plan-next |
| Real learner flow | Study hub “Suggested next step” is the main ULE surface |
| Evidence/mastery impact | Keeps existing evidence; **adds** re-orchestration / next step |
| User value | Turns recommendation into a continuous learning loop |
| Additive scope | Small product/UX + wiring bridge; no architecture redesign |
| Aligns with frozen rules | Orchestrator stays recommendation/SIX; Adaptive owns progression |

---

## 18. Why Other Candidates Are Deferred

| Candidate | Why deferred |
|-----------|--------------|
| PERFORM activity / PERFORM_GAP | Architecture ready; no producer; 2G-57 Option B is future product |
| Coding / labs / sims | Reserved LO types; larger features |
| Orchestrator emits Quiz/Flashcard | Conflicts with SIX-first Orchestrator + ASSESS ≠ Quiz |
| ASSESS hub wiring | Valuable P1, but ASSESS is less frequent than everyday Try it |
| ConceptMastery UI | Visibility P1; does not close action loop by itself |
| CORE evidence writer | Intentionally different |
| Relabel Hands-on → PERFORM | Forbidden / incorrect semantics |
| New diagnosis / facets / adapters | Not required to close existing SIX loop |

---

## 19. Explicit Non-Goals (this phase)

No production changes; no Prisma migrations; no new Attempt/Mastery models; no PERFORM_GAP; no domain engines; no new SIX techniques; no CORE/LUCKY/Tutor redesign; no new Assessment/Adaptive adapters; no microservices; no DB migration; no UI replacement; no removal of existing functionality.

---

## 20. Final Verdict

| Item | Result |
|------|--------|
| Architecture fitness | **Sound** — one ULE spine; no E defects |
| Product loop fitness | **Partial** — closed in Adaptive; primary hub CTA open |
| Recommended next | **Study-hub Try it → Adaptive closed-loop bridge** |
| Classification of target | **B — SMALL ADDITIVE PRODUCT BRIDGE** (P0 product priority) |
| 2G-58 status | **PASS** |

---

*Phase 2G-58 — Universal Learning Loop Product Gap Audit.*

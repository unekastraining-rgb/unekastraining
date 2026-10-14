# 2P-1 — Real Learner End-to-End Flow Audit

**Mode:** Audit + targeted UX hardening. No architecture rewrite.  
**Predecessors:** 2G-78 entry points · 2G-79 Learner Model · 2G-80 decision loop · 2G-81 activity coverage.

---

## Executive Summary

A real learner **can** enter Study Haul, receive an Adaptive intervention, produce evidence, update ConceptMastery, and get a re-orchestrated next step — **on the server**.

**P0 product breaks found and fixed in 2P-1:**

1. After Adaptive Coding/SQL/Lab/Simulation/Presentation submit, the UI stranded the learner (no return to run shell) even though Adaptive bind + plan-next had succeeded.
2. After Adaptive Flashcard review, the UI ignored the Adaptive bind payload (no return CTA).

**Still intentional / deferred:** Tutor meaningful-evidence path is gated and not wired through live public Tutor/SIX/Teach-me adapters; Writing/Game/Project remain evidence-closed but not Adaptive-ready.

---

## Current Real Learner Journey

```text
ENTRY (Hub / CORE / Study Now)
→ POST /api/study/adaptive/start
→ /study/adaptive/[runId] (AdaptiveSequenceRunShell)
→ launch activity (sixHref / quiz / flashcard / activity kind)
→ submit / evaluate / review
→ LearningAttempt + ConceptMastery
→ Adaptive bind + plan-next (orchestrateForConcept)
→ return to run shell → next step OR complete → Lucky handoff
```

Canonical start: `POST /api/study/adaptive/start`  
Canonical re-orch: `recordAdaptiveSequenceCompletionAndPlanNext` → `orchestrateForConcept`

---

## Entry Points

| Entry | Type | Path |
|-------|------|------|
| Hub OrchestratorSuggestionCard | Adaptive | Start/Resume → `/api/study/adaptive/start` |
| CORE Continue learning | Adaptive | `CoreKnowledgeBridgePanel` → Adaptive start |
| Study Now Continue learning | Adaptive | `ContinueLearningButton` when `Topic.conceptId` |
| Hub SIX Try it / activity Open | Direct | Preserved (2G-78) |
| Quiz / Flashcards / SIX routes | Direct | Work without Adaptive |
| Assessment ASSESS lane | Adaptive | Separate assessment workflow |
| Assignments / Locker tools | Direct | Intentional bypass |

---

## Adaptive Journey

| Stage | Implementation |
|-------|----------------|
| Start / resume | `POST /api/study/adaptive/start` — ownership-checked concept |
| Run page | `/study/adaptive/[runId]` → `AdaptiveSequenceRunShell` |
| Current step | Server-backed run state; UI reflects persisted step |
| Intervention | Orchestrator diagnosis → activity kind / SIX technique |
| Launch | `sixHref` or activity route with adaptive query params |
| Completion | Activity/Quiz/Flashcard/SIX bind → plan-next |
| Evidence binding | `bindUniversalActivityToAdaptive` / quiz & flashcard adapters |
| Terminal | `completeAdaptiveSequence` → Lucky sync |
| Abandon | `abandonAdaptiveSequence` — **no** Lucky handoff |
| Guards | Duplicate submission, stale/future step, ownership preserved |

Learner stuck-state audit: after 2P-1 fixes, Adaptive-ready activities return to the shell. Unavailable steps show finish/abandon guidance instead of a dead end.

---

## Direct Access Journey

| Path | Bypasses Adaptive? | Evidence? | Concept? | Mastery? | Documented? |
|------|--------------------|-----------|----------|----------|-------------|
| Hub SIX Try It | Yes | Study Evaluate | Optional | Yes when owned concept | 2G-78 |
| Hub activity Open | Yes | Kind-specific | Optional | Yes when owned | 2G-78 |
| Assignments Practice | Yes | When submitted | Often absent | Only if concept | Intentional |
| SIX techniques routes | Yes | Evaluate | Optional | Yes when owned | Intentional |
| Direct Quiz | Yes | QuizAttempt → LearningAttempt | Via topic | Yes | Intentional |
| Direct Flashcards | Yes | Review → LearningAttempt | Via topic | Yes | Intentional |
| Locker tools | Yes | Tool-specific | Often absent | No fabrication | Intentional |

**Do not merge** Direct with Adaptive merely because UI looks similar.

---

## CORE Journey

CORE remains the knowledge/learning workspace.

- Opening/editing notes, formatting, templates, studio generate, CORE chat: **do not** write ConceptMastery.
- Continue Learning bridge: when an owned linked concept exists → Adaptive start (no local mastery invent).
- CORE does not become an assessment engine.

---

## SIX Journey

All six techniques remain first-class:

1. Chunking  
2. Detailed Explanation  
3. Feynman Technique  
4. Visualization  
5. Hands-on Practice  
6. Active Recall  

Adaptive uses SIX through the existing adapter. Study Evaluate remains the evidence path where appropriate. Direct SIX catalog access preserved.

---

## Assessment Journey

ASSESS remains a **separate** assessment workflow (not “every activity is assessment”).

- Intent `ASSESS` is soft/contextual — does not override diagnosis or fabricate evidence.
- Quiz is **not** the universal assessment for all Adaptive steps.
- Quiz Adaptive path: QuizAttempt → LearningAttempt → mastery → re-orchestration → Continue CTA.

---

## Tutor Journey

| Layer | Status |
|-------|--------|
| Library meaningful-evidence path | Exists; ownership-gated |
| Public `/api/study/tutor` | Forces `evidenceIntent: "none"` (security-correct) |
| Live UI wiring of meaningful path | **Not productized** — INTENTIONALLY OUTSIDE live ULE UX |

Do not weaken Tutor evidence gates to “close” this gap.

---

## Lucky Journey

```text
Adaptive terminal completeAdaptiveSequence
→ syncLuckyRetentionAfterSequenceComplete
→ learner can Open Lucky retention
```

Verified:

- Abandon does **not** trigger Lucky  
- Intermediate steps / plan-next do **not** trigger Lucky  
- Duplicate completion does not double-trigger (idempotent complete)  
- Conceptless retention does not fabricate ConceptMastery  

---

## Evidence → Mastery → Orchestrator Loop

```text
Activity
→ recordEvidence
→ LearningAttempt
→ applyEvidenceToMastery
→ ConceptMastery
→ orchestrateForConcept
→ diagnosis
→ intervention/activity
→ learner continuation
```

2G-80 behavior remains possible:

```text
APPLICATION_GAP → APPLY evidence → ConceptMastery → re-orch → changed diagnosis (e.g. RETENTION_GAP)
```

No mastery cache. Coordinator does not invent evidence. Next decision reads **current persisted** mastery/evidence.

---

## Intent Boundary

`UNDERSTAND` / `PRACTICE` / `ASSESS` / `CREATE` remain soft/contextual.

Intent does **not**:

- override diagnosis  
- fabricate evidence  
- bypass completion or ownership  
- turn every activity into assessment  
- make Quiz universal assessment  
- replace SIX intervention logic  

CREATE remains specialized. ASSESS remains a separate workflow.

---

## Concept Security

| Check | Result |
|-------|--------|
| Foreign concept IDs rejected | Yes (`foreign_concept`) |
| Missing concept IDs not fabricated | Yes |
| Concept context does not silently switch | Bind validates run concept |
| Evidence cannot attach to another learner’s concept | Ownership + concept checks |
| Adaptive completion cannot bind Attempt for another concept | Adapter/coordinator guards |
| Direct access without concept remains valid | Yes — intentional |

Learner-facing: raw `foreign_concept` mapped to readable copy in ActivityWorkspace.

---

## Learner Model Truth

- ULE mastery truth = **ConceptMastery**  
- TopicMastery = legacy / topic / curriculum progress  
- Adaptive orchestrator reads ConceptMastery  
- Learner Model page not redesigned in 2P-1  
- Dual TopicMastery writes on some quiz/flashcard/evaluate paths remain **legacy coexistence** (documented, not removed)

---

## Empty / Error / Unavailable States

| State | Learner outcome |
|-------|-----------------|
| No concept | Adaptive start blocked; direct activities may still run |
| No mastery | Orchestrator can still diagnose from empty/low evidence |
| Insufficient evidence | Diagnosis reflects gap; no fabricated attempts |
| No / unavailable activity | Shell: finish or abandon guidance (fixed) |
| Invalid activity | Error + safe return path |
| Completed run | Terminal + Lucky link + Hub back |
| Abandoned run | Not presented as active |
| Missing Quiz / Flashcard | Unavailable message; Complete/Abandon still available |
| Missing LearningAttempt | Bind fails closed — no fake mastery |
| Stale run / step | Server rejects; UI notice |
| Unauthorized concept | Rejected; learner-facing message |

Do **not** fabricate activities or mastery to avoid empty states.

---

## Experience table

| Experience | Entry | Concept | Evidence | Mastery | Orchestrator | Adaptive | Learner Next Step | Status |
|------------|-------|---------|----------|---------|--------------|----------|-------------------|--------|
| Hub → Adaptive → SIX | Hub CTA | Owned | Study Evaluate | Yes | Yes | Yes | Auto-return shell | **PASS** |
| CORE → Continue Learning | CORE CTA | Linked | Via Adaptive step | Yes | Yes | Yes | Return after activity (fixed) | **PASS WITH NOTES** |
| Study Now → Adaptive | Study Now | Topic.conceptId | Via Adaptive | Yes | Yes | Yes | Same | **PASS WITH NOTES** |
| Adaptive → Coding/SQL/Lab/Sim/Presentation | Shell launch | Required | Authoritative | Yes | Re-orch | Yes | Continue CTA (fixed) | **PASS** |
| Adaptive → Quiz | Shell | Via topic | Quiz bridge | Yes | Re-orch | Yes | Continue CTA | **PASS** |
| Adaptive → Flashcard | Shell | Via topic | Flashcard bridge | Yes | Re-orch | Yes | Continue CTA (fixed) | **PASS** |
| Direct SIX | Catalog | Optional | Evaluate | Yes | Reads | No | Stay on SIX | **PASS** |
| Direct Quiz | /quizzes | Via topic | Submit | Yes | Reads | No | Results | **PASS** |
| Direct Flashcard | /flashcards | Via topic | Review | Yes | Reads | No | Next card | **PASS** |
| Tutor meaningful evidence | Lib only | Owned | When authorized | Yes | Reads | No | Not live-wired | **INTENTIONALLY OUTSIDE** |
| Lucky terminal | Complete run | Concept | Retention sync | — | — | Terminal | Lucky link (additive) | **PASS WITH NOTES** |
| Legacy code-evaluate | Direct | — | TopicMastery only | Legacy | No | No | — | **LEGACY** |

---

## Breaks found

| Break | Class | Severity | Action |
|-------|-------|----------|--------|
| Activity submit no Adaptive return | NAVIGATION GAP | P0 | **Fixed** — ActivityWorkspace Continue CTA |
| Flashcard review no Adaptive return | NAVIGATION GAP | P0 | **Fixed** — flashcards-view Continue CTA |
| Complete CTA while activity unavailable | UX GAP | P1 | **Fixed** — helper copy + “Finish adaptive study” |
| Completed run silent Lucky | NEXT-STEP GAP | P1 | **Fixed** — Open Lucky retention link |
| Raw `foreign_concept` error | UX GAP | P1 | **Fixed** — learner-facing message |
| Tutor meaningful path unwired | EVIDENCE GAP | P2 | Documented — do not weaken 2G-67 |
| Hub empty suggestion invisible | UX GAP | P2 | Deferred |
| Quiz/FC “none exist yet” | EMPTY STATE | P2 | Deferred (Complete/Abandon still available) |
| TopicMastery dual-write ambiguity | MASTERY VISIBILITY GAP | P2 | Deferred (labels already clarified in 2G-79) |

UNDERSTAND→…→RETAIN stage completeness is **not** required on every path. Paths that match diagnosis and continue naturally are classified NONE or fixed NAVIGATION/UX only.

---

## Targeted fixes made

| File | Fix |
|------|-----|
| `src/components/study/ActivityWorkspace.tsx` | Adaptive return CTA + ownership error copy |
| `app/flashcards/flashcards-view.tsx` | Adaptive return CTA after review bind |
| `src/components/study/AdaptiveSequenceRunShell.tsx` | Unavailable-step guidance; Lucky link on complete |

---

## Remaining product gaps

1. Live Tutor routes force `evidenceIntent: "none"` (security-correct; meaningful path unused in UI).
2. Writing / Game / Project not Adaptive-ready (intentional per 2G-81).
3. Hub Orchestrator empty state is silent (`null` card).
4. Quiz/Flashcard Adaptive unavailable messages lack “create” deep links.
5. Dual TopicMastery write on quiz/flashcard/evaluate (legacy coexistence).

---

## Deferred work

- Promote Writing/Game/Project into Adaptive (needs coverage gates, not cosmetics).
- Wire Tutor meaningful evidence into a live authorized surface.
- Hub empty-suggestion UX.
- Quiz/Flashcard creation deep-links from Adaptive unavailable states.
- Learner Model page redesign (explicitly out of 2P-1).

---

## Activity coverage (from 2G-81, unchanged)

**Adaptive-ready:** Coding, SQL, Lab, Simulation, Presentation, SIX, Quiz (adapter), Flashcard (adapter).

**Evidence-producing, not Adaptive-ready:** Writing, Game, Project, authorized Tutor, Lucky.

---

## Test coverage

| Test | Coverage |
|------|----------|
| TEST A | Adaptive return UX after activity/quiz/flashcard/SIX bind (source + preserved paths) |
| TEST B | Direct access preserved (entry-point kinds + routes) |
| TEST C | Foreign concept rejection on activity route |
| TEST D | Decision-loop / orchestrator current-state (existing 2G-80 suite) |
| TEST E | Lucky handoff complete-only (not abandon) |
| TEST F | Unavailable step copy + finish/abandon safe continuation |
| Artifact | `REAL_LEARNER_FLOW_AUDIT.md` present with required sections |

File: `src/lib/learning/real-learner-flow.integrity.test.ts` (14 tests).

---

## Verification results

| Check | Result |
|-------|--------|
| `real-learner-flow.integrity.test.ts` | **14 passed** |
| `src/lib/learning` full suite | **110 files / 1168 tests passed** |
| ESLint (ActivityWorkspace, AdaptiveSequenceRunShell, integrity test) | **clean (exit 0)** |
| TypeScript `tsc --noEmit` | **3 pre-existing baseline errors** (unchanged): `notebook-desk.ts`, `generate-offline-fallback.integration.test.ts` (`focusTopic`), `resolve-loop-focus-topic.ts` |
| New failures introduced by 2P-1 | **none** |

---

## Architecture confirmation

- ONE Universal Learning Engine  
- ONE Learner Model  
- ONE Knowledge Model  
- ONE ConceptMastery truth for ULE  
- ONE Evidence spine  
- ONE Orchestrator  
- ONE Assessment workflow  
- ONE Adaptive sequence engine  
- **CORE → SIX → LUCKY** preserved  
- TopicMastery remains legacy/compatibility  
- No second competing architecture introduced  

# Phase 2G-51 — Universal Activity Adapter Convergence Audit

**Status:** Inspection / convergence only. **No production code changes.**  
**Date:** 2026-09-20  
**Depends on:** 2G-41 design · 2G-42–2G-47 Assessment bridge · 2G-48–2G-50 Quiz vertical proof  
**Reference path:** Owned Quiz → Resolve → Prepare → Launch → Quiz UX → QuizAttempt → LearningAttempt → Mastery

---

## Verdict

**NO PRODUCTION CHANGES REQUIRED.**

The Universal Learning Engine already shares one evidence/mastery spine across activity families. Quiz is the reference **AssessmentAdapter** implementation; SIX and Quiz already participate in Adaptive Sequence via sequence adapters. Other families are intentionally different interaction patterns (evidence producers, hosts, or knowledge services) — not missing Quiz clones.

| Classification | Families |
|----------------|----------|
| **NO CHANGE REQUIRED** | Quiz (Assessment + Adaptive + Evidence), SIX (Adaptive + Evaluate evidence), Evidence/Mastery spine, Adaptive coordinator, Orchestrator, CORE→SIX→LUCKY product line |
| **SMALL ADDITIVE BRIDGE REQUIRED** (future) | Flashcard Assessment/Adaptive adapter (optional), Study Evaluate (blurting/teach-me) Adaptive bind polish if promoted to Assessment adapters |
| **LARGER FUTURE FEATURE** | CODING_CHALLENGE, SQL_CHALLENGE, LAB, SIMULATION, GAME, WRITING_EXERCISE, PROJECT_TASK, PRESENTATION_PRACTICE (enum/type identifiers only today) |
| **INTENTIONALLY DIFFERENT** (do not force launchable ActivityAdapter) | CORE (knowledge + assist host), Tutor (interaction/evidence producer), LUCKY/Retention (review path, not Assessment launch) |

**Universal architecture ≠ identical implementation.**

---

## 1. Factual activity inventory

### 1.1 Canonical type identifiers (`LearningObjectTypeName`)

Source: `src/lib/learning/types.ts` ↔ `prisma/schema.prisma` `enum LearningObjectType`.

| Identifier | Real activity / system in repo? | Notes |
|------------|----------------------------------|-------|
| `EXPLANATION` | Yes (via SIX detailed-explanation evaluate) | LO type from evaluate-bridge mapping |
| `QUIZ_ITEM` | Yes — Quiz product | Assessment + Adaptive + quiz-bridge |
| `FLASHCARD` | Yes — Flashcard product | flashcard-bridge → RETAIN; retention source |
| `FEYNMAN` | Yes (SIX feynman + teach-me evaluate) | Not a separate product surface |
| `VISUALIZATION` | Yes (SIX visualization evaluate) | |
| `HANDS_ON_PRACTICE` | Yes (SIX hands-on-practice evaluate) | Textual practice → APPLY |
| `ACTIVE_RECALL` | Yes (SIX active-recall + blurting evaluate) | |
| `TUTOR_TURN` | Yes — Tutor evidence path | `maybeRecordTutorEvidence` |
| `CODING_CHALLENGE` | **No system** | Enum + Assessment test stubs only |
| `SQL_CHALLENGE` | **No system** | Enum + Assessment test stubs only |
| `SIMULATION` | **No system** | Enum + registry stub tests only |
| `GAME` | **No system** | Enum only |
| `WRITING_EXERCISE` | **No system** | Enum only |
| `PROJECT_TASK` | **No system** | Enum only |
| `PRESENTATION_PRACTICE` | **No system** | Enum only |
| `LAB` | **No system** | Enum + Assessment test stubs only |
| `RETENTION_ITEM` | Yes — LUCKY retention review | `retention/review.ts` |
| `OTHER` | Catch-all | SIX chunking / unknown evaluate |

### 1.2 Adapter / bridge inventory (actual modules)

| Layer | Module | Role |
|-------|--------|------|
| Assessment registry | `assessment/adapter-registry.ts` | `AssessmentAdapter` = `canHandle` + `resolve` + optional `prepare` |
| Assessment Quiz adapter | `assessment/quiz-assessment-adapter.ts` | Only production AssessmentAdapter (`key: "quiz"`) |
| Assessment resolve/prepare/launch | `activity-resolution.ts`, `activity-preparation.ts`, `activity-launch.ts` | Universal orchestration; Quiz is first launch href builder |
| Assessment consumer | `standalone-assessment-consumer.ts` | Standalone resolve→prepare→launch for Quiz |
| Adaptive Quiz | `sequence/quiz-adapter.ts` + `quiz-submit-bind.ts` | Intervention `quiz`; href; completion bind |
| Adaptive SIX | `sequence/six-adapter.ts` + `six-evaluate-bind.ts` | SIX components; guide href; completion bind |
| Adaptive↔Assessment bind | `assessment/adaptive-step-bridge.ts` | Passive plan↔step validation |
| Evidence Quiz | `assessment/quiz-bridge.ts` | QuizAttempt → LearningAttempt (RECOGNIZE) |
| Evidence Flashcard | `assessment/flashcard-bridge.ts` | Review → LearningAttempt (RETAIN) |
| Evidence Study Evaluate | `assessment/evaluate-bridge.ts` | blurting / teach-me / six → LearningAttempt |
| Evidence Tutor | `tutor/evidence.ts` | Intentional tutor demos → LearningAttempt |
| Evidence Retention | `retention/review.ts` | Review outcome → RETENTION_ITEM LO + evidence |
| Tutor CORE assist | `tutor/core-adapter.ts` | Prompt/payload for CORE chat — not AssessmentAdapter |
| Tutor Teach-Me | `tutor/teach-me-adapter.ts` | Teach-me evaluate scoring path |
| Tutor SIX | `tutor/six-adapter.ts` | Tutor-mode SIX assist (distinct from sequence six-adapter) |
| Knowledge CORE | `knowledge/core-bridge.ts` | Concept candidates from study extract — not an activity |

### 1.3 Product families (not LO enum rows)

| Family | What it is |
|--------|------------|
| **CORE** | Notebook / source-grounded assist + knowledge bridge into Concepts |
| **SIX** | Six guided techniques (`lib/csl/six.ts`) + evaluate + Adaptive sequence |
| **LUCKY** | Retention / spaced review path over RetentionItems |
| **Quiz** | Owned Quiz rows + QuizTaker + submit |
| **Flashcards** | Owned Flashcard rows + review ratings |
| **Tutor** | Multi-mode tutoring service producing optional TUTOR_TURN evidence |
| **Study Evaluate** | Modes `blurting` \| `teach-me` \| `six` scoring into evaluate-bridge |

### 1.4 Explicitly absent as activity systems

No coding runner, SQL lab, simulation engine, game loop, writing desk, or presentation practice product exists under `src/lib/learning` or as Assessment/Adaptive adapters. Those names appear only in `LEARNING_OBJECT_TYPES` / Prisma enum and in Assessment unit-test stubs.

---

## 2. Lifecycle matrix

Legend: **READY** / **PARTIAL** / **NOT_READY** · Evidence: **CLOSED** / **PARTIAL** / **OPEN** · Adaptive: **READY** / **PARTIAL** / **NOT_READY**

| Activity family | Identity | Resolve | Prepare | Launch | Execute owner | Evidence | Mastery facets (actual) | Adaptive |
|-----------------|----------|---------|---------|--------|---------------|----------|-------------------------|----------|
| **Quiz** | READY — owned Quiz id; LO `QUIZ_ITEM` per question; opaque `activityRef {kind:"quiz",id}` (2G-45) | READY — `findOwnedQuizForConcept` Concept→Topic→Quiz; ownership; no create; no LLM | READY — AssessmentAdapter.prepare | READY — `/quizzes/{id}` + adaptive query | Quiz system (QuizTaker/submit) | **CLOSED** — `recordQuizAttemptEvidence` | **RECOGNIZE** | **READY** — sequence quiz-adapter + submit bind |
| **SIX** | READY — component id + optional LO; guide identity via `sixGuideHref` | READY — `resolveSixSequenceStep` (sync catalog); ownership checks on LO/attempts | PARTIAL — Adaptive resolve exists; **no** AssessmentAdapter.prepare | READY — existing SIX guide routes | SIX guided session + Study Evaluate | **CLOSED** — `recordStudyEvaluateEvidence` (mode six) | Component-mapped: RECOGNIZE / EXPLAIN / APPLY / RETAIN (see §5) | **READY** — six-adapter + evaluate bind + completion policy |
| **Flashcard** | READY — Flashcard id → LO `FLASHCARD` | PARTIAL — topic→concept via bridge; **no** Assessment resolve helper | NOT_READY — no AssessmentAdapter | PARTIAL — existing flashcard UI routes; not Assessment launch | Flashcard review UX | **CLOSED** — `recordFlashcardReviewEvidence` | **RETAIN** | **NOT_READY** — no flashcard sequence intervention adapter |
| **Tutor** | PARTIAL — ephemeral TUTOR_TURN LO + payloadRef; concept optional | N/A as launchable activity | N/A | N/A — conversational host | Tutor service | **PARTIAL** — only when `evidenceIntent` set + conceptId | EXPLAIN / APPLY / SOLVE (intent-mapped) | **NOT_READY** — not an Adaptive intervention family |
| **Study Evaluate · blurting** | PARTIAL — LO via evaluate payload | PARTIAL — topic-gated evidence | NOT_READY as AssessmentAdapter | PARTIAL — existing evaluate UX | Study Evaluate | **CLOSED** when topicId present | **RETAIN** (`ACTIVE_RECALL`) | **NOT_READY** as distinct Adaptive adapter (SIX active-recall covers similar) |
| **Study Evaluate · teach-me** | PARTIAL — LO `FEYNMAN` | PARTIAL — topic-gated | NOT_READY as AssessmentAdapter | PARTIAL — evaluate / teach-me path | Teach-me + Evaluate | **CLOSED** when topicId present | **EXPLAIN** | **NOT_READY** (SIX feynman covers Adaptive) |
| **CORE** | N/A — Concepts / chat session, not Activity identity | N/A | N/A | N/A — host workflow | CORE Assist (+ optional Tutor) | OPEN as activity; knowledge path separate | none as activity producer | N/A — feeds Concepts into engine |
| **LUCKY / Retention** | READY — RetentionItem + LO `RETENTION_ITEM` | READY within retention service | N/A for Assessment | READY — retention review UX | Retention review | **CLOSED** — review → evidence | Facet depends on source (often RETAIN / weak mastery) | **NOT_READY** as Assessment activity; is post-mastery path |
| **CODING / SQL / LAB / SIM / GAME / WRITING / PROJECT / PRESENTATION** | Identifier only | NOT_READY | NOT_READY | NOT_READY | none | **OPEN** | none | **NOT_READY** |

---

## 3. Identity audit (detail)

Universal identity remains: **Learning Object + opaque activity payload ref + learner + concept**.

### Quiz (2G-45 pattern — reference)

| Concern | Current |
|---------|---------|
| Persisted identity | `Quiz.id` (user-owned row) |
| Template / reusable | Quiz row is the reusable assessment artifact |
| Learner-specific | Ownership via `userId`; attempts are learner-specific |
| Payload reference | Assessment: `{kind:"quiz", id}`; LO: `{kind:"quiz_question", quizId, questionId}` |
| Concept association | Concept→Topic→Quiz (`findOwnedQuizForConcept`); per-question Topic→Concept at evidence |
| Ownership | Enforced on lookup + submit |
| Activity type | `QUIZ_ITEM` |
| Route / UI | `/quizzes/{id}` (+ adaptive query params) |

### SIX

| Concern | Current |
|---------|---------|
| Persisted identity | SIX **component** string (catalog); optional `learningObjectId` on Adaptive step |
| Template | `SIX_ACTIVITIES` / `SIX_GUIDES` catalog |
| Learner-specific | Adaptive run + evaluate attempts |
| Payload reference | evaluate LO `{kind:"study_evaluate", mode:"six", …}` |
| Concept | Topic→Concept at evidence; Adaptive run concept |
| Ownership | LO / attempt ownership checks in six-adapter |
| Activity type | Mapped LO types per component (not a single enum “SIX”) |
| Route / UI | `sixGuideHref` — preserve SIX branding |

### Flashcard

| Concern | Current |
|---------|---------|
| Persisted | `Flashcard.id` |
| Payload | LO `{kind:"flashcard", flashcardId}` |
| Concept | Topic required → `ensureConceptForTopic` |
| Type | `FLASHCARD` |

### Tutor / CORE

- **Tutor:** interaction turns; LO created only when recording evidence; not a reusable launchable Activity identity hierarchy.
- **CORE:** LearningSpace / Concept / notebook identity — knowledge model, not activity identity.

**Invariant:** Do not invent per-family parallel identity trees. Opaque `activityRef.kind` + LearningObject `payloadRef` + owned Concept remain the shared pattern.

---

## 4. Resolve / Prepare / Launch (summary)

### Resolve classifications

| Family | Class | Source of truth | Ownership | Concept | Deterministic | Creates? | LLM? | Canonical helper |
|--------|-------|-----------------|-----------|---------|---------------|----------|------|------------------|
| Quiz | READY | Owned Quiz via Concept→Topic | Yes | Yes | Yes | No | No | `findOwnedQuizForConcept` |
| SIX | READY (Adaptive) | Catalog + step intervention | Yes on LO/attempt | Via run/topic | Yes | No | No | `resolveSixSequenceStep` |
| Flashcard | PARTIAL | Flashcard row + topic | Yes | Topic-gated | Yes | LO ensure only at evidence | No | bridge only — no Assessment resolve |
| Others (coding…) | NOT_READY | — | — | — | — | — | — | stubs in tests only |

### Prepare

Universal descriptor already exists (`AssessmentActivityDescriptor`):  
`adapterKey`, `activityType`, `learnerId`, `conceptId`, optional `assessmentMode`, optional `adaptive`, optional opaque `activityRef`.

- Quiz: adapter.prepare fills `activityRef`.
- SIX / Flashcard / Tutor: activity-specific data stays in sequence adapters / bridges / tutor payloads — **correctly opaque / outside Assessment prepare today**.
- Do not force unused fields onto every family.

### Launch

| Family | Canonical route | Nav mechanism | Adaptive context | Standalone |
|--------|-----------------|---------------|------------------|------------|
| Quiz | `/quizzes/{id}` | `quizAdaptiveHref` / Assessment launch | Query params | Assessment consumer |
| SIX | six guide href | `resolveSixSequenceStep` → href | `adaptiveRunId` / step | Existing SIX entry |
| Flashcard | Existing flashcard routes | App navigation | Not wired | Review flows |
| Tutor / CORE | Chat / assist routes | Host UI | N/A | Service workflows |

No new routes created in this audit.

---

## 5. Execution ownership / Evidence / Mastery

### Execution ownership (must stay local)

| Family | Owner |
|--------|-------|
| Quiz | Quiz system |
| SIX | SIX guided experience + Study Evaluate |
| Flashcard | Flashcard system |
| Tutor | Tutor service |
| CORE | CORE Assist / notebook host |
| LUCKY | Retention service |

Universal layer **orchestrates** (resolve/prepare/launch instruction / Adaptive bind) — does **not** replace execution.

### Evidence

All producers feed the same spine:

```text
buildEvidenceEnvelope → recordEvidence → LearningAttempt → applyEvidenceToMastery
```

| Producer | Status |
|----------|--------|
| `quiz-bridge` | CLOSED |
| `flashcard-bridge` | CLOSED |
| `evaluate-bridge` (blurting / teach-me / six) | CLOSED when `topicId` present; skips otherwise |
| `tutor/evidence` | PARTIAL (intent + concept gated) |
| Retention review | CLOSED |
| Coding/SQL/… | OPEN (no producer) |

### Mastery facets (actual mappings — do not invent)

| Family | Facets produced today |
|--------|----------------------|
| Quiz | RECOGNIZE |
| Flashcard | RETAIN |
| SIX chunking | RECOGNIZE |
| SIX detailed-explanation | EXPLAIN |
| SIX feynman | EXPLAIN |
| SIX visualization | EXPLAIN |
| SIX hands-on-practice | APPLY |
| SIX active-recall | RETAIN |
| Blurting | RETAIN |
| Teach-me | EXPLAIN |
| Tutor (by intent) | EXPLAIN / APPLY / SOLVE |
| PERFORM | **No dedicated producer** found for live performance labs |
| Coding/SQL/… | none |

Genuine missing producers (future, not this phase): PERFORM-oriented labs; SOLVE outside Tutor intent; all coding/SQL/sim/game/writing/presentation.

---

## 6. Adaptive audit

| Family | Class | Launch context | Completion | Attempt/evidence bind | Progression | Retry / abandon |
|--------|-------|----------------|------------|----------------------|-------------|-----------------|
| Quiz | READY | `quizAdaptiveHref` | score-agnostic bind | LearningAttempt / quizAttemptId | coordinator plan-next | coordinator policies |
| SIX | READY | guide href + adaptive params | `recordSixAdaptiveSequenceCompletion*` | evaluate attempt validation | plan-next | existing SIX completion policy |
| Flashcard | NOT_READY | — | — | evidence only | — | — |
| Tutor / CORE | NOT_READY | — | — | — | — | — |
| Reserved enums | NOT_READY | — | — | — | — | — |

Assessment↔Adaptive remains passive bind (`bindAssessmentPlanToAdaptiveStep`) — correct.

---

## 7. Universal adapter contract audit (conceptual)

### Existing equivalent pieces

```text
AssessmentAdapter { key, canHandle, resolve, prepare? }   // assessment/adapter-registry.ts
+ prepareAssessmentActivity / launchAssessmentActivity    // universal helpers
+ sequence/*-adapter resolve + href + completion bind     // Adaptive caller
+ *-bridge evidence producers                             // activity-owned evidence
```

Conceptual `ActivityAdapter { resolve, prepare, launch }` is **already approximated** by AssessmentAdapter + launch helper + sequence adapters — **without** a second interface. Do **not** auto-create a duplicate `ActivityAdapter` interface.

### Common contract (every adapter that participates in Assessment or Adaptive)

1. Stable opaque `adapterKey` / intervention id  
2. Deterministic resolve of learner-authorized activity (or explicit unavailable)  
3. Opaque activity identity (`activityRef` or equivalent)  
4. Non-executing prepare/launch metadata  
5. Evidence produced by the activity’s own bridge into LearningAttempt  
6. Optional Adaptive context pass-through  

### Activity-specific (stay inside family adapters)

- Quiz scoring / question shapes  
- SIX component catalog, guides, completion policy, evaluate mode  
- Flashcard SM-2 ratings  
- Tutor evidence intents  
- CORE prompt grounding / knowledge extraction  

### Coordinator responsibilities

| Owner | Owns |
|-------|------|
| **Assessment** | Intent → plan → registry resolve/prepare → launch **instruction** only |
| **Adaptive Sequence** | Run/steps, current step, completion, plan-next, abandon |
| **Orchestrator** | Diagnosis / intervention suggestion — not activity execution |
| **Evidence** | Envelope → LearningAttempt |
| **Mastery** | applyEvidenceToMastery / ConceptMastery facets |
| **LUCKY** | Retention scheduling/review — separate path |

Do not move evidence into Assessment or Adaptive to “symmetrize” interfaces.

---

## 8. Quiz as reference vs other families

```text
Quiz reference:
  Owned Quiz → Resolve → Prepare → Launch → Quiz UX → QuizAttempt
    → recordQuizAttemptEvidence → LearningAttempt → Mastery
    → optional Adaptive bind
```

| Family | Shares invariants with Quiz? | Must become Quiz-shaped? |
|--------|------------------------------|--------------------------|
| SIX | Yes — resolve/launch/evidence/mastery/adaptive | **No** — keep SIX UX & completion policy |
| Flashcard | Evidence/mastery spine only | **No** |
| Tutor | Optional evidence spine | **No** — not launchable Assessment activity |
| CORE | Knowledge into Concepts | **No** — host / knowledge |
| Future coding… | Would need full product + bridges | Larger feature |

---

## 9. SIX special case

| Layer | Universal? | SIX-specific? |
|-------|------------|---------------|
| Adaptive step resolve / href / completion bind | Pattern shared with Quiz | Component catalog, guide hrefs, evaluate mode `"six"` |
| Evidence via evaluate-bridge | Universal spine | Facet/LO mapping per component |
| Completion policy | Coordinator APIs | SIX evaluate bind validation rules |
| User-facing name / flow | — | **Preserve SIX** (never rename to generic “Activity”) |

**Product architecture preserved:** CORE → SIX → LUCKY.

---

## 10. CORE / Tutor special cases

| | CORE | Tutor |
|-|------|-------|
| Classification | Knowledge bridge + assist **host** | **Interaction / evidence producer** (+ modes) |
| Learning-object family? | Produces Concepts into Knowledge Model | May create `TUTOR_TURN` LOs |
| Launchable ActivityAdapter? | **No** — would distort architecture | **No** — conversational, intent-gated evidence |
| Universal engine role | Supplies Concepts / context for activities | May emit LearningAttempts when demonstration intent is set |

---

## 11. Universal invariants (frozen)

1. **ONE** Universal Learning Engine, Learner Model, Knowledge Model  
2. **ONE** LearningAttempt evidence spine (`EvidenceEnvelope` → `recordEvidence`)  
3. **ONE** Mastery contract (`applyEvidenceToMastery` / facets)  
4. **ONE** Orchestrator; **ONE** Adaptive coordinator  
5. **ONE** LUCKY retention path  
6. Product line **CORE → SIX → LUCKY**  
7. Assessment **stops at launch instruction**; does not grade or write evidence  
8. Activity families own execution and their evidence producers  
9. Opaque `activityRef` / `payloadRef` — no typed quizId on universal Assessment contracts  
10. ASSESS ≠ QUIZ — Quiz is one adapter, not the architecture  
11. Universal ≠ identical implementation  

---

## 12. Genuine architecture gaps (not contradictions)

1. Only Quiz is registered as an `AssessmentAdapter` — intentional after 2G-44–50.  
2. Flashcard / blurting / teach-me lack Assessment + Adaptive adapters — evidence works; Assessment/Adaptive orchestration optional.  
3. Enum-reserved types (coding, SQL, lab, …) have **no** systems — larger future features.  
4. No PERFORM-oriented evidence producer for live labs.  
5. Tutor evidence is best-effort / intent-gated — correct for chat, not a gap in the spine.  
6. Conceptual `ActivityAdapter` interface is not a single TypeScript type spanning Assessment + Adaptive — **acceptable**; two caller surfaces share invariants without duplication.

**No contradiction** prevents reusing the universal lifecycle. Prefer **no production changes**.

---

## 13. Recommendation — next implementation phase

### Immediate (2G-51 complete)

- **NO CHANGE REQUIRED** to production architecture.  
- Treat this document as the convergence baseline.  
- Keep Quiz as the Assessment reference; keep SIX as the Adaptive + technique reference.

### Next small additive bridges (only when product needs them)

1. **Optional Flashcard AssessmentAdapter** (if standalone ASSESS should launch flashcard review) — reuse flashcard-bridge; do not move SM-2.  
2. **Optional Adaptive flashcard intervention** — only if Orchestrator starts recommending flashcard steps.  
3. Document-only: when adding a new family, copy Quiz’s AssessmentAdapter pattern + family’s own evidence bridge + optional sequence adapter.

### Explicitly defer (LARGER FUTURE FEATURE)

- Coding / SQL / Lab / Simulation / Game / Writing / Presentation activity systems  
- Generic Activity UI / universal activity route  
- Second evidence or mastery system  
- Rewriting SIX / CORE / Tutor / Quiz  

### Suggested next phase title

**2G-52 (optional):** Flashcard Assessment adapter spike **or** freeze “Assessment adapters backlog” and move to non-activity ULE work — **only if product prioritizes it**. Otherwise proceed to adjacent ULE work without forcing more AssessmentAdapters.

---

## PASS definition (2G-51)

| Criterion | Status |
|-----------|--------|
| Universal activity invariants known | Yes — §11 |
| Which families satisfy them | Quiz + SIX (full); Flashcard/Evaluate (evidence); Tutor (partial evidence) |
| Small future bridges | Flashcard (and optional teach-me/blurting) Assessment/Adaptive |
| Intentionally different | CORE, Tutor-as-host, LUCKY |
| Next implementation | No prod change now; optional Flashcard adapter later; reserved enums are larger features |

**Phase result: PASS — NO PRODUCTION CHANGES.**

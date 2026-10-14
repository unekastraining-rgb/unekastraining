# 2P-47 STATUS — Universal Creation & Artifact Learning Depth

## 2P-47 STATUS

**PASS WITH NOTES**

## AUDIT

Writing/project/presentation already shared one structured rubric path (ActivityWorkspace → POST → LearningAttempt). Writing (2P-18) had revision gate + AI strip. Open ≠ evidence already held. Project/presentation were outline text; presentation had an EXPLAIN+asPerform honesty bug; UI hid rubric criteria; Adaptive writing allowlist was EXPLAIN-only.

## GAP

Criterion feedback UI missing; project/presentation lacked shared AI strip; Adaptive writing facet mismatch; presentation outline falsely asPerform; soft creation ranking unused under APPLICATION_GAP.

## IMPLEMENTATION

- `src/lib/learning/creation/*` — authorship / artifact-vs-evidence contract
- structured submit — AI strip for project/presentation
- ActivityWorkspace — perCriterion feedback + revision guidance + idempotency
- Adaptive writing/presentation facet allowlists
- `preferCreationProducers` ranking (no CREATION_GAP)
- presentation-primary-source-talk `asPerform: false`
- Growth creation continuity note
- Docs + tests + E2E

## WRITING

Rubric criteria visible after submit; Adaptive accepts authored facets; AI boundary preserved.

## PROJECTS

Same AI strip + feedback UI; still plan/outline APPLY evidence; milestone ≠ mastery documented.

## PRESENTATIONS

Outline honesty fixed; EXPLAIN Adaptive allowed; no speech-quality scoring.

## REVISION

Feedback does not auto-edit; learner revises textarea and resubmits → new LearningAttempt.

## AI BOUNDARY

`separateAiAssistanceFromEvidence` for writing/project/presentation. AI-only → empty evidence.

## EVIDENCE

Existing LearningAttempt spine; learnerAuthored + honesty metadata.

## MASTERY

Facets unchanged (RECOGNIZE…RETAIN). ConceptMastery via existing apply path.

## ORCHESTRATOR

No CREATION_GAP. Soft prefer creation adapters when APPLICATION_GAP + weak apply.

## ADAPTIVE

Existing contracts; widened facet allowlists; soft creation prefer on alternate pick.

## CORE

Unchanged — notes remain outside evidence.

## TUTOR

Unchanged Unified Tutor — no silent authorship.

## GROWTH

Optional creation continuity notes.

## LUCKY

Unchanged.

## SPECIALIZED RUNTIME

**Not necessary.**

## SECURITY

Session identity; forgery strip; foreign concept 403 (E2E).

## TESTS

Focused `creation.test.ts`: **13 passed**  
Learning suite: **153 files · 1705 passed**

## E2E

`creation-artifact-learning.spec.ts`: **1 passed**

## FULL SUITE

**239 / 3 files · 2115 / 7 tests** — pre-existing/unrelated:
- `weekly-college-grid` (3)
- `course-info/highlights` (3)
- `course-source-cold-start` timeout (1, flaky/unrelated AI cold-start)

## BUILD / TYPES / LINT / PRISMA

tsc · prisma validate · next build · eslint (touched) — **pass**

## DEFERRED

- Durable mid-draft / CORE→activity handoff
- Live oral presentation
- Multi-file project deliverables

## REGRESSIONS

None from 2P-47. Full-suite 6 fails pre-existing/unrelated.

## ARCHITECTURE INTEGRITY

**One ULE · One Learner Model · One Knowledge Model · One Evidence spine · One Mastery · One Orchestrator · One Adaptive · One Retention · CORE → SIX → LUCKY**

Creation is a learning activity, not a separate learning engine.  
Artifact completion does not automatically equal mastery.

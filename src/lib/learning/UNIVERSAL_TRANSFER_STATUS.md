# 2P-46 STATUS — Transfer & Generalization Across Contexts

## 2P-46 STATUS

**PASS WITH NOTES**

## AUDIT

Multi-context catalogs (`contextVariant` / `contentKey`) and soft filters (`avoidContextVariant` / `excludeContentKeys`) already existed. 2P-42 varied **modality**; Adaptive/GET underused **scenario** soft-filters. Evidence was facet-level, not per-context. Diagnosis already had APPLICATION_GAP / INSUFFICIENT_EVIDENCE (no TRANSFER_GAP).

## GAP

Evidence from context A did not soft-prefer context B on resolve/GET. Mixed success/fail across contexts had no learner-safe Growth reading. Math/networking/language sourceRefs omitted `contentKey`, weakening progression exclude alignment.

## IMPLEMENTATION

- `src/lib/learning/transfer/*` — context identity + mixed-context read helpers
- `resolveLearningExperience` — `avoidContextVariant` + exclude soft filters
- `selectActivityContent` — soft `excludeContentIds`
- activities GET — session-owned recent attempts → transfer hints
- Growth continuity — optional transfer note from mixed-context reading
- math/networking/language payloadRef — `contentKey`
- Docs: `UNIVERSAL_TRANSFER.md` + audit update
- Tests + E2E fixture

## TRANSFER MODEL

**Concept identity** (`Concept` / `conceptKey`) ≠ **context surface** (`contextVariant` / `contentKey` / `contentId`). Transfer = same concept, meaningful alternate surface.

## CONTEXT VARIATION

Authored `contextVariant` + content keys. Cosmetic rewording is not treated as transfer. Soft prefer only when alternatives exist.

## EVIDENCE

Existing `LearningAttempt` + facets. No seventh facet. No transfer evidence type.

## MIXED EVIDENCE

`interpretMixedContextEvidence` (read-side): single-context success, cross-context success, success→transfer fail, recovery, struggle — without rewriting ConceptMastery.

## ORCHESTRATOR

No `TRANSFER_GAP`. APPLICATION_GAP / INSUFFICIENT_EVIDENCE remain.

## ADAPTIVE

Unchanged contracts. Activity GET during Adaptive launches applies transfer soft-demotion. No forced transfer; STOP when no alternate.

## EVIDENCE SUFFICIENCY

2P-44 ladder unchanged; one alternate success ≠ rich.

## GROWTH

Optional continuity note; never “mastered everywhere.”

## LUCKY

Unchanged: Evidence → ConceptMastery → RetentionItem → LUCKY.

## SPECIALIZED RUNTIME

**Not necessary.**

## SECURITY

Session user authoritative; client learnerId/outcome stripped; foreign concept → 403 (E2E).

## TESTS

Focused `transfer.test.ts`: **18 passed**  
Learning suite: **152 files · 1692 passed**

## E2E

`transfer-generalization.spec.ts`: **1 passed**

## FULL SUITE

**239 / 2 files · 2103 / 6 tests** — unrelated `weekly-college-grid` + `course-info/highlights` (pre-existing)

## BUILD / TYPES / LINT / PRISMA

tsc · prisma validate · next build · eslint (touched) — **pass**

## DEFERRED

- Domains with a single authored context cannot soft-transfer until content exists
- Per-context mastery aggregates (not required)

## REGRESSIONS

None from 2P-46. Full-suite 6 failures are pre-existing/unrelated schedule + LMS highlights.

## ARCHITECTURE INTEGRITY

**One ULE · One Learner Model · One Knowledge Model · One Evidence spine · One Mastery · One Orchestrator · One Adaptive · One Retention · CORE → SIX → LUCKY**

Transfer is a property of the universal learning system, not a separate learning engine.

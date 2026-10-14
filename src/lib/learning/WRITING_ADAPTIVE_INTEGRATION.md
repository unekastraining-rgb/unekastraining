# Writing → Adaptive Universal Activity Integration (2P-18)

## 1. Purpose

Promote existing Writing from **PRODUCT-READY** to **ADAPTIVE-READY** without a second writing system. Learners produce real artifacts; evaluation uses the universal rubric; evidence follows `recordAuthoritativeActivityEvidence` → `recordEvidence` → `applyEvidenceToMastery`. ConceptMastery remains canonical. Adaptive binds via the universal activity completion contract.

## 2. Existing Writing architecture

Writing was already a structured activity kind (`kind: "writing"`) in `activities/structured/service.ts`:

- Catalog rows with `objective`, `prompt`, `criteria`, `minChars`, `skillFacet: EXPLAIN`
- Evaluation via `evaluateAgainstRubric`
- Submit via `submitStructuredChallenge` → `writing_challenge_submit` evidence
- Learner UI: `/study/activities/writing` (`ActivityWorkspace`)
- Assessment adapter: `createWritingAssessmentAdapter`

2P-18 **adds** Adaptive contract metadata, revision gate, seed catalog, progression entries, and bind readiness. It does **not** replace the structured Writing path.

## 3. Adaptive contract

Declared in `sequence/activity-adaptive-completion.ts`:

| Field | Value |
| --- | --- |
| adapterKey | `writing` |
| sourceRefKinds | `writing_challenge_submit` |
| requiredSkillFacets | `EXPLAIN` |
| acceptOutcomes | `SUCCESS`, `PARTIAL`, `FAIL` |

Lifecycle helpers live in `activities/writing/adaptive-contract.ts`:

- Launch / typing / draft ≠ completion
- Interaction ≠ evaluation ≠ completion ≠ evidence ≠ mastery
- Failed evaluation may still produce useful evidence (criterion breakdown)

Capability: `adaptiveBindIntegrated: true`, intervention-capable for `APPLICATION_GAP` with context hints (essay, thesis, …). Orchestrator is **not** a writing coach.

## 4. Artifact model

Authoritative fields (reuse structured payload; no second document store):

| Field | Role |
| --- | --- |
| `prompt` | Activity prompt / sources |
| `draft` | Learner draft |
| `evaluation` | Server rubric result |
| `revision` / `final` | Revised text when required |
| `finalSubmission` | Text evaluated for evidence |
| `aiAssistance` | Coach text only — never auto-promoted to evidence |
| `learnerAuthored: true` | Evidence payload flag |

Helpers: `extractWritingSubmissionFields`, `buildWritingLearnerArtifact`.

## 5. Evaluation

Uses existing `evaluateAgainstRubric` dimensions via criteria (claim/thesis, evidence, reasoning, organization, citation, clarity, revision quality — authored per activity).

Grammar alone is not mastery. Facet remains **EXPLAIN** (CREATE facet not added).

## 6. Revision

Activities with `requiresRevision: true` (seed: `write-revision-unclear-thesis`):

```text
Draft → Evaluation gate → Revision → Final submission
```

Server gate (`assertWritingRevisionGate`):

- Revision required and non-empty
- Materially different from draft
- Meets `minChars`

Client flags (`completed`, `skipRevision`, …) are stripped and ignored.

Activities without revision document `revisionNotRequiredReason` (single-draft skill focus; revision practiced in the dedicated revision activity).

## 7. Completion

- Opening Writing ≠ completion
- Short / empty artifact → `FAIL` (`empty_artifact` / `artifact_too_short`)
- Missing revision when required → `FAIL` (`revision_required` / `revision_unchanged`)
- Adaptive completion accepts SUCCESS / PARTIAL / FAIL attempts (like other universals)
- Completion ≠ mastery

## 8. Evidence

Path unchanged:

1. `recordAuthoritativeActivityEvidence` (`sourceKind: writing_challenge_submit`)
2. `recordEvidence`
3. `applyEvidenceToMastery`

Evidence payload marks `learnerAuthored: true` and optional writing meta. No `WritingEvidence` type.

## 9. ConceptMastery

Canonical. Writing updates EXPLAIN (and only the concept on the LearningAttempt). High writing scores do not invent unrelated concept mastery; low scores do not wipe prior evidence beyond existing aggregation rules.

## 10. Adaptive integration

- `isAdaptiveReadyActivityAdapterKey("writing")` → true
- Launch href: `/study/activities/writing?conceptId&adaptiveRunId&adaptiveStep`
- After LearningAttempt: `bindUniversalActivityToAdaptive`
- No WritingAdaptiveEngine

## 11. Progression

Stages used on seeds: UNDERSTAND / PRACTICE / APPLY / CHALLENGE (plus existing INTRODUCE…RETAIN infrastructure). Catalog: `WRITING_ADAPTIVE_ENTRIES` in `content-progression/catalog.ts`. Not a mandatory writing curriculum — Orchestrator decides next action.

## 12. Variation

Existing progression `contextVariant` / `excludeContentKeys` / difficulty. Example: thesis UNDERSTAND vs CHALLENGE variants on `academic-thesis`. No second variation system.

## 13. Scaffolding

Universal scaffold kinds (HINT / STEP / CHECKLIST / …) with `doesNotRevealAnswer: true`. Beginner → intermediate → challenge via `scaffoldingLevel` and progressive UI reveal in `ActivityWorkspace`.

## 14. Cross-domain support

One writing engine; domains differ by content:

| Domain | Example contentId |
| --- | --- |
| History | `write-source-analysis-suffrage`, `write-evidence-paragraph-industrial` |
| Business | `write-argument-remote-work`, `write-business-proposal` |
| Science | `write-paraphrase-cell-membrane`, `write-explain-photosynthesis` |
| Technical / CS | `write-tech-explain-https` |
| General academic | `write-thesis-climate-policy`, `write-citation-apa-sleep`, `write-revision-unclear-thesis` |
| Math | `write-math-proportional-reasoning` |

No `if (history) HistoryWritingEngine` branches.

## 15. AI assistance boundary

Allowed: explanations, brainstorming prompts, Socratic questions, scaffolding, structural hints, revision-area suggestions, citation teaching.

Forbidden: silently treating AI text as learner evidence; AI detectors; integrity-evasion tooling.

`separateAiAssistanceFromEvidence` ignores `aiAssistance` when choosing evidence text.

## 16. Accessibility

Uses existing persona accessibility hooks + content `accessibility` enrichment (`altDescription`, `extendedTimeSuggested`, `interactionNote`). Revision UI exposes labeled draft/revision textareas. No separate a11y system.

## 17. Cross-activity integration

Writing coexists with CORE, SIX, Tutor, Quiz, Flashcards, Simulation, Coding, SQL, Lab, Presentation, Adaptive, LUCKY, Learner Model — same ConceptMastery and Orchestrator. No Writing-specific forks of those systems.

Example path: CORE note → concept → Adaptive Writing step → evidence → Orchestrator re-read.

## 18. Universality test

| Check | Result |
| --- | --- |
| Same Adaptive bind path as coding/sql/lab/sim/presentation | Yes |
| Same evidence → mastery path | Yes |
| Cross-domain without subject engines | Yes |
| Failed attempt still records evidence | Yes (FAIL accepted) |
| No WritingMastery / WritingOrchestrator | Yes |

## 19. Deferred work

- Richer multi-round draft/eval/revise session persistence (today: one submit with draft+revision)
- Human/AI hybrid rubric beyond keyword criteria
- Deeper accessibility modes for long reading passages
- Large writing pack authoring CMS (intentionally out of scope)
- Optional APPLY facet authoring where appropriate (EXPLAIN remains default)

## 20. Architecture risks

- Keyword rubrics can be gamed with token stuffing — acceptable for seed depth; not claimed as writing-pedagogy proof
- Intervention eligibility may surface Writing more often — keep Orchestrator diagnosis-first; Writing remains practice/create after diagnosis
- Dual evaluation entry points (`evaluateStructuredChallenge` vs `evaluateWritingWork`) must stay aligned (submit path uses writing evaluator)
- Do not add CREATE facet casually — contract uses EXPLAIN

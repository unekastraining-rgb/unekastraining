# Material Context Audit (2P-28)

Audit of 2P-27 before coding. Goal: source-grounded **display/context** — not a second engine or RAG.

## Executive verdict

Material provenance is preserved through prepare → CORE workbook → Materials UI → Tutor (model-side).  
It **drops to conceptId-only** at Adaptive start. Activities and “why this activity?” have no source chrome today.

2P-28 should **thread optional display context** (resolver + UI + optional start `materialId`) without changing diagnosis, evidence, or mastery.

## Where context enters

| Entry | Location | Preserved? |
| --- | --- | --- |
| Upload | `CourseMaterial` | Yes |
| Prepare | `ContentSourceRef` + `provenanceLabel` + note metadata | Yes |
| CORE workbook | `Note.materialId` + `metadata.materialSource` | Yes |
| Materials UI | Provenance label | Yes |
| Tutor API | `materialId` → `instructionalContext` | Model-side only (no UI citation) |
| Adaptive start | **conceptId only** | **Lost** |
| Activity from Adaptive | conceptId + adaptiveRunId | **Lost** |

## Where it gets lost

1. `MaterialLearningPanel` → `/api/study/adaptive/start` with only `conceptId`
2. `AdaptiveSequenceRun` has no material/display fields
3. Adaptive run page / activity hrefs omit `materialId`
4. `ActivityWorkspace` / experience view have no source props
5. “Why this step/activity” is Orchestrator/concept only
6. Tutor response omits learner-facing provenance meta

## Paths that keep provenance

- Note `materialSource` / `materialLearning` / `chapterStudyExtract`
- Prepare/status API
- MaterialLearningPanel
- Tutor owned context (instructional)
- CORE open with `materialId` / note link
- Pre-Adaptive hrefs that still include `materialId`

## Paths that are conceptId-only

- Adaptive start / resume / coordinator / run row
- Adaptive run page
- Universal activities launched from Adaptive
- Mastery / LearningAttempt concept pointer

## Adaptive / evidence safety

Display-only context **can** travel without evidence changes if it:

- never writes into `LearningAttempt.sourceRefJson` as performance
- never affects Orchestrator diagnosis
- never creates MaterialMastery / MaterialEvidence

`AdaptiveSequenceRun` has no metadata bag today. Prefer:

1. Explicit `materialId` on Adaptive/activity URLs (validated server-side)
2. Reverse-lookup: owned Notes linked to concept + `materialSource`
3. Optional start-body `materialId` validated then returned for client URL

Avoid schema migration unless reverse-lookup + URL prove insufficient for resume.

## Tutor / CORE today

- Tutor: grounded text for the model; **no** learner-facing citation chip
- CORE ↔ Material: works via `coreCourseHref` / note `materialId`
- Adaptive ↔ Material: indirect only (via note), not first-class

## Smallest additive improvements

1. `LearningMaterialContext` + ownership-safe resolver + deterministic priority
2. Thread `materialId` from Materials Start learning → Adaptive URL → activity hrefs
3. Citation strip + “View source / Open material” on Adaptive + activities (optional)
4. Tutor response meta: `provenanceLabel` when context present
5. Reverse-lookup for resume / Hub starts without material URL
6. CORE “View original material” when `materialSource` present
7. Tests + E2E journeys A–E; no vector/RAG

## Out of scope (confirmed)

MaterialTutor, MaterialAdaptive, MaterialMastery, MaterialEvidence, vector DB, RAG, second document store.

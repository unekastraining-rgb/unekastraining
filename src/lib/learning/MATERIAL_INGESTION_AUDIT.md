# Material Ingestion Audit (2P-27)

Audit completed before coding. Goal: connect learner-owned materials to the ULE **without** a second knowledge/document/Adaptive engine.

## Executive verdict

**Upload → extract text → Topics/CORE workbook is largely built.**  
**Material → Concepts → Adaptive is not automatic today** — it requires CORE `ChapterStudyExtract` + Knowledge bridge confirm (flagged).

2P-27 should **Preserve → Connect → Upgrade → Extend** that path, not invent MaterialMastery / MaterialAdaptive / a second Note store.

## What can already be uploaded / parsed?

| Input | Path | Result |
| --- | --- | --- |
| PDF / DOCX / images | `extractTextFromFile` | `CourseMaterial.extractedText` + file on disk |
| Paste / URL | `POST /api/materials` | Text/link material |
| Syllabus | `courses/ingest` → `courses/save` | Course + SYLLABUS material + topics/assignments |
| LMS Canvas/Moodle | LMS sync | Syllabus-like materials + topics |
| PPT/PPTX | UI allows | **Not extracted** (throws) |
| Scanned PDF (no text) | pdf-parse | Empty / weak — no vision fallback |

## What becomes CORE vs Concepts?

| Layer | Store | Created by |
| --- | --- | --- |
| Source | `CourseMaterial` | Upload / LMS / syllabus save |
| Outline | `Topic` | Syllabus enrich / LMS |
| Authoring | `Note.contentJson` | Workbook open (`getOrCreateMaterialWorkbook`) |
| Study structure | `metadata.chapterStudyExtract` | Studio AI **or** cold-start builder |
| Knowledge | `Concept` | **User confirm** via Knowledge bridge only |

**Material upload ≠ ConceptMastery ≠ LearningAttempt.**

## What blocks Material → Adaptive?

1. No Concept auto-created from `CourseMaterial`
2. Knowledge bridge default **OFF** (`STUDY_HAUL_CORE_KNOWLEDGE_BRIDGE`)
3. Candidates need persisted `chapterStudyExtract`
4. User must confirm a candidate
5. Adaptive needs owned `conceptId`

## Existing ownership

- Materials: `course.userId`
- Notes / Concepts / ink: `userId`
- Adaptive start: session user; ignore client learnerId
- Bridge: owned note + owned concept only

## Best reuse (no second store)

1. Keep `CourseMaterial` as the material source model
2. `ContentSourceRef` + add `sourceRefFromCourseMaterial`
3. Non-AI: `buildDeterministicColdStartExtract` → persist on workbook Note
4. Knowledge bridge preview/confirm → Concept
5. Existing Adaptive CTA / `POST /api/study/adaptive/start`

## Smallest additive bridge

```text
Owned CourseMaterial
  → getOrCreateMaterialWorkbook (CORE)
  → deterministic extract (non-AI) when text/topics exist
  → Knowledge candidates (existing bridge)
  → confirm Concept
  → Adaptive start (existing)
```

Optional AI Studio enrich remains optional.

## Out of scope (this phase)

- Vector DB / NotebookLM clone
- MaterialMastery / MaterialEvidence / MaterialTutor
- PPT extraction / full OCR subsystem
- Replacing CORE or The Haul localStorage board

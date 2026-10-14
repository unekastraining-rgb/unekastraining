# Material → Learning (2P-27)

Connect learner-owned material to the Universal Learning Engine **without** a second knowledge, document, Adaptive, Tutor, or mastery system.

## Source model

**Reuse `CourseMaterial`** (not a new MaterialMastery / LearningMaterialSource table).

| Field | Role |
| --- | --- |
| `id` | Source identity |
| `course.userId` | Ownership (via Course) |
| `title` / `type` | Provenance + kind |
| `extractedText` / `filePath` | Content |
| `Note` via `materialId` | CORE document (`contentJson` truth) |

Pipeline `ContentSourceRef` helper:

```ts
sourceRefFromCourseMaterial({ materialId, title, learnerId, ... })
// sourceId: "course-material:{id}"
```

## Ownership

- Materials: `course.userId === session user`
- Notes / Concepts / ink: `userId`
- APIs ignore client `learnerId` / `userId`
- Foreign material IDs → 404 / null (no cross-learner leak)
- Tutor `materialId` loads context only when owned

## Ingestion pipeline

```text
Upload / paste / LMS
  → Validate + store CourseMaterial
  → Extract text (non-AI when possible)
  → POST /api/materials/:id/learning { action: "prepare" }
  → getOrCreateMaterialWorkbook (Note.contentJson)
  → Deterministic ChapterStudyExtract (cold-start)
  → Knowledge bridge candidates (optional)
  → Confirm → Concept
  → Existing Adaptive start
```

States: `UPLOADING | PROCESSING | READY | PARTIAL | FAILED`  
Learner messages only — no stack traces.

## Extraction & non-AI path

- PDF/DOCX/images: existing `extractTextFromFile`
- Prepare uses `buildDeterministicColdStartExtract` — **no AI required**
- Soft cap: `MATERIAL_EXTRACT_TEXT_CAP` (40k) with truncation notice
- PPT / empty scanned PDFs: limited — see audit

## AI enrichment boundary

AI (Studio / OCR vision) may enrich later. AI output must not silently become:

- authoritative course truth
- LearningAttempt
- ConceptMastery
- final learner writing

Candidates remain distinguishable; Concepts require learner confirm.

## CORE integration

```text
CourseMaterial → Note (workbook) → metadata.chapterStudyExtract
```

`Note.contentJson` remains document truth. No second document store.

## Knowledge integration

```text
Extract → candidate Concepts → confirm → Concept (owned)
```

Uses existing CORE Knowledge bridge (`STUDY_HAUL_CORE_KNOWLEDGE_BRIDGE` or `E2E_MODE`). Cap + quality controls unchanged.

## LearningSpace

Course materials can attach Concepts to an existing course LearningSpace when present.  
Standalone/self-directed learning does **not** require Course as universal root.

## Concept workflow (learner)

1. `/materials` → Add material  
2. Prepare for learning  
3. Review candidates  
4. Confirm selected concepts  
5. Start learning → Adaptive / activities  

## Provenance

Learner-facing: `Source: Chapter 4 notes, Section 4.2`  
Internal: `ContentSourceRef` + `metadata.materialSource` / `materialLearning`  
Do not show raw DB IDs as citations.

## Tutor context

`POST /api/study/tutor` optional `materialId` → owned extract into `instructionalContext`.  
Ordinary Q&A: `evidenceIntent: "none"` (server-enforced). No automatic evidence.

## Adaptive context

Material context lives on Concept + Note provenance.  
Adaptive start remains `conceptId` only — **not** a PDF Adaptive engine.

## Activity context

Study actions route to existing CORE / Quiz / Flashcards / Adaptive / Tutor.  
No MaterialQuiz / MaterialTutor / MaterialAdaptive.

## Evidence & mastery boundaries

| Action | LearningAttempt | ConceptMastery |
| --- | --- | --- |
| Upload | No | No |
| Open | No | No |
| Extract / prepare | No | No |
| Confirm concept | No | No |
| Ordinary Tutor Q&A | No | No |
| Real activity submit | Yes (existing path) | Via evidence spine |

## LUCKY boundary

LUCKY remains downstream of mastery/retention. No material-retention subsystem.

## Versioning

Re-prepare preserves Note identity (`getOrCreateMaterialWorkbook`).  
Does not silently delete learner typed content; extract merges into metadata.

## File limitations

Supported when extractors work: PDF (text), DOCX, images (OCR when configured), paste/URL.  
Not reliably supported: PPT/PPTX, scanned PDFs without OCR, corrupt files.

## Activity matrix

| Activity | Material context | Evidence | Adaptive |
| --- | --- | --- | --- |
| Coding | concept/source | Yes (activity) | Yes |
| SQL | concept/source | Yes | Yes |
| Lab | concept/source | Yes | Yes |
| Simulation | concept/source | Yes | Yes |
| Presentation | concept/source | Yes | Yes |
| Writing | concept/source | Yes | Yes |
| Quiz | concept/source | Yes (existing lane) | existing lane |
| Flashcard | concept/source | Yes (existing lane) | existing lane |
| SIX | concept/source | existing | existing |
| Tutor | source/context | contextual only | existing |
| CORE | source/document | No automatic | existing bridge |
| LUCKY | downstream | retention | downstream |

Paths marked Yes are wired through **existing** ULE mechanisms after concept confirm — not parallel engines.

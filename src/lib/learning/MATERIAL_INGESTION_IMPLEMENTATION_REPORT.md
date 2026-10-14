# Material Ingestion Implementation Report (2P-27)

## Status

**2P-27 STATUS: PASS WITH NOTES**

## Initial audit

See `MATERIAL_INGESTION_AUDIT.md`.

Verdict: upload/extract/workbook already exist; gap was Material → Concept → Adaptive (confirm + extract + bridge flag).

## Existing systems reused

- `CourseMaterial` (source model)
- `Note.contentJson` + workbook (`getOrCreateMaterialWorkbook`)
- `buildDeterministicColdStartExtract` (non-AI)
- CORE Knowledge bridge (candidates / confirm)
- `ContentSourceRef` / content pipeline
- Adaptive `POST /api/study/adaptive/start`
- Unified Tutor (`instructionalContext`)
- Material file ownership via `course.userId`

## Files added

- `src/lib/learning/MATERIAL_INGESTION_AUDIT.md`
- `src/lib/learning/MATERIAL_TO_LEARNING.md`
- `src/lib/learning/MATERIAL_INGESTION_IMPLEMENTATION_REPORT.md`
- `src/lib/learning/material-ingestion/*` (types, prepare, provenance, search, tutor-context, evidence-boundary, tests)
- `app/api/materials/[id]/learning/route.ts`
- `app/materials/page.tsx`, `app/materials/materials-client.tsx`
- `src/components/materials/MaterialLearningPanel.tsx`
- `e2e/material-ingestion.spec.ts`

## Files changed

- `src/lib/learning/content-pipeline/from-core.ts` (+ `sourceRefFromCourseMaterial`)
- `src/lib/learning/content-pipeline/index.ts`
- `src/lib/learning/knowledge/core-bridge-flag.ts` (E2E_MODE enables bridge)
- `src/lib/learning/knowledge/core-bridge.test.ts`
- `src/lib/learning/index.ts`
- `src/lib/core/note-types.ts` (`materialLearning` metadata)
- `app/api/materials/route.ts` (GET list/search)
- `app/api/study/tutor/route.ts` (owned `materialId` context)
- `e2e/helpers/db.ts`, `e2e/helpers/fixtures.ts` (seed material)
- `playwright.config.ts` (bridge env)
- `src/components/hub/LockerTab.tsx` (My Materials link)

## Ingestion workflow

Upload → CourseMaterial → prepare → workbook + deterministic extract → candidates → confirm Concept → Adaptive/activities.

## Supported file types

PDF (text), DOCX, images (OCR when configured), paste/URL. PPT and scan-without-OCR remain limited (documented).

## Non-AI path

`prepareMaterialForLearning` uses cold-start extract only.

## AI enrichment

Optional Studio / vision OCR; not required for prepare.

## Concept workflow

`/materials` Prepare → review candidates → Confirm → Start learning.

## Provenance

`presentLearnerFacingProvenance` + `ContentSourceRef` + note metadata.

## Security

Ownership via `loadMaterialForUser`; client learnerId ignored; foreign IDs 404/null.

## Browser E2E

- Journeys A–D + materials UI: **pass** (`e2e/material-ingestion.spec.ts`)
- Full desktop Chromium suite: **21/21 pass** (includes 2P-24 specs)

## Vitest

`npx vitest run src/lib/learning` → **135 files / 1508 tests pass**

## ESLint

Owned 2P-27 paths: **clean**

## TypeScript

`npx tsc --noEmit` → **3 pre-existing errors** (notebook-desk, offline-fallback test, resolve-loop-focus-topic) — **none in 2P-27 files**

## Failures discovered / fixes

- Knowledge bridge default OFF blocked E2E → enable via `E2E_MODE` / env
- Doc test false-positive on MaterialMastery mention → assert non-goals phrasing
- Materials UI E2E strict-mode duplicate `data-material-id` → scope to `[data-material-row]`

## Deferred

- PPT extraction
- Full OCR subsystem for blank scans
- Vector search / RAG platform
- Adaptive run metadata for material citation (context via Concept/Note today)
- Elaborate document version control
- Course-less standalone materials (upload still requires Course row today)

## Pre-existing issues

- Materials still require a Course row (product constraint; LearningSpace remains universal root for concepts)
- Default Knowledge bridge OFF in production unless `STUDY_HAUL_CORE_KNOWLEDGE_BRIDGE` or `E2E_MODE`
- CORE notebook hydration mismatch warnings in E2E (pre-existing)
- Gemini 503 during LMS syllabus enrich falls back to heuristics (pre-existing resilience)

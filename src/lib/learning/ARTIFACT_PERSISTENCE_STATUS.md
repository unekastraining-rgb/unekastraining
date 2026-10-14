# 2P-50 STATUS — iPad/Mobile + Artifact Persistence + Multi-File Projects

## 2P-50 STATUS

**PASS WITH NOTES**

## AUDIT

See [ARTIFACT_PERSISTENCE_AUDIT.md](./ARTIFACT_PERSISTENCE_AUDIT.md). CORE `Note.contentJson` already durable with autosave + optional 409. Activity artifacts remain submit-time evidence. No Prisma Project table — Note-backed container added.

## GAP

~~Transient activity drafts~~ → **local activity drafts** (post-roadmap). No major new server draft store.
Thin failure/save-status UX largely addressed on CORE; Lucky empty now has `role="status"`.

## IMPLEMENTATION

- `src/lib/learning/artifact-persistence/*` — contract, multi-file meta, local draft, project-service  
- `app/api/projects/route.ts` — create / add-file / rename-file / remove-file  
- CORE — save-status honesty, local draft on fail/409, `ProjectFileNavigator`  
- Docs: ARTIFACT_PERSISTENCE / CORE_PERSISTENCE / MULTI_FILE_PROJECTS / AUDIT / STATUS  
- Tests + `e2e/artifact-persistence.spec.ts`

## CORE PERSISTENCE

Autosave + concurrency preserved; status labels; drafts on failure; no false Saved.

## INK / CANVAS

Existing provisional sizing + ResizeObserver; unit-tested helpers.

## MOBILE / IPAD

Same Note truth across viewports; browser pointer/touch/pen. **No physical iPad/Safari / Pencil SDK claim.**

## ARTIFACTS

Note-backed; soft ArtifactType hints in metadata.

## MULTI-FILE PROJECTS

Container Note + file Notes; isolated saves by noteId.

## SCHOOL CONTEXT

Optional course/assignment on project create (2P-49).

## EVIDENCE

Edit / autosave / add-file ≠ LearningAttempt.

## MASTERY

ConceptMastery unchanged.

## AI AUTHORSHIP

2P-47 boundary preserved.

## CROSS-DEVICE

Server Note authoritative; 409 stale; local draft opt-in only.

## SECURITY

Session ownership; client userId/ownerId ignored; foreign project 404.

## FAILURE RECOVERY

Visible failure + local draft; conflict does not silent overwrite.

## TESTS

Focused `artifact-persistence.test.ts`: **11 passed**  
Learning suite: **156 files · 1739 passed**

## E2E

`artifact-persistence` + `core-smoke` + `responsive` (desktop-chromium): **7 passed**

## FULL SUITE

**243 / 2 files · 2150 / 6 tests** — pre-existing `weekly-college-grid` + `course-info/highlights`

## BUILD / TYPES / LINT / PRISMA

tsc · prisma · next build · eslint (touched) — **pass**

## PHYSICAL DEVICE VALIDATION

**Not performed** on physical iPad/Safari. Chromium desktop + tablet/mobile viewport emulation only.

## DEFERRED

- Activity mid-project resume (2P-47 structured project)  
- Offline sync queue beyond local draft  
- Native Pencil SDK  
- Project file reorder UX polish  
- Require `expectedUpdatedAt` on all contentJson patches (still optional for back-compat)

## REGRESSIONS

None from 2P-50 learning path. Full-suite 6 fails pre-existing/unrelated.

## ARCHITECTURE INTEGRITY

**One ULE · One Learner Model · One Knowledge Model · One Evidence spine · One Mastery · One Orchestrator · One Adaptive · One Retention · CORE → SIX → LUCKY**

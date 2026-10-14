# 2P-49 STATUS — Study Haul + LMS + School Workflow Integration

## 2P-49 STATUS

**PASS WITH NOTES**

## AUDIT

See [SCHOOL_WORKFLOW_AUDIT.md](./SCHOOL_WORKFLOW_AUDIT.md). School logistics + soft assignment→concept bridge already existed (2P-31). Gaps were surface wiring (Course/Planner/Adaptive assignment context, Study Hub deadlines) and SoT docs — not missing engines.

## GAP

Course/Planner lacked enrich+CTA; Adaptive dropped `assignmentId`; Study Hub learning-strong / deadline-weak; alignment honesty unlabeled.

## IMPLEMENTATION

- `school-lms/school-context.ts` — SchoolContext, alignment honesty, intent hints, SoT matrix
- `school-lms/resolve-owned-assignment.ts` — ownership-safe assignment context
- `ContinueLearningButton` + Adaptive start/page — `assignmentId` display continuity + `SchoolContextStrip`
- Course detail + Planner GET + Study Hub upcoming strip — shared enrich + ContinueLearningButton
- Docs: SCHOOL_WORKFLOW.md · STATUS · audit update · SCHOOL_LMS_INTEGRATION.md
- Tests: `school-workflow.test.ts` · bridge alignment · E2E Journey M

## SCHOOL CONTEXT

Course / assignment / material / deadline / source as soft provenance. Never mastery.

## ASSIGNMENTS

Logistics + soft Topic title link + Adaptive launch when `conceptId` known. Completion ≠ mastery.

## MATERIALS

Unchanged source/context; open ≠ evidence.

## LMS

Canvas / Blackboard / Moodle / Google Classroom remain real sync adapters into normalized Course/Assignment. Tokens omitted from client GET. Deferred: encryption at rest, durable external ids.

## LEARNING BRIDGE

Assignment → Topic match → Concept → ContinueLearningButton → Adaptive (ULE). No second engine.

## EVIDENCE

Only ULE activity paths create LearningAttempt. Assignment status / LMS sync / grades do not.

## MASTERY

ConceptMastery remains canonical.

## PLANNER

GET enriches with concept links; no independent recommender.

## CALENDAR

Unchanged schedule role; ≠ mastery.

## STUDY HUB

Upcoming school strip + existing Growth / LearnerNextAction continuity.

## TUTOR

May use school context; does not invent requirements (unchanged Unified Tutor).

## CORE / SIX / LUCKY

Remain universal; school may launch into them with context only.

## SOURCE OF TRUTH

LMS: external metadata. Study Haul: evidence/mastery/adaptive. Learner: notes/artifacts.

## SECURITY

Session ownership; foreign assignment denied; credentials not client-exposed.

## OFFLINE / FAILURE

Synced local school data usable when LMS/calendar/AI unavailable; no fabricated materials.

## TESTS

Focused `school-lms` + adaptive-start: **3 files · 25 passed**  
(`school-lms.test.ts` 9 · `school-workflow.test.ts` 10 · `adaptive-start.api.test.ts` 6)

Learning suite `src/lib/learning`: **155 files · 1728 passed**

## E2E

`e2e/school-lms-integration.spec.ts` (desktop-chromium): **7 passed** (incl. Journey M assignment context)

## FULL SUITE

**242 / 2 files · 2139 / 6 tests** — pre-existing/unrelated `weekly-college-grid` + `course-info/highlights`

## BUILD / TYPES / LINT / PRISMA

- `tsc --noEmit` — **pass**
- `prisma validate` — **pass**
- `npm run build` — **pass**
- eslint (touched): pre-existing `react-hooks/set-state-in-effect` in HubAssignmentsPanel / study-hub-view (unchanged pattern); unused `BookOpen` removed

## DEFERRED

- Durable external LMS assignment/course ids
- Richer syllabus → assignment parsing without inventing deadlines
- Planner UI deep learning CTAs beyond API enrich (Planner route redirects to dashboard)
- Nested `<button>` hydration warning on Course Materials collapsible header (pre-existing AddCourseMaterialButton nesting)

## CLOSED (do not re-open as deferred)

- LMS + Calendar OAuth token encryption at rest (`enc:v1:` AES-GCM via `SESSION_SECRET`) — see private-beta / 2P-53 hardening

## REGRESSIONS

None from 2P-49 learning path. Full-suite 6 fails are pre-existing schedule/LMS highlight tests.

## ARCHITECTURE INTEGRITY

**One ULE · One Learner Model · One Knowledge Model · One Evidence spine · One Mastery · One Orchestrator · One Adaptive · One Retention · CORE → SIX → LUCKY**

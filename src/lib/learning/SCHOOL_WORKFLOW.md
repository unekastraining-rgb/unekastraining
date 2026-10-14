# School Workflow Integration (2P-49)

**Study Haul is the school/workflow context around the universal learning system, not a second learning engine.**

**External LMS completion, grades, and course progress do not automatically become learner mastery.**

Architecture remains:

**CORE → SIX → LUCKY** · **ONE ULE · ONE Learner Model · ONE Knowledge Model · ONE Evidence · ONE Mastery · ONE Orchestrator · ONE Adaptive · ONE Retention**

---

## School context model

Soft provenance fields (display / continuity only):

| Field | Role |
| --- | --- |
| course / term / section | Class logistics |
| assignment | Due work + status |
| material | Source document |
| deadline | Schedule |
| source | LMS / manual / demo attribution |

**School context ≠ mastery.** An assignment titled “Chapter 11 Test” does not mark OOP mastered.

Helpers: `SchoolContext`, `alignmentStateFromMatchKind`, `inferSchoolLearningIntentHint`, `resolveOwnedAssignmentContext`.

Alignment honesty:

| Match | State |
| --- | --- |
| exact title → Topic | `confirmed` |
| contains match | `inferred` |
| no match | `unaligned` |

Do not invent concept alignment when unavailable — preserve course context only.

---

## Source of truth

| Authority | Owns |
| --- | --- |
| **External LMS** | Synced course/assignment metadata, external due dates |
| **Study Haul** | LearningAttempt, ConceptMastery, Adaptive, Tutor, Orchestrator, Retention |
| **Learner** | Notes, artifacts, manual planning |

Adapters normalize into the existing Course / Assignment / Material model. There is no CanvasAssignmentEngine / LMS mastery layer.

---

## Course → Materials → Assignments → Concepts

```text
Course
  → Materials / Syllabus (source facts)
  → Assignments (logistics + soft Topic title match)
  → Concept (when Topic.conceptId exists)
  → ContinueLearningButton → Adaptive / activities
  → LearningAttempt → ConceptMastery
```

Assignment completion / LMS grade / material open never become LearningAttempt unless an existing ULE activity path records evidence.

---

## Assignment → learning bridge

1. Hub / Course / Planner / Study Hub enrich via `enrichAssignmentsWithConceptLinks`
2. `ContinueLearningButton` passes `assignmentId` (owned display context)
3. `POST /api/study/adaptive/start` validates ownership; returns `assignmentId` for URL continuity
4. Adaptive run page may show `SchoolContextStrip` — not mastery

Intent hints (UNDERSTAND / PRACTICE / ASSESS / CREATE) reuse the existing intent purposes — no school-specific intent system.

---

## Materials

Retain source, course, document identity. Opening/reading ≠ evidence (2P-28 boundary preserved).

---

## LMS adapters

Canvas · Blackboard · Moodle · Google Classroom — real sync adapters into normalized Course/Assignment.  
**Deferred:** durable external assignment ids; token encryption at rest (tokens must never be returned to the client — GET `/api/lms/connect` omits them).

LMS unavailable → previously synced local data remains; sync failure must not mutate mastery.

---

## Calendar / Planner / Study Hub

| Surface | Role |
| --- | --- |
| Calendar | Schedules work (≠ mastery) |
| Planner API | Surfaces assignments + soft concept links (no second recommender) |
| Study Hub | Upcoming school strip + existing Growth / LearnerNextAction continuity |

Learning priority continues to come from Learner Model · evidence · Orchestrator · Adaptive · Growth — not a Planner-only algorithm.

---

## Tutor / CORE / SIX / LUCKY

- Tutor may receive course/assignment/material as context; must not invent requirements.
- CORE remains the universal workspace (no SchoolCore).
- SIX launches from school context when linked; remains universal.
- LUCKY remains ConceptMastery → RetentionItem → LUCKY. Deadlines may add urgency context only.

---

## Security

- Session identity authoritative; client `userId` / ownership / mastery / grades ignored.
- Foreign course/assignment → 404/403.
- LMS credentials never exposed to the client.

---

## Offline / failure

- LMS down → show last synced school data when safely persisted.
- Calendar down → school assignments still usable.
- AI down → non-AI school logistics remain.
- Missing external material → preserve error/source state; do not fabricate contents.

See also: [SCHOOL_LMS_INTEGRATION.md](./SCHOOL_LMS_INTEGRATION.md), [SCHOOL_WORKFLOW_AUDIT.md](./SCHOOL_WORKFLOW_AUDIT.md).

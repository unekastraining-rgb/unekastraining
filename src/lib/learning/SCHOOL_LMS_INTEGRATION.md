# School / LMS Integration → Universal Learning (2P-31)

## Purpose

Connect existing Course / LMS / syllabus / assignment / calendar / material surfaces into the Universal Learning Engine **without** making school the ULE root.

```text
School / LMS (context)
  → Course / LearningSpace
  → Materials / Assignments / Schedule
  → Concepts
  → Adaptive / Tutor / Activities
  → LearningAttempt → ConceptMastery → Orchestrator → LUCKY
```

## Boundaries

| Category | Examples | Role |
| --- | --- | --- |
| **Authoritative learning** | LearningAttempt, ConceptMastery | Truth |
| **Context** | Course, LMS, assignment, due date, calendar, material, LearningSpace | Frame |
| **Presentation** | Teaching Style, a11y | HOW |
| **Intent** | Learning Intent | WHY |

LMS grade ≠ mastery. Assignment submitted ≠ evidence. Calendar ≠ evidence. Sync ≠ evidence.

**2P-49:** Study Haul is school/workflow context around ULE — not a second learning engine. See [SCHOOL_WORKFLOW.md](./SCHOOL_WORKFLOW.md).

## LearningSpace

Optional container. Course may project to LearningSpace via `ensureLearningSpaceForCourse`. Personal learning without Course remains valid.

## Assignment → learning bridge

`resolveAssignmentConceptLink` / `enrichAssignmentsWithConceptLinks`:

1. Match assignment title to Topic in same Course  
2. Use existing `Topic.conceptId` only (hub load)  
3. `ContinueLearningButton` / Adaptive start when concept known  
4. **2P-49:** `alignmentState` (`confirmed` | `inferred` | `unaligned`); optional owned `assignmentId` display context on Adaptive start

`POST /api/assignments/[id]/study-learning` may `ensureConceptForTopic` for a matched Topic (Concept only — never LearningAttempt).

## Material / Adaptive / Tutor

Reuse 2P-27/28 material path and 2P-29 learner context. No CourseTutor / LMSTutor.

## LUCKY

Only after legitimate Adaptive run COMPLETED. Never Assignment → Lucky.

## Security

- Session identity authoritative  
- LMS tokens omitted from GET `/api/lms/connect`  
- Cross-user course/assignment/material/concept denied  

## Providers preserved

Canvas · Blackboard · Moodle · Google Classroom · Google Calendar — enhance, do not replace.

**Deferred:** token encryption at rest; durable external LMS entity ids.

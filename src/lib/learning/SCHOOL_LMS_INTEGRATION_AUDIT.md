# School / LMS Integration Audit (2P-31)

Audit of existing school, LMS, course, assignment, calendar, and material infrastructure **before** additive ULE bridges.

## Executive verdict

School/LMS surfaces already import courses, assignments, grades, syllabus topics, and materials **without** writing ULE evidence.  
The main product gap is **assignment → concept → Adaptive** (helper `resolvePlannerAdaptiveEntry` exists; Assignments UI not wired).

**Preserve → Connect:** reuse LearningSpace, Topic→Concept, material 2P-27/28, Adaptive start.  
Do **not** create CourseMastery / AssignmentMastery / LMSMastery.

---

## Architecture boundary

```text
LearningSpace (optional container)
  └── Course (optional)
        ├── LMS connection (external context)
        ├── CourseMaterial → prepare → Concept (confirm)
        ├── Topic → Concept
        ├── Assignment → may link Topic/Concept (logistics ≠ evidence)
        └── Calendar / due dates (context only)
              ↓
        ConceptMastery ← LearningAttempt ← Adaptive / activities
```

Course is **not** the universal ULE root. Personal learning without Course must continue.

---

## Existing systems (summary)

| Area | Status | Key paths |
| --- | --- | --- |
| Course | Working | `prisma` Course; `app/api/courses/*`; `resolveCourseForUser` |
| LearningSpace | Working | `ensureLearningSpaceForCourse`; optional `courseId` |
| LMS Canvas/BB/Moodle/GC | Working sync | `src/lib/lms/sync.ts`; OAuth; tokens server-side |
| Syllabus | Working | `enrich-course-from-syllabus`; Topic seed |
| Assignment | Working logistics | Hub + Course UI; grades via `formatGradeLabel` |
| Calendar / Google | Working | Separate from LMS; events ≠ evidence |
| Material 2P-27/28 | Working | Prepare → Concept confirm → Adaptive |
| Study Hub / Study Now | Working | Topic.conceptId → Adaptive CTA |
| Assignment → Adaptive | **Gap** | Bridge helper only in tests |

---

## Per-feature checklist

### Course
1. Model: `Course` + `userId`  
2. Ownership: session user / `resolveCourseForUser`  
3. API: `/api/courses`  
4. UI: CourseDashboard, Hub classes  
5. SoT: local Course row (LMS is import source)  
6–8. LearningSpace optional; materials/topics linked  
9–10. Assignments/calendar via relations  
11. ULE via Topic/Concept bridges, not CourseMastery  
12. Security: course.userId  
13. Limit: no durable Canvas assignment external id

### LearningSpace
Optional school container under Learner. Course → Space is lazy on concept bridge.

### LMS
- Auth: OAuth / Moodle token; stored on `LMSConnection`  
- Sync: courses, assignments, grades, meetings, syllabus materials  
- **Sync ≠ LearningAttempt / ConceptMastery** (verified: no writes in `src/lib/lms`)  
- Tokens omitted from GET `/api/lms/connect`  
- Limit: plaintext tokens at rest; title+dueDate dedup

### Assignment
Logistics only. No `conceptId` FK. Grades are school artifacts ≠ ConceptMastery.

### Evidence boundary (required for 2P-31)

| Action | Creates LearningAttempt? |
| --- | --- |
| LMS sync | No |
| Grade import | No |
| Mark assignment complete | No |
| Calendar event | No |
| Material prepare/confirm | No (2P-27) |
| Adaptive activity submit | Yes (existing path) |

---

## Smallest additive path

```text
Owned Assignment
  → match Topic in same Course (title)
  → Topic.conceptId (existing only on hub load)
  → resolvePlannerAdaptiveEntry / ContinueLearningButton
  → POST /api/study/adaptive/start
```

Optional study API may `ensureConceptForTopic` when Topic exists but Concept not yet linked — creates Concept only, never evidence.

---

## Intentionally disconnected

- Grades → ConceptMastery  
- Assignment SUBMITTED → LearningAttempt  
- Calendar due → evidence  
- LMS sync → mastery  
- Course as ULE root  

---

## STOP conditions (none blocking)

No destructive migration required. No second mastery system required. Tokens can remain server-side with GET omitting them.

# SCHOOL_WORKFLOW_AUDIT — 2P-49

**Mode:** Soft school context + surface wiring — no second learning engine / LMS mastery  
**Rule:** Study Haul is the school/workflow context around the universal learning system, not a second learning engine.  
**Rule:** External LMS completion, grades, and course progress do not automatically become learner mastery.  
**Prior:** 2P-31 school-lms bridge · 2P-42…2P-48

---

## What already existed

| Capability | Status |
|------------|--------|
| Course / Assignment / Material / Topic (Prisma) | Yes |
| Canvas / Blackboard / Moodle / Google Classroom sync | Real adapters (not stubs) |
| Assignment title → Topic → Concept bridge | Yes (2P-31) |
| Hub Assignments → Adaptive CTA | Yes |
| LMS sync ≠ LearningAttempt | Enforced |
| Material open ≠ evidence | Enforced |
| Planner = Assignment API; redirects to dashboard | Yes |
| Calendar + Google sync | Yes (≠ mastery) |

## Audit answers (summary)

1. School logistics workflow exists end-to-end when Topic titles align.
2. Persisted in Prisma — not localStorage for school data.
3. localStorage = prefs/UI chrome only.
4. All four LMS adapters are real sync paths (plaintext tokens deferred).
5. Syllabus + materials yes.
6. Assignments are logistics; learning via soft concept bridge.
7. Concept link via title match — fragile but real.
8. Materials → Concept confirm → Adaptive yes.
9. Launch from Hub yes; Course page / Planner thin.
10. Evidence only via ULE activity paths.
11. LMS completion does **not** affect mastery.
12. Assignment context often dropped at Adaptive entry.
13. Study Hub learning-strong, deadline-weak.
14. Calendar/Planner schedule work; thin learning CTAs.
15. Gaps = surface wiring + context handoff + SoT docs — not engines.

## Smallest plan

1. School context contract helpers (provenance, alignment honesty, intent hint) — **done**
2. Course page + Planner enrich + Adaptive `assignmentId` display context — **done**
3. Study Hub upcoming school strip (link to existing schedule — no new recommender) — **done**
4. Docs + tests + E2E · no LMS mastery · no SchoolCore — **done**

See [SCHOOL_WORKFLOW.md](./SCHOOL_WORKFLOW.md) and [SCHOOL_WORKFLOW_STATUS.md](./SCHOOL_WORKFLOW_STATUS.md).

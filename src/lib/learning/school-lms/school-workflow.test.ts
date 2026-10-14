/**
 * 2P-49 — School workflow / LMS integration contract tests.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  alignmentStateFromMatchKind,
  inferSchoolLearningIntentHint,
  schoolContextTruthSummary,
  schoolSourceOfTruthMatrix,
  schoolLmsBoundaryTruthSummary,
  enrichAssignmentsWithConceptLinks,
  SCHOOL_LMS_EVIDENCE_BOUNDARY,
} from "@/lib/learning/school-lms";

function read(rel: string) {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

describe("2P-49 school context contract", () => {
  it("alignment honesty: exact→confirmed, contains→inferred, none→unaligned", () => {
    expect(alignmentStateFromMatchKind("exact")).toBe("confirmed");
    expect(alignmentStateFromMatchKind("contains")).toBe("inferred");
    expect(alignmentStateFromMatchKind("none")).toBe("unaligned");
  });

  it("intent hints map into existing Learning Intent purposes only", () => {
    expect(inferSchoolLearningIntentHint({ kind: "QUIZ", title: "Ch 3" })).toBe(
      "ASSESS",
    );
    expect(
      inferSchoolLearningIntentHint({ kind: "PROJECT", title: "Write essay" }),
    ).toBe("CREATE");
    expect(
      inferSchoolLearningIntentHint({ kind: "READING", title: "Chapter 2" }),
    ).toBe("UNDERSTAND");
    expect(
      inferSchoolLearningIntentHint({ kind: "ASSIGNMENT", title: "Problem set" }),
    ).toBe("PRACTICE");
  });

  it("truth: school context is not mastery / not a second engine", () => {
    const t = schoolContextTruthSummary();
    expect(t.schoolContextIsNotMastery).toBe(true);
    expect(t.inventsSecondLearningEngine).toBe(false);
    expect(t.inventsLmsMastery).toBe(false);
    expect(t.inventsSchoolCore).toBe(false);
    expect(t.assignmentCompletionIsNotEvidence).toBe(true);
    expect(t.lmsGradeIsNotConceptMastery).toBe(true);
    expect(t.usesExistingConceptBridge).toBe(true);
  });

  it("source-of-truth matrix separates LMS / Study Haul / learner", () => {
    const m = schoolSourceOfTruthMatrix();
    expect(m.externalLmsAuthoritativeFor).toContain(
      "externally_supplied_assignment_metadata",
    );
    expect(m.studyHaulAuthoritativeFor).toContain("concept_mastery");
    expect(m.studyHaulAuthoritativeFor).toContain("learner_evidence");
    expect(m.learnerAuthoritativeFor).toContain("personal_notes");
  });

  it("enrichment adds alignmentState without inventing completion→mastery", () => {
    const enriched = enrichAssignmentsWithConceptLinks(
      [{ id: "a1", title: "No match here", courseId: "c1", status: "SUBMITTED" }],
      [
        {
          id: "t1",
          name: "Different topic",
          courseId: "c1",
          conceptId: "c-x",
        },
      ],
    );
    expect(enriched[0].alignmentState).toBe("unaligned");
    expect(enriched[0].conceptId).toBeNull();
    expect(enriched[0].status).toBe("SUBMITTED");
    expect(
      SCHOOL_LMS_EVIDENCE_BOUNDARY.assignmentStatusChangeCreatesLearningAttempt,
    ).toBe(false);
    expect(schoolLmsBoundaryTruthSummary().gradesAreNotMastery).toBe(true);
  });
});

describe("2P-49 surface wiring integrity", () => {
  it("ContinueLearningButton forwards assignmentId as display context", () => {
    const btn = read("src/components/study/ContinueLearningButton.tsx");
    expect(btn).toContain("assignmentId");
    expect(btn).toContain('params.set("assignmentId"');
    expect(btn).toContain("body.assignmentId");
  });

  it("Adaptive start validates owned assignmentId without writing evidence", () => {
    const route = read("app/api/study/adaptive/start/route.ts");
    expect(route).toContain("resolveOwnedAssignmentContext");
    expect(route).toContain("assignmentId");
    expect(route).not.toMatch(/recordEvidence|applyEvidenceToMastery/);
  });

  it("Course detail + Planner + Hub use shared ContinueLearningButton", () => {
    const course = read("app/courses/[id]/course-detail-view.tsx");
    const planner = read("app/api/planner/route.ts");
    const hub = read("src/components/hub/HubAssignmentsPanel.tsx");
    const study = read("app/study/study-hub-view.tsx");
    expect(course).toContain("ContinueLearningButton");
    expect(course).toContain("assignmentId={assignment.id}");
    expect(planner).toContain("enrichAssignmentsWithConceptLinks");
    expect(hub).toContain("assignmentId={assignment.id}");
    // Schoolwork is not on Study Haul front door — stays on courses/planner surfaces
    expect(study).not.toContain("data-school-upcoming-strip");
    expect(course).toContain("ContinueLearningButton");
  });

  it("Adaptive run page shows SchoolContextStrip for owned assignment", () => {
    const page = read("app/study/adaptive/[runId]/page.tsx");
    expect(page).toContain("SchoolContextStrip");
    expect(page).toContain("resolveOwnedAssignmentContext");
    expect(page).toContain("assignmentId");
  });

  it("does not invent SchoolCore / LMS mastery engines", () => {
    const t = schoolContextTruthSummary();
    expect(t.inventsSchoolCore).toBe(false);
    expect(t.inventsCanvasAssignmentEngine).toBe(false);
    expect(t.inventsLmsMastery).toBe(false);
    const sync = read("src/lib/lms/sync.ts");
    expect(sync).not.toMatch(/ConceptMastery|LearningAttempt/);
  });
});

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  SCHOOL_LMS_EVIDENCE_BOUNDARY,
  schoolLmsCreatesEvidence,
  schoolLmsBoundaryTruthSummary,
  matchTopicForAssignmentTitle,
  resolveAssignmentConceptLink,
  enrichAssignmentsWithConceptLinks,
  assignmentLearningBridgeTruthSummary,
} from "@/lib/learning/school-lms";

describe("2P-31 school/LMS evidence boundary", () => {
  it("sync/grades/assignment/calendar never create evidence", () => {
    expect(SCHOOL_LMS_EVIDENCE_BOUNDARY.lmsSyncCreatesLearningAttempt).toBe(
      false,
    );
    expect(SCHOOL_LMS_EVIDENCE_BOUNDARY.lmsSyncCreatesConceptMastery).toBe(
      false,
    );
    expect(SCHOOL_LMS_EVIDENCE_BOUNDARY.gradeImportCreatesConceptMastery).toBe(
      false,
    );
    expect(
      SCHOOL_LMS_EVIDENCE_BOUNDARY.assignmentStatusChangeCreatesLearningAttempt,
    ).toBe(false);
    expect(
      SCHOOL_LMS_EVIDENCE_BOUNDARY.assignmentSubmissionCreatesLearningAttempt,
    ).toBe(false);
    expect(
      SCHOOL_LMS_EVIDENCE_BOUNDARY.calendarEventCreatesLearningAttempt,
    ).toBe(false);
    expect(schoolLmsCreatesEvidence("adaptiveActivityMayCreateEvidence")).toBe(
      true,
    );
    const t = schoolLmsBoundaryTruthSummary();
    expect(t.gradesAreNotMastery).toBe(true);
    expect(t.noCourseMastery).toBe(true);
    expect(t.noAssignmentMastery).toBe(true);
    expect(t.noLmsMastery).toBe(true);
    expect(t.courseIsNotUleRoot).toBe(true);
  });

  it("LMS sync modules do not import evidence writers", () => {
    const sync = readFileSync(
      path.join(process.cwd(), "src/lib/lms/sync.ts"),
      "utf8",
    );
    expect(sync).not.toMatch(/recordEvidence|applyEvidenceToMastery|LearningAttempt/);
    expect(sync).not.toMatch(/conceptMastery\.create|ConceptMastery/);
  });

  it("LMS connect GET omits tokens from select", () => {
    const route = readFileSync(
      path.join(process.cwd(), "app/api/lms/connect/route.ts"),
      "utf8",
    );
    expect(route).toContain("select:");
    expect(route).not.toMatch(/select:\s*\{[^}]*accessToken/);
    // Response mapping must not spread full connection row with tokens
    expect(route).toMatch(/provider:\s*true/);
    expect(route).toMatch(/status:\s*true/);
  });
});

describe("2P-31 assignment → concept bridge", () => {
  const topics = [
    {
      id: "t1",
      name: "Network Connectivity Lab Practice",
      courseId: "c1",
      conceptId: "concept-a",
    },
    {
      id: "t2",
      name: "Other topic",
      courseId: "c1",
      conceptId: null,
    },
    {
      id: "t3",
      name: "Foreign",
      courseId: "c-other",
      conceptId: "concept-b",
    },
  ];

  it("matches exact title to Topic.conceptId without inventing", () => {
    const link = resolveAssignmentConceptLink({
      assignmentId: "a1",
      courseId: "c1",
      title: "Network Connectivity Lab Practice",
      topics,
    });
    expect(link.conceptId).toBe("concept-a");
    expect(link.topicId).toBe("t1");
    expect(link.matchKind).toBe("exact");
    expect(link.alignmentState).toBe("confirmed");
    expect(link.adaptiveCta.kind).toBe("start");
  });

  it("marks contains match as inferred alignment", () => {
    const link = resolveAssignmentConceptLink({
      assignmentId: "a-contains",
      courseId: "c1",
      title: "Network Connectivity Lab Practice — homework",
      topics,
    });
    expect(link.conceptId).toBe("concept-a");
    expect(link.matchKind).toBe("contains");
    expect(link.alignmentState).toBe("inferred");
  });

  it("does not invent concept when Topic has no conceptId", () => {
    const link = resolveAssignmentConceptLink({
      assignmentId: "a2",
      courseId: "c1",
      title: "Other topic",
      topics,
    });
    expect(link.topicId).toBe("t2");
    expect(link.conceptId).toBeNull();
    expect(link.adaptiveCta.kind).toBe("none");
  });

  it("does not cross course boundaries", () => {
    const matched = matchTopicForAssignmentTitle("Foreign", topics, "c1");
    expect(matched).toBeNull();
  });

  it("enrichment preserves assignment fields", () => {
    const enriched = enrichAssignmentsWithConceptLinks(
      [
        {
          id: "a1",
          title: "Network Connectivity Lab Practice",
          courseId: "c1",
          status: "NOT_STARTED",
        },
      ],
      topics,
    );
    expect(enriched[0].conceptId).toBe("concept-a");
    expect(enriched[0].status).toBe("NOT_STARTED");
  });

  it("truth: assignment status ≠ evidence; course optional", () => {
    const t = assignmentLearningBridgeTruthSummary();
    expect(t.inventsConceptsFromAssignmentTitle).toBe(false);
    expect(t.assignmentStatusCreatesEvidence).toBe(false);
    expect(t.gradeCreatesMastery).toBe(false);
    expect(t.usesExistingAdaptiveEntry).toBe(true);
    expect(t.courseIsOptional).toBe(true);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const { findManyAssignments, findManyMasteries } = vi.hoisted(() => ({
  findManyAssignments: vi.fn(),
  findManyMasteries: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    assignment: {
      findMany: findManyAssignments,
    },
    topicMastery: {
      findMany: findManyMasteries,
    },
  },
}));

import { generateScheduleProposals } from "@/lib/schedule/proposals";

describe("generateScheduleProposals loop context", () => {
  beforeEach(() => {
    findManyAssignments.mockReset();
    findManyMasteries.mockReset();
    findManyAssignments.mockResolvedValue([
      {
        id: "assign-1",
        title: "Module 1 Quiz",
        courseId: "course-bus",
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        course: { title: "Introduction to Business", code: "BUS101" },
      },
    ]);
    findManyMasteries.mockResolvedValue([
      {
        topicId: "topic-osmosis",
        proficiency: 0.2,
        understanding: 0.3,
        recall: 0.25,
        application: 0.2,
        reviewCount: 1,
        topic: {
          id: "topic-osmosis",
          name: "Osmosis",
          courseId: "course-bio",
          course: { title: "Bio 101", code: "BIO101" },
        },
      },
    ]);
  });

  it("includes courseId on assignment and weak-topic proposals for loop chips", async () => {
    const changes = await generateScheduleProposals("user-1");

    const assignment = changes.find((change) => change.type === "reschedule_assignment");
    expect(assignment?.courseId).toBe("course-bus");

    const review = changes.find((change) => change.type === "review_topic");
    expect(review?.courseId).toBe("course-bio");
    expect(review?.sixHref).toContain("course-bio");
    expect(review?.sixHref).toContain("topic-osmosis");
  });
});

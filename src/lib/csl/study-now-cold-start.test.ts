import { describe, expect, it } from "vitest";

import {
  buildColdStartFocusTopics,
  buildStudyNowPlan,
  enrichStudyNowBlocksForCourse,
} from "@/lib/csl/study-now";

describe("study now cold-start loop links", () => {
  const courseId = "course-bio101";
  const courseTitle = "Introduction to Biology";
  const focusTopic = "Cell membrane transport";

  it("builds chunking picks from syllabus topics", () => {
    const topics = buildColdStartFocusTopics({
      courseId,
      courseTitle,
      topicNames: [
        "Instructor & Course Information",
        "Cell membrane transport",
        "Photosynthesis",
      ],
    });

    expect(topics).toHaveLength(2);
    expect(topics[0]?.topicName).toBe("Cell membrane transport");
    expect(topics[0]?.href).toContain(`courseId=${courseId}`);
    expect(topics[0]?.href).toContain("topic=");
  });

  it("attaches courseId and cold-start topic to Study Now quiz blocks", () => {
    const focusTopics = buildColdStartFocusTopics({
      courseId,
      courseTitle,
      topicNames: [focusTopic],
    });
    const plan = buildStudyNowPlan(
      20,
      { missedQuestions: 0, dueFlashcards: 0 },
      focusTopics,
    );
    const blocks = enrichStudyNowBlocksForCourse(plan.blocks, {
      courseId,
      courseTitle,
      focusTopics,
    });

    const quiz = blocks.find((block) => block.activity === "quiz");
    expect(quiz?.href).toContain(`courseId=${courseId}`);
    expect(quiz?.href).toContain("make=1");
    expect(quiz?.href).toContain("topic=");

    const six = blocks.find((block) => block.activity === "chunking");
    expect(six?.href).toContain(`courseId=${courseId}`);
    expect(six?.href).toContain("topic=");
  });
});

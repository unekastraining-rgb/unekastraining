import { describe, expect, it } from "vitest";

import {
  buildStudyNowPlan,
  enrichStudyNowBlocksForCourse,
  type StudyNowTopicPick,
} from "@/lib/csl/study-now";

describe("enrichStudyNowBlocksForCourse", () => {
  const focusTopics: StudyNowTopicPick[] = [
    {
      topicId: "topic-1",
      topicName: "Binary Search Trees",
      courseId: "course-cs201",
      courseTitle: "CS 201 — Data Structures",
      component: "chunking",
      componentTitle: "Chunking",
      href: "/study/six/chunking?courseId=course-cs201&topic=Binary%20Search%20Trees",
      reason: "New topic",
      proficiency: 0,
    },
  ];

  it("auto-builds Lucky quiz from focus topic course when courseId omitted", () => {
    const plan = buildStudyNowPlan(20, {}, focusTopics);
    const blocks = enrichStudyNowBlocksForCourse(plan.blocks, { focusTopics });

    const quiz = blocks.find((item) => item.activity === "quiz");
    expect(quiz?.href).toBe(
      "/quizzes?courseId=course-cs201&make=1&topic=Binary+Search+Trees",
    );
    expect(quiz?.subtitle).toContain("CS 201");
  });

  it("keeps explicit courseId when provided", () => {
    const plan = buildStudyNowPlan(20, {}, focusTopics);
    const blocks = enrichStudyNowBlocksForCourse(plan.blocks, {
      courseId: "explicit-id",
      courseTitle: "Explicit Course",
      focusTopics,
    });

    const quiz = blocks.find((item) => item.activity === "quiz");
    expect(quiz?.href).toBe(
      "/quizzes?courseId=explicit-id&make=1&topic=Binary+Search+Trees",
    );
  });

  it("adds course context to generic Six blocks without topic names", () => {
    const plan = buildStudyNowPlan(20, {}, []);
    const blocks = enrichStudyNowBlocksForCourse(plan.blocks, {
      courseId: "course-cs201",
      courseTitle: "CS 201 — Data Structures",
      focusTopics,
    });

    const feynman = blocks.find((item) => item.activity === "feynman");
    expect(feynman?.href).toContain("courseId=course-cs201");
    expect(feynman?.href).toContain("topic=Binary%20Search%20Trees");
    expect(feynman?.topicName).toBe("Binary Search Trees");
  });

  it("scopes flashcards and missed-review blocks to the course", () => {
    const missedPlan = buildStudyNowPlan(20, { missedQuestions: 2 }, []);
    const missedBlocks = enrichStudyNowBlocksForCourse(missedPlan.blocks, {
      courseId: "course-cs201",
      courseTitle: "CS 201 — Data Structures",
    });
    expect(missedBlocks.find((item) => item.activity === "missed-review")?.href).toBe(
      "/quizzes?filter=missed&courseId=course-cs201",
    );
  });

  it("keeps Core → Six → Lucky on a 5-minute clock", () => {
    const micro = buildStudyNowPlan(5, {}, []);
    expect(micro.summary).toMatch(/Six → Lucky/i);
    expect(micro.blocks.some((item) => item.activity === "chunking")).toBe(true);
    expect(micro.blocks.some((item) => item.activity === "quiz")).toBe(true);

    const withTopic = buildStudyNowPlan(5, {}, focusTopics);
    expect(withTopic.blocks.some((item) => item.activity === "chunking")).toBe(true);
    expect(withTopic.blocks.some((item) => item.activity === "quiz")).toBe(true);
    const enriched = enrichStudyNowBlocksForCourse(withTopic.blocks, { focusTopics });
    expect(enriched.find((item) => item.activity === "quiz")?.href).toContain(
      "courseId=course-cs201",
    );
  });
});

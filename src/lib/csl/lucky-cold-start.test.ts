import { describe, expect, it } from "vitest";

import { buildLuckySession, enrichLuckyBlocksForCourse } from "@/lib/csl/lucky-engine";

describe("Lucky engine cold-start loop links", () => {
  const courseId = "course-bio101";
  const coldStartTopic = "Cell membrane transport";

  it("keeps generic hrefs when no course context", () => {
    const plan = buildLuckySession({
      missedQuestions: 0,
      dueFlashcards: 0,
      weakTopics: 0,
      lowUnderstanding: 0,
      lowRecall: 0,
    });
    const blocks = enrichLuckyBlocksForCourse(plan.blocks, {});
    const learn = blocks.find((block) => block.id === "learn");
    expect(learn?.href).toBe("/core");
  });

  it("attaches courseId, pack, and cold-start topic to Lucky loop steps", () => {
    const plan = buildLuckySession({
      missedQuestions: 0,
      dueFlashcards: 1,
      weakTopics: 1,
      lowUnderstanding: 1,
      lowRecall: 0,
    });
    const blocks = enrichLuckyBlocksForCourse(plan.blocks, {
      courseId,
      coldStartTopic,
    });

    const learn = blocks.find((block) => block.id === "learn");
    expect(learn?.href).toContain(`courseId=${courseId}`);
    expect(learn?.href).toContain("pack=1");
    const learnTopic = new URL(learn?.href ?? "", "http://studyhaul.test").searchParams.get(
      "topic",
    );
    expect(learnTopic).toBe(coldStartTopic);

    const blurt = blocks.find((block) => block.id === "recall");
    expect(blurt?.href).toContain(`courseId=${courseId}`);
    const blurtTopic = new URL(blurt?.href ?? "", "http://studyhaul.test").searchParams.get(
      "topic",
    );
    expect(blurtTopic).toBe(coldStartTopic);

    const quiz = blocks.find((block) => block.id === "challenge");
    expect(quiz?.href).toContain(`courseId=${courseId}`);
    expect(quiz?.href).toContain("make=1");

    const mixed = blocks.find((block) => block.id === "gaps");
    expect(mixed?.href).toContain(`courseId=${courseId}`);
  });
});

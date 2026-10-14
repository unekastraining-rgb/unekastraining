import { describe, expect, it } from "vitest";

import { buildMixedReviewPlan } from "@/lib/csl/mixed-review";

describe("mixed review cold-start loop links", () => {
  const courseId = "course-bio101";
  const focusTopic = "Cell membrane transport";

  it("keeps generic hrefs when no course context", () => {
    const steps = buildMixedReviewPlan({
      missedQuestions: 0,
      dueFlashcards: 0,
      weakTopics: 0,
      lowUnderstanding: 0,
    });
    expect(steps.some((step) => step.href === "/quizzes")).toBe(true);
    expect(steps.some((step) => step.href === "/study/blurting")).toBe(true);
  });

  it("attaches courseId and cold-start topic to Lucky loop steps", () => {
    const steps = buildMixedReviewPlan({
      missedQuestions: 2,
      dueFlashcards: 0,
      weakTopics: 1,
      lowUnderstanding: 1,
      courseId,
      focusTopic,
    });

    for (const step of steps) {
      expect(step.href).toContain(`courseId=${courseId}`);
    }

    const blurt = steps.find((step) => step.id === "blurting");
    expect(blurt?.href).toContain("topic=");
    expect(decodeURIComponent(blurt?.href.split("topic=")[1] ?? "")).toBe(focusTopic);

    const quiz = steps.find((step) => step.id === "quiz");
    expect(quiz?.href).toContain("make=1");
  });
});

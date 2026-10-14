import { describe, expect, it } from "vitest";

import { buildTopicsSourceBlock } from "@/lib/quizzes/from-topics";
import { quizAiEligibility } from "@/lib/quizzes/generate";

describe("quizAiEligibility", () => {
  it("allows AI cold start from LMS topic outline alone (no uploads)", () => {
    const topicsBlock = buildTopicsSourceBlock("CS 201", [
      { name: "Recursion", description: "Base and recursive cases" },
      { name: "Binary Search Trees", description: "Insert and search" },
      { name: "Graph Traversal", description: "BFS and DFS" },
    ]);
    expect(topicsBlock.length).toBeGreaterThanOrEqual(120);
    expect(
      quizAiEligibility({
        aiConfigured: true,
        combinedSourceLength: topicsBlock.length,
        topicsBlockLength: topicsBlock.length,
        hasTopicSeeds: true,
      }),
    ).toBe(true);
  });

  it("requires more source text when no syllabus topics exist", () => {
    expect(
      quizAiEligibility({
        aiConfigured: true,
        combinedSourceLength: 80,
        topicsBlockLength: 0,
        hasTopicSeeds: false,
      }),
    ).toBe(false);
    expect(
      quizAiEligibility({
        aiConfigured: true,
        combinedSourceLength: 250,
        topicsBlockLength: 0,
        hasTopicSeeds: false,
      }),
    ).toBe(true);
  });

  it("is false when no AI keys are configured", () => {
    expect(
      quizAiEligibility({
        aiConfigured: false,
        combinedSourceLength: 500,
        topicsBlockLength: 200,
        hasTopicSeeds: true,
      }),
    ).toBe(false);
  });
});

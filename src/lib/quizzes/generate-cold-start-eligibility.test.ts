import { describe, expect, it } from "vitest";

import { buildTopicsSourceBlock } from "@/lib/quizzes/from-topics";

describe("cold-start quiz source eligibility", () => {
  it("builds enough topic-outline text for AI cold start from LMS modules", () => {
    const block = buildTopicsSourceBlock(
      "CS 201",
      [
        { name: "Object-Oriented Design", description: "Classes and inheritance" },
        { name: "Recursion", description: "Base and recursive cases" },
        { name: "Binary Search Trees", description: "Insert and search" },
      ],
      { focusTopic: "Recursion" },
    );
    expect(block.length).toBeGreaterThanOrEqual(120);
    expect(block).toContain("Primary focus topic: Recursion");
    expect(block).toContain("Object-Oriented Design");
  });
});

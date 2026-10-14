import { describe, expect, it } from "vitest";

import { resolveLoopFocusTopic } from "@/lib/study/resolve-loop-focus-topic";

describe("resolveLoopFocusTopic", () => {
  it("prefers URL topic over syllabus topics", () => {
    expect(
      resolveLoopFocusTopic("Binary Search Trees", [
        "Intro",
        "Python Programming fundamentals",
      ]),
    ).toBe("Binary Search Trees");
  });

  it("falls back to cold-start topic pick when URL topic is empty", () => {
    expect(
      resolveLoopFocusTopic(null, ["Intro", "Binary Search Trees", "Graphs"]),
    ).toBe("Binary Search Trees");
  });
});

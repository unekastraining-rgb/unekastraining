import { describe, expect, it } from "vitest";

import { pickColdStartTopic } from "@/lib/study/cold-start-topic";

describe("pickColdStartTopic", () => {
  it("skips meta syllabus headings and returns first content topic", () => {
    expect(
      pickColdStartTopic([
        "Instructor & Course Information",
        "Grading Policy",
        "Osmosis",
        "Mitosis",
      ]),
    ).toBe("Osmosis");
  });

  it("returns null when only meta topics exist", () => {
    expect(pickColdStartTopic(["Syllabus Overview", "Office Hours"])).toBeNull();
  });

  it("skips thin LMS week labels like Intro and Overview", () => {
    expect(
      pickColdStartTopic(["Intro", "Binary Search Trees", "Graph Traversal"]),
    ).toBe("Binary Search Trees");
    expect(pickColdStartTopic(["Introduction", "Osmosis"])).toBe("Osmosis");
  });
});

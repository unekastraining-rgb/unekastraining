import { describe, expect, it } from "vitest";

import { chapterSubtopicsFromText } from "@/lib/syllabus/enrich-course-from-syllabus";
import { formatCanvasModuleOutline } from "@/lib/lms/canvas-cold-start";

describe("Canvas live cold-start outline fallback", () => {
  it("module-only Canvas courses still yield study topics", () => {
    const modules = formatCanvasModuleOutline([
      { name: "Week 1: Intro" },
      { name: "Week 2: Binary Search Trees" },
      { name: "Week 3: Heaps" },
      { name: "Week 4: Graphs" },
    ]);

    const topics = chapterSubtopicsFromText(modules);
    expect(topics.length).toBeGreaterThanOrEqual(3);
    expect(topics.some((t) => /Binary Search Trees/i.test(t.name))).toBe(true);
    expect(topics.some((t) => /^Intro$/i.test(t.name))).toBe(false);
    expect(topics[0]?.name).toMatch(/Binary Search Trees/i);
  });
});

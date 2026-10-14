import { describe, expect, it } from "vitest";

import { chapterSubtopicsFromText } from "@/lib/syllabus/enrich-course-from-syllabus";
import { buildDemoCanvasSyllabus } from "@/lib/lms/demo-cold-start";

describe("chapterSubtopicsFromText", () => {
  it("extracts demo CS201 chapters, not learning outcomes", () => {
    const topics = chapterSubtopicsFromText(buildDemoCanvasSyllabus("CS201"));
    const names = topics.map((t) => t.name);
    expect(names).toContain("Binary Search Trees");
    expect(names).toContain("Hash Tables and Collision Handling");
    expect(names.some((n) => /implement and analyze/i.test(n))).toBe(false);
    expect(names).not.toContain("Learning outcomes");
    expect(names).not.toContain("Chapters");
  });

  it("extracts demo ENG110 units", () => {
    const names = chapterSubtopicsFromText(buildDemoCanvasSyllabus("ENG110")).map(
      (t) => t.name,
    );
    expect(names).toEqual(
      expect.arrayContaining([
        "Thesis and Argument",
        "Evidence and Citation",
        "Revision Strategies",
      ]),
    );
  });

  it("skips syllabus admin headings in OCR/flat outlines", () => {
    const text = `
## Chapters
- Important Dates
- Course Policies
- Variables and Types
- Control Flow
- Functions
`.trim();
    const names = chapterSubtopicsFromText(text).map((t) => t.name);
    expect(names).toEqual(["Variables and Types", "Control Flow", "Functions"]);
  });
});

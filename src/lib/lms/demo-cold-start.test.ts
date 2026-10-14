import { describe, expect, it } from "vitest";

import { buildDemoCanvasSyllabus, demoColdStartCourseEntry } from "@/lib/lms/demo-cold-start";

describe("demo Canvas cold-start syllabus", () => {
  it("includes chapter/unit headings for topic enrichment", () => {
    expect(buildDemoCanvasSyllabus("CS201")).toMatch(/Binary Search Trees/);
    expect(buildDemoCanvasSyllabus("CS201")).toMatch(/## Chapters/);
    expect(buildDemoCanvasSyllabus("ENG110")).toMatch(/Thesis and Argument/);
    expect(buildDemoCanvasSyllabus("ENG110")).toMatch(/## Units/);
  });

  it("builds onboarding coldStartCourses entry with first chapter topic", () => {
    const entry = demoColdStartCourseEntry("course-cs201", "CS 201 — Data Structures", "CS201");
    expect(entry.id).toBe("course-cs201");
    expect(entry.focusTopic).toBe("Binary Search Trees");
  });
});

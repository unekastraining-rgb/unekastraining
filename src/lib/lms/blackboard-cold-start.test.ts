/**
 * Blackboard cold-start outline → CourseMaterial / Study Haul continuity.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  blackboardSyllabusMaterialMeta,
  buildBlackboardColdStartText,
} from "@/lib/lms/blackboard-cold-start";
import { chapterSubtopicsFromText } from "@/lib/syllabus/enrich-course-from-syllabus";
import { studyHaulHref } from "@/lib/study/loop-hrefs";

function read(rel: string) {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

describe("Blackboard CourseMaterial cold start", () => {
  it("builds seeded outline from gradebook columns and meetings", () => {
    const coldStart = buildBlackboardColdStartText({
      courseName: "Anatomy",
      courseKey: "ANAT200",
      columns: [
        { id: "1", name: "Cell Structure quiz", dueDate: "2026-10-01" },
        { id: "2", name: "Tissue types essay" },
      ],
      meetings: [{ title: "Lecture — Organelles" }],
    });

    expect(coldStart.seeded).toBe(true);
    expect(coldStart.text).toMatch(/Course: Anatomy/);
    expect(coldStart.text).toMatch(/Gradebook \/ assignment outline/);
    expect(coldStart.text).toMatch(/Cell Structure quiz/);
    expect(coldStart.text).toMatch(/Class meetings/);
    expect(coldStart.text).toMatch(/Organelles/);
  });

  it("does not seed when only a course name is available", () => {
    const coldStart = buildBlackboardColdStartText({
      courseName: "Empty BB",
      courseKey: "X",
      columns: [],
      meetings: [],
    });
    expect(coldStart.seeded).toBe(false);
  });

  it("preserves provider identity via stable Blackboard course URL", () => {
    const meta = blackboardSyllabusMaterialMeta({
      baseUrl: "https://learn.example.edu/",
      courseKey: "ANAT200",
      courseName: "Anatomy",
    });
    expect(meta.title).toContain("Blackboard");
    expect(meta.url).toBe("https://learn.example.edu/ultra/courses/ANAT200");
  });

  it("extracts topics for Study Haul from gradebook outline", () => {
    const coldStart = buildBlackboardColdStartText({
      courseName: "Anatomy",
      columns: [
        { id: "1", name: "Week 1: Cell Structure" },
        { id: "2", name: "Week 2: Mitosis" },
        { id: "3", name: "Week 3: Histology" },
      ],
    });
    const topics = chapterSubtopicsFromText(coldStart.text);
    expect(topics.length).toBeGreaterThanOrEqual(2);
    expect(studyHaulHref("course-anat", "Cell Structure")).toContain(
      "courseId=course-anat",
    );
  });

  it("wires syncBlackboardConnection to CourseMaterial upsert", () => {
    const sync = read("src/lib/lms/sync.ts");
    expect(sync).toContain("buildBlackboardColdStartText");
    expect(sync).toContain("blackboardSyllabusMaterialMeta");
    expect(sync).toMatch(/syncBlackboardConnection[\s\S]*upsertLmsSyllabusMaterial/);
  });
});

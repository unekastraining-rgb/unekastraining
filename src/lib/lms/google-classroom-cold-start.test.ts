/**
 * Google Classroom cold-start outline → CourseMaterial / Study Haul continuity.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  buildGoogleClassroomColdStartText,
  googleClassroomSyllabusMaterialMeta,
} from "@/lib/lms/google-classroom-cold-start";
import { chapterSubtopicsFromText } from "@/lib/syllabus/enrich-course-from-syllabus";
import { studyHaulHref } from "@/lib/study/loop-hrefs";

function read(rel: string) {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

describe("Google Classroom CourseMaterial cold start", () => {
  it("builds seeded outline from description + coursework + links", () => {
    const coldStart = buildGoogleClassroomColdStartText({
      courseName: "Biology 101",
      section: "BIO101",
      description: "Intro biology covering cells and genetics.",
      courseWork: [
        {
          id: "w1",
          title: "Cell Structure lab",
          description: "Label organelles",
          materials: [
            { link: { title: "Cell diagram", url: "https://example.com/cell" } },
          ],
        },
        {
          id: "w2",
          title: "Mitosis quiz",
        },
      ],
    });

    expect(coldStart.seeded).toBe(true);
    expect(coldStart.text).toMatch(/Course: Biology 101/);
    expect(coldStart.text).toMatch(/Coursework outline/);
    expect(coldStart.text).toMatch(/Cell Structure lab/);
    expect(coldStart.text).toMatch(/Linked materials/);
    expect(coldStart.text).toMatch(/https:\/\/example\.com\/cell/);
  });

  it("does not seed empty courses with no metadata", () => {
    const coldStart = buildGoogleClassroomColdStartText({
      courseName: "Empty",
      courseWork: [],
    });
    expect(coldStart.seeded).toBe(false);
  });

  it("preserves provider identity via stable Classroom URL", () => {
    const meta = googleClassroomSyllabusMaterialMeta({
      googleCourseId: "gc-xyz",
      courseName: "Biology 101",
      section: "BIO101",
    });
    expect(meta.title).toContain("Google Classroom");
    expect(meta.url).toBe("https://classroom.google.com/c/gc-xyz");
  });

  it("extracts topics for Study Haul from coursework outline", () => {
    const coldStart = buildGoogleClassroomColdStartText({
      courseName: "Biology 101",
      courseWork: [
        { id: "1", title: "Week 1: Cell Structure" },
        { id: "2", title: "Week 2: Mitosis" },
        { id: "3", title: "Week 3: Meiosis" },
      ],
    });
    const topics = chapterSubtopicsFromText(coldStart.text);
    expect(topics.length).toBeGreaterThanOrEqual(2);
    const haul = studyHaulHref("course-bio", topics[0]!.name);
    expect(haul).toContain("/study?");
    expect(haul).toContain("courseId=course-bio");
  });

  it("wires syncGoogleClassroomConnection to CourseMaterial upsert", () => {
    const sync = read("src/lib/lms/sync.ts");
    expect(sync).toContain("buildGoogleClassroomColdStartText");
    expect(sync).toContain("googleClassroomSyllabusMaterialMeta");
    expect(sync).toContain("upsertLmsSyllabusMaterial");
    expect(sync).toMatch(/syncGoogleClassroomConnection[\s\S]*upsertLmsSyllabusMaterial/);
  });
});

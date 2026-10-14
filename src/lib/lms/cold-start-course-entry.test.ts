import { describe, expect, it } from "vitest";

import { buildCanvasColdStartSyllabusText, formatCanvasModuleOutline } from "@/lib/lms/canvas-cold-start";
import { lmsColdStartCourseEntry } from "@/lib/lms/cold-start-course-entry";
import { coreStudyPackHref, luckyQuizHref } from "@/lib/study/loop-hrefs";

describe("lmsColdStartCourseEntry", () => {
  it("builds loop-ready focus topic from Canvas module cold-start text", () => {
    const outline = formatCanvasModuleOutline([
      { name: "Week 1: Intro" },
      { name: "Week 2: Binary Search Trees" },
      { name: "Week 3: Heaps and Priority Queues" },
    ]);
    const coldStart = buildCanvasColdStartSyllabusText({
      courseName: "CS 201 — Data Structures",
      syllabusHtml: null,
      modulesOutline: outline,
    });

    const entry = lmsColdStartCourseEntry(
      "canvas-cs201",
      "CS 201 — Data Structures",
      coldStart.text,
    );

    expect(entry.focusTopic).toBeTruthy();
    expect(coreStudyPackHref(entry.id, entry.focusTopic)).toContain("pack=1");
    expect(luckyQuizHref(entry.id, null, entry.focusTopic)).toContain("make=1");
  });
});

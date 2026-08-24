import { describe, expect, it } from "vitest";

import { buildCourseHighlights } from "./highlights";
import type { CourseInfoPortal } from "./types";

function makePortal(importantDates: CourseInfoPortal["sections"][0]["items"]): CourseInfoPortal {
  return {
    courseId: "test",
    moodleCourseId: 1,
    syncedAt: new Date().toISOString(),
    course: { name: "BUSN 1001", startDate: "2026-08-24", endDate: "2026-10-25" },
    sections: [
      {
        id: "quizzes",
        title: "Quizzes & Assessments",
        items: [
          {
            title: "Pre-Course Assessment (due Sunday of Module 1)",
            date: "2026-08-24",
            kind: "assignment",
            source: { type: "moodle_quiz", label: "Quizzes" },
          },
          {
            title: "Module 1 Quiz (AEA – due Wednesday of Module 1)",
            date: "2026-08-27",
            kind: "assignment",
            source: { type: "moodle_quiz", label: "Quizzes" },
          },
        ],
      },
      {
        id: "important-dates",
        title: "Important Dates",
        items: importantDates,
      },
      {
        id: "grading",
        title: "Grading",
        items: [
          {
            title: "Grading overview",
            body: "In the following subchapters, you will find details about each type of activity and assessment, as well as the grade breakdown.",
            kind: "text",
            source: { type: "moodle_book", label: "Grading" },
          },
        ],
      },
    ],
  };
}

describe("buildCourseHighlights", () => {
  it("excludes routine assignments and prose from important dates", () => {
    const portal = makePortal([
      {
        title: "Module 2 Zoom session (required)",
        date: "2026-09-07",
        kind: "date",
        source: { type: "moodle_book", label: "Important Dates" },
      },
      {
        title: "Podcast Presentation #1: Air BnB (due Sunday of Module 2)",
        date: "2026-09-07",
        kind: "date",
        source: { type: "moodle_assignment", label: "Moodle assignment" },
      },
      {
        title: "Podcast Summary #1: AirBnB (due Sunday of Module 2) is",
        date: "2026-09-07",
        kind: "date",
        source: { type: "moodle_calendar", label: "Moodle calendar" },
      },
      {
        title: "Last day to withdraw",
        date: "2026-09-20",
        kind: "date",
        source: { type: "moodle_book", label: "Important Dates" },
      },
    ]);

    const highlights = buildCourseHighlights(portal, [], null);

    expect(highlights.importantEvents.map((item) => item.title)).toEqual([
      "Module 2 Zoom session (required)",
      "Last day to withdraw",
    ]);
    expect(highlights.importantAssessments.map((item) => item.title)).toEqual([
      "Pre-Course Assessment (due Sunday of Module 1)",
      "Module 1 Quiz (AEA – due Wednesday of Module 1)",
    ]);
  });

  it("does not pull assessment prose from grading section bodies", () => {
    const portal = makePortal([]);
    const highlights = buildCourseHighlights(portal, [], null);

    expect(
      highlights.importantAssessments.some((item) =>
        /subchapter|you will find/i.test(item.title),
      ),
    ).toBe(false);
  });

  it("parses important dates from syllabus chapter body text", () => {
    const portal = makePortal([
      {
        title: "Important Dates",
        body: [
          "• Module 2 Zoom session (required) — September 7, 2026 at 6:00 PM",
          "• Last day to withdraw — September 20, 2026",
          "• Podcast Presentation #1: Air BnB (due Sunday of Module 2)",
        ].join("\n"),
        kind: "text",
        source: { type: "moodle_book", label: "Syllabus → Important Dates" },
      },
    ]);

    const highlights = buildCourseHighlights(portal, [], null);

    expect(highlights.importantEvents.map((item) => item.title)).toEqual([
      "Module 2 Zoom session (required) — September 7, 2026 at 6:00 PM",
      "Last day to withdraw — September 20, 2026",
    ]);
    expect(
      highlights.importantEvents.some((item) => /podcast/i.test(item.title)),
    ).toBe(false);
  });
});

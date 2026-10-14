import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildCourseHighlights, formatHeadlineDate } from "./highlights";
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
  beforeEach(() => {
    // Past-date filter is relative to "today". Pin mid-September 2026 so
    // Aug events are past, Sep 20–21 withdraw/drop dates remain upcoming.
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });
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
      "Last day to withdraw",
    ]);
    expect(highlights.importantAssessments.map((item) => item.title)).toEqual([
      "Pre-Course Assessment (due Sunday of Module 1)",
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
      "Last day to withdraw",
    ]);
    expect(
      highlights.importantEvents.some((item) => /podcast|zoom/i.test(item.title)),
    ).toBe(false);
  });

  it("keeps Final Project and Final Exam with dates, not module or policy blurbs", () => {
    const portal = makePortal([
      {
        title:
          "Important: You are responsible for being aware of and meeting all deadlines, especially those related to attendance validation (AEA), add/drop, and final assess",
        kind: "date",
        source: { type: "moodle_page", label: "Module" },
      },
      {
        title:
          "Important: You are responsible for being aware of and meeting all deadlines, especially those related to attendance validation (AEA), add/drop, and final assessments. Failure to complete the Academic",
        kind: "date",
        source: { type: "moodle_page", label: "Module" },
      },
      {
        title: "In this module, you will submit your final project for this",
        kind: "date",
        source: { type: "moodle_page", label: "Module" },
      },
      {
        title: "In this module, you will take your final exam for this",
        kind: "date",
        source: { type: "moodle_page", label: "Module" },
      },
      {
        title: "Important Dates",
        body: [
          "Important: You are responsible for being aware of and meeting all deadlines, especially those related to attendance validation (AEA), add/drop, and final assessments.",
          "In this module, you will submit your final project for this course.",
          "In this module, you will take your final exam for this course.",
          "Final Exam Timeline: Friday, October 9, 12.00 AM - Monday, October 12, 11.59 PM.",
          "Final Project Due Date: Tuesday, October 20",
        ].join("\n"),
        kind: "text",
        source: { type: "moodle_book", label: "Syllabus → Important Dates" },
      },
    ]);

    const highlights = buildCourseHighlights(portal, [], null);
    const eventTitles = highlights.importantEvents.map((item) => item.title);
    const assessmentTitles = highlights.importantAssessments.map((item) => item.title);

    expect(eventTitles.some((title) => /you are responsible/i.test(title))).toBe(false);
    expect(eventTitles.some((title) => /in this module/i.test(title))).toBe(false);
    expect(eventTitles).not.toContain("Final Exam");
    expect(eventTitles).not.toContain("Final Project");
    expect(assessmentTitles).toContain("Final Exam");
    expect(assessmentTitles).toContain("Final Project");

    const finalExam = highlights.importantAssessments.find((item) => item.title === "Final Exam");
    const finalProject = highlights.importantAssessments.find((item) => item.title === "Final Project");
    expect(finalExam?.date).toBe("2026-10-09");
    expect(finalExam?.when).toMatch(/October 9/i);
    expect(finalProject?.date).toBe("2026-10-20");
  });

  it("reads Moodle Key Semester Dates and Key Course Dates instead of Zoom/office-hours junk", () => {
    const body = [
      "Key Semester Dates:",
      "Classes Start: Monday, August 24, 2026",
      "AEA Due: Wednesday, August 26, 2026, by 11:59 p.m.",
      "Last Date to Drop with a “W”: Monday, September 21, 2026",
      "Holiday: Monday, September 7, 2026 — Labor Day",
      "Last Day of Term: Sunday, October 11, 2026",
      "Final Grades Due: Wednesday, October 14, 2026, by noon",
      "Key Course Dates:",
      "Weekly Check-Ins: Wednesday 11.00 AM - 12.00 PM",
      "Module Discussion forum submission Timeline: Each Friday (except AEA on Wednesday)",
      "Module Assignment and Quiz submission Timeline: Each Sunday",
      "Test 1 Timeline: Friday, September 4, 12.00 AM - September 7, 11.59 PM.",
      "Test 2 Timeline: Friday, September 25, 12.00 AM - September 28, 11.59 PM.",
      "Final Exam Timeline: Friday, October 9, 12.00 AM - Monday, October 12, 11.59 PM.",
      "Final Project Due Date: Tuesday, October 20",
    ].join("\n");

    const portal = makePortal([
      {
        title: "Important Dates",
        body,
        kind: "text",
        source: { type: "moodle_book", label: "Syllabus → Important Dates" },
      },
      {
        title: "Click here to join the zoom meeting",
        kind: "date",
        source: { type: "moodle_calendar", label: "Moodle calendar" },
      },
      {
        title: "I will be available for virtual office hours each week at the times below:",
        kind: "date",
        source: { type: "moodle_page", label: "Instructor" },
      },
    ]);

    const highlights = buildCourseHighlights(portal, [], null);
    const eventText = highlights.importantEvents.map((item) => item.title).join("\n");
    const assessmentText = highlights.importantAssessments.map((item) => item.title).join("\n");

    // Past calendar dates are omitted (Classes Start / AEA / Labor Day are before "today").
    expect(eventText).not.toMatch(/Classes Start/i);
    expect(eventText).not.toMatch(/AEA Due/i);
    expect(eventText).toMatch(/Last Date to Drop/i);
    expect(eventText).not.toMatch(/Labor Day/i);
    expect(eventText).toMatch(/Last Day of Term/i);
    expect(eventText).toMatch(/Final Grades Due/i);
    expect(eventText).not.toMatch(/Weekly Check-Ins/i);
    expect(eventText).not.toMatch(/Test 1/i);
    expect(eventText).not.toMatch(/Final Exam/i);
    expect(eventText).not.toMatch(/Final Project/i);

    expect(assessmentText).toMatch(/Weekly Check-Ins/i);
    expect(assessmentText).toMatch(/Discussion forum/i);
    expect(assessmentText).toMatch(/Assignment and Quiz/i);
    expect(assessmentText).toMatch(/Test 1/i);
    expect(assessmentText).toMatch(/Test 2/i);
    expect(assessmentText).toMatch(/Final Exam/i);
    expect(assessmentText).toMatch(/Final Project/i);

    const eventKeys = new Set(highlights.importantEvents.map((item) => item.title.toLowerCase()));
    for (const item of highlights.importantAssessments) {
      expect(eventKeys.has(item.title.toLowerCase())).toBe(false);
    }

    expect(eventText).not.toMatch(/Click here to join/i);
    expect(eventText).not.toMatch(/I will be available for virtual office hours/i);

    const checkIns = highlights.importantAssessments.find((item) => /check-ins/i.test(item.title));
    expect(checkIns?.when).toMatch(/Wednesday/i);
    expect(checkIns?.when).toMatch(/11:00 AM/i);

    const quizCadence = highlights.importantAssessments.find((item) => /assignment and quiz/i.test(item.title));
    expect(quizCadence?.when).toMatch(/Each Sunday/i);

    // Labor Day (2026-09-07) is past relative to the suite "today" and must stay hidden.
    expect(highlights.importantEvents.find((item) => /labor day/i.test(item.title))).toBeUndefined();
  });

  it("formats date-only ISO strings on the calendar day, not the previous evening", () => {
    expect(formatHeadlineDate("2026-09-07")).toMatch(/Sep 7/);
  });
});

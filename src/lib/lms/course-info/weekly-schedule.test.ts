import { describe, expect, it } from "vitest";

import {
  buildWeeklyHaulFromPortal,
  parseWeeklyScheduleFromText,
  pickCurrentWeekHaul,
} from "./weekly-schedule";
import type { CourseInfoPortal } from "./types";

const SAMPLE = `
Course Schedule

Monday 24-30
Objectives to complete:
Listen to the Module 1 Welcome Recording.
Read Chapter 1 of the textbook.
Review the items in the Module 1 Resources book.
Complete Module 1 Quiz (AEA)
Participate in the Module 1 Discussion Forum.
Complete the Pre-Course Assessment.

Module 2: February 7-13
Objectives to complete:
Attend Module 2 Zoom session (required).
Complete Module 2 Quiz.
`;

const WELCOME_JUNK = `
Welcome to Introduction to Business
In this course you will learn about business fundamentals.
Module 1 covers an overview of the syllabus.
This course uses Moodle for all assignments.
`;

describe("weekly-schedule", () => {
  it("parses week blocks and objectives from syllabus text", () => {
    const blocks = parseWeeklyScheduleFromText(SAMPLE, { termStart: "2026-01-20" });
    expect(blocks.length).toBeGreaterThanOrEqual(2);
    expect(blocks[0]?.objectives).toContain("Listen to the Module 1 Welcome Recording.");
    expect(blocks[0]?.objectives).toContain("Complete Module 1 Quiz (AEA)");
    expect(blocks.some((b) => b.moduleNumber === 2)).toBe(true);
  });

  it("picks the week containing today when dates align", () => {
    const blocks = parseWeeklyScheduleFromText(SAMPLE, { termStart: "2026-01-20" });
    const picked = pickCurrentWeekHaul(blocks, {
      today: new Date("2026-02-10"),
      termStart: "2026-01-20",
    });
    expect(picked?.moduleNumber).toBe(2);
  });

  it("ignores welcome/overview prose without week headers", () => {
    const blocks = parseWeeklyScheduleFromText(WELCOME_JUNK, { termStart: "2026-01-20" });
    expect(blocks).toHaveLength(0);
    const portal: CourseInfoPortal = {
      courseId: "test",
      moodleCourseId: 1,
      syncedAt: new Date().toISOString(),
      course: { name: "BUSN", startDate: "2026-01-20" },
      sections: [
        {
          id: "overview",
          title: "Overview",
          items: [
            {
              title: "Welcome",
              body: WELCOME_JUNK,
              kind: "text",
              source: { type: "moodle_section", label: "Section 1" },
            },
          ],
        },
      ],
    };
    expect(buildWeeklyHaulFromPortal(portal)).toBeNull();
  });
});

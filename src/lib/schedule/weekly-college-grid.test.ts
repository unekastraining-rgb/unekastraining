import { describe, expect, it } from "vitest";

import {
  buildWeeklyCollegeGrid,
  inferCoursePace,
  parsePortalDates,
  readableCourseName,
} from "@/lib/schedule/weekly-college-grid";

describe("weekly college grid", () => {
  it("infers accelerated vs full semester from Moodle dates", () => {
    expect(inferCoursePace("2026-08-24", "2026-10-16")).toBe("accelerated");
    expect(inferCoursePace("2026-08-24", "2026-12-12")).toBe("full");
  });

  it("reads start/end from courseInfoJson", () => {
    expect(
      parsePortalDates(
        JSON.stringify({
          course: { startDate: "2026-08-24", endDate: "2026-12-12" },
        }),
      ),
    ).toEqual({ startDate: "2026-08-24", endDate: "2026-12-12" });
  });

  it("keeps only Monday–Thursday and never emits Friday–Sunday", () => {
    const grid = buildWeeklyCollegeGrid({
      courses: [
        {
          id: "csci",
          title: "Intro to Computer Programming",
          code: "CSCI 1250",
          color: "#f9a8d4",
          startDate: "2026-08-24",
          endDate: "2026-12-12",
        },
      ],
      meetings: [
        {
          courseId: "csci",
          dayOfWeek: 1,
          startTime: "09:00",
          endTime: "10:30",
          title: "CSCI lecture",
        },
        {
          courseId: "csci",
          dayOfWeek: 5,
          startTime: "09:00",
          endTime: "10:30",
          title: "Should not appear",
        },
      ],
    });

    expect(grid.days).toEqual(["Monday", "Tuesday", "Wednesday", "Thursday"]);
    expect(grid.blocks.every((block) => block.dayOfWeek >= 1 && block.dayOfWeek <= 4)).toBe(
      true,
    );
    expect(grid.blocks.some((block) => block.label === "Should not appear")).toBe(false);
    expect(grid.blocks.some((block) => block.label === "Intro to Computer Programming")).toBe(
      true,
    );
  });

  it("uses simple names instead of catalog codes and section numbers", () => {
    expect(
      readableCourseName({ code: "CSCI 2340", title: "CSCI 2340 Object Oriented Design" }),
    ).toBe("Object Oriented Design");
    expect(readableCourseName({ code: "BUSN 1001", title: "BUSN 1001" })).toBe(
      "Intro to Business",
    );
    // Prefer the human title extracted from LMS fullname over short nicknames.
    expect(
      readableCourseName({
        code: "CSCI 1250",
        title: "CSCI 1250 0711 Intro to Computer Programming",
      }),
    ).toBe("Intro to Computer Programming");

    const grid = buildWeeklyCollegeGrid({
      courses: [
        {
          id: "csci",
          title: "CSCI 1250 0711",
          code: "CSCI 1250",
          color: "#f9a8d4",
        },
      ],
      meetings: [
        {
          courseId: "csci",
          dayOfWeek: 1,
          startTime: "09:00",
          endTime: "10:30",
          title: "CSCI 1250 0711",
        },
      ],
    });
    // Code-only title falls back to nickname when no human title is present.
    expect(grid.blocks[0]?.label).toBe("Computer Programming");
    expect(grid.paceNotes[0]?.title).toBe("Computer Programming");
  });

  it("targets about 19 hours a week and can place study after 1pm", () => {
    const grid = buildWeeklyCollegeGrid({
      courses: [
        {
          id: "ood",
          title: "Object-Oriented Design",
          code: "CSCI 2340",
          color: "#93c5fd",
          startDate: "2026-08-24",
          endDate: "2026-10-16",
        },
        {
          id: "csci",
          title: "Intro to Computer Programming",
          code: "CSCI 1250",
          color: "#f9a8d4",
          startDate: "2026-08-24",
          endDate: "2026-12-12",
        },
        {
          id: "busn",
          title: "Intro to Business",
          code: "BUSN 1001",
          color: "#fcd34d",
          startDate: "2026-08-24",
          endDate: "2026-10-16",
        },
      ],
      meetings: [
        {
          courseId: "ood",
          dayOfWeek: 1,
          startTime: "09:00",
          endTime: "10:00",
          title: "CSCI 2340",
        },
      ],
    });

    expect(grid.targetWeeklyMinutes).toBe(19 * 60);
    expect(grid.scheduledWeeklyMinutes).toBeGreaterThanOrEqual(18 * 60);
    expect(grid.scheduledWeeklyMinutes).toBeLessThanOrEqual(20 * 60);
    expect(grid.blocks.some((block) => block.endMinutes > 13 * 60)).toBe(true);
    const monday = grid.blocks.filter((block) => block.dayOfWeek === 1);
    expect(monday.some((block) => block.kind === "class")).toBe(true);
    // readableCourseName keeps the LMS hyphenated title when present.
    expect(monday.some((block) => block.label === "Object-Oriented Design")).toBe(true);
  });
});

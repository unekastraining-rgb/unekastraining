import { describe, expect, it } from "vitest";

import {
  calendarEventsToWeeklyMeetings,
  isWeeklyClassEventTitle,
} from "./meetings";

describe("isWeeklyClassEventTitle", () => {
  it("treats lecture/lab style titles as weekly class meetings", () => {
    expect(isWeeklyClassEventTitle("Lecture")).toBe(true);
    expect(isWeeklyClassEventTitle("CSCI 1250 Lab")).toBe(true);
    expect(isWeeklyClassEventTitle("Discussion Section")).toBe(true);
  });

  it("does not treat discussion forum dues as weekly meetings", () => {
    expect(
      isWeeklyClassEventTitle("Module 1 Discussion Forum (AEA) is due"),
    ).toBe(false);
    expect(isWeeklyClassEventTitle("Module 1 Discussion Forum opens")).toBe(
      false,
    );
    expect(isWeeklyClassEventTitle("Module 1 Quiz (AEA) is due")).toBe(false);
  });
});

describe("calendarEventsToWeeklyMeetings", () => {
  it("does not expand forum due events onto every Monday", () => {
    // Aug 24, 2026 is a Monday — a buggy import would also paint Aug 3.
    const meetings = calendarEventsToWeeklyMeetings([
      {
        title: "Module 1 Discussion Forum (AEA) is due",
        start_at: "2026-08-24T23:59:00.000Z",
        end_at: "2026-08-26T23:59:00.000Z",
      },
      {
        title: "Weekly Lecture",
        start_at: "2026-08-24T18:00:00.000Z",
        end_at: "2026-08-24T19:15:00.000Z",
      },
    ]);

    expect(meetings.some((m) => /forum/i.test(m.title ?? ""))).toBe(false);
    expect(meetings.some((m) => /lecture/i.test(m.title ?? ""))).toBe(true);
  });
});

import { describe, expect, it } from "vitest";

import { moodleCalendarEventsToAssignments } from "./moodle-api";

describe("moodleCalendarEventsToAssignments", () => {
  it("imports forum due events as one-time assignments", () => {
    const open = Math.floor(new Date("2026-08-24T00:00:00Z").getTime() / 1000);
    const due = Math.floor(new Date("2026-08-26T23:59:00Z").getTime() / 1000);

    const assignments = moodleCalendarEventsToAssignments([
      {
        id: 1,
        name: "Module 1 Discussion Forum (AEA) opens",
        timestart: open,
        modulename: "forum",
        instance: 99,
        eventtype: "open",
      },
      {
        id: 2,
        name: "Module 1 Discussion Forum (AEA) is due",
        timestart: due,
        modulename: "forum",
        instance: 99,
        eventtype: "due",
      },
    ]);

    expect(assignments).toHaveLength(1);
    expect(assignments[0]?.name).toBe("Module 1 Discussion Forum (AEA)");
    expect(assignments[0]?.duedate).toBe(due);
    expect(assignments[0]?.kind).toBe("assignment");
  });
});

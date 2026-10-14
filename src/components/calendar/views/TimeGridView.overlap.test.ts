import { describe, expect, it } from "vitest";

import { assignHourStacks } from "@/components/calendar/views/TimeGridView";

describe("assignHourStacks", () => {
  it("stacks same-hour items vertically with expanding count", () => {
    const layout = assignHourStacks([
      { id: "a", start: 7 * 60, end: 7 * 60 + 45, allDay: true },
      { id: "b", start: 7 * 60, end: 7 * 60 + 45, allDay: true },
      { id: "c", start: 7 * 60, end: 7 * 60 + 45, allDay: true },
    ]);
    expect(layout.get("a")).toEqual({
      stackIndex: 0,
      stackCount: 3,
      startHour: 7,
    });
    expect(layout.get("b")).toEqual({
      stackIndex: 1,
      stackCount: 3,
      startHour: 7,
    });
    expect(layout.get("c")).toEqual({
      stackIndex: 2,
      stackCount: 3,
      startHour: 7,
    });
  });

  it("keeps different hours independent", () => {
    const layout = assignHourStacks([
      { id: "a", start: 7 * 60, end: 8 * 60, allDay: false },
      { id: "b", start: 9 * 60, end: 10 * 60, allDay: false },
    ]);
    expect(layout.get("a")?.stackCount).toBe(1);
    expect(layout.get("b")?.stackCount).toBe(1);
    expect(layout.get("b")?.startHour).toBe(9);
  });
});

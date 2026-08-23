import { describe, expect, it } from "vitest";

import {
  hubAssignmentFocusHref,
  hubAssignmentsHref,
  hubChatHref,
  hubScheduleHref,
  hubTabPath,
  isHubTab,
  parseHubDateParam,
  parseHubTab,
} from "./tabs";

describe("hub tabs", () => {
  it("parses valid hub tabs", () => {
    expect(parseHubTab("locker")).toBe("locker");
    expect(parseHubTab("invalid")).toBe("hub");
    expect(parseHubTab("schedule")).toBe("hub");
    expect(isHubTab("chat")).toBe(true);
    expect(isHubTab("planner")).toBe(false);
    expect(isHubTab("schedule")).toBe(true);
  });

  it("builds schedule hrefs with focus and date", () => {
    expect(hubScheduleHref()).toBe("/dashboard");
    expect(hubScheduleHref({ focus: "a1" })).toBe(
      "/dashboard?view=assignments&focus=a1",
    );
    expect(hubScheduleHref({ date: "2026-08-18", tab: "locker" })).toBe(
      "/calendar?date=2026-08-18",
    );
    expect(hubAssignmentFocusHref("assign-42")).toBe(
      "/dashboard?view=assignments&focus=assign-42",
    );
    expect(hubAssignmentsHref()).toBe("/dashboard?view=assignments");
  });

  it("builds chat hrefs with course scope", () => {
    expect(hubChatHref()).toBe("/dashboard?tab=chat");
    expect(hubChatHref({ courseId: "c1", prompt: "help" })).toBe(
      "/dashboard?tab=chat&courseId=c1&prompt=help",
    );
  });

  it("parses hub date params", () => {
    expect(parseHubDateParam("2026-08-18")?.toISOString().slice(0, 10)).toBe(
      "2026-08-18",
    );
    expect(parseHubDateParam("bad")).toBeNull();
  });

  it("maps tab paths", () => {
    expect(hubTabPath("hub")).toBe("/dashboard");
    expect(hubTabPath("settings")).toBe("/dashboard?tab=settings");
  });
});

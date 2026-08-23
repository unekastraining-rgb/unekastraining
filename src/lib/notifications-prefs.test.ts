import { describe, expect, it } from "vitest";

import {
  countUnreadNotifications,
  filterNotifications,
  parseNotificationPrefs,
} from "./notifications-prefs";

describe("notification prefs", () => {
  it("parses stored preference blobs", () => {
    expect(
      parseNotificationPrefs({
        dismissedNotificationIds: ["a", 1],
        readNotificationIds: ["b"],
      }),
    ).toEqual({
      dismissedIds: ["a"],
      readIds: ["b"],
    });
  });

  it("filters dismissed notifications", () => {
    const items = [{ id: "1" }, { id: "2" }, { id: "3" }];
    expect(
      filterNotifications(items, { dismissedIds: ["2"], readIds: [] }),
    ).toEqual([{ id: "1" }, { id: "3" }]);
  });

  it("counts unread non-low notifications", () => {
    const items = [
      { id: "1", severity: "high" },
      { id: "2", severity: "low" },
      { id: "3", severity: "medium" },
    ];
    expect(
      countUnreadNotifications(items, { dismissedIds: [], readIds: ["3"] }),
    ).toBe(1);
  });
});

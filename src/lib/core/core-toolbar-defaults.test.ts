import { describe, expect, it } from "vitest";

import {
  DEFAULT_TOOLBAR_VISIBLE,
  normalizeToolbarVisibleItems,
} from "@/lib/core/core-toolbar-defaults";

describe("normalizeToolbarVisibleItems", () => {
  it("returns full default toolbar when empty", () => {
    expect(normalizeToolbarVisibleItems(null)).toEqual(DEFAULT_TOOLBAR_VISIBLE);
    expect(normalizeToolbarVisibleItems([])).toEqual(DEFAULT_TOOLBAR_VISIBLE);
  });

  it("upgrades legacy pen-only chrome to the full toolkit", () => {
    const legacy = ["pen", "eraser", "lasso", "select", "text", "templates"] as const;
    expect(normalizeToolbarVisibleItems([...legacy])).toEqual(DEFAULT_TOOLBAR_VISIBLE);
  });

  it("adds starters and customize when missing from a custom layout", () => {
    const custom = ["pen", "stickers", "images"] as const;
    expect(normalizeToolbarVisibleItems([...custom])).toEqual([
      ...custom,
      "starters",
      "customize",
    ]);
  });

  it("preserves a fully customized layout that already includes customize", () => {
    const custom = ["pen", "stickers", "customize"] as const;
    expect(normalizeToolbarVisibleItems([...custom])).toEqual([...custom, "starters"]);
  });
});

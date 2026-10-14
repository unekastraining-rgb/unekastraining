import { describe, expect, it } from "vitest";

import { computePageWorldSize, PAGE_WORLD_BASE_HEIGHT, PAGE_WORLD_BASE_WIDTH } from "./page-world";

describe("computePageWorldSize", () => {
  it("starts from a letter-ish sheet so paper feels like a notebook page", () => {
    const size = computePageWorldSize({});
    expect(size.width).toBe(PAGE_WORLD_BASE_WIDTH);
    expect(size.height).toBe(PAGE_WORLD_BASE_HEIGHT);
  });

  it("grows when content sits near the edge", () => {
    const size = computePageWorldSize({
      textBoxes: [
        {
          id: "tb1",
          x: 1800,
          y: 3000,
          width: 280,
          height: 140,
          text: "hello",
        },
      ],
    });
    expect(size.width).toBeGreaterThan(PAGE_WORLD_BASE_WIDTH);
    expect(size.height).toBeGreaterThan(PAGE_WORLD_BASE_HEIGHT);
  });
});

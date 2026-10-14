import { describe, expect, it } from "vitest";

import { normalizePressure, strokeWidth, shouldRejectPointer, applyPressureSensitivity, velocityWidthFactor, segmentWidth } from "@/lib/core/ink-engine";

describe("ink-engine feel", () => {
  it("softens pen pressure extremes", () => {
    expect(normalizePressure(0, "pen")).toBeGreaterThan(0.1);
    expect(normalizePressure(1, "pen")).toBeLessThanOrEqual(1);
    expect(normalizePressure(0.5, "touch")).toBe(0.5);
  });

  it("keeps stroke width usable at light pressure", () => {
    expect(strokeWidth(4, 0.2, "pen")).toBeGreaterThan(1);
    expect(strokeWidth(4, 1, "highlighter")).toBeGreaterThan(strokeWidth(4, 1, "pen"));
  });

  it("rejects touch only when pencil-only is on", () => {
    expect(shouldRejectPointer({ pointerType: "touch" }, true)).toBe(true);
    expect(shouldRejectPointer({ pointerType: "touch" }, false)).toBe(false);
    expect(shouldRejectPointer({ pointerType: "pen" }, true)).toBe(false);
    expect(shouldRejectPointer({ pointerType: "mouse" }, true)).toBe(false);
  });

  it("pressure sensitivity widens dynamic range", () => {
    const low = applyPressureSensitivity(0.2, 10);
    const high = applyPressureSensitivity(0.2, 100);
    expect(Math.abs(high - 0.55)).toBeGreaterThan(Math.abs(low - 0.55));

    const wideSoft = strokeWidth(4, 0.15, "pen", { pressureSensitivity: 100, tipFlatness: 0 });
    const flatSoft = strokeWidth(4, 0.15, "pen", { pressureSensitivity: 10, tipFlatness: 90 });
    expect(wideSoft).not.toBe(flatSoft);
  });

  it("accepts dashed stroke feel without throwing", () => {
    expect(
      strokeWidth(4, 0.5, "pen", {
        pressureSensitivity: 70,
        strokeType: "dashed",
      }),
    ).toBeGreaterThan(1);
  });

  it("tapers width on fast strokes when timestamps exist", () => {
    expect(velocityWidthFactor(0, 0, 16)).toBe(1);
    expect(velocityWidthFactor(40, 0, 8)).toBeLessThan(velocityWidthFactor(2, 0, 16));

    const slow = segmentWidth(
      4,
      0.6,
      "pen",
      undefined,
      { x: 0, y: 0, t: 0 },
      { x: 2, y: 0, t: 16, pressure: 0.6 },
    );
    const fast = segmentWidth(
      4,
      0.6,
      "pen",
      undefined,
      { x: 0, y: 0, t: 0 },
      { x: 40, y: 0, t: 8, pressure: 0.6 },
    );
    expect(fast).toBeLessThan(slow);
  });
});

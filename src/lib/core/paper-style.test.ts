import { describe, expect, it } from "vitest";

import {
  resolvePaperSurfaceStyle,
  usesDynamicPaperStyle,
} from "@/lib/core/paper-style";

describe("paper-style", () => {
  it("adds paper grain to ruled templates", () => {
    const style = resolvePaperSurfaceStyle({ templateId: "ruled" });
    expect(style.backgroundColor).toBeTruthy();
    expect(String(style.backgroundImage)).toContain("radial-gradient");
  });

  it("uses dynamic inline styles for ruled and grid templates", () => {
    expect(usesDynamicPaperStyle("ruled")).toBe(true);
    expect(usesDynamicPaperStyle("graph_grid")).toBe(true);
    expect(usesDynamicPaperStyle("blank")).toBe(false);
  });

  it("respects custom paper and line colors", () => {
    const style = resolvePaperSurfaceStyle({
      templateId: "dot_grid",
      paperColor: "#fef3c7",
      lineColor: "#d6d3d1",
      spacingPx: 24,
    });
    expect(style.backgroundColor).toBe("#fef3c7");
    expect(String(style.backgroundImage)).toContain("#d6d3d1");
  });
});

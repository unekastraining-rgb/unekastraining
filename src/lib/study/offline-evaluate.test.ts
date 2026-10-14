import { describe, expect, it } from "vitest";

import {
  evaluateOfflineAgainstOutline,
  extractOutlineChecklist,
} from "@/lib/study/offline-evaluate";

describe("extractOutlineChecklist", () => {
  it("pulls topic lines and prefers the focus hint", () => {
    const lines = extractOutlineChecklist(
      "Topic outline:\n- Osmosis\n- Diffusion\n- Active transport\n",
      "Osmosis",
    );
    expect(lines[0]).toMatch(/Osmosis/i);
    expect(lines.some((line) => /Diffusion/i.test(line))).toBe(true);
  });
});

describe("evaluateOfflineAgainstOutline", () => {
  it("scores higher when the blurt covers outline tokens", () => {
    const source =
      "Primary focus: Osmosis\n- Osmosis moves water\n- Diffusion of solutes\n- Active transport uses ATP";
    const weak = evaluateOfflineAgainstOutline({
      userResponse: "I forgot everything about biology today.",
      sourceText: source,
      topic: "Osmosis",
      mode: "blurting",
    });
    const strong = evaluateOfflineAgainstOutline({
      userResponse:
        "Osmosis moves water across membranes. Diffusion spreads solutes. Active transport needs ATP.",
      sourceText: source,
      topic: "Osmosis",
      mode: "blurting",
    });
    expect(strong.score).toBeGreaterThan(weak.score);
    expect(strong.gaps.length).toBeLessThanOrEqual(weak.gaps.length);
  });
});

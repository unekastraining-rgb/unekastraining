import { describe, expect, it } from "vitest";

import { parseInkPageJson, serializeInkPage } from "@/lib/materials/ink-storage";

describe("ink-storage", () => {
  it("parses legacy stroke arrays", () => {
    const strokes = [{ color: "#000", width: 2, points: [{ x: 1, y: 2 }] }];
    expect(parseInkPageJson(JSON.stringify(strokes))).toEqual({ strokes });
  });

  it("round-trips viewport metadata", () => {
    const payload = {
      strokes: [{ color: "#000", width: 2, points: [{ x: 10, y: 20 }] }],
      viewport: { width: 800, height: 560 },
    };
    const raw = serializeInkPage(payload);
    expect(parseInkPageJson(raw)).toEqual(payload);
  });
});

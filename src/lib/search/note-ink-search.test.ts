import { describe, expect, it } from "vitest";

import {
  extractInkOcrFromNoteJson,
  noteMatchesSearchQuery,
} from "@/lib/search/note-ink-search";

describe("note ink search", () => {
  it("reads lastInkOcr from note contentJson metadata", () => {
    const json = JSON.stringify({
      typed: "",
      metadata: {
        lastInkOcr: { text: "mitochondria powerhouse", updatedAt: "2026-01-01T00:00:00Z" },
      },
    });
    expect(extractInkOcrFromNoteJson(json)).toBe("mitochondria powerhouse");
  });

  it("matches Hub queries against persisted handwriting OCR", () => {
    const json = JSON.stringify({
      metadata: { lastInkOcr: { text: "selectively permeable membrane" } },
    });
    const result = noteMatchesSearchQuery(
      { title: "Bio 101", content: "", contentJson: json },
      "permeable",
    );
    expect(result.matches).toBe(true);
    expect(result.fromHandwriting).toBe(true);
  });

  it("does not label title hits as handwriting", () => {
    const json = JSON.stringify({
      metadata: { lastInkOcr: { text: "osmosis diffusion" } },
    });
    const result = noteMatchesSearchQuery(
      { title: "Osmosis notes", content: "", contentJson: json },
      "osmosis",
    );
    expect(result.matches).toBe(true);
    expect(result.fromHandwriting).toBe(false);
  });
});

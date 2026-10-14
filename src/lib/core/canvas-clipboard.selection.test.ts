import { describe, expect, it } from "vitest";

import {
  selectionSourceText,
  selectionStudyTopic,
} from "@/lib/core/canvas-clipboard";

describe("selectionStudyTopic", () => {
  it("prefers selection text over course fallback", () => {
    expect(selectionStudyTopic("Define osmosis carefully.", "Mitosis")).toContain(
      "Define osmosis",
    );
  });
});

describe("selectionSourceText", () => {
  it("joins selected text boxes for Selection → Lucky", () => {
    const text = selectionSourceText(["a", "b"], {
      pageTextBoxes: [
        { id: "a", x: 0, y: 0, width: 100, height: 40, text: "Define osmosis." },
        { id: "b", x: 0, y: 50, width: 100, height: 40, text: "Water moves across a membrane." },
      ],
    });
    expect(text).toContain("Define osmosis.");
    expect(text).toContain("Water moves across a membrane.");
  });

  it("falls back to page typed notes for stroke-only selections", () => {
    const text = selectionSourceText(["stroke-1"], {
      typed: "Chapter notes about mitosis phases.",
      pageTextBoxes: [],
    });
    expect(text).toBe("Chapter notes about mitosis phases.");
  });

  it("uses chapter pack when ink selection has no typed page text", () => {
    const text = selectionSourceText(["stroke-1"], {
      typed: "",
      pageTextBoxes: [],
      metadata: {
        chapterStudyExtract: {
          chapterOverview: "Mitosis divides somatic cells.",
          mustKnow: ["Prophase packs chromosomes."],
          definitions: [{ term: "Cytokinesis", definition: "Cytoplasm divides." }],
        },
      },
    });
    expect(text).toContain("Mitosis divides somatic cells.");
    expect(text).toContain("Prophase packs chromosomes.");
    expect(text).toContain("Cytokinesis");
  });

  it("merges pack for ink even when typed notes exist but are thin", () => {
    const text = selectionSourceText(
      ["stroke-1"],
      {
        typed: "notes",
        pageTextBoxes: [],
        metadata: {
          chapterStudyExtract: {
            mustKnow: ["Osmosis moves water."],
          },
        },
      },
      { includePackForInk: true },
    );
    expect(text).toContain("Osmosis moves water.");
  });
});

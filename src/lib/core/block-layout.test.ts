import { describe, expect, it } from "vitest";

import {
  originYForTypedNotes,
  packStudyBlocks,
  rectsOverlap,
  sizeForFormatBlock,
} from "@/lib/core/block-layout";
import type { CompositeSection } from "@/lib/core/note-types";

function asRect(section: CompositeSection) {
  return {
    x: section.x ?? 0,
    y: section.y ?? 0,
    width: section.width ?? 0,
    height: section.height ?? 0,
  };
}

describe("packStudyBlocks", () => {
  it("sizes concept and outline blocks tall enough for their rows", () => {
    expect(sizeForFormatBlock("FLOW").height).toBeGreaterThan(300);
    expect(
      sizeForFormatBlock("CONCEPT_DEFINITION", { concepts: { items: [{}, {}, {}, {}, {}, {}] } }).height,
    ).toBeGreaterThan(500);
    expect(
      sizeForFormatBlock("OUTLINE", { outlineNodes: Array.from({ length: 12 }, () => ({})) }).height,
    ).toBeGreaterThan(400);
  });

  it("does not overlap packed study blocks", () => {
    const packed = packStudyBlocks(
      [
        { id: "a", formatId: "OUTLINE", title: "Outline", data: { outlineNodes: [{}, {}, {}, {}] } },
        { id: "b", formatId: "CONCEPT_DEFINITION", title: "Terms", data: { concepts: { items: [{}, {}] } } },
        { id: "c", formatId: "FLOW", title: "Flow", data: { flow: { nodes: [{}, {}, {}, {}] } } },
        { id: "d", formatId: "CHARTING", title: "Chart", data: { charting: { columns: ["A", "B"], rows: [[], []] } } },
      ],
      { originY: 320 },
    );

    expect(packed[0]?.y).toBe(320);
    for (let i = 0; i < packed.length; i++) {
      for (let j = i + 1; j < packed.length; j++) {
        expect(rectsOverlap(asRect(packed[i]!), asRect(packed[j]!))).toBe(false);
      }
    }
  });

  it("starts below typed overview notes", () => {
    expect(originYForTypedNotes("# Title\n\nOverview line\n- LO 1")).toBeGreaterThan(200);
  });
});

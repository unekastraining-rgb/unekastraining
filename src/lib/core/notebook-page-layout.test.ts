import { describe, expect, it } from "vitest";

import { emptyDocument } from "@/lib/core/note-types";
import {
  addNotebookPage,
  addNotebookPageInDirection,
  getNotebookPages,
} from "@/lib/core/notebook-pages";
import {
  findPageAtCell,
  nextCellInDirection,
  pageDeskMetrics,
  withPageGridLayout,
} from "@/lib/core/notebook-page-layout";

describe("notebook page layout (FreeNotes-style desk)", () => {
  it("stacks legacy pages vertically when grid is missing", () => {
    const laidOut = withPageGridLayout([
      { id: "a", pageNumber: 1, data: {} },
      { id: "b", pageNumber: 2, data: {} },
    ]);
    expect(laidOut[0]).toMatchObject({ gridRow: 0, gridCol: 0 });
    expect(laidOut[1]).toMatchObject({ gridRow: 1, gridCol: 0 });
  });

  it("grows below and beside from the active sheet", () => {
    let doc = emptyDocument("sketch");
    doc = addNotebookPage(doc); // page 2 below
    let pages = getNotebookPages(doc).pages;
    expect(pages).toHaveLength(2);
    expect(findPageAtCell(pages, 1, 0)?.pageNumber).toBe(2);

    doc = addNotebookPageInDirection(doc, "beside");
    pages = getNotebookPages(doc).pages;
    expect(pages).toHaveLength(3);
    const active = pages.find((p) => p.id === getNotebookPages(doc).activePageId);
    expect(active?.gridCol).toBe(1);
    expect(active?.gridRow).toBe(1);
  });

  it("computes desk size from the grid", () => {
    const metrics = pageDeskMetrics(
      [
        { id: "a", pageNumber: 1, gridRow: 0, gridCol: 0, data: {} },
        { id: "b", pageNumber: 2, gridRow: 0, gridCol: 1, data: {} },
        { id: "c", pageNumber: 3, gridRow: 1, gridCol: 0, data: {} },
      ],
      {
        layoutMode: "book",
        viewportWidth: 1000,
        viewportHeight: 700,
      },
    );
    expect(metrics.maxRow).toBe(1);
    expect(metrics.maxCol).toBe(1);
    expect(metrics.deskWidth).toBeGreaterThan(metrics.sheetW);
    expect(metrics.deskHeight).toBeGreaterThan(metrics.sheetH);
  });

  it("fills exactly one screen at rest (no scrollbar pad until you pull)", () => {
    const pages = [
      { id: "a", pageNumber: 1, gridRow: 0, gridCol: 0, data: {} },
    ];
    const metrics = pageDeskMetrics(pages, {
      layoutMode: "scroll",
      viewportWidth: 1200,
      viewportHeight: 800,
    });
    expect(metrics.sheetW).toBe(1200);
    expect(metrics.sheetH).toBe(800);
    expect(metrics.deskHeight).toBe(800);
    expect(metrics.deskWidth).toBe(1200);
    expect(metrics.growPad).toBe(88);
  });

  it("keeps fixed page tiles even if a world height is passed", () => {
    const pages = [
      { id: "a", pageNumber: 1, gridRow: 0, gridCol: 0, data: {} },
      { id: "b", pageNumber: 2, gridRow: 1, gridCol: 0, data: {} },
    ];
    const base = pageDeskMetrics(pages, {
      layoutMode: "scroll",
      viewportWidth: 1000,
      viewportHeight: 700,
    });
    const tall = pageDeskMetrics(pages, {
      layoutMode: "scroll",
      viewportWidth: 1000,
      viewportHeight: 700,
      activePageId: "a",
      activeWorldHeight: base.sheetH + 400,
    });
    expect(tall.activeSheetH).toBe(base.sheetH);
    expect(tall.contentHeight).toBe(base.contentHeight);
  });

  it("steps cells in grow directions", () => {
    expect(nextCellInDirection({ gridRow: 2, gridCol: 1 }, "below")).toEqual({
      gridRow: 3,
      gridCol: 1,
    });
    expect(nextCellInDirection({ gridRow: 2, gridCol: 1 }, "beside")).toEqual({
      gridRow: 2,
      gridCol: 2,
    });
  });
});

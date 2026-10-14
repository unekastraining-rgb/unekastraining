import { describe, expect, it } from "vitest";

import {
  computeCanvasBufferPixels,
  resolveCanvasCssSize,
  shouldApplySaveResult,
} from "@/lib/core/canvas-buffer-size";
import {
  emptyDocument,
  parseNoteDocument,
  type NoteDocument,
  type SketchStroke,
} from "@/lib/core/note-types";
import {
  ensureNotebookPages,
  prepareNoteDocumentForSave,
  switchNotebookPage,
  syncCurrentPage,
} from "@/lib/core/notebook-pages";

function stroke(id: string): SketchStroke {
  return {
    id,
    tool: "pen",
    color: "#111",
    width: 2,
    points: [
      { x: 1, y: 1, pressure: 0.5 },
      { x: 2, y: 2, pressure: 0.5 },
    ],
  };
}

function docWithPageInk(strokes: SketchStroke[]): NoteDocument {
  const base = emptyDocument();
  const pageId = "pg_test";
  return {
    ...base,
    strokes: [],
    typed: "",
    metadata: {
      notebookPages: {
        activePageId: pageId,
        pages: [
          {
            id: pageId,
            pageNumber: 1,
            label: "Page 1",
            gridRow: 0,
            gridCol: 0,
            data: {
              strokes,
              typed: "stored text",
              typedHtml: "<p>stored text</p>",
              annotations: [],
              decorations: [],
              pageImages: [],
              pageTextBoxes: [],
            },
          },
        ],
      },
    },
  };
}

describe("2P-2 CORE note open/save/reopen (contentJson)", () => {
  it("TEST A — stringify → parse preserves strokes and typed", () => {
    const original: NoteDocument = {
      ...emptyDocument(),
      typed: "hello learner",
      typedHtml: "<p>hello learner</p>",
      strokes: [stroke("s1")],
      tool: "sketch",
    };
    const raw = JSON.stringify(original);
    const reopened = parseNoteDocument(raw);
    expect(reopened.typed).toBe("hello learner");
    expect(reopened.strokes).toHaveLength(1);
    expect(reopened.strokes?.[0]?.id).toBe("s1");
    expect(reopened.tool).toBe("sketch");
  });

  it("TEST B — ink in page data survives ensureNotebookPages hydrate", () => {
    const opened = ensureNotebookPages(docWithPageInk([stroke("ink1")]));
    expect(opened.strokes).toHaveLength(1);
    expect(opened.strokes?.[0]?.id).toBe("ink1");
    expect(opened.typed).toContain("stored text");
  });

  it("TEST E — prepareNoteDocumentForSave does not resurrect cleared strokes", () => {
    const hydrated = ensureNotebookPages(docWithPageInk([stroke("old")]));
    expect(hydrated.strokes).toHaveLength(1);
    const cleared: NoteDocument = {
      ...hydrated,
      strokes: [],
      typed: "",
      typedHtml: "",
    };
    const saved = prepareNoteDocumentForSave(cleared);
    const page = saved.metadata?.notebookPages?.pages[0];
    const data = page?.data as { strokes?: SketchStroke[] };
    expect(data.strokes ?? []).toEqual([]);
  });

  it("syncCurrentPage writes live empty strokes into active page", () => {
    const hydrated = ensureNotebookPages(docWithPageInk([stroke("x")]));
    const synced = syncCurrentPage({ ...hydrated, strokes: [] });
    const data = synced.metadata?.notebookPages?.pages[0]?.data as {
      strokes?: SketchStroke[];
    };
    expect(data.strokes).toEqual([]);
  });

  it("multi-page switch preserves ink on prior page", () => {
    const pageA = "pg_a";
    const pageB = "pg_b";
    const doc: NoteDocument = {
      ...emptyDocument(),
      strokes: [stroke("a")],
      metadata: {
        notebookPages: {
          activePageId: pageA,
          pages: [
            {
              id: pageA,
              pageNumber: 1,
              label: "A",
              gridRow: 0,
              gridCol: 0,
              data: { strokes: [stroke("a")] },
            },
            {
              id: pageB,
              pageNumber: 2,
              label: "B",
              gridRow: 0,
              gridCol: 1,
              data: { strokes: [stroke("b")] },
            },
          ],
        },
      },
    };
    const onB = switchNotebookPage(doc, pageB);
    expect(onB.strokes?.[0]?.id).toBe("b");
    const backA = switchNotebookPage(onB, pageA);
    expect(backA.strokes?.[0]?.id).toBe("a");
  });
});

describe("2P-2 canvas measure / save guard", () => {
  it("TEST C — 0×0 measure is provisional and never yields zero buffer", () => {
    const size = resolveCanvasCssSize({
      measureClientWidth: 0,
      measureClientHeight: 0,
      canvasClientWidth: 0,
      canvasClientHeight: 0,
    });
    expect(size.provisional).toBe(true);
    expect(size.cssW).toBeGreaterThanOrEqual(1);
    expect(size.cssH).toBeGreaterThanOrEqual(1);
    const buf = computeCanvasBufferPixels(size.cssW, size.cssH, 2);
    expect(buf.bw).toBeGreaterThanOrEqual(1);
    expect(buf.bh).toBeGreaterThanOrEqual(1);
  });

  it("TEST D — real measure is not provisional", () => {
    const size = resolveCanvasCssSize({
      measureClientWidth: 800,
      measureClientHeight: 1000,
    });
    expect(size.provisional).toBe(false);
    expect(size.cssW).toBe(800);
    expect(size.cssH).toBe(1000);
  });

  it("TEST E — stale save generation is ignored", () => {
    expect(shouldApplySaveResult(1, 2)).toBe(false);
    expect(shouldApplySaveResult(3, 3)).toBe(true);
  });
});

describe("2P-2 malformed / empty contentJson", () => {
  it("TEST K — invalid JSON does not throw; preserves raw as typed", () => {
    const doc = parseNoteDocument("{not-json");
    expect(doc.typed).toBe("{not-json");
    expect(doc.strokes).toEqual([]);
  });

  it("TEST K — empty/null yields emptyDocument without inventing ink", () => {
    expect(parseNoteDocument(null).strokes).toEqual([]);
    expect(parseNoteDocument("").typed).toBe("");
    expect(parseNoteDocument(undefined).strokes).toEqual([]);
  });
});

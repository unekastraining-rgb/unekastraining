import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readSource(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("GoodNotes-adjacent Core surfaces", () => {
  const surfaces: Array<[string, string, string]> = [
    ["PDF annotate loop bar", "src/components/core/PdfInkViewer.tsx", "data-pdf-loop-bar"],
    ["ink toolbar touch", "src/components/core/InkToolbar.tsx", "touch-manipulation"],
    ["touch chrome PDF bar", "src/components/TouchChromeGuard.tsx", "data-pdf-loop-bar"],
    ["notebook paper CSS", "app/globals.css", "data-notebook-paper"],
    ["PDF annotate paper", "src/components/core/PdfAnnotatedPage.tsx", "data-notebook-paper"],
    ["PDF annotate active page", "src/components/core/PdfAnnotatedPage.tsx", "data-page-active"],
    ["PDF touch pen width", "src/components/core/PdfInkViewer.tsx", "setInternalLineWidth"],
    ["PDF desk scrollport", "src/components/core/PdfInkViewer.tsx", "data-notebook-desk"],
    ["continuous notebook desk", "src/components/core/NotebookContinuousDesk.tsx", "data-notebook-desk"],
    ["continuous notebook paper", "src/components/core/NotebookContinuousDesk.tsx", "data-notebook-paper"],
    ["notebook page frame paper", "src/components/core/NotebookPageFrame.tsx", "data-notebook-paper"],
    ["core course action bar touch", "src/components/core/CoreCourseActionBar.tsx", "touch-manipulation"],
    ["pen toolbar touch", "src/components/core/toolbar/CoreToolbarPenPanel.tsx", "touch-manipulation"],
  ];

  for (const [label, path, needle] of surfaces) {
    it(`wires GoodNotes track on ${label}`, () => {
      expect(readSource(path)).toContain(needle);
    });
  }
});

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "../..");

function read(rel: string) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("2P-2 undo/redo preserved (existing hooks)", () => {
  it("TEST F — useDocumentHistory still exposes undo/redo", () => {
    const src = read("src/hooks/useDocumentHistory.ts");
    expect(src).toContain("undo");
    expect(src).toContain("redo");
    expect(src).toContain("canUndo");
    expect(src).toContain("canRedo");
    expect(src).toContain("replaceDoc");
    expect(src).toContain("COALESCE_MS");
  });

  it("TEST F — useInkHistory still exposes undo/redo", () => {
    const src = read("src/hooks/useInkHistory.ts");
    expect(src).toContain("undo");
    expect(src).toContain("redo");
    expect(src).toContain("setStrokes");
    expect(src).toContain("replaceStrokes");
  });

  it("TEST F — CoreNotesWorkspace wires undoCore/redoCore without removal", () => {
    const ws = read("src/components/core/CoreNotesWorkspace.tsx");
    expect(ws).toContain("undoCore");
    expect(ws).toContain("redoCore");
    expect(ws).toContain("useDocumentHistory");
    expect(ws).toContain("useInkHistory");
  });
});

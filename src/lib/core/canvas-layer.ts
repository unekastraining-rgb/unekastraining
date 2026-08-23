import type { NoteDocument } from "@/lib/core/note-types";

/** Legacy default — new format blocks use CANVAS_ELEMENT_BASE_Z and stack with other items. */
export const FORMAT_BLOCK_Z = 5;

/** Default z-index for stickers, shapes, stickies, text boxes, and format blocks. */
export const CANVAS_ELEMENT_BASE_Z = 10;

export function maxCanvasElementZIndex(doc: NoteDocument): number {
  const values = [
    CANVAS_ELEMENT_BASE_Z,
    ...(doc.decorations ?? []).map((item) => item.zIndex ?? CANVAS_ELEMENT_BASE_Z),
    ...(doc.pageImages ?? []).map((item) => item.zIndex ?? CANVAS_ELEMENT_BASE_Z),
    ...(doc.pageTextBoxes ?? []).map((item) => item.zIndex ?? CANVAS_ELEMENT_BASE_Z),
    ...(doc.metadata?.compositeSections ?? []).map(
      (item) => item.zIndex ?? CANVAS_ELEMENT_BASE_Z,
    ),
  ];
  return Math.max(...values);
}

export function nextCanvasElementZIndex(doc: NoteDocument): number {
  return maxCanvasElementZIndex(doc) + 1;
}

export function takeNextCanvasZIndexes(doc: NoteDocument, count: number): number[] {
  let next = nextCanvasElementZIndex(doc);
  return Array.from({ length: count }, () => next++);
}

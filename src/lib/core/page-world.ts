import type {
  NoteDocument,
  PageDecoration,
  PageImage,
  PageTextBox,
  SketchStroke,
  CompositeSection,
} from "@/lib/core/note-types";
import { DEFAULT_BLOCK_HEIGHT, DEFAULT_BLOCK_WIDTH, ensureBlockPositions } from "@/lib/core/block-layout";

/** One letter-ish sheet as the starting paper (GoodNotes/Notability product feel). */
export const PAGE_WORLD_BASE_WIDTH = 816;
export const PAGE_WORLD_BASE_HEIGHT = 1056;
const EDGE_PADDING = 64;

function maxStrokeExtent(strokes: SketchStroke[] | undefined): { x: number; y: number } {
  let x = 0;
  let y = 0;
  for (const stroke of strokes ?? []) {
    for (const point of stroke.points) {
      x = Math.max(x, point.x);
      y = Math.max(y, point.y);
    }
  }
  return { x, y };
}

function maxBoxExtent(
  items: Array<{ x: number; y: number; width?: number; height?: number; w?: number; h?: number }>,
): { x: number; y: number } {
  let x = 0;
  let y = 0;
  for (const item of items) {
    const w = item.width ?? item.w ?? 0;
    const h = item.height ?? item.h ?? 0;
    x = Math.max(x, item.x + w);
    y = Math.max(y, item.y + h);
  }
  return { x, y };
}

export function computePageWorldSize(input: {
  strokes?: SketchStroke[];
  annotations?: SketchStroke[];
  textBoxes?: PageTextBox[];
  decorations?: PageDecoration[];
  images?: PageImage[];
  sections?: CompositeSection[];
  minWidth?: number;
  minHeight?: number;
}): { width: number; height: number } {
  const strokeA = maxStrokeExtent(input.strokes);
  const strokeB = maxStrokeExtent(input.annotations);
  const boxes = maxBoxExtent(input.textBoxes ?? []);
  const decorations = maxBoxExtent(input.decorations ?? []);
  const images = maxBoxExtent(
    (input.images ?? []).map((image) => ({
      x: image.x,
      y: image.y,
      width: image.width,
      height: image.height ?? image.width,
    })),
  );
  const sections = maxBoxExtent(
    ensureBlockPositions(input.sections ?? []).map((section) => ({
      x: section.x ?? 0,
      y: section.y ?? 0,
      width: section.width ?? DEFAULT_BLOCK_WIDTH,
      height: section.height ?? DEFAULT_BLOCK_HEIGHT,
    })),
  );

  const contentX = Math.max(strokeA.x, strokeB.x, boxes.x, decorations.x, images.x, sections.x);
  const contentY = Math.max(strokeA.y, strokeB.y, boxes.y, decorations.y, images.y, sections.y);

  return {
    width: Math.max(
      input.minWidth ?? PAGE_WORLD_BASE_WIDTH,
      Math.ceil(contentX + EDGE_PADDING),
    ),
    height: Math.max(
      input.minHeight ?? PAGE_WORLD_BASE_HEIGHT,
      Math.ceil(contentY + EDGE_PADDING),
    ),
  };
}

export function computePageWorldSizeFromDoc(doc: NoteDocument): { width: number; height: number } {
  return computePageWorldSize({
    strokes: doc.strokes,
    annotations: doc.annotations,
    textBoxes: doc.pageTextBoxes,
    decorations: doc.decorations,
    images: doc.pageImages,
    sections: doc.metadata?.compositeSections,
  });
}

import type { SketchStroke } from "@/lib/core/note-types";

export interface InkViewport {
  width: number;
  height: number;
}

export interface InkPageData {
  strokes: SketchStroke[];
  viewport?: InkViewport;
}

export function parseInkPageJson(raw: string | null | undefined): InkPageData {
  if (!raw) return { strokes: [] };
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return { strokes: parsed as SketchStroke[] };
    }
    if (
      parsed &&
      typeof parsed === "object" &&
      Array.isArray((parsed as { strokes?: unknown }).strokes)
    ) {
      const record = parsed as {
        strokes: SketchStroke[];
        viewport?: InkViewport;
      };
      return {
        strokes: record.strokes,
        viewport: record.viewport,
      };
    }
  } catch {
    // fall through
  }
  return { strokes: [] };
}

export function serializeInkPage(data: InkPageData): string {
  if (!data.viewport) {
    return JSON.stringify(data.strokes);
  }
  return JSON.stringify({
    v: 1,
    viewport: data.viewport,
    strokes: data.strokes,
  });
}

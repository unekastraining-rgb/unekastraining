import { PDFDocument, rgb, type PDFPage, type RGB } from "pdf-lib";

import type { SketchStroke } from "@/lib/core/note-types";
import { strokeColor, strokeOpacity } from "@/lib/core/ink-engine";

import { parseInkPageJson, type InkViewport } from "./ink-storage";

const DEFAULT_VIEWPORT: InkViewport = { width: 816, height: 560 };

function hexToRgb(hex: string): RGB {
  const normalized = hex.replace("#", "");
  const value =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized.padStart(6, "0").slice(0, 6);
  const r = parseInt(value.slice(0, 2), 16) / 255;
  const g = parseInt(value.slice(2, 4), 16) / 255;
  const b = parseInt(value.slice(4, 6), 16) / 255;
  return rgb(r, g, b);
}

function scaleStroke(
  stroke: SketchStroke,
  from: InkViewport,
  to: { width: number; height: number },
): SketchStroke {
  const scaleX = to.width / from.width;
  const scaleY = to.height / from.height;
  const scale = Math.max(scaleX, scaleY);

  return {
    ...stroke,
    width: stroke.width * scale,
    points: stroke.points.map((point) => ({
      ...point,
      x: point.x * scaleX,
      y: point.y * scaleY,
    })),
  };
}

function drawStrokeOnPage(page: PDFPage, stroke: SketchStroke) {
  if (stroke.tool === "eraser" || stroke.points.length === 0) return;

  const { height } = page.getSize();
  const tool = stroke.tool ?? "pen";
  const color = hexToRgb(strokeColor(stroke.color, tool));
  const opacity = stroke.opacity ?? strokeOpacity(tool);

  for (let index = 0; index < stroke.points.length - 1; index += 1) {
    const start = stroke.points[index];
    const end = stroke.points[index + 1];
    const pressure = end.pressure ?? start.pressure ?? 0.5;
    const thickness = Math.max(1, stroke.width * (0.45 + pressure * 1.1));

    page.drawLine({
      start: { x: start.x, y: height - start.y },
      end: { x: end.x, y: height - end.y },
      thickness,
      color,
      opacity,
    });
  }

  if (stroke.points.length === 1) {
    const point = stroke.points[0];
    const radius = Math.max(1, stroke.width / 2);
    page.drawCircle({
      x: point.x,
      y: height - point.y,
      size: radius,
      color,
      opacity,
    });
  }
}

export async function buildAnnotatedPdfBuffer(options: {
  pdfBytes: Uint8Array;
  inkPages: Array<{ pageNumber: number; strokesJson: string }>;
}): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(options.pdfBytes);
  const pages = pdfDoc.getPages();
  const inkByPage = new Map(
    options.inkPages.map((entry) => [entry.pageNumber, entry.strokesJson]),
  );

  for (let index = 0; index < pages.length; index += 1) {
    const pageNumber = index + 1;
    const strokesJson = inkByPage.get(pageNumber);
    if (!strokesJson) continue;

    const ink = parseInkPageJson(strokesJson);
    if (ink.strokes.length === 0) continue;

    const page = pages[index];
    const pageSize = page.getSize();
    const viewport = ink.viewport ?? DEFAULT_VIEWPORT;

    for (const stroke of ink.strokes) {
      drawStrokeOnPage(page, scaleStroke(stroke, viewport, pageSize));
    }
  }

  return pdfDoc.save();
}

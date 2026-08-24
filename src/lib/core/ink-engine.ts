import type { SketchPoint, SketchStroke, ShapeKind } from "./note-types";

export type InkTool = "pen" | "highlighter" | "eraser" | "lasso" | "shape" | "hand";

export type { ShapeKind };

export const INK_COLORS = [
  { id: "graphite", value: "#1c1917", label: "Black" },
  { id: "ocean", value: "#0369a1", label: "Blue" },
  { id: "rose", value: "#e11d48", label: "Red" },
  { id: "amber", value: "#ea580c", label: "Orange" },
  { id: "forest", value: "#15803d", label: "Green" },
  { id: "highlight", value: "#facc15", label: "Highlight" },
] as const;

export const INK_SIZES = [
  { id: "fine", value: 2, label: "Fine" },
  { id: "medium", value: 4, label: "Medium" },
  { id: "bold", value: 7, label: "Bold" },
  { id: "marker", value: 12, label: "Marker" },
] as const;

export function normalizePressure(pressure: number, pointerType: string): number {
  if (pointerType === "pen") {
    return pressure > 0 ? pressure : 0.5;
  }
  return 0.55;
}

export function strokeWidth(
  baseWidth: number,
  pressure: number,
  tool: InkTool,
): number {
  if (tool === "highlighter") {
    return baseWidth * 2.4;
  }
  if (tool === "eraser") {
    return baseWidth * 3;
  }
  return Math.max(1, baseWidth * (0.45 + pressure * 1.1));
}

export function strokeOpacity(tool: InkTool): number {
  if (tool === "highlighter") return 0.38;
  return 1;
}

export function strokeColor(color: string, tool: InkTool): string {
  if (tool === "highlighter" && color === "#1c1917") {
    return "#facc15";
  }
  return color;
}

function midpoint(a: SketchPoint, b: SketchPoint): SketchPoint {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, pressure: a.pressure };
}

export function drawStroke(
  ctx: CanvasRenderingContext2D,
  stroke: SketchStroke,
  scale = 1,
) {
  const points = stroke.points;
  if (points.length === 0) return;

  const tool = stroke.tool ?? "pen";
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.globalAlpha = stroke.opacity ?? strokeOpacity(tool);
  ctx.strokeStyle = strokeColor(stroke.color, tool);
  ctx.globalCompositeOperation =
    tool === "highlighter" ? "multiply" : "source-over";

  if (points.length === 1) {
    const width = strokeWidth(stroke.width, points[0].pressure ?? 0.5, tool);
    ctx.beginPath();
    ctx.fillStyle = ctx.strokeStyle as string;
    ctx.arc(points[0].x, points[0].y, width / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  for (let i = 0; i < points.length - 1; i += 1) {
    const start = points[i];
    const end = points[i + 1];
    const control = midpoint(start, end);
    const pressure = end.pressure ?? start.pressure ?? 0.5;
    ctx.lineWidth = strokeWidth(stroke.width, pressure, tool) * scale;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.quadraticCurveTo(start.x, start.y, control.x, control.y);
    ctx.quadraticCurveTo(control.x, control.y, end.x, end.y);
    ctx.stroke();
  }

  ctx.restore();
}

export function drawStrokes(
  ctx: CanvasRenderingContext2D,
  strokes: SketchStroke[],
  width: number,
  height: number,
) {
  ctx.clearRect(0, 0, width, height);
  for (const stroke of strokes) {
    if (stroke.tool === "eraser") continue;
    drawStroke(ctx, stroke);
  }
}

export function eraseAtPoint(
  strokes: SketchStroke[],
  x: number,
  y: number,
  radius: number,
): SketchStroke[] {
  return strokes.filter((stroke) => {
    if (stroke.tool === "eraser") return false;
    return !stroke.points.some((point) => {
      const dx = point.x - x;
      const dy = point.y - y;
      return Math.hypot(dx, dy) <= radius + stroke.width;
    });
  });
}

export function pointInPolygon(point: SketchPoint, polygon: SketchPoint[]): boolean {
  if (polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i]!.x;
    const yi = polygon[i]!.y;
    const xj = polygon[j]!.x;
    const yj = polygon[j]!.y;
    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi + Number.EPSILON) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function selectStrokesInLasso(
  strokes: SketchStroke[],
  lasso: SketchPoint[],
): SketchStroke[] {
  if (lasso.length < 3) return [];
  return strokes.filter((stroke) =>
    stroke.points.some((point) => pointInPolygon(point, lasso)),
  );
}

export function lassoPolygonFromRect(
  start: SketchPoint,
  end: SketchPoint,
): SketchPoint[] {
  const x1 = Math.min(start.x, end.x);
  const y1 = Math.min(start.y, end.y);
  const x2 = Math.max(start.x, end.x);
  const y2 = Math.max(start.y, end.y);
  return [
    { x: x1, y: y1 },
    { x: x2, y: y1 },
    { x: x2, y: y2 },
    { x: x1, y: y2 },
  ];
}

export function elementIntersectsLasso(
  rect: { x: number; y: number; w: number; h: number },
  lasso: SketchPoint[],
): boolean {
  if (lasso.length < 3) return false;
  const probes = [
    { x: rect.x, y: rect.y },
    { x: rect.x + rect.w, y: rect.y },
    { x: rect.x + rect.w, y: rect.y + rect.h },
    { x: rect.x, y: rect.y + rect.h },
    { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 },
  ];
  return probes.some((point) => pointInPolygon(point, lasso));
}

export function translateStrokes(
  strokes: SketchStroke[],
  selectedIds: Set<string>,
  dx: number,
  dy: number,
): SketchStroke[] {
  return strokes.map((stroke, index) => {
    const id = stroke.id ?? `s${index}`;
    if (!selectedIds.has(id)) return stroke;
    return {
      ...stroke,
      id,
      points: stroke.points.map((point) => ({
        ...point,
        x: point.x + dx,
        y: point.y + dy,
      })),
    };
  });
}

export function drawShape(
  ctx: CanvasRenderingContext2D,
  shape: {
    kind: ShapeKind;
    x: number;
    y: number;
    w: number;
    h: number;
    color: string;
    strokeWidth: number;
  },
) {
  ctx.save();
  ctx.strokeStyle = shape.color;
  ctx.lineWidth = shape.strokeWidth;
  ctx.beginPath();
  if (shape.kind === "rect") {
    ctx.strokeRect(shape.x, shape.y, shape.w, shape.h);
  } else if (shape.kind === "ellipse") {
    ctx.ellipse(
      shape.x + shape.w / 2,
      shape.y + shape.h / 2,
      Math.abs(shape.w / 2),
      Math.abs(shape.h / 2),
      0,
      0,
      Math.PI * 2,
    );
    ctx.stroke();
  } else if (shape.kind === "line" || shape.kind === "arrow") {
    ctx.moveTo(shape.x, shape.y);
    ctx.lineTo(shape.x + shape.w, shape.y + shape.h);
    ctx.stroke();
    if (shape.kind === "arrow") {
      const angle = Math.atan2(shape.h, shape.w);
      const head = 12;
      const endX = shape.x + shape.w;
      const endY = shape.y + shape.h;
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(
        endX - head * Math.cos(angle - Math.PI / 6),
        endY - head * Math.sin(angle - Math.PI / 6),
      );
      ctx.moveTo(endX, endY);
      ctx.lineTo(
        endX - head * Math.cos(angle + Math.PI / 6),
        endY - head * Math.sin(angle + Math.PI / 6),
      );
      ctx.stroke();
    }
  }
  ctx.restore();
}

export interface InkPointerEvent {
  pointerType: string;
  pressure: number;
  clientX: number;
  clientY: number;
}

export function pointerFromEvent(
  event: InkPointerEvent,
  rect: DOMRect,
): SketchPoint {
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
    pressure: normalizePressure(event.pressure, event.pointerType),
  };
}

export function shouldRejectPointer(
  event: Pick<InkPointerEvent, "pointerType">,
  pencilOnly: boolean,
): boolean {
  if (!pencilOnly) return false;
  if (event.pointerType === "pen") return false;
  return event.pointerType === "touch";
}

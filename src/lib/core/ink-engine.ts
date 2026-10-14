import type { SketchPoint, SketchStroke, ShapeKind } from "./note-types";

export type InkTool = "pen" | "highlighter" | "eraser" | "lasso" | "shape" | "hand";

export type { ShapeKind };

export const INK_COLORS = [
  { id: "graphite", value: "#1c1917", label: "Black" },
  { id: "ocean", value: "#0369a1", label: "Blue" },
  { id: "rose", value: "#e11d48", label: "Red" },
  { id: "amber", value: "#ea580c", label: "Orange" },
  { id: "forest", value: "#15803d", label: "Green" },
  { id: "violet", value: "#7e22ce", label: "Violet" },
  { id: "highlight", value: "#facc15", label: "Highlight" },
] as const;

/** Marker / highlighter wash colors (used when ink tool is highlighter). */
export const HIGHLIGHTER_COLORS = [
  { id: "yellow", value: "#facc15", label: "Yellow" },
  { id: "lime", value: "#a3e635", label: "Lime" },
  { id: "pink", value: "#f472b6", label: "Pink" },
  { id: "orange", value: "#fb923c", label: "Orange" },
  { id: "sky", value: "#38bdf8", label: "Sky" },
  { id: "lavender", value: "#c084fc", label: "Lavender" },
  { id: "coral", value: "#fb7185", label: "Coral" },
] as const;

/** Soft chalk sticks for chalkboard surfaces. */
export const CHALK_COLORS = [
  { id: "white", value: "#f8fafc", label: "White chalk" },
  { id: "yellow", value: "#fde047", label: "Yellow chalk" },
  { id: "pink", value: "#f9a8d4", label: "Pink chalk" },
  { id: "sky", value: "#7dd3fc", label: "Blue chalk" },
  { id: "mint", value: "#86efac", label: "Green chalk" },
  { id: "lavender", value: "#d8b4fe", label: "Purple chalk" },
  { id: "coral", value: "#fda4af", label: "Coral chalk" },
] as const;

/** Waxy crayon sticks. */
export const CRAYON_COLORS = [
  { id: "red", value: "#dc2626", label: "Red" },
  { id: "orange", value: "#ea580c", label: "Orange" },
  { id: "yellow", value: "#eab308", label: "Yellow" },
  { id: "green", value: "#16a34a", label: "Green" },
  { id: "blue", value: "#2563eb", label: "Blue" },
  { id: "purple", value: "#9333ea", label: "Purple" },
  { id: "brown", value: "#92400e", label: "Brown" },
  { id: "black", value: "#1c1917", label: "Black" },
] as const;

/** Colored pencil leads. */
export const COLOR_PENCIL_COLORS = [
  { id: "scarlet", value: "#e11d48", label: "Scarlet" },
  { id: "tangerine", value: "#f97316", label: "Tangerine" },
  { id: "gold", value: "#ca8a04", label: "Gold" },
  { id: "emerald", value: "#059669", label: "Emerald" },
  { id: "cobalt", value: "#0284c7", label: "Cobalt" },
  { id: "indigo", value: "#4f46e5", label: "Indigo" },
  { id: "magenta", value: "#c026d3", label: "Magenta" },
  { id: "umber", value: "#78716c", label: "Umber" },
] as const;

/** Bold felt markers (opaque — not highlighter wash). */
export const MARKER_COLORS = [
  { id: "black", value: "#1c1917", label: "Black" },
  { id: "navy", value: "#1e3a8a", label: "Navy" },
  { id: "red", value: "#b91c1c", label: "Red" },
  { id: "green", value: "#15803d", label: "Green" },
  { id: "purple", value: "#6b21a8", label: "Purple" },
  { id: "brown", value: "#92400e", label: "Brown" },
  { id: "teal", value: "#0f766e", label: "Teal" },
  { id: "orange", value: "#c2410c", label: "Orange" },
] as const;

export const CHALKBOARD_BACKGROUND = "#1a3d32";
export const WHITEBOARD_BACKGROUND = "#f8fafc";

export const INK_SIZES = [
  { id: "fine", value: 2, label: "Fine" },
  { id: "medium", value: 4, label: "Medium" },
  { id: "bold", value: 7, label: "Bold" },
  { id: "marker", value: 12, label: "Marker" },
  { id: "broad", value: 18, label: "Broad marker" },
] as const;

export const HIGHLIGHTER_SIZES = [
  { id: "pen", value: 8, label: "Pen tip" },
  { id: "marker", value: 14, label: "Marker" },
  { id: "wide", value: 22, label: "Wide marker" },
  { id: "block", value: 32, label: "Block" },
] as const;

export const ERASER_SIZES = [
  { id: "small", value: 8, label: "Small" },
  { id: "medium", value: 16, label: "Medium" },
  { id: "large", value: 28, label: "Large" },
  { id: "block", value: 40, label: "Block" },
] as const;

export function normalizePressure(pressure: number, pointerType: string): number {
  if (pointerType === "pen") {
    // Soften extremes so fountain/ball pens feel less scratchy on iPad.
    const raw = pressure > 0 ? pressure : 0.45;
    return Math.min(1, Math.max(0.12, Math.pow(raw, 0.85)));
  }
  if (pointerType === "touch") {
    return 0.5;
  }
  return 0.55;
}

/** Map 0–100 UI sensitivity into how much pressure changes stroke width. */
export function applyPressureSensitivity(
  normalizedPressure: number,
  sensitivity = 70,
): number {
  const t = Math.min(1, Math.max(0, sensitivity / 100));
  const mid = 0.55;
  // Low sensitivity → almost flat; high → full dynamic range around mid.
  return mid + (normalizedPressure - mid) * (0.2 + t * 0.8);
}

export type StrokeFeel = {
  /** 0–100 from fountain pen panel */
  pressureSensitivity?: number;
  /** 0–100 — higher = less width swing (flatter tip) */
  tipFlatness?: number;
  /** 0–100 — higher = thinner minimum stroke */
  tipSharpness?: number;
  strokeType?: "solid" | "dashed" | "dotted";
  /** Skip curve smoothing for snappier live ink (GoodNotes-style low latency). */
  reduceLatency?: boolean;
  /** Soft / waxy / felt writing media beyond fountain ink. */
  medium?: "ink" | "chalk" | "crayon" | "colorPencil" | "marker";
  /** Decorative ink fill drawn with the stroke color. */
  fillPattern?: "solid" | "stripes" | "bubbles" | "dots" | "grid";
};

export type InkFillPattern = NonNullable<StrokeFeel["fillPattern"]>;

export const INK_FILL_PATTERNS: Array<{
  id: InkFillPattern;
  label: string;
}> = [
  { id: "solid", label: "Solid" },
  { id: "stripes", label: "Stripes" },
  { id: "bubbles", label: "Bubbles" },
  { id: "dots", label: "Dots" },
  { id: "grid", label: "Grid" },
];

function inkPatternStyle(
  ctx: CanvasRenderingContext2D,
  color: string,
  pattern: InkFillPattern | undefined,
): string | CanvasPattern {
  if (!pattern || pattern === "solid") return color;
  const size = 16;
  const tile = document.createElement("canvas");
  tile.width = size;
  tile.height = size;
  const t = tile.getContext("2d");
  if (!t) return color;
  t.clearRect(0, 0, size, size);
  t.strokeStyle = color;
  t.fillStyle = color;
  t.lineWidth = 2;
  if (pattern === "stripes") {
    t.beginPath();
    t.moveTo(0, size);
    t.lineTo(size, 0);
    t.moveTo(-4, size - 4);
    t.lineTo(size - 4, -4);
    t.moveTo(4, size + 4);
    t.lineTo(size + 4, 4);
    t.stroke();
  } else if (pattern === "bubbles") {
    t.beginPath();
    t.arc(5, 5, 3, 0, Math.PI * 2);
    t.arc(12, 11, 2.5, 0, Math.PI * 2);
    t.stroke();
  } else if (pattern === "dots") {
    t.beginPath();
    t.arc(4, 4, 1.6, 0, Math.PI * 2);
    t.arc(12, 4, 1.6, 0, Math.PI * 2);
    t.arc(4, 12, 1.6, 0, Math.PI * 2);
    t.arc(12, 12, 1.6, 0, Math.PI * 2);
    t.fill();
  } else if (pattern === "grid") {
    t.beginPath();
    t.moveTo(0, 8);
    t.lineTo(16, 8);
    t.moveTo(8, 0);
    t.lineTo(8, 16);
    t.stroke();
  }
  return ctx.createPattern(tile, "repeat") ?? color;
}

export function strokeWidth(
  baseWidth: number,
  pressure: number,
  tool: InkTool,
  feel?: StrokeFeel,
): number {
  if (tool === "highlighter") {
    return baseWidth * 2.4;
  }
  if (tool === "eraser") {
    return baseWidth * 3;
  }

  const mediumDefaults =
    feel?.medium === "chalk"
      ? { flatness: 75, sharpness: 45 }
      : feel?.medium === "crayon"
        ? { flatness: 82, sharpness: 35 }
        : feel?.medium === "colorPencil"
          ? { flatness: 40, sharpness: 70 }
          : feel?.medium === "marker"
            ? { flatness: 70, sharpness: 40 }
            : null;

  const sensitivity =
    feel?.medium === "colorPencil"
      ? Math.max(feel?.pressureSensitivity ?? 70, 85)
      : feel?.medium === "marker"
        ? Math.min(feel?.pressureSensitivity ?? 70, 45)
        : (feel?.pressureSensitivity ?? 70);
  const flatness = Math.min(
    1,
    Math.max(0, (mediumDefaults?.flatness ?? feel?.tipFlatness ?? 35) / 100),
  );
  const sharpness = Math.min(
    1,
    Math.max(0, (mediumDefaults?.sharpness ?? feel?.tipSharpness ?? 65) / 100),
  );
  const p = applyPressureSensitivity(pressure, sensitivity);
  // Flat tips compress width variation; sharp tips raise the floor less.
  const range = 0.85 * (1 - flatness * 0.75);
  const floor = 0.4 + (1 - sharpness) * 0.25;
  const waxBoost =
    feel?.medium === "crayon" ? 1.15 : feel?.medium === "marker" ? 1.35 : 1;
  return Math.max(1.05, baseWidth * (floor + p * range) * waxBoost);
}

/**
 * Thin fast strokes slightly (GoodNotes/Notability feel). Returns multiplier 0.65–1.
 * Speeds are px/ms from consecutive pointer samples.
 */
export function velocityWidthFactor(dx: number, dy: number, dtMs: number): number {
  if (!(dtMs > 0) || !Number.isFinite(dtMs)) return 1;
  const speed = Math.hypot(dx, dy) / dtMs;
  // ~0.15 px/ms is leisurely handwriting; above ~1.2 px/ms starts to taper.
  const taper = 1 - Math.min(0.35, Math.max(0, (speed - 0.2) * 0.28));
  return Math.max(0.65, Math.min(1, taper));
}

export function segmentWidth(
  baseWidth: number,
  pressure: number,
  tool: InkTool,
  feel: StrokeFeel | undefined,
  from: { x: number; y: number; t?: number },
  to: { x: number; y: number; t?: number; pressure?: number },
): number {
  const width = strokeWidth(baseWidth, pressure, tool, feel);
  if (tool === "highlighter" || tool === "eraser") return width;
  if (from.t == null || to.t == null) return width;
  return Math.max(
    1.05,
    width * velocityWidthFactor(to.x - from.x, to.y - from.y, to.t - from.t),
  );
}

export function strokeOpacity(tool: InkTool, feel?: StrokeFeel): number {
  if (tool === "highlighter") return 0.38;
  if (feel?.medium === "chalk") return 0.86;
  if (feel?.medium === "crayon") return 0.9;
  if (feel?.medium === "colorPencil") return 0.94;
  if (feel?.medium === "marker") return 0.98;
  return 1;
}

export function strokeColor(color: string, tool: InkTool): string {
  if (tool !== "highlighter") return color;
  if (color === "#1c1917") return "#facc15";
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
  const baseColor = strokeColor(stroke.color, tool);
  ctx.save();
  ctx.lineCap = stroke.feel?.strokeType === "dotted" ? "round" : "round";
  ctx.lineJoin = "round";
  ctx.globalAlpha = stroke.opacity ?? strokeOpacity(tool, stroke.feel);
  const paint = inkPatternStyle(ctx, baseColor, stroke.feel?.fillPattern);
  ctx.strokeStyle = paint;
  ctx.globalCompositeOperation =
    tool === "highlighter" ? "multiply" : "source-over";

  const dashType = tool === "pen" ? stroke.feel?.strokeType ?? "solid" : "solid";
  function setDashForWidth(width: number) {
    if (dashType === "dashed") {
      ctx.setLineDash([Math.max(4, width * 2.8), Math.max(3, width * 1.8)]);
    } else if (dashType === "dotted") {
      ctx.setLineDash([Math.max(0.5, width * 0.35), Math.max(3, width * 1.4)]);
    } else {
      ctx.setLineDash([]);
    }
  }

  if (points.length === 1) {
    const width = strokeWidth(
      stroke.width,
      points[0].pressure ?? 0.5,
      tool,
      stroke.feel,
    );
    ctx.beginPath();
    ctx.fillStyle = paint;
    ctx.arc(points[0].x, points[0].y, width / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  if (stroke.feel?.reduceLatency) {
    // Fast quadratic ribbons with sampled pressure — smoother than raw lineTo,
    // cheaper than full mid-point work on every sample (GoodNotes-adjacent).
    const step = points.length > 48 ? 2 : 1;
    for (let i = 0; i < points.length - 1; i += step) {
      const start = points[i]!;
      const end = points[Math.min(i + step, points.length - 1)]!;
      const mid = midpoint(start, end);
      const pressure = end.pressure ?? start.pressure ?? 0.5;
      const width =
        segmentWidth(stroke.width, pressure, tool, stroke.feel, start, end) * scale;
      ctx.lineWidth = width;
      setDashForWidth(width);
      ctx.beginPath();
      if (i === 0) {
        ctx.moveTo(start.x, start.y);
      } else {
        const prev = points[Math.max(0, i - step)]!;
        const prevMid = midpoint(prev, start);
        ctx.moveTo(prevMid.x, prevMid.y);
      }
      ctx.quadraticCurveTo(start.x, start.y, mid.x, mid.y);
      ctx.stroke();
    }
    const last = points[points.length - 1]!;
    const prev = points[Math.max(0, points.length - 1 - step)]!;
    const width =
      segmentWidth(
        stroke.width,
        last.pressure ?? prev.pressure ?? 0.5,
        tool,
        stroke.feel,
        prev,
        last,
      ) * scale;
    ctx.lineWidth = width;
    setDashForWidth(width);
    ctx.beginPath();
    ctx.moveTo(midpoint(prev, last).x, midpoint(prev, last).y);
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
    ctx.restore();
    return;
  }

  for (let i = 0; i < points.length - 1; i += 1) {
    const start = points[i]!;
    const end = points[i + 1]!;
    const mid = midpoint(start, end);
    const pressure = end.pressure ?? start.pressure ?? 0.5;
    const width =
      segmentWidth(stroke.width, pressure, tool, stroke.feel, start, end) * scale;
    ctx.lineWidth = width;
    setDashForWidth(width);
    ctx.beginPath();
    if (i === 0) {
      ctx.moveTo(start.x, start.y);
    } else {
      const prev = points[i - 1]!;
      const prevMid = midpoint(prev, start);
      ctx.moveTo(prevMid.x, prevMid.y);
    }
    ctx.quadraticCurveTo(start.x, start.y, mid.x, mid.y);
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
  timeStamp?: number;
}

export function pointerFromEvent(
  event: InkPointerEvent,
  rect: DOMRect,
): SketchPoint {
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
    pressure: normalizePressure(event.pressure, event.pointerType),
    t: typeof event.timeStamp === "number" ? event.timeStamp : undefined,
  };
}

export function shouldRejectPointer(
  event: Pick<InkPointerEvent, "pointerType">,
  pencilOnly: boolean,
): boolean {
  // Palm / finger rejection when Pencil-only mode is on (GoodNotes-style).
  if (!pencilOnly) return false;
  if (event.pointerType === "pen") return false;
  // Reject finger/touch so resting palm doesn't draw; mouse still works for desktop.
  return event.pointerType === "touch";
}

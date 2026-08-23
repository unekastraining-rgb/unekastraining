import type { InfiniteCanvasData, PageDecoration } from "@/lib/core/note-types";
import { emptyCanvas } from "@/lib/core/note-types";

function sticky(
  id: string,
  x: number,
  y: number,
  text: string,
  color = "#fef08a",
) {
  return { id, x, y, width: 150, height: 88, text, color };
}

function rect(
  id: string,
  x: number,
  y: number,
  w: number,
  h: number,
  color = "#0369a1",
) {
  return {
    id,
    kind: "rect" as const,
    x,
    y,
    w,
    h,
    color,
    strokeWidth: 2,
  };
}

export function mergeWhiteboardStarters(starterIds: string[]): InfiniteCanvasData {
  const base = emptyCanvas();
  if (starterIds.length === 0) return base;

  const stickies = starterIds.flatMap((starterId) =>
    buildWhiteboardStarter(starterId).stickies.map((sticky) => ({
      ...sticky,
      id: `${starterId}_${sticky.id}`,
    })),
  );
  const shapes = starterIds.flatMap((starterId) =>
    buildWhiteboardStarter(starterId).shapes.map((shape) => ({
      ...shape,
      id: `${starterId}_${shape.id}`,
    })),
  );

  return { ...base, stickies, shapes };
}

export function mergeCanvasData(
  current: InfiniteCanvasData | undefined,
  incoming: InfiniteCanvasData,
): InfiniteCanvasData {
  const base = current ?? emptyCanvas();
  return {
    viewport: base.viewport,
    strokes: [...(base.strokes ?? []), ...(incoming.strokes ?? [])],
    stickies: [...(base.stickies ?? []), ...(incoming.stickies ?? [])],
    shapes: [...(base.shapes ?? []), ...(incoming.shapes ?? [])],
  };
}

export function hasCanvasContent(canvas?: InfiniteCanvasData): boolean {
  if (!canvas) return false;
  return (
    (canvas.stickies?.length ?? 0) > 0 ||
    (canvas.shapes?.length ?? 0) > 0 ||
    (canvas.strokes?.length ?? 0) > 0
  );
}

export function canvasToDecorations(canvas: InfiniteCanvasData): PageDecoration[] {
  const decorations: PageDecoration[] = [];
  for (const sticky of canvas.stickies ?? []) {
    decorations.push({
      id: sticky.id,
      kind: "sticky",
      x: sticky.x,
      y: sticky.y,
      w: sticky.width,
      h: sticky.height,
      text: sticky.text,
      color: sticky.color,
    });
  }
  for (const shape of canvas.shapes ?? []) {
    decorations.push({
      id: shape.id,
      kind: "shape_rect",
      x: shape.x,
      y: shape.y,
      w: shape.w,
      h: shape.h,
      color: shape.color,
    });
  }
  return decorations;
}

export function buildWhiteboardStarter(starterId: string): InfiniteCanvasData {
  const base = emptyCanvas();

  switch (starterId) {
    case "flowchart":
      return {
        ...base,
        shapes: [
          rect("s1", 80, 80, 120, 56),
          rect("s2", 280, 80, 120, 56),
          rect("s3", 480, 80, 120, 56),
        ],
        stickies: [
          sticky("t1", 100, 96, "Start"),
          sticky("t2", 300, 96, "Step"),
          sticky("t3", 500, 96, "End"),
        ],
      };
    case "mindmap":
      return {
        ...base,
        stickies: [
          sticky("center", 320, 220, "Main idea", "#bfdbfe"),
          sticky("b1", 120, 120, "Branch 1", "#fde68a"),
          sticky("b2", 520, 120, "Branch 2", "#bbf7d0"),
          sticky("b3", 120, 340, "Branch 3", "#fecdd3"),
          sticky("b4", 520, 340, "Branch 4", "#e9d5ff"),
        ],
      };
    case "standup":
      return {
        ...base,
        stickies: [
          sticky("y", 60, 100, "Yesterday", "#e0f2fe"),
          sticky("t", 280, 100, "Today", "#fef08a"),
          sticky("b", 500, 100, "Blockers", "#fecdd3"),
        ],
      };
    case "kwl":
      return {
        ...base,
        stickies: [
          sticky("k", 40, 100, "Know", "#bbf7d0"),
          sticky("w", 280, 100, "Want to know", "#fef08a"),
          sticky("l", 520, 100, "Learned", "#bfdbfe"),
        ],
        shapes: [
          rect("kbox", 24, 88, 200, 280, "#15803d"),
          rect("wbox", 264, 88, 200, 280, "#ea580c"),
          rect("lbox", 504, 88, 200, 280, "#0369a1"),
        ],
      };
    case "brainstorm":
      return {
        ...base,
        stickies: [
          sticky("topic", 300, 200, "Topic", "#fde68a"),
          sticky("i1", 80, 80, "Idea"),
          sticky("i2", 520, 80, "Idea"),
          sticky("i3", 80, 320, "Idea"),
          sticky("i4", 520, 320, "Idea"),
        ],
      };
    case "swot":
      return {
        ...base,
        stickies: [
          sticky("s", 80, 80, "Strengths", "#bbf7d0"),
          sticky("w", 400, 80, "Weaknesses", "#fecdd3"),
          sticky("o", 80, 280, "Opportunities", "#bfdbfe"),
          sticky("t", 400, 280, "Threats", "#fde68a"),
        ],
        shapes: [
          rect("swot1", 40, 40, 320, 200, "#15803d"),
          rect("swot2", 380, 40, 320, 200, "#e11d48"),
          rect("swot3", 40, 260, 320, 200, "#0369a1"),
          rect("swot4", 380, 260, 320, 200, "#ea580c"),
        ],
      };
    case "spider":
      return {
        ...base,
        stickies: [
          sticky("c", 300, 200, "Topic", "#fde68a"),
          sticky("a1", 300, 40, "Aspect"),
          sticky("a2", 500, 120, "Aspect"),
          sticky("a3", 500, 300, "Aspect"),
          sticky("a4", 300, 380, "Aspect"),
          sticky("a5", 100, 300, "Aspect"),
          sticky("a6", 100, 120, "Aspect"),
        ],
      };
    case "plain":
    default:
      return base;
  }
}

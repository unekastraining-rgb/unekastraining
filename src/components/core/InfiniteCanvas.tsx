"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, StickyNote } from "lucide-react";

import type { CanvasShape, CanvasSticky, InfiniteCanvasData, SketchStroke } from "@/lib/core/note-types";
import {
  computeCanvasBufferPixels,
  resolveCanvasCssSize,
} from "@/lib/core/canvas-buffer-size";
import {
  drawShape,
  drawStroke,
  drawStrokes,
  eraseAtPoint,
  normalizePressure,
  pointerFromEvent,
  selectStrokesInLasso,
  shouldRejectPointer,
  strokeColor,
  strokeOpacity,
  strokeWidth,
  translateStrokes,
  type InkTool,
  type ShapeKind,
} from "@/lib/core/ink-engine";

const GRID = 40;

export function InfiniteCanvas({
  data,
  onChange,
  active,
  inkTool,
  color,
  lineWidth,
  pencilOnly,
  shapeKind = "rect",
  dark = false,
}: {
  data: InfiniteCanvasData;
  onChange: (data: InfiniteCanvasData) => void;
  active: boolean;
  inkTool: InkTool;
  color: string;
  lineWidth: number;
  pencilOnly: boolean;
  shapeKind?: ShapeKind;
  dark?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const panning = useRef(false);
  const panStart = useRef({ x: 0, y: 0, vx: 0, vy: 0 });
  const currentStroke = useRef<SketchStroke | null>(null);
  const lassoPoints = useRef<Array<{ x: number; y: number }>>([]);
  const shapeStart = useRef<{ x: number; y: number } | null>(null);
  const liveShape = useRef<CanvasShape | null>(null);
  const [selectedStrokeIds, setSelectedStrokeIds] = useState<Set<string>>(new Set());
  const dragSelection = useRef<{ x: number; y: number } | null>(null);
  const spaceHeld = useRef(false);
  const activeTouches = useRef(new Set<number>());
  const multiTouchPan = useRef(false);

  const { viewport, strokes, stickies, shapes } = data;

  const screenToWorld = useCallback(
    (clientX: number, clientY: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      return {
        x: (clientX - rect.left - viewport.x) / viewport.scale,
        y: (clientY - rect.top - viewport.y) / viewport.scale,
      };
    },
    [viewport],
  );

  const patch = useCallback(
    (partial: Partial<InfiniteCanvasData>) => {
      onChange({ ...data, ...partial });
    },
    [data, onChange],
  );

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = container.getBoundingClientRect();
    const measured = resolveCanvasCssSize({
      measureClientWidth: rect.width,
      measureClientHeight: rect.height,
      canvasClientWidth: canvas.clientWidth,
      canvasClientHeight: canvas.clientHeight,
    });
    const { cssW, cssH } = measured;
    const { bw, bh, ratio } = computeCanvasBufferPixels(
      cssW,
      cssH,
      window.devicePixelRatio || 1,
    );
    canvas.width = bw;
    canvas.height = bh;
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    // Desk surface behind the infinite board (GoodNotes-adjacent, not flat white Notion).
    ctx.fillStyle = dark ? "#0c0a09" : "#e7e5e4";
    ctx.fillRect(0, 0, cssW, cssH);
    if (!dark) {
      const wash = ctx.createRadialGradient(
        cssW * 0.35,
        cssH * 0.2,
        40,
        cssW * 0.5,
        cssH * 0.45,
        Math.max(cssW, cssH) * 0.75,
      );
      wash.addColorStop(0, "rgba(255,255,255,0.35)");
      wash.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = wash;
      ctx.fillRect(0, 0, cssW, cssH);
    }

    ctx.save();
    ctx.translate(viewport.x, viewport.y);
    ctx.scale(viewport.scale, viewport.scale);

    // Soft paper sheet under the origin so ink sits on a page, not empty void.
    const sheetW = 816;
    const sheetH = 1056;
    ctx.save();
    ctx.shadowColor = dark ? "rgba(0,0,0,0.55)" : "rgba(28,25,23,0.18)";
    ctx.shadowBlur = 28 / viewport.scale;
    ctx.shadowOffsetY = 10 / viewport.scale;
    ctx.fillStyle = dark ? "#1c1917" : "#fffdf9";
    ctx.fillRect(0, 0, sheetW, sheetH);
    ctx.restore();
    ctx.strokeStyle = dark ? "rgba(255,255,255,0.06)" : "rgba(120,113,108,0.12)";
    ctx.lineWidth = 1 / viewport.scale;
    ctx.strokeRect(0, 0, sheetW, sheetH);

    const gridExtent = 4000;
    ctx.strokeStyle = dark ? "#44403c" : "#d6d3d1";
    ctx.lineWidth = 1 / viewport.scale;
    ctx.globalAlpha = 0.45;
    for (let x = -gridExtent; x <= gridExtent; x += GRID) {
      ctx.beginPath();
      ctx.moveTo(x, -gridExtent);
      ctx.lineTo(x, gridExtent);
      ctx.stroke();
    }
    for (let y = -gridExtent; y <= gridExtent; y += GRID) {
      ctx.beginPath();
      ctx.moveTo(-gridExtent, y);
      ctx.lineTo(gridExtent, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    for (const shape of shapes) {
      drawShape(ctx, shape);
    }
    if (liveShape.current) {
      drawShape(ctx, liveShape.current);
    }

    drawStrokes(ctx, strokes, cssW, cssH);
    if (currentStroke.current) {
      drawStroke(ctx, currentStroke.current);
    }

    for (const sticky of stickies) {
      ctx.fillStyle = sticky.color;
      ctx.fillRect(sticky.x, sticky.y, sticky.width, sticky.height);
      ctx.strokeStyle = "#d6d3d1";
      ctx.lineWidth = 1 / viewport.scale;
      ctx.strokeRect(sticky.x, sticky.y, sticky.width, sticky.height);
      ctx.fillStyle = "#292524";
      ctx.font = `${14 / viewport.scale}px sans-serif`;
      const lines = sticky.text.split("\n").slice(0, 6);
      lines.forEach((line, index) => {
        ctx.fillText(line.slice(0, 40), sticky.x + 8, sticky.y + 20 + index * 18);
      });
    }

    if (lassoPoints.current.length > 1) {
      ctx.strokeStyle = "#0d9488";
      ctx.lineWidth = 1.5 / viewport.scale;
      ctx.setLineDash([6 / viewport.scale, 4 / viewport.scale]);
      ctx.beginPath();
      lassoPoints.current.forEach((point, index) => {
        if (index === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
  }, [dark, shapes, stickies, strokes, viewport]);

  useEffect(() => {
    redraw();
    const container = containerRef.current;
    const observer =
      typeof ResizeObserver !== "undefined" && container
        ? new ResizeObserver(() => redraw())
        : null;
    if (container) observer?.observe(container);
    window.addEventListener("resize", redraw);
    const raf = window.requestAnimationFrame(() => redraw());
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", redraw);
      window.cancelAnimationFrame(raf);
    };
  }, [redraw]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.code === "Space") spaceHeld.current = true;
    }
    function onKeyUp(event: KeyboardEvent) {
      if (event.code === "Space") spaceHeld.current = false;
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    function onWheel(event: WheelEvent) {
      event.preventDefault();
      const rect = container!.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      const delta = event.deltaY > 0 ? 0.92 : 1.08;
      const nextScale = Math.min(3, Math.max(0.25, viewport.scale * delta));
      const worldX = (mouseX - viewport.x) / viewport.scale;
      const worldY = (mouseY - viewport.y) / viewport.scale;
      patch({
        viewport: {
          scale: nextScale,
          x: mouseX - worldX * nextScale,
          y: mouseY - worldY * nextScale,
        },
      });
    }
    container.addEventListener("wheel", onWheel, { passive: false });
    return () => container.removeEventListener("wheel", onWheel);
  }, [patch, viewport]);

  function abortInProgressStroke() {
    drawing.current = false;
    currentStroke.current = null;
    lassoPoints.current = [];
    liveShape.current = null;
    shapeStart.current = null;
    redraw();
  }

  function finishStroke() {
    if (!drawing.current) return;
    drawing.current = false;

    if (inkTool === "lasso" && lassoPoints.current.length > 2) {
      const selected = selectStrokesInLasso(strokes, lassoPoints.current);
      setSelectedStrokeIds(
        new Set(
          selected.map((stroke, index) => stroke.id ?? `s${strokes.indexOf(stroke)}`),
        ),
      );
      lassoPoints.current = [];
      redraw();
      return;
    }

    if (inkTool === "shape" && liveShape.current) {
      patch({ shapes: [...shapes, liveShape.current] });
      liveShape.current = null;
      shapeStart.current = null;
      return;
    }

    if (inkTool === "eraser" && currentStroke.current) {
      const last = currentStroke.current.points.at(-1);
      if (last) {
        const radius = strokeWidth(lineWidth, last.pressure ?? 0.5, "eraser");
        patch({ strokes: eraseAtPoint(strokes, last.x, last.y, radius) });
      }
      currentStroke.current = null;
      return;
    }

    if (currentStroke.current && currentStroke.current.points.length > 0) {
      const id = `stroke-${Date.now()}`;
      patch({ strokes: [...strokes, { ...currentStroke.current, id }] });
    }
    currentStroke.current = null;
  }

  function addSticky() {
    const sticky: CanvasSticky = {
      id: `sticky-${Date.now()}`,
      x: (-viewport.x + 120) / viewport.scale,
      y: (-viewport.y + 120) / viewport.scale,
      width: 180,
      height: 140,
      text: "New idea",
      color: "#fef08a",
    };
    patch({ stickies: [...stickies, sticky] });
  }

  return (
    <div
      data-infinite-canvas
      className={`relative flex h-full min-h-[28rem] flex-col ${
        dark ? "bg-stone-950 text-stone-100" : ""
      }`}
    >
      <div
        className={`flex flex-wrap gap-2 border-b px-3 py-2 ${
          dark ? "border-stone-800" : "border-orange-100"
        }`}
      >
        <button
          type="button"
          onClick={addSticky}
          className="inline-flex items-center gap-1 rounded-lg bg-amber-100 px-2.5 py-1.5 text-xs font-semibold text-amber-900"
        >
          <StickyNote className="h-3.5 w-3.5" /> Sticky
        </button>
        <button
          type="button"
          onClick={() => patch({ viewport: { x: 0, y: 0, scale: 1 } })}
          className="rounded-lg border border-orange-100 px-2.5 py-1.5 text-xs font-semibold text-stone-600"
        >
          Reset view
        </button>
        <span className="ml-auto text-xs text-stone-500">
          {Math.round(viewport.scale * 100)}% · Space+drag to pan · Scroll to zoom
        </span>
      </div>
      <div
        ref={containerRef}
        className={`relative min-h-0 flex-1 overflow-hidden ${
          dark ? "bg-stone-950" : "bg-[#e7e5e4]"
        }`}
      >
        <canvas
          ref={canvasRef}
          data-ink-canvas
          className={`absolute inset-0 h-full w-full ${
            active
              ? pencilOnly
                ? "cursor-crosshair"
                : "cursor-crosshair touch-none"
              : "pointer-events-none"
          } ${inkTool === "hand" ? "cursor-grab" : ""}`}
          style={active ? { touchAction: "none" } : undefined}
          onPointerDown={(event) => {
            if (!active) return;
            const world = screenToWorld(event.clientX, event.clientY);

            if (event.pointerType === "touch") {
              activeTouches.current.add(event.pointerId);
            }

            if (inkTool === "hand" || spaceHeld.current || event.button === 1) {
              panning.current = true;
              panStart.current = {
                x: event.clientX,
                y: event.clientY,
                vx: viewport.x,
                vy: viewport.y,
              };
              canvasRef.current?.setPointerCapture(event.pointerId);
              return;
            }

            // Pencil-only: finger pans the infinite canvas instead of inking.
            if (shouldRejectPointer(event, pencilOnly)) {
              panning.current = true;
              panStart.current = {
                x: event.clientX,
                y: event.clientY,
                vx: viewport.x,
                vy: viewport.y,
              };
              canvasRef.current?.setPointerCapture(event.pointerId);
              return;
            }

            // Two-finger pan while finger-writing (whiteboard / no Pencil).
            if (event.pointerType === "touch" && activeTouches.current.size > 1) {
              if (drawing.current) {
                if (canvasRef.current?.hasPointerCapture(event.pointerId)) {
                  try {
                    canvasRef.current.releasePointerCapture(event.pointerId);
                  } catch {
                    // ignore
                  }
                }
                abortInProgressStroke();
              }
              multiTouchPan.current = true;
              panning.current = true;
              panStart.current = {
                x: event.clientX,
                y: event.clientY,
                vx: viewport.x,
                vy: viewport.y,
              };
              return;
            }

            if (selectedStrokeIds.size > 0 && inkTool === "lasso") {
              dragSelection.current = world;
              canvasRef.current?.setPointerCapture(event.pointerId);
              return;
            }

            if (inkTool === "lasso") {
              drawing.current = true;
              lassoPoints.current = [world];
              return;
            }

            if (inkTool === "shape") {
              drawing.current = true;
              shapeStart.current = world;
              liveShape.current = {
                id: `shape-${Date.now()}`,
                kind: shapeKind,
                x: world.x,
                y: world.y,
                w: 0,
                h: 0,
                color,
                strokeWidth: lineWidth,
              };
              return;
            }

            if (inkTool === "eraser") {
              drawing.current = true;
              const pressure = normalizePressure(event.pressure, event.pointerType);
              const point = { ...world, pressure };
              const radius = strokeWidth(lineWidth, pressure, "eraser");
              patch({ strokes: eraseAtPoint(strokes, world.x, world.y, radius) });
              currentStroke.current = {
                color: "#000",
                width: lineWidth,
                points: [point],
                tool: "eraser",
              };
            } else if (inkTool === "pen" || inkTool === "highlighter") {
              drawing.current = true;
              const pressure = normalizePressure(event.pressure, event.pointerType);
              currentStroke.current = {
                id: `stroke-${Date.now()}`,
                color: strokeColor(color, inkTool),
                width: lineWidth,
                points: [{ ...world, pressure }],
                tool: inkTool,
                opacity: strokeOpacity(inkTool),
              };
            }

            canvasRef.current?.setPointerCapture(event.pointerId);
            event.preventDefault();
          }}
          onPointerMove={(event) => {
            if (panning.current) {
              const dx = event.clientX - panStart.current.x;
              const dy = event.clientY - panStart.current.y;
              patch({
                viewport: {
                  ...viewport,
                  x: panStart.current.vx + dx,
                  y: panStart.current.vy + dy,
                },
              });
              return;
            }

            // Second finger arrived mid-stroke — switch to pan.
            if (
              event.pointerType === "touch" &&
              activeTouches.current.size > 1 &&
              drawing.current
            ) {
              abortInProgressStroke();
              multiTouchPan.current = true;
              panning.current = true;
              panStart.current = {
                x: event.clientX,
                y: event.clientY,
                vx: viewport.x,
                vy: viewport.y,
              };
              return;
            }

            const world = screenToWorld(event.clientX, event.clientY);

            if (dragSelection.current && selectedStrokeIds.size > 0) {
              const dx = world.x - dragSelection.current.x;
              const dy = world.y - dragSelection.current.y;
              dragSelection.current = world;
              patch({
                strokes: translateStrokes(strokes, selectedStrokeIds, dx, dy),
              });
              redraw();
              return;
            }

            if (!drawing.current) return;

            if (inkTool === "lasso") {
              lassoPoints.current.push(world);
              redraw();
              return;
            }

            if (inkTool === "shape" && shapeStart.current && liveShape.current) {
              liveShape.current = {
                ...liveShape.current,
                w: world.x - shapeStart.current.x,
                h: world.y - shapeStart.current.y,
              };
              redraw();
              return;
            }

            if (inkTool === "eraser") {
              const pressure = normalizePressure(event.pressure, event.pointerType);
              const radius = strokeWidth(lineWidth, pressure, "eraser");
              patch({ strokes: eraseAtPoint(strokes, world.x, world.y, radius) });
              currentStroke.current?.points.push({ ...world, pressure });
              redraw();
              return;
            }

            if (currentStroke.current) {
              const pressure = normalizePressure(event.pressure, event.pointerType);
              currentStroke.current.points.push({ ...world, pressure });
              redraw();
            }
          }}
          onPointerUp={(event) => {
            if (event.pointerType === "touch") {
              activeTouches.current.delete(event.pointerId);
            }
            if (canvasRef.current?.hasPointerCapture(event.pointerId)) {
              canvasRef.current.releasePointerCapture(event.pointerId);
            }
            if (multiTouchPan.current) {
              if (activeTouches.current.size === 0) {
                multiTouchPan.current = false;
                panning.current = false;
              }
              return;
            }
            panning.current = false;
            dragSelection.current = null;
            finishStroke();
          }}
          onPointerCancel={(event) => {
            if (event.pointerType === "touch") {
              activeTouches.current.delete(event.pointerId);
            }
            multiTouchPan.current = false;
            panning.current = false;
            dragSelection.current = null;
            finishStroke();
          }}
        />
      </div>
      {stickies.length > 0 ? (
        <div className="border-t border-orange-100 px-3 py-2 text-xs text-stone-500">
          {stickies.length} sticky note{stickies.length === 1 ? "" : "s"} on canvas
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef } from "react";

import type { SketchPoint, SketchStroke } from "@/lib/core/note-types";
import {
  drawStroke,
  drawStrokes,
  eraseAtPoint,
  lassoPolygonFromRect,
  pointerFromEvent,
  shouldRejectPointer,
  strokeColor,
  strokeOpacity,
  strokeWidth,
  type InkTool,
} from "@/lib/core/ink-engine";
import type { LassoMode } from "@/lib/core/core-toolbar-types";

export function SketchLayer({
  strokes,
  onChange,
  active,
  color = "#1c1917",
  lineWidth = 4,
  inkTool = "pen",
  pencilOnly = true,
  lassoMode = "freehand",
  highlightedStrokeIds,
  onLassoComplete,
  className = "",
}: {
  strokes: SketchStroke[];
  onChange: (strokes: SketchStroke[]) => void;
  active: boolean;
  color?: string;
  lineWidth?: number;
  inkTool?: InkTool;
  pencilOnly?: boolean;
  lassoMode?: LassoMode;
  highlightedStrokeIds?: Set<string>;
  onLassoComplete?: (lasso: SketchPoint[]) => void;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const currentStroke = useRef<SketchStroke | null>(null);
  const lassoPoints = useRef<SketchPoint[]>([]);
  const lassoStart = useRef<SketchPoint | null>(null);
  const liveStrokes = useRef(strokes);

  useEffect(() => {
    liveStrokes.current = strokes;
  }, [strokes]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const rendered = liveStrokes.current.map((stroke, index) => {
      const id = stroke.id ?? `s${index}`;
      if (!highlightedStrokeIds?.has(id)) return stroke;
      return {
        ...stroke,
        color: "#0d9488",
        width: stroke.width + 1,
      };
    });
    drawStrokes(ctx, rendered, rect.width, rect.height);

    if (currentStroke.current) {
      drawStroke(ctx, currentStroke.current);
    }

    if (lassoPoints.current.length > 1) {
      ctx.save();
      ctx.strokeStyle = "#0d9488";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      lassoPoints.current.forEach((point, index) => {
        if (index === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      if (lassoMode === "freehand" && lassoPoints.current.length > 2) {
        const first = lassoPoints.current[0];
        ctx.lineTo(first.x, first.y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
  }, [highlightedStrokeIds, lassoMode]);

  useEffect(() => {
    redraw();
    window.addEventListener("resize", redraw);
    return () => window.removeEventListener("resize", redraw);
  }, [redraw, strokes]);

  function finishStroke() {
    if (!drawing.current) return;
    drawing.current = false;

    if (inkTool === "lasso" && lassoPoints.current.length > 2) {
      onLassoComplete?.(lassoPoints.current);
      lassoPoints.current = [];
      lassoStart.current = null;
      redraw();
      return;
    }

    if (inkTool === "eraser" && currentStroke.current) {
      const last = currentStroke.current.points.at(-1);
      if (last) {
        const radius = strokeWidth(lineWidth, last.pressure ?? 0.5, "eraser");
        onChange(eraseAtPoint(liveStrokes.current, last.x, last.y, radius));
      }
      currentStroke.current = null;
      return;
    }

    if (currentStroke.current && currentStroke.current.points.length > 0) {
      onChange([...liveStrokes.current, currentStroke.current]);
    }
    currentStroke.current = null;
  }

  const inkActive =
    active &&
    (inkTool === "pen" ||
      inkTool === "highlighter" ||
      inkTool === "eraser" ||
      inkTool === "lasso");

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 h-full w-full ${
        inkActive ? "cursor-crosshair touch-none" : "pointer-events-none"
      } ${className}`}
      style={inkActive ? { touchAction: "none" } : undefined}
      onPointerDown={(event) => {
        if (!inkActive) return;
        if (shouldRejectPointer(event, pencilOnly)) return;

        const rect = canvasRef.current!.getBoundingClientRect();
        const point = pointerFromEvent(event, rect);

        if (inkTool === "lasso") {
          drawing.current = true;
          lassoStart.current = point;
          lassoPoints.current =
            lassoMode === "rect" ? lassoPolygonFromRect(point, point) : [point];
          canvasRef.current?.setPointerCapture(event.pointerId);
          event.preventDefault();
          return;
        }

        if (inkTool !== "pen" && inkTool !== "highlighter" && inkTool !== "eraser") return;

        if (inkTool === "eraser") {
          drawing.current = true;
          currentStroke.current = {
            color: "#000000",
            width: lineWidth,
            points: [point],
            tool: "eraser",
          };
          const radius = strokeWidth(lineWidth, point.pressure ?? 0.5, "eraser");
          onChange(eraseAtPoint(liveStrokes.current, point.x, point.y, radius));
        } else {
          drawing.current = true;
          currentStroke.current = {
            color: strokeColor(color, inkTool),
            width: lineWidth,
            points: [point],
            tool: inkTool,
            opacity: strokeOpacity(inkTool),
          };
        }

        canvasRef.current?.setPointerCapture(event.pointerId);
        event.preventDefault();
      }}
      onPointerMove={(event) => {
        if (!inkActive || !drawing.current) return;
        if (shouldRejectPointer(event, pencilOnly)) return;

        const rect = canvasRef.current!.getBoundingClientRect();
        const point = pointerFromEvent(event, rect);

        if (inkTool === "lasso") {
          if (lassoMode === "rect" && lassoStart.current) {
            lassoPoints.current = lassoPolygonFromRect(lassoStart.current, point);
          } else {
            lassoPoints.current.push(point);
          }
          redraw();
          event.preventDefault();
          return;
        }

        if (inkTool === "eraser") {
          const radius = strokeWidth(lineWidth, point.pressure ?? 0.5, "eraser");
          onChange(eraseAtPoint(liveStrokes.current, point.x, point.y, radius));
          currentStroke.current?.points.push(point);
          redraw();
          return;
        }

        if (!currentStroke.current) return;
        currentStroke.current.points.push(point);
        redraw();
        event.preventDefault();
      }}
      onPointerUp={(event) => {
        if (canvasRef.current?.hasPointerCapture(event.pointerId)) {
          canvasRef.current.releasePointerCapture(event.pointerId);
        }
        finishStroke();
      }}
      onPointerCancel={finishStroke}
    />
  );
}

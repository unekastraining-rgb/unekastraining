"use client";

import { useCallback, useEffect, useRef } from "react";

import type { SketchStroke } from "@/lib/core/note-types";
import {
  drawStroke,
  drawStrokes,
  eraseAtPoint,
  pointerFromEvent,
  shouldRejectPointer,
  strokeColor,
  strokeOpacity,
  strokeWidth,
  type InkTool,
} from "@/lib/core/ink-engine";

export function SketchLayer({
  strokes,
  onChange,
  active,
  color = "#1c1917",
  lineWidth = 4,
  inkTool = "pen",
  pencilOnly = true,
  className = "",
}: {
  strokes: SketchStroke[];
  onChange: (strokes: SketchStroke[]) => void;
  active: boolean;
  color?: string;
  lineWidth?: number;
  inkTool?: InkTool;
  pencilOnly?: boolean;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const currentStroke = useRef<SketchStroke | null>(null);
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
    drawStrokes(ctx, liveStrokes.current, rect.width, rect.height);

    if (currentStroke.current) {
      drawStroke(ctx, currentStroke.current);
    }
  }, []);

  useEffect(() => {
    redraw();
    window.addEventListener("resize", redraw);
    return () => window.removeEventListener("resize", redraw);
  }, [redraw, strokes]);

  function finishStroke() {
    if (!drawing.current) return;
    drawing.current = false;

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

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 h-full w-full ${active ? "cursor-crosshair touch-none" : "pointer-events-none"} ${className}`}
      style={active ? { touchAction: "none" } : undefined}
      onPointerDown={(event) => {
        if (!active) return;
        if (inkTool !== "pen" && inkTool !== "highlighter" && inkTool !== "eraser") return;
        if (shouldRejectPointer(event, pencilOnly)) return;

        const rect = canvasRef.current!.getBoundingClientRect();
        const point = pointerFromEvent(event, rect);

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
        if (!active || !drawing.current) return;
        if (shouldRejectPointer(event, pencilOnly)) return;

        const rect = canvasRef.current!.getBoundingClientRect();
        const point = pointerFromEvent(event, rect);

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

"use client";

import { useCallback, useEffect, useRef } from "react";

import type { SketchPoint, SketchStroke } from "@/lib/core/note-types";
import {
  computeCanvasBufferPixels,
  resolveCanvasCssSize,
} from "@/lib/core/canvas-buffer-size";
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

function pageScrollport(from: HTMLElement | null): HTMLElement | null {
  return from?.closest("[data-page-scrollport]") as HTMLElement | null;
}

export function SketchLayer({
  strokes,
  onChange,
  active,
  color = "#1c1917",
  lineWidth = 4,
  inkTool = "pen",
  pencilOnly = false,
  lassoMode = "freehand",
  highlightedStrokeIds,
  onLassoComplete,
  onPenDetected,
  pressureSensitivity = 70,
  tipFlatness = 35,
  tipSharpness = 65,
  strokeType = "solid" as const,
  reduceLatency = true,
  inkMedium = "ink" as const,
  fillPattern = "solid" as const,
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
  /** Fired once when a stylus/pen pointer is seen (iPad hybrid). */
  onPenDetected?: () => void;
  pressureSensitivity?: number;
  tipFlatness?: number;
  tipSharpness?: number;
  strokeType?: "solid" | "dashed" | "dotted";
  reduceLatency?: boolean;
  inkMedium?: "ink" | "chalk" | "crayon" | "colorPencil" | "marker";
  fillPattern?: "solid" | "stripes" | "bubbles" | "dots" | "grid";
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const currentStroke = useRef<SketchStroke | null>(null);
  const lassoPoints = useRef<SketchPoint[]>([]);
  const lassoStart = useRef<SketchPoint | null>(null);
  const liveStrokes = useRef(strokes);
  const rafId = useRef<number | null>(null);
  const bufferSize = useRef({ w: 0, h: 0, cssW: 0, cssH: 0 });
  const activeTouches = useRef(new Set<number>());
  const panLast = useRef<{ x: number; y: number } | null>(null);
  const panning = useRef(false);
  const spaceHeld = useRef(false);
  const eraserDirty = useRef(false);
  const penNotified = useRef(false);
  const drawingPointerId = useRef<number | null>(null);
  const committedStrokes = useRef(strokes);

  useEffect(() => {
    liveStrokes.current = strokes;
    committedStrokes.current = strokes;
  }, [strokes]);

  // Space+drag pans the page scrollport (GoodNotes-adjacent; same as infinite canvas).
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.code !== "Space") return;
      const target = event.target as HTMLElement | null;
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable
      ) {
        return;
      }
      spaceHeld.current = true;
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

  const ensureBuffer = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Measure the page sheet — not just the canvas parent. Absolute children
    // can leave parent.clientHeight=0 on first paint (iPad), which produced a
    // blank ink layer even when strokes were loaded.
    const measureEl =
      (canvas.closest("[data-page-canvas]") as HTMLElement | null) ||
      (canvas.closest("[data-notebook-paper]") as HTMLElement | null) ||
      canvas.parentElement;
    const measured = resolveCanvasCssSize({
      measureClientWidth: measureEl?.clientWidth,
      measureClientHeight: measureEl?.clientHeight,
      canvasClientWidth: canvas.clientWidth,
      canvasClientHeight: canvas.clientHeight,
    });
    const { cssW, cssH } = measured;
    const { bw, bh } = computeCanvasBufferPixels(
      cssW,
      cssH,
      window.devicePixelRatio || 1,
    );

    // Avoid clearing the buffer on every pointer move (huge latency win).
    if (bufferSize.current.w !== bw || bufferSize.current.h !== bh) {
      canvas.width = bw;
      canvas.height = bh;
      bufferSize.current = { w: bw, h: bh, cssW, cssH };
    } else if (
      bufferSize.current.cssW !== cssW ||
      bufferSize.current.cssH !== cssH
    ) {
      bufferSize.current.cssW = cssW;
      bufferSize.current.cssH = cssH;
    }

    // Match CSS display size to the measured parent so the bitmap isn't stretched.
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;

    ctx.setTransform(bw / cssW, 0, 0, bh / cssH, 0, 0);
    return { ctx, cssW, cssH };
  }, []);

  const paintFrame = useCallback(() => {
    const ready = ensureBuffer();
    if (!ready) return;
    const { ctx, cssW, cssH } = ready;
    ctx.clearRect(0, 0, cssW, cssH);

    const rendered = liveStrokes.current.map((stroke, index) => {
      const id = stroke.id ?? `s${index}`;
      if (!highlightedStrokeIds?.has(id)) return stroke;
      return {
        ...stroke,
        color: "#0d9488",
        width: stroke.width + 1,
      };
    });
    drawStrokes(ctx, rendered, cssW, cssH);

    if (currentStroke.current && currentStroke.current.tool !== "eraser") {
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
        const first = lassoPoints.current[0]!;
        ctx.lineTo(first.x, first.y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
  }, [ensureBuffer, highlightedStrokeIds, lassoMode]);

  const schedulePaint = useCallback(() => {
    if (rafId.current != null) return;
    rafId.current = requestAnimationFrame(() => {
      rafId.current = null;
      paintFrame();
    });
  }, [paintFrame]);

  const redraw = useCallback(() => {
    if (rafId.current != null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
    paintFrame();
  }, [paintFrame]);

  useEffect(() => {
    redraw();
    const canvas = canvasRef.current;
    const observeTarget =
      (canvas?.closest("[data-page-canvas]") as HTMLElement | null) ||
      (canvas?.closest("[data-notebook-paper]") as HTMLElement | null) ||
      canvas?.parentElement;
    const observer =
      typeof ResizeObserver !== "undefined" && observeTarget
        ? new ResizeObserver(() => {
            bufferSize.current = { w: 0, h: 0, cssW: 0, cssH: 0 };
            redraw();
          })
        : null;
    if (observeTarget) observer?.observe(observeTarget);
    window.addEventListener("resize", redraw);
    // Second paint after layout — iOS often reports 0×0 on the first frame.
    const raf = window.requestAnimationFrame(() => {
      bufferSize.current = { w: 0, h: 0, cssW: 0, cssH: 0 };
      redraw();
    });
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", redraw);
      window.cancelAnimationFrame(raf);
      if (rafId.current != null) cancelAnimationFrame(rafId.current);
    };
  }, [redraw, strokes]);

  function abortInProgressStroke() {
    drawing.current = false;
    currentStroke.current = null;
    lassoPoints.current = [];
    lassoStart.current = null;
    eraserDirty.current = false;
    if (
      drawingPointerId.current != null &&
      canvasRef.current?.hasPointerCapture(drawingPointerId.current)
    ) {
      try {
        canvasRef.current.releasePointerCapture(drawingPointerId.current);
      } catch {
        // ignore
      }
    }
    drawingPointerId.current = null;
    // Restore last committed strokes if we were mid-erase preview.
    liveStrokes.current = committedStrokes.current;
    redraw();
  }

  function finishStroke() {
    panning.current = false;
    if (!drawing.current) {
      panLast.current = null;
      return;
    }
    drawing.current = false;
    drawingPointerId.current = null;
    panLast.current = null;

    if (inkTool === "lasso" && lassoPoints.current.length > 2) {
      onLassoComplete?.(lassoPoints.current);
      lassoPoints.current = [];
      lassoStart.current = null;
      redraw();
      return;
    }

    if (inkTool === "eraser") {
      if (eraserDirty.current) {
        onChange(liveStrokes.current);
        eraserDirty.current = false;
      }
      currentStroke.current = null;
      return;
    }

    if (currentStroke.current && currentStroke.current.points.length > 0) {
      onChange([...liveStrokes.current, currentStroke.current]);
    }
    currentStroke.current = null;
  }

  function appendPointerSamples(
    event: React.PointerEvent<HTMLCanvasElement>,
    rect: DOMRect,
  ) {
    const coalesced =
      typeof event.nativeEvent.getCoalescedEvents === "function"
        ? event.nativeEvent.getCoalescedEvents()
        : [event.nativeEvent];
    for (const sample of coalesced) {
      const point = pointerFromEvent(sample, rect);
      if (inkTool === "lasso") {
        if (lassoMode === "rect" && lassoStart.current) {
          lassoPoints.current = lassoPolygonFromRect(lassoStart.current, point);
        } else {
          lassoPoints.current.push(point);
        }
        continue;
      }
      if (inkTool === "eraser") {
        const radius = eraseRadius(point.pressure ?? 0.5);
        liveStrokes.current = eraseAtPoint(
          liveStrokes.current,
          point.x,
          point.y,
          radius,
        );
        eraserDirty.current = true;
        currentStroke.current?.points.push(point);
        continue;
      }
      currentStroke.current?.points.push(point);
    }
  }

  const inkActive =
    active &&
    (inkTool === "pen" ||
      inkTool === "highlighter" ||
      inkTool === "eraser" ||
      inkTool === "lasso");
  // Hand tool must receive pointers (otherwise pointer-events-none kills pan on PDF/pages).
  const layerActive = active && (inkActive || inkTool === "hand");

  const strokeFeel = {
    pressureSensitivity,
    tipFlatness,
    tipSharpness,
    strokeType,
    reduceLatency,
    medium: inkMedium,
    fillPattern,
  };

  function eraseRadius(pressure: number) {
    return strokeWidth(lineWidth, pressure, "eraser", strokeFeel);
  }

  function beginScrollPan(
    event: React.PointerEvent<HTMLCanvasElement>,
  ): boolean {
    const wantPan =
      inkTool === "hand" || spaceHeld.current || event.button === 1;
    if (!wantPan) return false;
    panning.current = true;
    panLast.current = { x: event.clientX, y: event.clientY };
    canvasRef.current?.setPointerCapture(event.pointerId);
    event.preventDefault();
    return true;
  }

  const touchAction = !layerActive
    ? "pan-y"
    : // While inking, block browser scroll — pan-y was canceling finger strokes mid-draw on iOS.
      "none";

  const cursorClass = !layerActive
    ? "pointer-events-none"
    : inkTool === "hand"
      ? "cursor-grab touch-none active:cursor-grabbing"
      : "cursor-crosshair touch-none";

  // iOS Safari ignores touch-action alone and cancels pointers mid-stroke.
  // Non-passive touch listeners + preventDefault keep finger/Pencil ink alive.
  useEffect(() => {
    const el = canvasRef.current;
    if (!el || !inkActive) return;

    function blockBrowserGesture(event: TouchEvent) {
      if (event.cancelable) event.preventDefault();
    }

    el.addEventListener("touchstart", blockBrowserGesture, { passive: false });
    el.addEventListener("touchmove", blockBrowserGesture, { passive: false });
    return () => {
      el.removeEventListener("touchstart", blockBrowserGesture);
      el.removeEventListener("touchmove", blockBrowserGesture);
    };
  }, [inkActive]);

  return (
    <canvas
      ref={canvasRef}
      data-ink-canvas
      className={`absolute inset-0 h-full w-full ${cursorClass} ${className}`}
      style={touchAction ? { touchAction } : undefined}
      onPointerDown={(event) => {
        if (!layerActive) return;

        if (event.pointerType === "pen" && !penNotified.current) {
          penNotified.current = true;
          onPenDetected?.();
        }

        if (beginScrollPan(event)) return;

        if (!inkActive) return;

        if (event.pointerType === "touch") {
          activeTouches.current.add(event.pointerId);

          // Stylus mode: never capture finger — page scrollport pans.
          if (shouldRejectPointer(event, pencilOnly)) return;

          // Two-finger pan while finger-writing (phone / no Pencil).
          if (activeTouches.current.size > 1) {
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
            panLast.current = { x: event.clientX, y: event.clientY };
            return;
          }
        }

        if (shouldRejectPointer(event, pencilOnly)) return;

        const rect = canvasRef.current!.getBoundingClientRect();
        const point = pointerFromEvent(event, rect);

        if (inkTool === "lasso") {
          drawing.current = true;
          drawingPointerId.current = event.pointerId;
          lassoStart.current = point;
          lassoPoints.current =
            lassoMode === "rect" ? lassoPolygonFromRect(point, point) : [point];
          canvasRef.current?.setPointerCapture(event.pointerId);
          event.preventDefault();
          schedulePaint();
          return;
        }

        if (inkTool !== "pen" && inkTool !== "highlighter" && inkTool !== "eraser") return;

        if (inkTool === "eraser") {
          drawing.current = true;
          drawingPointerId.current = event.pointerId;
          eraserDirty.current = false;
          currentStroke.current = {
            color: "#000000",
            width: lineWidth,
            points: [point],
            tool: "eraser",
            feel: strokeFeel,
          };
          const radius = eraseRadius(point.pressure ?? 0.5);
          liveStrokes.current = eraseAtPoint(
            liveStrokes.current,
            point.x,
            point.y,
            radius,
          );
          eraserDirty.current = true;
        } else {
          drawing.current = true;
          drawingPointerId.current = event.pointerId;
          currentStroke.current = {
            color: strokeColor(color, inkTool),
            width: lineWidth,
            points: [point],
            tool: inkTool,
            opacity: strokeOpacity(inkTool, strokeFeel),
            feel: strokeFeel,
          };
        }

        canvasRef.current?.setPointerCapture(event.pointerId);
        event.preventDefault();
        schedulePaint();
      }}
      onPointerMove={(event) => {
        if (!layerActive) return;

        // Hand / Space / middle-button pan, or two-finger pan while writing.
        if (panning.current || (event.pointerType === "touch" && activeTouches.current.size > 1 && !pencilOnly)) {
          const port = pageScrollport(canvasRef.current);
          if (port && panLast.current) {
            port.scrollLeft += panLast.current.x - event.clientX;
            port.scrollTop += panLast.current.y - event.clientY;
          }
          panLast.current = { x: event.clientX, y: event.clientY };
          if (panning.current) event.preventDefault();
          return;
        }

        if (!inkActive || !drawing.current) return;
        if (shouldRejectPointer(event, pencilOnly)) return;

        const rect = canvasRef.current!.getBoundingClientRect();
        appendPointerSamples(event, rect);
        schedulePaint();
        event.preventDefault();
      }}
      onPointerUp={(event) => {
        if (event.pointerType === "touch") {
          activeTouches.current.delete(event.pointerId);
          if (activeTouches.current.size < 2) panLast.current = null;
        }
        if (canvasRef.current?.hasPointerCapture(event.pointerId)) {
          canvasRef.current.releasePointerCapture(event.pointerId);
        }
        finishStroke();
      }}
      onPointerCancel={(event) => {
        if (event.pointerType === "touch") {
          activeTouches.current.delete(event.pointerId);
          if (activeTouches.current.size < 2) panLast.current = null;
        }
        finishStroke();
      }}
    />
  );
}

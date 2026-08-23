"use client";

import { useRef, useState } from "react";

import { pointerToLocal } from "@/lib/core/canvas-transform";
import type { DecorationKind, PageDecoration, ShapeKind } from "@/lib/core/note-types";

function shapeKindToDecoration(kind: ShapeKind): DecorationKind {
  switch (kind) {
    case "ellipse":
      return "ellipse";
    case "line":
      return "line";
    case "arrow":
      return "arrow";
    case "triangle":
      return "triangle";
    default:
      return "shape_rect";
  }
}

export function ShapeDrawOverlay({
  active,
  shapeKind,
  color,
  onCreate,
}: {
  active: boolean;
  shapeKind: ShapeKind;
  color: string;
  onCreate: (decoration: Omit<PageDecoration, "id">) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [preview, setPreview] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);

  if (!active) return null;

  function onPointerDown(event: React.PointerEvent) {
    if (!containerRef.current) return;
    event.preventDefault();
    const start = pointerToLocal(event.clientX, event.clientY, containerRef.current);
    let current = { x: start.x, y: start.y, w: 0, h: 0 };

    function onMove(moveEvent: PointerEvent) {
      if (!containerRef.current) return;
      const point = pointerToLocal(
        moveEvent.clientX,
        moveEvent.clientY,
        containerRef.current,
      );
      current = {
        x: Math.min(start.x, point.x),
        y: Math.min(start.y, point.y),
        w: Math.abs(point.x - start.x),
        h: Math.abs(point.y - start.y),
      };
      setPreview({ ...current });
    }

    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      setPreview(null);
      if (current.w < 8 && current.h < 8) {
        onCreate({
          kind: shapeKindToDecoration(shapeKind),
          x: start.x - 40,
          y: start.y - 30,
          w: shapeKind === "line" || shapeKind === "arrow" ? 100 : 80,
          h: shapeKind === "line" || shapeKind === "arrow" ? 24 : 60,
          color,
        });
        return;
      }
      onCreate({
        kind: shapeKindToDecoration(shapeKind),
        x: current.x,
        y: current.y,
        w: Math.max(24, current.w),
        h: Math.max(24, current.h),
        color,
      });
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-[30] cursor-crosshair touch-none"
      onPointerDown={onPointerDown}
    >
      {preview ? (
        <div
          className="pointer-events-none absolute rounded-lg border-2 border-dashed border-orange-400 bg-orange-200/20"
          style={{
            left: preview.x,
            top: preview.y,
            width: preview.w,
            height: preview.h,
          }}
        />
      ) : null}
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";

import type { SketchStroke } from "@/lib/core/note-types";
import { drawStrokes } from "@/lib/core/ink-engine";
import {
  PAGE_WORLD_BASE_HEIGHT,
  PAGE_WORLD_BASE_WIDTH,
} from "@/lib/core/page-world";

/**
 * Lightweight FreeNotes-style preview of an inactive sheet (strokes only).
 * Clicking activates the real editor for that page.
 */
export function NotebookPagePreview({
  strokes,
  typed,
  pageNumber,
  label,
  onActivate,
  width = PAGE_WORLD_BASE_WIDTH,
  height = PAGE_WORLD_BASE_HEIGHT,
}: {
  strokes?: SketchStroke[];
  typed?: string;
  pageNumber: number;
  label?: string;
  onActivate: () => void;
  width?: number;
  height?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const typedPreview = typed?.replace(/\s+/g, " ").trim().slice(0, 180);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    if (strokes?.length) {
      drawStrokes(ctx, strokes, width, height);
    }
  }, [strokes, width, height]);

  return (
    <button
      type="button"
      onClick={onActivate}
      className="relative block h-full w-full touch-manipulation overflow-hidden text-left"
      aria-label={`Go to page ${pageNumber}${label ? ` — ${label}` : ""}`}
    >
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />
      {typedPreview ? (
        <p className="pointer-events-none absolute inset-x-4 top-10 line-clamp-6 text-left text-sm leading-relaxed text-stone-700/80">
          {typedPreview}
        </p>
      ) : null}
      <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-stone-900/70 px-2 py-0.5 text-[10px] font-bold text-white">
        {pageNumber}
      </span>
      <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-stone-900/25 to-transparent px-3 py-2 text-[11px] font-semibold text-stone-800">
        Tap to write
      </span>
    </button>
  );
}

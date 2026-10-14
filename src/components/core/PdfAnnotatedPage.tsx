"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { SketchStroke } from "@/lib/core/note-types";
import type { InkTool } from "@/lib/core/ink-engine";
import { SketchLayer } from "@/components/core/SketchLayer";
import { PdfPageCanvas } from "@/components/core/PdfPageCanvas";

/**
 * One PDF page bitmap + page-keyed ink (used in continuous scroll).
 */
export function PdfAnnotatedPage({
  materialId,
  doc,
  docVersion,
  pageNumber,
  zoom,
  active,
  inkTool,
  color,
  lineWidth,
  pencilOnly,
  onPencilOnlyChange,
  pressureSensitivity,
  tipFlatness,
  tipSharpness,
  strokeType,
  reduceLatency,
  inkMedium,
  onError,
}: {
  materialId: string;
  doc: import("@/lib/core/pdfjs-client").PdfDoc | null;
  docVersion: number;
  pageNumber: number;
  zoom: number;
  active: boolean;
  inkTool: InkTool;
  color: string;
  lineWidth: number;
  pencilOnly: boolean;
  onPencilOnlyChange: (value: boolean) => void;
  pressureSensitivity: number;
  tipFlatness: number;
  tipSharpness: number;
  strokeType: "solid" | "dashed" | "dotted";
  reduceLatency: boolean;
  inkMedium: "ink" | "chalk" | "crayon" | "colorPencil" | "marker";
  onError?: (message: string | null) => void;
}) {
  const [strokes, setStrokes] = useState<SketchStroke[]>([]);
  const [ready, setReady] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync UI state to props or external subscription
    setReady(false);
    void fetch(`/api/materials/${materialId}/annotations?page=${pageNumber}`)
      .then((response) => response.json())
      .then((data) => {
        if (cancelled) return;
        if (data.success) {
          setStrokes((data.data.strokes ?? []) as SketchStroke[]);
        } else {
          setStrokes([]);
        }
      })
      .catch(() => {
        if (!cancelled) setStrokes([]);
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [materialId, pageNumber]);

  const persistStrokes = useCallback(
    (nextStrokes: SketchStroke[]) => {
      setStrokes(nextStrokes);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        const rect = wrapRef.current?.querySelector("canvas")?.getBoundingClientRect();
        const viewport =
          rect && rect.width > 0 && rect.height > 0
            ? { width: rect.width, height: rect.height }
            : undefined;
        void fetch(`/api/materials/${materialId}/annotations`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pageNumber, strokes: nextStrokes, viewport }),
        }).catch(() => onError?.("Failed to save ink on this page."));
      }, 600);
    },
    [materialId, pageNumber, onError],
  );

  return (
    <div
      ref={wrapRef}
      data-pdf-page={pageNumber}
      className="relative mx-auto mb-4 w-full max-w-4xl scroll-mt-4"
    >
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-stone-500">
        Page {pageNumber}
      </div>
      <div
        data-notebook-paper="true"
        data-page-active={active ? "true" : undefined}
        className="overflow-hidden rounded-sm shadow-[0_10px_36px_rgba(28,25,23,0.16),0_2px_6px_rgba(28,25,23,0.08)] ring-1 ring-stone-900/10"
      >
        <PdfPageCanvas
          doc={doc}
          docVersion={docVersion}
          pageNumber={pageNumber}
          zoom={zoom}
          onError={onError}
        >
          <SketchLayer
            strokes={strokes}
            onChange={persistStrokes}
            active={active && ready}
            color={color}
            lineWidth={lineWidth}
            inkTool={inkTool}
            pencilOnly={pencilOnly}
            pressureSensitivity={pressureSensitivity}
            tipFlatness={tipFlatness}
            tipSharpness={tipSharpness}
            strokeType={strokeType}
            reduceLatency={reduceLatency}
            inkMedium={inkMedium}
            onPenDetected={() => {
              // Keep finger writing available — never auto Pencil-only on PDF.
            }}
            className="absolute inset-0 h-full w-full"
          />
        </PdfPageCanvas>
      </div>
    </div>
  );
}

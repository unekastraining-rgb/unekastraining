"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  Maximize2,
  Minimize2,
  Search,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import { InkToolbar } from "@/components/core/InkToolbar";
import { SketchLayer } from "@/components/core/SketchLayer";
import type { SketchStroke } from "@/lib/core/note-types";
import type { InkTool } from "@/lib/core/ink-engine";
import { useInkHistory } from "@/hooks/useInkHistory";

export function PdfInkViewer({
  materialId,
  active,
  inkTool: inkToolProp,
  onInkToolChange,
  color: colorProp,
  onColorChange,
  lineWidth: lineWidthProp,
  onLineWidthChange,
  pencilOnly: pencilOnlyProp,
  onPencilOnlyChange,
}: {
  materialId: string;
  active: boolean;
  inkTool?: InkTool;
  onInkToolChange?: (tool: InkTool) => void;
  color?: string;
  onColorChange?: (color: string) => void;
  lineWidth?: number;
  onLineWidthChange?: (size: number) => void;
  pencilOnly?: boolean;
  onPencilOnlyChange?: (value: boolean) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [search, setSearch] = useState("");
  const [extractedText, setExtractedText] = useState("");
  const [internalInkTool, setInternalInkTool] = useState<InkTool>("pen");
  const [internalColor, setInternalColor] = useState("#1c1917");
  const [internalLineWidth, setInternalLineWidth] = useState(4);
  const [internalPencilOnly, setInternalPencilOnly] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const viewerRef = useRef<HTMLDivElement>(null);

  const inkTool = inkToolProp ?? internalInkTool;
  const setInkTool = onInkToolChange ?? setInternalInkTool;
  const color = colorProp ?? internalColor;
  const setColor = onColorChange ?? setInternalColor;
  const lineWidth = lineWidthProp ?? internalLineWidth;
  const setLineWidth = onLineWidthChange ?? setInternalLineWidth;
  const pencilOnly = pencilOnlyProp ?? internalPencilOnly;
  const setPencilOnly = onPencilOnlyChange ?? setInternalPencilOnly;

  const {
    strokes,
    setStrokes,
    replaceStrokes,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useInkHistory([]);

  const loadPage = useCallback(async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/materials/${materialId}/annotations?page=${page}`,
      );
      const data = await response.json();
      if (!data.success) throw new Error(data.error ?? "Failed to load ink.");
      replaceStrokes((data.data.strokes ?? []) as SketchStroke[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load ink.");
      replaceStrokes([]);
    } finally {
      setLoading(false);
    }
  }, [materialId, replaceStrokes]);

  useEffect(() => {
    setPageNumber(1);
  }, [materialId]);

  useEffect(() => {
    void loadPage(pageNumber);
  }, [loadPage, pageNumber]);

  const persistStrokes = useCallback(
    (nextStrokes: SketchStroke[]) => {
      setStrokes(nextStrokes);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        setSaving(true);
        const rect = viewerRef.current?.getBoundingClientRect();
        const viewport =
          rect && rect.width > 0 && rect.height > 0
            ? { width: rect.width, height: rect.height }
            : undefined;
        void fetch(`/api/materials/${materialId}/annotations`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pageNumber, strokes: nextStrokes, viewport }),
        })
          .catch(() => setError("Failed to save ink on this page."))
          .finally(() => setSaving(false));
      }, 600);
    },
    [materialId, pageNumber, setStrokes],
  );

  useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    },
    [],
  );

  useEffect(() => {
    void fetch(`/api/courses`)
      .then((response) => response.json())
      .then((data) => {
        for (const course of data.courses ?? []) {
          const material = course.materials?.find((item: { id: string }) => item.id === materialId);
          if (material?.extractedText) {
            setExtractedText(material.extractedText);
            break;
          }
        }
      })
      .catch(() => {});
  }, [materialId]);

  const searchHits = search.trim()
    ? extractedText
        .split(/\n+/)
        .filter((line) => line.toLowerCase().includes(search.toLowerCase()))
        .slice(0, 8)
    : [];

  const shellClass = fullscreen
    ? "fixed inset-0 z-50 flex flex-col bg-[#fff8f1]"
    : "relative flex min-h-[520px] flex-col overflow-hidden rounded-2xl border border-orange-100 bg-white";

  const pdfSrc = `/api/materials/${materialId}/file#page=${pageNumber}`;

  return (
    <div className={shellClass}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-orange-100 bg-orange-50/50 px-3 py-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setPageNumber((page) => Math.max(1, page - 1))}
            className="rounded-lg p-1.5 text-stone-600 hover:bg-white"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[4rem] text-center text-xs font-semibold text-stone-700">
            Page {pageNumber}
          </span>
          <button
            type="button"
            onClick={() => setPageNumber((page) => page + 1)}
            className="rounded-lg p-1.5 text-stone-600 hover:bg-white"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setZoom((value) => Math.max(0.5, value - 0.1))}
            className="rounded-lg p-1.5 text-stone-600 hover:bg-white"
            aria-label="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="text-xs font-semibold text-stone-600">{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            onClick={() => setZoom((value) => Math.min(2, value + 0.1))}
            className="rounded-lg p-1.5 text-stone-600 hover:bg-white"
            aria-label="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
            {saving ? "Saving…" : loading ? "Loading…" : "Ink per page"}
          </span>
          <a
            href={`/api/materials/${materialId}/export`}
            className="inline-flex items-center gap-1 rounded-lg border border-orange-200 bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-orange-700 hover:bg-orange-50"
          >
            <Download className="h-3.5 w-3.5" />
            Export PDF
          </a>
          <button
            type="button"
            onClick={() => setFullscreen((value) => !value)}
            className="rounded-lg p-1.5 text-stone-600 hover:bg-white md:hidden"
            aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {fullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <div className="border-b border-orange-100 px-2 py-2">
        <div className="mb-2 flex items-center gap-2">
          <Search className="h-4 w-4 text-stone-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search extracted PDF text…"
            className="min-w-0 flex-1 rounded-lg border border-orange-100 px-2 py-1.5 text-xs outline-none"
          />
        </div>
        {searchHits.length > 0 ? (
          <ul className="mb-2 max-h-20 space-y-1 overflow-y-auto text-xs text-stone-600">
            {searchHits.map((line, index) => (
              <li key={index} className="rounded bg-amber-50 px-2 py-1">
                {line.slice(0, 120)}
              </li>
            ))}
          </ul>
        ) : null}
        <InkToolbar
          tool={inkTool}
          onToolChange={setInkTool}
          color={color}
          onColorChange={setColor}
          size={lineWidth}
          onSizeChange={setLineWidth}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={undo}
          onRedo={redo}
          pencilOnly={pencilOnly}
          onPencilOnlyChange={setPencilOnly}
        />
      </div>

      <div
        ref={viewerRef}
        className={`relative flex-1 overflow-auto bg-stone-100 ${fullscreen ? "min-h-0" : ""}`}
      >
        <div
          className="origin-top-left"
          style={{ transform: `scale(${zoom})`, width: `${100 / zoom}%` }}
        >
        <object
          data={pdfSrc}
          type="application/pdf"
          className={`w-full ${fullscreen ? "h-full min-h-[70vh]" : "h-[min(68vh,560px)]"}`}
          onError={() => setError("Could not load PDF preview.")}
        >
          <iframe
            title="Course material PDF"
            src={pdfSrc}
            className={`w-full border-0 ${fullscreen ? "h-full min-h-[70vh]" : "h-[min(68vh,560px)]"}`}
          />
        </object>
        </div>

        {error ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/90 p-4 text-sm text-stone-600">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60">
            <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
          </div>
        ) : null}

        <SketchLayer
          strokes={strokes}
          onChange={persistStrokes}
          active={active && !loading}
          color={color}
          lineWidth={lineWidth}
          inkTool={inkTool}
          pencilOnly={pencilOnly}
          className="absolute inset-0"
        />
      </div>
    </div>
  );
}

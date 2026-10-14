"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  Maximize2,
  Minimize2,
  Rows3,
  Search,
  Sparkles,
  Square,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import { InkToolbar } from "@/components/core/InkToolbar";
import { PdfAnnotatedPage } from "@/components/core/PdfAnnotatedPage";
import { PdfPageCanvas } from "@/components/core/PdfPageCanvas";
import { SketchLayer } from "@/components/core/SketchLayer";
import { selectionStudyTopic } from "@/lib/core/canvas-clipboard";
import { ocrPageInkText } from "@/lib/core/capture-page-ink";
import type { SketchStroke } from "@/lib/core/note-types";
import type { InkTool } from "@/lib/core/ink-engine";
import { useInkHistory } from "@/hooks/useInkHistory";
import { useTapHandler } from "@/hooks/useTapHandler";
import { usePdfDocument } from "@/hooks/usePdfDocument";
import {
  blurtingHref,
  luckyQuizHref,
  sixChunkingHref,
  sixFeynmanHref,
  teachMeHref,
} from "@/lib/study/loop-hrefs";

type ViewMode = "page" | "continuous";

export function PdfInkViewer({
  materialId,
  courseId,
  focusTopic,
  active,
  inkTool: inkToolProp,
  onInkToolChange,
  color: colorProp,
  onColorChange,
  lineWidth: lineWidthProp,
  onLineWidthChange,
  pencilOnly: pencilOnlyProp,
  onPencilOnlyChange,
  /** When true, parent CoreToolbar owns pens — hide duplicate ink strip. */
  embedded = false,
  pressureSensitivity = 70,
  tipFlatness = 35,
  tipSharpness = 65,
  strokeType = "solid",
  reduceLatency = true,
  inkMedium = "ink",
  onHistoryChange,
  onLuckyOutcome,
  onInkOcr,
}: {
  materialId: string;
  /** When set, annotate view can launch Core → Six → Lucky from this page. */
  courseId?: string | null;
  /** Course focus topic so annotate → Six/Lucky stay on the cold-start loop. */
  focusTopic?: string | null;
  active: boolean;
  inkTool?: InkTool;
  onInkToolChange?: (tool: InkTool) => void;
  color?: string;
  onColorChange?: (color: string) => void;
  lineWidth?: number;
  onLineWidthChange?: (size: number) => void;
  pencilOnly?: boolean;
  onPencilOnlyChange?: (value: boolean) => void;
  embedded?: boolean;
  pressureSensitivity?: number;
  tipFlatness?: number;
  tipSharpness?: number;
  strokeType?: "solid" | "dashed" | "dotted";
  reduceLatency?: boolean;
  inkMedium?: "ink" | "chalk" | "crayon" | "colorPencil" | "marker";
  onHistoryChange?: (api: {
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    strokeCount: number;
  } | null) => void;
  /** Persist Core → Lucky outcome so annotate stays tied to study results. */
  onLuckyOutcome?: (target: {
    kind?: "quiz" | "pack";
    quizId?: string;
    topic: string;
    sourcePreview?: string;
  }) => void;
  /** Persist ink OCR for Hub handwriting search (Core study outcomes). */
  onInkOcr?: (text: string) => void;
}) {
  const router = useRouter();
  const {
    doc,
    docVersion,
    pageCount,
    busy: docBusy,
    error: docError,
    setError: setDocError,
    pageTexts,
    searchPages,
  } = usePdfDocument(materialId);

  const [pageNumber, setPageNumber] = useState(1);
  const [inkLoading, setInkLoading] = useState(true);
  const [pageBusy, setPageBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("continuous");
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [inkSearchHit, setInkSearchHit] = useState<string | null>(null);
  const [inkSearching, setInkSearching] = useState(false);
  const [internalInkTool, setInternalInkTool] = useState<InkTool>("pen");
  const [internalColor, setInternalColor] = useState("#1c1917");
  const [internalLineWidth, setInternalLineWidth] = useState(4);
  const [internalPencilOnly, setInternalPencilOnly] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [studyMenuOpen, setStudyMenuOpen] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef(zoom);
  // eslint-disable-next-line react-hooks/refs -- latest zoom for pinch/wheel handlers
  zoomRef.current = zoom;

  const inkTool = inkToolProp ?? internalInkTool;
  const setInkTool = onInkToolChange ?? setInternalInkTool;
  const color = colorProp ?? internalColor;
  const setColor = onColorChange ?? setInternalColor;
  const lineWidth = lineWidthProp ?? internalLineWidth;
  const setLineWidth = onLineWidthChange ?? setInternalLineWidth;
  const pencilOnly = pencilOnlyProp ?? internalPencilOnly;
  const setPencilOnly = onPencilOnlyChange ?? setInternalPencilOnly;

  useEffect(() => {
    if (onPencilOnlyChange) return;
    const coarse = window.matchMedia?.("(hover: none) and (pointer: coarse)").matches;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync UI state to props or external subscription
    if (coarse) setInternalPencilOnly(false);
  }, [onPencilOnlyChange]);

  useEffect(() => {
    if (onLineWidthChange) return;
    const coarse = window.matchMedia?.("(hover: none) and (pointer: coarse)").matches;
    if (coarse) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync UI state to props or external subscription
      setInternalLineWidth((width) => (width < 3 ? 3 : width));
    }
  }, [onLineWidthChange]);

  const {
    strokes,
    setStrokes,
    replaceStrokes,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useInkHistory([]);

  const error = localError ?? docError;
  const setError = useCallback(
    (message: string | null) => {
      setLocalError(message);
      if (message) setDocError(message);
    },
    [setDocError],
  );

  const loadPageInk = useCallback(
    async (page: number) => {
      setInkLoading(true);
      try {
        const response = await fetch(
          `/api/materials/${materialId}/annotations?page=${page}`,
        );
        const data = await response.json();
        if (!data.success) throw new Error(data.error ?? "Failed to load ink.");
        replaceStrokes((data.data.strokes ?? []) as SketchStroke[]);
        setLocalError(null);
      } catch (err) {
        setLocalError(err instanceof Error ? err.message : "Failed to load ink.");
        replaceStrokes([]);
      } finally {
        setInkLoading(false);
      }
    },
    [materialId, replaceStrokes],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync UI state to props or external subscription
    setPageNumber(1);
  }, [materialId]);

  useEffect(() => {
    if (viewMode !== "page") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async data load on mount or dependency change
    void loadPageInk(pageNumber);
  }, [loadPageInk, pageNumber, viewMode]);

  useEffect(() => {
    if (!onHistoryChange) return;
    if (viewMode === "continuous") {
      onHistoryChange(null);
      return;
    }
    onHistoryChange({
      undo,
      redo,
      canUndo,
      canRedo,
      strokeCount: strokes.length,
    });
    return () => onHistoryChange(null);
  }, [
    onHistoryChange,
    undo,
    redo,
    canUndo,
    canRedo,
    strokes.length,
    viewMode,
  ]);

  const persistStrokes = useCallback(
    (nextStrokes: SketchStroke[]) => {
      setStrokes(nextStrokes);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        setSaving(true);
        const rect = viewerRef.current
          ?.querySelector(`[data-pdf-page="${pageNumber}"] canvas, canvas`)
          ?.getBoundingClientRect();
        const viewport =
          rect && rect.width > 0 && rect.height > 0
            ? { width: rect.width, height: rect.height }
            : undefined;
        void fetch(`/api/materials/${materialId}/annotations`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pageNumber, strokes: nextStrokes, viewport }),
        })
          .catch(() => setLocalError("Failed to save ink on this page."))
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

  // GoodNotes-adjacent: pinch zoom + two-finger pan when zoomed in.
  useEffect(() => {
    const scrollHost = viewerRef.current;
    if (!scrollHost) return;
    const host: HTMLElement = scrollHost;

    function clampZoom(value: number) {
      return Math.min(2.5, Math.max(0.5, Number(value.toFixed(2))));
    }

    function onWheel(event: WheelEvent) {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      const delta = event.deltaY > 0 ? -0.08 : 0.08;
      setZoom((current) => clampZoom(current + delta));
    }

    let pinchStart = 0;
    let zoomAtStart = 1;
    let lastMidX = 0;
    let lastMidY = 0;
    let gestureMode: "none" | "pinch" | "pan" = "none";

    function touchDistance(touches: TouchList) {
      const a = touches.item(0);
      const b = touches.item(1);
      if (!a || !b) return 0;
      return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    }

    function touchMidpoint(touches: TouchList) {
      const a = touches.item(0);
      const b = touches.item(1);
      if (!a || !b) return { x: 0, y: 0 };
      return { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 };
    }

    function panBy(deltaX: number, deltaY: number) {
      host.scrollLeft -= deltaX;
      host.scrollTop -= deltaY;
    }

    function onTouchStart(event: TouchEvent) {
      if (event.touches.length !== 2) return;
      pinchStart = touchDistance(event.touches);
      zoomAtStart = zoomRef.current;
      const mid = touchMidpoint(event.touches);
      lastMidX = mid.x;
      lastMidY = mid.y;
      gestureMode = "none";
    }

    function onTouchMove(event: TouchEvent) {
      if (event.touches.length !== 2 || pinchStart <= 0) return;
      const next = touchDistance(event.touches);
      if (next <= 0) return;
      const ratio = next / pinchStart;
      const mid = touchMidpoint(event.touches);

      // Decide pinch vs pan: distance change → pinch; otherwise pan when zoomed.
      if (gestureMode === "none") {
        if (Math.abs(ratio - 1) > 0.04) {
          gestureMode = "pinch";
        } else if (
          zoomRef.current > 1.05 &&
          (Math.abs(mid.x - lastMidX) > 2 || Math.abs(mid.y - lastMidY) > 2)
        ) {
          gestureMode = "pan";
        }
      }

      if (gestureMode === "pinch") {
        event.preventDefault();
        setZoom(clampZoom(zoomAtStart * ratio));
      } else if (gestureMode === "pan") {
        event.preventDefault();
        panBy(mid.x - lastMidX, mid.y - lastMidY);
      }

      lastMidX = mid.x;
      lastMidY = mid.y;
    }

    function onTouchEnd(event: TouchEvent) {
      if (event.touches.length < 2) {
        pinchStart = 0;
        gestureMode = "none";
      }
    }

    host.addEventListener("wheel", onWheel, { passive: false });
    host.addEventListener("touchstart", onTouchStart, { passive: true });
    host.addEventListener("touchmove", onTouchMove, { passive: false });
    host.addEventListener("touchend", onTouchEnd);
    host.addEventListener("touchcancel", onTouchEnd);
    return () => {
      host.removeEventListener("wheel", onWheel);
      host.removeEventListener("touchstart", onTouchStart);
      host.removeEventListener("touchmove", onTouchMove);
      host.removeEventListener("touchend", onTouchEnd);
      host.removeEventListener("touchcancel", onTouchEnd);
    };
  }, []);

  useEffect(() => {
    if (!studyMenuOpen) return;
    function onPointerDown(event: PointerEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest?.("[data-pdf-loop-bar]")) return;
      setStudyMenuOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [studyMenuOpen]);

  const jumpToPage = useCallback(
    (page: number) => {
      const next = Math.max(1, pageCount > 0 ? Math.min(pageCount, page) : page);
      setPageNumber(next);
      if (viewMode === "continuous") {
        requestAnimationFrame(() => {
          const el = viewerRef.current?.querySelector(
            `[data-pdf-page="${next}"]`,
          );
          el?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
    },
    [pageCount, viewMode],
  );

  const searchHits = useMemo(
    () => (search.trim() ? searchPages(search) : []),
    [search, searchPages],
  );

  // GoodNotes-adjacent: search handwriting on the current annotate page too.
  useEffect(() => {
    const q = search.trim().toLowerCase();
    if (!searchOpen || q.length < 2 || strokes.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync UI state to props or external subscription
      setInkSearchHit(null);
      setInkSearching(false);
      return;
    }
    let cancelled = false;
    setInkSearching(true);
    const timer = window.setTimeout(() => {
      void (async () => {
        const text = await ocrPageInkText();
        if (cancelled) return;
        setInkSearching(false);
        if (text && text.toLowerCase().includes(q)) {
          onInkOcr?.(text);
          const idx = text.toLowerCase().indexOf(q);
          const start = Math.max(0, idx - 24);
          setInkSearchHit(text.slice(start, start + 120).trim());
        } else {
          setInkSearchHit(null);
        }
      })();
    }, 550);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [search, searchOpen, pageNumber, strokes.length, onInkOcr]);

  const focus = focusTopic?.trim();
  const pageTopic = (() => {
    const snippet = (pageTexts[pageNumber - 1] ?? "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 72);
    if (snippet.length >= 16) {
      return focus ? `${focus} · ${snippet}` : snippet;
    }
    return focus ? `${focus} · PDF p.${pageNumber}` : `PDF p.${pageNumber}`;
  })();

  /** Prefer this page; in continuous mode, widen to nearby pages when text is thin. */
  const pageSourceText = useMemo(() => {
    const current = (pageTexts[pageNumber - 1] ?? "").trim();
    if (current.length >= 120 || viewMode === "page") return current;
    const start = Math.max(0, pageNumber - 2);
    const end = Math.min(pageTexts.length, pageNumber + 1);
    return pageTexts
      .slice(start, end)
      .map((text) => text.trim())
      .filter(Boolean)
      .join("\n\n")
      .trim();
  }, [pageNumber, pageTexts, viewMode]);

  async function resolveAnnotateStudy() {
    let text = pageSourceText.trim();
    const inkText = await ocrPageInkText();
    if (inkText) {
      onInkOcr?.(inkText);
      text = [inkText, text].filter(Boolean).join("\n\n").trim();
    }
    const topic =
      selectionStudyTopic(text, pageTopic) || pageTopic || focus || "this page";
    return { text, topic };
  }

  async function luckyFromThisPage() {
    if (!courseId?.trim()) {
      setLocalError("Select a course in Core, then quiz this PDF page.");
      return;
    }
    setQuizLoading(true);
    setLocalError(null);
    try {
      const { text, topic } = await resolveAnnotateStudy();
      const response = await fetch("/api/quizzes", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          materialId,
          questionCount: text.length >= 80 ? 12 : 10,
          sourceText: text.length >= 40 ? text.slice(0, 12000) : undefined,
          topicName: topic,
        }),
      });
      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
        data?: { id?: string };
      };
      if (!data.success) {
        throw new Error(data.error ?? "Could not build a quiz from this page.");
      }
      const quizId = data.data?.id;
      onLuckyOutcome?.({
        kind: "quiz",
        quizId,
        topic,
        sourcePreview: text.slice(0, 240) || undefined,
      });
      if (quizId) {
        router.push(`/quizzes/${quizId}`);
      } else {
        router.push(luckyQuizHref(courseId, materialId, topic));
      }
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : "Could not build a quiz from this page.",
      );
    } finally {
      setQuizLoading(false);
    }
  }

  async function openLoopFromAnnotate(
    kind: "six" | "feynman" | "blurt" | "teach-me",
  ) {
    if (!courseId?.trim()) {
      setLocalError("Select a course in Core, then continue from this page.");
      return;
    }
    setQuizLoading(true);
    setLocalError(null);
    try {
      const { topic } = await resolveAnnotateStudy();
      const href =
        kind === "six"
          ? sixChunkingHref(courseId, topic, materialId)
          : kind === "feynman"
            ? sixFeynmanHref(courseId, topic, materialId)
            : kind === "teach-me"
              ? teachMeHref(courseId, materialId, topic)
              : blurtingHref(courseId, materialId, topic);
      router.push(href);
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : "Could not open study from this page.",
      );
    } finally {
      setQuizLoading(false);
    }
  }

  // Continuous mode: render a window around the focused page for large PDFs
  const continuousPages = useMemo(() => {
    if (pageCount <= 0) return [];
    if (pageCount <= 24) {
      return Array.from({ length: pageCount }, (_, i) => i + 1);
    }
    const start = Math.max(1, pageNumber - 4);
    const end = Math.min(pageCount, pageNumber + 8);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [pageCount, pageNumber]);

  const shellClass = fullscreen
    ? "fixed inset-0 z-50 flex flex-col bg-[#fff8f1]"
    : embedded
      ? "relative flex min-h-0 flex-1 flex-col overflow-hidden bg-white"
      : "relative flex min-h-[520px] flex-col overflow-hidden rounded-2xl border border-orange-100 bg-white";

  const pageLabel =
    pageCount > 0 ? `${pageNumber} / ${pageCount}` : String(pageNumber);
  const showBusy =
    docBusy || (viewMode === "page" && (inkLoading || pageBusy));

  const sharedInk = {
    inkTool,
    color,
    lineWidth,
    pencilOnly,
    onPencilOnlyChange: setPencilOnly,
    pressureSensitivity,
    tipFlatness,
    tipSharpness,
    strokeType,
    reduceLatency,
    inkMedium,
  } as const;

  const tapStudyMenu = useTapHandler(() => setStudyMenuOpen((open) => !open));
  const tapLuckyFromPage = useTapHandler(() => {
    setStudyMenuOpen(false);
    void luckyFromThisPage();
  });
  const tapLoopSix = useTapHandler(() => {
    setStudyMenuOpen(false);
    void openLoopFromAnnotate("six");
  });
  const tapLoopFeynman = useTapHandler(() => {
    setStudyMenuOpen(false);
    void openLoopFromAnnotate("feynman");
  });
  const tapLoopTeachMe = useTapHandler(() => {
    setStudyMenuOpen(false);
    void openLoopFromAnnotate("teach-me");
  });
  const tapLoopBlurt = useTapHandler(() => {
    setStudyMenuOpen(false);
    void openLoopFromAnnotate("blurt");
  });

  return (
    <div className={shellClass}>
      <div
        data-pdf-toolbar
        className={`relative z-[100] flex flex-wrap items-center justify-between gap-2 border-b border-orange-100 bg-orange-50/95 px-2 touch-manipulation ${
          embedded ? "py-1" : "px-3 py-2"
        }`}
      >
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => jumpToPage(pageNumber - 1)}
            disabled={pageNumber <= 1}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-stone-600 touch-manipulation hover:bg-white disabled:opacity-40"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[4.5rem] text-center text-xs font-semibold text-stone-700">
            {pageLabel}
          </span>
          <button
            type="button"
            onClick={() => jumpToPage(pageNumber + 1)}
            disabled={pageCount > 0 && pageNumber >= pageCount}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-stone-600 touch-manipulation hover:bg-white disabled:opacity-40"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() =>
              setViewMode((mode) => (mode === "page" ? "continuous" : "page"))
            }
            className={`ml-1 rounded-lg p-1.5 hover:bg-white ${
              viewMode === "continuous"
                ? "bg-white text-stone-900"
                : "text-stone-600"
            }`}
            title={
              viewMode === "continuous"
                ? "Single page"
                : "Continuous scroll"
            }
            aria-label="Toggle continuous scroll"
          >
            {viewMode === "continuous" ? (
              <Rows3 className="h-4 w-4" />
            ) : (
              <Square className="h-4 w-4" />
            )}
          </button>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => setZoom((value) => Math.max(0.5, value - 0.1))}
            className="rounded-lg p-1.5 text-stone-600 hover:bg-white"
            aria-label="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="text-xs font-semibold text-stone-600">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((value) => Math.min(2.5, value + 0.1))}
            className="rounded-lg p-1.5 text-stone-600 hover:bg-white"
            aria-label="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoom(1)}
            className="rounded-lg px-1.5 py-1 text-[10px] font-semibold text-stone-500 hover:bg-white"
            title="Reset zoom · pinch or ⌘/Ctrl-scroll · Hand / Space-drag / two-finger to pan when zoomed"
          >
            Fit
          </button>
          <button
            type="button"
            onClick={() => setSearchOpen((open) => !open)}
            className={`rounded-lg p-1.5 hover:bg-white ${
              searchOpen ? "bg-white text-stone-900" : "text-stone-600"
            }`}
            aria-label="Search PDF text"
            title="Search"
          >
            <Search className="h-4 w-4" />
          </button>
          {!embedded ? (
            <a
              href={`/api/materials/${materialId}/export`}
              className="inline-flex items-center gap-1 rounded-lg border border-orange-200 bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-orange-700 hover:bg-orange-50"
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </a>
          ) : null}
          <button
            type="button"
            onClick={() => setFullscreen((value) => !value)}
            className="rounded-lg p-1.5 text-stone-600 hover:bg-white"
            aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {fullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
          {saving || showBusy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-stone-400" />
          ) : null}
        </div>
      </div>

      {searchOpen ? (
        <div className="border-b border-orange-100 px-2 py-2">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 shrink-0 text-stone-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search PDF text + ink…"
              className="min-w-0 flex-1 rounded-lg border border-orange-100 px-2 py-1.5 text-xs outline-none"
              autoFocus
            />
          </div>
          {inkSearching ? (
            <p className="mt-2 text-[10px] text-stone-400">Reading ink on this page…</p>
          ) : null}
          {inkSearchHit ? (
            <button
              type="button"
              onClick={() => jumpToPage(pageNumber)}
              className="mt-2 w-full rounded bg-violet-50 px-2 py-1.5 text-left text-xs text-violet-900 hover:bg-violet-100"
            >
              <span className="font-bold">Ink p.{pageNumber}</span> {inkSearchHit}
            </button>
          ) : null}
          {searchHits.length > 0 ? (
            <ul className="mt-2 max-h-28 space-y-1 overflow-y-auto text-xs text-stone-600">
              {searchHits.map((hit) => (
                <li key={`${hit.pageNumber}-${hit.snippet.slice(0, 24)}`}>
                  <button
                    type="button"
                    onClick={() => jumpToPage(hit.pageNumber)}
                    className="w-full rounded bg-amber-50 px-2 py-1.5 text-left hover:bg-amber-100"
                  >
                    <span className="font-bold text-amber-900">
                      p.{hit.pageNumber}
                    </span>{" "}
                    {hit.snippet.slice(0, 100)}
                  </button>
                </li>
              ))}
            </ul>
          ) : search.trim() && !inkSearching && !inkSearchHit ? (
            <p className="mt-2 text-[10px] text-stone-400">
              No page or ink hits yet — try another word, or wait for the text index.
            </p>
          ) : null}
        </div>
      ) : null}

      {!embedded ? (
        <div data-pdf-ink-toolbar className="border-b border-orange-100 px-2 py-2">
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
      ) : null}

      {courseId ? (
        <div
          data-pdf-loop-bar
          className="relative z-30 flex items-center justify-end border-b border-orange-100 px-2 py-1 touch-manipulation"
        >
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={studyMenuOpen}
            disabled={quizLoading}
            {...tapStudyMenu}
            className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold touch-manipulation disabled:opacity-60 ${
              studyMenuOpen
                ? "border-violet-400 bg-violet-600 text-white"
                : "border-stone-200 bg-white text-stone-700 hover:bg-violet-50"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            {quizLoading ? "Working…" : "Study this page"}
            <ChevronDown className="h-3 w-3" />
          </button>
          {studyMenuOpen ? (
            <div
              role="menu"
              className="absolute right-2 top-full z-40 mt-1 w-52 overflow-hidden rounded-xl border border-stone-200 bg-white py-1 shadow-xl"
            >
              <StudyMenuItem
                label="Lucky quiz from this page"
                disabled={quizLoading}
                tap={tapLuckyFromPage}
              />
              <StudyMenuItem label="Chunk in Six" disabled={quizLoading} tap={tapLoopSix} />
              <StudyMenuItem label="Feynman" disabled={quizLoading} tap={tapLoopFeynman} />
              <StudyMenuItem label="Teach Me" disabled={quizLoading} tap={tapLoopTeachMe} />
              <StudyMenuItem label="Blurt" disabled={quizLoading} tap={tapLoopBlurt} />
            </div>
          ) : null}
        </div>
      ) : null}

      <div
        ref={viewerRef}
        data-page-scrollport
        data-notebook-desk
        className={`relative flex-1 overflow-auto bg-stone-100/80 p-1.5 sm:p-2 ${fullscreen ? "min-h-0" : ""}`}
        onScroll={() => {
          if (viewMode !== "continuous" || !viewerRef.current) return;
          const nodes = viewerRef.current.querySelectorAll("[data-pdf-page]");
          const top = viewerRef.current.scrollTop + 48;
          let current = pageNumber;
          nodes.forEach((node) => {
            const el = node as HTMLElement;
            const page = Number(el.dataset.pdfPage);
            if (!page) return;
            if (el.offsetTop <= top) current = page;
          });
          if (current !== pageNumber) setPageNumber(current);
        }}
      >
        {viewMode === "continuous" ? (
          <div className="mx-auto w-full max-w-6xl">
            {pageCount > 24 && continuousPages[0]! > 1 ? (
              <button
                type="button"
                onClick={() => jumpToPage(Math.max(1, continuousPages[0]! - 8))}
                className="mb-3 w-full rounded-lg border border-dashed border-stone-300 bg-white/80 py-2 text-xs font-semibold text-stone-600"
              >
                Load earlier pages…
              </button>
            ) : null}
            {continuousPages.map((page) => (
              <PdfAnnotatedPage
                key={page}
                materialId={materialId}
                doc={doc}
                docVersion={docVersion}
                pageNumber={page}
                zoom={zoom}
                active={active && !error}
                {...sharedInk}
                onError={setError}
              />
            ))}
            {pageCount > 24 &&
            continuousPages[continuousPages.length - 1]! < pageCount ? (
              <button
                type="button"
                onClick={() =>
                  jumpToPage(
                    Math.min(
                      pageCount,
                      (continuousPages[continuousPages.length - 1] ?? pageNumber) +
                        1,
                    ),
                  )
                }
                className="mt-1 w-full rounded-lg border border-dashed border-stone-300 bg-white/80 py-2 text-xs font-semibold text-stone-600"
              >
                Load later pages…
              </button>
            ) : null}
          </div>
        ) : (
          <div className="relative mx-auto flex w-full max-w-4xl justify-center">
            <div data-pdf-page={pageNumber} data-notebook-paper="true" data-page-active="true">
              <PdfPageCanvas
                doc={doc}
                docVersion={docVersion}
                pageNumber={pageNumber}
                zoom={zoom}
                onError={setError}
                onBusyChange={setPageBusy}
              >
                <SketchLayer
                  strokes={strokes}
                  onChange={persistStrokes}
                  active={active && !showBusy && !error}
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
                  className="h-full w-full"
                />
              </PdfPageCanvas>
            </div>
          </div>
        )}

        {error ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/90 p-4 text-sm text-stone-600">
            {error}
          </div>
        ) : null}

        {showBusy && viewMode === "page" ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60">
            <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function StudyMenuItem({
  label,
  disabled,
  tap,
}: {
  label: string;
  disabled?: boolean;
  tap: ReturnType<typeof useTapHandler>;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      {...tap}
      className="flex w-full items-center px-3 py-2.5 text-left text-xs font-semibold text-stone-700 touch-manipulation hover:bg-violet-50 hover:text-violet-900 disabled:opacity-50"
    >
      {label}
    </button>
  );
}

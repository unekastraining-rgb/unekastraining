"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

import { NotebookPagePreview } from "@/components/core/NotebookPagePreview";
import { PageTemplateOverlay } from "@/components/core/PageTemplateOverlay";
import type { NotebookChromeState, NotebookPageRecord } from "@/lib/core/note-types";
import type { SketchStroke } from "@/lib/core/note-types";
import {
  NOTEBOOK_PAGE_GROW_PAD,
  pageDeskMetrics,
  pageSlotStyle,
  type PageGrowDirection,
  type PageLayoutMode,
} from "@/lib/core/notebook-page-layout";
import { resolveNotebookCoverStyle } from "@/lib/core/page-templates";
import {
  resolvePaperSurfaceStyle,
  usesDynamicPaperStyle,
} from "@/lib/core/paper-style";
import { CHALKBOARD_BACKGROUND } from "@/lib/core/ink-engine";
import { templateContentPadding } from "@/components/core/PageTemplateOverlay";

function paperSurfaceStyle(notebook?: NotebookChromeState): CSSProperties {
  const bg = notebook?.pageBackgroundColor ?? "#ffffff";
  if (usesDynamicPaperStyle(notebook?.pageTemplateId)) {
    return resolvePaperSurfaceStyle({
      templateId: notebook?.pageTemplateId,
      paperColor: notebook?.pageBackgroundColor,
      lineColor: notebook?.rulingLineColor,
      spacingPx: notebook?.rulingSpacingPx,
    });
  }
  const lightPaper =
    !bg ||
    ["#ffffff", "#fff", "#fffdf9", "#fffcf7", "#fafaf9", "#fffefb"].includes(
      bg.toLowerCase(),
    );
  if (lightPaper) {
    const cream = bg && bg !== "#ffffff" && bg !== "#fff" ? bg : "#fffdf9";
    return {
      backgroundColor: cream,
      backgroundImage: [
        "radial-gradient(ellipse at 12% 8%, rgba(255,255,255,0.65) 0%, transparent 42%)",
        "radial-gradient(ellipse at 88% 92%, rgba(120,113,108,0.06) 0%, transparent 45%)",
        "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(68,64,60,0.015) 2px, rgba(68,64,60,0.015) 3px)",
      ].join(", "),
      boxShadow: "inset 0 0 0 1px rgba(120,113,108,0.06)",
    };
  }
  if (bg === CHALKBOARD_BACKGROUND || bg === "#1a3d32" || bg === "#1e3d32") {
    return {
      backgroundColor: bg,
      backgroundImage: [
        "radial-gradient(ellipse at 18% 22%, rgba(255,255,255,0.06) 0%, transparent 42%)",
        "radial-gradient(ellipse at 82% 68%, rgba(0,0,0,0.22) 0%, transparent 48%)",
      ].join(", "),
    };
  }
  return { backgroundColor: bg };
}

const PULL_RELEASE_AT = 44;

function normalizeWheelDelta(event: WheelEvent, pageSize: number): {
  dx: number;
  dy: number;
} {
  let dx = event.deltaX;
  let dy = event.deltaY;
  // 0 = pixels, 1 = lines, 2 = pages
  if (event.deltaMode === 1) {
    dx *= 16;
    dy *= 16;
  } else if (event.deltaMode === 2) {
    dx *= pageSize;
    dy *= pageSize;
  }
  return { dx, dy };
}

/**
 * One screen per page. Wheel/trackpad scrolls between pages; pull past the last
 * page rubber-bands to add. Scrollport is absolute so content cannot inflate the app shell.
 */
export function NotebookContinuousDesk({
  pages,
  activePageId,
  notebook,
  title,
  paperClass,
  customBackgroundUrl,
  children,
  onActivatePage,
  onGrowPages,
  scrollToPageId,
}: {
  pages: NotebookPageRecord[];
  activePageId: string;
  notebook?: NotebookChromeState;
  title?: string;
  paperClass: string;
  customBackgroundUrl?: string | null;
  children: ReactNode;
  onActivatePage: (pageId: string) => void;
  onGrowPages: (direction: PageGrowDirection) => void;
  scrollToPageId?: string | null;
  layoutMode?: PageLayoutMode;
  activeWorldHeight?: number;
}) {
  const deskRootRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const growLock = useRef(false);
  const pullYRef = useRef(0);
  const pullXRef = useRef(0);
  const settleTimer = useRef<number | null>(null);
  const sheetHeightRef = useRef(0);
  const pageCountRef = useRef(1);
  const pagesRef = useRef(pages);
  const activePageIdRef = useRef(activePageId);
  const userScrollingRef = useRef(false);
  const userScrollTimer = useRef<number | null>(null);
  const wheelAccumRef = useRef(0);
  const [deskWidth, setDeskWidth] = useState(0);
  const [deskHeight, setDeskHeight] = useState(0);
  const [pullY, setPullY] = useState(0);
  const [pullX, setPullX] = useState(0);

  // eslint-disable-next-line react-hooks/refs -- scroll handlers read latest page list without resubscribing
  activePageIdRef.current = activePageId;
  // eslint-disable-next-line react-hooks/refs -- scroll handlers read latest page list without resubscribing
  pagesRef.current = pages;
  // eslint-disable-next-line react-hooks/refs -- scroll handlers read latest page list without resubscribing
  pageCountRef.current = Math.max(1, pages.length);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      const w = Math.round(el.clientWidth || rect.width);
      const h = Math.round(el.clientHeight || rect.height);
      if (w > 0) setDeskWidth((prev) => (prev === w ? prev : w));
      if (h > 0) setDeskHeight((prev) => (prev === h ? prev : h));
    };
    measure();
    const raf = window.requestAnimationFrame(() => {
      measure();
      window.requestAnimationFrame(measure);
    });
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => {
        window.cancelAnimationFrame(raf);
        window.removeEventListener("resize", measure);
      };
    }
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => {
      window.cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [pages.length]);

  const metrics = useMemo(
    () =>
      pageDeskMetrics(pages, {
        viewportWidth: deskWidth,
        viewportHeight: deskHeight,
        layoutMode: "scroll",
        activePageId,
      }),
    [pages, deskWidth, deskHeight, activePageId],
  );

  const pullMax = metrics.growPad ?? NOTEBOOK_PAGE_GROW_PAD;
  const releaseArmed =
    pullY >= PULL_RELEASE_AT || pullX >= PULL_RELEASE_AT;

  const pageCount = Math.max(1, pages.length);
  const sheetW = metrics.sheetW || deskWidth;
  const sheetH = metrics.sheetH || deskHeight;
  // eslint-disable-next-line react-hooks/refs -- wheel handler uses latest sheet height
  sheetHeightRef.current = sheetH;
  // Always N full screens tall — do not trust DOM scrollHeight alone.
  const stackHeight = sheetH > 0 ? pageCount * sheetH : 0;

  const resetPull = useCallback(() => {
    pullYRef.current = 0;
    pullXRef.current = 0;
    setPullY(0);
    setPullX(0);
  }, []);

  const addPage = useCallback(
    (direction: PageGrowDirection) => {
      if (growLock.current) return;
      growLock.current = true;
      resetPull();
      onGrowPages(direction);
      window.setTimeout(() => {
        growLock.current = false;
      }, 350);
    },
    [onGrowPages, resetPull],
  );

  const settlePull = useCallback(() => {
    if (pullYRef.current >= PULL_RELEASE_AT) {
      addPage("below");
      return;
    }
    if (pullXRef.current >= PULL_RELEASE_AT) {
      addPage("beside");
      return;
    }
    resetPull();
  }, [addPage, resetPull]);

  const scheduleSettle = useCallback(() => {
    if (settleTimer.current != null) window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => {
      settleTimer.current = null;
      settlePull();
    }, 140);
  }, [settlePull]);

  const activatePageInView = useCallback(() => {
    const port = scrollRef.current;
    const list = pagesRef.current;
    const pageH = sheetHeightRef.current;
    if (!port || list.length < 2 || pageH <= 0) return;
    const index = Math.round(port.scrollTop / pageH);
    const clamped = Math.max(0, Math.min(list.length - 1, index));
    const page = list[clamped];
    if (page && page.id !== activePageIdRef.current) {
      onActivatePage(page.id);
    }
  }, [onActivatePage]);

  const scrollToPageIndex = useCallback(
    (index: number, behavior: ScrollBehavior = "smooth") => {
      const port = scrollRef.current;
      const pageH = sheetHeightRef.current;
      if (!port || pageH <= 0) return;
      const clamped = Math.max(0, Math.min(pageCountRef.current - 1, index));
      userScrollingRef.current = true;
      port.scrollTo({ top: clamped * pageH, left: 0, behavior });
      if (userScrollTimer.current != null) window.clearTimeout(userScrollTimer.current);
      userScrollTimer.current = window.setTimeout(() => {
        userScrollingRef.current = false;
        activatePageInView();
      }, behavior === "smooth" ? 280 : 80);
    },
    [activatePageInView],
  );

  // Wheel / trackpad: move between pages using known page height (not fragile scrollHeight).
  useEffect(() => {
    const root = deskRootRef.current;
    const port = scrollRef.current;
    if (!root || !port) return;

    function onWheel(event: WheelEvent) {
      if (event.ctrlKey || event.metaKey) return;
      event.preventDefault();
      event.stopPropagation();

      const pageH = sheetHeightRef.current || port!.clientHeight;
      if (pageH <= 0) return;
      const count = pageCountRef.current;
      const { dx, dy } = normalizeWheelDelta(event, pageH);
      const maxTop = Math.max(0, (count - 1) * pageH);

      // In-progress rubber-band
      if (pullYRef.current > 0) {
        const next = Math.max(0, Math.min(pullMax, pullYRef.current + dy * 0.45));
        pullYRef.current = next;
        setPullY(next);
        scheduleSettle();
        return;
      }
      if (pullXRef.current > 0) {
        const next = Math.max(0, Math.min(pullMax, pullXRef.current + dx * 0.45));
        pullXRef.current = next;
        setPullX(next);
        scheduleSettle();
        return;
      }

      // Single page: only rubber-band past edges
      if (count <= 1 || maxTop <= 0) {
        if (dy > 0) {
          const next = Math.max(0, Math.min(pullMax, dy * 0.45));
          pullYRef.current = next;
          setPullY(next);
          scheduleSettle();
        }
        return;
      }

      const atBottom = port!.scrollTop >= maxTop - 2;
      const atTop = port!.scrollTop <= 2;

      // Continuous scroll between pages (mouse wheel + trackpad)
      if (Math.abs(dy) >= Math.abs(dx)) {
        if (dy > 0 && atBottom) {
          const next = Math.max(0, Math.min(pullMax, dy * 0.45));
          pullYRef.current = next;
          setPullY(next);
          scheduleSettle();
          return;
        }
        if (dy < 0 && atTop) {
          return;
        }

        // Trackpads send many small deltas — apply directly.
        // Mouse wheels send larger chunks — also fine as pixel scroll.
        userScrollingRef.current = true;
        if (userScrollTimer.current != null) {
          window.clearTimeout(userScrollTimer.current);
        }

        // Discrete mouse wheel: flip one page when accumulated enough.
        const looksLikeMouseWheel =
          event.deltaMode === 1 || Math.abs(dy) >= 40;
        if (looksLikeMouseWheel) {
          wheelAccumRef.current += dy;
          if (Math.abs(wheelAccumRef.current) >= 40) {
            const dir = wheelAccumRef.current > 0 ? 1 : -1;
            wheelAccumRef.current = 0;
            const current = Math.round(port!.scrollTop / pageH);
            scrollToPageIndex(current + dir, "smooth");
          }
          return;
        }

        wheelAccumRef.current = 0;
        const nextTop = Math.max(0, Math.min(maxTop, port!.scrollTop + dy));
        port!.scrollTop = nextTop;
        userScrollTimer.current = window.setTimeout(() => {
          userScrollingRef.current = false;
          // Snap to nearest page after trackpad fling
          const nearest = Math.round(port!.scrollTop / pageH);
          scrollToPageIndex(nearest, "smooth");
        }, 80);
        return;
      }

      // Horizontal: rubber-band beside at right edge only
      if (dx > 0) {
        const next = Math.max(0, Math.min(pullMax, dx * 0.45));
        pullXRef.current = next;
        setPullX(next);
        scheduleSettle();
      }
    }

    function onScroll() {
      userScrollingRef.current = true;
      if (userScrollTimer.current != null) window.clearTimeout(userScrollTimer.current);
      userScrollTimer.current = window.setTimeout(() => {
        userScrollingRef.current = false;
        activatePageInView();
      }, 100);
    }

    root.addEventListener("wheel", onWheel, { passive: false, capture: true });
    port.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      root.removeEventListener("wheel", onWheel, true);
      port.removeEventListener("scroll", onScroll);
      if (settleTimer.current != null) window.clearTimeout(settleTimer.current);
      if (userScrollTimer.current != null) window.clearTimeout(userScrollTimer.current);
    };
  }, [activatePageInView, pullMax, scheduleSettle, scrollToPageIndex, stackHeight]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !scrollToPageId || sheetH <= 0) return;
    const index = pages.findIndex((page) => page.id === scrollToPageId);
    if (index < 0) return;
    scrollToPageIndex(index, "smooth");
  }, [scrollToPageId, pages, sheetH, scrollToPageIndex]);

  useEffect(() => {
    if (userScrollingRef.current || sheetH <= 0) return;
    const index = pages.findIndex((page) => page.id === activePageId);
    if (index < 0) return;
    const port = scrollRef.current;
    if (!port) return;
    const expected = index * sheetH;
    if (Math.abs(port.scrollTop - expected) > sheetH * 0.55) {
      scrollToPageIndex(index, "auto");
    }
  }, [activePageId, pages, sheetH, scrollToPageIndex]);

  const showCover = notebook?.showCover === true;
  const cover = resolveNotebookCoverStyle(notebook);
  const paddingClass = templateContentPadding(notebook?.pageTemplateId);
  const surfaceStyle = paperSurfaceStyle(notebook);
  const dynamicPaper = usesDynamicPaperStyle(notebook?.pageTemplateId);
  const paperClassName =
    customBackgroundUrl || dynamicPaper ? "" : paperClass;

  return (
    <div
      ref={deskRootRef}
      className="relative flex min-h-0 flex-1 flex-col overflow-hidden"
      data-notebook-desk
      style={{ backgroundColor: "#e7e5e4" }}
    >
      {releaseArmed ? (
        <div
          className="pointer-events-none absolute inset-x-0 top-2 z-20 flex justify-center px-3"
          aria-live="polite"
        >
          <div
            data-hub-chrome
            className="pointer-events-auto inline-flex items-center rounded-full border border-orange-300 bg-white/95 px-3 py-1.5 text-[11px] font-bold text-orange-800 shadow-md backdrop-blur"
          >
            Release to add · scroll back to cancel
          </div>
        </div>
      ) : null}

      <div ref={viewportRef} className="relative min-h-0 flex-1 overflow-hidden">
        <div
          ref={scrollRef}
          data-page-scrollport
          className="absolute inset-0 overflow-y-auto overflow-x-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [-webkit-overflow-scrolling:touch] [overscroll-behavior:contain]"
        >
          <div
            className="relative"
            style={{
              width: sheetW > 0 ? sheetW : "100%",
              // In-flow spacer guarantees scrollHeight even if sheets are absolute.
              minHeight: stackHeight > 0 ? stackHeight : "100%",
              transform:
                pullX || pullY
                  ? `translate(${-pullX}px, ${-pullY}px)`
                  : undefined,
            }}
          >
            <div
              aria-hidden
              className="pointer-events-none w-full"
              style={{ height: stackHeight > 0 ? stackHeight : "100%" }}
            />
            {metrics.laidOut.map((page) => {
              const slot = pageSlotStyle(page, sheetW, sheetH, metrics.gap, {
                activePageId,
                activeSheetH: sheetH,
                rowHeights: metrics.rowHeights,
                sideGap: metrics.sideGap,
              });
              const active = page.id === activePageId;
              const strokes = (
                page.data as { strokes?: SketchStroke[]; typed?: string }
              )?.strokes;
              const typed = (page.data as { typed?: string })?.typed;

              return (
                <div
                  key={page.id}
                  data-notebook-sheet={page.id}
                  data-page-active={active ? "true" : undefined}
                  data-notebook-paper={active ? "true" : undefined}
                  className={`absolute overflow-hidden ${
                    active ? "z-[5]" : "z-[1]"
                  } ${paperClassName} ${paddingClass}`}
                  style={{
                    left: slot.left,
                    top: slot.top,
                    width: slot.width || "100%",
                    height: slot.height || "100%",
                    ...(customBackgroundUrl
                      ? {
                          ...surfaceStyle,
                          backgroundImage: `url(${customBackgroundUrl})`,
                          backgroundSize: "contain",
                          backgroundPosition: "center top",
                          backgroundRepeat: "no-repeat",
                        }
                      : surfaceStyle),
                  }}
                >
                  <div data-notebook-binding aria-hidden />
                  {showCover ? (
                    <div
                      className={`flex h-7 w-full shrink-0 items-center px-3 ${cover.className ?? ""}`}
                      style={cover.style}
                    >
                      <span
                        className={`truncate text-xs font-bold ${cover.titleClassName}`}
                      >
                        {title ?? "Notebook"}
                      </span>
                      <span
                        className={`ml-auto rounded-full px-2 py-0.5 text-[9px] font-bold ${
                          cover.titleClassName.includes("stone-800")
                            ? "bg-stone-900/10 text-stone-800"
                            : "bg-black/15 text-white"
                        }`}
                      >
                        {page.pageNumber}/{pageCount}
                      </span>
                    </div>
                  ) : (
                    <div className="pointer-events-none absolute right-3 top-3 z-[4] rounded-full bg-stone-900/45 px-2 py-0.5 text-[10px] font-bold text-white">
                      {page.pageNumber}/{pageCount}
                    </div>
                  )}

                  <div className="relative h-full w-full">
                    {active ? (
                      children
                    ) : (
                      <>
                        <PageTemplateOverlay templateId={notebook?.pageTemplateId} />
                        <NotebookPagePreview
                          strokes={strokes}
                          typed={typed}
                          pageNumber={page.pageNumber}
                          label={page.label}
                          onActivate={() => onActivatePage(page.id)}
                          width={sheetW || 1}
                          height={sheetH || 1}
                        />
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {pullY > 0 ? (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-center justify-center"
            style={{ height: pullY }}
            aria-hidden
          >
            <span
              className={`rounded-full px-3 py-1 text-[10px] font-bold ${
                releaseArmed
                  ? "bg-stone-900 text-white"
                  : "bg-white/90 text-stone-600"
              }`}
            >
              {releaseArmed ? "Release to add page ↓" : "Keep pulling…"}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

"use client";

import type { CSSProperties } from "react";

import type { NotebookChromeState } from "@/lib/core/note-types";
import { resolveNotebookCoverStyle } from "@/lib/core/page-templates";
import { templateContentPadding } from "@/components/core/PageTemplateOverlay";
import { CHALKBOARD_BACKGROUND } from "@/lib/core/ink-engine";
import {
  resolvePaperSurfaceStyle,
  usesDynamicPaperStyle,
} from "@/lib/core/paper-style";

function pageSurfaceStyle(notebook?: NotebookChromeState): CSSProperties {
  const bg = notebook?.pageBackgroundColor ?? "#ffffff";
  const edge = notebook?.edgeColor ?? "#f5e6d3";
  const scheme = notebook?.colorScheme ?? "solid";
  const palette = notebook?.appliedPaletteColors;

  if (bg === CHALKBOARD_BACKGROUND || bg === "#1a3d32" || bg === "#1e3d32") {
    return {
      backgroundColor: bg,
      backgroundImage: [
        "radial-gradient(ellipse at 18% 22%, rgba(255,255,255,0.06) 0%, transparent 42%)",
        "radial-gradient(ellipse at 82% 68%, rgba(0,0,0,0.22) 0%, transparent 48%)",
        "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.035) 3px, rgba(0,0,0,0.035) 4px)",
      ].join(", "),
    };
  }

  if (scheme === "ombre" && palette && palette.length >= 2) {
    return {
      background: `linear-gradient(180deg, ${palette[0]} 0%, ${palette[1]} 45%, ${palette[2] ?? bg} 100%)`,
    };
  }
  if (scheme === "bubbles") {
    return {
      backgroundColor: bg,
      backgroundImage: `radial-gradient(circle at 20% 20%, ${edge}55 0%, transparent 35%), radial-gradient(circle at 80% 30%, ${edge}44 0%, transparent 30%), radial-gradient(circle at 40% 80%, ${edge}33 0%, transparent 25%)`,
    };
  }
  if (scheme === "edge") {
    return {
      backgroundColor: bg,
      boxShadow: `inset 8px 0 0 ${edge}, inset -8px 0 0 ${edge}`,
    };
  }

  if (usesDynamicPaperStyle(notebook?.pageTemplateId)) {
    return resolvePaperSurfaceStyle({
      templateId: notebook?.pageTemplateId,
      paperColor: notebook?.pageBackgroundColor,
      lineColor: notebook?.rulingLineColor,
      spacingPx: notebook?.rulingSpacingPx,
    });
  }

  // Soft cream tooth for blank / light notebook pages (GoodNotes-adjacent paper feel).
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

  return { backgroundColor: bg };
}

export function NotebookPageFrame({
  notebook,
  title,
  pageNumber,
  paperClass,
  customBackgroundUrl,
  children,
}: {
  notebook?: NotebookChromeState;
  title?: string;
  pageNumber?: number;
  paperClass: string;
  customBackgroundUrl?: string | null;
  children: React.ReactNode;
}) {
  const showCover = notebook?.showCover === true;
  const cover = resolveNotebookCoverStyle(notebook);
  const paddingClass = templateContentPadding(notebook?.pageTemplateId);
  const surfaceStyle = pageSurfaceStyle(notebook);
  const dynamicPaper = usesDynamicPaperStyle(notebook?.pageTemplateId);
  // Layout templates (cornell, columns…) keep a solid paperClass; patterned paper uses inline style.
  const paperClassName =
    customBackgroundUrl || dynamicPaper ? "" : paperClass;

  return (
    <div
      className="flex min-h-0 flex-1 flex-col"
      data-notebook-desk
      style={{
        backgroundColor: "#d6d3d1",
        backgroundImage: [
          "radial-gradient(ellipse at 18% 0%, rgba(255,255,255,0.42) 0%, transparent 52%)",
          "radial-gradient(ellipse at 82% 100%, rgba(68,64,60,0.12) 0%, transparent 48%)",
          "repeating-linear-gradient(90deg, transparent, transparent 11px, rgba(68,64,60,0.03) 11px, rgba(68,64,60,0.03) 12px)",
        ].join(", "),
      }}
    >
      {showCover ? (
        <div
          className={`flex h-7 w-full shrink-0 items-center px-3 ${cover.className ?? ""}`}
          style={cover.style}
        >
          <span className={`truncate text-xs font-bold ${cover.titleClassName}`}>
            {title ?? "Notebook"}
          </span>
          {pageNumber ? (
            <span
              className={`ml-auto rounded-full px-2 py-0.5 text-[9px] font-bold ${
                cover.titleClassName.includes("stone-800")
                  ? "bg-stone-900/10 text-stone-800"
                  : "bg-black/15 text-white"
              }`}
            >
              p.{pageNumber}
            </span>
          ) : null}
        </div>
      ) : null}

      <div
        data-page-scrollport
        className="relative min-h-0 flex-1 overflow-auto overscroll-contain touch-pan-y p-3 sm:p-5 [-webkit-overflow-scrolling:touch]"
      >
        <div
          data-notebook-paper
          data-chalkboard={
            notebook?.pageBackgroundColor === CHALKBOARD_BACKGROUND ||
            notebook?.pageBackgroundColor === "#1a3d32" ||
            notebook?.pageBackgroundColor === "#1e3d32"
              ? "true"
              : undefined
          }
          className={`relative mx-auto min-h-full w-full max-w-[51rem] overflow-hidden rounded-[2px] shadow-[0_14px_40px_rgba(28,25,23,0.18),0_3px_8px_rgba(28,25,23,0.08),inset_0_1px_0_rgba(255,255,255,0.55)] ring-1 ring-stone-900/8 ${paperClassName} ${paddingClass}`}
          style={
            customBackgroundUrl
              ? {
                  ...surfaceStyle,
                  backgroundImage: `url(${customBackgroundUrl})`,
                  backgroundSize: "contain",
                  backgroundPosition: "center top",
                  backgroundRepeat: "no-repeat",
                  backgroundColor: "#fff",
                  minHeight: "100%",
                }
              : { ...surfaceStyle, minHeight: "100%" }
          }
        >
          <div data-notebook-binding aria-hidden />
          {children}
        </div>
      </div>
    </div>
  );
}

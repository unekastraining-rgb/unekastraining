"use client";

import type { NotebookChromeState } from "@/lib/core/note-types";
import { resolveNotebookCoverStyle } from "@/lib/core/page-templates";
import { PageTemplateOverlay, templateContentPadding } from "@/components/core/PageTemplateOverlay";

function pageSurfaceStyle(notebook?: NotebookChromeState): {
  backgroundColor?: string;
  background?: string;
  backgroundImage?: string;
  boxShadow?: string;
} {
  const bg = notebook?.pageBackgroundColor ?? "#fffdf9";
  const edge = notebook?.edgeColor ?? "#f5e6d3";
  const scheme = notebook?.colorScheme ?? "solid";
  const palette = notebook?.appliedPaletteColors;

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
  const showCover = notebook?.showCover !== false;
  const cover = resolveNotebookCoverStyle(notebook);
  const templateId = notebook?.pageTemplateId;
  const paddingClass = templateContentPadding(templateId);
  const surfaceStyle = pageSurfaceStyle(notebook);

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-2xl bg-gradient-to-br from-[#f5ebe0] to-[#fff8f1] p-3 shadow-sm">
      <div className="flex min-h-0 flex-1 overflow-hidden rounded-xl shadow-lg ring-1 ring-stone-300/40">
        <div className="relative flex w-8 shrink-0 flex-col items-center border-r border-stone-300/50 bg-[#f0e8dc] py-4">
          {showCover ? (
            <div
              className={`absolute inset-y-0 left-0 w-1 ${cover.className ?? ""}`}
              style={cover.style}
            />
          ) : null}
          <span className="mt-2 rotate-180 text-[10px] font-black tracking-widest text-stone-500 [writing-mode:vertical-rl]">
            {pageNumber ?? 1}
          </span>
        </div>
        {showCover ? (
          <div
            className={`hidden w-2 shrink-0 sm:block ${cover.className ?? ""}`}
            style={cover.style}
          />
        ) : null}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {showCover ? (
            <div
              className={`flex h-12 shrink-0 items-center px-4 ${cover.className ?? ""}`}
              style={cover.style}
            >
              <span className="truncate text-sm font-bold text-white drop-shadow-sm">
                {title ?? "Notebook"}
              </span>
              {pageNumber ? (
                <span className="ml-auto rounded-full bg-black/15 px-2 py-0.5 text-[10px] font-bold text-white">
                  p.{pageNumber}
                </span>
              ) : null}
            </div>
          ) : null}
          <div
            className={`relative min-h-[20rem] flex-1 overflow-auto sm:min-h-[70vh] ${customBackgroundUrl ? "" : paperClass} ${paddingClass}`}
            style={
              customBackgroundUrl
                ? {
                    ...surfaceStyle,
                    backgroundImage: `url(${customBackgroundUrl})`,
                    backgroundSize: "contain",
                    backgroundPosition: "center top",
                    backgroundRepeat: "no-repeat",
                  }
                : surfaceStyle
            }
          >
            <PageTemplateOverlay templateId={templateId} />
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

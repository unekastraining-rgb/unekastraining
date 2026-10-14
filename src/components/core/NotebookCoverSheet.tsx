"use client";

import { useTapHandler } from "@/hooks/useTapHandler";
import { resolveNotebookCoverStyle } from "@/lib/core/page-templates";
import type { NotebookChromeState } from "@/lib/core/note-types";

/** Full-screen cover — tap through to paper (not a tiny shelf thumbnail). */
export function NotebookCoverSheet({
  notebook,
  title,
  subtitle,
  onOpenPages,
}: {
  notebook?: NotebookChromeState;
  title: string;
  subtitle?: string;
  onOpenPages: () => void;
}) {
  const cover = resolveNotebookCoverStyle(notebook);
  const tap = useTapHandler(onOpenPages);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-stone-200" data-notebook-cover>
      <button
        type="button"
        data-core-chrome-action="1"
        {...tap}
        className={`relative flex min-h-0 flex-1 flex-col justify-between overflow-hidden p-6 text-left sm:p-10 ${cover.className ?? ""}`}
        style={{ ...cover.style, WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}
      >
        <div className="absolute inset-y-0 left-0 w-4 bg-black/10 sm:w-6" />
        <p
          className={`relative text-[10px] font-bold uppercase tracking-[0.25em] sm:text-xs ${cover.titleClassName} opacity-80`}
        >
          Study Haul · Core
        </p>
        <div className="relative my-auto max-w-xl">
          <h2
            className={`text-3xl font-black leading-tight sm:text-4xl md:text-5xl ${cover.titleClassName}`}
          >
            {title || "Untitled notebook"}
          </h2>
          {subtitle ? (
            <p className={`mt-3 text-base sm:text-lg ${cover.titleClassName} opacity-85`}>
              {subtitle}
            </p>
          ) : null}
        </div>
        <p className={`relative text-sm font-semibold ${cover.titleClassName} opacity-75`}>
          Tap anywhere to open paper and write
        </p>
      </button>
    </div>
  );
}

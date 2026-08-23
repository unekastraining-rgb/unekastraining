"use client";

import { useEffect } from "react";
import { ExternalLink, FileText, NotebookPen, X } from "lucide-react";

import type { MaterialPreviewPayload } from "@/lib/materials/client";

export function MaterialPreviewModal({
  material,
  openingCore,
  onClose,
  onOpenInCore,
}: {
  material: MaterialPreviewPayload;
  openingCore?: boolean;
  onClose: () => void;
  onOpenInCore: () => void;
}) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Close preview"
        className="absolute inset-0 bg-stone-900/50 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="material-preview-title"
        className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-orange-100 bg-white shadow-2xl sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-orange-100 px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
              {material.courseTitle}
            </p>
            <h2 id="material-preview-title" className="truncate text-lg font-bold text-stone-900">
              {material.title}
            </h2>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              {material.type.replaceAll("_", " ")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-stone-200 p-2 text-stone-500 hover:bg-stone-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-stone-50/60 p-5">
          {material.hasFile ? (
            <iframe
              title={material.title}
              src={`/api/materials/${material.id}/file`}
              className="h-[min(60vh,520px)] w-full rounded-2xl border border-orange-100 bg-white"
            />
          ) : material.previewText ? (
            <pre className="whitespace-pre-wrap rounded-2xl border border-orange-100 bg-white p-4 text-sm leading-relaxed text-stone-700">
              {material.previewText}
            </pre>
          ) : material.url ? (
            <div className="rounded-2xl border border-dashed border-orange-200 bg-white px-6 py-10 text-center">
              <FileText className="mx-auto h-8 w-8 text-stone-400" />
              <p className="mt-3 text-sm text-stone-600">
                This material links to an external source.
              </p>
              <a
                href={material.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
              >
                Open source
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-orange-200 bg-white px-6 py-10 text-center text-sm text-stone-500">
              No preview available for this material yet.
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-orange-100 bg-white px-5 py-4">
          <p className="text-xs text-stone-500">
            Quick view — annotate and take notes in a Core workbook.
          </p>
          <button
            type="button"
            onClick={onOpenInCore}
            disabled={openingCore}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
          >
            <NotebookPen className="h-4 w-4" />
            {openingCore ? "Opening…" : "Open in Core workbook"}
          </button>
        </div>
      </div>
    </div>
  );
}

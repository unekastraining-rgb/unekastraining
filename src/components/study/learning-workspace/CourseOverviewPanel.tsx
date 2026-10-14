"use client";

import type { CourseOverview } from "@/lib/learning/studio/course-overview";

/**
 * Bundle J — Course/path overview for the curriculum surface.
 * Spatial summary — not a card dump; position ≠ mastery.
 */
export function CourseOverviewPanel({
  overview,
  onClose,
}: {
  overview: CourseOverview;
  onClose?: () => void;
}) {
  return (
    <div
      data-course-overview
      className="flex flex-col border-b border-stone-800/10 bg-[#f7f5f1] px-3 py-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-500">
            Course overview
          </p>
          <p className="mt-0.5 truncate text-sm font-semibold text-stone-900">
            {overview.pathTitle}
          </p>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 min-w-11 items-center justify-center text-xs font-semibold text-stone-600 touch-manipulation hover:bg-stone-200/60"
            aria-label="Close overview"
          >
            Close
          </button>
        ) : null}
      </div>

      <p className="mt-2 text-[10px] leading-snug text-stone-400">
        {overview.positionDisclaimer}
      </p>

      <p className="mt-2 text-[11px] text-stone-600">
        {overview.totalCount} concepts
        {overview.mappedCount > 0
          ? ` · ${overview.mappedCount} curriculum-mapped`
          : null}
      </p>

      <ol className="mt-3 max-h-48 space-y-1.5 overflow-y-auto">
        {overview.items.map((item) => (
          <li
            key={`${item.pathIndex}-${item.title}`}
            data-overview-item={item.positionLabel}
            className="flex items-start gap-2 text-sm text-stone-800"
          >
            <span className="mt-0.5 w-14 shrink-0 text-[10px] font-bold uppercase tracking-wide text-stone-400">
              {item.positionLabel}
            </span>
            <span className="min-w-0 leading-snug">
              <span className="font-medium">{item.title}</span>
              {item.unitLabel ? (
                <span className="mt-0.5 block text-[10px] text-stone-500">
                  {item.curriculumLabel ?? "Unit"} · {item.unitLabel}
                </span>
              ) : null}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

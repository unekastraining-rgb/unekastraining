"use client";

import { useMemo, useState } from "react";
import { PanelLeftClose, PanelLeft } from "lucide-react";

import { PATH_POSITION_DISCLAIMER } from "@/lib/learning/unified-experience";
import type { CurriculumSection } from "@/lib/learning/studio";
import {
  curriculumPositionLabel,
  toCurriculumPositionStatus,
} from "@/lib/learning/studio/curriculum-position";
import { buildCourseOverviewFromPath } from "@/lib/learning/studio/course-overview";
import { CourseOverviewPanel } from "@/components/study/learning-workspace/CourseOverviewPanel";

export type CurriculumPathItem = {
  id: string;
  title: string;
  /** Canonical: visited | current | next | available */
  status: import("@/lib/learning/studio/curriculum-position").CurriculumPositionStatus;
};

/**
 * Bundle G/J UX — Collapsible left curriculum rail + optional course overview.
 * Open: course journey. Collapsed: immersive learning canvas.
 */
export function CurriculumRail({
  open,
  onOpenChange,
  pathTitle,
  items,
  sections,
  currentIndex,
  compactLabel,
  conceptIds,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pathTitle?: string;
  items: CurriculumPathItem[];
  sections?: CurriculumSection[];
  currentIndex: number;
  /** Shown in chrome when collapsed. */
  compactLabel?: string;
  /** Optional KL concept ids aligned with path titles (Bundle J overview). */
  conceptIds?: Array<string | null | undefined>;
}) {
  const [overviewOpen, setOverviewOpen] = useState(false);
  const overview = useMemo(
    () =>
      buildCourseOverviewFromPath({
        pathTitle,
        conceptTitles: items.map((i) => i.title),
        conceptIds,
        currentIndex,
      }),
    [pathTitle, items, conceptIds, currentIndex],
  );
  const hasContent =
    (sections && sections.length > 0) || items.length > 0;

  if (!hasContent) {
    return null;
  }

  if (!open) {
    return (
      <div
        data-curriculum-rail
        data-curriculum-collapsed="true"
        className="flex w-12 shrink-0 flex-col items-center border-r border-stone-800/10 bg-[#efece6] py-3"
      >
        <button
          type="button"
          data-curriculum-show
          data-hide-curriculum="false"
          aria-label="Show curriculum"
          title="Show curriculum"
          onClick={() => onOpenChange(true)}
          className="inline-flex min-h-11 min-w-11 items-center justify-center text-stone-700 touch-manipulation hover:bg-stone-200/60"
        >
          <PanelLeft className="h-5 w-5" aria-hidden />
        </button>
        {compactLabel ? (
          <p
            className="mt-4 max-h-40 overflow-hidden text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500 [writing-mode:vertical-rl] rotate-180"
            title={compactLabel}
          >
            {compactLabel}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <aside
      data-curriculum-rail
      data-curriculum-collapsed="false"
      data-learning-journey
      className="flex w-[min(17rem,85vw)] shrink-0 flex-col border-r border-stone-800/10 bg-[#efece6]"
      aria-label="Course curriculum"
    >
      <div className="flex items-start justify-between gap-2 border-b border-stone-800/10 px-3 py-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-500">
            Course
          </p>
          <p className="mt-0.5 truncate text-sm font-semibold text-stone-900">
            {pathTitle ?? "Learning path"}
          </p>
        </div>
        <button
          type="button"
          data-curriculum-hide
          data-hide-curriculum="true"
          aria-label="Hide curriculum"
          title="Hide curriculum"
          onClick={() => onOpenChange(false)}
          className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center text-stone-600 touch-manipulation hover:bg-stone-200/60"
        >
          <PanelLeftClose className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        <p className="text-[10px] leading-snug text-stone-400">
          {PATH_POSITION_DISCLAIMER}
        </p>

        <button
          type="button"
          data-course-overview-toggle
          onClick={() => setOverviewOpen((v) => !v)}
          className="mt-2 inline-flex min-h-11 w-full items-center justify-center border border-stone-300 bg-white px-3 text-xs font-semibold text-stone-800 touch-manipulation hover:bg-stone-50"
        >
          {overviewOpen ? "Hide course overview" : "Course overview"}
        </button>

        {overviewOpen ? (
          <div className="mt-2">
            <CourseOverviewPanel
              overview={overview}
              onClose={() => setOverviewOpen(false)}
            />
          </div>
        ) : null}

        {sections && sections.length > 0 ? (
          <div className="mt-3 space-y-4">
            {sections.map((section) => (
              <div key={section.id} data-curriculum-section={section.title}>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500">
                  {section.title}
                </p>
                <ol className="mt-1.5 space-y-1">
                  {section.items.map((item) => {
                    const position = toCurriculumPositionStatus(
                      item.status,
                      item.pathIndex,
                      currentIndex,
                    );
                    const label = curriculumPositionLabel(position);
                    return (
                    <li
                      key={item.id}
                      data-curriculum-item={position}
                      data-curriculum-position-label={label}
                      data-curriculum-current={
                        item.pathIndex === currentIndex ? "true" : "false"
                      }
                      className={`flex items-start gap-2 text-sm ${
                        position === "current"
                          ? "font-semibold text-teal-950"
                          : position === "visited"
                            ? "text-stone-600"
                            : position === "next"
                              ? "text-stone-700"
                              : "text-stone-400"
                      }`}
                    >
                      <span aria-hidden className="mt-0.5 w-3.5 shrink-0 text-center text-xs">
                        {position === "visited"
                          ? "✓"
                          : position === "current"
                            ? "●"
                            : position === "next"
                              ? "→"
                              : "○"}
                      </span>
                      <span className="min-w-0 flex-1 leading-snug">
                        <span className="block">{item.title}</span>
                        <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-wide text-stone-400">
                          {label}
                        </span>
                      </span>
                    </li>
                    );
                  })}
                </ol>
              </div>
            ))}
          </div>
        ) : (
          <ol className="mt-3 space-y-1.5">
            {items.map((item, i) => {
              const position = toCurriculumPositionStatus(
                item.status,
                i,
                currentIndex,
              );
              const label = curriculumPositionLabel(position);
              return (
              <li
                key={item.id}
                data-curriculum-item={position}
                data-curriculum-position-label={label}
                data-curriculum-current={i === currentIndex ? "true" : "false"}
                className={`flex items-start gap-2 text-sm ${
                  position === "current"
                    ? "font-semibold text-teal-950"
                    : position === "visited"
                      ? "text-stone-600"
                      : position === "next"
                        ? "text-stone-700"
                        : "text-stone-400"
                }`}
              >
                <span aria-hidden className="mt-0.5 w-3.5 shrink-0 text-center text-xs">
                  {position === "visited"
                    ? "✓"
                    : position === "current"
                      ? "●"
                      : position === "next"
                        ? "→"
                        : "○"}
                </span>
                <span className="min-w-0 flex-1 leading-snug">
                  <span className="block">{item.title}</span>
                  <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-wide text-stone-400">
                    {label}
                  </span>
                </span>
              </li>
              );
            })}
          </ol>
        )}
      </div>
    </aside>
  );
}

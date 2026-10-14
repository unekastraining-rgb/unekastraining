"use client";

import { useState } from "react";
import { ChevronDown, ListTree } from "lucide-react";

import { PATH_POSITION_DISCLAIMER } from "@/lib/learning/unified-experience";
import type { CurriculumSection } from "@/lib/learning/studio";
import {
  curriculumPositionLabel,
  toCurriculumPositionStatus,
} from "@/lib/learning/studio/curriculum-position";

export type CurriculumPathItem = {
  id: string;
  title: string;
  /** Canonical path position — not mastery. */
  status: import("@/lib/learning/studio/curriculum-position").CurriculumPositionStatus;
};

/**
 * Bundle G — Curriculum / journey drawer.
 * Sectioned path from existing concept titles — never invents mastery.
 */
export function CurriculumDrawer({
  pathTitle,
  items,
  sections,
  currentIndex,
}: {
  pathTitle?: string;
  items: CurriculumPathItem[];
  sections?: CurriculumSection[];
  currentIndex: number;
}) {
  const [open, setOpen] = useState(false);
  const hasSections = Boolean(sections && sections.length > 0);
  if (!hasSections && items.length < 2) return null;

  return (
    <div
      data-curriculum-drawer
      data-learning-journey
      className="border-t border-stone-800/10 bg-[#f7f5f1]"
    >
      <button
        type="button"
        data-curriculum-drawer-toggle
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-11 w-full items-center justify-between gap-2 px-4 text-sm font-semibold text-stone-800 touch-manipulation hover:bg-stone-100/80"
      >
        <span className="inline-flex min-w-0 items-center gap-2">
          <ListTree className="h-4 w-4 shrink-0 text-teal-800" aria-hidden />
          <span className="truncate">
            Journey
            {pathTitle ? (
              <span className="font-normal text-stone-500"> · {pathTitle}</span>
            ) : null}
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          data-curriculum-drawer-panel
          className="max-h-64 overflow-y-auto border-t border-stone-800/10 px-4 py-3"
        >
          <p className="text-[10px] text-stone-400">{PATH_POSITION_DISCLAIMER}</p>

          {hasSections ? (
            <div className="mt-3 space-y-4">
              {sections!.map((section) => (
                <div key={section.id} data-curriculum-section={section.title}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-500">
                    {section.title}
                  </p>
                  <ol className="mt-1.5 space-y-1.5">
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
                              : "text-stone-400"
                        }`}
                      >
                        <span
                          aria-hidden
                          className="mt-0.5 w-4 shrink-0 text-center"
                        >
                          {position === "visited"
                            ? "✓"
                            : position === "current"
                              ? "●"
                              : position === "next"
                                ? "→"
                                : "○"}
                        </span>
                        <span>
                          {item.title}
                          <span className="ml-1 text-[10px] uppercase text-stone-400">
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
            <ol className="mt-2 space-y-1.5">
              {items.map((item, i) => {
                const position = toCurriculumPositionStatus(
                  item.status,
                  i,
                  currentIndex,
                );
                return (
                <li
                  key={item.id}
                  data-curriculum-item={position}
                  data-curriculum-current={i === currentIndex ? "true" : "false"}
                  className={`flex items-start gap-2 text-sm ${
                    position === "current"
                      ? "font-semibold text-teal-950"
                      : position === "visited"
                        ? "text-stone-600"
                        : "text-stone-400"
                  }`}
                >
                  <span aria-hidden className="mt-0.5 w-4 shrink-0 text-center">
                    {position === "visited"
                      ? "✓"
                      : position === "current"
                        ? "●"
                        : position === "next"
                          ? "→"
                          : "○"}
                  </span>
                  <span>{item.title}</span>
                </li>
                );
              })}
            </ol>
          )}
        </div>
      ) : null}
    </div>
  );
}

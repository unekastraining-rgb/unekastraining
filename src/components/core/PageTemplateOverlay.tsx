"use client";

import type { PageTemplateId } from "@/lib/core/page-templates";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function PageTemplateOverlay({ templateId }: { templateId?: PageTemplateId }) {
  if (templateId === "planner_week") {
    return (
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] border-b border-amber-200/80 bg-gradient-to-b from-[#fff8f1] to-white">
        <div className="grid grid-cols-7 gap-px px-4 pb-2 pt-3">
          {WEEKDAYS.map((day) => (
            <div key={day} className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-wide text-amber-800/70">
                {day}
              </p>
              <div className="mx-auto mt-1 h-8 w-full max-w-[3rem] rounded-lg border border-dashed border-amber-200/60 bg-white/60" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (templateId === "meeting_notes") {
    return (
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] space-y-2 border-b border-stone-200/80 bg-white/90 px-6 py-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Agenda</p>
        <div className="h-10 border-b border-dashed border-stone-200" />
        <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Notes</p>
      </div>
    );
  }

  if (templateId === "study_board") {
    return (
      <div className="pointer-events-none absolute inset-0 z-[1] grid grid-cols-3">
        {["Know", "Want to know", "Learned"].map((label) => (
          <div key={label} className="border-r border-stone-200/60 px-3 py-3 last:border-r-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">{label}</p>
          </div>
        ))}
      </div>
    );
  }

  if (templateId === "cornell" || templateId === "cornell_ruled" || templateId === "cornell_grid") {
    return (
      <div className="pointer-events-none absolute inset-0 z-[1] grid grid-cols-[1fr_12rem]">
        <div />
        <div className="border-l border-orange-200/70 bg-orange-50/20" />
        <div className="col-span-2 border-t border-teal-200/70 bg-teal-50/15" style={{ height: "5rem" }} />
      </div>
    );
  }

  if (templateId === "two_column") {
    return (
      <div className="pointer-events-none absolute inset-0 z-[1] border-x-[40%] border-transparent">
        <div className="absolute bottom-0 left-[50%] top-0 w-px bg-stone-200/80" />
      </div>
    );
  }

  if (templateId === "three_column") {
    return (
      <div className="pointer-events-none absolute inset-0 z-[1]">
        <div className="absolute bottom-0 left-[33.333%] top-0 w-px bg-stone-200/80" />
        <div className="absolute bottom-0 left-[66.666%] top-0 w-px bg-stone-200/80" />
      </div>
    );
  }

  if (templateId === "mckinsey") {
    return (
      <div className="pointer-events-none absolute inset-0 z-[1] flex flex-col">
        <div className="border-b border-stone-300/80 px-6 py-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
            Action title
          </p>
          <div className="mt-2 h-6 border-b border-dashed border-stone-200" />
        </div>
        <div className="grid flex-1 grid-cols-2">
          <div className="border-r border-stone-200/80 px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Situation / complication
            </p>
          </div>
          <div className="px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Insight / so-what
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (templateId === "kanban") {
    return (
      <div className="pointer-events-none absolute inset-0 z-[1] grid grid-cols-3">
        {["To do", "Doing", "Done"].map((label) => (
          <div key={label} className="border-r border-stone-200/60 px-3 py-3 last:border-r-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">{label}</p>
          </div>
        ))}
      </div>
    );
  }

  return null;
}

export function templateContentPadding(templateId?: PageTemplateId): string {
  switch (templateId) {
    case "planner_week":
      return "pt-24";
    case "meeting_notes":
      return "pt-28";
    case "study_board":
    case "kanban":
      return "pt-8";
    case "mckinsey":
      return "pt-20";
    case "cornell":
    case "cornell_ruled":
    case "cornell_grid":
      return "";
    default:
      return "";
  }
}

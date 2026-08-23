"use client";

import { useState } from "react";

import {
  CANVAS_STARTER_GROUPS,
  CANVAS_STARTERS,
  type CanvasStarterCategory,
} from "@/lib/core/canvas-starters";

export function CanvasStartersPanel({
  onApply,
  title = "Canvas starters",
  description = "Select one or more — formats become draggable blocks; layouts add stickies and shapes on the same page.",
}: {
  onApply: (starterIds: string[]) => void;
  title?: string;
  description?: string;
}) {
  const [selectedStarters, setSelectedStarters] = useState<Set<string>>(new Set());
  const [activeGroup, setActiveGroup] = useState<CanvasStarterCategory>("structured");

  const visibleStarters = CANVAS_STARTERS.filter((starter) => starter.category === activeGroup);

  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">{title}</p>
      <p className="mt-0.5 text-[10px] text-stone-500">{description}</p>
      <div className="mt-2 flex flex-wrap gap-1">
        {CANVAS_STARTER_GROUPS.map((group) => (
          <button
            key={group.id}
            type="button"
            onClick={() => setActiveGroup(group.id)}
            className={`rounded-lg px-2 py-1 text-[10px] font-semibold ${
              activeGroup === group.id
                ? "bg-teal-700 text-white"
                : "bg-stone-100 text-stone-600"
            }`}
          >
            {group.label}
          </button>
        ))}
      </div>
      <div className="mt-2 flex max-h-40 flex-wrap gap-1 overflow-y-auto">
        {visibleStarters.map((starter) => {
          const selected = selectedStarters.has(starter.id);
          return (
            <button
              key={starter.id}
              type="button"
              onClick={() =>
                setSelectedStarters((current) => {
                  const next = new Set(current);
                  if (next.has(starter.id)) next.delete(starter.id);
                  else next.add(starter.id);
                  return next;
                })
              }
              className={`rounded-lg px-2 py-1 text-[10px] font-semibold ${
                selected
                  ? "bg-orange-600 text-white"
                  : "bg-orange-50 text-stone-600 hover:bg-orange-100"
              }`}
            >
              {starter.emoji} {starter.label}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        disabled={selectedStarters.size === 0}
        onClick={() => {
          onApply(Array.from(selectedStarters));
          setSelectedStarters(new Set());
        }}
        className="mt-2 w-full rounded-lg bg-stone-900 px-3 py-2 text-[10px] font-bold text-white disabled:opacity-40"
      >
        Add {selectedStarters.size || ""} starter{selectedStarters.size === 1 ? "" : "s"} to page
      </button>
    </div>
  );
}

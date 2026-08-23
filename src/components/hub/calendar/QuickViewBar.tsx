"use client";

import type { QuickViewMode } from "@/lib/calendar/types";

const views: Array<{ id: QuickViewMode; label: string }> = [
  { id: "today", label: "Today" },
  { id: "week", label: "This week" },
  { id: "due-soon", label: "Due soon" },
];

export function QuickViewBar({
  active,
  onChange,
}: {
  active: QuickViewMode;
  onChange: (mode: QuickViewMode) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {views.map((view) => (
        <button
          key={view.id}
          type="button"
          onClick={() => onChange(view.id)}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            active === view.id
              ? "bg-[var(--sh-primary,#ea580c)] text-white shadow-md"
              : "border border-brand bg-white text-stone-700 hover:bg-brand-soft"
          }`}
        >
          {view.label}
        </button>
      ))}
    </div>
  );
}

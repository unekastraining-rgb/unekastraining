"use client";

import { useEffect, useRef, useState } from "react";
import { Filter } from "lucide-react";

import type { CalendarFilters } from "@/lib/calendar/workspace-types";
import {
  DEFAULT_EVENT_TYPES,
  EVENT_TYPE_LABELS,
} from "@/lib/calendar/workspace-types";

interface CalendarFilterMenuProps {
  filters: CalendarFilters;
  onFiltersChange: (filters: CalendarFilters) => void;
}

export function CalendarFilterMenu({
  filters,
  onFiltersChange,
}: CalendarFilterMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(event: PointerEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onClickOutside);
    return () => document.removeEventListener("pointerdown", onClickOutside);
  }, []);

  const activeCount =
    (filters.datePreset !== "all" ? 1 : 0) +
    (DEFAULT_EVENT_TYPES.length - filters.eventTypes.size) +
    (!filters.showCompleted || !filters.showIncomplete || !filters.showOverdue ? 1 : 0);

  function toggleEventType(type: (typeof DEFAULT_EVENT_TYPES)[number]) {
    const next = new Set(filters.eventTypes);
    if (next.has(type)) next.delete(type);
    else next.add(type);
    onFiltersChange({ ...filters, eventTypes: next });
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
          activeCount > 0
            ? "border-orange-300 bg-orange-50 text-orange-800"
            : "border-orange-200 text-stone-700 hover:bg-orange-50"
        }`}
      >
        <Filter className="h-3.5 w-3.5" />
        Filter
        {activeCount > 0 ? (
          <span className="rounded-full bg-orange-500 px-1.5 py-0.5 text-[10px] text-white">
            {activeCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="fixed inset-x-3 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 max-h-[min(70dvh,24rem)] overflow-y-auto rounded-2xl border border-orange-100 bg-white p-3 shadow-xl sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-[calc(100%+0.5rem)] sm:w-72">
          <section className="mb-4">
            <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Date range
            </h3>
            <div className="space-y-1">
              {(
                [
                  ["all", "All dates"],
                  ["today", "Today"],
                  ["week", "This week"],
                  ["month", "This month"],
                  ["custom", "Custom range"],
                ] as const
              ).map(([value, label]) => (
                <label
                  key={value}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-sm hover:bg-orange-50"
                >
                  <input
                    type="radio"
                    checked={filters.datePreset === value}
                    onChange={() =>
                      onFiltersChange({ ...filters, datePreset: value })
                    }
                    className="text-orange-600"
                  />
                  {label}
                </label>
              ))}
            </div>
            {filters.datePreset === "custom" ? (
              <div className="mt-2 grid grid-cols-1 gap-2">
                <input
                  type="date"
                  value={filters.customStart ?? ""}
                  onChange={(e) =>
                    onFiltersChange({ ...filters, customStart: e.target.value })
                  }
                  className="rounded-lg border border-orange-200 px-2 py-1 text-xs"
                />
                <input
                  type="date"
                  value={filters.customEnd ?? ""}
                  onChange={(e) =>
                    onFiltersChange({ ...filters, customEnd: e.target.value })
                  }
                  className="rounded-lg border border-orange-200 px-2 py-1 text-xs"
                />
              </div>
            ) : null}
          </section>

          <section className="mb-4">
            <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Event types
            </h3>
            <div className="max-h-40 space-y-1 overflow-y-auto">
              {DEFAULT_EVENT_TYPES.map((type) => (
                <label
                  key={type}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-sm hover:bg-orange-50"
                >
                  <input
                    type="checkbox"
                    checked={filters.eventTypes.has(type)}
                    onChange={() => toggleEventType(type)}
                    className="rounded border-orange-200 text-orange-600"
                  />
                  {EVENT_TYPE_LABELS[type]}
                </label>
              ))}
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Status
            </h3>
            <div className="space-y-1">
              {(
                [
                  ["showCompleted", "Completed"],
                  ["showIncomplete", "Incomplete"],
                  ["showOverdue", "Overdue"],
                ] as const
              ).map(([key, label]) => (
                <label
                  key={key}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-sm hover:bg-orange-50"
                >
                  <input
                    type="checkbox"
                    checked={filters[key]}
                    onChange={(e) =>
                      onFiltersChange({ ...filters, [key]: e.target.checked })
                    }
                    className="rounded border-orange-200 text-orange-600"
                  />
                  {label}
                </label>
              ))}
            </div>
          </section>

          <button
            type="button"
            onClick={() =>
              onFiltersChange({
                ...filters,
                datePreset: "all",
                eventTypes: new Set(DEFAULT_EVENT_TYPES),
                showCompleted: true,
                showIncomplete: true,
                showOverdue: true,
              })
            }
            className="mt-3 w-full rounded-lg border border-orange-200 py-1.5 text-xs font-semibold text-stone-600 hover:bg-orange-50"
          >
            Reset filters
          </button>
        </div>
      ) : null}
    </div>
  );
}

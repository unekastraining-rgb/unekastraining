"use client";

import { ChevronLeft, ChevronRight, Settings } from "lucide-react";

import { useCalendarAppearance } from "@/components/calendar/CalendarAppearanceContext";
import { CalendarFilterMenu } from "@/components/calendar/CalendarFilterMenu";
import type { CalendarFilters, CalendarViewMode } from "@/lib/calendar/workspace-types";

interface CalendarToolbarProps {
  view: CalendarViewMode;
  anchorDate: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onOpenSettings: () => void;
  filters: CalendarFilters;
  onFiltersChange: (filters: CalendarFilters) => void;
  loading?: boolean;
}

export function CalendarToolbar({
  view,
  anchorDate,
  onPrev,
  onNext,
  onToday,
  onOpenSettings,
  filters,
  onFiltersChange,
  loading,
}: CalendarToolbarProps) {
  const appearance = useCalendarAppearance();
  const label = formatToolbarLabel(view, anchorDate);
  const buttonClass =
    "rounded-lg border px-2 py-1.5 text-xs font-semibold transition hover:opacity-90";

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 backdrop-blur-xl"
      style={{
        borderColor: appearance.gridLineColor,
        backgroundColor: appearance.headerBackground,
        color: appearance.textColor,
      }}
    >
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onPrev}
          className={`${buttonClass} p-2`}
          style={{
            borderColor: appearance.gridLineColor,
            color: appearance.textColor,
          }}
          aria-label="Previous"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onNext}
          className={`${buttonClass} p-2`}
          style={{
            borderColor: appearance.gridLineColor,
            color: appearance.textColor,
          }}
          aria-label="Next"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onToday}
          className={buttonClass}
          style={{
            borderColor: appearance.accentColor,
            backgroundColor: appearance.accentColor,
            color: appearance.isDark ? "#fff" : "#fff",
          }}
        >
          Today
        </button>
        <CalendarFilterMenu filters={filters} onFiltersChange={onFiltersChange} />
        <button
          type="button"
          onClick={onOpenSettings}
          className={`${buttonClass} p-2 lg:hidden`}
          style={{
            borderColor: appearance.gridLineColor,
            color: appearance.textColor,
          }}
          aria-label="Calendar settings"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>

      <h2 className="text-lg font-bold tracking-tight" style={{ color: appearance.textColor }}>
        {label}
      </h2>

      {loading ? (
        <span className="text-xs font-medium" style={{ color: appearance.mutedTextColor }}>
          Updating…
        </span>
      ) : (
        <span
          className="text-xs font-medium capitalize"
          style={{ color: appearance.mutedTextColor }}
        >
          {view} view
        </span>
      )}
    </div>
  );
}

function formatToolbarLabel(view: CalendarViewMode, date: Date): string {
  if (view === "day") {
    return date.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  if (view === "week") {
    const start = new Date(date);
    const day = start.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + diff);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${end.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
  }

  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

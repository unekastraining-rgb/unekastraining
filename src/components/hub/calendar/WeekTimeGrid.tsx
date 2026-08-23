"use client";

import { useEffect, useState } from "react";

import {
  buildWeekDays,
  TimeGridView,
} from "@/components/calendar/views/TimeGridView";
import {
  DEFAULT_CALENDAR_SETTINGS,
  type CalendarSettings,
} from "@/lib/calendar/settings";
import type { WorkspaceCalendarItem } from "@/lib/calendar/workspace-types";

interface HubWeekTimeGridProps {
  weekStartDate: Date;
  items: WorkspaceCalendarItem[];
  selectedEventId: string | null;
  onSelectEvent: (id: string) => void;
  onEventMove: (id: string, startAt: string, endAt: string | null) => void;
  onEventResize?: (id: string, startAt: string, endAt: string) => void;
  onSlotClick?: (date: Date, hour: number) => void;
  onToggleComplete?: (id: string, completed: boolean) => void;
}

export function WeekTimeGrid({
  weekStartDate,
  items,
  selectedEventId,
  onSelectEvent,
  onEventMove,
  onEventResize,
  onSlotClick,
  onToggleComplete,
}: HubWeekTimeGridProps) {
  const [settings, setSettings] = useState<CalendarSettings>(DEFAULT_CALENDAR_SETTINGS);

  useEffect(() => {
    void fetch("/api/calendar/settings")
      .then((response) => response.json())
      .then((data) => {
        if (data.success && data.settings) {
          setSettings(data.settings as CalendarSettings);
        }
      })
      .catch(() => {
        // Keep defaults when settings are unavailable.
      });
  }, []);

  const weekStartsOnMonday = settings.weekStartsOn === "monday";

  return (
    <div className="overflow-hidden rounded-3xl border border-brand bg-white shadow-sm">
      <div className="border-b border-brand px-4 py-3">
        <h3 className="font-bold text-stone-900">Week view</h3>
        <p className="text-sm text-stone-500">
          Drag to reschedule · drag edges to resize · click a slot to add
        </p>
      </div>

      <div className="p-2">
        <TimeGridView
          days={buildWeekDays(weekStartDate, weekStartsOnMonday)}
          items={items}
          selectedId={selectedEventId}
          onSelect={onSelectEvent}
          onSlotClick={onSlotClick ?? (() => {})}
          onEventMove={onEventMove}
          onEventResize={onEventResize}
          onToggleComplete={onToggleComplete}
          hourStart={settings.workingHoursStart}
          hourEnd={settings.workingHoursEnd}
        />
      </div>
    </div>
  );
}

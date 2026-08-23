"use client";

import { MonthView } from "@/components/calendar/views/MonthView";
import type { WorkspaceCalendarItem } from "@/lib/calendar/workspace-types";

interface HubMonthCalendarProps {
  anchorDate: Date;
  items: WorkspaceCalendarItem[];
  selectedEventId: string | null;
  onSelectEvent: (id: string) => void;
  onSelectDate: (date: Date) => void;
  onEventMove: (id: string, startAt: string, endAt: string | null) => void;
  onToggleComplete?: (id: string, completed: boolean) => void;
}

export function HubMonthCalendar({
  anchorDate,
  items,
  selectedEventId,
  onSelectEvent,
  onSelectDate,
  onEventMove,
  onToggleComplete,
}: HubMonthCalendarProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-brand bg-white shadow-sm">
      <div className="border-b border-brand px-4 py-3">
        <h3 className="font-bold text-stone-900">Month view</h3>
        <p className="text-sm text-stone-500">
          Drag events between days · click a day to jump to week view
        </p>
      </div>

      <div className="p-2">
        <MonthView
          anchorDate={anchorDate}
          items={items}
          selectedId={selectedEventId}
          onSelect={onSelectEvent}
          onDayClick={onSelectDate}
          onEventMove={onEventMove}
          onToggleComplete={onToggleComplete}
        />
      </div>
    </div>
  );
}

"use client";

import { CourseEventBlock } from "@/components/calendar/CourseEventBlock";
import { useCalendarAppearance } from "@/components/calendar/CalendarAppearanceContext";
import {
  addDays,
  endOfMonth,
  startOfMonth,
  startOfWeek,
} from "@/lib/calendar/date-utils";
import { localDateKey } from "@/lib/calendar/types";
import { isSameDay } from "@/lib/calendar/date-utils";
import type { WorkspaceCalendarItem } from "@/lib/calendar/workspace-types";

interface MonthViewProps {
  anchorDate: Date;
  items: WorkspaceCalendarItem[];
  selectedId: string | null;
  focusedCourseId?: string | null;
  onSelect: (id: string) => void;
  onDayClick: (date: Date) => void;
  onEventMove?: (id: string, startAt: string, endAt: string | null) => void;
  onToggleComplete?: (id: string, completed: boolean) => void;
}

function moveItemToDay(
  item: WorkspaceCalendarItem,
  targetDay: Date,
): { startAt: string; endAt: string | null } {
  const oldStart = new Date(item.startAt);
  const oldEnd = item.endAt ? new Date(item.endAt) : null;
  const dayDelta = Math.round(
    (new Date(targetDay.toDateString()).getTime() -
      new Date(oldStart.toDateString()).getTime()) /
      (24 * 60 * 60 * 1000),
  );

  const newStart = new Date(oldStart);
  newStart.setDate(newStart.getDate() + dayDelta);

  if (item.allDay) {
    if (!oldEnd) {
      return { startAt: newStart.toISOString(), endAt: null };
    }
    const newEnd = new Date(oldEnd);
    newEnd.setDate(newEnd.getDate() + dayDelta);
    return { startAt: newStart.toISOString(), endAt: newEnd.toISOString() };
  }

  const duration = oldEnd
    ? oldEnd.getTime() - oldStart.getTime()
    : 60 * 60 * 1000;
  const newEnd = new Date(newStart.getTime() + duration);
  return { startAt: newStart.toISOString(), endAt: newEnd.toISOString() };
}

export function MonthView({
  anchorDate,
  items,
  selectedId,
  focusedCourseId,
  onSelect,
  onDayClick,
  onEventMove,
  onToggleComplete,
}: MonthViewProps) {
  const appearance = useCalendarAppearance();
  const monthStart = startOfMonth(anchorDate);
  const gridStart = startOfWeek(monthStart);
  const monthEnd = endOfMonth(anchorDate);
  const weeks: Date[][] = [];

  let cursor = new Date(gridStart);
  while (cursor <= monthEnd || weeks.length < 6) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i += 1) {
      week.push(new Date(cursor));
      cursor = addDays(cursor, 1);
    }
    weeks.push(week);
    if (weeks.length >= 6 && cursor > monthEnd) break;
  }

  const itemsByDate = new Map<string, WorkspaceCalendarItem[]>();
  for (const item of items) {
    const key = localDateKey(new Date(item.startAt));
    const list = itemsByDate.get(key) ?? [];
    list.push(item);
    itemsByDate.set(key, list);
  }

  const today = new Date();

  function handleDayDrop(targetDay: Date, event: React.DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!onEventMove) return;

    const id = event.dataTransfer.getData("text/calendar-item-id");
    if (!id) return;

    const item = items.find((entry) => entry.id === id);
    if (!item?.editable) return;

    const moved = moveItemToDay(item, targetDay);
    onEventMove(id, moved.startAt, moved.endAt);
  }

  return (
    <div
      className="overflow-hidden rounded-2xl border shadow-sm transition-all duration-200"
      style={{
        borderColor: appearance.gridLineColor,
        backgroundColor: appearance.isDark
          ? "rgba(255,255,255,0.03)"
          : "rgba(255,255,255,0.55)",
      }}
    >
      <div
        className="grid grid-cols-7 border-b"
        style={{
          borderColor: appearance.gridLineColor,
          backgroundColor: appearance.headerBackground,
        }}
      >
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <div
            key={day}
            className="px-2 py-2 text-center text-[10px] font-bold uppercase tracking-wider"
            style={{ color: appearance.mutedTextColor }}
          >
            {day}
          </div>
        ))}
      </div>

      <div className="divide-y" style={{ borderColor: appearance.gridLineColor }}>
        {weeks.map((week, weekIndex) => (
          <div
            key={localDateKey(week[0])}
            className="grid grid-cols-7"
            style={{
              borderTop: weekIndex > 0 ? `1px solid ${appearance.gridLineColor}` : undefined,
            }}
          >
            {week.map((date) => {
              const key = localDateKey(date);
              const dayItems = itemsByDate.get(key) ?? [];
              const inMonth = date.getMonth() === anchorDate.getMonth();
              const isToday = isSameDay(date, today);

              return (
                <div
                  key={key}
                  onDragOver={(e) => {
                    if (onEventMove) e.preventDefault();
                  }}
                  onDrop={(e) => handleDayDrop(date, e)}
                  className="min-h-28 border-r p-2 text-left transition last:border-r-0"
                  style={{
                    borderColor: appearance.gridLineColor,
                    backgroundColor: inMonth
                      ? undefined
                      : appearance.isDark
                        ? "rgba(0,0,0,0.2)"
                        : "rgba(0,0,0,0.02)",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => onDayClick(date)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold"
                    style={{
                      backgroundColor: isToday ? appearance.accentColor : undefined,
                      color: isToday
                        ? "#fff"
                        : inMonth
                          ? appearance.textColor
                          : appearance.mutedTextColor,
                    }}
                  >
                    {date.getDate()}
                  </button>
                  <div className="mt-1 space-y-1">
                    {dayItems.slice(0, 3).map((item) => {
                      const dimmed = Boolean(
                        focusedCourseId && item.courseId !== focusedCourseId,
                      );
                      const highlighted = Boolean(
                        focusedCourseId && item.courseId === focusedCourseId,
                      );
                      return (
                        <div
                          key={item.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelect(item.id);
                          }}
                          role="presentation"
                        >
                          <CourseEventBlock
                            item={item}
                            selected={selectedId === item.id}
                            compact
                            dimmed={dimmed}
                            highlighted={highlighted}
                            onClick={() => onSelect(item.id)}
                            onDragStart={(e) => {
                              e.stopPropagation();
                              e.dataTransfer.setData("text/calendar-item-id", item.id);
                            }}
                            onToggleComplete={
                              onToggleComplete
                                ? (completed) => onToggleComplete(item.id, completed)
                                : undefined
                            }
                          />
                        </div>
                      );
                    })}
                    {dayItems.length > 3 ? (
                      <p
                        className="text-[10px] font-semibold"
                        style={{ color: appearance.mutedTextColor }}
                      >
                        +{dayItems.length - 3} more
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

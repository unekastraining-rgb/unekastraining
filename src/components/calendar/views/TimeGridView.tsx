"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { CourseEventBlock } from "@/components/calendar/CourseEventBlock";
import { useCalendarAppearance } from "@/components/calendar/CalendarAppearanceContext";
import { ResizableTimedEvent } from "@/components/calendar/views/ResizableTimedEvent";
import {
  addDays,
  formatHourLabel,
  startOfWeek,
} from "@/lib/calendar/date-utils";
import { minutesFromGridOffset } from "@/lib/calendar/drag-utils";
import { localDateKey } from "@/lib/calendar/types";
import { parseTimeToMinutes } from "@/lib/calendar/types";
import type { WorkspaceCalendarItem } from "@/lib/calendar/workspace-types";

const HOUR_START = 7;
const HOUR_END = 22;
const HOUR_HEIGHT = 52;

interface TimeGridViewProps {
  days: Date[];
  items: WorkspaceCalendarItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onSlotClick: (date: Date, hour: number) => void;
  onEventMove: (id: string, startAt: string, endAt: string | null) => void;
  onEventResize?: (id: string, startAt: string, endAt: string) => void;
  focusedCourseId?: string | null;
  onToggleComplete?: (id: string, completed: boolean) => void;
  hourStart?: number;
  hourEnd?: number;
}

export function TimeGridView({
  days,
  items,
  selectedId,
  onSelect,
  onSlotClick,
  onEventMove,
  onEventResize,
  focusedCourseId,
  onToggleComplete,
  hourStart = HOUR_START,
  hourEnd = HOUR_END,
}: TimeGridViewProps) {
  const appearance = useCalendarAppearance();
  const dayColRef = useRef<HTMLDivElement | null>(null);
  const [dayWidth, setDayWidth] = useState(120);

  useEffect(() => {
    const node = dayColRef.current;
    if (!node) return;

    const update = () => {
      setDayWidth(node.getBoundingClientRect().width);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, [days.length]);

  const hours = useMemo(
    () => Array.from({ length: hourEnd - hourStart + 1 }, (_, i) => hourStart + i),
    [hourStart, hourEnd],
  );

  const allDayByDay = useMemo(() => {
    const map = new Map<string, WorkspaceCalendarItem[]>();
    for (const day of days) {
      const key = localDateKey(day);
      map.set(
        key,
        items.filter(
          (item) => item.allDay && localDateKey(new Date(item.startAt)) === key,
        ),
      );
    }
    return map;
  }, [days, items]);

  const timedItems = items.filter((item) => !item.allDay && item.endAt);

  function handleColumnDrop(day: Date, event: React.DragEvent) {
    event.preventDefault();
    const id = event.dataTransfer.getData("text/calendar-item-id");
    if (!id) return;

    const item = items.find((i) => i.id === id);
    if (!item?.editable) return;

    const column = event.currentTarget as HTMLElement;
    const rect = column.getBoundingClientRect();
    const offsetY = event.clientY - rect.top;
    const totalMinutes = minutesFromGridOffset(
      offsetY,
      HOUR_HEIGHT,
      hourStart,
      hourEnd,
    );

    const start = new Date(day);
    start.setHours(Math.floor(totalMinutes / 60), totalMinutes % 60, 0, 0);

    const oldStart = new Date(item.startAt);
    const oldEnd = item.endAt
      ? new Date(item.endAt)
      : new Date(oldStart.getTime() + 60 * 60 * 1000);
    const duration = oldEnd.getTime() - oldStart.getTime();
    const end = new Date(start.getTime() + duration);

    onEventMove(id, start.toISOString(), end.toISOString());
  }

  function handleAllDayDrop(day: Date, event: React.DragEvent) {
    event.preventDefault();
    const id = event.dataTransfer.getData("text/calendar-item-id");
    if (!id) return;

    const item = items.find((i) => i.id === id);
    if (!item?.editable || !item.allDay) return;

    const oldStart = new Date(item.startAt);
    const dayDelta = Math.round(
      (day.getTime() - new Date(oldStart.toDateString()).getTime()) /
        (24 * 60 * 60 * 1000),
    );

    const newStart = new Date(oldStart);
    newStart.setDate(newStart.getDate() + dayDelta);

    let newEnd: string | null = null;
    if (item.endAt) {
      const oldEnd = new Date(item.endAt);
      oldEnd.setDate(oldEnd.getDate() + dayDelta);
      newEnd = oldEnd.toISOString();
    }

    onEventMove(id, newStart.toISOString(), newEnd);
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
      <div className="overflow-x-auto">
        <div style={{ minWidth: days.length > 1 ? 760 : 400 }}>
          <div
            className="grid border-b"
            style={{
              gridTemplateColumns: `4rem repeat(${days.length}, minmax(0, 1fr))`,
              borderColor: appearance.gridLineColor,
              backgroundColor: appearance.headerBackground,
            }}
          >
            <div />
            {days.map((date) => (
              <div key={localDateKey(date)} className="px-2 py-3 text-center">
                <p
                  className="text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: appearance.mutedTextColor }}
                >
                  {date.toLocaleDateString(undefined, { weekday: "short" })}
                </p>
                <p className="text-lg font-bold" style={{ color: appearance.textColor }}>
                  {date.getDate()}
                </p>
              </div>
            ))}
          </div>

          <div
            className="grid border-b"
            style={{
              gridTemplateColumns: `4rem repeat(${days.length}, minmax(0, 1fr))`,
              borderColor: appearance.gridLineColor,
            }}
          >
            <div
              className="px-2 py-2 text-[10px] font-bold uppercase"
              style={{ color: appearance.mutedTextColor }}
            >
              All day
            </div>
            {days.map((date) => {
              const key = localDateKey(date);
              const dayItems = allDayByDay.get(key) ?? [];
              return (
                <div
                  key={key}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleAllDayDrop(date, e)}
                  className="min-h-10 space-y-1 border-l p-1"
                  style={{ borderColor: appearance.gridLineColor }}
                >
                  {dayItems.map((item) => {
                    const dimmed = Boolean(
                      focusedCourseId && item.courseId !== focusedCourseId,
                    );
                    const highlighted = Boolean(
                      focusedCourseId && item.courseId === focusedCourseId,
                    );
                    return (
                      <CourseEventBlock
                        key={item.id}
                        item={item}
                        selected={selectedId === item.id}
                        compact
                        dimmed={dimmed}
                        highlighted={highlighted}
                        onClick={() => onSelect(item.id)}
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/calendar-item-id", item.id);
                        }}
                        onToggleComplete={
                          onToggleComplete
                            ? (completed) => onToggleComplete(item.id, completed)
                            : undefined
                        }
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>

          <div
            className="grid"
            style={{
              gridTemplateColumns: `4rem repeat(${days.length}, minmax(0, 1fr))`,
            }}
          >
            <div>
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="border-b px-2 text-right text-[10px]"
                  style={{
                    height: HOUR_HEIGHT,
                    borderColor: appearance.gridLineColor,
                    color: appearance.mutedTextColor,
                  }}
                >
                  {formatHourLabel(hour)}
                </div>
              ))}
            </div>

            {days.map((date, dayIndex) => {
              const key = localDateKey(date);
              const dayEvents = timedItems.filter(
                (item) => localDateKey(new Date(item.startAt)) === key,
              );

              return (
                <div
                  key={key}
                  ref={dayIndex === 0 ? dayColRef : undefined}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleColumnDrop(date, e)}
                  className="group/slot relative border-l"
                  style={{
                    height: (hourEnd - hourStart) * HOUR_HEIGHT,
                    borderColor: appearance.gridLineColor,
                  }}
                >
                  {hours.map((hour) => (
                    <button
                      key={hour}
                      type="button"
                      onClick={() => onSlotClick(date, hour)}
                      className="absolute inset-x-0 border-b opacity-0 transition-all duration-200 hover:opacity-100 group-hover/slot:opacity-60"
                      style={{
                        top: (hour - hourStart) * HOUR_HEIGHT,
                        height: HOUR_HEIGHT,
                        borderColor: appearance.gridLineColor,
                        backgroundColor: appearance.isDark
                          ? "rgba(255,255,255,0.04)"
                          : `${appearance.accentColor}18`,
                      }}
                      aria-label={`Create event at ${hour}:00`}
                    />
                  ))}

                  {dayEvents.map((item) => {
                    const start = new Date(item.startAt);
                    const end = new Date(item.endAt!);
                    const top =
                      ((start.getHours() * 60 + start.getMinutes() - hourStart * 60) /
                        60) *
                      HOUR_HEIGHT;
                    const height =
                      ((end.getTime() - start.getTime()) / (60 * 60 * 1000)) * HOUR_HEIGHT;

                    const dimmed = Boolean(
                      focusedCourseId && item.courseId !== focusedCourseId,
                    );
                    const highlighted = Boolean(
                      focusedCourseId && item.courseId === focusedCourseId,
                    );

                    return (
                      <ResizableTimedEvent
                        key={item.id}
                        item={item}
                        top={Math.max(0, top)}
                        height={Math.max(28, height)}
                        hourHeight={HOUR_HEIGHT}
                        dayWidth={dayWidth}
                        selected={selectedId === item.id}
                        dimmed={dimmed}
                        highlighted={highlighted}
                        onSelect={() => onSelect(item.id)}
                        onMove={(id, startAt, endAt) => onEventMove(id, startAt, endAt)}
                        onResize={
                          onEventResize ??
                          ((id, startAt, endAt) => onEventMove(id, startAt, endAt))
                        }
                        onToggleComplete={
                          onToggleComplete
                            ? (completed) => onToggleComplete(item.id, completed)
                            : undefined
                        }
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export function buildWeekDays(anchor: Date, weekStartsOnMonday = true): Date[] {
  const start = startOfWeek(anchor, weekStartsOnMonday);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export { HOUR_START, HOUR_END, parseTimeToMinutes };

"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { useCalendarAppearance } from "@/components/calendar/CalendarAppearanceContext";
import { ResizableTimedEvent } from "@/components/calendar/views/ResizableTimedEvent";
import {
  addDays,
  formatHourLabel,
  startOfWeek,
} from "@/lib/calendar/date-utils";
import { snapMinutes } from "@/lib/calendar/drag-utils";
import { localDateKey } from "@/lib/calendar/types";
import { parseTimeToMinutes } from "@/lib/calendar/types";
import type { WorkspaceCalendarItem } from "@/lib/calendar/workspace-types";

const HOUR_START = 7;
const HOUR_END = 22;
const HOUR_HEIGHT = 52;
/** One readable line per stacked item when several share a start hour. */
const STACK_ROW_HEIGHT = 40;
/** Length drawn for a timed item that has a start but no end (e.g. a due time). */
const OPEN_ENDED_DURATION_MS = 30 * 60 * 1000;
/** Solo all-day chips stay short; stacks expand the hour instead. */
const ALL_DAY_CHIP_MINUTES = 45;

export type TimedLayoutRange = {
  id: string;
  start: number;
  end: number;
  allDay: boolean;
};

/**
 * Stack concurrent items vertically (one per line). The start hour expands to fit.
 */
export function assignHourStacks(
  ranges: TimedLayoutRange[],
): Map<string, { stackIndex: number; stackCount: number; startHour: number }> {
  const byHour = new Map<number, TimedLayoutRange[]>();
  for (const range of ranges) {
    const startHour = Math.floor(range.start / 60);
    const list = byHour.get(startHour) ?? [];
    list.push(range);
    byHour.set(startHour, list);
  }

  const result = new Map<
    string,
    { stackIndex: number; stackCount: number; startHour: number }
  >();

  for (const [startHour, list] of byHour) {
    const sorted = [...list].sort(
      (a, b) => a.start - b.start || a.id.localeCompare(b.id),
    );
    const stackCount = sorted.length;
    sorted.forEach((range, stackIndex) => {
      result.set(range.id, { stackIndex, stackCount, startHour });
    });
  }
  return result;
}

/** True all-day / full-day spans — shown as a chip, not a separate all-day row. */
export function isAllDayLike(item: WorkspaceCalendarItem): boolean {
  if (item.allDay) return true;
  const start = new Date(item.startAt);
  const end = item.endAt
    ? new Date(item.endAt)
    : new Date(start.getTime() + OPEN_ENDED_DURATION_MS);
  const durationMs = end.getTime() - start.getTime();
  if (durationMs >= 18 * 60 * 60 * 1000) return true;
  if (
    start.getHours() === 0 &&
    start.getMinutes() === 0 &&
    end.getHours() >= 23 &&
    durationMs >= 12 * 60 * 60 * 1000
  ) {
    return true;
  }
  return false;
}

function visibleRangeForItem(
  item: WorkspaceCalendarItem,
  gridStartMinutes: number,
  gridEndMinutes: number,
): TimedLayoutRange | null {
  const allDay = isAllDayLike(item);
  const start = new Date(item.startAt);
  const end = item.endAt
    ? new Date(item.endAt)
    : new Date(start.getTime() + OPEN_ENDED_DURATION_MS);

  let startMinutes = start.getHours() * 60 + start.getMinutes();
  let endMinutes = end.getHours() * 60 + end.getMinutes();

  if (allDay) {
    startMinutes = Math.max(startMinutes, gridStartMinutes);
    if (startMinutes >= gridEndMinutes) {
      startMinutes = gridStartMinutes;
    }
    endMinutes = startMinutes + ALL_DAY_CHIP_MINUTES;
  }

  const visibleStart = Math.max(startMinutes, gridStartMinutes);
  const visibleEnd = Math.min(
    endMinutes <= startMinutes ? endMinutes + 24 * 60 : endMinutes,
    gridEndMinutes,
  );
  if (visibleEnd <= visibleStart) return null;
  return { id: item.id, start: visibleStart, end: visibleEnd, allDay };
}

function hourHeightsForGrid(
  days: Date[],
  items: WorkspaceCalendarItem[],
  hours: number[],
  gridStartMinutes: number,
  gridEndMinutes: number,
): number[] {
  const heights = hours.map(() => HOUR_HEIGHT);
  for (const date of days) {
    const key = localDateKey(date);
    const dayEvents = items.filter(
      (item) => localDateKey(new Date(item.startAt)) === key,
    );
    const ranges = dayEvents
      .map((item) => visibleRangeForItem(item, gridStartMinutes, gridEndMinutes))
      .filter((range): range is TimedLayoutRange => Boolean(range));
    const stacks = assignHourStacks(ranges);
    const countByHour = new Map<number, number>();
    for (const layout of stacks.values()) {
      countByHour.set(
        layout.startHour,
        Math.max(countByHour.get(layout.startHour) ?? 0, layout.stackCount),
      );
    }
    for (const [startHour, count] of countByHour) {
      const idx = startHour - hours[0]!;
      if (idx < 0 || idx >= heights.length) continue;
      heights[idx] = Math.max(heights[idx]!, count * STACK_ROW_HEIGHT, HOUR_HEIGHT);
    }
  }
  return heights;
}

function offsetForMinutes(
  totalMinutes: number,
  hourHeights: number[],
  gridHourStart: number,
): number {
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  let top = 0;
  for (let h = gridHourStart; h < hour; h++) {
    const idx = h - gridHourStart;
    top += hourHeights[idx] ?? HOUR_HEIGHT;
  }
  const idx = hour - gridHourStart;
  const hourH = hourHeights[idx] ?? HOUR_HEIGHT;
  return top + (minute / 60) * hourH;
}

function minutesFromVariableOffset(
  offsetY: number,
  hourHeights: number[],
  gridHourStart: number,
  gridHourEnd: number,
): number {
  let y = 0;
  for (let i = 0; i < hourHeights.length; i++) {
    const hourH = hourHeights[i] ?? HOUR_HEIGHT;
    if (offsetY <= y + hourH) {
      const frac = Math.max(0, Math.min(1, (offsetY - y) / hourH));
      const raw = (gridHourStart + i) * 60 + frac * 60;
      return Math.max(
        gridHourStart * 60,
        Math.min((gridHourEnd + 1) * 60 - 15, snapMinutes(raw)),
      );
    }
    y += hourH;
  }
  return (gridHourEnd + 1) * 60 - 15;
}

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

  const safeHourStart = Number.isFinite(hourStart) ? hourStart : HOUR_START;
  const safeHourEnd = Number.isFinite(hourEnd) ? hourEnd : HOUR_END;
  const gridHourStart = Math.min(safeHourStart, safeHourEnd);
  const gridHourEnd = Math.max(safeHourStart, safeHourEnd);
  const gridStartMinutes = gridHourStart * 60;
  const gridEndMinutes = (gridHourEnd + 1) * 60;

  const hours = useMemo(
    () =>
      Array.from(
        { length: Math.max(1, gridHourEnd - gridHourStart + 1) },
        (_, i) => gridHourStart + i,
      ),
    [gridHourStart, gridHourEnd],
  );

  const hourHeights = useMemo(
    () =>
      hourHeightsForGrid(
        days,
        items,
        hours,
        gridStartMinutes,
        gridEndMinutes,
      ),
    [days, items, hours, gridStartMinutes, gridEndMinutes],
  );

  const totalGridHeight = hourHeights.reduce((sum, h) => sum + h, 0);

  function hourTop(hour: number): number {
    let top = 0;
    for (let h = gridHourStart; h < hour; h++) {
      top += hourHeights[h - gridHourStart] ?? HOUR_HEIGHT;
    }
    return top;
  }

  function handleColumnDrop(day: Date, event: React.DragEvent) {
    event.preventDefault();
    const id = event.dataTransfer.getData("text/calendar-item-id");
    if (!id) return;

    const item = items.find((i) => i.id === id);
    if (!item?.editable) return;

    const column = event.currentTarget as HTMLElement;
    const rect = column.getBoundingClientRect();
    const offsetY = event.clientY - rect.top;
    const totalMinutes = minutesFromVariableOffset(
      offsetY,
      hourHeights,
      gridHourStart,
      gridHourEnd,
    );

    const start = new Date(day);
    start.setHours(Math.floor(totalMinutes / 60), totalMinutes % 60, 0, 0);

    const oldStart = new Date(item.startAt);
    const oldEnd = item.endAt
      ? new Date(item.endAt)
      : new Date(oldStart.getTime() + 60 * 60 * 1000);
    const duration = isAllDayLike(item)
      ? ALL_DAY_CHIP_MINUTES * 60 * 1000
      : oldEnd.getTime() - oldStart.getTime();
    const end = new Date(start.getTime() + Math.max(duration, 15 * 60 * 1000));

    onEventMove(id, start.toISOString(), end.toISOString());
  }

  return (
    <div
      className="rounded-2xl border shadow-sm transition-all duration-200"
      style={{
        borderColor: appearance.gridLineColor,
        backgroundColor: appearance.isDark
          ? "rgba(255,255,255,0.03)"
          : "rgba(255,255,255,0.55)",
      }}
    >
      <div className="overflow-x-auto overflow-y-visible">
        <div style={{ minWidth: days.length > 1 ? 760 : 400 }}>
          <div
            className="sticky top-0 z-[40] grid border-b"
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
            className="grid"
            style={{
              gridTemplateColumns: `4rem repeat(${days.length}, minmax(0, 1fr))`,
              height: totalGridHeight,
            }}
          >
            <div className="relative">
              {hours.map((hour, index) => (
                <div
                  key={hour}
                  className="absolute inset-x-0 border-b px-2 text-right text-[10px]"
                  style={{
                    top: hourTop(hour),
                    height: hourHeights[index] ?? HOUR_HEIGHT,
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
              const dayEvents = items.filter(
                (item) => localDateKey(new Date(item.startAt)) === key,
              );

              const layoutRanges = dayEvents
                .map((item) =>
                  visibleRangeForItem(item, gridStartMinutes, gridEndMinutes),
                )
                .filter((range): range is TimedLayoutRange => Boolean(range));
              const stacksById = assignHourStacks(layoutRanges);

              return (
                <div
                  key={key}
                  ref={dayIndex === 0 ? dayColRef : undefined}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleColumnDrop(date, e)}
                  className="group/slot relative border-l"
                  style={{
                    height: totalGridHeight,
                    borderColor: appearance.gridLineColor,
                  }}
                >
                  {hours.map((hour, index) => (
                    <button
                      key={hour}
                      type="button"
                      onClick={(clickEvent) => {
                        if (clickEvent.target !== clickEvent.currentTarget) return;
                        onSlotClick(date, hour);
                      }}
                      className="absolute inset-x-0 z-0 border-b opacity-0 transition-all duration-200 hover:opacity-100 group-hover/slot:opacity-60"
                      style={{
                        top: hourTop(hour),
                        height: hourHeights[index] ?? HOUR_HEIGHT,
                        borderColor: appearance.gridLineColor,
                        backgroundColor: appearance.isDark
                          ? "rgba(255,255,255,0.04)"
                          : `${appearance.accentColor}18`,
                      }}
                      aria-label={`Create event at ${hour}:00`}
                    />
                  ))}

                  {dayEvents.map((item) => {
                    const range = visibleRangeForItem(
                      item,
                      gridStartMinutes,
                      gridEndMinutes,
                    );
                    if (!range) return null;

                    const stack = stacksById.get(item.id) ?? {
                      stackIndex: 0,
                      stackCount: 1,
                      startHour: Math.floor(range.start / 60),
                    };

                    const stacked = stack.stackCount > 1;
                    const hourStartTop = hourTop(stack.startHour);
                    const top = stacked
                      ? hourStartTop + stack.stackIndex * STACK_ROW_HEIGHT
                      : offsetForMinutes(
                          range.start,
                          hourHeights,
                          gridHourStart,
                        );
                    const height = stacked
                      ? STACK_ROW_HEIGHT - 4
                      : Math.max(
                          28,
                          offsetForMinutes(range.end, hourHeights, gridHourStart) -
                            offsetForMinutes(
                              range.start,
                              hourHeights,
                              gridHourStart,
                            ),
                        );

                    const dimmed = Boolean(
                      focusedCourseId && item.courseId !== focusedCourseId,
                    );
                    const highlighted = Boolean(
                      focusedCourseId && item.courseId === focusedCourseId,
                    );

                    return (
                      <ResizableTimedEvent
                        key={item.id}
                        item={range.allDay ? { ...item, allDay: true } : item}
                        top={top}
                        height={height}
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

export { HOUR_START, HOUR_END, parseTimeToMinutes, STACK_ROW_HEIGHT };

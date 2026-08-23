import { localDateKey } from "./types";

export function startOfWeek(date: Date, weekStartsOnMonday = true): Date {
  const result = new Date(date);
  const day = result.getDay();
  const diff = weekStartsOnMonday ? (day === 0 ? -6 : 1 - day) : -day;
  result.setDate(result.getDate() + diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function endOfWeek(date: Date, weekStartsOnMonday = true): Date {
  const start = startOfWeek(date, weekStartsOnMonday);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export function isSameDay(a: Date, b: Date): boolean {
  return localDateKey(a) === localDateKey(b);
}

export function formatTimeLabel(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatHourLabel(hour: number): string {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  return date.toLocaleTimeString(undefined, { hour: "numeric" });
}

export function toDateInputValue(date: Date): string {
  return localDateKey(date);
}

export function toTimeInputValue(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function combineDateAndTime(dateStr: string, timeStr: string): Date {
  const result = combineDateAndTimeSafe(dateStr, timeStr);
  if (!result) {
    throw new Error("Invalid date or time value.");
  }
  return result;
}

export function combineDateAndTimeSafe(dateStr: string, timeStr: string): Date | null {
  if (!dateStr || !timeStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  if (!/^\d{2}:\d{2}$/.test(timeStr)) return null;
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = timeStr.split(":").map(Number);
  if ([year, month, day, hours, minutes].some((n) => Number.isNaN(n))) return null;
  const result = new Date(year, month - 1, day, hours, minutes, 0, 0);
  return Number.isNaN(result.getTime()) ? null : result;
}

export function getViewRange(
  view: "month" | "week" | "day" | "agenda",
  anchor: Date,
  weekStartsOnMonday = true,
): { start: Date; end: Date } {
  if (view === "day") {
    const start = new Date(anchor);
    start.setHours(0, 0, 0, 0);
    const end = new Date(anchor);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (view === "week") {
    const start = startOfWeek(anchor, weekStartsOnMonday);
    const end = addDays(start, 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (view === "month") {
    const monthStart = startOfMonth(anchor);
    const gridStart = startOfWeek(monthStart, weekStartsOnMonday);
    const monthEnd = endOfMonth(anchor);
    const gridEnd = endOfWeek(monthEnd, weekStartsOnMonday);
    return { start: gridStart, end: gridEnd };
  }

  const start = new Date(anchor);
  start.setHours(0, 0, 0, 0);
  const end = addDays(start, 30);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

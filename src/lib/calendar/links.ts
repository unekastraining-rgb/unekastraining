import type { CalendarViewMode } from "./workspace-types";

export function buildCalendarHref(options?: {
  date?: Date | string;
  view?: CalendarViewMode;
}): string {
  const params = new URLSearchParams();

  if (options?.date) {
    const dateStr =
      typeof options.date === "string"
        ? options.date
        : formatDateParam(options.date);
    params.set("date", dateStr);
  }

  if (options?.view) {
    params.set("view", options.view);
  }

  const query = params.toString();
  return query ? `/calendar?${query}` : "/calendar";
}

export function parseCalendarViewParam(
  value?: string,
): CalendarViewMode | undefined {
  if (value === "month" || value === "week" || value === "day" || value === "agenda") {
    return value;
  }
  return undefined;
}

export function parseCalendarDateParam(value?: string): Date | undefined {
  if (!value) return undefined;
  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function formatDateParam(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

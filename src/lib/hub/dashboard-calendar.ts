import { buildUnifiedCalendarItems } from "@/lib/calendar/unified-items";
import { workspaceItemsToHubEvents } from "@/lib/calendar/hub-adapters";
import { filterEventsByQuickView } from "@/lib/calendar/events";
import type { CalendarEvent } from "@/lib/calendar/types";
import { db } from "@/lib/db";

function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

/** Unified calendar items for a single day (classes, events, due work). */
export async function fetchHubTodayCalendarEvents(
  userId: string,
  referenceDate = new Date(),
): Promise<CalendarEvent[]> {
  const rangeStart = startOfDay(referenceDate);
  const rangeEnd = endOfDay(referenceDate);

  const [events, assignments, meetings] = await Promise.all([
    db.calendarEvent.findMany({
      where: {
        userId,
        startAt: { lte: rangeEnd },
        OR: [{ endAt: { gte: rangeStart } }, { endAt: null }],
      },
      include: {
        course: { select: { id: true, title: true, color: true } },
      },
      orderBy: { startAt: "asc" },
    }),
    db.assignment.findMany({
      where: {
        course: { userId },
        OR: [
          { dueDate: { gte: rangeStart, lte: rangeEnd } },
          { scheduledStartAt: { gte: rangeStart, lte: rangeEnd } },
        ],
      },
      include: {
        course: { select: { id: true, title: true, color: true } },
        calendarEvent: { select: { id: true } },
      },
    }),
    db.classMeeting.findMany({
      where: { course: { userId } },
      include: {
        course: { select: { id: true, title: true, color: true } },
      },
    }),
  ]);

  const items = buildUnifiedCalendarItems({
    events,
    assignments,
    meetings,
    rangeStart,
    rangeEnd,
  });

  return filterEventsByQuickView(
    workspaceItemsToHubEvents(items),
    "today",
    referenceDate,
  );
}

import { NextResponse } from "next/server";

import {
  buildUnifiedCalendarItems,
} from "@/lib/calendar/unified-items";
import { buildIcsCalendar, type IcsExportEvent } from "@/lib/calendar/export-ics";
import { parseRecurrenceRule, toRrule } from "@/lib/calendar/recurrence";
import type { WorkspaceCalendarItem } from "@/lib/calendar/workspace-types";
import { db } from "@/lib/db";
import { getOrCreateDefaultUser } from "@/lib/user";

function defaultRange() {
  const start = new Date();
  start.setMonth(start.getMonth() - 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setMonth(end.getMonth() + 3);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function itemToExportEvent(
  item: WorkspaceCalendarItem,
  sourceRecurrence?: string | null,
  includeRrule = false,
): IcsExportEvent {
  const descriptionParts = [
    item.courseTitle ? `Course: ${item.courseTitle}` : null,
    item.description?.trim() || null,
  ].filter(Boolean);

  const recurrenceRule = parseRecurrenceRule(sourceRecurrence ?? item.recurrence);

  return {
    uid: `${item.id}@studyhaul`,
    title: item.title,
    description: descriptionParts.length > 0 ? descriptionParts.join("\n") : null,
    location: item.location ?? null,
    startAt: new Date(item.startAt),
    endAt: item.endAt ? new Date(item.endAt) : null,
    allDay: item.allDay,
    rrule:
      includeRrule && recurrenceRule ? toRrule(recurrenceRule) : null,
  };
}

export async function GET(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const { searchParams } = new URL(request.url);
    const startParam = searchParams.get("start");
    const endParam = searchParams.get("end");
    const courseId = searchParams.get("courseId");
    const include = searchParams.get("include") ?? "all";
    const fallback = defaultRange();

    const rangeStart = startParam ? new Date(startParam) : fallback.start;
    const rangeEnd = endParam ? new Date(endParam) : fallback.end;

    const [events, assignments, meetings, course] = await Promise.all([
      db.calendarEvent.findMany({
        where: {
          userId: user.id,
          ...(courseId ? { courseId } : {}),
          startAt: { lte: rangeEnd },
          OR: [{ endAt: { gte: rangeStart } }, { endAt: null }],
        },
        include: {
          course: { select: { id: true, title: true, color: true } },
        },
        orderBy: { startAt: "asc" },
      }),
      include === "events"
        ? Promise.resolve([])
        : db.assignment.findMany({
            where: {
              course: { userId: user.id },
              ...(courseId ? { courseId } : {}),
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
      include === "events"
        ? Promise.resolve([])
        : db.classMeeting.findMany({
            where: {
              course: { userId: user.id },
              ...(courseId ? { courseId } : {}),
            },
            include: {
              course: { select: { id: true, title: true, color: true } },
            },
          }),
      courseId
        ? db.course.findFirst({
            where: { id: courseId, userId: user.id },
            select: { title: true },
          })
        : Promise.resolve(null),
    ]);

    const items = buildUnifiedCalendarItems({
      events,
      assignments,
      meetings,
      rangeStart,
      rangeEnd,
    });

    const exportEvents = items.flatMap((item) => {
      const sourceEvent =
        item.source === "event"
          ? events.find((event) => event.id === item.sourceId)
          : undefined;

      if (sourceEvent?.recurrence && item.id !== `evt-${sourceEvent.id}`) {
        return [];
      }

      return [
        itemToExportEvent(
          item,
          sourceEvent?.recurrence,
          Boolean(sourceEvent?.recurrence),
        ),
      ];
    });
    const calendarName = course?.title
      ? `Study Haul — ${course.title}`
      : "Study Haul";

    const icsText = buildIcsCalendar(exportEvents, calendarName);
    const filename = course?.title
      ? `study-haul-${course.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.ics`
      : "study-haul-calendar.ics";

    return new NextResponse(icsText, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("ICS export failed:", error);
    return NextResponse.json(
      { success: false, error: "Failed to export calendar." },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";

import {
  AssignmentStatus,
  type CalendarEvent,
  type CalendarEventType,
  type CalendarPriority,
} from "@/generated/prisma";
import { isAssignmentCompleted } from "@/lib/academic";
import {
  buildUnifiedCalendarItems,
  calendarEventToItem,
  coursesToWorkspace,
  eventTypeToAssignmentKind,
} from "@/lib/calendar/unified-items";
import { resolveCourseForUser } from "@/lib/courses";
import {
  deleteCalendarEventFromGoogle,
  writeCalendarEventToGoogle,
} from "@/lib/calendar/google-calendar";
import {
  applyRecurrenceEventDelete,
  applyRecurrenceEventUpdate,
  parseOccurrenceItemId,
  type RecurrenceEditScope,
} from "@/lib/calendar/recurrence-edit";
import { db } from "@/lib/db";
import { getOrCreateDefaultUser, UnauthorizedError } from "@/lib/user";

import type { CalendarEventTypeFilter } from "@/lib/calendar/workspace-types";

function parseOptionalDate(
  value: unknown,
  fieldLabel: string,
): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const parsed = new Date(value as string);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid ${fieldLabel}.`);
  }
  return parsed;
}

const ASSIGNMENT_EVENT_TYPES: CalendarEventTypeFilter[] = [
  "ASSIGNMENT",
  "EXAM",
  "PROJECT",
  "READING",
];

function defaultRange() {
  const start = new Date();
  start.setMonth(start.getMonth() - 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setMonth(end.getMonth() + 3);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function shouldSyncToPlanner(eventType?: string) {
  return ASSIGNMENT_EVENT_TYPES.includes(eventType as CalendarEventTypeFilter);
}

function resolveEventItemId(itemId?: string) {
  if (!itemId?.startsWith("evt-")) return null;

  const parsed = parseOccurrenceItemId(itemId);
  if (parsed) {
    return {
      source: "event" as const,
      sourceId: parsed.seriesId,
      occurrenceAt: parsed.occurrenceAt,
    };
  }

  return {
    source: "event" as const,
    sourceId: itemId.replace("evt-", ""),
    occurrenceAt: null as Date | null,
  };
}

type CalendarEventWithCourse = CalendarEvent & {
  course: { id: string; title: string; color: string | null } | null;
};

async function pushEventToGoogleIfLinked(
  userId: string,
  event: CalendarEventWithCourse,
): Promise<CalendarEventWithCourse> {
  try {
    const link = await writeCalendarEventToGoogle(userId, event);
    if (!link) return event;

    if (
      event.externalId === link.externalId &&
      event.externalSource === "google" &&
      event.calendarConnectionId === link.calendarConnectionId
    ) {
      return event;
    }

    return db.calendarEvent.update({
      where: { id: event.id },
      data: {
        externalSource: "google",
        externalId: link.externalId,
        calendarConnectionId: link.calendarConnectionId,
      },
      include: {
        course: { select: { id: true, title: true, color: true } },
      },
    });
  } catch (error) {
    console.warn("Google Calendar write-back failed:", error);
    return event;
  }
}

export async function GET(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const { searchParams } = new URL(request.url);
    const startParam = searchParams.get("start");
    const endParam = searchParams.get("end");
    const fallback = defaultRange();

    const rangeStart = startParam ? new Date(startParam) : fallback.start;
    const rangeEnd = endParam ? new Date(endParam) : fallback.end;

    const [events, assignments, meetings, courses] = await Promise.all([
      db.calendarEvent.findMany({
        where: {
          userId: user.id,
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
          course: { userId: user.id },
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
        where: { course: { userId: user.id } },
        include: {
          course: { select: { id: true, title: true, color: true } },
        },
      }),
      db.course.findMany({
        where: { userId: user.id },
        select: { id: true, title: true, color: true },
        orderBy: { title: "asc" },
      }),
    ]);

    const items = buildUnifiedCalendarItems({
      events,
      assignments,
      meetings,
      rangeStart,
      rangeEnd,
    });

    return NextResponse.json({
      success: true,
      data: {
        items,
        courses: coursesToWorkspace(courses),
        rangeStart: rangeStart.toISOString(),
        rangeEnd: rangeEnd.toISOString(),
      },
    });
  } catch (error) {
    console.error("Failed to fetch calendar:", error);
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    const message =
      error instanceof Error && process.env.NODE_ENV !== "production"
        ? error.message
        : "Failed to load calendar.";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const body = await request.json();

    const {
      title,
      description,
      courseId,
      courseTitle,
      startAt,
      endAt,
      allDay,
      eventType,
      color,
      priority,
      recurrence,
      reminderAt,
      completed,
      location,
      syncToPlanner,
    } = body;

    if (!title?.trim()) {
      return NextResponse.json(
        { success: false, error: "Title is required." },
        { status: 400 },
      );
    }

    if (!startAt) {
      return NextResponse.json(
        { success: false, error: "Start date is required." },
        { status: 400 },
      );
    }

    let resolvedCourseId: string | null = courseId ?? null;

    if (courseId || courseTitle) {
      const course = await resolveCourseForUser(user.id, { courseId, courseTitle });
      resolvedCourseId = course.id;
    }

    const startDate = new Date(startAt);
    if (Number.isNaN(startDate.getTime())) {
      return NextResponse.json(
        { success: false, error: "Invalid start date." },
        { status: 400 },
      );
    }
    const endDate = endAt ? new Date(endAt) : null;
    if (endDate && Number.isNaN(endDate.getTime())) {
      return NextResponse.json(
        { success: false, error: "Invalid end date." },
        { status: 400 },
      );
    }
    let parsedReminder: Date | null;
    try {
      parsedReminder = parseOptionalDate(reminderAt, "reminder time") ?? null;
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : "Invalid reminder time.",
        },
        { status: 400 },
      );
    }
    const type = (eventType ?? "OTHER") as CalendarEventType;
    const shouldCreateAssignment =
      syncToPlanner !== false && shouldSyncToPlanner(eventType);

    let assignmentId: string | null = null;

    if (shouldCreateAssignment && resolvedCourseId) {
      const assignment = await db.assignment.create({
        data: {
          title: title.trim(),
          description: description ?? null,
          dueDate: endDate ?? startDate,
          scheduledStartAt: allDay ? null : startDate,
          scheduledEndAt: allDay ? null : endDate,
          calendarColor: color ?? null,
          kind: eventTypeToAssignmentKind(type as CalendarEventTypeFilter),
          status: completed
            ? AssignmentStatus.SUBMITTED
            : AssignmentStatus.NOT_STARTED,
          courseId: resolvedCourseId,
        },
      });
      assignmentId = assignment.id;
    }

    const event = await db.calendarEvent.create({
      data: {
        userId: user.id,
        courseId: resolvedCourseId,
        assignmentId,
        title: title.trim(),
        description: description ?? null,
        startAt: startDate,
        endAt: endDate,
        allDay: Boolean(allDay),
        eventType: type,
        color: color ?? null,
        priority: (priority ?? "MEDIUM") as CalendarPriority,
        recurrence: recurrence ?? null,
        reminderAt: parsedReminder,
        completed: Boolean(completed),
        location: location ?? null,
      },
      include: {
        course: { select: { id: true, title: true, color: true } },
      },
    });

    const syncedEvent = await pushEventToGoogleIfLinked(user.id, event);

    return NextResponse.json(
      {
        success: true,
        data: calendarEventToItem(syncedEvent),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create calendar event:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create event.";
    const status = error instanceof Error ? 400 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const body = await request.json();
    const { source, sourceId, id, ...updates } = body;

    const itemId = id as string | undefined;
    let resolvedSource = source as string | undefined;
    let resolvedSourceId = sourceId as string | undefined;
    let occurrenceAt: Date | null = null;

    const eventTarget = resolveEventItemId(itemId);
    if (eventTarget) {
      resolvedSource = eventTarget.source;
      resolvedSourceId = eventTarget.sourceId;
      occurrenceAt = eventTarget.occurrenceAt;
    } else if (itemId?.startsWith("asg-")) {
      resolvedSource = "assignment";
      resolvedSourceId = itemId.replace("asg-", "");
    }

    const editScope = (updates.editScope as RecurrenceEditScope | undefined) ??
      (occurrenceAt ? "single" : "series");
    if (updates.occurrenceAt) {
      occurrenceAt = new Date(updates.occurrenceAt);
    }

    if (!resolvedSource || !resolvedSourceId) {
      return NextResponse.json(
        { success: false, error: "Event id is required." },
        { status: 400 },
      );
    }

    if (resolvedSource === "meeting") {
      return NextResponse.json(
        { success: false, error: "Class meetings are edited from the course schedule." },
        { status: 400 },
      );
    }

    if (resolvedSource === "event") {
      const existing = await db.calendarEvent.findFirst({
        where: { id: resolvedSourceId, userId: user.id },
        include: {
          course: { select: { id: true, title: true, color: true } },
          assignment: true,
        },
      });

      if (!existing) {
        return NextResponse.json(
          { success: false, error: "Event not found." },
          { status: 404 },
        );
      }

      let parsedReminder: Date | null | undefined;
      try {
        parsedReminder = parseOptionalDate(updates.reminderAt, "reminder time");
      } catch (error) {
        return NextResponse.json(
          {
            success: false,
            error: error instanceof Error ? error.message : "Invalid reminder time.",
          },
          { status: 400 },
        );
      }

      const patch = {
        title: updates.title as string | undefined,
        description: updates.description as string | null | undefined,
        startAt: updates.startAt ? new Date(updates.startAt) : undefined,
        endAt:
          updates.endAt !== undefined
            ? updates.endAt
              ? new Date(updates.endAt)
              : null
            : undefined,
        allDay: updates.allDay as boolean | undefined,
        eventType: updates.eventType as string | undefined,
        color: updates.color as string | null | undefined,
        priority: updates.priority as string | undefined,
        recurrence: updates.recurrence as string | null | undefined,
        reminderAt: parsedReminder,
        completed: updates.completed as boolean | undefined,
        location: updates.location as string | null | undefined,
        courseId: updates.courseId as string | null | undefined,
      };

      if (updates.courseId !== undefined && updates.courseId) {
        await resolveCourseForUser(user.id, { courseId: updates.courseId });
      }

      const mutation = applyRecurrenceEventUpdate(
        existing,
        occurrenceAt,
        editScope,
        patch,
      );

      const event = await db.calendarEvent.update({
        where: { id: resolvedSourceId },
        data: mutation.masterData,
        include: {
          course: { select: { id: true, title: true, color: true } },
        },
      });

      if (mutation.createEvent) {
        await db.calendarEvent.create({
          data: mutation.createEvent as Parameters<typeof db.calendarEvent.create>[0]["data"],
        });
      }

      if (existing.assignmentId && !(occurrenceAt && editScope === "single")) {
        const assignmentData: Record<string, unknown> = {};
        if (updates.title !== undefined) assignmentData.title = updates.title;
        if (updates.description !== undefined)
          assignmentData.description = updates.description;
        if (updates.startAt !== undefined) {
          assignmentData.scheduledStartAt = updates.allDay
            ? null
            : new Date(updates.startAt);
          assignmentData.dueDate = new Date(updates.endAt ?? updates.startAt);
        }
        if (updates.endAt !== undefined) {
          assignmentData.scheduledEndAt = updates.allDay
            ? null
            : new Date(updates.endAt);
          assignmentData.dueDate = new Date(updates.endAt);
        }
        if (updates.color !== undefined) assignmentData.calendarColor = updates.color;
        if (updates.completed !== undefined) {
          assignmentData.status = updates.completed
            ? AssignmentStatus.SUBMITTED
            : AssignmentStatus.NOT_STARTED;
        }

        if (Object.keys(assignmentData).length > 0) {
          await db.assignment.update({
            where: { id: existing.assignmentId },
            data: assignmentData,
          });
        }
      }

      const syncedEvent = await pushEventToGoogleIfLinked(user.id, event);

      return NextResponse.json({
        success: true,
        data: calendarEventToItem(syncedEvent),
      });
    }

    const assignment = await db.assignment.findFirst({
      where: {
        id: resolvedSourceId,
        course: { userId: user.id },
      },
      include: {
        course: { select: { id: true, title: true, color: true } },
        calendarEvent: { select: { id: true } },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: "Assignment not found." },
        { status: 404 },
      );
    }

    const assignmentData: Record<string, unknown> = {};
    if (updates.title !== undefined) assignmentData.title = updates.title;
    if (updates.description !== undefined)
      assignmentData.description = updates.description;
    if (updates.color !== undefined) assignmentData.calendarColor = updates.color;
    if (updates.startAt !== undefined) {
      if (updates.allDay) {
        assignmentData.dueDate = new Date(updates.startAt);
        assignmentData.scheduledStartAt = null;
        assignmentData.scheduledEndAt = null;
      } else {
        assignmentData.scheduledStartAt = new Date(updates.startAt);
        assignmentData.dueDate = new Date(updates.endAt ?? updates.startAt);
      }
    }
    if (updates.endAt !== undefined) {
      assignmentData.scheduledEndAt = updates.allDay
        ? null
        : new Date(updates.endAt);
      assignmentData.dueDate = new Date(updates.endAt);
    }
    if (updates.completed !== undefined) {
      assignmentData.status = updates.completed
        ? AssignmentStatus.SUBMITTED
        : AssignmentStatus.NOT_STARTED;
    }

    const updated = await db.assignment.update({
      where: { id: resolvedSourceId },
      data: assignmentData,
      include: {
        course: { select: { id: true, title: true, color: true } },
        calendarEvent: { select: { id: true } },
      },
    });

    const { assignmentToItem } = await import("@/lib/calendar/unified-items");
    const item = assignmentToItem(updated);

    return NextResponse.json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error("Failed to update calendar item:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update event.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const body = await request.json();
    const { id, source, sourceId, editScope: deleteScope, occurrenceAt: occurrenceAtRaw } =
      body;

    let resolvedSource = source as string | undefined;
    let resolvedSourceId = sourceId as string | undefined;
    let occurrenceAt: Date | null = null;

    const eventTarget = resolveEventItemId(id);
    if (eventTarget) {
      resolvedSource = eventTarget.source;
      resolvedSourceId = eventTarget.sourceId;
      occurrenceAt = eventTarget.occurrenceAt;
    } else if (id?.startsWith("asg-")) {
      resolvedSource = "assignment";
      resolvedSourceId = id.replace("asg-", "");
    } else if (id?.startsWith("mtg-")) {
      resolvedSource = "meeting";
      const match = id.match(/^mtg-(.+)-(\d{4}-\d{2}-\d{2})$/);
      resolvedSourceId = match?.[1];
    }

    const scope = (deleteScope as RecurrenceEditScope | undefined) ??
      (occurrenceAt ? "single" : "series");
    if (occurrenceAtRaw) {
      occurrenceAt = new Date(occurrenceAtRaw);
    }

    if (!resolvedSource || !resolvedSourceId) {
      return NextResponse.json(
        { success: false, error: "Event id is required." },
        { status: 400 },
      );
    }

    if (resolvedSource === "meeting") {
      const meeting = await db.classMeeting.findFirst({
        where: {
          id: resolvedSourceId,
          course: { userId: user.id },
        },
      });

      if (!meeting) {
        return NextResponse.json(
          { success: false, error: "Class meeting not found." },
          { status: 404 },
        );
      }

      await db.classMeeting.delete({ where: { id: resolvedSourceId } });
      return NextResponse.json({ success: true });
    }

    if (resolvedSource === "event") {
      const event = await db.calendarEvent.findFirst({
        where: { id: resolvedSourceId, userId: user.id },
      });

      if (!event) {
        return NextResponse.json(
          { success: false, error: "Event not found." },
          { status: 404 },
        );
      }

      const mutation = applyRecurrenceEventDelete(event, occurrenceAt, scope);

      if (mutation.deleteSeries) {
        try {
          await deleteCalendarEventFromGoogle(user.id, event);
        } catch (error) {
          console.warn("Google Calendar delete failed:", error);
        }

        await db.calendarEvent.delete({ where: { id: resolvedSourceId } });
        return NextResponse.json({ success: true });
      }

      await db.calendarEvent.update({
        where: { id: resolvedSourceId },
        data: mutation.masterData,
      });
      return NextResponse.json({ success: true });
    }

    const assignment = await db.assignment.findFirst({
      where: {
        id: resolvedSourceId,
        course: { userId: user.id },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: "Assignment not found." },
        { status: 404 },
      );
    }

    await db.assignment.delete({ where: { id: resolvedSourceId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete calendar item:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete event." },
      { status: 500 },
    );
  }
}

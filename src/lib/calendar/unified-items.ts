import type {
  AssignmentKind,
  AssignmentStatus,
  CalendarEventType,
  CalendarPriority,
} from "@/generated/prisma";
import { isAssignmentCompleted } from "@/lib/academic";

import { resolveItemColor } from "./colors";
import { expandRecurrenceOccurrences } from "./recurrence";
import { localDateKey } from "./types";
import type {
  CalendarEventTypeFilter,
  WorkspaceCalendarItem,
  WorkspaceCourse,
} from "./workspace-types";

interface DbCalendarEvent {
  id: string;
  title: string;
  description: string | null;
  startAt: Date;
  endAt: Date | null;
  allDay: boolean;
  eventType: CalendarEventType;
  color: string | null;
  priority: CalendarPriority;
  recurrence: string | null;
  reminderAt: Date | null;
  completed: boolean;
  location: string | null;
  courseId: string | null;
  course: { id: string; title: string; color: string | null } | null;
  externalSource?: string | null;
  calendarConnectionId?: string | null;
}

interface DbAssignment {
  id: string;
  title: string;
  description: string | null;
  dueDate: Date | null;
  scheduledStartAt: Date | null;
  scheduledEndAt: Date | null;
  calendarColor: string | null;
  kind: AssignmentKind;
  status: AssignmentStatus;
  courseId: string;
  course: { id: string; title: string; color: string | null };
  calendarEvent: { id: string } | null;
}

interface DbMeeting {
  id: string;
  courseId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location: string | null;
  title: string | null;
  course: { id: string; title: string; color: string | null };
}

function assignmentKindToEventType(kind: AssignmentKind): CalendarEventTypeFilter {
  if (kind === "TEST" || kind === "QUIZ") return "EXAM";
  if (kind === "PROJECT") return "PROJECT";
  if (kind === "READING") return "READING";
  return "ASSIGNMENT";
}

function eventTypeToAssignmentKind(
  eventType: CalendarEventTypeFilter,
): AssignmentKind {
  if (eventType === "EXAM") return "TEST";
  if (eventType === "PROJECT") return "PROJECT";
  if (eventType === "READING") return "READING";
  return "ASSIGNMENT";
}

export { eventTypeToAssignmentKind };

function parseTimeOnDate(date: Date, time: string): Date {
  const [hours, minutes] = time.split(":").map(Number);
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

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

function isOverdue(dueDate: Date | null, completed: boolean): boolean {
  if (!dueDate || completed) return false;
  return dueDate.getTime() < Date.now();
}

export function calendarEventToItem(event: DbCalendarEvent): WorkspaceCalendarItem {
  const courseColor = event.course?.color ?? null;
  return {
    id: `evt-${event.id}`,
    source: "event",
    sourceId: event.id,
    title: event.title,
    description: event.description,
    startAt: event.startAt.toISOString(),
    endAt: event.endAt?.toISOString() ?? null,
    allDay: event.allDay,
    eventType: event.eventType as CalendarEventTypeFilter,
    color: resolveItemColor(event.color, courseColor),
    colorIsCustom: Boolean(event.color),
    courseId: event.courseId,
    courseTitle: event.course?.title ?? null,
    priority: event.priority,
    completed: event.completed,
    location: event.location,
    reminderAt: event.reminderAt?.toISOString() ?? null,
    recurrence: event.recurrence,
    editable: true,
    overdue: isOverdue(event.endAt ?? event.startAt, event.completed),
    externalSource: event.externalSource ?? null,
    calendarConnectionId: event.calendarConnectionId ?? null,
  };
}

export function assignmentToItem(assignment: DbAssignment): WorkspaceCalendarItem | null {
  if (assignment.calendarEvent) return null;

  const completed = isAssignmentCompleted(assignment.status);
  const color = resolveItemColor(
    assignment.calendarColor,
    assignment.course.color,
  );
  const eventType = assignmentKindToEventType(assignment.kind);

  if (assignment.scheduledStartAt) {
    return {
      id: `asg-${assignment.id}`,
      source: "assignment",
      sourceId: assignment.id,
      title: assignment.title,
      description: assignment.description,
      startAt: assignment.scheduledStartAt.toISOString(),
      endAt: assignment.scheduledEndAt?.toISOString() ?? null,
      allDay: false,
      eventType,
      color,
      colorIsCustom: Boolean(assignment.calendarColor),
      courseId: assignment.courseId,
      courseTitle: assignment.course.title,
      priority: "MEDIUM",
      completed,
      editable: true,
      overdue: isOverdue(assignment.dueDate, completed),
    };
  }

  if (!assignment.dueDate) return null;

  return {
    id: `asg-${assignment.id}`,
    source: "assignment",
    sourceId: assignment.id,
    title: assignment.title,
    description: assignment.description,
    startAt: startOfDay(assignment.dueDate).toISOString(),
    endAt: endOfDay(assignment.dueDate).toISOString(),
    allDay: true,
    eventType,
    color,
    colorIsCustom: Boolean(assignment.calendarColor),
    courseId: assignment.courseId,
    courseTitle: assignment.course.title,
    priority: "MEDIUM",
    completed,
    editable: true,
    overdue: isOverdue(assignment.dueDate, completed),
  };
}

export function expandMeetingsToItems(
  meetings: DbMeeting[],
  rangeStart: Date,
  rangeEnd: Date,
): WorkspaceCalendarItem[] {
  const items: WorkspaceCalendarItem[] = [];
  const cursor = new Date(rangeStart);
  cursor.setHours(0, 0, 0, 0);

  while (cursor <= rangeEnd) {
    const dayOfWeek = cursor.getDay();

    for (const meeting of meetings) {
      if (meeting.dayOfWeek !== dayOfWeek) continue;

      const startAt = parseTimeOnDate(cursor, meeting.startTime);
      const endAt = parseTimeOnDate(cursor, meeting.endTime);
      const dateKey = localDateKey(cursor);

      items.push({
        id: `mtg-${meeting.id}-${dateKey}`,
        source: "meeting",
        sourceId: meeting.id,
        title: meeting.title ?? meeting.course.title,
        description: null,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        allDay: false,
        eventType: "CLASS",
        color: resolveItemColor(null, meeting.course.color),
        courseId: meeting.courseId,
        courseTitle: meeting.course.title,
        priority: "LOW",
        completed: false,
        location: meeting.location,
        editable: false,
        overdue: false,
      });
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return items;
}

export function buildUnifiedCalendarItems(input: {
  events: DbCalendarEvent[];
  assignments: DbAssignment[];
  meetings: DbMeeting[];
  rangeStart: Date;
  rangeEnd: Date;
}): WorkspaceCalendarItem[] {
  const items: WorkspaceCalendarItem[] = [];

  for (const event of input.events) {
    const occurrences = expandRecurrenceOccurrences({
      startAt: event.startAt,
      endAt: event.endAt,
      allDay: event.allDay,
      recurrence: event.recurrence,
      rangeStart: input.rangeStart,
      rangeEnd: input.rangeEnd,
    });

    for (const occurrence of occurrences) {
      const base = calendarEventToItem(event);
      const override = occurrence.override;
      items.push({
        ...base,
        id: occurrence.isSeriesStart
          ? base.id
          : `evt-${event.id}-${occurrence.originalStartAt.getTime()}`,
        title: override?.title ?? base.title,
        description:
          override?.description !== undefined ? override.description : base.description,
        startAt: occurrence.startAt.toISOString(),
        endAt: occurrence.endAt.toISOString(),
        allDay: override?.allDay ?? base.allDay,
        location: override?.location !== undefined ? override.location : base.location,
        color: override?.color ?? base.color,
        colorIsCustom:
          override?.color != null ? true : base.colorIsCustom,
        completed: override?.completed ?? base.completed,
        editable: true,
        isRecurrenceOccurrence: !occurrence.isSeriesStart,
        seriesId: event.id,
        occurrenceAt: occurrence.originalStartAt.toISOString(),
      });
    }
  }

  for (const assignment of input.assignments) {
    const item = assignmentToItem(assignment);
    if (item) items.push(item);
  }

  items.push(
    ...expandMeetingsToItems(input.meetings, input.rangeStart, input.rangeEnd),
  );

  return items.sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
  );
}

export function coursesToWorkspace(
  courses: Array<{ id: string; title: string; color: string | null }>,
): WorkspaceCourse[] {
  return courses.map((course) => ({
    id: course.id,
    title: course.title,
    color: course.color,
  }));
}

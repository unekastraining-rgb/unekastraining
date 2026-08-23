import { computePriority, isAssignmentCompleted } from "@/lib/academic";

import type { CalendarEvent, CalendarEventKind, QuickViewMode } from "./types";
import { localDateKey } from "./types";

interface BuildEventsInput {
  assignments: Array<{
    id: string;
    title: string;
    description?: string | null;
    dueDate: string | null;
    kind?: string;
    status: string;
    courseId: string;
    courseTitle: string;
    courseColor: string | null;
    source?: "syllabus" | "manual" | "lms";
  }>;
  meetings: Array<{
    id: string;
    courseId: string;
    courseTitle: string;
    courseColor: string | null;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    location?: string | null;
    title?: string | null;
  }>;
  weekStart: Date;
}

function assignmentKindToEventKind(kind?: string): CalendarEventKind {
  if (kind === "TEST") return "test";
  if (kind === "QUIZ") return "quiz";
  if (kind === "PROJECT") return "project";
  return "assignment";
}

function inferAssignmentKind(title: string): CalendarEventKind {
  const lower = title.toLowerCase();
  if (/\b(exam|midterm|final|test)\b/.test(lower)) return "test";
  if (/\bquiz\b/.test(lower)) return "quiz";
  if (/\b(project|portfolio)\b/.test(lower)) return "project";
  return "assignment";
}

export function buildCalendarEvents(input: BuildEventsInput): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  for (const assignment of input.assignments) {
    if (!assignment.dueDate) continue;

    const date = localDateKey(new Date(assignment.dueDate));
    const kind =
      assignment.kind && assignment.kind !== "ASSIGNMENT"
        ? assignmentKindToEventKind(assignment.kind)
        : inferAssignmentKind(assignment.title);

    events.push({
      id: `assignment-${assignment.id}`,
      kind,
      title: assignment.title,
      date,
      courseId: assignment.courseId,
      courseTitle: assignment.courseTitle,
      courseColor: assignment.courseColor,
      status: assignment.status,
      completed: isAssignmentCompleted(
        assignment.status as "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "GRADED",
      ),
      description: assignment.description,
      source: assignment.source ?? "manual",
      priority: computePriority(new Date(assignment.dueDate)),
    });
  }

  for (let offset = 0; offset < 7; offset += 1) {
    const date = new Date(input.weekStart);
    date.setDate(input.weekStart.getDate() + offset);
    const dayOfWeek = date.getDay();

    for (const meeting of input.meetings) {
      if (meeting.dayOfWeek !== dayOfWeek) continue;

      events.push({
        id: `meeting-${meeting.id}-${localDateKey(date)}`,
        kind: "class",
        title: meeting.title ?? meeting.courseTitle,
        date: localDateKey(date),
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        location: meeting.location,
        courseId: meeting.courseId,
        courseTitle: meeting.courseTitle,
        courseColor: meeting.courseColor,
        source: "syllabus",
      });
    }
  }

  return events.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    const aTime = a.startTime ? a.startTime : "99:99";
    const bTime = b.startTime ? b.startTime : "99:99";
    return aTime.localeCompare(bTime);
  });
}

export function filterEventsByQuickView(
  events: CalendarEvent[],
  mode: QuickViewMode,
  referenceDate = new Date(),
): CalendarEvent[] {
  const todayKey = localDateKey(referenceDate);

  if (mode === "today") {
    return events.filter((event) => event.date === todayKey);
  }

  if (mode === "week") {
    const weekStart = startOfWeek(referenceDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const endKey = localDateKey(weekEnd);
    const startKey = localDateKey(weekStart);
    return events.filter(
      (event) => event.date >= startKey && event.date <= endKey,
    );
  }

  const horizon = new Date(referenceDate);
  horizon.setDate(referenceDate.getDate() + 14);
  const horizonKey = localDateKey(horizon);

  return events
    .filter((event) => event.date >= todayKey && event.date <= horizonKey)
    .filter((event) => event.kind !== "class")
    .sort((a, b) => a.date.localeCompare(b.date));
}

function startOfWeek(date: Date) {
  const result = new Date(date);
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function groupEventsByDate(events: CalendarEvent[]) {
  const groups = new Map<string, CalendarEvent[]>();

  for (const event of events) {
    const existing = groups.get(event.date) ?? [];
    existing.push(event);
    groups.set(event.date, existing);
  }

  return groups;
}

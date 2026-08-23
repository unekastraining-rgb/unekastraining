import { toTimeInputValue } from "@/lib/calendar/date-utils";
import { parseOccurrenceItemId } from "@/lib/calendar/recurrence-edit";
import type { CalendarEvent, CalendarEventKind } from "@/lib/calendar/types";
import { localDateKey } from "@/lib/calendar/types";
import type {
  CalendarEventTypeFilter,
  WorkspaceCalendarItem,
} from "@/lib/calendar/workspace-types";

function eventTypeToKind(eventType: CalendarEventTypeFilter): CalendarEventKind {
  switch (eventType) {
    case "CLASS":
      return "class";
    case "EXAM":
      return "test";
    case "STUDY_SESSION":
      return "study-session";
    case "PROJECT":
      return "project";
    case "READING":
    case "ASSIGNMENT":
    case "PERSONAL":
    case "OTHER":
    default:
      return "assignment";
  }
}

function inferHubSource(item: WorkspaceCalendarItem): CalendarEvent["source"] {
  if (item.externalSource === "google") return "google";
  if (item.source === "meeting") return "syllabus";
  if (item.eventType === "STUDY_SESSION") return "recommended";
  if (item.source === "assignment") return "manual";
  return "manual";
}

export function workspaceItemToHubEvent(
  item: WorkspaceCalendarItem,
): CalendarEvent {
  const start = new Date(item.startAt);
  const end = item.endAt ? new Date(item.endAt) : null;

  return {
    id: item.id,
    kind: eventTypeToKind(item.eventType),
    title: item.title,
    date: localDateKey(start),
    startTime: item.allDay ? null : toTimeInputValue(start),
    endTime: item.allDay || !end ? null : toTimeInputValue(end),
    location: item.location ?? null,
    courseId: item.courseId ?? undefined,
    courseTitle: item.courseTitle ?? undefined,
    courseColor: item.color,
    completed: item.completed,
    description: item.description ?? null,
    source: inferHubSource(item),
    priority: item.priority,
  };
}

export function workspaceItemsToHubEvents(
  items: WorkspaceCalendarItem[],
): CalendarEvent[] {
  return items
    .map(workspaceItemToHubEvent)
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      const aTime = a.startTime ?? "99:99";
      const bTime = b.startTime ?? "99:99";
      return aTime.localeCompare(bTime);
    });
}

export function parseUnifiedCalendarId(eventId: string): {
  source: "event" | "assignment" | "meeting";
  sourceId: string;
} | null {
  const occurrence = parseOccurrenceItemId(eventId);
  if (occurrence) {
    return { source: "event", sourceId: occurrence.seriesId };
  }

  if (eventId.startsWith("evt-")) {
    return { source: "event", sourceId: eventId.slice(4) };
  }
  if (eventId.startsWith("asg-")) {
    return { source: "assignment", sourceId: eventId.slice(4) };
  }
  const meetingMatch = eventId.match(/^mtg-(.+)-(\d{4}-\d{2}-\d{2})$/);
  if (meetingMatch) {
    return { source: "meeting", sourceId: meetingMatch[1]! };
  }
  if (eventId.startsWith("assignment-")) {
    return { source: "assignment", sourceId: eventId.slice("assignment-".length) };
  }
  const legacyMeeting = eventId.match(/^meeting-(.+)-(\d{4}-\d{2}-\d{2})$/);
  if (legacyMeeting) {
    return { source: "meeting", sourceId: legacyMeeting[1]! };
  }
  return null;
}

export function hubEventFocusId(eventId: string): string | null {
  return parseUnifiedCalendarId(eventId)?.sourceId ?? null;
}

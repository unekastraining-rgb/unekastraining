import type { CalendarEvent } from "./types";
import { parseUnifiedCalendarId } from "./hub-adapters";
import type {
  CalendarEventInput,
  WorkspaceCalendarItem,
} from "./workspace-types";

export function hubEventCanComplete(event: CalendarEvent): boolean {
  return event.kind !== "class";
}

export async function toggleHubEventComplete(
  eventId: string,
  completed: boolean,
): Promise<boolean> {
  const ref = parseUnifiedCalendarId(eventId);
  if (!ref || ref.source === "meeting") return false;

  const response = await fetch("/api/calendar", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: eventId,
      source: ref.source,
      sourceId: ref.sourceId,
      completed,
    }),
  });
  const data = await response.json();
  return data.success === true;
}

export async function moveHubEvent(
  item: WorkspaceCalendarItem,
  startAt: string,
  endAt: string | null,
): Promise<boolean> {
  if (!item.editable) return false;

  const response = await fetch("/api/calendar", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: item.id,
      source: item.source,
      sourceId: item.sourceId,
      startAt,
      endAt,
      allDay: item.allDay,
      editScope: item.isRecurrenceOccurrence ? "single" : "series",
      occurrenceAt: item.occurrenceAt,
    }),
  });
  const data = await response.json();
  return data.success === true;
}

export async function updateHubEvent(
  item: WorkspaceCalendarItem,
  input: CalendarEventInput,
): Promise<boolean> {
  if (!item.editable) return false;

  const response = await fetch("/api/calendar", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: item.id,
      source: item.source,
      sourceId: item.sourceId,
      editScope:
        input.editScope ?? (item.isRecurrenceOccurrence ? "single" : "series"),
      occurrenceAt: input.occurrenceAt ?? item.occurrenceAt,
      ...input,
    }),
  });
  const data = await response.json();
  return data.success === true;
}

export async function deleteHubEvent(
  eventId: string,
  options?: {
    editScope?: "single" | "following" | "series";
    occurrenceAt?: string;
  },
): Promise<boolean> {
  const ref = parseUnifiedCalendarId(eventId);
  if (!ref) return false;

  const response = await fetch("/api/calendar", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: eventId,
      source: ref.source,
      sourceId: ref.sourceId,
      editScope: options?.editScope,
      occurrenceAt: options?.occurrenceAt,
    }),
  });
  const data = await response.json();
  return data.success === true;
}

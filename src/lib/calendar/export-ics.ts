export interface IcsExportEvent {
  uid: string;
  title: string;
  description?: string | null;
  location?: string | null;
  startAt: Date;
  endAt: Date | null;
  allDay: boolean;
  rrule?: string | null;
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n/g, "\\n")
    .replace(/\n/g, "\\n");
}

function foldIcsLine(line: string): string {
  if (line.length <= 75) return line;

  const parts: string[] = [];
  let remaining = line;
  parts.push(remaining.slice(0, 75));
  remaining = remaining.slice(75);

  while (remaining.length > 0) {
    parts.push(` ${remaining.slice(0, 74)}`);
    remaining = remaining.slice(74);
  }

  return parts.join("\r\n");
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function formatIcsUtcStamp(date: Date): string {
  return [
    date.getUTCFullYear(),
    pad(date.getUTCMonth() + 1),
    pad(date.getUTCDate()),
    "T",
    pad(date.getUTCHours()),
    pad(date.getUTCMinutes()),
    pad(date.getUTCSeconds()),
    "Z",
  ].join("");
}

function formatIcsLocalDateTime(date: Date): string {
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    "T",
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join("");
}

function formatIcsDateOnly(date: Date): string {
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("");
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function serializeIcsEvent(event: IcsExportEvent): string {
  const lines: string[] = ["BEGIN:VEVENT"];
  lines.push(foldIcsLine(`UID:${escapeIcsText(event.uid)}`));
  lines.push(`DTSTAMP:${formatIcsUtcStamp(new Date())}`);
  lines.push(foldIcsLine(`SUMMARY:${escapeIcsText(event.title)}`));

  if (event.description?.trim()) {
    lines.push(
      foldIcsLine(`DESCRIPTION:${escapeIcsText(event.description.trim())}`),
    );
  }

  if (event.location?.trim()) {
    lines.push(foldIcsLine(`LOCATION:${escapeIcsText(event.location.trim())}`));
  }

  if (event.rrule) {
    lines.push(`RRULE:${event.rrule}`);
  }

  if (event.allDay) {
    lines.push(`DTSTART;VALUE=DATE:${formatIcsDateOnly(event.startAt)}`);
    const exclusiveEnd = event.endAt
      ? addDays(event.endAt, 1)
      : addDays(event.startAt, 1);
    lines.push(`DTEND;VALUE=DATE:${formatIcsDateOnly(exclusiveEnd)}`);
  } else {
    lines.push(`DTSTART:${formatIcsLocalDateTime(event.startAt)}`);
    const endAt =
      event.endAt ??
      new Date(event.startAt.getTime() + 60 * 60 * 1000);
    lines.push(`DTEND:${formatIcsLocalDateTime(endAt)}`);
  }

  lines.push("END:VEVENT");
  return lines.join("\r\n");
}

export function buildIcsCalendar(
  events: IcsExportEvent[],
  calendarName = "Study Haul",
): string {
  const header = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Study Haul//Academic Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    foldIcsLine(`X-WR-CALNAME:${escapeIcsText(calendarName)}`),
  ].join("\r\n");

  const body = events.map(serializeIcsEvent).join("\r\n");
  return `${header}\r\n${body}\r\nEND:VCALENDAR\r\n`;
}

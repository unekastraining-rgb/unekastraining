export interface ParsedIcsEvent {
  title: string;
  description?: string;
  location?: string;
  startAt: Date;
  endAt: Date | null;
  allDay: boolean;
}

function unfoldIcs(text: string): string {
  return text.replace(/\r\n[ \t]/g, "").replace(/\n[ \t]/g, "");
}

function parseIcsDate(value: string): { date: Date; allDay: boolean } {
  const trimmed = value.trim();
  if (trimmed.length === 8) {
    const year = Number(trimmed.slice(0, 4));
    const month = Number(trimmed.slice(4, 6)) - 1;
    const day = Number(trimmed.slice(6, 8));
    return { date: new Date(year, month, day, 12, 0, 0), allDay: true };
  }

  const match = trimmed.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/);
  if (!match) {
    const parsed = new Date(trimmed);
    return { date: parsed, allDay: false };
  }

  const [, y, mo, d, h, mi, s] = match;
  const date = new Date(
    Date.UTC(
      Number(y),
      Number(mo) - 1,
      Number(d),
      Number(h),
      Number(mi),
      Number(s),
    ),
  );
  return { date, allDay: false };
}

function readField(block: string, key: string): string | undefined {
  const regex = new RegExp(`^${key}(?:;[^:]*)?:(.*)$`, "im");
  const match = block.match(regex);
  return match?.[1]?.trim();
}

export function parseIcsEvents(icsText: string): ParsedIcsEvent[] {
  const unfolded = unfoldIcs(icsText);
  const chunks = unfolded.split("BEGIN:VEVENT").slice(1);
  const events: ParsedIcsEvent[] = [];

  for (const chunk of chunks) {
    const block = chunk.split("END:VEVENT")[0] ?? chunk;
    const summary = readField(block, "SUMMARY");
    const dtStart = readField(block, "DTSTART");
    if (!summary || !dtStart) continue;

    const start = parseIcsDate(dtStart);
    const dtEnd = readField(block, "DTEND");
    const end = dtEnd ? parseIcsDate(dtEnd) : null;

    events.push({
      title: summary.replace(/\\n/g, "\n").replace(/\\,/g, ","),
      description: readField(block, "DESCRIPTION")?.replace(/\\n/g, "\n"),
      location: readField(block, "LOCATION"),
      startAt: start.date,
      endAt: end?.date ?? null,
      allDay: start.allDay,
    });
  }

  return events;
}

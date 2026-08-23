import { db } from "@/lib/db";
import { normalizeMoodleBaseUrl, parseMoodleJsonResponse } from "@/lib/lms/moodle-url";

export interface ClassMeetingInput {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location?: string | null;
  title?: string | null;
}

const DAY_ALIASES: Record<string, number> = {
  sun: 0,
  sunday: 0,
  u: 0,
  mon: 1,
  monday: 1,
  m: 1,
  tue: 2,
  tues: 2,
  tuesday: 2,
  t: 2,
  wed: 3,
  wednesday: 3,
  w: 3,
  thu: 4,
  thur: 4,
  thurs: 4,
  thursday: 4,
  r: 4,
  th: 4,
  fri: 5,
  friday: 5,
  f: 5,
  sat: 6,
  saturday: 6,
  s: 6,
};

const CLASS_TITLE_PATTERN =
  /\b(lecture|class|lab|seminar|recitation|studio|discussion|section)\b/i;

function padTime(value: number): string {
  return String(value).padStart(2, "0");
}

export function formatTimeHHMM(date: Date): string {
  return `${padTime(date.getHours())}:${padTime(date.getMinutes())}`;
}

function parseClock(value: string): string | null {
  const trimmed = value.trim().toLowerCase();
  const match = trimmed.match(
    /^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/,
  );
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2] ?? "0");
  const meridiem = match[3];

  if (meridiem === "pm" && hours < 12) hours += 12;
  if (meridiem === "am" && hours === 12) hours = 0;

  if (hours > 23 || minutes > 59) return null;
  return `${padTime(hours)}:${padTime(minutes)}`;
}

function expandDayToken(token: string): number[] {
  const normalized = token.trim().toLowerCase();
  if (!normalized) return [];

  if (DAY_ALIASES[normalized] !== undefined) {
    return [DAY_ALIASES[normalized]!];
  }

  const days: number[] = [];
  for (const char of normalized) {
    const mapped = DAY_ALIASES[char];
    if (mapped !== undefined) days.push(mapped);
  }
  return days;
}

function meetingKey(meeting: ClassMeetingInput): string {
  return [
    meeting.dayOfWeek,
    meeting.startTime,
    meeting.endTime,
    meeting.title ?? "",
  ].join("|");
}

export function dedupeMeetings(meetings: ClassMeetingInput[]): ClassMeetingInput[] {
  const seen = new Set<string>();
  const result: ClassMeetingInput[] = [];

  for (const meeting of meetings) {
    const key = meetingKey(meeting);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(meeting);
  }

  return result;
}

export async function upsertClassMeetings(
  courseId: string,
  meetings: ClassMeetingInput[],
): Promise<number> {
  let imported = 0;

  for (const meeting of dedupeMeetings(meetings)) {
    const existing = await db.classMeeting.findFirst({
      where: {
        courseId,
        dayOfWeek: meeting.dayOfWeek,
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        title: meeting.title ?? null,
      },
    });

    if (existing) {
      if (meeting.location && existing.location !== meeting.location) {
        await db.classMeeting.update({
          where: { id: existing.id },
          data: { location: meeting.location },
        });
      }
      continue;
    }

    await db.classMeeting.create({
      data: {
        courseId,
        dayOfWeek: meeting.dayOfWeek,
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        location: meeting.location ?? null,
        title: meeting.title ?? null,
      },
    });
    imported += 1;
  }

  return imported;
}

export function parseRruleByDay(rrule?: string | null): number[] {
  if (!rrule) return [];
  const match = rrule.match(/BYDAY=([A-Z,]+)/i);
  if (!match?.[1]) return [];

  const map: Record<string, number> = {
    SU: 0,
    MO: 1,
    TU: 2,
    WE: 3,
    TH: 4,
    FR: 5,
    SA: 6,
  };

  return match[1]
    .split(",")
    .map((day) => map[day.trim().toUpperCase()])
    .filter((day): day is number => day !== undefined);
}

export function eventTimesToMeeting(
  input: {
    title: string;
    startAt: Date;
    endAt: Date;
    location?: string | null;
    rrule?: string | null;
  },
): ClassMeetingInput[] {
  const byDay = parseRruleByDay(input.rrule);
  const days = byDay.length > 0 ? byDay : [input.startAt.getDay()];

  return days.map((dayOfWeek) => ({
    dayOfWeek,
    startTime: formatTimeHHMM(input.startAt),
    endTime: formatTimeHHMM(input.endAt),
    location: input.location ?? null,
    title: input.title,
  }));
}

export function calendarEventsToWeeklyMeetings(
  events: Array<{
    title: string;
    start_at: string;
    end_at?: string | null;
    location_name?: string | null;
    rrule?: string | null;
  }>,
): ClassMeetingInput[] {
  const meetings: ClassMeetingInput[] = [];

  for (const event of events) {
    if (!event.start_at) continue;
    const title = event.title?.trim();
    if (!title) continue;

    const isClassLike = CLASS_TITLE_PATTERN.test(title) || Boolean(event.rrule);
    if (!isClassLike) continue;

    const startAt = new Date(event.start_at);
    const endAt = event.end_at
      ? new Date(event.end_at)
      : new Date(startAt.getTime() + 60 * 60 * 1000);

    meetings.push(
      ...eventTimesToMeeting({
        title,
        startAt,
        endAt,
        location: event.location_name ?? null,
        rrule: event.rrule ?? null,
      }),
    );
  }

  return dedupeMeetings(meetings);
}

export function parseMeetingScheduleFromText(text: string): ClassMeetingInput[] {
  if (!text.trim()) return [];

  const meetings: ClassMeetingInput[] = [];
  const normalized = text.replace(/\s+/g, " ");

  const patterns = [
    /\b((?:M|T|W|R|F|S|U)(?:[\s\/,\-]*(?:M|T|W|R|F|S|U))*)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*[-–]\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/gi,
    /\b((?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)(?:day)?(?:\s*(?:and|&|,|\/)\s*(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)(?:day)?)*)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*[-–]\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/gi,
  ];

  for (const pattern of patterns) {
    for (const match of normalized.matchAll(pattern)) {
      const dayPart = match[1] ?? "";
      const startTime = parseClock(match[2] ?? "");
      const endTime = parseClock(match[3] ?? "");
      if (!startTime || !endTime) continue;

      const dayTokens = dayPart
        .split(/(?:\s*(?:and|&|,|\/)\s*|\s+)/i)
        .map((token) => token.trim())
        .filter(Boolean);

      const expandedDays = dayTokens.flatMap(expandDayToken);
      for (const dayOfWeek of expandedDays) {
        meetings.push({
          dayOfWeek,
          startTime,
          endTime,
          title: "Class",
        });
      }
    }
  }

  return dedupeMeetings(meetings);
}

export async function fetchCanvasCourseMeetings(
  baseUrl: string,
  accessToken: string,
  canvasCourseId: number,
): Promise<ClassMeetingInput[]> {
  const url = `${baseUrl.replace(/\/$/, "")}/api/v1/calendar_events?context_codes[]=course_${canvasCourseId}&all_events=true&per_page=100`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) return [];

  const events = (await response.json()) as Array<{
    title: string;
    start_at: string;
    end_at?: string | null;
    location_name?: string | null;
    rrule?: string | null;
  }>;

  return calendarEventsToWeeklyMeetings(events);
}

export async function fetchMoodleCourseMeetings(
  baseUrl: string,
  accessToken: string,
  moodleCourseId: number,
): Promise<ClassMeetingInput[]> {
  const now = Math.floor(Date.now() / 1000);
  const later = now + 120 * 24 * 60 * 60;

  const params = new URLSearchParams({
    wstoken: accessToken,
    wsfunction: "core_calendar_get_calendar_events",
    moodlewsrestformat: "json",
    "events[courseids][0]": String(moodleCourseId),
    "options[userevents]": "0",
    "options[siteevents]": "0",
    "options[timestart]": String(now),
    "options[timeend]": String(later),
  });

  const response = await fetch(
    `${normalizeMoodleBaseUrl(baseUrl)}/webservice/rest/server.php?${params.toString()}`,
    { cache: "no-store" },
  );

  if (!response.ok) return [];

  const payload = await parseMoodleJsonResponse<{
    events?: Array<{
      name: string;
      timestart: number;
      timeduration?: number;
      location?: string;
    }>;
    exception?: string;
  }>(response).catch(() => null);

  if (!payload) return [];

  const events = (payload.events ?? []).map((event) => {
    const startAt = new Date(event.timestart * 1000);
    const endAt = new Date(
      (event.timestart + (event.timeduration ?? 3600)) * 1000,
    );
    return {
      title: event.name,
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
      location_name: event.location ?? null,
      rrule: null,
    };
  });

  return calendarEventsToWeeklyMeetings(events);
}

export async function fetchBlackboardCourseMeetings(
  baseUrl: string,
  accessToken: string,
  courseId: string,
): Promise<ClassMeetingInput[]> {
  const calendarsResponse = await fetch(
    `${baseUrl.replace(/\/$/, "")}/learn/api/public/v1/users/me/calendars`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    },
  );

  if (!calendarsResponse.ok) return [];

  const calendarsPayload = (await calendarsResponse.json()) as {
    results?: Array<{ id: string }>;
  };
  const calendarId = calendarsPayload.results?.[0]?.id;
  if (!calendarId) return [];

  const since = new Date().toISOString();
  const until = new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString();
  const itemsUrl = `${baseUrl.replace(/\/$/, "")}/learn/api/public/v1/calendars/${calendarId}/items?since=${encodeURIComponent(since)}&until=${encodeURIComponent(until)}&courseId=${encodeURIComponent(courseId)}`;

  const itemsResponse = await fetch(itemsUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!itemsResponse.ok) return [];

  const itemsPayload = (await itemsResponse.json()) as {
    results?: Array<{
      title?: string;
      start?: string;
      end?: string;
      location?: string;
    }>;
  };

  const events = (itemsPayload.results ?? []).map((item) => ({
    title: item.title ?? "Class",
    start_at: item.start ?? "",
    end_at: item.end ?? null,
    location_name: item.location ?? null,
    rrule: null,
  }));

  return calendarEventsToWeeklyMeetings(events);
}

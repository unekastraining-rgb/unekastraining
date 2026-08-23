import {
  moodleApiErrorMessage,
  moodleRestServerUrl,
  normalizeMoodleBaseUrl,
  parseMoodleJsonResponse,
} from "@/lib/lms/moodle-url";

export interface MoodleCourse {
  id: number;
  fullname: string;
  shortname?: string;
  startdate?: number;
  enddate?: number;
}

export interface MoodleCourseContentModule {
  id: number;
  instance: number;
  modname: string;
  name: string;
  url?: string;
  description?: string;
  contents?: Array<{
    type: string;
    filename: string;
    filepath?: string;
    fileurl?: string | null;
    content?: string;
  }>;
}

export interface MoodleCourseContentSection {
  id: number;
  name: string;
  section: number;
  summary?: string;
  summaryformat?: number;
  modules?: MoodleCourseContentModule[];
}

export interface MoodleCalendarEvent {
  id: number;
  name: string;
  timestart: number;
  timeduration?: number;
  location?: string;
  modulename?: string | null;
  instance?: number | null;
  eventtype?: string | null;
  courseid?: number;
  description?: string;
}

export interface MoodleAssignment {
  id: number;
  cmid?: number;
  name: string;
  intro?: string;
  duedate?: number;
  grade?: number;
}

function formatMoodleNetworkError(error: unknown, baseUrl: string): Error {
  const raw = error instanceof Error ? error.message : "";
  if (raw && raw !== "fetch failed" && raw !== "Failed to fetch") {
    return error instanceof Error ? error : new Error(raw);
  }

  const cause = error instanceof Error ? (error as Error & { cause?: Error }).cause : null;
  const causeCode =
    cause && typeof cause === "object" && "code" in cause
      ? String((cause as NodeJS.ErrnoException).code)
      : "";
  const root = normalizeMoodleBaseUrl(baseUrl);
  const hints: string[] = [
    `Could not reach Moodle at ${root}.`,
    "Try Sync from this device in Settings (uses your browser instead of our server).",
  ];

  if (causeCode === "ENOTFOUND") {
    hints.push("The site URL may be wrong — use only the root, e.g. https://moodle.lsua.edu");
  } else if (causeCode === "ECONNREFUSED" || causeCode === "ETIMEDOUT") {
    hints.push("The server may block off-campus access. Sync from your laptop on campus Wi‑Fi or VPN.");
  } else if (cause?.message) {
    hints.push(cause.message);
  }

  return new Error(hints.join(" "));
}

export async function moodleApiRequest<T>(
  baseUrl: string,
  token: string,
  wsfunction: string,
  extraParams: Record<string, string> = {},
): Promise<T> {
  const params = new URLSearchParams({
    wstoken: token.trim(),
    wsfunction,
    moodlewsrestformat: "json",
    ...extraParams,
  });
  const url = `${moodleRestServerUrl(baseUrl)}?${params.toString()}`;

  let response: Response;
  try {
    response = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });
  } catch (error) {
    throw formatMoodleNetworkError(error, baseUrl);
  }

  if (!response.ok) {
    throw new Error(moodleApiErrorMessage(response.status, baseUrl));
  }

  return parseMoodleJsonResponse<T>(response);
}

export async function fetchMoodleEnrolledCourses(
  baseUrl: string,
  token: string,
): Promise<MoodleCourse[]> {
  const payload = await moodleApiRequest<
    MoodleCourse[] | { courses?: MoodleCourse[] }
  >(baseUrl, token, "core_course_get_enrolled_courses_by_timeline_classification", {
    classification: "all",
    limit: "50",
    offset: "0",
  });

  if (Array.isArray(payload)) return payload;
  return payload.courses ?? [];
}

export async function fetchMoodleCourseContents(
  baseUrl: string,
  token: string,
  courseId: number,
): Promise<MoodleCourseContentSection[]> {
  return moodleApiRequest<MoodleCourseContentSection[]>(
    baseUrl,
    token,
    "core_course_get_contents",
    { courseid: String(courseId) },
  );
}

export async function fetchMoodleCourseAssignments(
  baseUrl: string,
  token: string,
  courseId: number,
): Promise<MoodleAssignment[]> {
  const payload = await moodleApiRequest<{
    courses?: Array<{ id: number; assignments?: MoodleAssignment[] }>;
  }>(baseUrl, token, "mod_assign_get_assignments", {
    "courseids[0]": String(courseId),
  });

  return payload.courses?.find((item) => item.id === courseId)?.assignments ?? [];
}

export async function fetchMoodleAssignmentGrade(
  baseUrl: string,
  token: string,
  assignmentId: number,
): Promise<{ grade: number; maxGrade: number } | null> {
  try {
    const gradesPayload = await moodleApiRequest<{
      assignments?: Array<{
        assignmentid: number;
        grades?: Array<{ userid: number; grade: string; grademax: number }>;
      }>;
    }>(baseUrl, token, "mod_assign_get_grades", {
      "assignmentids[0]": String(assignmentId),
    });
    const gradeRow = gradesPayload.assignments
      ?.find((item) => item.assignmentid === assignmentId)
      ?.grades?.[0];
    if (gradeRow?.grade && gradeRow.grade !== "-1") {
      const grade = Number.parseFloat(gradeRow.grade);
      if (Number.isFinite(grade)) {
        return { grade, maxGrade: gradeRow.grademax ?? 100 };
      }
    }
  } catch {
    // optional
  }
  return null;
}

export async function fetchMoodleCalendarEvents(
  baseUrl: string,
  token: string,
  courseId: number,
): Promise<MoodleCalendarEvent[]> {
  const now = Math.floor(Date.now() / 1000);
  const later = now + 120 * 24 * 60 * 60;

  try {
    const payload = await moodleApiRequest<{ events?: MoodleCalendarEvent[] }>(
      baseUrl,
      token,
      "core_calendar_get_calendar_events",
      {
        "events[courseids][0]": String(courseId),
        "options[userevents]": "0",
        "options[siteevents]": "0",
        "options[timestart]": String(now),
        "options[timeend]": String(later),
      },
    );
    return payload.events ?? [];
  } catch {
    return [];
  }
}

/** Calendar quiz/assign close events that are not already in mod_assign. */
export function moodleCalendarEventsToAssignments(
  events: MoodleCalendarEvent[],
): Array<{ name: string; duedate: number; kind: "quiz" | "assignment"; intro?: string }> {
  const bestByKey = new Map<
    string,
    { name: string; duedate: number; kind: "quiz" | "assignment"; intro?: string; score: number }
  >();

  for (const event of events) {
    const modulename = event.modulename ?? "";
    if (modulename !== "quiz" && modulename !== "assign") continue;

    const kind = modulename === "quiz" ? "quiz" : "assignment";
    const key = `${modulename}:${event.instance ?? event.id}`;
    const eventtype = (event.eventtype ?? "").toLowerCase();
    const name = event.name.replace(/\s+(opens|closes)$/i, "").trim();

    let score = 0;
    if (eventtype === "due" || eventtype === "close") score = 3;
    else if (/\bdue\b/i.test(event.name)) score = 2;
    else if (eventtype === "open") score = 1;

    const existing = bestByKey.get(key);
    if (existing && existing.score >= score) continue;

    bestByKey.set(key, {
      name,
      duedate: event.timestart,
      kind,
      intro: event.description,
      score,
    });
  }

  return [...bestByKey.values()].map(({ score: _score, ...item }) => item);
}

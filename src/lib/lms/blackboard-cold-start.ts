/**
 * Blackboard cold start: course metadata + gradebook column names (+ meetings)
 * → study-ready SYLLABUS text without fabricating lecture content.
 */

export type BlackboardColumnOutlineItem = {
  id: string;
  name: string;
  dueDate?: string | null;
};

export type BlackboardMeetingOutlineItem = {
  title?: string | null;
  dayOfWeek?: number | null;
};

export function blackboardSyllabusMaterialMeta(input: {
  baseUrl: string;
  courseKey: string;
  courseName: string;
}): { title: string; url: string } {
  const base = input.baseUrl.replace(/\/$/, "");
  return {
    title: `${input.courseName} Syllabus (Blackboard)`,
    // Stable course URL for provenance + idempotent updates.
    url: `${base}/ultra/courses/${encodeURIComponent(input.courseKey)}`,
  };
}

/**
 * Prefer gradebook/assignment column names as an outline when BB content APIs
 * are unavailable. Meetings add schedule context when present.
 */
export function buildBlackboardColdStartText(input: {
  courseName: string;
  courseKey?: string | null;
  columns?: BlackboardColumnOutlineItem[] | null;
  meetings?: BlackboardMeetingOutlineItem[] | null;
  minSeedLength?: number;
}): { text: string; seeded: boolean } {
  const minSeedLength = input.minSeedLength ?? 40;

  const lines: string[] = [`Course: ${input.courseName}`];
  if (input.courseKey?.trim()) {
    lines.push(`Course key: ${input.courseKey.trim()}`);
  }

  const columnLines: string[] = [];
  for (const col of (input.columns ?? []).slice(0, 40)) {
    const name = col.name?.trim();
    if (!name || name.length < 2) continue;
    columnLines.push(
      col.dueDate
        ? `${columnLines.length + 1}. ${name} (due ${col.dueDate})`
        : `${columnLines.length + 1}. ${name}`,
    );
  }

  if (columnLines.length > 0) {
    lines.push("", "Gradebook / assignment outline", ...columnLines);
  }

  const meetings = input.meetings ?? [];
  const meetingLines = meetings
    .map((m) => m.title?.trim())
    .filter((title): title is string => Boolean(title && title.length >= 2))
    .slice(0, 20)
    .map((title, index) => `${index + 1}. ${title}`);

  if (meetingLines.length > 0) {
    lines.push("", "Class meetings", ...meetingLines);
  }

  const text = lines.join("\n").trim();
  return {
    text,
    seeded: text.length >= minSeedLength && columnLines.length + meetingLines.length > 0,
  };
}

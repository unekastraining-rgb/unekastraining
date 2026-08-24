import type { CourseInfoPortal } from "./types";
import { parseCourseInfoPortal } from "./types";

const MAX_SECTION_BODY = 2_500;
const MAX_TOTAL = 12_000;

function trimBody(body: string | undefined, max = MAX_SECTION_BODY): string {
  const flat = (body ?? "").replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  return `${flat.slice(0, max).trim()}…`;
}

/** Flatten imported Moodle portal JSON into readable text for AI context. */
export function portalToContextText(
  courseInfoJson: string | null | undefined,
  maxChars = MAX_TOTAL,
): string {
  const portal = parseCourseInfoPortal(courseInfoJson);
  if (!portal) return "";

  const lines: string[] = [
    `Course: ${portal.course.name}`,
    portal.course.shortname ? `Code: ${portal.course.shortname}` : null,
    portal.course.startDate && portal.course.endDate
      ? `Term: ${portal.course.startDate} – ${portal.course.endDate}`
      : portal.course.startDate
        ? `Starts: ${portal.course.startDate}`
        : null,
    `Synced: ${portal.syncedAt}`,
    "",
  ].filter((line): line is string => Boolean(line));

  for (const section of portal.sections) {
    if (!section.items.length) continue;
    lines.push(`## ${section.title}`);
    for (const item of section.items) {
      const parts = [item.title];
      if (item.date) parts.push(`(${item.date})`);
      lines.push(`- ${parts.join(" ")}`);
      if (item.body) lines.push(`  ${trimBody(item.body)}`);
    }
    lines.push("");
    if (lines.join("\n").length > maxChars) break;
  }

  const text = lines.join("\n").trim();
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars).trim()}…`;
}

export function portalFromJson(courseInfoJson: string | null | undefined): CourseInfoPortal | null {
  return parseCourseInfoPortal(courseInfoJson);
}

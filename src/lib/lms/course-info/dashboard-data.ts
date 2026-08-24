import type { CourseHighlights } from "./highlights";
import { buildCourseHighlights } from "./highlights";
import type { CourseInfoPortal } from "./types";
import { parseCourseInfoPortal } from "./types";

export interface CoursePolicyItem {
  id: string;
  title: string;
  body: string;
}

export interface CourseAnnouncementItem {
  id: string;
  title: string;
  date?: string;
  preview: string;
  body: string;
  url?: string;
}

export interface GradingRow {
  label: string;
  percent: number;
}

export interface CourseResourceItem {
  id: string;
  title: string;
  body: string;
  url?: string;
}

export interface CourseMaterialLine {
  id: string;
  label: string;
}

export interface CourseDashboardData {
  highlights: CourseHighlights;
  policies: CoursePolicyItem[];
  announcements: CourseAnnouncementItem[];
  instructions: CourseResourceItem[];
  gradingRows: GradingRow[];
  gradingScale?: string;
  materials: CourseMaterialLine[];
}

const POLICY_SECTIONS: Array<{ sectionId: string; title: string }> = [
  { sectionId: "attendance", title: "Attendance Policy" },
  { sectionId: "policies", title: "Course Policies" },
  { sectionId: "etiquette", title: "Online Etiquette" },
  { sectionId: "technology", title: "Technology Requirements" },
  { sectionId: "grading", title: "Grading Policy" },
];

const POLICY_TITLE_PATTERNS: Array<{ pattern: RegExp; title: string }> = [
  { pattern: /\blate work\b/i, title: "Late Work" },
  { pattern: /\bacademic integrity\b/i, title: "Academic Integrity" },
  { pattern: /\bcommunication\b/i, title: "Communication" },
  { pattern: /\bmake[- ]?up\b/i, title: "Makeup Work" },
  { pattern: /\bparticipation\b/i, title: "Participation" },
  { pattern: /\battendance\b/i, title: "Attendance Policy" },
];

function sectionItems(portal: CourseInfoPortal, sectionId: string) {
  return portal.sections.find((section) => section.id === sectionId)?.items ?? [];
}

function previewText(text: string, max = 140): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  return `${flat.slice(0, max).trim()}…`;
}

function parseGradingRows(body: string): GradingRow[] {
  const rows: GradingRow[] = [];
  const seen = new Set<string>();

  for (const line of body.split(/\n/)) {
    const match = line.match(/^(.+?)\s+(\d{1,3})\s*%?\s*$/);
    if (!match) continue;
    const label = match[1]!.replace(/^[\s•\-*\d.)]+/, "").trim();
    const percent = Number(match[2]);
    if (!label || label.length < 2 || percent > 100) continue;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({ label, percent });
  }

  return rows;
}

function parseGradingScale(body: string): string | undefined {
  const scaleLine = body
    .split(/\n/)
    .find((line) => /\b(a|b|c|d|f)\s*[-=]\s*\d/i.test(line) || /\bgrading scale\b/i.test(line));
  return scaleLine?.trim();
}

function buildPolicies(portal: CourseInfoPortal): CoursePolicyItem[] {
  const policies: CoursePolicyItem[] = [];
  const seen = new Set<string>();

  for (const { sectionId, title } of POLICY_SECTIONS) {
    for (const item of sectionItems(portal, sectionId)) {
      const body = item.body?.trim();
      if (!body || body.length < 20) continue;
      const key = `${sectionId}-${item.title}`;
      if (seen.has(key)) continue;
      seen.add(key);
      policies.push({
        id: key,
        title: item.title && item.title !== title ? item.title : title,
        body,
      });
    }
  }

  for (const item of sectionItems(portal, "policies")) {
    const body = item.body?.trim();
    if (!body) continue;
    for (const { pattern, title } of POLICY_TITLE_PATTERNS) {
      if (!pattern.test(item.title) && !pattern.test(body.slice(0, 200))) continue;
      const key = title.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      policies.push({ id: `policy-${key}`, title, body });
    }
    if (!seen.has(item.title.toLowerCase())) {
      seen.add(item.title.toLowerCase());
      policies.push({
        id: `policy-${item.title}`,
        title: item.title,
        body,
      });
    }
  }

  return policies;
}

function buildAnnouncements(portal: CourseInfoPortal): CourseAnnouncementItem[] {
  return sectionItems(portal, "announcements").map((item, index) => {
    const body = item.body ?? "";
    return {
      id: `announcement-${index}-${item.title}`,
      title: item.title,
      date: item.date,
      preview: previewText(body),
      body,
      url: item.source.url,
    };
  });
}

function buildInstructions(portal: CourseInfoPortal): CourseResourceItem[] {
  const items: CourseResourceItem[] = [];
  const seen = new Set<string>();

  const sectionIds = ["assignments", "projects", "resources", "media", "other"];
  for (const sectionId of sectionIds) {
    for (const item of sectionItems(portal, sectionId)) {
      const title = item.title ?? "";
      const body = item.body?.trim() ?? "";
      if (!body && !item.source.url) continue;
      const looksLikeInstructions =
        /\b(instruction|guideline|rubric|business plan|project|exam prep|procedure|how to)\b/i.test(
          `${title} ${body.slice(0, 120)}`,
        );
      if (!looksLikeInstructions && sectionId !== "projects") continue;
      const key = title.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      items.push({
        id: `${sectionId}-${title}`,
        title,
        body: body || "Open this resource for full instructions.",
        url: item.source.url,
      });
    }
  }

  return items.slice(0, 12);
}

function buildMaterials(
  highlights: CourseHighlights,
  meetings: Array<{ title: string | null; dayOfWeek: number; startTime: string; location: string | null }>,
): CourseMaterialLine[] {
  const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const lines: CourseMaterialLine[] = [];
  const seen = new Set<string>();

  for (const event of highlights.importantEvents) {
    if (!/\bzoom|virtual|live\s+session|webinar\b/i.test(event.title)) continue;
    const label = event.date
      ? `${event.title} · ${new Date(event.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
      : event.title;
    if (!seen.has(label)) {
      seen.add(label);
      lines.push({ id: event.id, label });
    }
  }

  for (const meeting of meetings) {
    if (!meeting.location?.toLowerCase().includes("zoom") && !meeting.title?.toLowerCase().includes("zoom")) {
      continue;
    }
    const label = `${meeting.title ?? "Class"} — ${DAY_LABELS[meeting.dayOfWeek] ?? "Day"} ${meeting.startTime}${meeting.location ? ` · ${meeting.location}` : ""}`;
    if (!seen.has(label)) {
      seen.add(label);
      lines.push({ id: `meeting-${meeting.dayOfWeek}-${meeting.startTime}`, label });
    }
  }

  for (const group of highlights.whatYouNeed) {
    for (const item of group.items) {
      const short = previewText(item, 100);
      if (!seen.has(short)) {
        seen.add(short);
        lines.push({ id: `need-${short.slice(0, 24)}`, label: short });
      }
    }
  }

  return lines.slice(0, 10);
}

export function buildCourseDashboardData(
  courseInfoJson: string | null | undefined,
  assignments: Array<{
    id: string;
    title: string;
    dueDate: string | null;
    status: string;
    kind: string;
  }>,
  instructor: string | null,
  meetings: Array<{
    title: string | null;
    dayOfWeek: number;
    startTime: string;
    location: string | null;
  }> = [],
): CourseDashboardData {
  const portal = parseCourseInfoPortal(courseInfoJson);
  const highlights = buildCourseHighlights(portal, assignments, instructor);

  const gradingBody = portal
    ? sectionItems(portal, "grading")
        .map((item) => item.body ?? "")
        .join("\n")
    : "";

  return {
    highlights,
    policies: portal ? buildPolicies(portal) : [],
    announcements: portal ? buildAnnouncements(portal) : [],
    instructions: portal ? buildInstructions(portal) : [],
    gradingRows: gradingBody ? parseGradingRows(gradingBody) : [],
    gradingScale: gradingBody ? parseGradingScale(gradingBody) : undefined,
    materials: buildMaterials(highlights, meetings),
  };
}

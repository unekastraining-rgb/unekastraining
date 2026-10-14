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
  body: string;
  /** Moodle / syllabus section this came from */
  source: string;
  url?: string;
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

/** Policy chips on the dashboard — grading lives in its own block. */
const POLICY_SECTIONS: Array<{ sectionId: string; title: string }> = [
  { sectionId: "attendance", title: "Attendance" },
  { sectionId: "etiquette", title: "Online Etiquette" },
  { sectionId: "technology", title: "Technology" },
];

const POLICY_TITLE_PATTERNS: Array<{ pattern: RegExp; title: string }> = [
  { pattern: /\blate work\b/i, title: "Late Work" },
  { pattern: /\bacademic integrity\b/i, title: "Academic Integrity" },
  { pattern: /\bcommunication\b/i, title: "Communication" },
  { pattern: /\bmake[- ]?up\b/i, title: "Makeup Work" },
  { pattern: /\bparticipation\b/i, title: "Participation" },
  { pattern: /\battendance\b/i, title: "Attendance" },
];

const ANNOUNCEMENT_JUNK =
  /\b(welcome to (the )?forum|use this forum|subscribe to this forum|forum description|no announcements yet)\b/i;

function sectionItems(portal: CourseInfoPortal, sectionId: string) {
  return portal.sections.find((section) => section.id === sectionId)?.items ?? [];
}

function previewText(text: string, max = 140): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  return `${flat.slice(0, max).trim()}…`;
}

function normalizeKey(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function bodyFingerprint(body: string): string {
  return normalizeKey(body).slice(0, 160);
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
    // Skip prose that looks like a sentence, not a weight row.
    if (/\b(will|should|must|please|student)\b/i.test(label) && label.length > 40) {
      continue;
    }
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

function pushPolicy(
  policies: CoursePolicyItem[],
  seenTitles: Set<string>,
  seenBodies: Set<string>,
  title: string,
  body: string,
  id: string,
) {
  const trimmed = body.trim();
  if (!trimmed || trimmed.length < 40) return;
  const titleKey = normalizeKey(title);
  const bodyKey = bodyFingerprint(trimmed);
  if (seenTitles.has(titleKey) || seenBodies.has(bodyKey)) return;
  seenTitles.add(titleKey);
  seenBodies.add(bodyKey);
  policies.push({ id, title, body: trimmed });
}

function buildPolicies(portal: CourseInfoPortal): CoursePolicyItem[] {
  const policies: CoursePolicyItem[] = [];
  const seenTitles = new Set<string>();
  const seenBodies = new Set<string>();

  for (const { sectionId, title } of POLICY_SECTIONS) {
    for (const item of sectionItems(portal, sectionId)) {
      const body = item.body?.trim();
      if (!body) continue;
      const displayTitle =
        item.title && !/^course policies?$/i.test(item.title) ? item.title : title;
      pushPolicy(
        policies,
        seenTitles,
        seenBodies,
        displayTitle,
        body,
        `${sectionId}-${displayTitle}`,
      );
    }
  }

  // Split the lumped "Course Policies" portal section into named chips once.
  for (const item of sectionItems(portal, "policies")) {
    const body = item.body?.trim();
    if (!body) continue;

    let matchedPattern = false;
    for (const { pattern, title } of POLICY_TITLE_PATTERNS) {
      if (!pattern.test(item.title) && !pattern.test(body.slice(0, 240))) continue;
      matchedPattern = true;
      pushPolicy(policies, seenTitles, seenBodies, title, body, `policy-${title}`);
    }

    // Avoid a second "Course Policies" chip that duplicates Full syllabus.
    if (
      !matchedPattern &&
      item.title &&
      !/^course policies?$/i.test(item.title)
    ) {
      pushPolicy(
        policies,
        seenTitles,
        seenBodies,
        item.title,
        body,
        `policy-${item.title}`,
      );
    }
  }

  return policies;
}

function buildAnnouncements(portal: CourseInfoPortal): CourseAnnouncementItem[] {
  return sectionItems(portal, "announcements")
    .map((item, index) => {
      const body = (item.body ?? "").trim();
      const title = (item.title ?? "").trim() || "Announcement";
      return {
        id: `announcement-${index}-${title}`,
        title,
        date: item.date,
        preview: previewText(body, 120),
        body,
        url: item.source.url,
      };
    })
    .filter((item) => {
      if (!item.body && !item.url) return false;
      if (item.body.length < 24 && !item.date) return false;
      if (ANNOUNCEMENT_JUNK.test(item.title) || ANNOUNCEMENT_JUNK.test(item.body)) {
        return false;
      }
      return true;
    })
    .slice(0, 8);
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

function isConcreteRequirement(line: string): boolean {
  const text = line.trim();
  if (text.length < 8 || text.length > 180) return false;
  if (/^https?:\/\//i.test(text)) return false;
  if (
    /\b(textbook|required text|isbn|access code|calculator|laptop|webcam|microphone|headset|browser|chrome|firefox|microsoft|office|zoom|blackboard|canvas|moodle|mymathlab|connect|cengage|pearson|mcgraw|purchase|bring|need)\b/i.test(
      text,
    )
  ) {
    return true;
  }
  if (/^\d+[\).\]]\s+\S/.test(text)) return true;
  if (/^[•\-]\s+\S/.test(text)) return true;
  return text.split(/\s+/).length <= 16;
}

/**
 * Materials & requirements from Moodle course-info portal:
 * - `materials` section (textbook / required materials pages)
 * - `technology` section (tech requirements pages)
 * We show titled Moodle items first (what was imported), then short requirement lines.
 */
function buildMaterials(
  portal: CourseInfoPortal | null,
  highlights: CourseHighlights,
): CourseMaterialLine[] {
  const lines: CourseMaterialLine[] = [];
  const seen = new Set<string>();

  if (portal) {
    for (const sectionId of ["materials", "technology"] as const) {
      const sourceLabel =
        sectionId === "materials"
          ? "Moodle · Materials"
          : "Moodle · Technology";
      for (const item of sectionItems(portal, sectionId)) {
        const title = (item.title ?? "").trim();
        const body = (item.body ?? "").trim();
        if (!title && !body) continue;
        const label = title
          ? body && body.length < 120 && body !== title
            ? `${title} — ${previewText(body, 90)}`
            : title
          : previewText(body, 110);
        const key = normalizeKey(label);
        if (seen.has(key)) continue;
        seen.add(key);
        lines.push({
          id: `${sectionId}-${title || label.slice(0, 24)}`,
          label: title || previewText(body, 60),
          body: body || title,
          source: sourceLabel,
          url: item.source.url,
        });
      }
    }
  }

  // Fallback: NLP “what you need” lines when Moodle sections were empty/noisy.
  if (lines.length === 0) {
    for (const group of highlights.whatYouNeed) {
      for (const item of group.items) {
        if (!isConcreteRequirement(item)) continue;
        const short = previewText(item, 110);
        const key = normalizeKey(short);
        if (seen.has(key)) continue;
        seen.add(key);
        lines.push({
          id: `need-${group.label}-${short.slice(0, 24)}`,
          label: short,
          body: item,
          source: `Syllabus · ${group.label}`,
        });
      }
    }
  }

  return lines.slice(0, 12);
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
  void meetings;
  const portal = parseCourseInfoPortal(courseInfoJson);
  const highlights = buildCourseHighlights(portal, assignments, instructor);

  const gradingBody = portal
    ? sectionItems(portal, "grading")
        .map((item) => item.body ?? "")
        .join("\n")
    : "";

  const gradingRows = gradingBody ? parseGradingRows(gradingBody) : [];
  const gradingScale = gradingBody ? parseGradingScale(gradingBody) : undefined;

  return {
    highlights,
    policies: portal ? buildPolicies(portal) : [],
    announcements: portal ? buildAnnouncements(portal) : [],
    instructions: portal ? buildInstructions(portal) : [],
    gradingRows,
    gradingScale,
    materials: buildMaterials(portal, highlights),
  };
}

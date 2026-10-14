import type { CourseInfoPortal } from "./types";
import { parseCourseInfoPortal } from "./types";
import {
  classifyScheduleTitle,
  extractSyllabusDateItemsFromText,
  extractWhenLabel,
  hasScheduleTiming,
  isJunkDateTitle,
  isSemesterDateTitle,
  shortEventTitle,
  type ScheduleBucket,
} from "./syllabus-dates";
import { buildWeeklyHaulFromPortal, type WeeklyHaulBlock } from "./weekly-schedule";

export interface CourseHighlightDate {
  id: string;
  title: string;
  date?: string;
  when?: string;
  daysUntil?: number;
}

export interface WhatYouNeedGroup {
  label: string;
  items: string[];
}

export interface CourseHighlights {
  termStart?: string;
  termEnd?: string;
  instructor?: string;
  importantAssessments: CourseHighlightDate[];
  importantEvents: CourseHighlightDate[];
  thisWeeksHaul: WeeklyHaulBlock | null;
  whatYouNeed: WhatYouNeedGroup[];
  gradingSnapshot?: string;
  hasPortal: boolean;
}

const ASSESSMENT_PATTERN =
  /\b(quiz|assessment|exam|midterm|mid-term|final exam|pre-course|post-course|test\s*\d|final project)\b/i;
const ROUTINE_WORK_PATTERN =
  /\b(podcast|business plan|presentation|portfolio|summary)\b/i;
const PROSE_PATTERN =
  /\b(subchapter|following|you will find|details about|once leads|long-term success|grade breakdown)\b/i;
const GENERIC_DATE_SECTION_TITLE =
  /^(important dates?|course schedule|academic calendar|weekly schedule)$/i;

interface AssignmentLike {
  id: string;
  title: string;
  dueDate: string | null;
  status: string;
  kind: string;
}

function daysUntil(iso: string): number {
  const target = parseHeadlineDate(iso);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / 86_400_000);
}

function parseHeadlineDate(iso: string): Date {
  const dateOnly = iso.match(/^(\d{4})-(\d{2})-(\d{2})(?:T|$)/);
  if (dateOnly) {
    return new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]));
  }
  return new Date(iso);
}

function normalizeTitle(title: string): string {
  return title
    .replace(/\bopens?\b/gi, "")
    .replace(/\bis due\b/gi, "")
    .replace(/\)\s+is$/i, ")")
    .replace(/\bis$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function titleKey(title: string): string {
  return normalizeTitle(title).toLowerCase();
}

function isRoutineWork(title: string): boolean {
  return ROUTINE_WORK_PATTERN.test(title);
}

function looksLikeProse(title: string): boolean {
  return title.length > 110 || PROSE_PATTERN.test(title);
}

function isImportantAssessment(title: string, kind?: string): boolean {
  if (isJunkDateTitle(title)) return false;
  if (looksLikeProse(title)) return false;
  if (isRoutineWork(title)) return false;
  if (isSemesterDateTitle(title)) return false;
  if (/\bmodule\s+\d+\s+quiz\b/i.test(title)) return false;
  if (/\bfinal grades?\b/i.test(title)) return false;
  if (kind === "QUIZ" || kind === "TEST") return true;
  return ASSESSMENT_PATTERN.test(title);
}

function sectionItems(portal: CourseInfoPortal, sectionId: string) {
  return portal.sections.find((section) => section.id === sectionId)?.items ?? [];
}

function splitIntoSentences(text: string): string[] {
  return text
    .split(/\n+/)
    .flatMap((line) => line.split(/(?<=[.!?])\s+/))
    .map((part) => part.replace(/^[\s•\-*]+/, "").trim())
    .filter((part) => part.length > 12 && part.length < 320);
}

function pickMatchingLines(text: string | undefined, patterns: RegExp[], limit = 6): string[] {
  if (!text?.trim()) return [];
  const lines = splitIntoSentences(text);
  const picked: string[] = [];

  for (const line of lines) {
    if (!patterns.some((pattern) => pattern.test(line))) continue;
    const lower = line.toLowerCase();
    if (picked.some((item) => item.toLowerCase() === lower)) continue;
    picked.push(line);
    if (picked.length >= limit) break;
  }

  return picked;
}

function extractTextbookNeeds(text: string | undefined): string[] {
  const fromPatterns = pickMatchingLines(text, [
    /\bisbn\b/i,
    /\btextbook\b/i,
    /\brequired material/i,
    /\bpublisher\b/i,
    /\bedition\b/i,
    /\bunderstanding business\b/i,
    /\bmcgraw\b/i,
    /\byou may purchase\b/i,
    /\bbookstore\b/i,
  ], 8);

  if (fromPatterns.length > 0) return fromPatterns;

  return splitIntoSentences(text ?? "")
    .filter((line) => /\b(required|textbook|isbn|material)\b/i.test(line))
    .slice(0, 5);
}

function extractTechnologyNeeds(text: string | undefined): string[] {
  return pickMatchingLines(text, [
    /\bmicrophone\b/i,
    /\bwebcam\b/i,
    /\bspeaker/i,
    /\bheadset\b/i,
    /\bbrowser\b/i,
    /\bchrome\b/i,
    /\bfirefox\b/i,
    /\bwindows\b/i,
    /\blaptop\b/i,
    /\bcomputer\b/i,
    /\btechnical requirement/i,
    /\bhardware recommendation/i,
    /\bmoodle runs on\b/i,
  ], 8);
}

function buildWhatYouNeed(portal: CourseInfoPortal): WhatYouNeedGroup[] {
  const groups: WhatYouNeedGroup[] = [];

  const materialsText = sectionItems(portal, "materials")
    .map((item) => item.body ?? "")
    .join("\n\n");
  const textbooks = extractTextbookNeeds(materialsText);
  if (textbooks.length > 0) {
    groups.push({ label: "Textbook & materials", items: textbooks });
  }

  const technologyText = sectionItems(portal, "technology")
    .map((item) => item.body ?? "")
    .join("\n\n");
  const technology = extractTechnologyNeeds(technologyText);
  if (technology.length > 0) {
    groups.push({ label: "Computer & tech", items: technology });
  }

  return groups;
}

function findAssignmentDate(
  title: string,
  assignments: AssignmentLike[],
): string | undefined {
  const key = titleKey(title);
  const match = assignments.find((assignment) => {
    const assignmentKey = titleKey(assignment.title);
    return assignmentKey.includes(key) || key.includes(assignmentKey);
  });
  return match?.dueDate ?? undefined;
}

function inferPortalYear(portal: CourseInfoPortal): number {
  if (portal.course.startDate) {
    const year = new Date(portal.course.startDate).getFullYear();
    if (!Number.isNaN(year)) return year;
  }
  return new Date().getFullYear();
}

interface ImportantDateEntry {
  id: string;
  title: string;
  date?: string;
  when?: string;
  sourceType: string;
  bucket: ScheduleBucket;
}

function collectImportantDateEntries(
  portal: CourseInfoPortal,
  item: CourseInfoPortal["sections"][0]["items"][0],
  index: number,
): ImportantDateEntry[] {
  const entries: ImportantDateEntry[] = [];
  const seen = new Set<string>();
  const pushEntry = (
    title: string,
    date: string | undefined,
    suffix: string,
    when: string | undefined,
    bucket: ScheduleBucket,
  ) => {
    const trimmed = shortEventTitle(title);
    if (!trimmed || trimmed.length < 4) return;
    if (isJunkDateTitle(title) || isJunkDateTitle(trimmed)) return;
    if (looksLikeProse(title)) return;
    if (!date && !when && !hasScheduleTiming(title)) return;
    const key = `${bucket}:${titleKey(trimmed)}`;
    if (seen.has(key)) return;
    seen.add(key);
    entries.push({
      id: `important-date-${index}-${key.slice(0, 24)}${suffix}`,
      title: trimmed,
      date,
      when: when ?? extractWhenLabel(title),
      sourceType: item.source.type,
      bucket,
    });
  };

  const isGenericChapterTitle = GENERIC_DATE_SECTION_TITLE.test(item.title.trim());
  if (!isGenericChapterTitle) {
    const bucket = classifyScheduleTitle(item.title);
    if (bucket) {
      pushEntry(item.title, item.date, "-title", item.when ?? extractWhenLabel(item.title), bucket);
    }
  }

  if (item.body?.trim()) {
    const extracted = extractSyllabusDateItemsFromText(
      item.body,
      item.source.label ?? "Important Dates",
      inferPortalYear(portal),
    );
    for (const line of extracted) {
      pushEntry(line.title, line.date, "-extracted", line.when, line.bucket);
    }
  }

  return entries;
}

function routeImportantDateEntry(
  entry: ImportantDateEntry,
  assessmentMap: Map<string, CourseHighlightDate>,
  eventMap: Map<string, CourseHighlightDate>,
  assignments: AssignmentLike[],
) {
  if (isJunkDateTitle(entry.title)) return;
  if (!entry.date && !entry.when) return;
  if (entry.sourceType === "moodle_assignment" || isRoutineWork(entry.title)) return;

  const bucket = entry.bucket ?? classifyScheduleTitle(entry.title);
  if (bucket === "course" || (!bucket && isImportantAssessment(entry.title))) {
    pushAssessment(assessmentMap, {
      id: entry.id,
      title: entry.title,
      date: entry.date ?? findAssignmentDate(entry.title, assignments),
      when: entry.when,
    });
    return;
  }

  if (bucket === "semester") {
    pushEvent(eventMap, {
      id: entry.id,
      title: entry.title,
      date: entry.date,
      when: entry.when,
    });
  }
}

function pushEvent(
  map: Map<string, CourseHighlightDate>,
  item: { id: string; title: string; date?: string; when?: string },
) {
  const key = titleKey(item.title);
  const existing = map.get(key);
  if (existing && existing.date && !item.date) return;
  map.set(key, {
    id: item.id,
    title: normalizeTitle(item.title),
    date: item.date ?? existing?.date,
    when: item.when ?? existing?.when,
    daysUntil: item.date ? daysUntil(item.date) : existing?.daysUntil,
  });
}

function pushAssessment(
  map: Map<string, CourseHighlightDate>,
  item: { id: string; title: string; date?: string; when?: string },
) {
  const key = titleKey(item.title);
  const existing = map.get(key);
  if (existing && existing.date && !item.date) return;
  map.set(key, {
    id: item.id,
    title: normalizeTitle(item.title),
    date: item.date ?? existing?.date,
    when: item.when ?? existing?.when,
    daysUntil: item.date ? daysUntil(item.date) : existing?.daysUntil,
  });
}

export function buildCourseHighlights(
  portal: CourseInfoPortal | null,
  assignments: AssignmentLike[],
  instructor: string | null,
): CourseHighlights {
  const assessmentMap = new Map<string, CourseHighlightDate>();
  const eventMap = new Map<string, CourseHighlightDate>();
  let whatYouNeed: WhatYouNeedGroup[] = [];
  let gradingSnapshot: string | undefined;
  let thisWeeksHaul: WeeklyHaulBlock | null = null;

  if (portal) {
    whatYouNeed = buildWhatYouNeed(portal);
    thisWeeksHaul = buildWeeklyHaulFromPortal(portal);

    const grading = sectionItems(portal, "grading")[0];
    if (grading?.body) {
      gradingSnapshot = pickMatchingLines(
        grading.body,
        [/\bgrade\b/i, /\bpoints?\b/i, /\bweight\b/i, /\bscale\b/i, /\bassessment\b/i],
        3,
      ).join(" ");
      if (!gradingSnapshot) {
        gradingSnapshot = grading.body.slice(0, 240).trim();
      }
    }

    for (const item of sectionItems(portal, "quizzes")) {
      if (isJunkDateTitle(item.title) || !isImportantAssessment(item.title)) continue;
      const date = item.date ?? findAssignmentDate(item.title, assignments);
      const when = item.when ?? extractWhenLabel(item.title);
      if (!date && !when) continue;
      pushAssessment(assessmentMap, {
        id: `quiz-${item.title}`,
        title: shortEventTitle(item.title),
        date,
        when,
      });
    }

    for (const [index, item] of sectionItems(portal, "important-dates").entries()) {
      for (const entry of collectImportantDateEntries(portal, item, index)) {
        routeImportantDateEntry(entry, assessmentMap, eventMap, assignments);
      }
    }
  }

  for (const assignment of assignments) {
    if (isJunkDateTitle(assignment.title) || !isImportantAssessment(assignment.title, assignment.kind)) {
      continue;
    }
    if (!assignment.dueDate) continue;
    pushAssessment(assessmentMap, {
      id: `assignment-${assignment.id}`,
      title: shortEventTitle(assignment.title),
      date: assignment.dueDate,
    });
  }

  const assessmentKeys = new Set([...assessmentMap.keys()]);
  const importantAssessments = [...assessmentMap.values()]
    .filter((item) => !isSemesterDateTitle(item.title))
    .sort((a, b) => {
      if (a.date && b.date) return a.date.localeCompare(b.date);
      if (a.date) return -1;
      if (b.date) return 1;
      return a.title.localeCompare(b.title);
    });

  const importantEvents = [...eventMap.values()]
    .filter((item) => Boolean(item.date || item.when))
    .filter((item) => !assessmentKeys.has(titleKey(item.title)))
    .filter((item) => classifyScheduleTitle(item.title) !== "course")
    // Hide dates that have already passed (keep undated "when" labels).
    .filter((item) => item.daysUntil === undefined || item.daysUntil >= 0)
    .sort((a, b) => {
      if (a.date && b.date) return a.date.localeCompare(b.date);
      if (a.date) return -1;
      if (b.date) return 1;
      return a.title.localeCompare(b.title);
    });

  const instructorFromPortal = portal
    ? sectionItems(portal, "instructor")[0]?.body
        ?.split("\n")
        .map((line) => line.trim())
        .find((line) => line.length > 0 && !/^#/.test(line))
    : undefined;

  return {
    termStart: portal?.course.startDate,
    termEnd: portal?.course.endDate,
    instructor: instructor?.trim() || instructorFromPortal || undefined,
    importantAssessments,
    importantEvents,
    thisWeeksHaul,
    whatYouNeed,
    gradingSnapshot,
    hasPortal: Boolean(portal),
  };
}

export function buildCourseHighlightsFromJson(
  courseInfoJson: string | null | undefined,
  assignments: AssignmentLike[],
  instructor: string | null,
): CourseHighlights {
  return buildCourseHighlights(
    parseCourseInfoPortal(courseInfoJson),
    assignments,
    instructor,
  );
}

export function formatHeadlineDate(iso: string): string {
  const date = parseHeadlineDate(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatTermDate(iso: string): string {
  const date = parseHeadlineDate(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatEventTiming(item: CourseHighlightDate): string | null {
  if (item.when) {
    const until =
      item.date && item.daysUntil !== undefined ? ` · ${formatDaysUntilLabel(item.daysUntil)}` : "";
    return `${item.when}${until}`;
  }
  if (item.date) {
    return `${formatHeadlineDate(item.date)}${
      item.daysUntil !== undefined ? ` · ${formatDaysUntilLabel(item.daysUntil)}` : ""
    }`;
  }
  return null;
}

export function formatDaysUntilLabel(days: number): string {
  if (days < 0) return `${Math.abs(days)}d ago`;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

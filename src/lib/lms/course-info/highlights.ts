import type { CourseInfoPortal } from "./types";
import { parseCourseInfoPortal } from "./types";

export interface CourseHighlightDate {
  id: string;
  title: string;
  date?: string;
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
  whatYouNeed: WhatYouNeedGroup[];
  gradingSnapshot?: string;
  hasPortal: boolean;
}

const ASSESSMENT_PATTERN =
  /\b(quiz|assessment|exam|midterm|mid-term|final|pre-course|post-course)\b/i;
const ROUTINE_WORK_PATTERN =
  /\b(podcast|business plan|presentation|portfolio)\b/i;

interface AssignmentLike {
  id: string;
  title: string;
  dueDate: string | null;
  status: string;
  kind: string;
}

function daysUntil(iso: string): number {
  const target = new Date(iso);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / 86_400_000);
}

function normalizeTitle(title: string): string {
  return title
    .replace(/\bopens?\b/gi, "")
    .replace(/\bis due\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function titleKey(title: string): string {
  return normalizeTitle(title).toLowerCase();
}

function isImportantAssessment(title: string, kind?: string): boolean {
  if (ROUTINE_WORK_PATTERN.test(title)) return false;
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

function pushAssessment(
  map: Map<string, CourseHighlightDate>,
  item: { id: string; title: string; date?: string },
) {
  const key = titleKey(item.title);
  const existing = map.get(key);
  if (existing && existing.date && !item.date) return;
  map.set(key, {
    id: item.id,
    title: normalizeTitle(item.title),
    date: item.date ?? existing?.date,
    daysUntil: item.date ? daysUntil(item.date) : existing?.daysUntil,
  });
}

export function buildCourseHighlights(
  portal: CourseInfoPortal | null,
  assignments: AssignmentLike[],
  instructor: string | null,
): CourseHighlights {
  const assessmentMap = new Map<string, CourseHighlightDate>();
  let whatYouNeed: WhatYouNeedGroup[] = [];
  let gradingSnapshot: string | undefined;

  if (portal) {
    whatYouNeed = buildWhatYouNeed(portal);

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
      if (!isImportantAssessment(item.title)) continue;
      pushAssessment(assessmentMap, {
        id: `quiz-${item.title}`,
        title: item.title,
        date: item.date ?? findAssignmentDate(item.title, assignments),
      });
    }

    for (const item of sectionItems(portal, "important-dates")) {
      if (!isImportantAssessment(item.title)) continue;
      pushAssessment(assessmentMap, {
        id: `date-${item.title}-${item.date ?? "nodate"}`,
        title: item.title,
        date: item.date ?? findAssignmentDate(item.title, assignments),
      });
    }

    for (const section of portal.sections) {
      for (const item of section.items) {
        if (!item.body || !ASSESSMENT_PATTERN.test(item.body)) continue;
        const lines = pickMatchingLines(item.body, [ASSESSMENT_PATTERN], 4);
        for (const line of lines) {
          if (!isImportantAssessment(line)) continue;
          pushAssessment(assessmentMap, {
            id: `body-${section.id}-${line.slice(0, 40)}`,
            title: line.slice(0, 120),
          });
        }
      }
    }
  }

  for (const assignment of assignments) {
    if (!isImportantAssessment(assignment.title, assignment.kind)) continue;
    pushAssessment(assessmentMap, {
      id: `assignment-${assignment.id}`,
      title: assignment.title,
      date: assignment.dueDate ?? undefined,
    });
  }

  const importantAssessments = [...assessmentMap.values()].sort((a, b) => {
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
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatTermDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDaysUntilLabel(days: number): string {
  if (days < 0) return `${Math.abs(days)}d ago`;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

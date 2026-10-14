/**
 * Phase 14 — LMS / local → AcademicCourse | AcademicItem adapters.
 * Pure normalization. Does not write DB. Preserves source identity.
 */

import {
  academicSourceKey,
  type AcademicCourse,
  type AcademicItem,
  type AcademicSource,
} from "@/lib/learning/academic/types";
import {
  inferAcademicItemType,
} from "@/lib/learning/academic/infer";

function asDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function normalizeAcademicCourse(input: {
  source: AcademicSource;
  userId: string;
  externalId: string;
  title: string;
  code?: string | null;
  instructor?: string | null;
  term?: string | null;
  active?: boolean;
  internalCourseId?: string;
  metadata?: Record<string, unknown>;
}): AcademicCourse {
  const externalId = String(input.externalId).trim();
  return {
    id: academicSourceKey(input.source, externalId || input.title),
    source: input.source,
    externalId: externalId || undefined,
    internalCourseId: input.internalCourseId,
    userId: input.userId,
    title: input.title.trim(),
    code: input.code ?? null,
    instructor: input.instructor ?? null,
    term: input.term ?? null,
    active: input.active ?? true,
    metadata: input.metadata,
  };
}

export function normalizeAcademicItem(input: {
  source: AcademicSource;
  userId: string;
  courseId: string;
  externalId: string;
  title: string;
  description?: string | null;
  dueAt?: string | Date | null;
  kindHint?: string | null;
  status?: string | null;
  sourceUrl?: string | null;
  internalAssignmentId?: string;
  metadata?: Record<string, unknown>;
}): AcademicItem {
  const externalId = String(input.externalId).trim();
  return {
    id: academicSourceKey(input.source, externalId || `${input.courseId}:${input.title}`),
    source: input.source,
    externalId: externalId || undefined,
    internalAssignmentId: input.internalAssignmentId,
    courseId: input.courseId,
    userId: input.userId,
    title: input.title.trim(),
    description: input.description ?? null,
    dueAt: asDate(input.dueAt),
    itemType: inferAcademicItemType(input.title, input.kindHint),
    status: input.status ?? null,
    sourceUrl: input.sourceUrl ?? null,
    metadata: input.metadata,
  };
}

/** Canvas course payload → AcademicCourse */
export function fromCanvasCourse(
  userId: string,
  course: { id: number | string; name: string; course_code?: string },
  internalCourseId?: string,
): AcademicCourse {
  return normalizeAcademicCourse({
    source: "canvas",
    userId,
    externalId: String(course.id),
    title: course.name,
    code: course.course_code ?? null,
    internalCourseId,
  });
}

/** Canvas assignment payload → AcademicItem */
export function fromCanvasAssignment(
  userId: string,
  courseId: string,
  assignment: {
    id: number | string;
    name: string;
    description?: string;
    due_at?: string | null;
    html_url?: string;
  },
  internalAssignmentId?: string,
): AcademicItem {
  return normalizeAcademicItem({
    source: "canvas",
    userId,
    courseId,
    externalId: String(assignment.id),
    title: assignment.name,
    description: assignment.description ?? null,
    dueAt: assignment.due_at ?? null,
    sourceUrl: assignment.html_url ?? null,
    internalAssignmentId,
  });
}

export function fromBlackboardCourse(
  userId: string,
  course: { id: string; name: string; courseId?: string },
  internalCourseId?: string,
): AcademicCourse {
  return normalizeAcademicCourse({
    source: "blackboard",
    userId,
    externalId: course.id,
    title: course.name,
    code: course.courseId ?? null,
    internalCourseId,
  });
}

export function fromBlackboardColumn(
  userId: string,
  courseId: string,
  column: {
    id: string;
    name: string;
    dueDate?: string | null;
    scoreProviderHandle?: string;
  },
  internalAssignmentId?: string,
): AcademicItem {
  return normalizeAcademicItem({
    source: "blackboard",
    userId,
    courseId,
    externalId: column.id,
    title: column.name,
    dueAt: column.dueDate ?? null,
    kindHint: column.name,
    internalAssignmentId,
    metadata: column.scoreProviderHandle
      ? { scoreProviderHandle: column.scoreProviderHandle }
      : undefined,
  });
}

export function fromMoodleCourse(
  userId: string,
  course: { id: number | string; fullname: string; shortname?: string },
  internalCourseId?: string,
): AcademicCourse {
  return normalizeAcademicCourse({
    source: "moodle",
    userId,
    externalId: String(course.id),
    title: course.fullname,
    code: course.shortname ?? null,
    internalCourseId,
  });
}

export function fromMoodleEvent(
  userId: string,
  courseId: string,
  event: {
    id: number | string;
    name: string;
    description?: string;
    timestart?: number;
    modulename?: string;
  },
  internalAssignmentId?: string,
): AcademicItem {
  const dueAt =
    typeof event.timestart === "number"
      ? new Date(event.timestart * 1000)
      : null;
  return normalizeAcademicItem({
    source: "moodle",
    userId,
    courseId,
    externalId: String(event.id),
    title: event.name,
    description: event.description ?? null,
    dueAt,
    kindHint: event.modulename ?? event.name,
    internalAssignmentId,
  });
}

export function fromGoogleClassroomCourse(
  userId: string,
  course: { id: string; name: string; section?: string },
  internalCourseId?: string,
): AcademicCourse {
  return normalizeAcademicCourse({
    source: "google-classroom",
    userId,
    externalId: course.id,
    title: course.name,
    term: course.section ?? null,
    internalCourseId,
  });
}

export function fromGoogleClassroomCourseWork(
  userId: string,
  courseId: string,
  work: {
    id: string;
    title: string;
    description?: string;
    dueDate?: { year: number; month: number; day: number } | null;
    workType?: string;
    alternateLink?: string;
  },
  internalAssignmentId?: string,
): AcademicItem {
  let dueAt: Date | null = null;
  if (work.dueDate?.year) {
    dueAt = new Date(
      work.dueDate.year,
      (work.dueDate.month ?? 1) - 1,
      work.dueDate.day ?? 1,
    );
  }
  return normalizeAcademicItem({
    source: "google-classroom",
    userId,
    courseId,
    externalId: work.id,
    title: work.title,
    description: work.description ?? null,
    dueAt,
    kindHint: work.workType ?? work.title,
    sourceUrl: work.alternateLink ?? null,
    internalAssignmentId,
  });
}

/** Local planner Assignment row → AcademicItem */
export function fromLocalAssignment(
  userId: string,
  assignment: {
    id: string;
    courseId: string;
    title: string;
    description?: string | null;
    dueDate?: Date | null;
    kind?: string | null;
    status?: string | null;
  },
): AcademicItem {
  return normalizeAcademicItem({
    source: "local",
    userId,
    courseId: assignment.courseId,
    externalId: assignment.id,
    title: assignment.title,
    description: assignment.description ?? null,
    dueAt: assignment.dueDate ?? null,
    kindHint: assignment.kind ?? null,
    status: assignment.status ?? null,
    internalAssignmentId: assignment.id,
  });
}

/** Deduplicate by stable source key; first wins. */
export function dedupeAcademicItems(
  items: readonly AcademicItem[],
): AcademicItem[] {
  const seen = new Set<string>();
  const out: AcademicItem[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}

/** Ownership filter — never leaks another user's items. */
export function filterAcademicItemsForUser(
  userId: string,
  items: readonly AcademicItem[],
): AcademicItem[] {
  return items.filter((i) => i.userId === userId);
}

export function filterAcademicCoursesForUser(
  userId: string,
  courses: readonly AcademicCourse[],
): AcademicCourse[] {
  return courses.filter((c) => c.userId === userId);
}

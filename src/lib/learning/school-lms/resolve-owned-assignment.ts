/**
 * 2P-49 — Ownership-safe assignment school context (display / continuity only).
 * Never creates LearningAttempt or ConceptMastery.
 */

import { MaterialType } from "@/generated/prisma";
import { db } from "@/lib/db";

import type { SchoolContext } from "./school-context";
import { emptySchoolContext } from "./school-context";

export type OwnedAssignmentContext = {
  assignmentId: string;
  title: string;
  courseId: string;
  courseTitle: string | null;
  dueDate: string | null;
  status: string;
  kind: string | null;
  /** Soft school context — never mastery. */
  schoolContext: SchoolContext;
};

/**
 * Resolve owned assignment by session userId.
 * Returns null for missing / foreign (no title leak).
 */
export async function resolveOwnedAssignmentContext(input: {
  userId: string;
  assignmentId: string;
}): Promise<OwnedAssignmentContext | null> {
  const assignmentId = input.assignmentId.trim();
  if (!assignmentId) return null;

  const row = await db.assignment.findFirst({
    where: { id: assignmentId, course: { userId: input.userId } },
    select: {
      id: true,
      title: true,
      dueDate: true,
      status: true,
      kind: true,
      courseId: true,
      course: {
        select: {
          id: true,
          title: true,
          code: true,
          semester: true,
          materials: {
            where: { type: MaterialType.SYLLABUS },
            take: 1,
            select: { id: true },
          },
        },
      },
    },
  });
  if (!row) return null;

  const source: SchoolContext["source"] =
    row.course.materials.length > 0 ? "manual" : "unknown";

  return {
    assignmentId: row.id,
    title: row.title,
    courseId: row.courseId,
    courseTitle: row.course.title,
    dueDate: row.dueDate?.toISOString() ?? null,
    status: String(row.status),
    kind: row.kind ? String(row.kind) : null,
    schoolContext: {
      ...emptySchoolContext(),
      courseId: row.courseId,
      assignmentId: row.id,
      source,
      term: row.course.semester ?? null,
    },
  };
}

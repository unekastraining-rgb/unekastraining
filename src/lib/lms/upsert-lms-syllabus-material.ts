/**
 * Shared LMS → CourseMaterial (SYLLABUS) upsert used by Canvas/Moodle/BB/GC.
 * Idempotent: one SYLLABUS material per course (find by courseId + type).
 */

import { MaterialType } from "@/generated/prisma";
import { db } from "@/lib/db";

export type UpsertLmsSyllabusResult = "created" | "updated";

export async function upsertLmsSyllabusMaterial(input: {
  courseId: string;
  title: string;
  extractedText: string;
  url?: string | null;
}): Promise<UpsertLmsSyllabusResult> {
  const existing = await db.courseMaterial.findFirst({
    where: { courseId: input.courseId, type: MaterialType.SYLLABUS },
    select: { id: true },
  });

  if (existing) {
    await db.courseMaterial.update({
      where: { id: existing.id },
      data: {
        title: input.title,
        ...(input.url !== undefined ? { url: input.url } : {}),
        extractedText: input.extractedText,
      },
    });
    return "updated";
  }

  await db.courseMaterial.create({
    data: {
      courseId: input.courseId,
      title: input.title,
      type: MaterialType.SYLLABUS,
      url: input.url ?? null,
      extractedText: input.extractedText,
      sortOrder: 0,
    },
  });
  return "created";
}

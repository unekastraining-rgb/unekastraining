/**
 * 2P-34 — Notes API ownership helpers (course / material / topic).
 * Prevents linking a note to another learner's academic resources.
 */

import { db } from "@/lib/db";

export type NoteLinkIds = {
  courseId?: string | null;
  materialId?: string | null;
  topicId?: string | null;
};

export type ResolvedNoteLinks = {
  courseId: string | null;
  materialId: string | null;
  topicId: string | null;
};

/**
 * Resolve optional note FKs to owned IDs only.
 * Unknown / foreign IDs → null (never link across users).
 * Throws only on DB failure — callers should treat null as "omit link".
 */
export async function resolveOwnedNoteLinks(
  userId: string,
  input: NoteLinkIds,
): Promise<ResolvedNoteLinks> {
  let courseId: string | null = null;
  let materialId: string | null = null;
  let topicId: string | null = null;

  const rawCourse =
    typeof input.courseId === "string" ? input.courseId.trim() : "";
  const rawMaterial =
    typeof input.materialId === "string" ? input.materialId.trim() : "";
  const rawTopic =
    typeof input.topicId === "string" ? input.topicId.trim() : "";

  if (rawCourse) {
    const course = await db.course.findFirst({
      where: { id: rawCourse, userId },
      select: { id: true },
    });
    courseId = course?.id ?? null;
  }

  if (rawMaterial) {
    const material = await db.courseMaterial.findFirst({
      where: { id: rawMaterial, course: { userId } },
      select: { id: true, courseId: true },
    });
    if (material) {
      materialId = material.id;
      // If course not set, inherit material's course when owned.
      if (!courseId) courseId = material.courseId;
      else if (courseId !== material.courseId) {
        // Material not in the requested course — drop material link.
        materialId = null;
      }
    }
  }

  if (rawTopic) {
    const topic = await db.topic.findFirst({
      where: { id: rawTopic, course: { userId } },
      select: { id: true, courseId: true },
    });
    if (topic) {
      topicId = topic.id;
      if (!courseId) courseId = topic.courseId;
      else if (courseId !== topic.courseId) {
        topicId = null;
      }
    }
  }

  return { courseId, materialId, topicId };
}

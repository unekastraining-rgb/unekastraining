import type { LearningSpaceKind } from "@/generated/prisma";

import { db } from "@/lib/db";

export async function createLearningSpace(input: {
  userId: string;
  kind: LearningSpaceKind;
  title: string;
  description?: string | null;
  subjectDomain?: string | null;
  courseId?: string | null;
  metadataJson?: string;
}) {
  return db.learningSpace.create({
    data: {
      userId: input.userId,
      kind: input.kind,
      title: input.title,
      description: input.description ?? null,
      subjectDomain: input.subjectDomain ?? null,
      courseId: input.courseId ?? null,
      metadataJson: input.metadataJson ?? "{}",
    },
  });
}

/** LearningSpace that does not require a Course (self-directed by default). */
export async function getOrCreateSelfDirectedSpace(
  userId: string,
  title = "Self-directed learning",
) {
  const existing = await db.learningSpace.findFirst({
    where: { userId, kind: "SELF_DIRECTED", courseId: null },
    orderBy: { createdAt: "asc" },
  });
  if (existing) return existing;

  return createLearningSpace({
    userId,
    kind: "SELF_DIRECTED",
    title,
  });
}

/**
 * Additive Course → LearningSpace(kind=COURSE) projection.
 * Does not migrate historical courses eagerly beyond first use.
 */
export async function ensureLearningSpaceForCourse(
  userId: string,
  courseId: string,
) {
  const existing = await db.learningSpace.findUnique({
    where: { courseId },
  });
  if (existing) return existing;

  const course = await db.course.findFirst({
    where: { id: courseId, userId },
  });
  if (!course) {
    throw new Error(`Course not found for LearningSpace projection: ${courseId}`);
  }

  return createLearningSpace({
    userId,
    kind: "COURSE",
    title: course.title,
    description: course.description,
    subjectDomain: course.subject,
    courseId: course.id,
  });
}

import { db } from "@/lib/db";
import { ensureLearningSpaceForCourse, getOrCreateSelfDirectedSpace } from "@/lib/learning/learning-space";

/** Create a Concept that does not require a Course. */
export async function createConcept(input: {
  userId: string;
  title: string;
  description?: string | null;
  subjectDomain?: string | null;
  learningSpaceId?: string | null;
  difficulty?: number | null;
}) {
  return db.concept.create({
    data: {
      userId: input.userId,
      title: input.title,
      description: input.description ?? null,
      subjectDomain: input.subjectDomain ?? null,
      learningSpaceId: input.learningSpaceId ?? null,
      difficulty: input.difficulty ?? null,
      metadataJson: "{}",
    },
  });
}

/**
 * Map Topic → Concept (additive). Topic rows stay intact.
 * Uses course LearningSpace when available; otherwise self-directed.
 */
export async function ensureConceptForTopic(userId: string, topicId: string) {
  const topic = await db.topic.findFirst({
    where: { id: topicId },
    include: { course: true, concept: true },
  });
  if (!topic) {
    throw new Error(`Topic not found: ${topicId}`);
  }

  if (topic.concept) return topic.concept;

  let learningSpaceId: string | null = null;
  if (topic.course && topic.course.userId === userId) {
    const space = await ensureLearningSpaceForCourse(userId, topic.courseId);
    learningSpaceId = space.id;
  } else {
    const space = await getOrCreateSelfDirectedSpace(userId);
    learningSpaceId = space.id;
  }

  const concept = await createConcept({
    userId,
    title: topic.name,
    description: topic.description,
    subjectDomain: topic.course?.subject ?? null,
    learningSpaceId,
  });

  await db.topic.update({
    where: { id: topic.id },
    data: { conceptId: concept.id },
  });

  return concept;
}

/** Concept for a quiz when no Topic is attached (still no Course required). */
export async function ensureConceptForQuizTitle(
  userId: string,
  quizId: string,
  title: string,
  courseId?: string | null,
) {
  let learningSpaceId: string | null = null;
  if (courseId) {
    try {
      learningSpaceId = (await ensureLearningSpaceForCourse(userId, courseId)).id;
    } catch {
      learningSpaceId = (await getOrCreateSelfDirectedSpace(userId)).id;
    }
  } else {
    learningSpaceId = (await getOrCreateSelfDirectedSpace(userId)).id;
  }

  const existing = await db.concept.findFirst({
    where: {
      userId,
      learningSpaceId,
      title,
      metadataJson: { contains: quizId },
    },
  });
  if (existing) return existing;

  return db.concept.create({
    data: {
      userId,
      learningSpaceId,
      title,
      metadataJson: JSON.stringify({ sourceQuizId: quizId }),
    },
  });
}

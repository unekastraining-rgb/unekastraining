/**
 * Resolve owned Concept for universal activity launch.
 * Preserves known context; uses ensureConceptForTopic only when a real Topic exists.
 * Never invents courseId/conceptId/topic strings.
 */

import { db } from "@/lib/db";
import { ensureConceptForTopic } from "@/lib/learning/knowledge/concept";

export async function resolveActivityLaunchConceptId(input: {
  userId: string;
  conceptId?: string | null;
  courseId?: string | null;
  topic?: string | null;
  materialId?: string | null;
}): Promise<{
  conceptId: string;
  resolvedVia:
    | "explicit_concept"
    | "course_topic"
    | "material_course_topic"
    | "topic_name"
    | "latest_owned"
    | "none";
}> {
  const userId = input.userId;
  const explicit = input.conceptId?.trim() || "";
  if (explicit) {
    const owned = await db.concept.findFirst({
      where: { id: explicit, userId },
      select: { id: true },
    });
    if (owned) {
      return { conceptId: owned.id, resolvedVia: "explicit_concept" };
    }
  }

  const topicName = input.topic?.trim() || "";
  let courseId = input.courseId?.trim() || "";

  if (!courseId && input.materialId?.trim()) {
    const material = await db.courseMaterial.findFirst({
      where: { id: input.materialId.trim(), course: { userId } },
      select: { courseId: true, title: true },
    });
    if (material?.courseId) {
      courseId = material.courseId;
      // Use material title as topic hint only when topic was not provided.
      if (!topicName && material.title?.trim()) {
        const fromMaterial = await resolveFromCourseAndTopic(
          userId,
          courseId,
          material.title.trim(),
        );
        if (fromMaterial) {
          return {
            conceptId: fromMaterial,
            resolvedVia: "material_course_topic",
          };
        }
      }
    }
  }

  if (courseId && topicName) {
    const fromCourseTopic = await resolveFromCourseAndTopic(
      userId,
      courseId,
      topicName,
    );
    if (fromCourseTopic) {
      return { conceptId: fromCourseTopic, resolvedVia: "course_topic" };
    }
  }

  if (topicName) {
    const topic = await db.topic.findFirst({
      where: {
        name: topicName,
        course: { userId },
      },
      orderBy: { updatedAt: "desc" },
      select: { id: true, conceptId: true },
    });
    if (topic?.conceptId) {
      return { conceptId: topic.conceptId, resolvedVia: "topic_name" };
    }
    if (topic) {
      const concept = await ensureConceptForTopic(userId, topic.id);
      return { conceptId: concept.id, resolvedVia: "topic_name" };
    }
  }

  const latest = await db.concept.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });
  if (latest) {
    return { conceptId: latest.id, resolvedVia: "latest_owned" };
  }

  return { conceptId: "", resolvedVia: "none" };
}

async function resolveFromCourseAndTopic(
  userId: string,
  courseId: string,
  topicName: string,
): Promise<string | null> {
  const course = await db.course.findFirst({
    where: { id: courseId, userId },
    select: { id: true },
  });
  if (!course) return null;

  const topic = await db.topic.findFirst({
    where: { courseId, name: topicName },
    select: { id: true, conceptId: true },
  });
  if (!topic) return null;
  if (topic.conceptId) return topic.conceptId;

  const concept = await ensureConceptForTopic(userId, topic.id);
  return concept.id;
}

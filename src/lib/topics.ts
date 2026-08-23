import { db } from "@/lib/db";
import { updateTopicMastery } from "@/lib/quizzes/mastery";

export async function getOrCreateDefaultTopic(courseId: string) {
  const existing = await db.topic.findFirst({
    where: { courseId },
    orderBy: { sortOrder: "asc" },
  });

  if (existing) {
    return existing;
  }

  return db.topic.create({
    data: {
      courseId,
      name: "General",
      description: "Default topic for generated study materials.",
      sortOrder: 0,
    },
  });
}

export async function updateTopicMasteryFromReview(
  userId: string,
  topicId: string,
  rating: "AGAIN" | "GOOD" | "EASY",
) {
  const scoreRatio = rating === "EASY" ? 0.9 : rating === "GOOD" ? 0.75 : 0.35;
  return updateTopicMastery(userId, topicId, scoreRatio, "recall");
}

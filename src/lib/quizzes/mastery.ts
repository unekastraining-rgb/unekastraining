import { db } from "@/lib/db";

export type MasteryDimension = "understanding" | "recall" | "application";

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

export async function updateTopicMastery(
  userId: string,
  topicId: string | null | undefined,
  scoreRatio: number,
  dimension: MasteryDimension = "recall",
) {
  if (!topicId) return;

  const delta = scoreRatio >= 0.8 ? 0.1 : scoreRatio >= 0.5 ? 0.03 : -0.06;
  const dimDelta = delta;

  const existing = await db.topicMastery.findUnique({
    where: { userId_topicId: { userId, topicId } },
  });

  const understanding = clamp01(
    (existing?.understanding ?? 0) + (dimension === "understanding" ? dimDelta : dimDelta / 3),
  );
  const recall = clamp01(
    (existing?.recall ?? 0) + (dimension === "recall" ? dimDelta : dimDelta / 3),
  );
  const application = clamp01(
    (existing?.application ?? 0) + (dimension === "application" ? dimDelta : dimDelta / 3),
  );
  const proficiency = clamp01((understanding + recall + application) / 3);
  const confidence = clamp01((existing?.confidence ?? 0) + delta / 2);

  const reviewIntervalHours = scoreRatio >= 0.8 ? 72 : scoreRatio >= 0.5 ? 24 : 12;

  return db.topicMastery.upsert({
    where: { userId_topicId: { userId, topicId } },
    update: {
      proficiency,
      confidence,
      understanding,
      recall,
      application,
      reviewCount: { increment: 1 },
      lastReviewedAt: new Date(),
      nextReviewAt: new Date(Date.now() + reviewIntervalHours * 60 * 60 * 1000),
    },
    create: {
      userId,
      topicId,
      proficiency,
      confidence,
      understanding,
      recall,
      application,
      reviewCount: 1,
      lastReviewedAt: new Date(),
      nextReviewAt: new Date(Date.now() + reviewIntervalHours * 60 * 60 * 1000),
    },
  });
}

/** @deprecated use updateTopicMastery */
export async function updateMasteryFromQuiz(
  userId: string,
  topicId: string | null | undefined,
  scoreRatio: number,
) {
  return updateTopicMastery(userId, topicId, scoreRatio, "recall");
}

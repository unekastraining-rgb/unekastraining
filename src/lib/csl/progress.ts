export interface ProgressSnapshot {
  overallMastery: number;
  understanding: number;
  recall: number;
  application: number;
  topicsTracked: number;
  reviewsThisWeek: number;
  quizAttempts: number;
}

export function buildProgressSnapshot(
  masteries: Array<{
    proficiency: number;
    understanding: number;
    recall: number;
    application: number;
    reviewCount: number;
    lastReviewedAt: Date | null;
  }>,
  quizAttempts: number,
): ProgressSnapshot {
  if (masteries.length === 0) {
    return {
      overallMastery: 0,
      understanding: 0,
      recall: 0,
      application: 0,
      topicsTracked: 0,
      reviewsThisWeek: 0,
      quizAttempts,
    };
  }

  const avg = (key: "proficiency" | "understanding" | "recall" | "application") =>
    Math.round(
      (masteries.reduce((sum, item) => sum + item[key], 0) / masteries.length) * 100,
    );

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const reviewsThisWeek = masteries.filter(
    (item) => item.lastReviewedAt && item.lastReviewedAt.getTime() >= weekAgo,
  ).length;

  return {
    overallMastery: avg("proficiency"),
    understanding: avg("understanding"),
    recall: avg("recall"),
    application: avg("application"),
    topicsTracked: masteries.length,
    reviewsThisWeek,
    quizAttempts,
  };
}

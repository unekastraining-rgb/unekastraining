import type { AssignmentStatus } from "@/generated/prisma";

export type ReviewRating = "AGAIN" | "GOOD" | "EASY";

export function computePriority(dueDate: Date | null): "LOW" | "MEDIUM" | "HIGH" {
  if (!dueDate) {
    return "LOW";
  }

  const daysUntilDue = Math.ceil(
    (dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );

  if (daysUntilDue <= 2) {
    return "HIGH";
  }

  if (daysUntilDue <= 7) {
    return "MEDIUM";
  }

  return "LOW";
}

export function isAssignmentCompleted(status: AssignmentStatus): boolean {
  return status === "SUBMITTED" || status === "GRADED";
}

export function ratingToQuality(rating: ReviewRating): number {
  switch (rating) {
    case "AGAIN":
      return 1;
    case "GOOD":
      return 3;
    case "EASY":
      return 5;
  }
}

export function applySm2Review(
  card: {
    difficulty: number;
    interval: number;
    repetitions: number;
  },
  rating: ReviewRating,
) {
  const quality = ratingToQuality(rating);
  let { difficulty, interval, repetitions } = card;

  if (quality < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * difficulty);
    }

    repetitions += 1;
    difficulty = Math.min(
      3.0,
      difficulty + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)),
    );
  }

  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + interval);

  return {
    difficulty,
    interval,
    repetitions,
    nextReviewAt,
  };
}

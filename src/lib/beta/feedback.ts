/**
 * Controlled-beta feedback — product friction capture only.
 * Never LearningAttempt / ConceptMastery / Learner Model writes.
 */

import { db } from "@/lib/db";
import { logOpsEvent } from "@/lib/ops/safe-log";

export const BETA_FEEDBACK_CATEGORIES = [
  "CONFUSING",
  "BROKEN",
  "TOO_EASY",
  "TOO_HARD",
  "NOT_RELEVANT",
  "GREAT",
  "OTHER",
] as const;

export type BetaFeedbackCategoryName = (typeof BETA_FEEDBACK_CATEGORIES)[number];

export function isBetaFeedbackCategory(
  value: unknown,
): value is BetaFeedbackCategoryName {
  return (
    typeof value === "string" &&
    (BETA_FEEDBACK_CATEGORIES as readonly string[]).includes(value)
  );
}

const MAX_COMMENT = 800;
const MAX_SURFACE = 64;
const MAX_ACTIVITY_REF = 120;

export type CreateBetaFeedbackInput = {
  userId: string;
  category: BetaFeedbackCategoryName;
  comment: string;
  surface?: string | null;
  activityRef?: string | null;
};

export function betaFeedbackTruthSummary() {
  return {
    isNotLearningAttempt: true,
    doesNotUpdateConceptMastery: true,
    doesNotModifyLearnerModel: true,
    sessionOwned: true,
    commentLengthCapped: true,
  } as const;
}

export async function createBetaFeedback(input: CreateBetaFeedbackInput) {
  const comment = input.comment.trim().slice(0, MAX_COMMENT);
  if (!comment) {
    throw new Error("empty_comment");
  }
  if (!isBetaFeedbackCategory(input.category)) {
    throw new Error("invalid_category");
  }

  const surface = input.surface?.trim().slice(0, MAX_SURFACE) || null;
  const activityRef =
    input.activityRef?.trim().slice(0, MAX_ACTIVITY_REF) || null;

  const row = await db.betaFeedback.create({
    data: {
      userId: input.userId,
      category: input.category,
      comment,
      surface,
      activityRef,
    },
    select: { id: true, category: true, createdAt: true },
  });

  logOpsEvent("beta.feedback.created", {
    category: row.category,
    hasSurface: Boolean(surface),
    hasActivityRef: Boolean(activityRef),
  });

  return row;
}

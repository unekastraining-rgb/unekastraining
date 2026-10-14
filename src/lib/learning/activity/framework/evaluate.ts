/**
 * Phase 17 — Map activity evaluations → existing Phase 4A evidence types.
 * Does not invent new evidence types when an existing one fits.
 */

import { getActivityRegistryEntry } from "@/lib/learning/activity/framework/registry";
import type {
  LearningActivityEvaluation,
  LearningActivityEvaluationOutcome,
  LearningActivityType,
} from "@/lib/learning/activity/framework/types";
import type { LearningEvidenceType } from "@/lib/learning/learner-state/types";

export function evidenceTypeForActivity(
  type: LearningActivityType,
): LearningEvidenceType {
  return (
    getActivityRegistryEntry(type)?.defaultEvidenceType ?? "practice_attempt"
  );
}

export function mapUniversalOutcomeToLearningOutcome(
  outcome: string,
): LearningActivityEvaluationOutcome {
  const o = outcome.toUpperCase();
  if (o === "SUCCESS" || o === "CORRECT" || o === "PASS") return "correct";
  if (o === "FAIL" || o === "INCORRECT") return "incorrect";
  if (o === "PARTIAL") return "partial";
  if (o === "COMPLETED") return "completed";
  return "attempted";
}

/**
 * Build a LearningActivityEvaluation from a specialized activity result.
 */
export function buildActivityEvaluation(input: {
  activityId: string;
  userId: string;
  activityType: LearningActivityType;
  conceptIds: string[];
  outcome: LearningActivityEvaluationOutcome | string;
  feedback?: unknown;
  metadata?: Record<string, unknown>;
  source?: string;
  evidenceTypeOverride?: LearningEvidenceType;
}): LearningActivityEvaluation {
  const outcome =
    typeof input.outcome === "string" &&
    !["correct", "incorrect", "partial", "completed", "attempted"].includes(
      input.outcome,
    )
      ? mapUniversalOutcomeToLearningOutcome(input.outcome)
      : (input.outcome as LearningActivityEvaluationOutcome);

  return {
    activityId: input.activityId,
    userId: input.userId,
    outcome,
    evidenceType:
      input.evidenceTypeOverride ?? evidenceTypeForActivity(input.activityType),
    conceptIds: input.conceptIds.filter(Boolean),
    feedback: input.feedback,
    metadata: input.metadata,
    source: input.source ?? `activity:${input.activityType}`,
  };
}

/**
 * Phase 17 — Record LearningActivityEvaluation into Phase 4A Learner State.
 * Bridges application activities → Knowledge Loop evidence (not a second engine).
 */

import { isRegisteredKnowledgeConceptId } from "@/lib/learning/learner-state/concept-identity";
import { recordLearningEvidence } from "@/lib/learning/learner-state/service";
import type { RecordLearningEvidenceResult } from "@/lib/learning/learner-state/types";
import type { LearningActivityEvaluation } from "@/lib/learning/activity/framework/types";

function mapOutcome(
  outcome: LearningActivityEvaluation["outcome"],
): "correct" | "incorrect" | "completed" | "attempted" {
  if (outcome === "partial") return "attempted";
  return outcome;
}

/**
 * Write evaluation as existing LearningEvidence rows (one per concept).
 * Skips unknown concept IDs. Never fabricates KL ids.
 */
export async function recordActivityEvaluationEvidence(
  evaluation: LearningActivityEvaluation,
): Promise<RecordLearningEvidenceResult[]> {
  if (!evaluation.userId?.trim()) return [];

  const results: RecordLearningEvidenceResult[] = [];
  const conceptIds =
    evaluation.conceptIds.length > 0 ? evaluation.conceptIds : [undefined];

  for (const conceptId of conceptIds) {
    if (conceptId && !isRegisteredKnowledgeConceptId(conceptId)) {
      results.push({
        recorded: false,
        reason: "unknown_concept_id",
      });
      continue;
    }

    const result = await recordLearningEvidence({
      userId: evaluation.userId,
      type: evaluation.evidenceType,
      conceptId,
      outcome: mapOutcome(evaluation.outcome),
      source: evaluation.source ?? `activity:${evaluation.activityId}`,
      eventKey: `${evaluation.activityId}:${conceptId ?? "none"}:${evaluation.outcome}`,
      metadata: {
        activityId: evaluation.activityId,
        ...(evaluation.metadata ?? {}),
      },
    });
    results.push(result);
  }

  return results;
}

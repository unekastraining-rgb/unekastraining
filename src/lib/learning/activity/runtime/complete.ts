/**
 * Bundle I — Activity completion → LAF evidence → Orchestrator next action.
 * UI must not invent next-concept decisions; it asks the Orchestrator.
 */

import {
  buildActivityEvaluation,
  recordActivityEvaluationEvidence,
} from "@/lib/learning/activity/framework";
import type { LearningActivityType } from "@/lib/learning/activity/framework/types";
import {
  decideKnowledgeLoop,
  type KnowledgeOrchestratorDecision,
} from "@/lib/learning/orchestrator/knowledge-loop";
import {
  getLearnerConceptState,
  listEvidence,
} from "@/lib/learning/learner-state";
import { resolveTeachingKnowledgeContext } from "@/lib/learning/knowledge/teaching-knowledge-context";
import type {
  InteractiveActivity,
  InteractiveFeedback,
  InteractiveSubmission,
} from "@/lib/learning/activity/runtime/types";
import { evaluateInteractiveSubmission } from "@/lib/learning/activity/runtime/feedback";

export type ActivityCompletionResult = {
  feedback: InteractiveFeedback;
  evidenceRecorded: boolean;
  evaluationId: string;
  orchestrator?: KnowledgeOrchestratorDecision | null;
  nextConceptId?: string | null;
};

/**
 * Evaluate submission, record LAF evidence, optionally ask Orchestrator for next action.
 */
export async function completeInteractiveActivity(input: {
  activity: InteractiveActivity;
  submission: InteractiveSubmission;
  userId: string;
  target?: string;
  askOrchestrator?: boolean;
  revealAnswer?: boolean;
}): Promise<ActivityCompletionResult> {
  const feedback = evaluateInteractiveSubmission(
    input.activity,
    input.submission,
    { revealAnswer: input.revealAnswer },
  );

  const evaluation = buildActivityEvaluation({
    activityId: input.activity.id,
    userId: input.userId,
    activityType: input.activity.activityType as LearningActivityType,
    conceptIds: [input.activity.conceptId],
    outcome: feedback.outcome,
    feedback: {
      summary: feedback.summary,
      related: feedback.relatedConceptTitles,
      misconception: feedback.misconceptionNote,
    },
    metadata: {
      form: input.activity.form,
      scored: feedback.scored,
    },
    source: `bundle-i:${input.activity.form}`,
  });

  const recorded = await recordActivityEvaluationEvidence(evaluation);
  const evidenceRecorded = recorded.some((r) => r.recorded);

  let orchestrator: KnowledgeOrchestratorDecision | null = null;
  let nextConceptId: string | null = null;

  if (input.askOrchestrator !== false && input.userId) {
    const knowledge =
      resolveTeachingKnowledgeContext(
        input.target ?? input.activity.conceptTitle,
      ) ??
      resolveTeachingKnowledgeContext(input.activity.conceptId);
    if (knowledge) {
      const statesByConceptId = new Map();
      for (const c of knowledge.concepts) {
        statesByConceptId.set(
          c.id,
          await getLearnerConceptState(input.userId, c.id),
        );
      }
      const evidence = await listEvidence(input.userId);
      orchestrator = decideKnowledgeLoop({
        target: input.target ?? input.activity.conceptTitle,
        knowledge,
        statesByConceptId,
        evidence,
      });
      nextConceptId = orchestrator.nextConceptId ?? null;
    }
  }

  return {
    feedback,
    evidenceRecorded,
    evaluationId: evaluation.activityId,
    orchestrator,
    nextConceptId,
  };
}

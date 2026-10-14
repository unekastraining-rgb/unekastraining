/**
 * Bundle J/L — Authenticated LAF completion wrapper for InteractiveActivity.
 *
 * Evidence authority (Bundle L Option B):
 * - Client Learning Studio uses `/api/study/evaluate` as the sole evidence writer.
 * - This helper is for authenticated server/trusted callers with a real userId.
 * - Calling without userId evaluates feedback only and never claims evidence.
 */

import {
  completeInteractiveActivity,
  type ActivityCompletionResult,
} from "@/lib/learning/activity/runtime/complete";
import type {
  InteractiveActivity,
  InteractiveSubmission,
} from "@/lib/learning/activity/runtime/types";

/**
 * Complete an interactive activity when an authenticated userId is known.
 * Without userId: local feedback only (`evidenceRecorded: false`) — never a silent no-op claim.
 */
export async function completeInteractiveActivityForStudio(input: {
  activity: InteractiveActivity;
  submission: InteractiveSubmission;
  userId?: string | null;
  target?: string;
}): Promise<ActivityCompletionResult> {
  const userId = input.userId?.trim();
  if (!userId) {
    const { evaluateInteractiveSubmission } = await import(
      "@/lib/learning/activity/runtime/feedback"
    );
    const feedback = evaluateInteractiveSubmission(
      input.activity,
      input.submission,
    );
    return {
      feedback,
      evidenceRecorded: false,
      evaluationId: input.activity.id,
      orchestrator: null,
      nextConceptId: null,
    };
  }

  return completeInteractiveActivity({
    activity: input.activity,
    submission: input.submission,
    userId,
    target: input.target ?? input.activity.conceptTitle,
    askOrchestrator: true,
  });
}

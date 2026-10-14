/**
 * Soft-fail Adaptive bind after activity LearningAttempt exists (2G-73).
 * When the current Adaptive step is a universal activity, enforces the
 * Adaptive-ready completion contract. Does not invent LearningAttempts.
 * Does not advance SIX/Quiz/Flashcard steps with activity evidence.
 */

import {
  parseAdaptiveRunId,
  parseAdaptiveStepIndex,
} from "@/lib/learning/sequence/adaptive-launch-context";
import { AdaptiveSequenceCoordinatorError } from "@/lib/learning/sequence/coordinator-errors";
import {
  ActivityAdapterError,
  bindUniversalActivityAttemptToAdaptiveSequence,
  isSupportedUniversalActivityIntervention,
} from "@/lib/learning/sequence/activity-adapter";
import { getCurrentAdaptiveSequenceStep } from "@/lib/learning/sequence/coordinator";
import type { PlanNextAdaptiveStepResult } from "@/lib/learning/sequence/coordinator";

export type UniversalActivityAdaptiveBindResult =
  | {
      kind: "bound";
      runId: string;
      plan: PlanNextAdaptiveStepResult;
    }
  | { kind: "skipped"; reason: string }
  | { kind: "error"; runId: string; code: string; message: string };

export async function bindUniversalActivityToAdaptive(input: {
  learnerId: string;
  learningAttemptId: string;
  clientBody: Record<string, unknown>;
}): Promise<UniversalActivityAdaptiveBindResult> {
  const runId = parseAdaptiveRunId(
    typeof input.clientBody.adaptiveRunId === "string"
      ? input.clientBody.adaptiveRunId
      : typeof input.clientBody.runId === "string"
        ? input.clientBody.runId
        : null,
  );
  if (!runId) {
    return { kind: "skipped", reason: "no_adaptive_run" };
  }

  const stepIndex = parseAdaptiveStepIndex(
    input.clientBody.adaptiveStepIndex ?? input.clientBody.stepIndex,
  );

  try {
    const current = await getCurrentAdaptiveSequenceStep(
      input.learnerId,
      runId,
    );
    if (
      current.kind === "active" &&
      isSupportedUniversalActivityIntervention(current.step.intervention)
    ) {
      const bound = await bindUniversalActivityAttemptToAdaptiveSequence({
        userId: input.learnerId,
        runId,
        attemptId: input.learningAttemptId,
        ...(stepIndex != null ? { stepIndex } : {}),
      });
      if (bound.kind === "skipped") {
        return { kind: "skipped", reason: bound.reason };
      }
      return { kind: "bound", runId, plan: bound.plan };
    }

    if (current.kind === "active") {
      return { kind: "skipped", reason: "step_not_universal_activity" };
    }

    return { kind: "skipped", reason: "no_active_step" };
  } catch (err) {
    if (err instanceof ActivityAdapterError) {
      return {
        kind: "error",
        runId,
        code: err.code,
        message: err.message,
      };
    }
    if (err instanceof AdaptiveSequenceCoordinatorError) {
      return {
        kind: "error",
        runId,
        code: err.code,
        message: err.message,
      };
    }
    return {
      kind: "error",
      runId,
      code: "bind_failed",
      message: err instanceof Error ? err.message : "bind_failed",
    };
  }
}

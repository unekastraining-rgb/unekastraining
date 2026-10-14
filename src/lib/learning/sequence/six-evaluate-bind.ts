import { isSixAdaptiveCompletionEligible } from "@/lib/csl/six-completion";
import {
  parseAdaptiveRunId,
  parseAdaptiveStepIndex,
} from "@/lib/learning/sequence/adaptive-launch-context";
import {
  AdaptiveSequenceCoordinatorError,
} from "@/lib/learning/sequence/coordinator-errors";
import {
  recordSixAdaptiveSequenceCompletionAndPlanNext,
  SixAdapterError,
} from "@/lib/learning/sequence/six-adapter";
import type { PlanNextAdaptiveStepResult } from "@/lib/learning/sequence/coordinator";

export type AdaptiveEvaluateBindResult =
  | {
      kind: "bound";
      runId: string;
      plan: PlanNextAdaptiveStepResult;
    }
  | {
      kind: "skipped";
      reason: string;
    }
  | {
      kind: "error";
      runId: string;
      code: string;
      message: string;
    };

/**
 * When adaptive context + authoritative attemptId are present AND the SIX
 * activity completion gate passes, complete + plan next.
 * Does not create Attempts, mastery, or retention.
 * Intermediate evaluates skip bind (Attempt preserved; Adaptive step stays ACTIVE).
 */
export async function bindSixEvaluateAttemptToAdaptiveSequence(input: {
  userId: string;
  adaptiveRunId: unknown;
  adaptiveStep: unknown;
  attemptId: string | null | undefined;
  /** SIX technique component from the evaluate body — required for the gate. */
  sixComponent: unknown;
  /** Coach stage index for this evaluate (0-based). */
  stepIndex: unknown;
  /** Server-computed evaluation score 0–100 (not a client completion flag). */
  evaluationScore: unknown;
  /** Optional live practiceSteps.length (validated 2–4). */
  sixStageCount?: unknown;
}): Promise<AdaptiveEvaluateBindResult> {
  const runId = parseAdaptiveRunId(input.adaptiveRunId);
  if (!runId) {
    return { kind: "skipped", reason: "no_adaptive_context" };
  }

  const stepIndex = parseAdaptiveStepIndex(input.adaptiveStep);
  if (stepIndex == null) {
    return {
      kind: "error",
      runId,
      code: "INVALID_ADAPTIVE_STEP",
      message: "Adaptive step context is missing or invalid.",
    };
  }

  const gate = isSixAdaptiveCompletionEligible({
    component: input.sixComponent,
    stepIndex: input.stepIndex,
    evaluationScore: input.evaluationScore,
    clientStageCount: input.sixStageCount,
  });

  if (!gate.eligible) {
    return {
      kind: "skipped",
      reason: gate.reason,
    };
  }

  if (!input.attemptId) {
    return {
      kind: "error",
      runId,
      code: "EVIDENCE_UNAVAILABLE",
      message:
        "Study evaluation finished, but no learning evidence was recorded for this adaptive step.",
    };
  }

  try {
    const plan = await recordSixAdaptiveSequenceCompletionAndPlanNext({
      userId: input.userId,
      runId,
      attemptId: input.attemptId,
      stepIndex,
    });
    return { kind: "bound", runId, plan };
  } catch (error) {
    if (error instanceof SixAdapterError) {
      return {
        kind: "error",
        runId,
        code: error.code,
        message: error.message,
      };
    }
    if (error instanceof AdaptiveSequenceCoordinatorError) {
      return {
        kind: "error",
        runId,
        code: error.code,
        message: error.message,
      };
    }
    return {
      kind: "error",
      runId,
      code: "ADAPTIVE_BIND_FAILED",
      message:
        error instanceof Error
          ? error.message
          : "Could not update adaptive study from this activity.",
    };
  }
}

/** Thin JSON-safe adaptive payload for evaluate responses. */
export function adaptiveEvaluateResponsePayload(
  result: AdaptiveEvaluateBindResult,
):
  | {
      runId: string;
      outcome: string;
      reason?: string;
      code?: string;
    }
  | undefined {
  if (result.kind === "skipped") return undefined;
  if (result.kind === "error") {
    return {
      runId: result.runId,
      outcome: "error",
      code: result.code,
      reason: result.message,
    };
  }

  return {
    runId: result.runId,
    outcome: result.plan.kind,
    reason:
      "reason" in result.plan && typeof result.plan.reason === "string"
        ? result.plan.reason
        : undefined,
  };
}

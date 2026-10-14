/**
 * Phase 2G-54 — Bind an existing flashcard LearningAttempt to Adaptive Sequence
 * completion after a genuine self-rating. Soft-fail friendly for the review route.
 *
 * Completion is score-agnostic: AGAIN / GOOD / EASY all create LearningAttempts
 * and all may complete the Adaptive step (existing outcomes preserved).
 */
import {
  parseAdaptiveRunId,
  parseAdaptiveStepIndex,
} from "@/lib/learning/sequence/adaptive-launch-context";
import {
  AdaptiveSequenceCoordinatorError,
} from "@/lib/learning/sequence/coordinator-errors";
import {
  getAdaptiveSequenceRun,
} from "@/lib/learning/sequence/service";
import {
  FlashcardAdapterError,
  isSupportedFlashcardIntervention,
  recordFlashcardAdaptiveSequenceCompletionAndPlanNext,
} from "@/lib/learning/sequence/flashcard-adapter";
import type { PlanNextAdaptiveStepResult } from "@/lib/learning/sequence/coordinator";

export type AdaptiveFlashcardBindResult =
  | {
      kind: "bound";
      runId: string;
      plan: PlanNextAdaptiveStepResult;
      completionAttemptId: string;
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
 * Flashcard activity completion gate: a real rating produced canonical evidence.
 * Score / rating value does not gate Adaptive completion (AGAIN still COMPLETE).
 */
export function isFlashcardAdaptiveCompletionEligible(input: {
  recorded: boolean;
  attemptId: string | null | undefined;
}): { eligible: boolean; reason: string } {
  if (!input.recorded) {
    return { eligible: false, reason: "evidence_unavailable" };
  }
  if (!input.attemptId || typeof input.attemptId !== "string") {
    return { eligible: false, reason: "evidence_unavailable" };
  }
  if (!input.attemptId.trim()) {
    return { eligible: false, reason: "evidence_unavailable" };
  }
  return { eligible: true, reason: "flashcard_rated" };
}

/**
 * After flashcard rating + evidence: bind the just-created Attempt when Adaptive
 * context is present and the current step is a flashcard intervention.
 * Does not accept client-declared completion flags or client-picked Attempt ids
 * beyond the Attempt returned by the evidence writer for this rating.
 */
export async function bindFlashcardReviewToAdaptiveSequence(input: {
  userId: string;
  flashcardId: string;
  adaptiveRunId: unknown;
  adaptiveStep: unknown;
  recorded: boolean;
  attemptId: string | null | undefined;
}): Promise<AdaptiveFlashcardBindResult> {
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

  const gate = isFlashcardAdaptiveCompletionEligible({
    recorded: input.recorded,
    attemptId: input.attemptId,
  });
  if (!gate.eligible) {
    return { kind: "skipped", reason: gate.reason };
  }

  const completionAttemptId = String(input.attemptId).trim();

  const run = await getAdaptiveSequenceRun(input.userId, runId);
  if (!run) {
    return {
      kind: "error",
      runId,
      code: "RUN_NOT_FOUND",
      message: "Adaptive sequence run not found or not owned.",
    };
  }

  const currentStep = run.steps[run.currentStepIndex];
  if (
    !currentStep ||
    !isSupportedFlashcardIntervention(currentStep.intervention)
  ) {
    return {
      kind: "error",
      runId,
      code: "NOT_FLASHCARD_STEP",
      message: "Current Adaptive step is not a flashcard activity.",
    };
  }

  try {
    const plan = await recordFlashcardAdaptiveSequenceCompletionAndPlanNext({
      userId: input.userId,
      runId,
      attemptId: completionAttemptId,
      stepIndex,
      expectedFlashcardId: input.flashcardId,
    });
    return {
      kind: "bound",
      runId,
      plan,
      completionAttemptId,
    };
  } catch (error) {
    if (error instanceof FlashcardAdapterError) {
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
          : "Could not update adaptive study from this flashcard.",
    };
  }
}

export function adaptiveFlashcardResponsePayload(
  result: AdaptiveFlashcardBindResult,
):
  | {
      runId: string;
      outcome: string;
      reason?: string;
      code?: string;
      completionAttemptId?: string;
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
    completionAttemptId: result.completionAttemptId,
    reason:
      "reason" in result.plan && typeof result.plan.reason === "string"
        ? result.plan.reason
        : undefined,
  };
}

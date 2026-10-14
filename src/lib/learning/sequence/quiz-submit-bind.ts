/**
 * Phase 2G-14 — Bind an existing quiz LearningAttempt to Adaptive Sequence
 * completion after whole-quiz submit. Soft-fail friendly for the submit route.
 */
import { selectAuthoritativeQuizCompletionAttemptId } from "@/lib/learning/assessment/quiz-bridge";
import type { QuizEvidenceAttemptRow } from "@/lib/learning/assessment/quiz-bridge";
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
  QuizAdapterError,
  isSupportedQuizIntervention,
  recordQuizAdaptiveSequenceCompletionAndPlanNext,
} from "@/lib/learning/sequence/quiz-adapter";
import type { PlanNextAdaptiveStepResult } from "@/lib/learning/sequence/coordinator";

export type AdaptiveQuizBindResult =
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
 * Quiz activity completion gate: successful whole-quiz submit with evidence rows.
 * Score does not gate completion (low score still COMPLETE).
 */
export function isQuizAdaptiveCompletionEligible(input: {
  questionCount: number;
  gradedCount: number;
  evidenceAttempts: QuizEvidenceAttemptRow[];
}): { eligible: boolean; reason: string } {
  if (input.questionCount <= 0) {
    return { eligible: false, reason: "empty_quiz" };
  }
  if (input.gradedCount !== input.questionCount) {
    return { eligible: false, reason: "incomplete_grading" };
  }
  if (input.evidenceAttempts.length === 0) {
    return { eligible: false, reason: "evidence_unavailable" };
  }
  return { eligible: true, reason: "quiz_submitted" };
}

/**
 * After quiz submit + evidence: bind authoritative existing Attempt when
 * Adaptive context is present and the current step is a quiz intervention.
 */
export async function bindQuizSubmitToAdaptiveSequence(input: {
  userId: string;
  quizId: string;
  adaptiveRunId: unknown;
  adaptiveStep: unknown;
  questionCount: number;
  gradedCount: number;
  evidenceAttempts: QuizEvidenceAttemptRow[];
}): Promise<AdaptiveQuizBindResult> {
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

  const gate = isQuizAdaptiveCompletionEligible({
    questionCount: input.questionCount,
    gradedCount: input.gradedCount,
    evidenceAttempts: input.evidenceAttempts,
  });
  if (!gate.eligible) {
    return { kind: "skipped", reason: gate.reason };
  }

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
    !isSupportedQuizIntervention(currentStep.intervention)
  ) {
    return {
      kind: "error",
      runId,
      code: "NOT_QUIZ_STEP",
      message: "Current Adaptive step is not a quiz activity.",
    };
  }

  const completionAttemptId = selectAuthoritativeQuizCompletionAttemptId({
    attempts: input.evidenceAttempts,
    runConceptId: run.conceptId,
  });
  if (!completionAttemptId) {
    return {
      kind: "error",
      runId,
      code: "ATTEMPT_CONCEPT_MISMATCH",
      message:
        "No quiz question Attempt matches this Adaptive Sequence concept.",
    };
  }

  try {
    const plan = await recordQuizAdaptiveSequenceCompletionAndPlanNext({
      userId: input.userId,
      runId,
      attemptId: completionAttemptId,
      stepIndex,
      expectedQuizId: input.quizId,
    });
    return {
      kind: "bound",
      runId,
      plan,
      completionAttemptId,
    };
  } catch (error) {
    if (error instanceof QuizAdapterError) {
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
          : "Could not update adaptive study from this quiz.",
    };
  }
}

export function adaptiveQuizResponsePayload(
  result: AdaptiveQuizBindResult,
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

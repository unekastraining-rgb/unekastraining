/**
 * Phase 2G-54 — Flashcard Adaptive Sequence adapter (activity-specific).
 * Resolves intervention "flashcard", validates flashcard_review LearningAttempts,
 * records Adaptive completion via the existing coordinator. Does not create evidence.
 */
import { db } from "@/lib/db";
import {
  findOwnedDueFlashcardForConcept,
  flashcardAssessmentHref,
} from "@/lib/learning/assessment/flashcard-assessment-adapter";
import {
  getCurrentAdaptiveSequenceStep,
  recordAdaptiveSequenceCompletion,
  recordAdaptiveSequenceCompletionAndPlanNext,
  type PlanNextAdaptiveStepResult,
  type RecordCompletionResult,
} from "@/lib/learning/sequence/coordinator";
import type { AdaptiveSequenceStep } from "@/lib/learning/sequence/types";

export type FlashcardAdapterErrorCode =
  | "INVALID_STEP"
  | "UNKNOWN_INTERVENTION"
  | "NO_FLASHCARD_AVAILABLE"
  | "FLASHCARD_NOT_OWNED"
  | "NO_ACTIVE_STEP"
  | "ATTEMPT_NOT_FOUND"
  | "ATTEMPT_OWNERSHIP_MISMATCH"
  | "ATTEMPT_INCOMPATIBLE"
  | "LEARNING_OBJECT_NOT_OWNED";

export class FlashcardAdapterError extends Error {
  readonly code: FlashcardAdapterErrorCode;

  constructor(code: FlashcardAdapterErrorCode, message: string) {
    super(message);
    this.name = "FlashcardAdapterError";
    this.code = code;
  }
}

export const FLASHCARD_INTERVENTION = "flashcard";

export function normalizeFlashcardIntervention(
  raw: string | null | undefined,
): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim().toLowerCase().replace(/_/g, "-");
  if (!trimmed) return null;
  if (
    trimmed === "flashcard" ||
    trimmed === "flash-card" ||
    trimmed === "flashcards"
  ) {
    return FLASHCARD_INTERVENTION;
  }
  return null;
}

export function isSupportedFlashcardIntervention(
  raw: string | null | undefined,
): boolean {
  return normalizeFlashcardIntervention(raw) === FLASHCARD_INTERVENTION;
}

export type FlashcardGuideHrefParams = {
  adaptiveRunId?: string;
  adaptiveStep?: number;
};

export function flashcardAdaptiveHref(
  input: {
    courseId: string;
    topicName?: string;
  },
  params?: FlashcardGuideHrefParams,
): string {
  const base = flashcardAssessmentHref(input);
  if (!params) return base;
  const url = new URL(base, "https://studyhaul.local");
  if (params.adaptiveRunId) {
    url.searchParams.set("adaptiveRunId", params.adaptiveRunId);
  }
  if (
    typeof params.adaptiveStep === "number" &&
    Number.isFinite(params.adaptiveStep) &&
    params.adaptiveStep >= 0
  ) {
    url.searchParams.set(
      "adaptiveStep",
      String(Math.floor(params.adaptiveStep)),
    );
  }
  return `${url.pathname}${url.search}`;
}

export type ResolvedFlashcardSequenceActivity = {
  intervention: typeof FLASHCARD_INTERVENTION;
  flashcardId: string;
  href: string;
  learningObjectId: string | null;
  step: AdaptiveSequenceStep;
};

/**
 * Sync shape check — intervention must be flashcard.
 */
export function resolveFlashcardSequenceStep(
  step: AdaptiveSequenceStep,
): {
  intervention: typeof FLASHCARD_INTERVENTION;
  learningObjectId: string | null;
} {
  if (!step || typeof step !== "object") {
    throw new FlashcardAdapterError("INVALID_STEP", "Step must be an object.");
  }
  if (typeof step.intervention !== "string" || !step.intervention.trim()) {
    throw new FlashcardAdapterError(
      "UNKNOWN_INTERVENTION",
      "Step.intervention must be a non-empty string.",
    );
  }
  const normalized = normalizeFlashcardIntervention(step.intervention);
  if (!normalized) {
    throw new FlashcardAdapterError(
      "UNKNOWN_INTERVENTION",
      `Unknown or unsupported Flashcard intervention: ${step.intervention}`,
    );
  }
  return {
    intervention: FLASHCARD_INTERVENTION,
    learningObjectId: step.learningObjectId ?? null,
  };
}

/**
 * Resolve Adaptive flashcard step → owned due Flashcard for the run concept.
 */
export async function resolveOwnedFlashcardSequenceStep(input: {
  userId: string;
  conceptId: string;
  step: AdaptiveSequenceStep;
  hrefParams?: FlashcardGuideHrefParams;
}): Promise<ResolvedFlashcardSequenceActivity> {
  const resolved = resolveFlashcardSequenceStep(input.step);

  if (resolved.learningObjectId) {
    const learningObject = await db.learningObject.findFirst({
      where: { id: resolved.learningObjectId, userId: input.userId },
      select: { id: true },
    });
    if (!learningObject) {
      throw new FlashcardAdapterError(
        "LEARNING_OBJECT_NOT_OWNED",
        "LearningObject not found or not owned by user.",
      );
    }
  }

  const owned = await findOwnedDueFlashcardForConcept({
    userId: input.userId,
    conceptId: input.conceptId,
  });
  if (!owned.ok) {
    throw new FlashcardAdapterError(
      "NO_FLASHCARD_AVAILABLE",
      owned.reason === "NO_TOPIC"
        ? "No topic is linked to this concept for flashcard launch."
        : "No due flashcard exists for this topic yet.",
    );
  }

  return {
    intervention: FLASHCARD_INTERVENTION,
    flashcardId: owned.flashcardId,
    href: flashcardAdaptiveHref(
      { courseId: owned.courseId, topicName: owned.topicName },
      input.hrefParams,
    ),
    learningObjectId: resolved.learningObjectId,
    step: {
      intervention: FLASHCARD_INTERVENTION,
      learningObjectId: resolved.learningObjectId,
    },
  };
}

type AttemptCompatRow = {
  id: string;
  userId: string;
  conceptId: string | null;
  learningObjectId: string;
  skillFacet: string;
  sourceRefJson: string;
};

function parseSourceRef(raw: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Verify an existing LearningAttempt is flashcard_review evidence for Adaptive bind.
 * Requires sourceRef.flashcardId to match the interaction's Flashcard (not concept-only).
 */
export function assertFlashcardCompatibleAttempt(
  attempt: AttemptCompatRow,
  options?: { expectedFlashcardId?: string | null },
): void {
  const sourceRef = parseSourceRef(attempt.sourceRefJson);
  if (!sourceRef || sourceRef.kind !== "flashcard_review") {
    throw new FlashcardAdapterError(
      "ATTEMPT_INCOMPATIBLE",
      "LearningAttempt is not flashcard review evidence.",
    );
  }
  if (
    options?.expectedFlashcardId &&
    sourceRef.flashcardId !== options.expectedFlashcardId
  ) {
    throw new FlashcardAdapterError(
      "ATTEMPT_INCOMPATIBLE",
      "LearningAttempt flashcardId does not match the rated flashcard.",
    );
  }
  if (attempt.skillFacet !== "RETAIN") {
    throw new FlashcardAdapterError(
      "ATTEMPT_INCOMPATIBLE",
      "Flashcard Adaptive completion expects RETAIN facet evidence.",
    );
  }
}

async function assertOwnedFlashcardAttemptForCurrentStep(input: {
  userId: string;
  runId: string;
  attemptId: string;
  stepIndex?: number;
  expectedFlashcardId?: string | null;
}): Promise<void> {
  const current = await getCurrentAdaptiveSequenceStep(
    input.userId,
    input.runId,
  );
  if (current.kind !== "active") {
    throw new FlashcardAdapterError(
      "NO_ACTIVE_STEP",
      "No active flashcard sequence step available for completion.",
    );
  }

  if (
    typeof input.stepIndex === "number" &&
    input.stepIndex !== current.stepIndex
  ) {
    throw new FlashcardAdapterError(
      "NO_ACTIVE_STEP",
      `Stale adaptive step ${input.stepIndex}; current is ${current.stepIndex}.`,
    );
  }

  if (!isSupportedFlashcardIntervention(current.step.intervention)) {
    throw new FlashcardAdapterError(
      "UNKNOWN_INTERVENTION",
      "Current Adaptive step is not a flashcard intervention.",
    );
  }

  resolveFlashcardSequenceStep(current.step);
  if (current.step.learningObjectId) {
    const learningObject = await db.learningObject.findFirst({
      where: { id: current.step.learningObjectId, userId: input.userId },
      select: { id: true },
    });
    if (!learningObject) {
      throw new FlashcardAdapterError(
        "LEARNING_OBJECT_NOT_OWNED",
        "LearningObject not found or not owned by user.",
      );
    }
  }

  const attempt = await db.learningAttempt.findFirst({
    where: { id: input.attemptId },
    select: {
      id: true,
      userId: true,
      conceptId: true,
      learningObjectId: true,
      skillFacet: true,
      sourceRefJson: true,
    },
  });
  if (!attempt) {
    throw new FlashcardAdapterError(
      "ATTEMPT_NOT_FOUND",
      `LearningAttempt not found: ${input.attemptId}`,
    );
  }
  if (attempt.userId !== input.userId) {
    throw new FlashcardAdapterError(
      "ATTEMPT_OWNERSHIP_MISMATCH",
      "LearningAttempt does not belong to this learner.",
    );
  }

  assertFlashcardCompatibleAttempt(attempt, {
    expectedFlashcardId: input.expectedFlashcardId,
  });
}

export async function recordFlashcardAdaptiveSequenceCompletion(input: {
  userId: string;
  runId: string;
  attemptId: string;
  stepIndex?: number;
  expectedFlashcardId?: string | null;
}): Promise<RecordCompletionResult> {
  await assertOwnedFlashcardAttemptForCurrentStep(input);
  return recordAdaptiveSequenceCompletion({
    userId: input.userId,
    runId: input.runId,
    attemptId: input.attemptId,
    stepIndex: input.stepIndex,
  });
}

export async function recordFlashcardAdaptiveSequenceCompletionAndPlanNext(input: {
  userId: string;
  runId: string;
  attemptId: string;
  stepIndex?: number;
  expectedFlashcardId?: string | null;
  options?: Parameters<
    typeof recordAdaptiveSequenceCompletionAndPlanNext
  >[0]["options"];
}): Promise<PlanNextAdaptiveStepResult> {
  await assertOwnedFlashcardAttemptForCurrentStep(input);
  return recordAdaptiveSequenceCompletionAndPlanNext({
    userId: input.userId,
    runId: input.runId,
    attemptId: input.attemptId,
    stepIndex: input.stepIndex,
    options: input.options,
  });
}

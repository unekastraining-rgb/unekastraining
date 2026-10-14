/**
 * Phase 2G-14 — Quiz Adaptive Sequence adapter (activity-specific).
 * Resolves intervention "quiz", validates quiz LearningAttempts, records
 * Adaptive completion via the existing coordinator. Does not create evidence.
 */
import { db } from "@/lib/db";
import {
  getCurrentAdaptiveSequenceStep,
  recordAdaptiveSequenceCompletion,
  recordAdaptiveSequenceCompletionAndPlanNext,
  type PlanNextAdaptiveStepResult,
  type RecordCompletionResult,
} from "@/lib/learning/sequence/coordinator";
import type { AdaptiveSequenceStep } from "@/lib/learning/sequence/types";

export type QuizAdapterErrorCode =
  | "INVALID_STEP"
  | "UNKNOWN_INTERVENTION"
  | "NO_QUIZ_AVAILABLE"
  | "QUIZ_NOT_OWNED"
  | "NO_ACTIVE_STEP"
  | "ATTEMPT_NOT_FOUND"
  | "ATTEMPT_OWNERSHIP_MISMATCH"
  | "ATTEMPT_INCOMPATIBLE"
  | "LEARNING_OBJECT_NOT_OWNED";

export class QuizAdapterError extends Error {
  readonly code: QuizAdapterErrorCode;

  constructor(code: QuizAdapterErrorCode, message: string) {
    super(message);
    this.name = "QuizAdapterError";
    this.code = code;
  }
}

export const QUIZ_INTERVENTION = "quiz";

export function normalizeQuizIntervention(
  raw: string | null | undefined,
): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim().toLowerCase().replace(/_/g, "-");
  if (!trimmed) return null;
  if (trimmed === "quiz" || trimmed === "quiz-item" || trimmed === "quizitem") {
    return QUIZ_INTERVENTION;
  }
  return null;
}

export function isSupportedQuizIntervention(
  raw: string | null | undefined,
): boolean {
  return normalizeQuizIntervention(raw) === QUIZ_INTERVENTION;
}

export type QuizGuideHrefParams = {
  adaptiveRunId?: string;
  adaptiveStep?: number;
};

export function quizAdaptiveHref(
  quizId: string,
  params?: QuizGuideHrefParams,
): string {
  const base = `/quizzes/${encodeURIComponent(quizId)}`;
  if (!params) return base;
  const search = new URLSearchParams();
  if (params.adaptiveRunId) search.set("adaptiveRunId", params.adaptiveRunId);
  if (
    typeof params.adaptiveStep === "number" &&
    Number.isFinite(params.adaptiveStep) &&
    params.adaptiveStep >= 0
  ) {
    search.set("adaptiveStep", String(Math.floor(params.adaptiveStep)));
  }
  const query = search.toString();
  return query ? `${base}?${query}` : base;
}

export type ResolvedQuizSequenceActivity = {
  intervention: typeof QUIZ_INTERVENTION;
  quizId: string;
  title: string;
  href: string;
  learningObjectId: string | null;
  step: AdaptiveSequenceStep;
};

/**
 * Sync shape check — intervention must be quiz. Call resolveOwnedQuizSequenceStep
 * to attach a real owned quiz for the concept.
 */
export function resolveQuizSequenceStep(
  step: AdaptiveSequenceStep,
): { intervention: typeof QUIZ_INTERVENTION; learningObjectId: string | null } {
  if (!step || typeof step !== "object") {
    throw new QuizAdapterError("INVALID_STEP", "Step must be an object.");
  }
  if (typeof step.intervention !== "string" || !step.intervention.trim()) {
    throw new QuizAdapterError(
      "INVALID_STEP",
      "Step.intervention must be a non-empty string.",
    );
  }
  const normalized = normalizeQuizIntervention(step.intervention);
  if (!normalized) {
    throw new QuizAdapterError(
      "UNKNOWN_INTERVENTION",
      `Unknown or unsupported Quiz intervention: ${step.intervention}`,
    );
  }
  return {
    intervention: QUIZ_INTERVENTION,
    learningObjectId: step.learningObjectId ?? null,
  };
}

/**
 * Canonical owned Quiz identity for a concept (read-only).
 *
 * Alignment: Concept → Topic (course owned by learner) → most recent Quiz
 * with matching topicId + userId. Does not create quizzes or start attempts.
 */
export type FindOwnedQuizForConceptResult =
  | {
      ok: true;
      quizId: string;
      title: string;
      topicId: string;
    }
  | { ok: false; reason: "invalid_request" | "NO_TOPIC" | "NO_QUIZ" };

export async function findOwnedQuizForConcept(input: {
  userId: string;
  conceptId: string;
}): Promise<FindOwnedQuizForConceptResult> {
  const userId =
    typeof input.userId === "string" ? input.userId.trim() : "";
  const conceptId =
    typeof input.conceptId === "string" ? input.conceptId.trim() : "";
  if (!userId || !conceptId) {
    return { ok: false, reason: "invalid_request" };
  }

  const topic = await db.topic.findFirst({
    where: { conceptId, course: { userId } },
    select: { id: true, name: true },
    orderBy: { sortOrder: "asc" },
  });
  if (!topic) {
    return { ok: false, reason: "NO_TOPIC" };
  }

  const quiz = await db.quiz.findFirst({
    where: { userId, topicId: topic.id },
    select: { id: true, title: true, userId: true },
    orderBy: { createdAt: "desc" },
  });
  if (!quiz || quiz.userId !== userId) {
    return { ok: false, reason: "NO_QUIZ" };
  }

  return {
    ok: true,
    quizId: quiz.id,
    title: quiz.title || topic.name || "Quiz",
    topicId: topic.id,
  };
}

/**
 * Resolve Adaptive quiz step → owned Quiz for the run concept's topic.
 * Picks the learner's most recent quiz with matching topicId.
 */
export async function resolveOwnedQuizSequenceStep(input: {
  userId: string;
  conceptId: string;
  step: AdaptiveSequenceStep;
  hrefParams?: QuizGuideHrefParams;
}): Promise<ResolvedQuizSequenceActivity> {
  const resolved = resolveQuizSequenceStep(input.step);

  if (resolved.learningObjectId) {
    const learningObject = await db.learningObject.findFirst({
      where: { id: resolved.learningObjectId, userId: input.userId },
      select: { id: true },
    });
    if (!learningObject) {
      throw new QuizAdapterError(
        "LEARNING_OBJECT_NOT_OWNED",
        "LearningObject not found or not owned by user.",
      );
    }
  }

  const owned = await findOwnedQuizForConcept({
    userId: input.userId,
    conceptId: input.conceptId,
  });
  if (!owned.ok) {
    if (owned.reason === "NO_TOPIC") {
      throw new QuizAdapterError(
        "NO_QUIZ_AVAILABLE",
        "No topic is linked to this concept for quiz launch.",
      );
    }
    throw new QuizAdapterError(
      "NO_QUIZ_AVAILABLE",
      "No quiz exists for this topic yet. Create a quiz first, then return to Adaptive Study.",
    );
  }

  return {
    intervention: QUIZ_INTERVENTION,
    quizId: owned.quizId,
    title: owned.title,
    href: quizAdaptiveHref(owned.quizId, input.hrefParams),
    learningObjectId: resolved.learningObjectId,
    step: {
      intervention: QUIZ_INTERVENTION,
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
 * Verify an existing LearningAttempt is quiz_attempt evidence for Adaptive bind.
 */
export function assertQuizCompatibleAttempt(
  attempt: AttemptCompatRow,
  options?: { expectedQuizId?: string | null },
): void {
  const sourceRef = parseSourceRef(attempt.sourceRefJson);
  if (!sourceRef || sourceRef.kind !== "quiz_attempt") {
    throw new QuizAdapterError(
      "ATTEMPT_INCOMPATIBLE",
      "LearningAttempt is not quiz attempt evidence.",
    );
  }
  if (
    options?.expectedQuizId &&
    sourceRef.quizId !== options.expectedQuizId
  ) {
    throw new QuizAdapterError(
      "ATTEMPT_INCOMPATIBLE",
      "LearningAttempt quizId does not match the launched quiz.",
    );
  }
  if (attempt.skillFacet !== "RECOGNIZE") {
    throw new QuizAdapterError(
      "ATTEMPT_INCOMPATIBLE",
      "Quiz Adaptive completion expects RECOGNIZE facet evidence.",
    );
  }
}

async function assertOwnedQuizAttemptForCurrentStep(input: {
  userId: string;
  runId: string;
  attemptId: string;
  stepIndex?: number;
  expectedQuizId?: string | null;
}): Promise<void> {
  const current = await getCurrentAdaptiveSequenceStep(
    input.userId,
    input.runId,
  );
  if (current.kind !== "active") {
    throw new QuizAdapterError(
      "NO_ACTIVE_STEP",
      "No active quiz sequence step available for completion.",
    );
  }

  if (
    typeof input.stepIndex === "number" &&
    input.stepIndex !== current.stepIndex
  ) {
    throw new QuizAdapterError(
      "NO_ACTIVE_STEP",
      `Stale adaptive step ${input.stepIndex}; current is ${current.stepIndex}.`,
    );
  }

  if (!isSupportedQuizIntervention(current.step.intervention)) {
    throw new QuizAdapterError(
      "UNKNOWN_INTERVENTION",
      "Current Adaptive step is not a quiz intervention.",
    );
  }

  // Validate step shape (and optional LO ownership) without requiring a quiz row
  // when only completing — launch already required an owned quiz.
  resolveQuizSequenceStep(current.step);
  if (current.step.learningObjectId) {
    const learningObject = await db.learningObject.findFirst({
      where: { id: current.step.learningObjectId, userId: input.userId },
      select: { id: true },
    });
    if (!learningObject) {
      throw new QuizAdapterError(
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
    throw new QuizAdapterError(
      "ATTEMPT_NOT_FOUND",
      `LearningAttempt not found: ${input.attemptId}`,
    );
  }
  if (attempt.userId !== input.userId) {
    throw new QuizAdapterError(
      "ATTEMPT_OWNERSHIP_MISMATCH",
      "LearningAttempt does not belong to this learner.",
    );
  }

  assertQuizCompatibleAttempt(attempt, {
    expectedQuizId: input.expectedQuizId,
  });
}

export async function recordQuizAdaptiveSequenceCompletion(input: {
  userId: string;
  runId: string;
  attemptId: string;
  stepIndex?: number;
  expectedQuizId?: string | null;
}): Promise<RecordCompletionResult> {
  await assertOwnedQuizAttemptForCurrentStep(input);
  return recordAdaptiveSequenceCompletion({
    userId: input.userId,
    runId: input.runId,
    attemptId: input.attemptId,
    stepIndex: input.stepIndex,
  });
}

export async function recordQuizAdaptiveSequenceCompletionAndPlanNext(input: {
  userId: string;
  runId: string;
  attemptId: string;
  stepIndex?: number;
  expectedQuizId?: string | null;
  options?: Parameters<
    typeof recordAdaptiveSequenceCompletionAndPlanNext
  >[0]["options"];
}): Promise<PlanNextAdaptiveStepResult> {
  await assertOwnedQuizAttemptForCurrentStep(input);
  return recordAdaptiveSequenceCompletionAndPlanNext({
    userId: input.userId,
    runId: input.runId,
    attemptId: input.attemptId,
    stepIndex: input.stepIndex,
    options: input.options,
  });
}

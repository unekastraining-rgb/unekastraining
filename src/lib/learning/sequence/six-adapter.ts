/**
 * Phase 2G-4 — SIX activity adapter for AdaptiveSequence steps.
 * Translates step descriptors ↔ existing SIX catalog / evaluate contract.
 * Does not launch activities, create evidence, or navigate.
 */
import { db } from "@/lib/db";
import {
  SIX_ACTIVITIES,
  type SixActivity,
  type SixComponent,
} from "@/lib/csl/six";
import {
  SIX_GUIDES,
  isSixGuideComponent,
  sixGuideHref,
  type SixGuide,
} from "@/lib/csl/six-guides";
import { mapStudyEvaluateToLearningSignals } from "@/lib/learning/assessment/evaluate-bridge";
import {
  getCurrentAdaptiveSequenceStep,
  recordAdaptiveSequenceCompletion,
  recordAdaptiveSequenceCompletionAndPlanNext,
  type CurrentAdaptiveSequenceStepResult,
  type PlanNextAdaptiveStepResult,
  type RecordCompletionResult,
} from "@/lib/learning/sequence/coordinator";
import type { AdaptiveSequenceStep } from "@/lib/learning/sequence/types";

export type SixAdapterErrorCode =
  | "UNKNOWN_INTERVENTION"
  | "UNSUPPORTED_INTERVENTION"
  | "INVALID_STEP"
  | "MISSING_SIX_ACTIVITY"
  | "LEARNING_OBJECT_NOT_OWNED"
  | "ATTEMPT_NOT_FOUND"
  | "ATTEMPT_OWNERSHIP_MISMATCH"
  | "ATTEMPT_CONCEPT_MISMATCH"
  | "ATTEMPT_LEARNING_OBJECT_MISMATCH"
  | "ATTEMPT_NOT_SIX_COMPATIBLE"
  | "NO_ACTIVE_STEP";

export class SixAdapterError extends Error {
  readonly code: SixAdapterErrorCode;

  constructor(code: SixAdapterErrorCode, message: string) {
    super(message);
    this.name = "SixAdapterError";
    this.code = code;
  }
}

export type SixEvaluateContract = {
  /** Existing evaluate API mode for SIX guided sessions. */
  mode: "six";
  sixComponent: SixComponent;
};

export type ResolvedSixSequenceActivity = {
  sixComponent: SixComponent;
  activity: SixActivity;
  guide: SixGuide;
  /** Canonical existing SIX guided-session href (sixGuideHref). */
  href: string;
  evaluate: SixEvaluateContract;
  /** Existing evaluate-bridge facet/LO type mapping (descriptive only). */
  learningSignals: ReturnType<typeof mapStudyEvaluateToLearningSignals>;
  learningObjectId: string | null;
  step: AdaptiveSequenceStep;
};

export type SixGuideHrefParams = {
  courseId?: string;
  topicId?: string;
  topicName?: string;
  materialId?: string;
  adaptiveRunId?: string;
  adaptiveStep?: number;
};

/**
 * Normalize Orchestrator / step intervention strings to SIX component ids.
 * Accepts hyphen or underscore forms used elsewhere in the repo.
 */
export function normalizeSixIntervention(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.trim().toLowerCase().replace(/_/g, "-");
}

export function isSupportedSixIntervention(
  value: unknown,
): value is SixComponent {
  const normalized = normalizeSixIntervention(value);
  return isSixGuideComponent(normalized);
}

function requireSixActivity(component: SixComponent): SixActivity {
  const activity = SIX_ACTIVITIES.find((item) => item.id === component);
  if (!activity) {
    throw new SixAdapterError(
      "MISSING_SIX_ACTIVITY",
      `SIX activity definition missing for: ${component}`,
    );
  }
  return activity;
}

/**
 * Resolve an AdaptiveSequence step to the existing SIX activity contract.
 * Sync — does not touch the database or create evidence.
 */
export function resolveSixSequenceStep(
  step: AdaptiveSequenceStep,
  hrefParams?: SixGuideHrefParams,
): ResolvedSixSequenceActivity {
  if (!step || typeof step !== "object") {
    throw new SixAdapterError("INVALID_STEP", "Step must be an object.");
  }
  if (typeof step.intervention !== "string" || !step.intervention.trim()) {
    throw new SixAdapterError(
      "INVALID_STEP",
      "Step.intervention must be a non-empty string.",
    );
  }

  const normalized = normalizeSixIntervention(step.intervention);
  if (!normalized) {
    throw new SixAdapterError("INVALID_STEP", "Step.intervention is empty.");
  }
  if (!isSixGuideComponent(normalized)) {
    throw new SixAdapterError(
      "UNKNOWN_INTERVENTION",
      `Unknown or unsupported SIX intervention: ${step.intervention}`,
    );
  }

  const sixComponent = normalized;
  const activity = requireSixActivity(sixComponent);
  const guide = SIX_GUIDES[sixComponent];
  if (!guide) {
    throw new SixAdapterError(
      "MISSING_SIX_ACTIVITY",
      `SIX guide missing for: ${sixComponent}`,
    );
  }

  const learningSignals = mapStudyEvaluateToLearningSignals({
    mode: "six",
    sixComponent,
  });

  return {
    sixComponent,
    activity,
    guide,
    href: sixGuideHref(sixComponent, hrefParams),
    evaluate: {
      mode: "six",
      sixComponent,
    },
    learningSignals,
    learningObjectId: step.learningObjectId ?? null,
    step: {
      intervention: sixComponent,
      learningObjectId: step.learningObjectId ?? null,
    },
  };
}

/**
 * Resolve a step and verify optional LearningObject ownership.
 * Does not create LearningObjects.
 */
export async function resolveOwnedSixSequenceStep(
  userId: string,
  step: AdaptiveSequenceStep,
  hrefParams?: SixGuideHrefParams,
): Promise<ResolvedSixSequenceActivity> {
  const resolved = resolveSixSequenceStep(step, hrefParams);

  if (resolved.learningObjectId) {
    const learningObject = await db.learningObject.findFirst({
      where: { id: resolved.learningObjectId, userId },
      select: { id: true, userId: true },
    });
    if (!learningObject) {
      throw new SixAdapterError(
        "LEARNING_OBJECT_NOT_OWNED",
        "LearningObject not found or not owned by user.",
      );
    }
  }

  return resolved;
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
 * Verify an existing LearningAttempt is compatible with a resolved SIX step.
 * Does not mutate the Attempt.
 */
export function assertSixCompatibleAttempt(input: {
  userId: string;
  conceptId: string;
  resolved: ResolvedSixSequenceActivity;
  attempt: AttemptCompatRow;
}): void {
  const { userId, conceptId, resolved, attempt } = input;

  if (attempt.userId !== userId) {
    throw new SixAdapterError(
      "ATTEMPT_OWNERSHIP_MISMATCH",
      "LearningAttempt does not belong to this learner.",
    );
  }
  if (attempt.conceptId != null && attempt.conceptId !== conceptId) {
    throw new SixAdapterError(
      "ATTEMPT_CONCEPT_MISMATCH",
      "LearningAttempt concept does not match the sequence run concept.",
    );
  }
  if (
    resolved.learningObjectId &&
    attempt.learningObjectId !== resolved.learningObjectId
  ) {
    throw new SixAdapterError(
      "ATTEMPT_LEARNING_OBJECT_MISMATCH",
      "LearningAttempt LearningObject does not match the current step.",
    );
  }

  const sourceRef = parseSourceRef(attempt.sourceRefJson);
  const kind = sourceRef?.kind;
  const mode = sourceRef?.mode;
  const sixFromRef = normalizeSixIntervention(sourceRef?.sixComponent);

  const looksLikeSixEvaluate =
    kind === "study_evaluate" &&
    mode === "six" &&
    (sixFromRef === resolved.sixComponent || sixFromRef === "");

  const facetMatches =
    attempt.skillFacet === resolved.learningSignals.skillFacet;

  // Accept clear SIX evaluate evidence, or facet-aligned evaluate without conflicting component.
  if (looksLikeSixEvaluate) {
    if (sixFromRef && sixFromRef !== resolved.sixComponent) {
      throw new SixAdapterError(
        "ATTEMPT_NOT_SIX_COMPATIBLE",
        "LearningAttempt sixComponent does not match the current step intervention.",
      );
    }
    return;
  }

  if (kind === "study_evaluate" && facetMatches) {
    return;
  }

  throw new SixAdapterError(
    "ATTEMPT_NOT_SIX_COMPATIBLE",
    "LearningAttempt is not compatible with the SIX sequence step.",
  );
}

export type ResolveCurrentSixAdaptiveActivityResult =
  | {
      kind: "resolved";
      runId: string;
      conceptId: string;
      stepIndex: number;
      activity: ResolvedSixSequenceActivity;
    }
  | {
      kind: "unavailable";
      current: Exclude<CurrentAdaptiveSequenceStepResult, { kind: "active" }>;
    };

/**
 * Coordinator integration: current ACTIVE step → existing SIX activity contract.
 * Does not navigate, evaluate, or create evidence.
 */
export async function resolveCurrentSixAdaptiveActivity(
  userId: string,
  runId: string,
  hrefParams?: SixGuideHrefParams,
): Promise<ResolveCurrentSixAdaptiveActivityResult> {
  const current = await getCurrentAdaptiveSequenceStep(userId, runId);
  if (current.kind !== "active") {
    return { kind: "unavailable", current };
  }

  const activity = await resolveOwnedSixSequenceStep(
    userId,
    current.step,
    hrefParams,
  );

  return {
    kind: "resolved",
    runId: current.run.id,
    conceptId: current.run.conceptId,
    stepIndex: current.stepIndex,
    activity,
  };
}

/**
 * Coordinator integration: validate an existing SIX Attempt, then record completion.
 * Does not create the Attempt, call evaluate, or re-orchestrate.
 */
export async function recordSixAdaptiveSequenceCompletion(input: {
  userId: string;
  runId: string;
  attemptId: string;
  stepIndex?: number;
}): Promise<RecordCompletionResult> {
  await assertOwnedSixAttemptForCurrentStep(input);

  return recordAdaptiveSequenceCompletion({
    userId: input.userId,
    runId: input.runId,
    attemptId: input.attemptId,
    stepIndex: input.stepIndex,
  });
}

/**
 * Phase 2G-10 — Validate SIX Attempt, record completion, then plan next step.
 * Does not create the Attempt or mutate mastery.
 */
export async function recordSixAdaptiveSequenceCompletionAndPlanNext(input: {
  userId: string;
  runId: string;
  attemptId: string;
  stepIndex?: number;
  options?: Parameters<
    typeof recordAdaptiveSequenceCompletionAndPlanNext
  >[0]["options"];
}): Promise<PlanNextAdaptiveStepResult> {
  await assertOwnedSixAttemptForCurrentStep(input);

  return recordAdaptiveSequenceCompletionAndPlanNext({
    userId: input.userId,
    runId: input.runId,
    attemptId: input.attemptId,
    stepIndex: input.stepIndex,
    options: input.options,
  });
}

async function assertOwnedSixAttemptForCurrentStep(input: {
  userId: string;
  runId: string;
  attemptId: string;
  stepIndex?: number;
}): Promise<void> {
  const current = await getCurrentAdaptiveSequenceStep(
    input.userId,
    input.runId,
  );
  if (current.kind !== "active") {
    throw new SixAdapterError(
      "NO_ACTIVE_STEP",
      "No active SIX sequence step available for completion.",
    );
  }

  if (
    typeof input.stepIndex === "number" &&
    input.stepIndex !== current.stepIndex
  ) {
    throw new SixAdapterError(
      "NO_ACTIVE_STEP",
      `Stale adaptive step ${input.stepIndex}; current is ${current.stepIndex}.`,
    );
  }

  const resolved = await resolveOwnedSixSequenceStep(
    input.userId,
    current.step,
  );

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
    throw new SixAdapterError(
      "ATTEMPT_NOT_FOUND",
      `LearningAttempt not found: ${input.attemptId}`,
    );
  }

  assertSixCompatibleAttempt({
    userId: input.userId,
    conceptId: current.run.conceptId,
    resolved,
    attempt,
  });
}

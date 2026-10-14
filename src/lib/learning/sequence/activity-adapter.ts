/**
 * 2G-73 — Universal Activity Adaptive Sequence adapter.
 *
 * Resolves ACTIVITY steps, builds launch hrefs with adaptive context,
 * validates LearningAttempts against completion contracts, and binds
 * completion via the existing coordinator.
 *
 * Does not create LearningAttempt or ConceptMastery.
 */

import { db } from "@/lib/db";
import {
  getActivityInterventionCapability,
} from "@/lib/learning/orchestrator/activity-intervention-capability";
import {
  getActivityAdaptiveCompletionContract,
  isSupportedUniversalActivityIntervention,
  normalizeUniversalActivityIntervention,
  type ActivityAdaptiveCompletionContract,
} from "@/lib/learning/sequence/activity-adaptive-completion";
import {
  getCurrentAdaptiveSequenceStep,
  recordAdaptiveSequenceCompletionAndPlanNext,
  type PlanNextAdaptiveStepResult,
} from "@/lib/learning/sequence/coordinator";
import { AdaptiveSequenceCoordinatorError } from "@/lib/learning/sequence/coordinator-errors";
import type { AdaptiveSequenceStep } from "@/lib/learning/sequence/types";
import type { EvidenceOutcomeName, MasteryFacetName } from "@/lib/learning/types";

export type ActivityAdapterErrorCode =
  | "INVALID_STEP"
  | "UNKNOWN_INTERVENTION"
  | "NOT_ADAPTIVE_READY"
  | "NO_ACTIVE_STEP"
  | "ATTEMPT_NOT_FOUND"
  | "ATTEMPT_OWNERSHIP_MISMATCH"
  | "ATTEMPT_INCOMPATIBLE"
  | "CONCEPT_MISMATCH"
  | "COMPLETION_NOT_SATISFIED";

export class ActivityAdapterError extends Error {
  readonly code: ActivityAdapterErrorCode;

  constructor(code: ActivityAdapterErrorCode, message: string) {
    super(message);
    this.name = "ActivityAdapterError";
    this.code = code;
  }
}

export type ResolvedUniversalActivitySequenceActivity = {
  intervention: string;
  adapterKey: string;
  title: string;
  description: string;
  href: string;
  learningObjectId: string | null;
  step: AdaptiveSequenceStep;
  contract: ActivityAdaptiveCompletionContract;
};

export type UniversalActivityHrefParams = {
  adaptiveRunId?: string;
  adaptiveStep?: number;
  /** 2P-28 — optional owned material context (display only). */
  materialId?: string;
};

export function universalActivityAdaptiveHref(
  adapterKey: string,
  conceptId: string,
  params?: UniversalActivityHrefParams,
): string {
  const capability = getActivityInterventionCapability(adapterKey);
  const pathKind = capability?.pathKind ?? adapterKey;
  const search = new URLSearchParams();
  search.set("conceptId", conceptId);
  if (params?.adaptiveRunId) {
    search.set("adaptiveRunId", params.adaptiveRunId);
  }
  if (
    typeof params?.adaptiveStep === "number" &&
    Number.isFinite(params.adaptiveStep) &&
    params.adaptiveStep >= 0
  ) {
    search.set("adaptiveStep", String(Math.floor(params.adaptiveStep)));
  }
  const materialId =
    typeof params?.materialId === "string" ? params.materialId.trim() : "";
  if (materialId) {
    search.set("materialId", materialId);
  }
  return `/study/activities/${encodeURIComponent(pathKind)}?${search.toString()}`;
}

/**
 * Sync shape check — intervention must be an Adaptive-ready universal activity.
 */
export function resolveUniversalActivitySequenceStep(
  step: AdaptiveSequenceStep,
): { intervention: string; learningObjectId: string | null } {
  if (!step || typeof step !== "object") {
    throw new ActivityAdapterError("INVALID_STEP", "Step must be an object.");
  }
  const normalized = normalizeUniversalActivityIntervention(step.intervention);
  if (!normalized) {
    throw new ActivityAdapterError(
      "UNKNOWN_INTERVENTION",
      `Not a supported universal activity intervention: ${step.intervention}`,
    );
  }
  const contract = getActivityAdaptiveCompletionContract(normalized);
  if (!contract) {
    throw new ActivityAdapterError(
      "NOT_ADAPTIVE_READY",
      `Activity is not Adaptive-ready: ${normalized}`,
    );
  }
  return {
    intervention: normalized,
    learningObjectId: step.learningObjectId ?? null,
  };
}

/**
 * Resolve launch descriptor for an owned Adaptive activity step.
 * Does not create evidence.
 */
export function resolveOwnedUniversalActivitySequenceStep(input: {
  userId: string;
  conceptId: string;
  step: AdaptiveSequenceStep;
  hrefParams?: UniversalActivityHrefParams;
}): ResolvedUniversalActivitySequenceActivity {
  const resolved = resolveUniversalActivitySequenceStep(input.step);
  const contract = getActivityAdaptiveCompletionContract(resolved.intervention)!;
  const capability = getActivityInterventionCapability(resolved.intervention);
  if (!capability?.launchIntegrated || !capability.evidenceIntegrated) {
    throw new ActivityAdapterError(
      "NOT_ADAPTIVE_READY",
      "Activity lacks launch/evidence integration.",
    );
  }

  const href = universalActivityAdaptiveHref(
    resolved.intervention,
    input.conceptId,
    input.hrefParams,
  );

  return {
    intervention: resolved.intervention,
    adapterKey: resolved.intervention,
    title: capability.learnerTitle,
    description: `Practice this concept with ${capability.learnerTitle.toLowerCase()}. Submit your work to continue adaptive study.`,
    href,
    learningObjectId: resolved.learningObjectId,
    step: {
      intervention: resolved.intervention,
      learningObjectId: resolved.learningObjectId,
    },
    contract,
  };
}

function parseJsonObject(raw: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * Validate that a LearningAttempt satisfies the activity Adaptive completion gate.
 * Pure checks on attempt fields — does not write anything.
 */
export function isActivityAdaptiveCompletionEligible(input: {
  contract: ActivityAdaptiveCompletionContract;
  attempt: {
    userId: string;
    conceptId: string | null;
    skillFacet: string;
    outcome: string;
    sourceRefJson: string;
  };
  expectedLearnerId: string;
  expectedConceptId: string;
}): { eligible: boolean; reason: string } {
  if (input.attempt.userId !== input.expectedLearnerId) {
    return { eligible: false, reason: "attempt_ownership_mismatch" };
  }
  if (input.attempt.conceptId !== input.expectedConceptId) {
    return { eligible: false, reason: "concept_mismatch" };
  }
  if (
    !input.contract.requiredSkillFacets.includes(
      input.attempt.skillFacet as MasteryFacetName,
    )
  ) {
    return { eligible: false, reason: "skill_facet_mismatch" };
  }
  if (
    !input.contract.acceptOutcomes.includes(
      input.attempt.outcome as EvidenceOutcomeName,
    )
  ) {
    return { eligible: false, reason: "outcome_not_accepted" };
  }
  const sourceRef = parseJsonObject(input.attempt.sourceRefJson);
  const kind =
    typeof sourceRef?.kind === "string" ? sourceRef.kind : "";
  if (!input.contract.sourceRefKinds.includes(kind)) {
    return { eligible: false, reason: "source_ref_mismatch" };
  }
  return { eligible: true, reason: "activity_evaluated" };
}

/**
 * Bind an existing activity LearningAttempt to Adaptive completion + plan-next.
 * Soft-fail friendly for activity submit routes.
 */
export async function bindUniversalActivityAttemptToAdaptiveSequence(input: {
  userId: string;
  runId: string;
  attemptId: string;
  stepIndex?: number;
}): Promise<
  | { kind: "bound"; plan: PlanNextAdaptiveStepResult }
  | { kind: "skipped"; reason: string }
> {
  const current = await getCurrentAdaptiveSequenceStep(
    input.userId,
    input.runId,
  );
  if (current.kind !== "active" || !current.step) {
    return { kind: "skipped", reason: "no_active_step" };
  }

  const normalized = normalizeUniversalActivityIntervention(
    current.step.intervention,
  );
  if (!normalized) {
    return { kind: "skipped", reason: "step_not_universal_activity" };
  }

  const contract = getActivityAdaptiveCompletionContract(normalized);
  if (!contract) {
    return { kind: "skipped", reason: "not_adaptive_ready" };
  }

  const attempt = await db.learningAttempt.findFirst({
    where: { id: input.attemptId, userId: input.userId },
    select: {
      id: true,
      userId: true,
      conceptId: true,
      skillFacet: true,
      outcome: true,
      sourceRefJson: true,
    },
  });
  if (!attempt) {
    throw new ActivityAdapterError(
      "ATTEMPT_NOT_FOUND",
      "LearningAttempt not found for this learner.",
    );
  }

  const run = current.run;
  const eligibility = isActivityAdaptiveCompletionEligible({
    contract,
    attempt,
    expectedLearnerId: input.userId,
    expectedConceptId: run.conceptId,
  });
  if (!eligibility.eligible) {
    throw new ActivityAdapterError(
      "COMPLETION_NOT_SATISFIED",
      `Activity Adaptive completion not satisfied: ${eligibility.reason}`,
    );
  }

  try {
    const plan = await recordAdaptiveSequenceCompletionAndPlanNext({
      userId: input.userId,
      runId: input.runId,
      attemptId: input.attemptId,
      ...(input.stepIndex != null ? { stepIndex: input.stepIndex } : {}),
    });
    return { kind: "bound", plan };
  } catch (err) {
    if (err instanceof AdaptiveSequenceCoordinatorError) {
      throw err;
    }
    throw err;
  }
}

export {
  isSupportedUniversalActivityIntervention,
  normalizeUniversalActivityIntervention,
};

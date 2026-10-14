/**
 * Phase 2G-43 — Assessment activity preparation / descriptor seam.
 * Phase 2G-45 — optional async adapter.prepare for owned activity identity.
 *
 * Architecture choice: **Option B + optional adapter.prepare (hybrid)**
 * - Universal `prepareAssessmentActivity` validates plan↔resolution and builds
 *   a subject-agnostic descriptor (workflow/registry stay independent).
 * - Activity-specific opaque refs belong on optional `AssessmentAdapter.prepare`
 *   when a registry is supplied — adapters own mechanism details; the helper
 *   owns alignment validation and the universal shape.
 *
 * Metadata only — no activity start, grading, evidence writes, or Adaptive mutation.
 */

import type {
  AssessmentActivityPrepareContribution,
  AssessmentActivityResolution,
  AssessmentAdapterRegistry,
} from "@/lib/learning/assessment/adapter-registry";
import type {
  AssessmentMode,
  AssessmentPlan,
  AssessmentWorkflowAdaptiveContext,
} from "@/lib/learning/assessment/workflow";
import {
  parseAdaptiveRunId,
  parseAdaptiveStepIndex,
} from "@/lib/learning/sequence/adaptive-launch-context";
import type { LearningObjectTypeName } from "@/lib/learning/types";

/**
 * Non-executing preparation metadata for a future activity caller.
 * Universal enough for any assessment mechanism — no hard-coded activity kinds.
 */
export type AssessmentActivityDescriptor = {
  adapterKey: string;
  activityType: LearningObjectTypeName;
  conceptId: string;
  learnerId: string;
  /** Preserved from plan when present — not reinterpreted. */
  assessmentMode?: AssessmentMode;
  /** Passive Adaptive refs — never mutates AdaptiveSequenceRun. */
  adaptive?: AssessmentWorkflowAdaptiveContext;
  /** Opaque mechanism identity when an adapter.prepare contributes one. */
  activityRef?: { kind: string; id: string };
};

export type PrepareAssessmentActivityFailureReason =
  | "plan_not_ready"
  | "resolution_required"
  | "adapter_key_mismatch"
  | "activity_type_mismatch"
  | "concept_id_required"
  | "adaptive_context_invalid"
  | "activity_not_available"
  | "invalid_request";

export type PrepareAssessmentActivityResult =
  | { ok: true; descriptor: AssessmentActivityDescriptor }
  | { ok: false; reason: PrepareAssessmentActivityFailureReason };

export type PrepareAssessmentActivityInput = {
  plan: AssessmentPlan;
  resolution: AssessmentActivityResolution | null | undefined;
  learnerId: string;
  /**
   * Optional — when provided, may invoke adapter.prepare for opaque refs.
   * Preparation succeeds without a registry (universal fields only).
   */
  registry?: AssessmentAdapterRegistry | null;
};

function normalizeId(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isResolution(
  value: AssessmentActivityResolution | null | undefined,
): value is AssessmentActivityResolution {
  if (value == null || typeof value !== "object") return false;
  return (
    normalizeId(value.adapterKey).length > 0 &&
    normalizeId(value.activityType).length > 0
  );
}

function normalizePassiveAdaptive(
  adaptive: AssessmentPlan["adaptive"],
):
  | { ok: true; adaptive?: AssessmentWorkflowAdaptiveContext }
  | { ok: false; reason: "adaptive_context_invalid" } {
  if (adaptive == null) {
    return { ok: true };
  }
  const runId = parseAdaptiveRunId(adaptive.runId);
  const stepIndex = parseAdaptiveStepIndex(adaptive.stepIndex);
  if (!runId || stepIndex == null) {
    return { ok: false, reason: "adaptive_context_invalid" };
  }
  return { ok: true, adaptive: { runId, stepIndex } };
}

function normalizeActivityRef(
  contribution: AssessmentActivityPrepareContribution | null | undefined,
): { kind: string; id: string } | undefined {
  const ref = contribution?.activityRef;
  if (ref == null || typeof ref !== "object") return undefined;
  const kind = normalizeId(ref.kind);
  const id = normalizeId(ref.id);
  if (!kind || !id) return undefined;
  return { kind, id };
}

/**
 * Build a non-executing AssessmentActivityDescriptor from a ready plan + resolution.
 * Awaits optional adapter.prepare when present (owned identity lookup may be async).
 */
export async function prepareAssessmentActivity(
  input: PrepareAssessmentActivityInput,
): Promise<PrepareAssessmentActivityResult> {
  if (input == null || typeof input !== "object") {
    return { ok: false, reason: "invalid_request" };
  }

  const { plan, resolution } = input;
  if (plan == null || typeof plan !== "object") {
    return { ok: false, reason: "invalid_request" };
  }

  if (plan.status !== "ready") {
    return { ok: false, reason: "plan_not_ready" };
  }

  if (!isResolution(resolution)) {
    return { ok: false, reason: "resolution_required" };
  }

  const resolutionKey = normalizeId(resolution.adapterKey);
  const resolutionType = normalizeId(
    resolution.activityType,
  ) as LearningObjectTypeName;

  const planKey = normalizeId(plan.adapterKey);
  if (planKey && planKey !== resolutionKey) {
    return { ok: false, reason: "adapter_key_mismatch" };
  }

  const planType = normalizeId(plan.activityType);
  if (planType && planType !== resolutionType) {
    return { ok: false, reason: "activity_type_mismatch" };
  }

  const conceptId = normalizeId(plan.conceptId);
  if (!conceptId) {
    return { ok: false, reason: "concept_id_required" };
  }

  const learnerId = normalizeId(input.learnerId);
  const adaptiveResult = normalizePassiveAdaptive(plan.adaptive);
  if (!adaptiveResult.ok) {
    return { ok: false, reason: adaptiveResult.reason };
  }

  const descriptor: AssessmentActivityDescriptor = {
    adapterKey: resolutionKey,
    activityType: resolutionType,
    conceptId,
    learnerId,
  };

  if (plan.assessmentMode) {
    descriptor.assessmentMode = plan.assessmentMode;
  }
  if (adaptiveResult.adaptive) {
    descriptor.adaptive = adaptiveResult.adaptive;
  }

  const registry = input.registry ?? null;
  if (registry) {
    const lookup = registry.resolve(resolutionKey);
    if (lookup.ok && typeof lookup.adapter.prepare === "function") {
      const contribution = await lookup.adapter.prepare({
        plan,
        resolution: {
          adapterKey: resolutionKey,
          activityType: resolutionType,
        },
        ...(learnerId ? { learnerId } : {}),
      });

      if (contribution?.unavailable) {
        return { ok: false, reason: "activity_not_available" };
      }

      const activityRef = normalizeActivityRef(contribution);
      if (activityRef) {
        descriptor.activityRef = activityRef;
      }
    }
  }

  return { ok: true, descriptor };
}

/**
 * Phase 2G-39 — AssessmentPlan ↔ Adaptive Sequence step binding (passive).
 *
 * Pure validation of the relationship between a ready AssessmentPlan and an
 * existing Adaptive step reference. Does not create/mutate runs, launch
 * activities, select Quiz, or write evidence.
 */

import type {
  AssessmentMode,
  AssessmentPlan,
  AssessmentWorkflowAdaptiveContext,
} from "@/lib/learning/assessment/workflow";
import {
  parseAdaptiveRunId,
  parseAdaptiveStepIndex,
} from "@/lib/learning/sequence/adaptive-launch-context";

/**
 * Opaque binding: plan corresponds to this Adaptive step (metadata only).
 */
export type AssessmentAdaptiveStepBinding = {
  runId: string;
  stepIndex: number;
  conceptId: string;
  assessmentMode: AssessmentMode;
};

export type BindAssessmentPlanFailureReason =
  | "adaptive_context_absent"
  | "missing_run_id"
  | "invalid_step_index"
  | "plan_not_ready"
  | "assessment_mode_required"
  | "concept_mismatch"
  | "missing_concept_id";

export type BindAssessmentPlanResult =
  | { ok: true; binding: AssessmentAdaptiveStepBinding }
  | { ok: false; reason: BindAssessmentPlanFailureReason };

export type BindAssessmentPlanOptions = {
  /**
   * When both this and plan.conceptId are non-empty, they must match.
   * Ownership / DB lookups remain with the sequence coordinator.
   */
  expectedConceptId?: string | null;
};

function normalizeConceptId(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Bind a ready AssessmentPlan to an Adaptive step reference.
 *
 * Prefer explicit `adaptiveContext`; falls back to `plan.adaptive` when present.
 * Absent adaptive context → `{ ok: false, reason: "adaptive_context_absent" }`
 * (standalone plans remain valid; this helper simply does not bind).
 */
export function bindAssessmentPlanToAdaptiveStep(
  plan: AssessmentPlan,
  adaptiveContext?: AssessmentWorkflowAdaptiveContext | null,
  options?: BindAssessmentPlanOptions,
): BindAssessmentPlanResult {
  const raw = adaptiveContext ?? plan.adaptive ?? null;
  if (raw == null) {
    return { ok: false, reason: "adaptive_context_absent" };
  }

  const runId = parseAdaptiveRunId(raw.runId);
  if (!runId) {
    return { ok: false, reason: "missing_run_id" };
  }

  const stepIndex = parseAdaptiveStepIndex(raw.stepIndex);
  if (stepIndex == null) {
    return { ok: false, reason: "invalid_step_index" };
  }

  if (plan.status !== "ready") {
    return { ok: false, reason: "plan_not_ready" };
  }

  if (!plan.assessmentMode) {
    return { ok: false, reason: "assessment_mode_required" };
  }

  const conceptId = normalizeConceptId(plan.conceptId);
  if (!conceptId) {
    return { ok: false, reason: "missing_concept_id" };
  }

  const expected = normalizeConceptId(options?.expectedConceptId);
  if (expected && expected !== conceptId) {
    return { ok: false, reason: "concept_mismatch" };
  }

  return {
    ok: true,
    binding: {
      runId,
      stepIndex,
      conceptId,
      assessmentMode: plan.assessmentMode,
    },
  };
}

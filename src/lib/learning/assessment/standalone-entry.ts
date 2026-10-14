/**
 * Phase 2G-40 — Standalone ASSESS entry (thin workflow caller).
 *
 * Explicit learner-driven assessment planning only.
 * Does not launch activities, resolve adapters, or write evidence.
 */

import { parseLearningIntent } from "@/lib/learning/intent/parse";
import type { LearningIntent } from "@/lib/learning/intent/types";
import {
  resolveAssessmentWorkflowHandoff,
  type AssessmentWorkflowHandoff,
} from "@/lib/learning/orchestrator/assessment-handoff";
import type { OrchestratorDiagnosis } from "@/lib/learning/orchestrator/diagnose";
import {
  bindAssessmentPlanToAdaptiveStep,
  type AssessmentAdaptiveStepBinding,
  type BindAssessmentPlanResult,
} from "@/lib/learning/assessment/adaptive-step-bridge";
import {
  runAssessmentWorkflow,
  type AssessmentPlan,
  type AssessmentWorkflowAdaptiveContext,
} from "@/lib/learning/assessment/workflow";

const ORCHESTRATOR_DIAGNOSES = [
  "UNDERSTANDING_GAP",
  "APPLICATION_GAP",
  "RECALL_GAP",
  "RETENTION_GAP",
  "INSUFFICIENT_EVIDENCE",
  "NO_INTERVENTION",
] as const satisfies readonly OrchestratorDiagnosis[];

export type StandaloneAssessmentEntryErrorCode =
  | "invalid_request"
  | "assessment_intent_required"
  | "invalid_assessment_intent"
  | "explicit_assess_required"
  | "assessment_context_incomplete";

export type StandaloneAssessmentEntryInput = {
  learnerId: string;
  conceptId: string;
  learningSpaceId?: string | null;
  /** Raw or canonical LearningIntent — must be EXPLICIT ASSESS after parse. */
  intent?: LearningIntent | null | unknown;
  /** Existing Orchestrator diagnosis — required; not invented here. */
  diagnosis?: OrchestratorDiagnosis | null | unknown;
  adaptive?: AssessmentWorkflowAdaptiveContext | null;
};

export type StandaloneAssessmentEntrySuccess = {
  ok: true;
  plan: AssessmentPlan;
  handoff: AssessmentWorkflowHandoff;
  /** Present only when adaptive context was supplied; passive validation. */
  adaptiveBinding?: BindAssessmentPlanResult;
};

export type StandaloneAssessmentEntryFailure = {
  ok: false;
  code: StandaloneAssessmentEntryErrorCode;
};

export type StandaloneAssessmentEntryResult =
  | StandaloneAssessmentEntrySuccess
  | StandaloneAssessmentEntryFailure;

function isOrchestratorDiagnosis(
  value: unknown,
): value is OrchestratorDiagnosis {
  return (
    typeof value === "string" &&
    (ORCHESTRATOR_DIAGNOSES as readonly string[]).includes(value)
  );
}

function normalizeId(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Plan a standalone assessment for an explicit ASSESS request.
 * Pure relative to adapters/activities — only calls existing workflow helpers.
 */
export function runStandaloneAssessmentEntry(
  input: StandaloneAssessmentEntryInput,
): StandaloneAssessmentEntryResult {
  const learnerId = normalizeId(input.learnerId);
  const conceptId = normalizeId(input.conceptId);
  if (!learnerId || !conceptId) {
    return { ok: false, code: "invalid_request" };
  }

  if (input.intent === undefined) {
    return { ok: false, code: "assessment_intent_required" };
  }

  const intent = parseLearningIntent(input.intent);
  if (!intent) {
    return { ok: false, code: "invalid_assessment_intent" };
  }

  if (intent.purpose !== "ASSESS") {
    return { ok: false, code: "invalid_assessment_intent" };
  }

  // Standalone entry is learner-driven — inferred ASSESS (e.g. Tutor EXAM) is not promoted.
  if (intent.source !== "EXPLICIT") {
    return { ok: false, code: "explicit_assess_required" };
  }

  if (!isOrchestratorDiagnosis(input.diagnosis)) {
    return { ok: false, code: "assessment_context_incomplete" };
  }

  const decisionContext = {
    intent,
    conceptId,
    ...(normalizeId(input.learningSpaceId)
      ? { learningSpaceId: normalizeId(input.learningSpaceId) }
      : {}),
  };

  const handoff =
    resolveAssessmentWorkflowHandoff(decisionContext) ??
    ({ purpose: "ASSESS" } satisfies AssessmentWorkflowHandoff);

  const plan = runAssessmentWorkflow({
    learnerId,
    assessmentHandoff: handoff,
    decisionContext,
    diagnosis: input.diagnosis,
    conceptId,
    learningSpaceId: normalizeId(input.learningSpaceId) || null,
    adaptive: input.adaptive ?? null,
  });

  const result: StandaloneAssessmentEntrySuccess = {
    ok: true,
    plan,
    handoff,
  };

  if (input.adaptive != null || plan.adaptive != null) {
    result.adaptiveBinding = bindAssessmentPlanToAdaptiveStep(
      plan,
      input.adaptive ?? plan.adaptive,
      { expectedConceptId: conceptId },
    );
  }

  return result;
}

/** Exported for tests — binding shape documentation. */
export type { AssessmentAdaptiveStepBinding };

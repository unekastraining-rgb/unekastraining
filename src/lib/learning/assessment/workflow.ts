/**
 * Phase 2G-36 — Assessment Workflow stub (planning boundary).
 * Phase 2G-37 — integrates assessment-mode policy (still no activity execution).
 *
 * Consumes the 2G-34 assessment handoff and returns an AssessmentPlan.
 * Does not select activities/adapters, execute assessments, or write evidence.
 */

import {
  resolveAssessmentMode,
  ASSESSMENT_MODES,
  type AssessmentMode,
} from "@/lib/learning/assessment/assessment-mode-policy";
import type { AssessmentWorkflowHandoff } from "@/lib/learning/orchestrator/assessment-handoff";
import type { LearningDecisionContext } from "@/lib/learning/orchestrator/context";
import type { OrchestratorDiagnosis } from "@/lib/learning/orchestrator/diagnose";
import type {
  LearningObjectTypeName,
  MasteryFacetName,
} from "@/lib/learning/types";

export { ASSESSMENT_MODES, type AssessmentMode };

export const ASSESSMENT_PLAN_STATUSES = [
  "ready",
  "blocked",
  "deferred",
] as const;
export type AssessmentPlanStatus = (typeof ASSESSMENT_PLAN_STATUSES)[number];

/**
 * Optional Adaptive Sequence refs — context only (not modified).
 */
export type AssessmentWorkflowAdaptiveContext = {
  runId: string;
  stepIndex: number;
};

/**
 * Minimal workflow entry — composes existing Orchestrator / handoff types.
 */
export type AssessmentWorkflowRequest = {
  learnerId: string;
  assessmentHandoff: AssessmentWorkflowHandoff | null | undefined;
  decisionContext?: LearningDecisionContext | null;
  diagnosis: OrchestratorDiagnosis;
  conceptId: string;
  learningSpaceId?: string | null;
  adaptive?: AssessmentWorkflowAdaptiveContext | null;
  /**
   * Optional override. When omitted, 2G-37 policy derives the mode.
   * Callers must not use this to invent Quiz/adapter selection.
   */
  assessmentMode?: AssessmentMode;
};

/**
 * Assessment plan — not an assessment result.
 * Activity/adapter fields stay unset until later phases.
 * Optional `adaptive` is context only (2G-39); does not mutate a run.
 */
export type AssessmentPlan = {
  status: AssessmentPlanStatus;
  assessmentMode?: AssessmentMode;
  conceptId: string;
  targetFacets?: MasteryFacetName[];
  activityType?: LearningObjectTypeName;
  adapterKey?: string;
  blockReason?: string;
  /** Optional Adaptive Sequence refs — passive context for 2G-39 bridge. */
  adaptive?: AssessmentWorkflowAdaptiveContext;
};

function isCanonicalAssessHandoff(
  handoff: AssessmentWorkflowHandoff | null | undefined,
): handoff is AssessmentWorkflowHandoff {
  return (
    handoff != null &&
    typeof handoff === "object" &&
    handoff.purpose === "ASSESS"
  );
}

function normalizeConceptId(conceptId: string): string {
  return typeof conceptId === "string" ? conceptId.trim() : "";
}

function normalizeLearnerId(learnerId: string): string {
  return typeof learnerId === "string" ? learnerId.trim() : "";
}

/**
 * Plan an assessment from an ASSESS handoff.
 * Pure: no I/O, no Quiz, no evidence/mastery side effects.
 *
 * Valid ASSESS + resolvable mode → ready plan with assessmentMode.
 * Mode unresolved → deferred. Missing/malformed handoff or ids → blocked.
 */
export function runAssessmentWorkflow(
  request: AssessmentWorkflowRequest,
): AssessmentPlan {
  const conceptId = normalizeConceptId(request.conceptId);
  const learnerId = normalizeLearnerId(request.learnerId);

  if (!isCanonicalAssessHandoff(request.assessmentHandoff)) {
    return {
      status: "blocked",
      conceptId: conceptId || request.conceptId || "",
      blockReason: "assessment_handoff_required",
    };
  }

  if (!learnerId) {
    return {
      status: "blocked",
      conceptId: conceptId || "",
      blockReason: "learner_id_required",
    };
  }

  if (!conceptId) {
    return {
      status: "blocked",
      conceptId: "",
      blockReason: "concept_id_required",
    };
  }

  // Caller override wins; otherwise derive from diagnosis + intent source.
  const assessmentMode =
    request.assessmentMode ??
    resolveAssessmentMode({
      diagnosis: request.diagnosis,
      intentSource: request.decisionContext?.intent?.source,
    });

  void request.learningSpaceId;

  if (!assessmentMode) {
    return {
      status: "deferred",
      conceptId,
    };
  }

  const plan: AssessmentPlan = {
    status: "ready",
    assessmentMode,
    conceptId,
    // activityType / adapterKey / targetFacets remain unset (selection is later phases).
  };

  const adaptive = normalizeOptionalAdaptive(request.adaptive);
  if (adaptive) {
    plan.adaptive = adaptive;
  }

  return plan;
}

/** Attach only well-formed adaptive refs; invalid refs are omitted (standalone still valid). */
function normalizeOptionalAdaptive(
  adaptive?: AssessmentWorkflowAdaptiveContext | null,
): AssessmentWorkflowAdaptiveContext | undefined {
  if (adaptive == null) return undefined;
  const runId =
    typeof adaptive.runId === "string" ? adaptive.runId.trim() : "";
  if (!runId) return undefined;
  if (
    typeof adaptive.stepIndex !== "number" ||
    !Number.isFinite(adaptive.stepIndex) ||
    adaptive.stepIndex < 0
  ) {
    return undefined;
  }
  return { runId, stepIndex: Math.floor(adaptive.stepIndex) };
}

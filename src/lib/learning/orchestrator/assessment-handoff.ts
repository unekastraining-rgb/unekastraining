/**
 * Phase 2G-34 — Assessment Workflow handoff seam.
 *
 * Metadata only: signals that an ASSESS LearningIntent may be routed to the
 * future Assessment Workflow. Does not select adapters, activities, or Quiz.
 */

import type { LearningDecisionContext } from "@/lib/learning/orchestrator/context";

/**
 * Minimal handoff: ASSESS purpose only.
 * Generic enough for Quiz, coding, SQL, lab, simulation, writing, presentation,
 * and future domain assessments — none of which are selected here.
 */
export type AssessmentWorkflowHandoff = {
  /** Learner purpose — never an activity type or diagnosis. */
  purpose: "ASSESS";
};

/**
 * Derive handoff from canonical LearningDecisionContext only.
 * Does not infer ASSESS from mastery, diagnosis, or history.
 */
export function resolveAssessmentWorkflowHandoff(
  decisionContext?: LearningDecisionContext | null,
): AssessmentWorkflowHandoff | undefined {
  if (decisionContext?.intent?.purpose === "ASSESS") {
    return { purpose: "ASSESS" };
  }
  return undefined;
}

/**
 * Attach assessmentHandoff when decisionContext carries ASSESS intent.
 * Leaves diagnosis, intervention, and other fields untouched.
 */
export function withAssessmentWorkflowHandoff<
  T extends {
    decisionContext?: LearningDecisionContext;
    assessmentHandoff?: AssessmentWorkflowHandoff;
  },
>(value: T): T {
  const assessmentHandoff = resolveAssessmentWorkflowHandoff(
    value.decisionContext,
  );
  if (!assessmentHandoff) return value;
  return { ...value, assessmentHandoff };
}

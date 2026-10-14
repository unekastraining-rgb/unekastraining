/**
 * Phase 2G-37 — Assessment mode policy (pure, deterministic).
 *
 * Maps Orchestrator diagnosis + ASSESS intent source → workflow-local mode.
 * Does not modify diagnosis, select adapters/Quiz, or invent mastery thresholds.
 */

import type { LearningIntentSource } from "@/lib/learning/intent/types";
import type { OrchestratorDiagnosis } from "@/lib/learning/orchestrator/diagnose";

export const ASSESSMENT_MODES = [
  "DIAGNOSTIC",
  "VERIFICATION",
  "PRACTICE_CHECK",
] as const;

export type AssessmentMode = (typeof ASSESSMENT_MODES)[number];

export type ResolveAssessmentModeInput = {
  diagnosis: OrchestratorDiagnosis;
  /**
   * From canonical LearningIntent.source when present.
   * Absent / unknown → treated conservatively (never as EXPLICIT).
   */
  intentSource?: LearningIntentSource | null;
};

/**
 * Derive workflow-local assessment mode.
 * Returns null only if diagnosis is unrecognized (caller should defer).
 *
 * Intent purpose remains ASSESS; this answers which *kind* of assessment.
 */
export function resolveAssessmentMode(
  input: ResolveAssessmentModeInput,
): AssessmentMode | null {
  const isExplicit = input.intentSource === "EXPLICIT";

  switch (input.diagnosis) {
    case "UNDERSTANDING_GAP":
      // Discover weakness — not certification.
      return "DIAGNOSTIC";

    case "APPLICATION_GAP":
      // Diagnostic / practice-oriented; do not assume Quiz or verification.
      return "DIAGNOSTIC";

    case "RECALL_GAP":
    case "RETENTION_GAP":
      return "PRACTICE_CHECK";

    case "INSUFFICIENT_EVIDENCE":
      // Safety: never VERIFICATION merely because the learner asked to assess.
      return "DIAGNOSTIC";

    case "NO_INTERVENTION":
      // Strongest signal for verification — only when ASSESS is EXPLICIT.
      return isExplicit ? "VERIFICATION" : "PRACTICE_CHECK";

    default:
      return null;
  }
}

/**
 * 2P-29 — Decision precedence (no scoring / ranking engine).
 *
 * 1. Canonical mastery / evidence
 * 2. Existing Orchestrator diagnosis
 * 3. Explicit learner intent (soft prefer among legal interventions)
 * 4. LearningSpace / material context (explain situation)
 * 5. Presentation preferences (Teaching Style, a11y)
 *
 * Presentation never overrides diagnosis.
 */

export const LEARNER_CONTEXT_PRECEDENCE = [
  "canonical_mastery_evidence",
  "orchestrator_diagnosis",
  "explicit_intent",
  "learning_space_material",
  "presentation_preferences",
] as const;

export type LearnerContextPrecedenceStep =
  (typeof LEARNER_CONTEXT_PRECEDENCE)[number];

export function learnerContextPrecedenceSummary(): {
  steps: readonly LearnerContextPrecedenceStep[];
  presentationNeverOverridesDiagnosis: true;
  noPersonalizationScore: true;
  orchestratorRemainsAuthoritative: true;
} {
  return {
    steps: LEARNER_CONTEXT_PRECEDENCE,
    presentationNeverOverridesDiagnosis: true,
    noPersonalizationScore: true,
    orchestratorRemainsAuthoritative: true,
  };
}

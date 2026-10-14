/**
 * Phase 2G-80 — Universal Learning Decision Loop contract (documentation + guards).
 *
 * Not a second Orchestrator. Not a second Learner Model.
 * Makes the canonical decision pipeline explicit and testable.
 */

export const DECISION_LOOP_STAGES = [
  "canonical_learner_state",
  "canonical_evidence",
  "learning_decision_context",
  "intent",
  "diagnosis",
  "legal_intervention_set",
  "intent_preference",
  "activity_capability_selection",
  "activity_or_six",
  "evidence",
  "mastery_update",
  "re_orchestrate",
] as const;

export type DecisionLoopStage = (typeof DECISION_LOOP_STAGES)[number];

/** Canonical Orchestrator diagnoses — do not redesign in 2G-80. */
export const PRESERVED_ORCHESTRATOR_DIAGNOSES = [
  "UNDERSTANDING_GAP",
  "APPLICATION_GAP",
  "RECALL_GAP",
  "RETENTION_GAP",
  "INSUFFICIENT_EVIDENCE",
  "NO_INTERVENTION",
] as const;

/**
 * Producer → evidence → mastery → learner model → Orchestrator.
 * CLOSED producers only; adapters/binds are consumers.
 */
export const DECISION_LOOP_PRODUCER_CONSUMER_MATRIX = [
  {
    producer: "quiz",
    evidence: "recordQuizAttemptEvidence",
    mastery: "applyEvidenceToMastery",
    learnerModel: "getLearnerConceptMastery",
    orchestrator: "orchestrateForConcept",
  },
  {
    producer: "flashcard",
    evidence: "recordFlashcardReviewEvidence",
    mastery: "applyEvidenceToMastery",
    learnerModel: "getLearnerConceptMastery",
    orchestrator: "orchestrateForConcept",
  },
  {
    producer: "study_evaluate",
    evidence: "recordStudyEvaluateEvidence",
    mastery: "applyEvidenceToMastery",
    learnerModel: "getLearnerConceptMastery",
    orchestrator: "orchestrateForConcept",
  },
  {
    producer: "coding",
    evidence: "recordAuthoritativeActivityEvidence",
    mastery: "applyEvidenceToMastery",
    learnerModel: "getLearnerConceptMastery",
    orchestrator: "orchestrateForConcept",
  },
  {
    producer: "sql",
    evidence: "recordAuthoritativeActivityEvidence",
    mastery: "applyEvidenceToMastery",
    learnerModel: "getLearnerConceptMastery",
    orchestrator: "orchestrateForConcept",
  },
  {
    producer: "structured_activities",
    evidence: "recordAuthoritativeActivityEvidence",
    mastery: "applyEvidenceToMastery",
    learnerModel: "getLearnerConceptMastery",
    orchestrator: "orchestrateForConcept",
  },
  {
    producer: "tutor_authorized",
    evidence: "maybeRecordTutorEvidence",
    mastery: "applyEvidenceToMastery",
    learnerModel: "getLearnerConceptMastery",
    orchestrator: "orchestrateForConcept",
  },
  {
    producer: "lucky_retention",
    evidence: "submitRetentionReview",
    mastery: "applyEvidenceToMastery",
    learnerModel: "getLearnerConceptMastery",
    orchestrator: "orchestrateForConcept",
  },
] as const;

export const DECISION_LOOP_INVARIANTS = {
  diagnosisReadsCanonicalMastery: true,
  intentIsSoftPreference: true,
  activityAvailabilityDoesNotManufactureDiagnosis: true,
  activitySelectionAfterDiagnosis: true,
  activitySelectionDoesNotMutateMastery: true,
  coordinatorDoesNotWriteEvidenceOrMastery: true,
  reOrchestrationReReadsConceptMastery: true,
  projectLearnerConceptStateIsNotOrchestratorInput: true,
  sixRemainsBaselineCatalog: true,
  assessIsSeparateLane: true,
  noMasteryCache: true,
  deterministicGivenIdenticalInputs: true,
} as const;

/** Adaptive-ready vs product-ready (2G-72/73; Writing 2P-18; Game/Project 2P-30). */
export const ADAPTIVE_READY_ACTIVITY_KEYS = [
  "coding",
  "sql",
  "math",
  "networking",
  "language",
  "lab",
  "simulation",
  "presentation",
  "writing",
  "game",
  "project",
] as const;

/** Intentionally empty after 2P-30 — all universal product activities are Adaptive-ready. */
export const PRODUCT_READY_NOT_ADAPTIVE_KEYS = [] as const;

export function decisionLoopSummary(): {
  stages: typeof DECISION_LOOP_STAGES;
  invariants: typeof DECISION_LOOP_INVARIANTS;
  reOrchestrationEntry: "orchestrateForConcept";
  masteryWrite: "applyEvidenceToMastery";
  evidenceWrite: "recordEvidence";
} {
  return {
    stages: DECISION_LOOP_STAGES,
    invariants: DECISION_LOOP_INVARIANTS,
    reOrchestrationEntry: "orchestrateForConcept",
    masteryWrite: "applyEvidenceToMastery",
    evidenceWrite: "recordEvidence",
  };
}

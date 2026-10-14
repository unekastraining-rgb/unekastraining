/**
 * Phase 2G-79 — LearningAttempt producer inventory (documentation + guards).
 *
 * Single write primitive: `recordEvidence` → `LearningAttempt`.
 * Canonical mastery update: `applyEvidenceToMastery` → `ConceptMastery`.
 *
 * Do not add producers here without an actual write path.
 */

export type EvidenceProducerClosure =
  | "CLOSED"
  | "PARTIAL"
  | "INTENTIONALLY_OUTSIDE";

export type EvidenceProducerId =
  | "quiz"
  | "flashcard"
  | "study_evaluate"
  | "tutor"
  | "lucky_retention"
  | "coding"
  | "sql"
  | "writing"
  | "lab"
  | "simulation"
  | "game"
  | "project"
  | "presentation"
  | "assessment_adapters"
  | "adaptive_bind"
  | "core"
  | "hub_bridge"
  | "public_tutor_api"
  | "legacy_code_evaluate"
  | "adaptive_run_cursor"
  | "orchestrator_diagnose"
  | "open_activity"
  | "view_notes"
  | "open_quiz"
  | "browse_assignments";

export type EvidenceProducerSpec = {
  id: EvidenceProducerId;
  label: string;
  closure: EvidenceProducerClosure;
  /** Primary MasteryFacet(s) written when CLOSED. */
  facets: readonly string[];
  /** Module path of the write (or consume) boundary. */
  boundary: string;
  notes: string;
};

/**
 * Inventory of LearningAttempt writers and intentional non-writers.
 * CLOSED entries all converge on recordEvidence → ConceptMastery (when conceptId present).
 */
export const LEARNING_ATTEMPT_PRODUCERS: readonly EvidenceProducerSpec[] = [
  {
    id: "quiz",
    label: "Quiz submit",
    closure: "CLOSED",
    facets: ["RECOGNIZE"],
    boundary: "assessment/quiz-bridge.ts → recordQuizAttemptEvidence",
    notes: "Also dual-writes TopicMastery via updateMasteryFromQuiz.",
  },
  {
    id: "flashcard",
    label: "Flashcard review",
    closure: "CLOSED",
    facets: ["RETAIN"],
    boundary: "assessment/flashcard-bridge.ts → recordFlashcardReviewEvidence",
    notes: "Requires topicId; dual-writes TopicMastery.",
  },
  {
    id: "study_evaluate",
    label: "SIX / Teach-me / Blurting (Study Evaluate)",
    closure: "CLOSED",
    facets: ["RECOGNIZE", "EXPLAIN", "APPLY", "RETAIN"],
    boundary: "assessment/evaluate-bridge.ts → recordStudyEvaluateEvidence",
    notes: "Facet mapped by mode/technique; dual-writes TopicMastery.",
  },
  {
    id: "tutor",
    label: "Tutor (server-authorized)",
    closure: "CLOSED",
    facets: ["EXPLAIN", "APPLY", "SOLVE"],
    boundary: "tutor/evidence.ts → maybeRecordTutorEvidence",
    notes: "Public /api/study/tutor never authorizes writes.",
  },
  {
    id: "lucky_retention",
    label: "Lucky retention review",
    closure: "CLOSED",
    facets: ["RETAIN"],
    boundary: "retention/review.ts → submitRetentionReview",
    notes: "Mastery skipped when RetentionItem.conceptId is null.",
  },
  {
    id: "coding",
    label: "Coding challenge",
    closure: "CLOSED",
    facets: ["PERFORM"],
    boundary: "activities/coding/service.ts → submitCodingChallenge",
    notes: "Via recordAuthoritativeActivityEvidence; no TopicMastery.",
  },
  {
    id: "sql",
    label: "SQL challenge",
    closure: "CLOSED",
    facets: ["PERFORM"],
    boundary: "activities/sql/service.ts → submitSqlChallenge",
    notes: "Via recordAuthoritativeActivityEvidence; no TopicMastery.",
  },
  {
    id: "writing",
    label: "Writing structured",
    closure: "CLOSED",
    facets: ["EXPLAIN"],
    boundary: "activities/structured/service.ts",
    notes: "Shared authoritative spine.",
  },
  {
    id: "lab",
    label: "Lab structured",
    closure: "CLOSED",
    facets: ["PERFORM"],
    boundary: "activities/structured/service.ts",
    notes: "Shared authoritative spine.",
  },
  {
    id: "simulation",
    label: "Simulation structured",
    closure: "CLOSED",
    facets: ["APPLY", "SOLVE", "EXPLAIN"],
    boundary: "activities/structured/service.ts",
    notes:
      "Shared authoritative spine; challenges may write APPLY, SOLVE, or EXPLAIN (incl. educational market).",
  },
  {
    id: "game",
    label: "Game structured",
    closure: "CLOSED",
    facets: ["RECOGNIZE"],
    boundary: "activities/structured/service.ts",
    notes: "Shared authoritative spine.",
  },
  {
    id: "project",
    label: "Project structured",
    closure: "CLOSED",
    facets: ["APPLY"],
    boundary: "activities/structured/service.ts",
    notes: "Shared authoritative spine.",
  },
  {
    id: "presentation",
    label: "Presentation structured",
    closure: "CLOSED",
    facets: ["PERFORM"],
    boundary: "activities/structured/service.ts",
    notes: "Shared authoritative spine.",
  },
  {
    id: "assessment_adapters",
    label: "Assessment adapters / launch",
    closure: "INTENTIONALLY_OUTSIDE",
    facets: [],
    boundary: "assessment/* adapters",
    notes: "Consume or prepare activities; do not create LearningAttempts on launch.",
  },
  {
    id: "adaptive_bind",
    label: "Adaptive completion bind",
    closure: "PARTIAL",
    facets: [],
    boundary: "sequence/*-adapter.ts / activities/adaptive-bind.ts",
    notes: "Binds after an attempt exists; never creates LearningAttempt.",
  },
  {
    id: "core",
    label: "CORE notes / knowledge bridge",
    closure: "INTENTIONALLY_OUTSIDE",
    facets: [],
    boundary: "orchestrator/core-adaptive-bridge.ts",
    notes: "May start Adaptive; does not write evidence itself.",
  },
  {
    id: "hub_bridge",
    label: "Hub adaptive bridge",
    closure: "INTENTIONALLY_OUTSIDE",
    facets: [],
    boundary: "orchestrator/hub-adaptive-bridge.ts",
    notes: "Entry routing only.",
  },
  {
    id: "public_tutor_api",
    label: "Public Tutor API",
    closure: "INTENTIONALLY_OUTSIDE",
    facets: [],
    boundary: "app/api/study/tutor/route.ts",
    notes: "Forces evidenceIntent none; evidenceAuthorizedByServer false.",
  },
  {
    id: "legacy_code_evaluate",
    label: "Legacy code-evaluate",
    closure: "PARTIAL",
    facets: [],
    boundary: "app/api/study/code-evaluate/route.ts",
    notes: "TopicMastery only — not ULE LearningAttempt spine.",
  },
  {
    id: "adaptive_run_cursor",
    label: "AdaptiveSequenceRun",
    closure: "INTENTIONALLY_OUTSIDE",
    facets: [],
    boundary: "sequence/service.ts",
    notes: "Progression cursor only; not mastery.",
  },
  {
    id: "orchestrator_diagnose",
    label: "Orchestrator diagnose",
    closure: "INTENTIONALLY_OUTSIDE",
    facets: [],
    boundary: "orchestrator/diagnose.ts",
    notes: "Read-only decisioning.",
  },
  {
    id: "open_activity",
    label: "Open activity / launch",
    closure: "INTENTIONALLY_OUTSIDE",
    facets: [],
    boundary: "UI navigation",
    notes: "Launch ≠ evidence.",
  },
  {
    id: "view_notes",
    label: "View / edit notes",
    closure: "INTENTIONALLY_OUTSIDE",
    facets: [],
    boundary: "CORE UI",
    notes: "Content management.",
  },
  {
    id: "open_quiz",
    label: "Open saved Quiz",
    closure: "INTENTIONALLY_OUTSIDE",
    facets: [],
    boundary: "Quiz UI",
    notes: "Open ≠ submit evidence.",
  },
  {
    id: "browse_assignments",
    label: "Browse assignments",
    closure: "INTENTIONALLY_OUTSIDE",
    facets: [],
    boundary: "Hub AssignmentsTab",
    notes: "Content / management navigation.",
  },
] as const;

export function listClosedEvidenceProducers(): EvidenceProducerSpec[] {
  return LEARNING_ATTEMPT_PRODUCERS.filter((p) => p.closure === "CLOSED");
}

export function listPartialEvidenceProducers(): EvidenceProducerSpec[] {
  return LEARNING_ATTEMPT_PRODUCERS.filter((p) => p.closure === "PARTIAL");
}

export function listOutsideEvidenceProducers(): EvidenceProducerSpec[] {
  return LEARNING_ATTEMPT_PRODUCERS.filter(
    (p) => p.closure === "INTENTIONALLY_OUTSIDE",
  );
}

/** Facets with at least one CLOSED producer in-repo. */
export const FACET_PRODUCER_COVERAGE = {
  RECOGNIZE: ["quiz", "game", "study_evaluate"] as const,
  EXPLAIN: ["study_evaluate", "writing", "tutor", "simulation"] as const,
  APPLY: ["study_evaluate", "simulation", "project", "tutor"] as const,
  SOLVE: ["tutor", "simulation"] as const,
  PERFORM: [
    "coding",
    "sql",
    "lab",
    "presentation",
    "networking",
    "language",
  ] as const,
  RETAIN: ["flashcard", "study_evaluate", "lucky_retention"] as const,
} as const;

/**
 * PERFORM evidence exists; Orchestrator has no PERFORM_GAP diagnosis.
 * 2P-45 soft-prefers performCapable under APPLICATION_GAP when perform is weak.
 */
export const PERFORM_COVERAGE_LIMITATION = {
  producersExist: true,
  orchestratorPerformGap: false,
  softPreferPerformCapable: true,
  note: "PERFORM evidence updates ConceptMastery.perform; diagnosis does not emit PERFORM_GAP.",
} as const;

export const CANONICAL_EVIDENCE_WRITE = "recordEvidence" as const;
export const CANONICAL_MASTERY_APPLY = "applyEvidenceToMastery" as const;
export const CANONICAL_ULE_MASTERY = "ConceptMastery" as const;
export const LEGACY_TOPIC_PROGRESS = "TopicMastery" as const;

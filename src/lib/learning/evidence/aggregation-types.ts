export type EvidenceOutcomeNameForAggregation =
  | "SUCCESS"
  | "PARTIAL"
  | "FAIL"
  | "ABANDONED";

export type MasteryFacetNameForAggregation =
  | "RECOGNIZE"
  | "EXPLAIN"
  | "APPLY"
  | "SOLVE"
  | "PERFORM"
  | "RETAIN";

export type RepeatedFailureStrength = "none" | "possible" | "strong";

export type FacetOutcomeAggregate = {
  attemptCount: number;
  successCount: number;
  partialCount: number;
  failCount: number;
  abandonedCount: number;
  latestOutcome: EvidenceOutcomeNameForAggregation | null;
};

/** Source buckets derived from LearningAttempt.sourceRefJson.kind */
export type EvidenceSourceAggregateCounts = {
  quiz: number;
  flashcard: number;
  study_evaluate: number;
  tutor: number;
  lucky: number;
  /** Coding / SQL / structured activity challenge submits (2G-79). */
  activity: number;
  other: number;
};

export type MisconceptionSignalAggregate = {
  signal: string;
  count: number;
};

/**
 * Additive evidence-intelligence summary derived from LearningAttempt rows.
 * Not a diagnosis. Not a second mastery score.
 */
export type EvidenceSignals = {
  totalAttempts: number;
  recentAttempts: number;
  successCount: number;
  partialCount: number;
  failCount: number;
  abandonedCount: number;
  recentFailCount: number;
  recentSuccessCount: number;
  repeatedFailure: RepeatedFailureStrength;
  misconceptionSignals: MisconceptionSignalAggregate[];
  facetOutcomes: Record<MasteryFacetNameForAggregation, FacetOutcomeAggregate>;
  sourceCounts: EvidenceSourceAggregateCounts;
  lastAttemptAt: string | null;
  lastSuccessfulAttemptAt: string | null;
  lastFailedAttemptAt: string | null;
};

export type AttemptRowForAggregation = {
  outcome: EvidenceOutcomeNameForAggregation | string;
  skillFacet: MasteryFacetNameForAggregation | string;
  sourceRefJson: string;
  misconceptionSignalsJson: string;
  createdAt: Date;
};

/**
 * Isolated policy for Phase 2F-2 evidence aggregation.
 * Tunable later without changing Orchestrator diagnosis thresholds or mastery math.
 */
export const EVIDENCE_AGGREGATION_POLICY = {
  /** Max LearningAttempt rows fetched per concept (newest first). */
  maxAttemptsFetched: 50,
  /** Max attempts considered "recent" (among those inside the time window). */
  recentAttemptLimit: 10,
  /** Only attempts within this many days can be "recent". */
  recentWindowDays: 30,
  /** Minimum recent FAILs for a "possible" repeated-failure signal. */
  repeatedFailurePossibleMinFails: 2,
  /** Minimum recent FAILs for a "strong" repeated-failure signal. */
  repeatedFailureStrongMinFails: 3,
  /** Minimum consecutive FAILs from the newest attempt for "strong". */
  repeatedFailureStrongMinStreak: 2,
  /** Max distinct misconception tags returned. */
  maxMisconceptionSignals: 5,
} as const;

/**
 * Phase 4A — Learner State Foundation types.
 *
 * Learning Evidence = an observation of something the learner actually did.
 * Learner Concept State = current derived state for a Knowledge Library concept.
 *
 * Concept IDs are Knowledge Library IDs (e.g. java-arraylist), NOT Prisma Concept cuids.
 * This layer records what happened; it does NOT decide what happens next.
 */

/** Evidence types grounded in existing Study Haul Learn activities. */
export type LearningEvidenceType =
  | "lesson_exposure"
  | "practice_attempt"
  | "check_attempt"
  | "recall_result"
  /** Six detailed-explanation / Feynman evaluate submissions. */
  | "explanation_attempt"
  /** Six visualization evaluate submissions. */
  | "visualization_attempt"
  /** Six hands-on-practice evaluate submissions (application-focused). */
  | "application_attempt";

export type LearningEvidenceOutcome =
  | "correct"
  | "incorrect"
  | "completed"
  | "attempted";

/**
 * A single historical learning observation.
 * Does not store raw answer content or sensitive personal attributes.
 */
export interface LearningEvidence {
  id: string;
  userId: string;
  type: LearningEvidenceType;
  /** Knowledge Library concept id when resolved; omit when unmapped. */
  conceptId?: string;
  domain?: string;
  subject?: string;
  outcome?: LearningEvidenceOutcome;
  occurredAt: Date;
  /** Producer surface (e.g. six-lesson, study-evaluate, lucky-adapter). */
  source?: string;
  /**
   * Optional stable key for idempotent recording.
   * Same (userId, eventKey) must not double-count.
   */
  eventKey?: string;
  metadata?: Record<string, unknown>;
}

/** Input for recording evidence (id / occurredAt may be assigned by the service). */
export type LearningEvidenceInput = Omit<
  LearningEvidence,
  "id" | "occurredAt"
> & {
  id?: string;
  occurredAt?: Date;
};

/**
 * Current derived state of a learner for one Knowledge Library concept.
 * Counts are evidence-backed only — no invented mastery thresholds.
 */
export interface LearnerConceptState {
  userId: string;
  conceptId: string;
  exposureCount: number;
  attemptCount: number;
  correctCount: number;
  incorrectCount: number;
  lastSeenAt?: Date;
  lastOutcome?: LearningEvidenceOutcome | string;
}

/** Aggregate learner state across concepts (Phase 4A read surface). */
export interface LearnerState {
  userId: string;
  concepts: LearnerConceptState[];
}

export type RecordLearningEvidenceResult =
  | {
      recorded: true;
      evidence: LearningEvidence;
      /** Updated concept state when evidence mapped to a valid concept. */
      conceptState: LearnerConceptState | null;
      duplicate: boolean;
    }
  | {
      recorded: false;
      reason: string;
      evidence?: LearningEvidence;
      conceptState?: LearnerConceptState | null;
    };

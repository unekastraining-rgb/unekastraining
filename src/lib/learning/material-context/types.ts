/**
 * 2P-28 — Optional learning material context (display / provenance only).
 * Context ≠ Evidence ≠ Mastery.
 */

export type LearningMaterialProvenance = {
  /** Learner-facing citation, e.g. "Source: Chapter 11 — Inheritance" */
  label: string;
  section?: string | null;
  /** Page as string — never invent numbers. */
  page?: string | null;
  /** Heading / chapter / anchor when known. */
  anchor?: string | null;
};

/**
 * Serializable, optional, learner-owned source context.
 * Safe to pass between Adaptive / Tutor / Activity as display context only.
 */
export type LearningMaterialContext = {
  materialId: string;
  title: string;
  sourceType?: string | null;
  learningSpaceId?: string | null;
  courseId?: string | null;
  conceptId?: string | null;
  noteId?: string | null;
  /** Extraction quality from 2P-27 prepare. */
  extractionState?: "READY" | "PARTIAL" | "FAILED" | "PROCESSING" | null;
  provenance: LearningMaterialProvenance;
  /** True when content was truncated / partial — do not pretend complete grounding. */
  partial?: boolean;
  /** Additional owned sources for the same concept (not overwritten). */
  relatedSources?: Array<{
    materialId: string;
    title: string;
    provenanceLabel: string;
  }>;
};

/** How the primary context was chosen (deterministic priority). */
export type MaterialContextPrioritySource =
  | "explicit"
  | "activity"
  | "concept"
  | "learning_space"
  | "none";

export type MaterialContextResolution = {
  context: LearningMaterialContext | null;
  prioritySource: MaterialContextPrioritySource;
  /** Creates no LearningAttempt / ConceptMastery. */
  createsEvidence: false;
};

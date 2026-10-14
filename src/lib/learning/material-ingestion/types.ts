/**
 * 2P-27 — Material ingestion → ULE types.
 * Material is a source of learning context — never evidence or mastery.
 */

import type { ContentSourceRef } from "@/lib/learning/content-pipeline/types";
import type { KnowledgeConceptCandidate } from "@/lib/learning/knowledge/core-bridge-types";

/** Learner-visible processing states (no stack traces). */
export type MaterialProcessingState =
  | "UPLOADING"
  | "PROCESSING"
  | "READY"
  | "PARTIAL"
  | "FAILED";

export type MaterialLearningPrepareResult = {
  materialId: string;
  noteId: string;
  courseId: string;
  title: string;
  state: MaterialProcessingState;
  /** Human-readable status for the learner. */
  learnerMessage: string;
  /** True when extract was built without AI. */
  nonAi: boolean;
  /** Truncation / weak extract that still allows review. */
  truncated: boolean;
  source: ContentSourceRef;
  /** Learner-facing citation (not a DB id). */
  provenanceLabel: string;
  knowledgeBridgeEnabled: boolean;
  hasStudyExtract: boolean;
  candidates: KnowledgeConceptCandidate[];
  linkedConceptIds: string[];
  /** When a concept is already linked — ready for Adaptive. */
  focusConceptId: string | null;
};

export type LearnerFacingProvenance = {
  /** e.g. "Source: Java Chapter 11 notes" */
  label: string;
  materialTitle: string;
  section?: string | null;
  page?: string | null;
};

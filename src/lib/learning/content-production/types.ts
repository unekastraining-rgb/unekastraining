/**
 * 2P-15 — Content production readiness types (design + inspection aid).
 *
 * NOT a second content system. These types describe how domain packs fit the
 * existing 2P-7→2P-12 spine without new Prisma models or CMS tables.
 */

import type { UniversalContentActivityKind } from "@/lib/learning/activities/content-contract";
import type { ContentPipelineStatus } from "@/lib/learning/content-pipeline/types";
import type {
  ContentDifficulty,
  LearningContentStage,
} from "@/lib/learning/content-progression/types";

/**
 * Conceptual lifecycle phases for authoring / AI / publishing workflows.
 * Maps onto existing pipeline + progression readiness — no new storage enum.
 */
export type ContentLifecyclePhase =
  | "DRAFT"
  | "VALIDATE"
  | "READY"
  | "AVAILABLE"
  | "RETIRED";

/** Design-time domain pack — groups Concepts + progression without a DB table. */
export type ContentPackDescriptor = {
  packId: string;
  /** Free-form domain label (not a subject enum). */
  domainLabel: string;
  /** Representative concept keys covered by fixtures today or planned. */
  conceptKeys: readonly string[];
  /** Primary activity mechanisms for this pack. */
  primaryActivities: readonly (UniversalContentActivityKind | "six" | "quiz" | "flashcard" | "tutor")[];
  /** Optional pack version token for future imports. */
  packVersion?: string;
};

export type ContentDensityDepth =
  | "NONE"
  | "FIXTURE"
  | "THIN"
  | "MODERATE"
  | "DEEP";

export type ContentDensityRow = {
  domain: string;
  activity: string;
  existingContent: string;
  depth: ContentDensityDepth;
  majorGap: string;
};

export type CatalogIntegrityIssue = {
  code: string;
  message: string;
  /** Optional locator for authors. */
  ref?: string;
};

export type ContentProductionTruthSummary = {
  doesNotCreateSecondContentSystem: true;
  doesNotCreateSecondOrchestrator: true;
  doesNotCreateSecondMastery: true;
  doesNotCreateSecondEvidence: true;
  aiCandidateDoesNotWriteMastery: true;
  educationalMarketIsNotBrokerage: true;
  noGiantSubjectEnum: true;
  noMassContentProductionInThisPhase: true;
};

/** Authoring contract fields — what exists vs optional future metadata. */
export type AuthoringContractFieldStatus =
  | "EXISTING"
  | "PARTIAL"
  | "MISSING"
  | "ACTIVITY_SPECIFIC"
  | "ORCHESTRATOR_OWNED";

export type AuthoringContractAssessment = {
  field: string;
  status: AuthoringContractFieldStatus;
  location: string;
};

export type AiContentCandidateResult =
  | {
      ok: true;
      candidate: true;
      doesNotWriteMastery: true;
      doesNotWriteEvidence: true;
      preparationId: string;
      contentId: string;
      activityKind: UniversalContentActivityKind;
    }
  | {
      ok: false;
      candidate: true;
      doesNotWriteMastery: true;
      issues: readonly { code: string; message: string }[];
    };

export type PackConceptPlan = {
  conceptKey: string;
  conceptTitle: string;
  stages?: readonly LearningContentStage[];
  difficultyRange?: readonly ContentDifficulty[];
};

/** Bridge input for lifecycle resolution — reuses existing status fields. */
export type ContentLifecycleInput = {
  pipelineStatus?: ContentPipelineStatus | null;
  progressionReadiness?: "DRAFT" | "READY" | "PUBLISHED" | "ARCHIVED" | null;
  catalogResolvable?: boolean;
  coverageAvailable?: boolean;
};

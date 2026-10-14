/**
 * 2P-10 — Content coverage types.
 *
 * Content coverage tells the system what learning experiences are actually
 * available. It does not tell the system what the learner needs.
 *
 * Missing content is not missing mastery.
 * Unavailable content must produce a truthful unavailable state, not fabricated content.
 */

import type {
  ContentDifficulty,
  ContentInterventionPreference,
  LearningContentStage,
} from "@/lib/learning/content-progression/types";
import type { UniversalContentActivityKind } from "@/lib/learning/activities/content-contract";

export type ContentCoverageStatus =
  | "AVAILABLE"
  | "INCOMPATIBLE"
  | "UNAVAILABLE"
  | "MISSING";

export type ContentCoverageActivityKind =
  | UniversalContentActivityKind
  | "six";

export type ContentCoverageRequest = {
  /** Normalized concept grouping key (or title — normalized internally). */
  conceptKey: string;
  conceptId?: string | null;
  learnerId?: string | null;
  interventionPreference?: ContentInterventionPreference | null;
  activityKind?: ContentCoverageActivityKind | null;
  /** When set, only these kinds count as compatible. */
  eligibleActivityKinds?: readonly ContentCoverageActivityKind[] | null;
  stage?: LearningContentStage | null;
  /** When true, stage mismatch → not compatible (no soft fallback). */
  requireExactStage?: boolean;
  difficulty?: ContentDifficulty | null;
  /** When true, only exact difficulty counts as compatible. */
  requireExactDifficulty?: boolean;
  contextVariant?: string | null;
  excludeContentKeys?: readonly string[] | null;
  includeSystemAuthored?: boolean;
  /**
   * Runtime unavailable activity kinds (e.g. coding runtime down).
   * Produces UNAVAILABLE when only those remain compatible.
   */
  unavailableActivityKinds?: readonly ContentCoverageActivityKind[] | null;
  /** Runtime unavailable specific content keys. */
  unavailableContentKeys?: readonly string[] | null;
};

export type ContentCoverageResult = {
  status: ContentCoverageStatus;
  candidateCount: number;
  compatibleCount: number;
  availableCount: number;
  selectedContentKey?: string;
  selectedContentId?: string | null;
  selectedActivityKind?: ContentCoverageActivityKind;
  /** True when SIX (or other non-requested) path remains for the Concept. */
  fallbackEligible: boolean;
  reason: string;
};

export type ContentCoverageTruthSummary = {
  coverageIsNotMastery: true;
  coverageDoesNotChangeDiagnosis: true;
  coverageCreatesNoEvidence: true;
  coverageCreatesNoMastery: true;
  noFabricatedContent: true;
  missingIsNotZeroMastery: true;
  unavailableIsNotAvailable: true;
  noLlmGeneration: true;
  sixRemainsSafeFallback: true;
  assessmentRemainsSeparate: true;
  luckyNotCreatedByCoverage: true;
};

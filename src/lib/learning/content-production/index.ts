/**
 * 2P-15 — Universal Content Production & Catalog Readiness (inspection layer).
 *
 * Reuses 2P-7→2P-12 spine. NOT a second content system.
 */

import type { ContentProductionTruthSummary } from "./types";

export type {
  AiContentCandidateResult,
  AuthoringContractAssessment,
  AuthoringContractFieldStatus,
  CatalogIntegrityIssue,
  ContentDensityDepth,
  ContentDensityRow,
  ContentLifecycleInput,
  ContentLifecyclePhase,
  ContentPackDescriptor,
  ContentProductionTruthSummary,
  PackConceptPlan,
} from "./types";

export {
  resolveContentLifecyclePhase,
  isLearnerFacingLifecyclePhase,
  contentLifecycleTruthSummary,
} from "./lifecycle";

export {
  auditCatalogIntegrity,
  catalogIntegrityOk,
} from "./catalog-integrity";

export {
  validateAiContentCandidate,
  aiContentCandidateTruthSummary,
  type ValidateAiContentCandidateInput,
} from "./ai-candidate";

export {
  buildContentDensityMatrix,
  buildAdaptiveCatalogDepthMatrix,
} from "./density-matrix";
export type { CatalogDepthMatrixRow } from "./density-matrix";

export {
  assessAuthoringContractFields,
  authoringContractGaps,
} from "./authoring-contract";

export {
  DESIGN_TIME_CONTENT_PACKS,
  PACK_CONCEPT_PLANS,
  getDesignTimeContentPack,
  listDesignTimeContentPacks,
} from "./pack-model";

export {
  catalogDepthFieldTiers,
  assessAdaptiveReadyCatalogItem,
  adaptiveReadyContractTruthSummary,
} from "./adaptive-ready-contract";
export type {
  AdaptiveReadyCatalogAssessment,
  CatalogDepthFieldTier,
} from "./adaptive-ready-contract";

export {
  contentQualityFieldContract,
  contentQualityApplicabilityForKind,
  contentQualityContractTruthSummary,
} from "./content-quality-contract";
export type {
  ContentQualityFieldApplicability,
  ContentQualityFieldId,
  ContentQualityFieldSpec,
} from "./content-quality-contract";

export {
  validateContentQualityItem,
  auditContentQuality,
  auditContentQualityUnique,
  isMeaningfulSuccessLooksLike,
  isActionableMisconception,
  contentQualityValidationTruthSummary,
} from "./content-quality-validate";

export {
  buildContentDepthDensityReport,
  auditContentDepthSparsity,
  contentDepthReportTruthSummary,
} from "./content-depth-report";
export type {
  ContentDepthDomainRow,
  ContentDepthSparsityFlag,
} from "./content-depth-report";

export {
  ADAPTIVE_CATALOG_SEED_ITEMS,
  listSeedItems,
  listAdaptiveReadySeedAssessments,
  educationalMarketSeedIsNotBrokerage,
} from "./seed-catalog";
export type { SeedCatalogItem } from "./seed-catalog";

export type {
  ContentAccessibilityMeta,
  ContentEnrichmentFields,
  ContentMisconceptionTarget,
} from "./enrichment";

export function contentProductionTruthSummary(): ContentProductionTruthSummary {
  return {
    doesNotCreateSecondContentSystem: true,
    doesNotCreateSecondOrchestrator: true,
    doesNotCreateSecondMastery: true,
    doesNotCreateSecondEvidence: true,
    aiCandidateDoesNotWriteMastery: true,
    educationalMarketIsNotBrokerage: true,
    noGiantSubjectEnum: true,
    noMassContentProductionInThisPhase: true,
  };
}

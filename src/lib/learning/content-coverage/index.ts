/**
 * 2P-10 — Universal Content Coverage & Gap Handling.
 */

export type {
  ContentCoverageStatus,
  ContentCoverageActivityKind,
  ContentCoverageRequest,
  ContentCoverageResult,
  ContentCoverageTruthSummary,
} from "./types";

export {
  evaluateContentAvailability,
  type ContentAvailabilityIssue,
} from "./availability";

export {
  evaluateContentCoverage,
  contentCoverageTruthSummary,
  coverageModuleDoesNotWriteMastery,
  selectedContentResolvesInCatalog,
} from "./evaluate";

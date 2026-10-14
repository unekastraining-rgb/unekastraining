/**
 * LUCKY RetentionItem foundation (Phase 2C + 2P-38 depth).
 * RetentionItem is the retention source of truth; SM-2 remains authoritative for flashcards.
 */

export {
  defaultPriorityForSource,
  nextReviewAtForOutcome,
  resolveSyncedDueAt,
  statusForDueAt,
  longHorizonScheduleTruthSummary,
} from "@/lib/learning/retention/schedule";
export type { UpsertRetentionInput } from "@/lib/learning/retention/schedule";

export {
  classifyRetentionHorizon,
  retentionHorizonLabel,
  retentionContinuityReason,
  longHorizonHorizonTruthSummary,
  RETENTION_UPCOMING_WINDOW_MS,
  RETENTION_OVERDUE_AFTER_MS,
} from "@/lib/learning/retention/horizon";
export type { RetentionHorizonState } from "@/lib/learning/retention/horizon";

export {
  countDueBySource,
  countDueRetentionItems,
  findDueRetentionItems,
  findPriorityRetentionItems,
  recordRetentionOutcome,
  upsertRetentionItem,
} from "@/lib/learning/retention/service";

export {
  syncFlashcardRetentionItem,
  syncMissedQuestionRetentionItem,
  syncRetentionSourcesForUser,
  syncWeakMasteryRetentionItem,
} from "@/lib/learning/retention/bridges";

export {
  getNextRetentionReviewItem,
  submitRetentionReview,
} from "@/lib/learning/retention/review";
export type {
  RetentionReviewInputMode,
  RetentionReviewItemView,
  RetentionReviewSubmitResult,
} from "@/lib/learning/retention/review";

export {
  inferRetentionReason,
  retentionDifficultyForItem,
  selectRetentionCandidates,
  toRetentionCandidate,
} from "@/lib/learning/retention/candidates";
export { retentionReasonLabel } from "@/lib/learning/retention/reason-copy";
export {
  gradeRetentionVariantText,
  listRetentionVariantsForConcept,
  pickRetentionVariant,
  resolveConceptKeyForRetention,
  RETENTION_VARIANTS,
} from "@/lib/learning/retention/variants";
export type {
  RetentionCandidate,
  RetentionDifficulty,
  RetentionReason,
} from "@/lib/learning/retention/types";
export { RETENTION_CANDIDATE_CAP } from "@/lib/learning/retention/types";

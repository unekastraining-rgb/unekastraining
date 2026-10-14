/**
 * 2P-46 — Transfer module exports.
 * Transfer is a property of the universal learning system, not a separate engine.
 */

export {
  parseAttemptContextIdentity,
  extractRecentContextVariants,
  extractRecentContentKeys,
  resolveTransferSelectionHints,
  transferContextIdentityTruthSummary,
  type AttemptContextIdentity,
} from "./context-identity";

export {
  interpretMixedContextEvidence,
  mixedContextEvidenceTruthSummary,
  type MixedContextReading,
  type MixedContextAttemptRow,
} from "./mixed-context";

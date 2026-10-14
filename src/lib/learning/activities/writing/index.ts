/**
 * 2P-18 — Writing → Adaptive Universal Activity Integration
 *
 * Extends existing Writing (structured rubric path). No second writing engine.
 */

export type {
  WritingActivityType,
  WritingAdaptiveActivity,
  WritingAdaptiveContractSummary,
  WritingLearnerArtifact,
  WritingLifecyclePhase,
  WritingScaffoldLevel,
} from "./types";

export {
  WRITING_ADAPTIVE_CONTRACT,
  inferWritingLifecyclePhase,
  writingInteractionIsNotCompletion,
  writingArtifactIntegrityOk,
  writingAdaptiveContractTruthSummary,
} from "./adaptive-contract";

export {
  extractWritingSubmissionFields,
  buildWritingLearnerArtifact,
  resolveLearnerAuthoredText,
  writingArtifactTruthSummary,
} from "./artifact";
export type { WritingSubmissionFields } from "./artifact";

export {
  assertWritingRevisionGate,
  stripWritingCompletionForgery,
  writingRevisionTruthSummary,
} from "./revision";

export {
  WRITING_AI_ALLOWED_USES,
  WRITING_AI_FORBIDDEN_USES,
  separateAiAssistanceFromEvidence,
  writingAiAssistanceBoundaryTruthSummary,
} from "./ai-boundary";

export {
  WRITING_ADAPTIVE_SEED_ACTIVITIES,
  EXISTING_WRITING_ADAPTIVE_META,
  listWritingAdaptiveSeedActivities,
  getWritingAdaptiveActivity,
  getWritingAdaptiveMeta,
  isWritingAdaptiveReadyContent,
  listWritingDomainsCovered,
} from "./catalog";
export type { WritingAdaptiveMeta } from "./catalog";

export { evaluateWritingWork } from "./evaluate";

export {
  writingActivityToStructuredChallenge,
  listWritingAdaptiveStructuredChallenges,
} from "./to-challenge";
export type { WritingStructuredChallengeRow } from "./to-challenge";

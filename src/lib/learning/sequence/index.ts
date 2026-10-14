/**
 * Adaptive sequence run domain (Phase 2G-2 state + Phase 2G-3 coordinator).
 */

export { AdaptiveSequenceRunError } from "@/lib/learning/sequence/errors";
export {
  createAdaptiveSequenceRun,
  getAdaptiveSequenceRun,
  listAdaptiveSequenceRuns,
  updateAdaptiveSequenceRunState,
  updateAdaptiveSequenceRunStateIfCursorMatches,
  completeAdaptiveSequenceRun,
  abandonAdaptiveSequenceRun,
  deleteAdaptiveSequenceRun,
} from "@/lib/learning/sequence/service";
export type {
  AdaptiveSequenceRunView,
  CreateAdaptiveSequenceRunInput,
  UpdateAdaptiveSequenceRunStateInput,
} from "@/lib/learning/sequence/service";

export {
  ADAPTIVE_SEQUENCE_RUN_STATUSES,
  isAdaptiveSequenceRunStatus,
} from "@/lib/learning/sequence/types";
export type {
  AdaptiveSequenceRunStatusName,
  AdaptiveSequenceStep,
  AdaptiveSequenceHistoryEntry,
} from "@/lib/learning/sequence/types";

export {
  parseStepsJson,
  parseInterventionHistoryJson,
  serializeSteps,
  serializeInterventionHistory,
  assertValidCurrentStepIndex,
  isAwaitingNextStep,
} from "@/lib/learning/sequence/json";

export { MAX_SEQUENCE_STEPS } from "@/lib/learning/sequence/policy";

export { AdaptiveSequenceCoordinatorError } from "@/lib/learning/sequence/coordinator-errors";
export type { AdaptiveSequenceCoordinatorErrorCode } from "@/lib/learning/sequence/coordinator-errors";

export {
  startAdaptiveSequenceRun,
  getCurrentAdaptiveSequenceStep,
  recordAdaptiveSequenceCompletion,
  recordAdaptiveSequenceCompletionAndPlanNext,
  getNextAdaptiveIntervention,
  resumeAdaptiveSequenceRun,
  getAdaptiveSequenceLastAttemptPointer,
  listActiveAdaptiveSequenceRuns,
  completeAdaptiveSequence,
  abandonAdaptiveSequence,
} from "@/lib/learning/sequence/coordinator";
export type {
  StartAdaptiveSequenceResult,
  CurrentAdaptiveSequenceStepResult,
  RecordCompletionResult,
  NextInterventionResult,
  PlanNextAdaptiveStepResult,
  ResumeAdaptiveSequenceResult,
} from "@/lib/learning/sequence/coordinator";

export { startOrResumeAdaptiveSequenceForConcept } from "@/lib/learning/sequence/start-or-resume";
export type { StartOrResumeAdaptiveResult } from "@/lib/learning/sequence/start-or-resume";

export { loadAdaptiveRunPageView } from "@/lib/learning/sequence/adaptive-run-page";
export type { AdaptiveRunPageView } from "@/lib/learning/sequence/adaptive-run-page";

export {
  SixAdapterError,
  normalizeSixIntervention,
  isSupportedSixIntervention,
  resolveSixSequenceStep,
  resolveOwnedSixSequenceStep,
  assertSixCompatibleAttempt,
  resolveCurrentSixAdaptiveActivity,
  recordSixAdaptiveSequenceCompletion,
  recordSixAdaptiveSequenceCompletionAndPlanNext,
} from "@/lib/learning/sequence/six-adapter";
export type {
  SixAdapterErrorCode,
  SixEvaluateContract,
  ResolvedSixSequenceActivity,
  SixGuideHrefParams,
  ResolveCurrentSixAdaptiveActivityResult,
} from "@/lib/learning/sequence/six-adapter";

export {
  bindSixEvaluateAttemptToAdaptiveSequence,
  adaptiveEvaluateResponsePayload,
} from "@/lib/learning/sequence/six-evaluate-bind";
export type { AdaptiveEvaluateBindResult } from "@/lib/learning/sequence/six-evaluate-bind";

export {
  QuizAdapterError,
  QUIZ_INTERVENTION,
  normalizeQuizIntervention,
  isSupportedQuizIntervention,
  quizAdaptiveHref,
  resolveQuizSequenceStep,
  findOwnedQuizForConcept,
  resolveOwnedQuizSequenceStep,
  assertQuizCompatibleAttempt,
  recordQuizAdaptiveSequenceCompletion,
  recordQuizAdaptiveSequenceCompletionAndPlanNext,
} from "@/lib/learning/sequence/quiz-adapter";
export type {
  QuizAdapterErrorCode,
  QuizGuideHrefParams,
  ResolvedQuizSequenceActivity,
} from "@/lib/learning/sequence/quiz-adapter";

export {
  bindQuizSubmitToAdaptiveSequence,
  adaptiveQuizResponsePayload,
  isQuizAdaptiveCompletionEligible,
} from "@/lib/learning/sequence/quiz-submit-bind";
export type { AdaptiveQuizBindResult } from "@/lib/learning/sequence/quiz-submit-bind";

export {
  FlashcardAdapterError,
  FLASHCARD_INTERVENTION,
  normalizeFlashcardIntervention,
  isSupportedFlashcardIntervention,
  flashcardAdaptiveHref,
  resolveFlashcardSequenceStep,
  resolveOwnedFlashcardSequenceStep,
  assertFlashcardCompatibleAttempt,
  recordFlashcardAdaptiveSequenceCompletion,
  recordFlashcardAdaptiveSequenceCompletionAndPlanNext,
} from "@/lib/learning/sequence/flashcard-adapter";
export type {
  FlashcardAdapterErrorCode,
  FlashcardGuideHrefParams,
  ResolvedFlashcardSequenceActivity,
} from "@/lib/learning/sequence/flashcard-adapter";

export {
  bindFlashcardReviewToAdaptiveSequence,
  adaptiveFlashcardResponsePayload,
  isFlashcardAdaptiveCompletionEligible,
} from "@/lib/learning/sequence/flashcard-review-bind";
export type { AdaptiveFlashcardBindResult } from "@/lib/learning/sequence/flashcard-review-bind";

export {
  parseAdaptiveRunId,
  parseAdaptiveStepIndex,
  parseAdaptiveLaunchContext,
} from "@/lib/learning/sequence/adaptive-launch-context";
export type { AdaptiveLaunchContext } from "@/lib/learning/sequence/adaptive-launch-context";

export {
  ACTIVITY_ADAPTIVE_COMPLETION_CONTRACTS,
  getActivityAdaptiveCompletionContract,
  isAdaptiveReadyActivityAdapterKey,
  normalizeUniversalActivityIntervention,
  isSupportedUniversalActivityIntervention,
  activityAdaptiveCompletionTruthSummary,
} from "@/lib/learning/sequence/activity-adaptive-completion";
export type { ActivityAdaptiveCompletionContract } from "@/lib/learning/sequence/activity-adaptive-completion";

export {
  ActivityAdapterError,
  universalActivityAdaptiveHref,
  resolveUniversalActivitySequenceStep,
  resolveOwnedUniversalActivitySequenceStep,
  isActivityAdaptiveCompletionEligible,
  bindUniversalActivityAttemptToAdaptiveSequence,
} from "@/lib/learning/sequence/activity-adapter";
export type {
  ActivityAdapterErrorCode,
  ResolvedUniversalActivitySequenceActivity,
  UniversalActivityHrefParams,
} from "@/lib/learning/sequence/activity-adapter";

export type {
  TutorEvidenceIntent,
  TutorModality,
  TutorMode,
  TutorRequest,
  TutorResponse,
  TutorSuggestedAction,
} from "@/lib/learning/tutor/types";
export { isTutorMode, TUTOR_MODES } from "@/lib/learning/tutor/types";

export {
  getTutorModePolicy,
  listTutorModes,
} from "@/lib/learning/tutor/policies";
export type { TutorModePolicy } from "@/lib/learning/tutor/policies";

export { loadTutorContext } from "@/lib/learning/tutor/context";
export type { TutorResolvedContext } from "@/lib/learning/tutor/context";

export {
  facetForTutorEvidence,
  isTutorEvidenceIntent,
  maybeRecordTutorEvidence,
  resolveTutorEvidenceAuthorization,
  shouldRecordTutorEvidence,
  TUTOR_EVIDENCE_MIN_DEMONSTRATION_CHARS,
} from "@/lib/learning/tutor/evidence";
export type { TutorEvidenceAuthorization } from "@/lib/learning/tutor/evidence";

export { runTutor, TutorRequestError } from "@/lib/learning/tutor/service";

export {
  resolveTutorLearningIntent,
  withResolvedTutorLearningIntent,
} from "@/lib/learning/tutor/resolve-intent";

export {
  toTutorRequestFromDemonstration,
  toTutorRequestFromLegacyChat,
} from "@/lib/learning/tutor/facade";
export type { LegacyAiSurface } from "@/lib/learning/tutor/facade";

export { isSixTutorUnifiedEnabled } from "@/lib/learning/tutor/six-feature-flag";
export {
  buildSixTutorInstructionalContext,
  toTutorRequestFromSixTutor,
  SixTutorAdapterError,
} from "@/lib/learning/tutor/six-adapter";

export { isCoreAssistUnifiedEnabled } from "@/lib/learning/tutor/core-feature-flag";
export {
  buildCoreAssistInstructionalContext,
  buildCoreAssistUserPayload,
  parseCoreAssistChatResponse,
  toTutorRequestFromCoreAssist,
  CoreAssistAdapterError,
} from "@/lib/learning/tutor/core-adapter";

export { isTeachMeUnifiedEnabled } from "@/lib/learning/tutor/teach-me-feature-flag";
export {
  buildTeachMeInstructionalContext,
  buildTeachMeUserPayload,
  parseTeachMeEvaluation,
  toTutorRequestFromTeachMe,
  TeachMeAdapterError,
} from "@/lib/learning/tutor/teach-me-adapter";

export {
  TEACHING_STYLES,
  TEACH_ME_LIKE_IM_5_STYLE,
  isTeachingStyle,
  parseTeachingStyle,
  resolveTeachingStyle,
  applyTeachingStyleSwitch,
  getTeachingStylePolicy,
  listTeachingStylePolicies,
  teachMeLikeIm5IsSimplified,
  teachingStyleBoundaryTruthSummary,
  teachingStyleCoexistsWithAccessibility,
  extractTeachingStyleHintFromMessage,
  listTeachingStyleEntryPoints,
  getTeachingStyleEntryPoint,
  teachingStylePropagationTruthSummary,
  TEACHING_STYLE_ENTRY_POINTS,
  TEACHING_STYLE_SESSION_STORAGE_KEY,
  readSessionTeachingStyle,
  writeSessionTeachingStyle,
} from "@/lib/learning/tutor/teaching-style";
export type {
  TeachingStyle,
  TeachingStylePolicy,
  TeachingStyleResolution,
  TeachingStyleBoundarySummary,
  TeachingStyleEntryPoint,
  TeachingStyleEntryStatus,
} from "@/lib/learning/tutor/teaching-style";

export type {
  LanguageActivityMode,
  LanguageChallenge,
  LanguageChallengeScaffold,
  LanguageListenOption,
  LanguageRecordingState,
  LanguageResponseChannel,
  LanguageWorkspaceSubmission,
} from "./types";
export {
  getLanguageChallenge,
  listLanguageChallenges,
  LANGUAGE_CHALLENGES,
} from "./challenges";
export { evaluateLanguageActivity } from "./evaluate";
export { submitLanguageChallenge } from "./service";
export {
  matchesExpectedResponse,
  normalizeLanguageText,
  pickLearnerResponseText,
} from "./normalize";
export {
  describeSpeechCapabilityHonesty,
  type NormalizedSpeechResult,
  type SpeechCapabilitySnapshot,
} from "./speech-capability";
export { LANGUAGE_WORKSPACE_PROGRESSION_ENTRIES } from "./progression";

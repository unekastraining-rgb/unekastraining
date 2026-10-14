/**
 * 2P-19 — Teaching Style module exports.
 */

export type {
  TeachingStyle,
  TeachingStyleBoundarySummary,
  TeachingStyleResolution,
  TeachingStyleResolutionSource,
} from "./types";

export {
  TEACHING_STYLES,
  TEACH_ME_LIKE_IM_5_STYLE,
} from "./types";

export type { TeachingStylePolicy } from "./policies";
export {
  getTeachingStylePolicy,
  listTeachingStylePolicies,
  teachMeLikeIm5IsSimplified,
} from "./policies";

export {
  isTeachingStyle,
  parseTeachingStyle,
  resolveTeachingStyle,
  applyTeachingStyleSwitch,
  teachingStyleBoundaryTruthSummary,
  teachingStyleCoexistsWithAccessibility,
} from "./resolve";

export { extractTeachingStyleHintFromMessage } from "./message-hint";

export {
  TEACHING_STYLE_SESSION_STORAGE_KEY,
  readSessionTeachingStyle,
  writeSessionTeachingStyle,
} from "./session";

export {
  TEACHING_STYLE_ENTRY_POINTS,
  listTeachingStyleEntryPoints,
  getTeachingStyleEntryPoint,
  teachingStylePropagationTruthSummary,
} from "./entry-points";
export type {
  TeachingStyleEntryStatus,
  TeachingStyleEntryPoint,
} from "./entry-points";

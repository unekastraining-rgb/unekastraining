/**
 * Bundle I — Interactive activity runtime (LAF + KL consumers).
 */

export type {
  InteractiveForm,
  InteractiveActivity,
  InteractiveSubmission,
  InteractiveFeedback,
} from "@/lib/learning/activity/runtime/types";

export {
  buildInteractiveActivityForConcept,
  listAvailableInteractiveForms,
  parseEquationFromExample,
} from "@/lib/learning/activity/runtime/build-interactive";

export {
  buildTrueFalseFromConcept,
  buildMultiSelectFromConcept,
  buildMatchingFromConcept,
  buildExtendedInteractiveForm,
} from "@/lib/learning/activity/runtime/build-extended-forms";

export { completeInteractiveActivityForStudio } from "@/lib/learning/activity/runtime/studio-complete";

export {
  evaluateInteractiveSubmission,
  feedbackUsesOnlyAuthoredMisconceptions,
} from "@/lib/learning/activity/runtime/feedback";

export {
  completeInteractiveActivity,
  type ActivityCompletionResult,
} from "@/lib/learning/activity/runtime/complete";

export { selectInteractiveActivityForConcept } from "@/lib/learning/activity/runtime/select";

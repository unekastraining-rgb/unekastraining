/**
 * 2P-12 — Universal Learning Scaffolding.
 */

export type {
  LearningScaffold,
  LearningScaffoldInput,
  LearningScaffoldKind,
  LearningScaffoldLevel,
  LearningScaffoldRevealPolicy,
  LearningScaffoldTruthSummary,
} from "./types";

export {
  normalizeLearningScaffold,
  normalizeLearningScaffolds,
  orderLearningScaffolds,
} from "./normalize";

export {
  projectLearningScaffolds,
  learningScaffoldTruthSummary,
  scaffoldModuleDoesNotWriteEvidence,
  type ActivityScaffoldSource,
  type ProjectLearningScaffoldResult,
} from "./project";

export { projectSuccessLooksLike, type SuccessLooksLikeSource } from "./success";

export { activityScaffoldSourceFromContent } from "./from-content";

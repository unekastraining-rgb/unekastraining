/**
 * Bundle D — Teach Intelligence public surface.
 * Enhances existing Learn/Teach path — not a second architecture.
 */

export {
  detectTeachScope,
  isBroadSubjectTopic,
  minConceptsForTeachScope,
  shouldExpandTeachPath,
  type TeachScope,
} from "@/lib/learning/teach/scope";

export {
  teachingDepthSectionsForScope,
  formatTeachingDepthPromptBlock,
  type TeachingDepthSection,
  type TeachingProgressionView,
} from "@/lib/learning/teach/depth";

export {
  validateTeachPathConcepts,
  dedupeTeachConcepts,
  type TeachPathValidation,
} from "@/lib/learning/teach/validate-path";

export {
  expandRelatedKnowledgeConcepts,
  expandVocabularyTeachingUnits,
  conceptsFromGeneralTeachingKnowledge,
  mergeTeachConceptSequences,
  decomposeTeachConcepts,
  decomposeTeachConceptsDeterministic,
  type DecomposeTeachResult,
} from "@/lib/learning/teach/decompose";

export {
  focusTeachingContextForLesson,
  buildTeachingProgressionView,
  teachingDepthBlockFromProgression,
  resolveTeachFocusConceptId,
} from "@/lib/learning/teach/focus";

export {
  resolveTeachKnowledgeForLearn,
  type ResolveTeachKnowledgeResult,
} from "@/lib/learning/teach/resolve-teach";

export {
  buildAdaptiveTeachingEmphasis,
  formatAdaptiveEmphasisPromptBlock,
  type AdaptiveTeachingEmphasis,
} from "@/lib/learning/teach/adaptive-emphasis";

export {
  buildReteachVariationPlan,
  type ReteachVariationPlan,
} from "@/lib/learning/teach/reteach-variation";

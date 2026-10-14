/**
 * Phase 7/8 — Universal Knowledge Retrieval public surface.
 */

export type {
  KnowledgeSourceKind,
  RetrievalConfidence,
  NormalizedLearningTarget,
  TeachingGroundingReference,
  KnowledgeSource,
  KnowledgeGroundingContext,
  GeneralTeachingKnowledge,
  RetrievedTeachingKnowledge,
  RetrievedExternalSnippet,
  KnowledgeRetrievalInput,
  KnowledgeRetrievalResult,
  GeneralKnowledgeProvider,
  ExternalKnowledgeProvider,
} from "@/lib/learning/knowledge/retrieval/types";

export {
  normalizeLearningTarget,
  stripTeachFraming,
  slugifyLearningTarget,
  isProtectedSpecializedTopic,
} from "@/lib/learning/knowledge/retrieval/normalize-target";

export {
  isGeneralTopicConceptId,
  generalRootConceptId,
  generalConceptId,
  findGeneralConceptById,
  registerGeneralTeachingContext,
  getRegisteredGeneralTeachingContext,
  resetGeneralTeachingRegistryForTests,
} from "@/lib/learning/knowledge/retrieval/general-identity";

export { validateGeneralTeachingKnowledge } from "@/lib/learning/knowledge/retrieval/validate-general-knowledge";

export {
  buildKnowledgeGroundingContext,
  groundingRefToSource,
  deriveCombinedSourceKind,
  sanitizeExternalSnippets,
  allowedSourceReferences,
  knowledgeSourceApiView,
} from "@/lib/learning/knowledge/retrieval/provenance";

export { validateLessonSourceIntegrity } from "@/lib/learning/knowledge/retrieval/source-integrity";

export {
  retrieveTeachingKnowledge,
  resolveTeachingKnowledgeForLearn,
  toTeachingKnowledgeContext,
} from "@/lib/learning/knowledge/retrieval/retrieve";

export {
  teachingContextFromRetrieved,
  retrievedFromGeneralKnowledge,
} from "@/lib/learning/knowledge/retrieval/bridge";

export { retrieveFromKnowledgeLibrary } from "@/lib/learning/knowledge/retrieval/providers/knowledge-library";
export { retrieveFromCourseMaterial } from "@/lib/learning/knowledge/retrieval/providers/course-material";
export { retrieveFromUserNote } from "@/lib/learning/knowledge/retrieval/providers/user-note";
export {
  createAiGeneralKnowledgeProvider,
  createMockGeneralKnowledgeProvider,
} from "@/lib/learning/knowledge/retrieval/providers/general-ai";
export {
  createNoopExternalKnowledgeProvider,
  createMockExternalKnowledgeProvider,
  resolveExternalKnowledgeProvider,
} from "@/lib/learning/knowledge/retrieval/providers/external";

/** Phase 9 — Personal Knowledge Retrieval */
export {
  loadPersonalGroundingForLearn,
  searchPersonalMaterialsForTopic,
  searchPersonalNotesForTopic,
  type PersonalKnowledgeHit,
  type PersonalGroundingForLearn,
} from "@/lib/learning/knowledge/retrieval/personal-retrieval";

/** Phase 10 — Learning Target Understanding */
export {
  understandLearningTarget,
  detectLearningActivity,
  detectSourcePreference,
  isMateriallyAmbiguousTopic,
  stripActivityFraming,
  activityToOrchestratorHint,
  sourcePreferenceToKinds,
  type LearningActivityIntent,
  type LearningTargetResolution,
  type LearningTargetSourcePreference,
  type UnderstoodLearningTarget,
} from "@/lib/learning/knowledge/retrieval/learning-target";

/** Phase 11 — Dynamic Learning Paths */
export {
  learningPathFromTeachingContext,
  getSessionDynamicPath,
  resetDynamicPathsForTests,
  nextConceptOnPath,
  preferCanonicalPathTarget,
  isSafePathConceptId,
  type DynamicLearningPath,
  type DynamicLearningPathConcept,
} from "@/lib/learning/knowledge/retrieval/dynamic-paths";

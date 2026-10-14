/**
 * Phase 4A — Learner State Foundation (Knowledge Library–aligned).
 *
 * Learning Evidence → Learner Concept State
 * Records what happened. Does NOT decide what happens next.
 */

export type {
  LearningEvidence,
  LearningEvidenceInput,
  LearningEvidenceType,
  LearningEvidenceOutcome,
  LearnerConceptState,
  LearnerState,
  RecordLearningEvidenceResult,
} from "@/lib/learning/learner-state/types";

export {
  findKnowledgeConceptById,
  isRegisteredKnowledgeConceptId,
  resolveEvidenceConceptIds,
  resolveEvidenceConceptsForTopic,
  conceptRefsFromTeachingContext,
} from "@/lib/learning/learner-state/concept-identity";

export {
  emptyLearnerConceptState,
  deriveLearnerConceptState,
  applyEvidenceToState,
  outcomeFromScoreRatio,
} from "@/lib/learning/learner-state/derive";

export {
  createMemoryLearnerStateStore,
  type LearnerStateStore,
} from "@/lib/learning/learner-state/store";

export {
  createLearnerStateService,
  recordLearningEvidence,
  getLearnerConceptState,
  getLearnerState,
  listEvidence,
  resetLearnerStateForTests,
  setLearnerStateStoreForTests,
  usePrismaLearnerStateStore,
  type LearnerStateService,
} from "@/lib/learning/learner-state/service";

export {
  recordLessonExposuresFromTeachingContext,
  recordLessonExposuresForTarget,
  recordEvaluateKnowledgeEvidence,
  evidenceTypeFromEvaluate,
} from "@/lib/learning/learner-state/adapters";

export { ensureLearnerStatePersistence } from "@/lib/learning/learner-state/ensure-persistence";

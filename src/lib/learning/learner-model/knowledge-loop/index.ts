/**
 * Phase 13 — Knowledge-loop Learner Model (additive over Phase 4A).
 * Coexists with ULE ConceptMastery learner-model/read.ts — does not replace it.
 */

export type {
  CapabilityKind,
  CapabilityEvidence,
  LearningActivitySummary,
  LearningProgression,
  MisconceptionEvidence,
  InstructionalResponseRecord,
  KnowledgeLoopLearnerModel,
  ConceptLearningNeed,
} from "@/lib/learning/learner-model/knowledge-loop/types";

export {
  capabilityKindFromEvidence,
  toCapabilityEvidence,
  deriveCapabilityEvidence,
} from "@/lib/learning/learner-model/knowledge-loop/capabilities";

export {
  MISCONCEPTION_MIN_INCORRECT,
  deriveMisconceptionEvidence,
} from "@/lib/learning/learner-model/knowledge-loop/misconceptions";

export {
  deriveRecentActivity,
  deriveRecentConcepts,
  deriveProgression,
} from "@/lib/learning/learner-model/knowledge-loop/history";

export { deriveInstructionalResponseHistory } from "@/lib/learning/learner-model/knowledge-loop/responses";

export { deriveKnowledgeLoopLearnerModel } from "@/lib/learning/learner-model/knowledge-loop/derive";

export {
  getLearnerModel,
  getConceptLearningNeed,
  getRecentLearningHistory,
  getCapabilityEvidence,
  getMisconceptionEvidence,
  getInstructionalResponseHistory,
} from "@/lib/learning/learner-model/knowledge-loop/read";

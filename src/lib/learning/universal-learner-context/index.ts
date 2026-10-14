/**
 * 2P-29 — Universal Learner Context.
 * Read-only projection of existing learner signals for Study Haul consumers.
 */

export type {
  UniversalLearnerContext,
  ResolveUniversalLearnerContextInput,
  LearnerContextSignalCategory,
} from "./types";

export {
  resolveUniversalLearnerContext,
  toOrchestrateDecisionContextOptions,
} from "./resolve";

export {
  presentUniversalLearnerContext,
} from "./present";
export type { LearnerContextPresentation } from "./present";

export {
  LEARNER_CONTEXT_PRECEDENCE,
  learnerContextPrecedenceSummary,
} from "./precedence";
export type { LearnerContextPrecedenceStep } from "./precedence";

export {
  UNIVERSAL_LEARNER_CONTEXT_EVIDENCE_BOUNDARY,
  universalLearnerContextCreatesEvidence,
} from "./evidence-boundary";

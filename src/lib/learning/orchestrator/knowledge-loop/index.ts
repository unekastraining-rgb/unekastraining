/**
 * Phase 4C — Knowledge Library Loop Orchestrator
 *
 * Deterministic next-action layer for KL concepts + Phase 4A learner state.
 * Coexists with ULE ConceptMastery orchestrator — does not replace it.
 */

export type {
  KnowledgeLearningAction,
  KnowledgeOrchestratorReasonCode,
  KnowledgeOrchestratorConfidence,
  KnowledgeOrchestratorTrace,
  KnowledgeOrchestratorDecision,
  KnowledgeOrchestratorInput,
  KnowledgeOrchestrationApiView,
  KnowledgeSixRecommendationApiView,
  KnowledgeActionDestination,
} from "@/lib/learning/orchestrator/knowledge-loop/types";

export {
  decideKnowledgeLoop,
  summarizeConceptEvidence,
  isConceptReadyToAdvance,
  type ConceptEvidenceSummary,
} from "@/lib/learning/orchestrator/knowledge-loop/decide";

export {
  resolveKnowledgeActionDestination,
  toOrchestrationApiView,
} from "@/lib/learning/orchestrator/knowledge-loop/destinations";

export {
  executeKnowledgeLearningAction,
  buildOrchestrationExecutionView,
  type LearningActionExecution,
  type LearningActionExecutionKind,
} from "@/lib/learning/orchestrator/knowledge-loop/execute";

export {
  resolveKnowledgeLoopDecision,
  resolveKnowledgeLoopOrchestration,
} from "@/lib/learning/orchestrator/knowledge-loop/resolve";

export {
  recommendSixTechnique,
  mapKnowledgeActionToSixComponent,
  type KnowledgeSixRecommendation,
} from "@/lib/learning/orchestrator/knowledge-loop/six-intelligence";

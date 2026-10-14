import { db } from "@/lib/db";
import { getLearnerConceptMastery } from "@/lib/learning/learner-model/read";
import {
  orchestrateFromLearnerState,
  type OrchestrateOptions,
  type OrchestratorResult,
} from "@/lib/learning/orchestrator/diagnose";
import { enrichOrchestratorWithEvidenceSignals } from "@/lib/learning/orchestrator/evidence-enrichment";
import { enrichOrchestratorWithPrerequisites } from "@/lib/learning/orchestrator/prerequisites";

/**
 * Orchestrator entrypoint:
 * getLearnerState → diagnose → optional prerequisite + evidence enrichment.
 * Recommendation-only — does not mutate mastery/scheduling.
 *
 * Phase 2G-74: loads Concept/LearningSpace subjectDomain for activity
 * compatibility only — never feeds diagnosis.
 */
export async function orchestrateForConcept(
  learnerId: string,
  conceptId: string,
  options?: OrchestrateOptions,
): Promise<OrchestratorResult | null> {
  const summary = await getLearnerConceptMastery(learnerId, conceptId);
  if (!summary) return null;

  let courseId = options?.courseId ?? null;
  let topicId = options?.topicId ?? null;
  let topicName = options?.topicName ?? summary.conceptTitle;
  let subjectDomain = options?.subjectDomain ?? null;

  if (!courseId || !topicId || subjectDomain == null) {
    const conceptMeta = await db.concept.findFirst({
      where: { id: conceptId, userId: learnerId },
      select: {
        subjectDomain: true,
        learningSpace: { select: { subjectDomain: true } },
      },
    });
    if (subjectDomain == null) {
      subjectDomain =
        conceptMeta?.subjectDomain ??
        conceptMeta?.learningSpace?.subjectDomain ??
        null;
    }
  }

  if (!courseId || !topicId) {
    const linkedTopic = await db.topic.findFirst({
      where: { conceptId },
      select: { id: true, name: true, courseId: true },
    });
    if (linkedTopic) {
      topicId = topicId ?? linkedTopic.id;
      topicName = topicName ?? linkedTopic.name;
      courseId = courseId ?? linkedTopic.courseId;
    }
  }

  const diagnosed = orchestrateFromLearnerState(summary, {
    ...options,
    courseId,
    topicId,
    topicName,
    subjectDomain,
  });

  const withPrerequisites =
    await enrichOrchestratorWithPrerequisites(diagnosed);

  return enrichOrchestratorWithEvidenceSignals(withPrerequisites, summary);
}

export {
  computeOrchestratorConfidence,
  effectiveFacetsForOrchestration,
  orchestrateFromLearnerState,
  pickUnderstandingIntervention,
  isFacetSubstantiallyLower,
  canDistinguishRecognizeFromExplain,
  isUnderstandingFacetLocked,
} from "@/lib/learning/orchestrator/diagnose";

export type {
  OrchestrateOptions,
  OrchestratorConfidence,
  OrchestratorDiagnosis,
  OrchestratorIntervention,
  OrchestratorResult,
  OrchestratorActivityIntervention,
} from "@/lib/learning/orchestrator/diagnose";

export { isOrchestratorPrerequisitesEnabled } from "@/lib/learning/orchestrator/prerequisites-flag";
export {
  ORCHESTRATOR_PREREQUISITE_POLICY,
  enrichOrchestratorWithPrerequisites,
} from "@/lib/learning/orchestrator/prerequisites";
export type { PrerequisiteHint } from "@/lib/learning/orchestrator/prerequisites";

export { enrichOrchestratorWithEvidenceSignals } from "@/lib/learning/orchestrator/evidence-enrichment";
export type { EvidenceHint } from "@/lib/learning/orchestrator/evidence-enrichment";

export {
  normalizeLearningDecisionContext,
  isEmptyLearningDecisionContext,
  resolveOrchestrateDecisionContext,
  withOrchestratorDecisionContext,
} from "@/lib/learning/orchestrator/context";
export type {
  LearningDecisionContext,
  LearningDecisionContextInput,
  OrchestrateDecisionContextOptions,
} from "@/lib/learning/orchestrator/context";
export {
  legalSixCandidates,
  applySoftIntentPreference,
  preferSixWithIntent,
} from "@/lib/learning/orchestrator/intent-preference";
export {
  extractRecentActivityAdapterKeys,
  pickAlternateLegalSixComponent,
  resolveImmediateRepeatAlternate,
  crossModalVarietyTruthSummary,
} from "@/lib/learning/orchestrator/cross-modal-variety";
export {
  resolveAssessmentWorkflowHandoff,
  withAssessmentWorkflowHandoff,
} from "@/lib/learning/orchestrator/assessment-handoff";
export type { AssessmentWorkflowHandoff } from "@/lib/learning/orchestrator/assessment-handoff";

export {
  evaluateActivityCompatibility,
  isActivityCompatibilityMatch,
  activityCompatibilityTruthSummary,
  normalizeCompatibilityText,
  tokenizeCompatibilityText,
  hintMatchesAsPhrase,
  selectMaximalPhraseMatches,
} from "@/lib/learning/orchestrator/activity-intervention-compatibility";
export type {
  ActivityCompatibilityStatus,
  ActivityCompatibilityStrength,
  ActivityCompatibilityResult,
  ActivitySelectionContext,
} from "@/lib/learning/orchestrator/activity-intervention-compatibility";

export {
  rankActivityInterventionCandidates,
  pickTopRankedActivityCandidate,
  activityRankingTruthSummary,
} from "@/lib/learning/orchestrator/activity-intervention-ranking";
export type { RankedActivityCandidate } from "@/lib/learning/orchestrator/activity-intervention-ranking";

export {
  isCapabilityLegalForSituation,
  isCapabilityAvailableForSituation,
  evaluateCapabilityCompatibilityForSituation,
  resolveLegalActivityInterventionCandidates,
  resolveRankedActivityInterventionCandidates,
  selectActivityIntervention,
  withActivityInterventionSuggestion,
  activityInterventionPolicyTruthSummary,
} from "@/lib/learning/orchestrator/activity-intervention-policy";

  export {
  decideKnowledgeLoop,
  isConceptReadyToAdvance,
  summarizeConceptEvidence,
  resolveKnowledgeLoopDecision,
  resolveKnowledgeLoopOrchestration,
  resolveKnowledgeActionDestination,
  toOrchestrationApiView,
  executeKnowledgeLearningAction,
  buildOrchestrationExecutionView,
} from "@/lib/learning/orchestrator/knowledge-loop";
export type {
  KnowledgeLearningAction,
  KnowledgeOrchestratorReasonCode,
  KnowledgeOrchestratorDecision,
  KnowledgeOrchestrationApiView,
  KnowledgeActionDestination,
  KnowledgeOrchestratorInput,
  LearningActionExecution,
} from "@/lib/learning/orchestrator/knowledge-loop";

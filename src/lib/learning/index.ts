/**
 * Universal Learning Engine (Phase 2A foundations).
 *
 * Future module boundaries (stubs live beside these as features land):
 * - learner-model / knowledge / learning-object / evidence / mastery
 * - assessment / orchestrator / retention / tutor
 */

export type {
  EvidenceEnvelope,
  EvidenceOutcomeName,
  FacetedMasteryScores,
  LearnerConceptMasterySummary,
  LearningObjectTypeName,
  LearningSpaceKindName,
  MasteryFacetName,
  SixTechniqueName,
} from "@/lib/learning/types";

export {
  EVIDENCE_OUTCOMES,
  LEARNING_OBJECT_TYPES,
  LEARNING_SPACE_KINDS,
  MASTERY_FACETS,
  SIX_TECHNIQUES,
} from "@/lib/learning/types";

export { getOrCreateLearnerProfile } from "@/lib/learning/learner-profile";
export {
  createLearningSpace,
  ensureLearningSpaceForCourse,
  getOrCreateSelfDirectedSpace,
} from "@/lib/learning/learning-space";
export {
  createConcept,
  ensureConceptForQuizTitle,
  ensureConceptForTopic,
} from "@/lib/learning/knowledge/concept";
export {
  isCoreKnowledgeBridgeEnabled,
  previewCoreKnowledgeBridge,
  confirmCoreKnowledgeCandidate,
  rejectCoreKnowledgeCandidate,
  loadLinkedConceptIdsForCoreContext,
  extractKnowledgeCandidatesFromStudyExtract,
  normalizeConceptTitle,
} from "@/lib/learning/knowledge/core-bridge";
export { isConceptRelationshipsEnabled } from "@/lib/learning/knowledge/concept-relationship-flag";
export {
  CONCEPT_RELATIONSHIP_TYPES,
  SYMMETRIC_CONCEPT_RELATIONSHIP_TYPES,
  CONCEPT_RELATIONSHIP_SOURCE_TYPES,
  isConceptRelationshipType,
  isSymmetricConceptRelationshipType,
  normalizeConceptRelationshipEndpoints,
} from "@/lib/learning/knowledge/concept-relationship-types";
export type {
  ConceptRelationshipTypeName,
  ConceptRelationshipSourceType,
} from "@/lib/learning/knowledge/concept-relationship-types";
export {
  ConceptRelationshipError,
  createConceptRelationship,
  deleteConceptRelationship,
  getConceptRelationships,
  getPrerequisiteConceptIds,
  getRelatedConceptIds,
  getConfusableConceptIds,
  getPartOfConceptIds,
} from "@/lib/learning/knowledge/concept-relationship";
export type { CreateConceptRelationshipInput } from "@/lib/learning/knowledge/concept-relationship";
export {
  ensureLearningObject,
  ensureQuizQuestionLearningObject,
  ensureFlashcardLearningObject,
  ensureStudyEvaluateLearningObject,
} from "@/lib/learning/learning-object/ensure";
export {
  buildEvidenceEnvelope,
  outcomeFromCorrect,
  outcomeFromScoreRatio,
} from "@/lib/learning/evidence/envelope";
export { recordEvidence } from "@/lib/learning/evidence/record";
export { isEvidenceIntelligenceEnabled } from "@/lib/learning/evidence/intelligence-flag";
export { EVIDENCE_AGGREGATION_POLICY } from "@/lib/learning/evidence/aggregation-policy";
export {
  aggregateEvidenceSignals,
  emptyEvidenceSignals,
  classifyEvidenceSourceKind,
} from "@/lib/learning/evidence/aggregate";
export { getEvidenceSignalsForConcept } from "@/lib/learning/evidence/aggregate-read";
export type {
  EvidenceSignals,
  RepeatedFailureStrength,
  FacetOutcomeAggregate,
  MisconceptionSignalAggregate,
  EvidenceSourceAggregateCounts,
} from "@/lib/learning/evidence/aggregation-types";
export {
  classifyEvidenceSufficiency,
  evidenceSufficiencyIsThin,
  evidenceSufficiencySupportsStrongClaims,
  evidenceSufficiencyLearnerLabel,
  evidenceSufficiencyTruthSummary,
  EVIDENCE_SUFFICIENCY_POLICY,
} from "@/lib/learning/evidence/evidence-sufficiency";
export type {
  EvidenceSufficiencyLevel,
  EvidenceSufficiencyInput,
} from "@/lib/learning/evidence/evidence-sufficiency";
export {
  interpretConflictingEvidence,
  conflictingEvidenceTruthSummary,
} from "@/lib/learning/evidence/conflicting-evidence";
export type { ConflictingEvidenceReading } from "@/lib/learning/evidence/conflicting-evidence";
export {
  parseAttemptContextIdentity,
  extractRecentContextVariants,
  extractRecentContentKeys,
  resolveTransferSelectionHints,
  transferContextIdentityTruthSummary,
  interpretMixedContextEvidence,
  mixedContextEvidenceTruthSummary,
} from "@/lib/learning/transfer";
export type {
  AttemptContextIdentity,
  MixedContextReading,
  MixedContextAttemptRow,
} from "@/lib/learning/transfer";
export {
  CREATION_ACTIVITY_KINDS,
  isCreationActivityKind,
  artifactVsEvidenceTruthSummary,
  presentationDemonstrationHonesty,
  interpretCreationEvidenceNote,
  creationActivityTruthSummary,
} from "@/lib/learning/creation";
export type { CreationActivityKind } from "@/lib/learning/creation";
export {
  preferredDifficultyFromSignals,
  preferredStagesFromLevelSignals,
  listDepthLadder,
  pickSoftDifficultyEntry,
  contentLevelTruthSummary,
  interventionPreferenceFromDifficulty,
} from "@/lib/learning/content-level";
export type {
  FacetSignalSnapshot,
  PreferredDifficultySignals,
  ConceptDepthLadderSummary,
} from "@/lib/learning/content-level";
export {
  applyFacetDelta,
  computeFacetDelta,
  emptyFacetScores,
  facetKey,
} from "@/lib/learning/mastery/facets";
export { applyEvidenceToMastery } from "@/lib/learning/mastery/apply";
export {
  calibrateFacetStatus,
  calibrateFacetLearnerLine,
  calibrateOrchestratorDiagnosis,
  resolveSufficiencyForMasterySnapshot,
  masteryCalibrationTruthSummary,
} from "@/lib/learning/mastery/mastery-calibration";
export type { CalibratedFacetStatus } from "@/lib/learning/mastery/mastery-calibration";
export {
  CANONICAL_ULE_MASTERY_SOURCE,
  LEGACY_TOPIC_PROGRESS_SOURCE,
  TOPIC_PROGRESS_LEARNER_COPY,
  ULE_MASTERY_LEARNER_COPY,
  resolveLearnerFacingUleMastery,
  resolveLearnerFacingUleMasteryIgnoringTopicProgress,
  resolveTopicCourseProgress,
  masteryTruthBoundarySummary,
} from "@/lib/learning/mastery/mastery-truth";
export type {
  ConceptMasterySnapshot,
  LearnerFacingUleMastery,
  MasteryTruthSource,
  TopicCourseProgress,
} from "@/lib/learning/mastery/mastery-truth";
export { getLearnerConceptMastery } from "@/lib/learning/learner-model/read";
export {
  projectLearnerConceptState,
  learnerModelProjectionInvariants,
} from "@/lib/learning/learner-model/project";
export type { LearnerConceptStateProjection } from "@/lib/learning/learner-model/project";
export {
  presentGrowthCenter,
  growthCenterTruthSummary,
} from "@/lib/learning/learner-model/present-growth-center";
export type {
  GrowthCenterView,
  GrowthCenterSnapshot,
  GrowthSnapshotKind,
} from "@/lib/learning/learner-model/present-growth-center";
export {
  resolveGrowthAdaptivePrimaryCta,
  indexActiveRunIdByConcept,
  resolveGrowthSixFallback,
  growthAdaptiveRunHref,
  growthActionContinuityTruthSummary,
  GROWTH_SECTION_ACTION_POLICY,
  GROWTH_NO_SEQUENCE_FALLBACK_HREF,
  GROWTH_NO_SEQUENCE_FALLBACK_LABEL,
} from "@/lib/learning/learner-model/growth-action-continuity";
export type { GrowthAdaptivePrimaryCta } from "@/lib/learning/learner-model/growth-action-continuity";
export {
  presentTemporalTruthBuckets,
  temporalTruthTruthSummary,
  learningActionToNextAction,
  resolveLearnerNextAction,
  learnerNextActionTruthSummary,
  presentLearnerGrowthContinuity,
  presentLearnerGrowthHubTeaser,
  learnerGrowthContinuityTruthSummary,
  resolveLearnerGrowthContinuityForUser,
} from "@/lib/learning/learner-growth";
export type {
  TemporalTruthKind,
  TemporalTruthItem,
  TemporalTruthBuckets,
  LearnerNextAction,
  LearnerGrowthContinuityView,
  LearnerGrowthHubTeaser,
  ResolveLearnerGrowthContinuityResult,
} from "@/lib/learning/learner-growth";
export {
  presentRecentEvidenceTimeline,
  presentRecentEvidenceItem,
  formatEvidenceWhenLabel,
  recentEvidenceTruthSummary,
} from "@/lib/learning/learner-model/present-recent-evidence";
export type {
  RecentEvidenceItem,
  RecentEvidenceInput,
} from "@/lib/learning/learner-model/present-recent-evidence";
export {
  LEARNING_ATTEMPT_PRODUCERS,
  FACET_PRODUCER_COVERAGE,
  PERFORM_COVERAGE_LIMITATION,
  CANONICAL_EVIDENCE_WRITE,
  CANONICAL_MASTERY_APPLY,
  listClosedEvidenceProducers,
  listPartialEvidenceProducers,
  listOutsideEvidenceProducers,
} from "@/lib/learning/learner-model/producers";
export type {
  EvidenceProducerClosure,
  EvidenceProducerId,
  EvidenceProducerSpec,
} from "@/lib/learning/learner-model/producers";
export { recordQuizAttemptEvidence } from "@/lib/learning/assessment/quiz-bridge";
export { recordFlashcardReviewEvidence } from "@/lib/learning/assessment/flashcard-bridge";
export {
  mapStudyEvaluateToLearningSignals,
  recordStudyEvaluateEvidence,
} from "@/lib/learning/assessment/evaluate-bridge";
export type { StudyEvaluateMode } from "@/lib/learning/assessment/evaluate-bridge";
export {
  runAssessmentWorkflow,
  ASSESSMENT_PLAN_STATUSES,
  ASSESSMENT_MODES,
} from "@/lib/learning/assessment/workflow";
export type {
  AssessmentPlan,
  AssessmentPlanStatus,
  AssessmentMode,
  AssessmentWorkflowRequest,
  AssessmentWorkflowAdaptiveContext,
} from "@/lib/learning/assessment/workflow";
export { resolveAssessmentMode } from "@/lib/learning/assessment/assessment-mode-policy";
export type { ResolveAssessmentModeInput } from "@/lib/learning/assessment/assessment-mode-policy";
export {
  createAssessmentAdapterRegistry,
  AssessmentAdapterRegistry,
} from "@/lib/learning/assessment/adapter-registry";
export type {
  AssessmentAdapter,
  AssessmentAdapterContext,
  AssessmentActivityResolution,
  AssessmentAdapterRegisterResult,
  AssessmentAdapterResolveResult,
} from "@/lib/learning/assessment/adapter-registry";
export { resolveAssessmentActivity } from "@/lib/learning/assessment/activity-resolution";
export type {
  ResolveAssessmentActivityResult,
  ResolveAssessmentActivityFailureReason,
} from "@/lib/learning/assessment/activity-resolution";
export { prepareAssessmentActivity } from "@/lib/learning/assessment/activity-preparation";
export type {
  AssessmentActivityDescriptor,
  PrepareAssessmentActivityInput,
  PrepareAssessmentActivityResult,
  PrepareAssessmentActivityFailureReason,
} from "@/lib/learning/assessment/activity-preparation";
export { launchAssessmentActivity } from "@/lib/learning/assessment/activity-launch";
export type {
  AssessmentActivityLaunch,
  LaunchAssessmentActivityInput,
  LaunchAssessmentActivityResult,
  LaunchAssessmentActivityFailureReason,
} from "@/lib/learning/assessment/activity-launch";
export type {
  AssessmentAdapterPrepareContext,
  AssessmentActivityPrepareContribution,
} from "@/lib/learning/assessment/adapter-registry";
export {
  QUIZ_ASSESSMENT_ADAPTER_KEY,
  QUIZ_ASSESSMENT_ACTIVITY_TYPE,
  QUIZ_ACTIVITY_REF_KIND,
  createQuizAssessmentAdapter,
  registerQuizAssessmentAdapter,
  createAssessmentAdapterRegistryWithQuiz,
} from "@/lib/learning/assessment/quiz-assessment-adapter";
export type {
  CreateQuizAssessmentAdapterOptions,
  FindOwnedQuizForConceptFn,
} from "@/lib/learning/assessment/quiz-assessment-adapter";
export {
  FLASHCARD_ASSESSMENT_ADAPTER_KEY,
  FLASHCARD_ASSESSMENT_ACTIVITY_TYPE,
  FLASHCARD_ACTIVITY_REF_KIND,
  FLASHCARD_ASSESSMENT_ALLOWED_MODE,
  findOwnedDueFlashcardForConcept,
  findOwnedFlashcardLaunchContext,
  flashcardAssessmentHref,
  createFlashcardAssessmentAdapter,
  registerFlashcardAssessmentAdapter,
  createAssessmentAdapterRegistryWithFlashcard,
} from "@/lib/learning/assessment/flashcard-assessment-adapter";
export type {
  CreateFlashcardAssessmentAdapterOptions,
  FindOwnedDueFlashcardForConceptFn,
  FindOwnedDueFlashcardForConceptResult,
  FindOwnedFlashcardLaunchContextFn,
  FlashcardLaunchContextResult,
} from "@/lib/learning/assessment/flashcard-assessment-adapter";
export {
  bindAssessmentPlanToAdaptiveStep,
} from "@/lib/learning/assessment/adaptive-step-bridge";
export type {
  AssessmentAdaptiveStepBinding,
  BindAssessmentPlanResult,
  BindAssessmentPlanFailureReason,
  BindAssessmentPlanOptions,
} from "@/lib/learning/assessment/adaptive-step-bridge";
export { runStandaloneAssessmentEntry } from "@/lib/learning/assessment/standalone-entry";
export type {
  StandaloneAssessmentEntryInput,
  StandaloneAssessmentEntryResult,
  StandaloneAssessmentEntrySuccess,
  StandaloneAssessmentEntryFailure,
  StandaloneAssessmentEntryErrorCode,
} from "@/lib/learning/assessment/standalone-entry";
export { runStandaloneAssessmentConsumer } from "@/lib/learning/assessment/standalone-assessment-consumer";
export type {
  StandaloneAssessmentConsumerInput,
  StandaloneAssessmentConsumerResult,
  StandaloneAssessmentConsumerSuccess,
  StandaloneAssessmentActivityOutcome,
} from "@/lib/learning/assessment/standalone-assessment-consumer";
export {
  computeOrchestratorConfidence,
  effectiveFacetsForOrchestration,
  orchestrateForConcept,
  orchestrateFromLearnerState,
  isOrchestratorPrerequisitesEnabled,
  ORCHESTRATOR_PREREQUISITE_POLICY,
  enrichOrchestratorWithPrerequisites,
  enrichOrchestratorWithEvidenceSignals,
  isUnderstandingFacetLocked,
  legalSixCandidates,
  applySoftIntentPreference,
  preferSixWithIntent,
} from "@/lib/learning/orchestrator";
export {
  DECISION_LOOP_STAGES,
  DECISION_LOOP_INVARIANTS,
  DECISION_LOOP_PRODUCER_CONSUMER_MATRIX,
  PRESERVED_ORCHESTRATOR_DIAGNOSES,
  ADAPTIVE_READY_ACTIVITY_KEYS,
  PRODUCT_READY_NOT_ADAPTIVE_KEYS,
  decisionLoopSummary,
} from "@/lib/learning/decision-loop";
export type { DecisionLoopStage } from "@/lib/learning/decision-loop";
export {
  ACTIVITY_COVERAGE_INVENTORY,
  buildFacetCoverageMatrix,
  listCoverageByStatus,
  getActivityCoverage,
  activityCoverageSummary,
  assertCoverageAdaptiveKeysAligned,
} from "@/lib/learning/activity-coverage";
export type {
  ActivityCoverageStatus,
  ActivityCoverageEntry,
  FacetCoverageRow,
} from "@/lib/learning/activity-coverage";
export type {
  OrchestrateOptions,
  OrchestratorConfidence,
  OrchestratorDiagnosis,
  OrchestratorIntervention,
  OrchestratorResult,
  PrerequisiteHint,
  EvidenceHint,
} from "@/lib/learning/orchestrator";
export {
  presentOrchestratorSuggestion,
} from "@/lib/learning/orchestrator/present";
export type {
  OrchestratorSuggestionState,
  OrchestratorSuggestionView,
  PresentOrchestratorOptions,
  OrchestratorMasterySummary,
} from "@/lib/learning/orchestrator/present";
export {
  buildOrchestratorMasterySummary,
} from "@/lib/learning/orchestrator/present-mastery-summary";
export {
  ORCHESTRATOR_FACET_WEAK,
  ORCHESTRATOR_FACET_STRONG,
} from "@/lib/learning/orchestrator/diagnose";
export {
  resolvePresentLearningIntent,
  resolvePresentDecisionContext,
} from "@/lib/learning/orchestrator/present";
export { getTopOrchestratorSuggestion } from "@/lib/learning/orchestrator/suggest";
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
  resolveAssessmentWorkflowHandoff,
  withAssessmentWorkflowHandoff,
} from "@/lib/learning/orchestrator/assessment-handoff";
export type { AssessmentWorkflowHandoff } from "@/lib/learning/orchestrator/assessment-handoff";
export {
  countDueBySource,
  countDueRetentionItems,
  findDueRetentionItems,
  findPriorityRetentionItems,
  nextReviewAtForOutcome,
  recordRetentionOutcome,
  syncFlashcardRetentionItem,
  syncMissedQuestionRetentionItem,
  syncRetentionSourcesForUser,
  syncWeakMasteryRetentionItem,
  upsertRetentionItem,
  getNextRetentionReviewItem,
  submitRetentionReview,
} from "@/lib/learning/retention";

/** Universal Learning Intent contract (Phase 2G-22) — ephemeral; not persisted. */
export {
  LEARNING_INTENT_PURPOSES,
  LEARNING_INTENT_SOURCES,
  LEARNING_INTENT_PROVENANCES,
  LEARNING_INTENT_SCOPES,
  parseLearningIntent,
  isLearningIntent,
  isLearningIntentPurpose,
  isLearningIntentSource,
  isLearningIntentScope,
  isLearningIntentProvenance,
  createExplicitLearningIntent,
  projectTutorModeToLearningIntent,
  projectCoreStudyIntentToLearningIntent,
  projectSystemInterventionToLearningIntent,
} from "@/lib/learning/intent";
export type {
  LearningIntent,
  LearningIntentPurpose,
  LearningIntentSource,
  LearningIntentProvenance,
  LearningIntentScope,
  CreateExplicitLearningIntentInput,
  ProjectTutorModeOptions,
} from "@/lib/learning/intent";

/** Adaptive sequence run state (Phase 2G-2) — coordination cursor only; no execution loop. */
export {
  AdaptiveSequenceRunError,
  createAdaptiveSequenceRun,
  getAdaptiveSequenceRun,
  listAdaptiveSequenceRuns,
  updateAdaptiveSequenceRunState,
  completeAdaptiveSequenceRun,
  abandonAdaptiveSequenceRun,
  deleteAdaptiveSequenceRun,
  AdaptiveSequenceCoordinatorError,
  startAdaptiveSequenceRun,
  getCurrentAdaptiveSequenceStep,
  recordAdaptiveSequenceCompletion,
  recordAdaptiveSequenceCompletionAndPlanNext,
  getNextAdaptiveIntervention,
  resumeAdaptiveSequenceRun,
  getAdaptiveSequenceLastAttemptPointer,
  listActiveAdaptiveSequenceRuns,
  completeAdaptiveSequence,
  abandonAdaptiveSequence,
  MAX_SEQUENCE_STEPS,
  SixAdapterError,
  normalizeSixIntervention,
  isSupportedSixIntervention,
  resolveSixSequenceStep,
  resolveOwnedSixSequenceStep,
  assertSixCompatibleAttempt,
  resolveCurrentSixAdaptiveActivity,
  recordSixAdaptiveSequenceCompletion,
} from "@/lib/learning/sequence";
export type {
  AdaptiveSequenceRunView,
  CreateAdaptiveSequenceRunInput,
  UpdateAdaptiveSequenceRunStateInput,
  AdaptiveSequenceCoordinatorErrorCode,
  StartAdaptiveSequenceResult,
  CurrentAdaptiveSequenceStepResult,
  RecordCompletionResult,
  NextInterventionResult,
  PlanNextAdaptiveStepResult,
  ResumeAdaptiveSequenceResult,
  SixAdapterErrorCode,
  SixEvaluateContract,
  ResolvedSixSequenceActivity,
  SixGuideHrefParams,
  ResolveCurrentSixAdaptiveActivityResult,
} from "@/lib/learning/sequence";
export {
  ADAPTIVE_SEQUENCE_RUN_STATUSES,
  isAdaptiveSequenceRunStatus,
} from "@/lib/learning/sequence/types";
export type {
  AdaptiveSequenceRunStatusName,
  AdaptiveSequenceStep,
  AdaptiveSequenceHistoryEntry,
} from "@/lib/learning/sequence/types";
export {
  parseStepsJson,
  parseInterventionHistoryJson,
  serializeSteps,
  serializeInterventionHistory,
  assertValidCurrentStepIndex,
  isAwaitingNextStep,
} from "@/lib/learning/sequence/json";

/** Unified Tutor foundation (Phase 2D-1) — facade only; no UI migration yet. */
export {
  TUTOR_MODES,
  isTutorMode,
  getTutorModePolicy,
  listTutorModes,
  loadTutorContext,
  shouldRecordTutorEvidence,
  facetForTutorEvidence,
  resolveTutorEvidenceAuthorization,
  maybeRecordTutorEvidence,
  runTutor,
  TutorRequestError,
  resolveTutorLearningIntent,
  withResolvedTutorLearningIntent,
  toTutorRequestFromLegacyChat,
  toTutorRequestFromDemonstration,
} from "@/lib/learning/tutor";
export type {
  TutorMode,
  TutorRequest,
  TutorResponse,
  TutorEvidenceIntent,
  TutorModality,
  TutorSuggestedAction,
  TutorModePolicy,
  TutorResolvedContext,
  TutorEvidenceAuthorization,
  LegacyAiSurface,
} from "@/lib/learning/tutor";

export {
  TEACHING_STYLES,
  TEACH_ME_LIKE_IM_5_STYLE,
  isTeachingStyle,
  parseTeachingStyle,
  resolveTeachingStyle,
  applyTeachingStyleSwitch,
  getTeachingStylePolicy,
  listTeachingStylePolicies,
  teachMeLikeIm5IsSimplified,
  teachingStyleBoundaryTruthSummary,
  teachingStyleCoexistsWithAccessibility,
  extractTeachingStyleHintFromMessage,
  listTeachingStyleEntryPoints,
  getTeachingStyleEntryPoint,
  teachingStylePropagationTruthSummary,
} from "@/lib/learning/tutor";
export type {
  TeachingStyle,
  TeachingStylePolicy,
  TeachingStyleResolution,
  TeachingStyleBoundarySummary,
  TeachingStyleEntryPoint,
  TeachingStyleEntryStatus,
} from "@/lib/learning/tutor";

export {
  isSixTutorUnifiedEnabled,
  toTutorRequestFromSixTutor,
  SixTutorAdapterError,
} from "@/lib/learning/tutor";

export {
  isCoreAssistUnifiedEnabled,
  toTutorRequestFromCoreAssist,
  CoreAssistAdapterError,
} from "@/lib/learning/tutor";

export {
  isTeachMeUnifiedEnabled,
  toTutorRequestFromTeachMe,
  TeachMeAdapterError,
} from "@/lib/learning/tutor";

export {
  prepareLearningContent,
  validatePreparedLearningContent,
  runContentPipeline,
  contentPipelineTruthSummary,
  sourceRefFromCoreNote,
  sourceRefFromChapterExtract,
  sourceRefFromCourseMaterial,
  learningObjectiveFromExtract,
  preparationInputFromCoreGrounding,
  FIXTURE_CS_JAVA_INHERITANCE,
  FIXTURE_NETWORKING_DHCP,
  FIXTURE_BUSINESS_SUPPLY_DEMAND,
} from "@/lib/learning/content-pipeline";
export type {
  ContentSourceRef,
  LearningObjectiveSpec,
  PreparedLearningContent,
  ContentPreparationInput,
  ContentValidationResult,
} from "@/lib/learning/content-pipeline";

export {
  prepareMaterialForLearning,
  getMaterialLearningStatus,
  confirmMaterialConceptCandidate,
  searchOwnedMaterials,
  loadOwnedMaterialTutorContext,
  presentLearnerFacingProvenance,
  MATERIAL_INGESTION_EVIDENCE_BOUNDARY,
  MaterialLearningError,
} from "@/lib/learning/material-ingestion";
export type {
  MaterialLearningPrepareResult,
  MaterialProcessingState,
  MaterialSearchHit,
} from "@/lib/learning/material-ingestion";

export {
  resolveOwnedMaterialContext,
  resolveLearningMaterialContext,
  presentMaterialSourceCitation,
  pickMaterialContextPriority,
  MATERIAL_CONTEXT_EVIDENCE_BOUNDARY,
} from "@/lib/learning/material-context";
export type {
  LearningMaterialContext,
  MaterialContextResolution,
  MaterialSourceCitationView,
} from "@/lib/learning/material-context";

export {
  resolveUniversalLearnerContext,
  presentUniversalLearnerContext,
  toOrchestrateDecisionContextOptions,
  LEARNER_CONTEXT_PRECEDENCE,
  learnerContextPrecedenceSummary,
  UNIVERSAL_LEARNER_CONTEXT_EVIDENCE_BOUNDARY,
  universalLearnerContextCreatesEvidence,
} from "@/lib/learning/universal-learner-context";
export type {
  UniversalLearnerContext,
  ResolveUniversalLearnerContextInput,
  LearnerContextSignalCategory,
  LearnerContextPresentation,
  LearnerContextPrecedenceStep,
} from "@/lib/learning/universal-learner-context";

export {
  SCHOOL_LMS_EVIDENCE_BOUNDARY,
  schoolLmsCreatesEvidence,
  schoolLmsBoundaryTruthSummary,
  matchTopicForAssignmentTitle,
  resolveAssignmentConceptLink,
  enrichAssignmentsWithConceptLinks,
  assignmentLearningBridgeTruthSummary,
  alignmentStateFromMatchKind,
  inferSchoolLearningIntentHint,
  emptySchoolContext,
  schoolContextTruthSummary,
  schoolSourceOfTruthMatrix,
  resolveOwnedAssignmentContext,
} from "@/lib/learning/school-lms";
export type {
  AssignmentTopicCandidate,
  AssignmentConceptLink,
  SchoolContext,
  ConceptAlignmentState,
  OwnedAssignmentContext,
} from "@/lib/learning/school-lms";

export {
  ARTIFACT_TYPES,
  resolveArtifactSaveStatus,
  artifactSaveStatusLabel,
  artifactPersistenceEvidenceBoundary,
  artifactPersistenceTruthSummary,
  emptyMultiFileProjectMeta,
  parseMultiFileProjectMeta,
  addProjectFileRef,
  projectFileSaveIsolationOk,
  multiFileProjectTruthSummary,
  writeLocalArtifactDraft,
  readLocalArtifactDraft,
  clearLocalArtifactDraft,
  localDraftMayOfferRecovery,
  localDraftTruthSummary,
} from "@/lib/learning/artifact-persistence";
export type {
  ArtifactType,
  ArtifactSaveStatus,
  ArtifactPersistenceDescriptor,
  MultiFileProjectMeta,
  ProjectFileRef,
  LocalArtifactDraft,
} from "@/lib/learning/artifact-persistence";

export {
  selectProgressionContent,
  contentProgressionTruthSummary,
  listProgressionEntriesForConcept,
  getProgressionEntry,
  preferredStagesForIntervention,
  normalizeConceptKey,
  LEARNING_CONTENT_STAGES,
} from "@/lib/learning/content-progression";
export type {
  LearningContentStage,
  ContentDifficulty,
  ContentProgressionEntry,
  ContentProgressionSelectionInput,
  ContentProgressionSelectionResult,
} from "@/lib/learning/content-progression";

export {
  evaluateContentCoverage,
  contentCoverageTruthSummary,
  evaluateContentAvailability,
} from "@/lib/learning/content-coverage";
export type {
  ContentCoverageStatus,
  ContentCoverageRequest,
  ContentCoverageResult,
} from "@/lib/learning/content-coverage";

export {
  projectLearningExperience,
  resolveLearningExperience,
  learningExperienceTruthSummary,
} from "@/lib/learning/experience";
export type {
  LearningExperienceView,
  ResolveLearningExperienceResult,
} from "@/lib/learning/experience";

export {
  projectLearningScaffolds,
  projectSuccessLooksLike,
  normalizeLearningScaffold,
  learningScaffoldTruthSummary,
  activityScaffoldSourceFromContent,
} from "@/lib/learning/scaffolding";
export type {
  LearningScaffold,
  LearningScaffoldKind,
  ActivityScaffoldSource,
} from "@/lib/learning/scaffolding";

export {
  ACTIVITY_OUTCOME_CONTRACT_MATRIX,
  summarizeActivityOutcomeIntegrity,
  outcomeIntegrityTruthSummary,
  completionWithFailIsStillComplete,
} from "@/lib/learning/outcome-integrity";
export type {
  ActivityOutcomeIntegritySummary,
  ActivityOutcomeContractRow,
} from "@/lib/learning/outcome-integrity";

export {
  buildUniversalActivityInventory,
  listAdaptiveReadyUniversalActivityKeys,
  listProductReadyNotAdaptiveActivityKeys,
  classifyFutureExperienceCandidate,
  productExpansionTruthSummary,
} from "@/lib/learning/product-expansion";
export type {
  ActivityInventoryRow,
  FutureExperienceClassification,
} from "@/lib/learning/product-expansion";

export {
  listEducationalMarketScenarios,
  getEducationalMarketScenario,
  evaluateEducationalMarketSubmission,
  educationalMarketIsNotBrokerage,
  educationalMarketBoundaryTruthSummary,
  projectEducationalMarketChart,
  EDUCATIONAL_MARKET_DISCLAIMER,
} from "@/lib/learning/activities/simulation/educational-market";
export type {
  EducationalMarketScenario,
  EducationalMarketDecision,
  EducationalMarketSimulationState,
} from "@/lib/learning/activities/simulation/educational-market";

export {
  listWritingAdaptiveSeedActivities,
  getWritingAdaptiveActivity,
  getWritingAdaptiveMeta,
  isWritingAdaptiveReadyContent,
  listWritingDomainsCovered,
  evaluateWritingWork,
  writingAdaptiveContractTruthSummary,
  writingArtifactTruthSummary,
  writingRevisionTruthSummary,
  writingAiAssistanceBoundaryTruthSummary,
  WRITING_ADAPTIVE_SEED_ACTIVITIES,
} from "@/lib/learning/activities/writing";
export type {
  WritingAdaptiveActivity,
  WritingActivityType,
  WritingLearnerArtifact,
} from "@/lib/learning/activities/writing";

export {
  resolveContentLifecyclePhase,
  isLearnerFacingLifecyclePhase,
  contentLifecycleTruthSummary,
  auditCatalogIntegrity,
  catalogIntegrityOk,
  validateAiContentCandidate,
  aiContentCandidateTruthSummary,
  buildContentDensityMatrix,
  buildAdaptiveCatalogDepthMatrix,
  assessAuthoringContractFields,
  authoringContractGaps,
  listDesignTimeContentPacks,
  getDesignTimeContentPack,
  contentProductionTruthSummary,
  assessAdaptiveReadyCatalogItem,
  catalogDepthFieldTiers,
  listSeedItems,
  listAdaptiveReadySeedAssessments,
  educationalMarketSeedIsNotBrokerage,
  contentQualityFieldContract,
  contentQualityApplicabilityForKind,
  contentQualityContractTruthSummary,
  validateContentQualityItem,
  auditContentQualityUnique,
  isMeaningfulSuccessLooksLike,
  isActionableMisconception,
  contentQualityValidationTruthSummary,
  buildContentDepthDensityReport,
  auditContentDepthSparsity,
  contentDepthReportTruthSummary,
} from "@/lib/learning/content-production";
export type {
  ContentLifecyclePhase,
  ContentDensityRow,
  ContentPackDescriptor,
  CatalogIntegrityIssue,
  AuthoringContractAssessment,
  AiContentCandidateResult,
  AdaptiveReadyCatalogAssessment,
  SeedCatalogItem,
  CatalogDepthMatrixRow,
  ContentDepthDomainRow,
  ContentQualityFieldSpec,
} from "@/lib/learning/content-production";

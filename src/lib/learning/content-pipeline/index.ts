/**
 * 2P-8 — Universal Learning Content Pipeline.
 */

export type {
  ContentPipelineStatus,
  ContentSourceType,
  ContentSourceRef,
  LearningObjectiveSpec,
  ContentPreparationInput,
  PreparedLearningContent,
  ContentValidationIssue,
  ContentValidationResult,
  PipelineTruthSummary,
} from "./types";

export {
  makeContentSourceRef,
  assertSourceOwnership,
  sourceDoesNotCreateMastery,
} from "./source";

export {
  isMeaningfulObjective,
  suggestActivityKindsForObjective,
  capabilitySupportsCharacteristics,
  makeLearningObjective,
} from "./characteristics";

export {
  prepareLearningContent,
  validatePreparedLearningContent,
  runContentPipeline,
  contentPipelineTruthSummary,
  pipelineModuleDoesNotWriteMastery,
} from "./prepare";

export {
  FIXTURE_CS_JAVA_INHERITANCE,
  FIXTURE_NETWORKING_DHCP,
  FIXTURE_BUSINESS_SUPPLY_DEMAND,
  FIXTURE_NETWORKING_DHCP_LAB,
  PIPELINE_FIXTURES,
} from "./fixtures";

export {
  sourceRefFromCoreNote,
  sourceRefFromChapterExtract,
  sourceRefFromCourseMaterial,
  learningObjectiveFromExtract,
  preparationInputFromCoreGrounding,
} from "./from-core";

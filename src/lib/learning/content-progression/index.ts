/**
 * 2P-9 — Universal Content Progression & Variation.
 */

export type {
  LearningContentStage,
  ContentDifficulty,
  ContentInterventionPreference,
  ContentProgressionEntry,
  ContentProgressionSelectionInput,
  ContentProgressionSelectionResult,
  ProgressionTruthSummary,
} from "./types";
export { LEARNING_CONTENT_STAGES } from "./types";

export {
  isLearningContentStage,
  isContentDifficulty,
  preferredStagesForIntervention,
  normalizeConceptKey,
} from "./stages";

export {
  CONTENT_PROGRESSION_CATALOG,
  CS_INHERITANCE_ENTRIES,
  NETWORKING_DHCP_ENTRIES,
  BUSINESS_SUPPLY_DEMAND_ENTRIES,
  SQL_FILTERING_VARIANTS,
  NURSING_CLINICAL_ENTRIES,
  ELECTRICAL_CIRCUIT_ENTRIES,
  DRAFT_CONTENT_FIXTURE,
  listProgressionEntriesForConcept,
  getProgressionEntry,
} from "./catalog";

export {
  selectProgressionContent,
  contentProgressionTruthSummary,
  progressionModuleDoesNotWriteMastery,
} from "./select";

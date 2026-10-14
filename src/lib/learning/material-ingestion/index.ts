/**
 * 2P-27 — Material ingestion → Universal Learning Engine bridge.
 * Reuses CourseMaterial + Note.contentJson + Knowledge bridge + Adaptive.
 * Does not create a second document store, knowledge graph, or Adaptive engine.
 */

export type {
  MaterialProcessingState,
  MaterialLearningPrepareResult,
  LearnerFacingProvenance,
} from "./types";

export { presentLearnerFacingProvenance } from "./provenance";

export {
  MATERIAL_INGESTION_EVIDENCE_BOUNDARY,
  materialIngestionCreatesEvidence,
} from "./evidence-boundary";

export {
  MATERIAL_EXTRACT_TEXT_CAP,
  MaterialLearningError,
  prepareMaterialForLearning,
  getMaterialLearningStatus,
  confirmMaterialConceptCandidate,
} from "./prepare";

export { searchOwnedMaterials } from "./search";
export type { MaterialSearchHit } from "./search";

export { loadOwnedMaterialTutorContext } from "./tutor-context";
export type { OwnedMaterialTutorContext } from "./tutor-context";

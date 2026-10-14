/**
 * 2P-28 — Material → Learning Context (source-grounded experience).
 * Display/provenance only — not a second engine, RAG, or evidence path.
 */

export type {
  LearningMaterialContext,
  LearningMaterialProvenance,
  MaterialContextPrioritySource,
  MaterialContextResolution,
} from "./types";

export {
  MATERIAL_CONTEXT_PRIORITY_ORDER,
  pickMaterialContextPriority,
} from "./priority";

export {
  MATERIAL_CONTEXT_EVIDENCE_BOUNDARY,
  materialContextCreatesEvidence,
} from "./evidence-boundary";

export {
  buildMaterialProvenance,
  assertLearnerFacingProvenance,
} from "./provenance";

export {
  resolveOwnedMaterialContext,
  resolveLearningMaterialContext,
  listConceptLinkedMaterials,
} from "./resolve";

export {
  presentMaterialSourceCitation,
  appendSourceToWhyThisActivity,
  withMaterialIdQuery,
} from "./present";
export type { MaterialSourceCitationView } from "./present";

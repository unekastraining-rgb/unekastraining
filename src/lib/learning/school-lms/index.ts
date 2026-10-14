/**
 * 2P-31 — School / LMS → Universal Learning bridges.
 * 2P-49 — School context contract + alignment honesty.
 */

export {
  SCHOOL_LMS_EVIDENCE_BOUNDARY,
  schoolLmsCreatesEvidence,
  schoolLmsBoundaryTruthSummary,
} from "./evidence-boundary";

export {
  matchTopicForAssignmentTitle,
  resolveAssignmentConceptLink,
  enrichAssignmentsWithConceptLinks,
  assignmentLearningBridgeTruthSummary,
} from "./assignment-concept-bridge";
export type {
  AssignmentTopicCandidate,
  AssignmentConceptLink,
} from "./assignment-concept-bridge";

export {
  alignmentStateFromMatchKind,
  inferSchoolLearningIntentHint,
  emptySchoolContext,
  schoolContextTruthSummary,
  schoolSourceOfTruthMatrix,
} from "./school-context";
export type {
  SchoolContext,
  ConceptAlignmentState,
} from "./school-context";

export { resolveOwnedAssignmentContext } from "./resolve-owned-assignment";
export type { OwnedAssignmentContext } from "./resolve-owned-assignment";
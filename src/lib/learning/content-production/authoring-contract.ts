/**
 * 2P-15 — Authoring contract field assessment (inspection aid).
 */

import type { AuthoringContractAssessment } from "./types";

/** Snapshot of canonical authoring fields vs existing spine modules. */
export function assessAuthoringContractFields(): AuthoringContractAssessment[] {
  return [
    { field: "identity (contentId / contentKey)", status: "EXISTING", location: "2P-7 content-contract; 2P-9 progression" },
    { field: "concept", status: "EXISTING", location: "Knowledge Model Concept; progression conceptKey" },
    { field: "learning objective", status: "EXISTING", location: "descriptor.objective; LearningObjectiveSpec" },
    { field: "activity type", status: "EXISTING", location: "UniversalContentActivityKind + Assessment adapters" },
    { field: "domain/context", status: "EXISTING", location: "domainTag / subjectDomain free-form strings" },
    { field: "stage", status: "EXISTING", location: "2P-9 LearningContentStage on progression entries" },
    { field: "difficulty", status: "EXISTING", location: "2P-9 ContentDifficulty on progression entries" },
    { field: "variant (contextVariant)", status: "EXISTING", location: "2P-9 contextVariant + contentVersion" },
    { field: "instructions", status: "EXISTING", location: "2P-11 experience.instructions" },
    { field: "learner task", status: "EXISTING", location: "descriptor.task / challenge.prompt" },
    { field: "expected artifact/action", status: "EXISTING", location: "2P-11 expectedAction + evaluationMode" },
    { field: "scaffolds", status: "PARTIAL", location: "2P-12 on challenges; 2P-16 seeds enriched, older rows sparse" },
    { field: "hints", status: "PARTIAL", location: "2P-12 HINT scaffolds + experience.hint compat" },
    { field: "success criteria", status: "PARTIAL", location: "rubric criteria + successLooksLike; seed items enriched" },
    { field: "evaluation/rubric", status: "EXISTING", location: "execution/structural/sqljs/rubric evaluators" },
    { field: "evidence mapping", status: "EXISTING", location: "activity submit → recordEvidence → facet" },
    { field: "prerequisites", status: "ORCHESTRATOR_OWNED", location: "ConceptRelationship + LearningObject.prerequisiteConceptIdsJson" },
    { field: "misconceptions", status: "PARTIAL", location: "optional misconceptionTargets on 2P-16 seeds; evidence signals remain" },
    { field: "source/reference", status: "PARTIAL", location: "2P-8 ContentSourceRef; CORE/materials adjacent" },
    { field: "version", status: "EXISTING", location: "contentVersion on progression + pipeline" },
    { field: "availability", status: "EXISTING", location: "2P-10 coverage + availability helpers" },
    { field: "ownership", status: "EXISTING", location: "authorship + assertOwnedConcept + source owner" },
    { field: "accessibility metadata", status: "PARTIAL", location: "optional ContentAccessibilityMeta on seeds; user persona hooks remain" },
  ];
}

export function authoringContractGaps(): AuthoringContractAssessment[] {
  return assessAuthoringContractFields().filter(
    (f) => f.status === "PARTIAL" || f.status === "MISSING",
  );
}

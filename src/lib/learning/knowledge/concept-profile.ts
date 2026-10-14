/**
 * Rich concept profile extensions for the Knowledge Library (architecture Phase A).
 * Additive only — does not replace legacy string fields on InstructionalConceptKnowledge.
 * Completeness states describe Library health, never learner mastery.
 */

/** Typed instructional relationship vocabulary (§8). */
export type InstructionalRelationshipKind =
  | "prerequisite"
  | "depends_on"
  | "contains"
  | "part_of"
  | "parent_of"
  | "child_of"
  | "related_to"
  | "contrasts_with"
  | "commonly_confused_with"
  | "causes"
  | "caused_by"
  | "leads_to"
  | "used_with"
  | "example_of"
  | "application_of"
  | "generalizes"
  | "specializes";

export type InstructionalRelationship = {
  kind: InstructionalRelationshipKind;
  /** Registered concept id (never invented). */
  targetConceptId: string;
  reason?: string;
};

/** First-class misconception object (§31). Strings remain supported for legacy packs. */
export type InstructionalMisconception = {
  misconception: string;
  why?: string;
  correction?: string;
  contrast?: string;
  diagnosticClue?: string;
};

/**
 * Library completeness — how much instructional structure exists.
 * Not learner mastery. Not an accuracy score.
 */
export type InstructionalCompletenessState =
  | "discovered"
  | "identified"
  | "structured"
  | "teachable"
  | "rich"
  | "curriculum-mapped";

/** Curriculum is a mapping layer onto canonical concepts (§9). */
export type CurriculumMappingStub = {
  curriculumId: string;
  label: string;
  unit?: string;
  chapter?: string;
  conceptId: string;
};

/** Coverage facets for internal Library health (§17–18). */
export const COVERAGE_FACETS = [
  "identity",
  "definition",
  "structure",
  "relationships",
  "prerequisites",
  "examples",
  "nonExamples",
  "misconceptions",
  "visualModels",
  "application",
  "transfer",
  "practiceForms",
  "assessmentForms",
  "curriculumMappings",
] as const;

export type CoverageFacet = (typeof COVERAGE_FACETS)[number];

export const COMPLETENESS_ORDER: InstructionalCompletenessState[] = [
  "discovered",
  "identified",
  "structured",
  "teachable",
  "rich",
  "curriculum-mapped",
];

export function completenessRank(
  state: InstructionalCompletenessState | undefined,
): number {
  if (!state) return -1;
  return COMPLETENESS_ORDER.indexOf(state);
}

export function isAtLeastCompleteness(
  state: InstructionalCompletenessState | undefined,
  minimum: InstructionalCompletenessState,
): boolean {
  return completenessRank(state) >= completenessRank(minimum);
}

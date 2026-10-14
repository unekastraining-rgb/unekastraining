/**
 * Knowledge Library coverage reporter (§17–18).
 * Internal Library health only — never presented as learner mastery or "% correct".
 */

import type { InstructionalConceptKnowledge } from "@/lib/learning/knowledge/instructional-library";
import {
  listInstructionalPacks,
  findInstructionalConceptById,
} from "@/lib/learning/knowledge/instructional-library";
import {
  COVERAGE_FACETS,
  type CoverageFacet,
  type InstructionalCompletenessState,
  isAtLeastCompleteness,
} from "@/lib/learning/knowledge/concept-profile";

export type ConceptCoverageReport = {
  conceptId: string;
  title: string;
  facets: Record<CoverageFacet, boolean>;
  filledCount: number;
  totalFacets: number;
  /** Derived from filled facets when completeness is unset. */
  derivedCompleteness: InstructionalCompletenessState;
  declaredCompleteness?: InstructionalCompletenessState;
  teachable: boolean;
};

export type PackCoverageReport = {
  packId: string;
  displayTitle: string;
  concepts: ConceptCoverageReport[];
  teachableCount: number;
  richCount: number;
};

function hasText(value: string | undefined | null): boolean {
  return Boolean(value && value.trim().length > 12);
}

function facetPresence(concept: InstructionalConceptKnowledge): Record<CoverageFacet, boolean> {
  const examples =
    hasText(concept.example) ||
    (concept.examples?.some((e) => hasText(e)) ?? false);
  const nonExamples =
    hasText(concept.nonExample) ||
    (concept.nonExamples?.some((e) => hasText(e)) ?? false);
  const misconceptions =
    hasText(concept.misconception) ||
    (concept.misconceptions?.some((m) => hasText(m)) ?? false) ||
    (concept.misconceptionDetails?.length ?? 0) > 0;
  const relationships =
    (concept.relationships?.length ?? 0) > 0 ||
    (concept.relatedConcepts?.length ?? 0) > 0 ||
    (concept.related?.length ?? 0) > 0;
  const prerequisites =
    (concept.prerequisites?.length ?? 0) > 0 ||
    (concept.relationships?.some((r) => r.kind === "prerequisite") ?? false);
  const structure =
    hasText(concept.breakdown) ||
    hasText(concept.representation) ||
    (concept.vocabulary?.length ?? 0) > 0 ||
    (concept.childConceptIds?.length ?? 0) > 0;
  const application =
    hasText(concept.purpose) ||
    (concept.applications?.some((a) => hasText(a)) ?? false) ||
    (concept.scenarios?.some((s) => hasText(s)) ?? false);
  const transfer =
    (concept.transferPrompts?.some((t) => hasText(t)) ?? false) ||
    (concept.workedExamples?.some((w) => hasText(w)) ?? false);

  return {
    identity: Boolean(concept.id && concept.title),
    definition: hasText(concept.definition) || hasText(concept.explanation),
    structure,
    relationships,
    prerequisites,
    examples,
    nonExamples,
    misconceptions,
    visualModels:
      hasText(concept.representation) ||
      (concept.visualModels?.some((v) => hasText(v)) ?? false),
    application,
    transfer,
    practiceForms: (concept.practiceForms?.length ?? 0) > 0,
    assessmentForms:
      (concept.assessmentForms?.length ?? 0) > 0 || hasText(concept.checkPrompt),
    curriculumMappings: (concept.curriculumMappings?.length ?? 0) > 0,
  };
}

function deriveCompleteness(
  facets: Record<CoverageFacet, boolean>,
): InstructionalCompletenessState {
  if (!facets.identity) return "discovered";
  if (!facets.definition) return "identified";

  const structural =
    facets.structure || facets.relationships || facets.prerequisites;
  if (!structural) return "identified";

  const instructional =
    facets.examples &&
    facets.misconceptions &&
    (facets.practiceForms || facets.assessmentForms);
  if (!instructional) return "structured";

  const rich =
    facets.nonExamples &&
    facets.application &&
    facets.transfer &&
    facets.visualModels &&
    facets.practiceForms &&
    facets.assessmentForms;
  if (facets.curriculumMappings && rich) return "curriculum-mapped";
  if (rich) return "rich";
  return "teachable";
}

/** Score one concept's instructional coverage facets. */
export function reportConceptCoverage(
  concept: InstructionalConceptKnowledge,
): ConceptCoverageReport {
  const facets = facetPresence(concept);
  const filledCount = COVERAGE_FACETS.filter((f) => facets[f]).length;
  const derivedCompleteness = deriveCompleteness(facets);
  const declared = concept.completeness;
  const teachable =
    isAtLeastCompleteness(declared ?? derivedCompleteness, "teachable") ||
    (facets.identity &&
      facets.definition &&
      facets.examples &&
      (facets.misconceptions || facets.practiceForms) &&
      (facets.relationships || facets.prerequisites || facets.structure));

  return {
    conceptId: concept.id,
    title: concept.title,
    facets,
    filledCount,
    totalFacets: COVERAGE_FACETS.length,
    derivedCompleteness,
    declaredCompleteness: declared,
    teachable,
  };
}

/** Coverage for every concept in a pack. */
export function reportPackCoverage(packId: string): PackCoverageReport | null {
  const packs = listInstructionalPacks();
  const pack = packs.find((p) => p.id === packId);
  if (!pack) return null;
  const concepts = pack.concepts.map(reportConceptCoverage);
  return {
    packId: pack.id,
    displayTitle: pack.displayTitle,
    concepts,
    teachableCount: concepts.filter((c) => c.teachable).length,
    richCount: concepts.filter(
      (c) =>
        c.derivedCompleteness === "rich" ||
        c.derivedCompleteness === "curriculum-mapped" ||
        c.declaredCompleteness === "rich" ||
        c.declaredCompleteness === "curriculum-mapped",
    ).length,
  };
}

/** Coverage across all registered packs. */
export function reportLibraryCoverage(): PackCoverageReport[] {
  return listInstructionalPacks()
    .map((p) => reportPackCoverage(p.id))
    .filter((r): r is PackCoverageReport => r !== null);
}

/** Resolve concept by id and report coverage, or null. */
export function reportConceptCoverageById(
  conceptId: string,
): ConceptCoverageReport | null {
  const hit = findInstructionalConceptById(conceptId);
  if (!hit) return null;
  return reportConceptCoverage(hit.concept);
}

/** True when Library treats the concept as teachable (not merely named). */
export function isConceptTeachable(
  concept: InstructionalConceptKnowledge,
): boolean {
  return reportConceptCoverage(concept).teachable;
}

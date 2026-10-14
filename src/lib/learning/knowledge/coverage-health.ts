/**
 * Bundle H — Knowledge coverage health (Library quality, NOT learner mastery).
 */

import "@/lib/learning/knowledge/packs";
import {
  listInstructionalPacks,
  findInstructionalConceptById,
} from "@/lib/learning/knowledge/instructional-library";
import {
  reportConceptCoverage,
  reportLibraryCoverage,
  reportPackCoverage,
  type ConceptCoverageReport,
  type PackCoverageReport,
} from "@/lib/learning/knowledge/coverage";

export type ThinConceptReport = {
  conceptId: string;
  title: string;
  packId: string;
  reason: "definition-only" | "missing-relationships" | "missing-practice" | "missing-assessment" | "missing-misconceptions" | "not-teachable";
  missingFacets: string[];
};

export type ExpansionCandidate = {
  conceptId: string;
  title: string;
  packId: string;
  score: number;
  reasons: string[];
};

export type LibraryHealthSummary = {
  packs: PackCoverageReport[];
  totalConcepts: number;
  teachableCount: number;
  richCount: number;
  curriculumMappedCount: number;
  thin: ThinConceptReport[];
  expansionCandidates: ExpansionCandidate[];
};

function missingFacets(report: ConceptCoverageReport): string[] {
  return Object.entries(report.facets)
    .filter(([, v]) => !v)
    .map(([k]) => k);
}

export function findThinConcepts(packId?: string): ThinConceptReport[] {
  const packs = packId
    ? listInstructionalPacks().filter((p) => p.id === packId)
    : listInstructionalPacks();
  const thin: ThinConceptReport[] = [];

  for (const pack of packs) {
    for (const concept of pack.concepts) {
      const report = reportConceptCoverage(concept);
      const missing = missingFacets(report);
      let reason: ThinConceptReport["reason"] | null = null;
      if (!report.facets.definition) continue;
      if (!report.teachable) reason = "not-teachable";
      else if (
        report.facets.definition &&
        !report.facets.structure &&
        !report.facets.relationships &&
        !report.facets.examples
      ) {
        reason = "definition-only";
      } else if (!report.facets.relationships && !report.facets.prerequisites) {
        reason = "missing-relationships";
      } else if (!report.facets.practiceForms) {
        reason = "missing-practice";
      } else if (!report.facets.assessmentForms) {
        reason = "missing-assessment";
      } else if (!report.facets.misconceptions) {
        reason = "missing-misconceptions";
      }
      if (reason) {
        thin.push({
          conceptId: concept.id,
          title: concept.title,
          packId: pack.id,
          reason,
          missingFacets: missing,
        });
      }
    }
  }
  return thin;
}

/**
 * High-value expansion candidates: incomplete instructional depth +
 * relationship centrality and/or curriculum mapping present.
 * Deterministic — not LLM canonicalization.
 */
export function findExpansionCandidates(limit = 25): ExpansionCandidate[] {
  const candidates: ExpansionCandidate[] = [];
  for (const pack of listInstructionalPacks()) {
    for (const concept of pack.concepts) {
      const report = reportConceptCoverage(concept);
      if (report.teachable && report.derivedCompleteness === "rich") continue;
      if (report.derivedCompleteness === "curriculum-mapped") continue;

      const reasons: string[] = [];
      let score = 0;
      const relCount =
        (concept.relationships?.length ?? 0) +
        (concept.relatedConcepts?.length ?? 0);
      if (relCount >= 2) {
        score += 2;
        reasons.push("relationship-central");
      }
      if (report.facets.curriculumMappings) {
        score += 3;
        reasons.push("curriculum-relevant");
      }
      if (!report.facets.misconceptions) {
        score += 1;
        reasons.push("missing-misconceptions");
      }
      if (!report.facets.practiceForms) {
        score += 1;
        reasons.push("missing-practice");
      }
      if (!report.facets.transfer) {
        score += 1;
        reasons.push("missing-transfer");
      }
      if (report.facets.definition && score > 0) {
        candidates.push({
          conceptId: concept.id,
          title: concept.title,
          packId: pack.id,
          score,
          reasons,
        });
      }
    }
  }
  return candidates.sort((a, b) => b.score - a.score).slice(0, limit);
}

export function summarizeLibraryHealth(): LibraryHealthSummary {
  const packs = reportLibraryCoverage();
  let teachableCount = 0;
  let richCount = 0;
  let curriculumMappedCount = 0;
  let totalConcepts = 0;
  for (const pack of packs) {
    totalConcepts += pack.concepts.length;
    teachableCount += pack.teachableCount;
    richCount += pack.richCount;
    for (const c of pack.concepts) {
      if (c.facets.curriculumMappings) curriculumMappedCount += 1;
    }
  }
  return {
    packs,
    totalConcepts,
    teachableCount,
    richCount,
    curriculumMappedCount,
    thin: findThinConcepts(),
    expansionCandidates: findExpansionCandidates(),
  };
}

export function packHealthNote(packId: string): string {
  const pack = reportPackCoverage(packId);
  if (!pack) return `Unknown pack: ${packId}`;
  return `${pack.displayTitle}: ${pack.concepts.length} concepts, ${pack.teachableCount} teachable, ${pack.richCount} rich`;
}

/** Sanity: never treat coverage as mastery. */
export function coverageIsNotMastery(): true {
  return true;
}

export function getConceptCoverageOrNull(conceptId: string): ConceptCoverageReport | null {
  const hit = findInstructionalConceptById(conceptId);
  if (!hit) return null;
  return reportConceptCoverage(hit.concept);
}

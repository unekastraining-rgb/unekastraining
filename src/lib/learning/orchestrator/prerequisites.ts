import type {
  OrchestratorDiagnosis,
  OrchestratorResult,
} from "@/lib/learning/orchestrator/diagnose";
import { isOrchestratorPrerequisitesEnabled } from "@/lib/learning/orchestrator/prerequisites-flag";
import { getPrerequisiteConceptIds } from "@/lib/learning/knowledge/concept-relationship";
import { getLearnerConceptMastery } from "@/lib/learning/learner-model/read";
import type {
  FacetedMasteryScores,
  LearnerConceptMasterySummary,
} from "@/lib/learning/types";

/** Align with Orchestrator diagnosis WEAK/STRONG in diagnose.ts. */
export const ORCHESTRATOR_PREREQUISITE_POLICY = {
  /** Same semantic band as diagnose WEAK (0.45). */
  weak: 0.45,
  /** Same semantic band as diagnose STRONG (0.55). */
  strong: 0.55,
  /** Max direct prerequisites evaluated per Concept. */
  maxDirectPrerequisites: 5,
} as const;

export type PrerequisiteHint = {
  conceptId: string;
  conceptTitle: string;
  reason: string;
};

const GAP_DIAGNOSES: ReadonlySet<OrchestratorDiagnosis> = new Set([
  "UNDERSTANDING_GAP",
  "APPLICATION_GAP",
  "RECALL_GAP",
  "RETENTION_GAP",
]);

function totalEvidenceEvents(summary: LearnerConceptMasterySummary): number {
  const c = summary.evidenceSourceCounts;
  return c.quiz + c.flashcard + c.study_evaluate + c.other;
}

function hasMasteryEvidence(summary: LearnerConceptMasterySummary): boolean {
  return summary.reviewCount > 0 || totalEvidenceEvents(summary) > 0;
}

/** Understanding strength used for prerequisite weakness (recognize + explain). */
function understandingScore(facets: FacetedMasteryScores): number {
  return (facets.recognize + facets.explain) / 2;
}

/**
 * Deterministic weakness score for ranking (lower = weaker).
 * Uses understand + apply + retain average from existing facets.
 */
function weaknessScore(facets: FacetedMasteryScores): number {
  return (facets.recognize + facets.explain + facets.apply + facets.retain) / 4;
}

function isClearlyWeakPrerequisite(
  summary: LearnerConceptMasterySummary,
): boolean {
  if (!hasMasteryEvidence(summary)) return false;
  const { facets } = summary;
  const { weak } = ORCHESTRATOR_PREREQUISITE_POLICY;
  // Demonstrably weak understanding or overall low facet band.
  return (
    facets.recognize < weak ||
    facets.explain < weak ||
    understandingScore(facets) < weak ||
    weaknessScore(facets) < weak
  );
}

function isClearlyStrongPrerequisite(
  summary: LearnerConceptMasterySummary,
): boolean {
  if (!hasMasteryEvidence(summary)) return false;
  const { facets } = summary;
  const { strong } = ORCHESTRATOR_PREREQUISITE_POLICY;
  return facets.recognize >= strong && facets.explain >= strong;
}

function buildHintReason(prerequisiteTitle: string): string {
  return `Before continuing with this topic, you may benefit from reviewing “${prerequisiteTitle}.”`;
}

/**
 * Secondary enrichment after primary diagnosis.
 * Never changes diagnosis enum. Never throws to callers.
 */
export async function enrichOrchestratorWithPrerequisites(
  result: OrchestratorResult,
): Promise<OrchestratorResult> {
  if (!isOrchestratorPrerequisitesEnabled()) {
    return result;
  }

  if (!GAP_DIAGNOSES.has(result.diagnosis)) {
    return result;
  }

  try {
    const prerequisiteIds = await getPrerequisiteConceptIds(
      result.learnerId,
      result.conceptId,
    );

    if (prerequisiteIds.length === 0) {
      return result;
    }

    const capped = prerequisiteIds.slice(
      0,
      ORCHESTRATOR_PREREQUISITE_POLICY.maxDirectPrerequisites,
    );

    type Candidate = {
      summary: LearnerConceptMasterySummary;
      score: number;
    };

    const weakCandidates: Candidate[] = [];

    for (const prerequisiteId of capped) {
      try {
        const summary = await getLearnerConceptMastery(
          result.learnerId,
          prerequisiteId,
        );
        if (!summary) continue;
        // Cross-user / missing Concept → null from reader; skip.
        if (isClearlyStrongPrerequisite(summary)) continue;
        if (!isClearlyWeakPrerequisite(summary)) continue;
        weakCandidates.push({
          summary,
          score: weaknessScore(summary.facets),
        });
      } catch (error) {
        console.error(
          "Orchestrator prerequisite mastery lookup failed:",
          error,
        );
        // Skip this prerequisite; continue evaluating others.
      }
    }

    if (weakCandidates.length === 0) {
      return result;
    }

    // Deterministic selection: weakest score, then title, then id.
    weakCandidates.sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      const titleCmp = a.summary.conceptTitle.localeCompare(
        b.summary.conceptTitle,
      );
      if (titleCmp !== 0) return titleCmp;
      return a.summary.conceptId.localeCompare(b.summary.conceptId);
    });

    const chosen = weakCandidates[0]!.summary;
    const hint: PrerequisiteHint = {
      conceptId: chosen.conceptId,
      conceptTitle: chosen.conceptTitle,
      reason: buildHintReason(chosen.conceptTitle),
    };

    // Preserve diagnosis + SIX intervention; attach hint and soft reason bias only.
    return {
      ...result,
      reason: `${result.reason} ${hint.reason}`,
      prerequisiteHints: [hint],
    };
  } catch (error) {
    console.error("Orchestrator prerequisite enrichment failed:", error);
    return result;
  }
}

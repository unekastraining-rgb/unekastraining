import { aggregateEvidenceSignals, emptyEvidenceSignals } from "@/lib/learning/evidence/aggregate";
import { EVIDENCE_AGGREGATION_POLICY } from "@/lib/learning/evidence/aggregation-policy";
import type { EvidenceSignals } from "@/lib/learning/evidence/aggregation-types";
import { isEvidenceIntelligenceEnabled } from "@/lib/learning/evidence/intelligence-flag";
import { db } from "@/lib/db";

/**
 * Read-only LearningAttempt aggregation for one owned Concept.
 * Returns null when flag OFF or Concept not owned by learner.
 * Never throws to callers — returns empty signals on failure when owned.
 */
export async function getEvidenceSignalsForConcept(
  learnerId: string,
  conceptId: string,
): Promise<EvidenceSignals | null> {
  if (!isEvidenceIntelligenceEnabled()) {
    return null;
  }

  try {
    const concept = await db.concept.findFirst({
      where: { id: conceptId, userId: learnerId },
      select: { id: true },
    });
    if (!concept) return null;

    const rows = await db.learningAttempt.findMany({
      where: { userId: learnerId, conceptId },
      select: {
        outcome: true,
        skillFacet: true,
        sourceRefJson: true,
        misconceptionSignalsJson: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: EVIDENCE_AGGREGATION_POLICY.maxAttemptsFetched,
    });

    return aggregateEvidenceSignals(rows);
  } catch (error) {
    console.error("Evidence intelligence aggregation failed:", error);
    return emptyEvidenceSignals();
  }
}

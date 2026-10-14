/**
 * 2G-70 WS9 / 2P-45 — PERFORM evidence contract helpers.
 *
 * Real PERFORM producers exist (coding, SQL, lab, presentation, networking,
 * language). These helpers validate envelopes only.
 * Do NOT add PERFORM_GAP to the Orchestrator.
 * Do NOT treat Hands-on Practice (APPLY) as PERFORM.
 */

import type {
  EvidenceEnvelope,
  EvidenceOutcomeName,
  MasteryFacetName,
} from "@/lib/learning/types";
import { buildEvidenceEnvelope } from "@/lib/learning/evidence/envelope";

export type PerformEvidenceInput = {
  learnerId: string;
  learningObjectId: string;
  conceptId: string;
  outcome: EvidenceOutcomeName;
  score?: number | null;
  sourceRef: { kind: string; [key: string]: unknown };
  evidencePayload?: Record<string, unknown>;
  startedAt?: Date;
  endedAt?: Date;
  /**
   * If true, reject — self-confidence is not PERFORM evidence.
   * Callers must not pass confidence as the PERFORM signal.
   */
  usedSelfConfidenceAsCriterion?: boolean;
};

export type PerformEvidenceBuildResult =
  | { ok: true; envelope: EvidenceEnvelope }
  | { ok: false; reason: string };

const PERFORM_FACET: MasteryFacetName = "PERFORM";

/**
 * Build a PERFORM EvidenceEnvelope when objective evaluation exists.
 * Returns ok:false when criterion is missing / self-confidence / no concept.
 */
export function buildPerformEvidenceEnvelope(
  input: PerformEvidenceInput,
): PerformEvidenceBuildResult {
  if (input.usedSelfConfidenceAsCriterion) {
    return {
      ok: false,
      reason: "Self-confidence is not valid PERFORM evidence.",
    };
  }
  if (!input.conceptId.trim()) {
    return { ok: false, reason: "PERFORM evidence requires conceptId." };
  }
  if (!input.learnerId.trim() || !input.learningObjectId.trim()) {
    return { ok: false, reason: "PERFORM evidence requires learner and learning object." };
  }
  if (!input.sourceRef?.kind || typeof input.sourceRef.kind !== "string") {
    return { ok: false, reason: "PERFORM evidence requires opaque sourceRef.kind." };
  }

  const envelope = buildEvidenceEnvelope({
    learnerId: input.learnerId,
    learningObjectId: input.learningObjectId,
    conceptId: input.conceptId,
    skillFacet: PERFORM_FACET,
    outcome: input.outcome,
    score: input.score ?? null,
    sourceRef: input.sourceRef,
    evidencePayload: input.evidencePayload ?? {},
    startedAt: input.startedAt,
    endedAt: input.endedAt,
  });

  return { ok: true, envelope };
}

export function isPerformSkillFacet(facet: string): facet is "PERFORM" {
  return facet === "PERFORM";
}

/**
 * 2P-45 — bridge status aligned with EVIDENCE-CLOSED producers.
 * Completion is not PERFORM evidence. Hands-on Practice is not PERFORM.
 */
export function performProductBridgeStatus(): {
  maturity: "EVIDENCE-CLOSED";
  realPerformProducerExists: true;
  handsOnEqualsPerform: false;
  orchestratorPerformGapAdded: false;
  helpersReady: true;
  completionIsNotEvidence: true;
} {
  return {
    maturity: "EVIDENCE-CLOSED",
    realPerformProducerExists: true,
    handsOnEqualsPerform: false,
    orchestratorPerformGapAdded: false,
    helpersReady: true,
    completionIsNotEvidence: true,
  };
}

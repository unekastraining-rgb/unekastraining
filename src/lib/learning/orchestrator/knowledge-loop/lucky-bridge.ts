/**
 * Phase 5 — Lucky → Knowledge Library recall evidence bridge.
 *
 * Observes retention review outcomes when a real KL concept can be resolved.
 * Does NOT rewrite Lucky scheduling, SM-2, or ULE evidence.
 */

import { resolveEvidenceConceptsForTopic } from "@/lib/learning/learner-state/concept-identity";
import { isRegisteredKnowledgeConceptId } from "@/lib/learning/learner-state/concept-identity";
import { ensureLearnerStatePersistence } from "@/lib/learning/learner-state/ensure-persistence";
import { recordLearningEvidence } from "@/lib/learning/learner-state/service";
import type { LearningEvidenceOutcome } from "@/lib/learning/learner-state/types";

function parseMeta(json: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(json) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    /* ignore */
  }
  return {};
}

function outcomeFromLucky(
  outcome: "SUCCESS" | "PARTIAL" | "FAIL" | "SKIPPED",
): LearningEvidenceOutcome | null {
  if (outcome === "SKIPPED") return null;
  if (outcome === "SUCCESS") return "correct";
  if (outcome === "PARTIAL") return "attempted";
  return "incorrect";
}

/**
 * Best-effort KL recall evidence from a Lucky retention review.
 * Returns without writing when no registered KL concept can be resolved.
 */
export async function maybeRecordLuckyKnowledgeRecall(input: {
  userId: string;
  retentionItemId: string;
  reviewCount: number;
  metadataJson: string;
  conceptTitle?: string | null;
  sourceLabel?: string | null;
  outcome: "SUCCESS" | "PARTIAL" | "FAIL" | "SKIPPED";
}): Promise<void> {
  const klOutcome = outcomeFromLucky(input.outcome);
  if (!klOutcome) return;

  const meta = parseMeta(input.metadataJson);
  const explicitId =
    typeof meta.knowledgeConceptId === "string"
      ? meta.knowledgeConceptId.trim()
      : "";

  let conceptIds: string[] = [];
  if (explicitId && isRegisteredKnowledgeConceptId(explicitId)) {
    conceptIds = [explicitId];
  } else {
    const topicHint = [
      typeof meta.topic === "string" ? meta.topic : null,
      typeof meta.knowledgeLibraryTopic === "string"
        ? meta.knowledgeLibraryTopic
        : null,
      input.conceptTitle,
      input.sourceLabel,
    ]
      .filter(Boolean)
      .join(" ");
    conceptIds = resolveEvidenceConceptsForTopic(topicHint).map(
      (r) => r.conceptId,
    );
  }

  if (conceptIds.length === 0) return;

  try {
    await ensureLearnerStatePersistence();
    for (const conceptId of conceptIds) {
      await recordLearningEvidence({
        userId: input.userId,
        type: "recall_result",
        conceptId,
        outcome: klOutcome,
        source: "lucky-retention",
        eventKey: `lucky:${input.retentionItemId}:rev${input.reviewCount}:${conceptId}`,
        metadata: {
          retentionItemId: input.retentionItemId,
          luckyOutcome: input.outcome,
        },
      });
    }
  } catch (err) {
    console.error("Phase 5 Lucky→KL recall bridge failed:", err);
  }
}

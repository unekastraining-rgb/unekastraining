/**
 * Phase 13 — Instructional response history ("what have we already tried?").
 * Derived from existing evidence types/sources — no second event system.
 */

import type { LearningEvidence } from "@/lib/learning/learner-state/types";
import type { InstructionalResponseRecord } from "@/lib/learning/learner-model/knowledge-loop/types";

function techniqueFromEvidence(e: LearningEvidence): string {
  const metaTechnique =
    typeof e.metadata?.technique === "string"
      ? e.metadata.technique
      : typeof e.metadata?.sixComponent === "string"
        ? e.metadata.sixComponent
        : null;
  if (metaTechnique) return metaTechnique;

  switch (e.type) {
    case "lesson_exposure":
      return "detailed-explanation";
    case "explanation_attempt":
      return e.source?.includes("feynman") ? "feynman" : "detailed-explanation";
    case "visualization_attempt":
      return "visualization";
    case "application_attempt":
    case "practice_attempt":
      return "hands-on-practice";
    case "recall_result":
      return "active-recall";
    case "check_attempt":
      return "check";
    default:
      return e.type;
  }
}

export function deriveInstructionalResponseHistory(
  userId: string,
  evidence: readonly LearningEvidence[],
  conceptId?: string,
): InstructionalResponseRecord[] {
  return evidence
    .filter((e) => e.userId === userId)
    .filter((e) => (conceptId ? e.conceptId === conceptId : Boolean(e.conceptId)))
    .filter((e) => e.type !== "lesson_exposure" || Boolean(e.conceptId))
    .slice()
    .sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime())
    .map((e) => ({
      conceptId: e.conceptId!,
      technique: techniqueFromEvidence(e),
      outcome: e.outcome,
      occurredAt: e.occurredAt,
      source: e.source,
      evidenceId: e.id,
    }));
}

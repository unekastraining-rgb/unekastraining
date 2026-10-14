/**
 * Phase 13 — Map LearningEvidence → capability buckets (derive only).
 */

import type { LearningEvidence } from "@/lib/learning/learner-state/types";
import type {
  CapabilityEvidence,
  CapabilityKind,
} from "@/lib/learning/learner-model/knowledge-loop/types";

const EXPLANATION_TYPES = new Set([
  "explanation_attempt",
  "check_attempt",
]);
const APPLICATION_TYPES = new Set([
  "application_attempt",
  "practice_attempt",
]);
const RECALL_TYPES = new Set(["recall_result"]);
const VISUALIZATION_TYPES = new Set(["visualization_attempt"]);

export function capabilityKindFromEvidence(
  evidence: LearningEvidence,
): CapabilityKind | null {
  if (EXPLANATION_TYPES.has(evidence.type)) return "explanation";
  if (APPLICATION_TYPES.has(evidence.type)) return "application";
  if (RECALL_TYPES.has(evidence.type)) return "recall";
  if (VISUALIZATION_TYPES.has(evidence.type)) return "visualization";
  return null;
}

export function toCapabilityEvidence(
  evidence: LearningEvidence,
): CapabilityEvidence | null {
  if (!evidence.conceptId) return null;
  const capability = capabilityKindFromEvidence(evidence);
  if (!capability) return null;
  return {
    conceptId: evidence.conceptId,
    capability,
    evidenceType: evidence.type,
    outcome: evidence.outcome,
    occurredAt: evidence.occurredAt,
    source: evidence.source,
    evidenceId: evidence.id,
  };
}

export function deriveCapabilityEvidence(
  userId: string,
  evidence: readonly LearningEvidence[],
  conceptId?: string,
): {
  explanation: CapabilityEvidence[];
  application: CapabilityEvidence[];
  recall: CapabilityEvidence[];
  visualization: CapabilityEvidence[];
} {
  const buckets = {
    explanation: [] as CapabilityEvidence[],
    application: [] as CapabilityEvidence[],
    recall: [] as CapabilityEvidence[],
    visualization: [] as CapabilityEvidence[],
  };

  for (const e of evidence) {
    if (e.userId !== userId) continue;
    if (conceptId && e.conceptId !== conceptId) continue;
    const cap = toCapabilityEvidence(e);
    if (!cap) continue;
    buckets[cap.capability].push(cap);
  }

  const byTime = (a: CapabilityEvidence, b: CapabilityEvidence) =>
    b.occurredAt.getTime() - a.occurredAt.getTime();
  buckets.explanation.sort(byTime);
  buckets.application.sort(byTime);
  buckets.recall.sort(byTime);
  buckets.visualization.sort(byTime);
  return buckets;
}

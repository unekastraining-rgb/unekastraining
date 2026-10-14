/**
 * Phase 13 — Learning history summaries from evidence (derive only).
 */

import type {
  LearningEvidence,
  LearnerConceptState,
} from "@/lib/learning/learner-state/types";
import type {
  LearningActivitySummary,
  LearningProgression,
} from "@/lib/learning/learner-model/knowledge-loop/types";

export function deriveRecentActivity(
  userId: string,
  evidence: readonly LearningEvidence[],
  limit = 25,
): LearningActivitySummary[] {
  return evidence
    .filter((e) => e.userId === userId)
    .slice()
    .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
    .slice(0, limit)
    .map((e) => ({
      evidenceId: e.id,
      conceptId: e.conceptId,
      type: e.type,
      outcome: e.outcome,
      occurredAt: e.occurredAt,
      source: e.source,
    }));
}

export function deriveRecentConcepts(
  userId: string,
  evidence: readonly LearningEvidence[],
  limit = 10,
): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];
  const sorted = evidence
    .filter((e) => e.userId === userId && e.conceptId)
    .slice()
    .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());
  for (const e of sorted) {
    const id = e.conceptId!;
    if (seen.has(id)) continue;
    seen.add(id);
    ordered.push(id);
    if (ordered.length >= limit) break;
  }
  return ordered;
}

export function deriveProgression(
  concepts: readonly LearnerConceptState[],
): LearningProgression[] {
  return concepts.map((c) => ({
    conceptId: c.conceptId,
    exposureCount: c.exposureCount,
    attemptCount: c.attemptCount,
    correctCount: c.correctCount,
    incorrectCount: c.incorrectCount,
    lastOutcome: c.lastOutcome,
    lastSeenAt: c.lastSeenAt,
  }));
}

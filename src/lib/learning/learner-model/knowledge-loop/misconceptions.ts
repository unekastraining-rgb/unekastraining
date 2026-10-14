/**
 * Phase 13 — Misconception signals from sufficient evidence only.
 * One incorrect attempt is never enough. Never invents intelligence labels.
 */

import type { LearningEvidence } from "@/lib/learning/learner-state/types";
import type { MisconceptionEvidence } from "@/lib/learning/learner-model/knowledge-loop/types";

/** Minimum incorrect observations before a misconception signal is recorded. */
export const MISCONCEPTION_MIN_INCORRECT = 2;

export function deriveMisconceptionEvidence(
  userId: string,
  evidence: readonly LearningEvidence[],
  conceptId?: string,
): MisconceptionEvidence[] {
  const byConcept = new Map<
    string,
    { count: number; last: Date; source?: string }
  >();

  for (const e of evidence) {
    if (e.userId !== userId) continue;
    if (!e.conceptId) continue;
    if (conceptId && e.conceptId !== conceptId) continue;
    if (e.outcome !== "incorrect") continue;

    const cur = byConcept.get(e.conceptId) ?? {
      count: 0,
      last: e.occurredAt,
      source: e.source,
    };
    cur.count += 1;
    if (e.occurredAt.getTime() >= cur.last.getTime()) {
      cur.last = e.occurredAt;
      cur.source = e.source ?? cur.source;
    }
    byConcept.set(e.conceptId, cur);
  }

  const out: MisconceptionEvidence[] = [];
  for (const [id, v] of byConcept) {
    if (v.count < MISCONCEPTION_MIN_INCORRECT) continue;
    out.push({
      conceptId: id,
      signal: "repeated_incorrect_on_concept",
      evidenceCount: v.count,
      lastObservedAt: v.last,
      source: v.source,
    });
  }
  return out.sort(
    (a, b) => b.lastObservedAt.getTime() - a.lastObservedAt.getTime(),
  );
}

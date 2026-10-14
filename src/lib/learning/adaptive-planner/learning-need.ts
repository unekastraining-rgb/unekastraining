/**
 * Phase 15 — Learning need generation from academic deadlines + learner evidence.
 * Uses Orchestrator for WHAT and Six Intelligence for HOW — does not re-decide.
 */

import type { AcademicItem } from "@/lib/learning/academic/types";
import { urgencyFromDueAt } from "@/lib/learning/academic/infer";
import type { ConceptLearningNeed } from "@/lib/learning/learner-model/knowledge-loop/types";
import type { LearningNeed } from "@/lib/learning/adaptive-planner/types";
import type { KnowledgeLearningAction } from "@/lib/learning/orchestrator/knowledge-loop/types";

function maxUrgency(
  a: LearningNeed["urgency"],
  b: LearningNeed["urgency"],
): LearningNeed["urgency"] {
  const rank = { low: 0, medium: 1, high: 2 };
  return rank[a] >= rank[b] ? a : b;
}

/**
 * Combine Orchestrator-backed concept need with academic deadline urgency.
 */
export function buildLearningNeed(input: {
  conceptNeed: ConceptLearningNeed;
  academicItem?: AcademicItem | null;
}): LearningNeed {
  const dueUrgency = input.academicItem?.dueAt
    ? urgencyFromDueAt(input.academicItem.dueAt)
    : "low";
  return {
    conceptId: input.conceptNeed.conceptId,
    action: input.conceptNeed.action,
    urgency: maxUrgency(input.conceptNeed.urgency, dueUrgency),
    reason: input.academicItem
      ? `${input.conceptNeed.reason} (due: ${input.academicItem.title})`
      : input.conceptNeed.reason,
    evidence: [
      ...input.conceptNeed.evidence,
      ...(input.academicItem?.dueAt ? [`due:${input.academicItem.dueAt.toISOString()}`] : []),
    ],
    recommendedSix: input.conceptNeed.recommendedSix,
    academicItemId: input.academicItem?.id,
    dueAt: input.academicItem?.dueAt ?? null,
  };
}

/**
 * Build needs from academic items that already carry learning targets,
 * using precomputed concept needs (caller supplies Orchestrator-backed needs).
 */
export function learningNeedsFromAcademicItems(input: {
  items: readonly AcademicItem[];
  conceptNeeds: ReadonlyMap<string, ConceptLearningNeed>;
}): LearningNeed[] {
  const needs: LearningNeed[] = [];
  const seen = new Set<string>();

  const sorted = [...input.items].sort((a, b) => {
    const ad = a.dueAt?.getTime() ?? Number.POSITIVE_INFINITY;
    const bd = b.dueAt?.getTime() ?? Number.POSITIVE_INFINITY;
    return ad - bd;
  });

  for (const item of sorted) {
    for (const target of item.learningTargets ?? []) {
      const key = `${item.id}:${target.conceptId}`;
      if (seen.has(key)) continue;
      const conceptNeed = input.conceptNeeds.get(target.conceptId);
      if (!conceptNeed) continue;
      seen.add(key);
      needs.push(buildLearningNeed({ conceptNeed, academicItem: item }));
    }
  }
  return needs;
}

/** Sort needs: urgency desc, then due date asc, then action priority. */
export function sortLearningNeeds(needs: readonly LearningNeed[]): LearningNeed[] {
  const actionRank: Record<KnowledgeLearningAction, number> = {
    reteach: 0,
    teach: 1,
    practice: 2,
    recall: 3,
    advance: 4,
    complete: 5,
  };
  const urgencyRank = { high: 0, medium: 1, low: 2 };
  return [...needs].sort((a, b) => {
    const u = urgencyRank[a.urgency] - urgencyRank[b.urgency];
    if (u !== 0) return u;
    const ad = a.dueAt?.getTime() ?? Number.POSITIVE_INFINITY;
    const bd = b.dueAt?.getTime() ?? Number.POSITIVE_INFINITY;
    if (ad !== bd) return ad - bd;
    return actionRank[a.action] - actionRank[b.action];
  });
}

export function roomForAction(
  action: KnowledgeLearningAction,
): "learn" | "practice" | "remember" | undefined {
  switch (action) {
    case "teach":
    case "reteach":
    case "advance":
      return "learn";
    case "practice":
      return "practice";
    case "recall":
      return "remember";
    default:
      return undefined;
  }
}

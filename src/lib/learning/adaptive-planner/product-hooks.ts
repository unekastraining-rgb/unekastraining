/**
 * Bundle J — Product-facing planner preview over existing adaptive-planner.
 * Planner = WHEN; does not replace Orchestrator.
 */

import type { AcademicItem } from "@/lib/learning/academic/types";
import { buildAdaptiveLearningPlan } from "@/lib/learning/adaptive-planner/plan";

export type PlannerProductPreview = {
  needCount: number;
  scheduledCount: number;
  nextTitle?: string;
  nextDueAt?: string;
  honestyNote: string;
};

/**
 * Preview of study needs from normalized academic items + learner evidence.
 */
export async function planPreviewFromAcademicItems(input: {
  userId: string;
  items: AcademicItem[];
  now?: Date;
}): Promise<PlannerProductPreview> {
  const plan = await buildAdaptiveLearningPlan({
    userId: input.userId,
    items: input.items,
    now: input.now,
  });

  const next = plan.activities[0] ?? null;
  return {
    needCount: plan.needs.length,
    scheduledCount: plan.activities.length,
    nextTitle: next?.title,
    nextDueAt: next?.scheduledStartAt?.toISOString?.(),
    honestyNote:
      "Planner schedules when to study. Completing a plan item is not mastery — Learner Model tracks evidence.",
  };
}

/** Sync honesty stub when no user/items — for UI empty states. */
export function emptyPlannerProductPreview(): PlannerProductPreview {
  return {
    needCount: 0,
    scheduledCount: 0,
    honestyNote:
      "Planner schedules when to study. Completing a plan item is not mastery — Learner Model tracks evidence.",
  };
}

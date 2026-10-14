/**
 * Phase 15 — Schedule LearningNeeds into study windows (deterministic).
 * Does not replace calendar. Does not re-decide Orchestrator/Six.
 */

import {
  roomForAction,
  sortLearningNeeds,
} from "@/lib/learning/adaptive-planner/learning-need";
import type {
  AdaptivePlan,
  LearningNeed,
  PlannedLearningActivity,
  StudyWindow,
} from "@/lib/learning/adaptive-planner/types";
import { findKnowledgeConceptById } from "@/lib/learning/learner-state/concept-identity";

const DEFAULT_MINUTES: Record<string, number> = {
  teach: 30,
  reteach: 30,
  practice: 25,
  recall: 15,
  advance: 25,
  complete: 10,
};

/**
 * Place sorted learning needs into available study windows.
 * Prerequisite-aware: if need A lists concept as prerequisite of B via order in needs,
 * earlier needs (already sorted by urgency/due) are scheduled first.
 */
export function scheduleLearningActivities(input: {
  userId: string;
  needs: readonly LearningNeed[];
  windows: readonly StudyWindow[];
  now?: Date;
}): AdaptivePlan {
  const now = input.now ?? new Date();
  const needs = sortLearningNeeds(input.needs);
  const windows = [...input.windows].sort(
    (a, b) => a.startAt.getTime() - b.startAt.getTime(),
  );
  const activities: PlannedLearningActivity[] = [];
  const windowsUsed: StudyWindow[] = [];
  let windowIdx = 0;
  let windowCursor: Date | null = null;

  for (const need of needs) {
    if (need.action === "complete") continue;
    const minutes = DEFAULT_MINUTES[need.action] ?? 25;

    while (windowIdx < windows.length) {
      const w = windows[windowIdx];
      const start: Date =
        windowCursor && windowCursor > w.startAt ? windowCursor : w.startAt;
      const remaining = Math.round((w.endAt.getTime() - start.getTime()) / 60_000);
      if (remaining < Math.min(minutes, 15)) {
        windowIdx += 1;
        windowCursor = null;
        continue;
      }
      const blockMinutes = Math.min(minutes, remaining);
      const end: Date = new Date(start.getTime() + blockMinutes * 60_000);
      const concept = findKnowledgeConceptById(need.conceptId);
      activities.push({
        id: `plan:${need.conceptId}:${start.toISOString()}`,
        conceptId: need.conceptId,
        title: concept?.concept.title ?? need.conceptId.replace(/-/g, " "),
        action: need.action,
        sixTechnique: need.recommendedSix?.technique ?? null,
        scheduledStartAt: start,
        scheduledEndAt: end,
        minutes: blockMinutes,
        urgency: need.urgency,
        reason: need.reason,
        academicItemId: need.academicItemId,
        room: roomForAction(need.action),
      });
      if (!windowsUsed.includes(w)) windowsUsed.push(w);
      windowCursor = end;
      if (Math.round((w.endAt.getTime() - end.getTime()) / 60_000) < 15) {
        windowIdx += 1;
        windowCursor = null;
      }
      break;
    }
  }

  return {
    userId: input.userId,
    generatedAt: now,
    needs: [...needs],
    activities,
    windowsUsed,
  };
}

/**
 * Recalculate plan after evidence changes — pure re-run with new needs.
 */
export function recalculateAdaptivePlan(input: {
  userId: string;
  needs: readonly LearningNeed[];
  windows: readonly StudyWindow[];
  now?: Date;
}): AdaptivePlan {
  return scheduleLearningActivities(input);
}

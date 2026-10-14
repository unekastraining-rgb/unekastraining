/**
 * Phase 15 — Adaptive Planner entry (read-only planning).
 * Academic → Learning targets → Learner needs → schedule into study windows.
 */

import type { AcademicItem } from "@/lib/learning/academic/types";
import { attachLearningTargets } from "@/lib/learning/academic/learning-targets";
import type { AssignmentTopicCandidate } from "@/lib/learning/school-lms/assignment-concept-bridge";
import { getConceptLearningNeed } from "@/lib/learning/learner-model/knowledge-loop/read";
import type { ConceptLearningNeed } from "@/lib/learning/learner-model/knowledge-loop/types";
import {
  learningNeedsFromAcademicItems,
} from "@/lib/learning/adaptive-planner/learning-need";
import {
  findAvailableStudyWindows,
  type BusyInterval,
} from "@/lib/learning/adaptive-planner/study-windows";
import { scheduleLearningActivities } from "@/lib/learning/adaptive-planner/schedule";
import type { AdaptivePlan } from "@/lib/learning/adaptive-planner/types";
import { isProtectedSpecializedTopic } from "@/lib/learning/knowledge/retrieval/normalize-target";
import { findKnowledgeConceptById } from "@/lib/learning/learner-state/concept-identity";

/**
 * Build an adaptive learning plan from academic items + learner evidence.
 * Does not write calendar events. Does not replace LMS sync.
 */
export async function buildAdaptiveLearningPlan(input: {
  userId: string;
  items: readonly AcademicItem[];
  topics?: readonly AssignmentTopicCandidate[];
  busy?: readonly BusyInterval[];
  rangeStart?: Date;
  rangeEnd?: Date;
  now?: Date;
}): Promise<AdaptivePlan> {
  const now = input.now ?? new Date();
  const rangeStart = input.rangeStart ?? now;
  const rangeEnd =
    input.rangeEnd ?? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Ownership filter
  const ownedItems = input.items.filter((i) => i.userId === input.userId);

  const withTargets = ownedItems.map((item) =>
    item.learningTargets?.length
      ? item
      : attachLearningTargets(item, input.topics),
  );

  // Collect unique concept ids (skip protected OOD titles as planner concepts).
  const conceptIds = new Set<string>();
  for (const item of withTargets) {
    for (const t of item.learningTargets ?? []) {
      if (isProtectedSpecializedTopic(t.title ?? t.conceptId)) continue;
      if (!findKnowledgeConceptById(t.conceptId)) continue;
      conceptIds.add(t.conceptId);
    }
  }

  const conceptNeeds = new Map<string, ConceptLearningNeed>();
  for (const conceptId of conceptIds) {
    const need = await getConceptLearningNeed(input.userId, conceptId);
    if (need) conceptNeeds.set(conceptId, need);
  }

  const needs = learningNeedsFromAcademicItems({
    items: withTargets,
    conceptNeeds,
  });

  const windows = findAvailableStudyWindows({
    rangeStart,
    rangeEnd,
    busy: input.busy ?? [],
  });

  return scheduleLearningActivities({
    userId: input.userId,
    needs,
    windows,
    now,
  });
}

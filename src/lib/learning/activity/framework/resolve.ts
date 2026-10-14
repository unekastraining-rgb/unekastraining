/**
 * Phase 17 — Resolve LearningActivityDescriptor from Orchestrator / Planner / Core.
 * Does not re-decide WHAT or HOW — only selects the DO surface.
 */

import {
  getActivityRegistryEntry,
} from "@/lib/learning/activity/framework/registry";
import type {
  LearningActivityDescriptor,
  LearningActivityType,
} from "@/lib/learning/activity/framework/types";
import type { KnowledgeLearningAction } from "@/lib/learning/orchestrator/knowledge-loop/types";
import type { SixComponent } from "@/lib/csl/six";
import type { LearningNeed } from "@/lib/learning/adaptive-planner/types";
import type { PlannedLearningActivity } from "@/lib/learning/adaptive-planner/types";
import type { CoreLearningContent } from "@/lib/learning/core/types";
import { isProtectedSpecializedTopic } from "@/lib/learning/knowledge/retrieval/normalize-target";

/**
 * Map Orchestrator WHAT (+ optional Six HOW) → activity type.
 */
export function activityTypeForOrchestratorAction(
  action: KnowledgeLearningAction,
  six?: SixComponent | null,
): LearningActivityType {
  if (action === "recall") return "recall";
  if (action === "teach" || action === "reteach" || action === "advance") {
    if (six === "visualization") return "visual";
    if (six === "feynman") return "lesson";
    return "lesson";
  }
  if (action === "practice") {
    if (six === "visualization") return "visual";
    if (six === "active-recall") return "recall";
    if (six === "feynman") return "writing";
    return "practice";
  }
  return "lesson";
}

export function resolveLearningActivity(input: {
  type?: LearningActivityType;
  conceptIds: string[];
  learningTarget?: string;
  title?: string;
  orchestratorAction?: KnowledgeLearningAction;
  sixTechnique?: SixComponent | null;
  source?: LearningActivityDescriptor["source"];
  status?: LearningActivityDescriptor["status"];
  id?: string;
}): LearningActivityDescriptor | null {
  const conceptIds = input.conceptIds.filter(Boolean);
  if (conceptIds.length === 0 && !input.learningTarget) return null;

  // OOD protected — do not force generic activity resolution over specialized path.
  if (
    input.learningTarget &&
    isProtectedSpecializedTopic(input.learningTarget)
  ) {
    return {
      id: input.id ?? `activity:ood:${input.learningTarget}`,
      type: "lesson",
      conceptIds,
      learningTarget: input.learningTarget,
      title: input.title ?? input.learningTarget,
      source: input.source,
      status: input.status ?? "available",
      orchestratorAction: input.orchestratorAction ?? "teach",
      sixTechnique: input.sixTechnique ?? null,
      implementationKey: "ood-specialized",
    };
  }

  const type =
    input.type ??
    (input.orchestratorAction
      ? activityTypeForOrchestratorAction(
          input.orchestratorAction,
          input.sixTechnique,
        )
      : "lesson");

  const entry = getActivityRegistryEntry(type);
  return {
    id:
      input.id ??
      `activity:${type}:${conceptIds[0] ?? input.learningTarget ?? "topic"}`,
    type,
    conceptIds,
    learningTarget: input.learningTarget,
    title: input.title,
    source: input.source,
    status: input.status ?? "available",
    orchestratorAction:
      input.orchestratorAction ?? entry?.defaultOrchestratorAction,
    sixTechnique:
      input.sixTechnique ?? entry?.defaultSixTechnique ?? null,
    implementationKey: entry?.implementationKey,
  };
}

/** Planner WHEN → activity DO descriptor. */
export function learningActivityFromPlanned(
  planned: PlannedLearningActivity,
): LearningActivityDescriptor | null {
  return resolveLearningActivity({
    conceptIds: [planned.conceptId],
    title: planned.title,
    orchestratorAction: planned.action,
    sixTechnique: planned.sixTechnique,
    source: {
      academicItemId: planned.academicItemId,
    },
    id: `activity:planned:${planned.id}`,
  });
}

/** Learning need → activity descriptor. */
export function learningActivityFromNeed(
  need: LearningNeed,
): LearningActivityDescriptor | null {
  return resolveLearningActivity({
    conceptIds: [need.conceptId],
    orchestratorAction: need.action,
    sixTechnique: need.recommendedSix?.technique,
    source: { academicItemId: need.academicItemId },
  });
}

/** Core association → activity descriptors (learn/practice/recall). */
export function learningActivitiesFromCore(
  content: CoreLearningContent,
): LearningActivityDescriptor[] {
  const conceptId = content.concepts?.[0]?.conceptId;
  if (!conceptId) return [];
  const base = {
    conceptIds: [conceptId],
    learningTarget: content.title,
    source: { coreSourceId: content.sourceId },
  };
  return [
    resolveLearningActivity({
      ...base,
      type: "lesson",
      orchestratorAction: "teach",
      sixTechnique: "detailed-explanation",
    }),
    resolveLearningActivity({
      ...base,
      type: "practice",
      orchestratorAction: "practice",
      sixTechnique: "hands-on-practice",
    }),
    resolveLearningActivity({
      ...base,
      type: "recall",
      orchestratorAction: "recall",
      sixTechnique: "active-recall",
    }),
  ].filter((a): a is LearningActivityDescriptor => Boolean(a));
}

/**
 * Prefer coding when Six says hands-on and concept looks programming-related.
 */
export function preferCodingActivity(input: {
  conceptId: string;
  sixTechnique?: SixComponent | null;
}): LearningActivityType {
  if (input.sixTechnique === "hands-on-practice") {
    if (/^(java|python|sql|coding)/i.test(input.conceptId) ||
        /java|python|arraylist|exception|loop|function/.test(input.conceptId)) {
      return "coding";
    }
  }
  return "practice";
}

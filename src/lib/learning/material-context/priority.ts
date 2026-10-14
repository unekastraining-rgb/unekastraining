/**
 * 2P-28 — Deterministic source priority (no ranking engine).
 *
 * 1. Explicit learner-selected / start URL materialId
 * 2. Activity-associated materialId (query)
 * 3. Concept-linked material (note reverse-lookup)
 * 4. LearningSpace-associated material
 * 5. No source
 */

import type { MaterialContextPrioritySource } from "./types";

export const MATERIAL_CONTEXT_PRIORITY_ORDER = [
  "explicit",
  "activity",
  "concept",
  "learning_space",
  "none",
] as const satisfies readonly MaterialContextPrioritySource[];

export function pickMaterialContextPriority(input: {
  explicitMaterialId?: string | null;
  activityMaterialId?: string | null;
  conceptMaterialId?: string | null;
  learningSpaceMaterialId?: string | null;
}): {
  materialId: string | null;
  prioritySource: MaterialContextPrioritySource;
} {
  const explicit = input.explicitMaterialId?.trim() || "";
  if (explicit) return { materialId: explicit, prioritySource: "explicit" };

  const activity = input.activityMaterialId?.trim() || "";
  if (activity) return { materialId: activity, prioritySource: "activity" };

  const concept = input.conceptMaterialId?.trim() || "";
  if (concept) return { materialId: concept, prioritySource: "concept" };

  const space = input.learningSpaceMaterialId?.trim() || "";
  if (space) return { materialId: space, prioritySource: "learning_space" };

  return { materialId: null, prioritySource: "none" };
}

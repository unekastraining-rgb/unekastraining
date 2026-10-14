/**
 * 2P-8 — Objective ↔ learning-characteristic mapping (mechanism layer, not subjects).
 */

import type { ActivityLearningCharacteristic } from "@/lib/learning/orchestrator/activity-intervention-capability";
import {
  listCapabilitiesSupportingCharacteristic,
  getActivityInterventionCapability,
} from "@/lib/learning/orchestrator/activity-intervention-capability";
import type { UniversalContentActivityKind } from "@/lib/learning/activities/content-contract";
import type { LearningObjectiveSpec } from "./types";

const MEANINGFUL_OBJECTIVE_MIN = 12;

const GENERIC_OBJECTIVES = [
  /^complete (this|the) (task|activity)/i,
  /^practice this concept/i,
  /^solve the problem$/i,
  /^enter your answer/i,
];

export function isMeaningfulObjective(text: string): boolean {
  const t = text.trim();
  if (t.length < MEANINGFUL_OBJECTIVE_MIN) return false;
  return !GENERIC_OBJECTIVES.some((re) => re.test(t));
}

/**
 * Suggest Universal Activity mechanisms whose capabilities support the
 * objective's required characteristics. Does NOT select Orchestrator intervention.
 */
export function suggestActivityKindsForObjective(
  objective: LearningObjectiveSpec,
): UniversalContentActivityKind[] {
  const scores = new Map<string, number>();
  for (const characteristic of objective.requiredCharacteristics) {
    for (const cap of listCapabilitiesSupportingCharacteristic(characteristic)) {
      if (!cap.interventionEligible && !cap.assessmentOnly) continue;
      // Only Universal Activity kinds (not quiz/flashcard specialized).
      const key = cap.adapterKey;
      if (
        ![
          "coding",
          "sql",
          "lab",
          "simulation",
          "game",
          "writing",
          "project",
          "presentation",
        ].includes(key)
      ) {
        continue;
      }
      scores.set(key, (scores.get(key) ?? 0) + 1);
    }
  }
  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([k]) => k as UniversalContentActivityKind);
}

export function capabilitySupportsCharacteristics(
  activityKind: UniversalContentActivityKind,
  characteristics: readonly ActivityLearningCharacteristic[],
): boolean {
  const cap = getActivityInterventionCapability(activityKind);
  if (!cap) return false;
  if (characteristics.length === 0) return true;
  return characteristics.some((c) =>
    cap.supportsLearningCharacteristics.includes(c),
  );
}

export function makeLearningObjective(
  input: LearningObjectiveSpec,
): LearningObjectiveSpec {
  return {
    objectiveId: input.objectiveId.trim(),
    conceptTitle: input.conceptTitle.trim(),
    conceptId: input.conceptId?.trim() || null,
    objective: input.objective.trim(),
    domainContext: input.domainContext?.trim() || null,
    requiredCharacteristics: [...input.requiredCharacteristics],
    preferredFacet: input.preferredFacet ?? null,
  };
}

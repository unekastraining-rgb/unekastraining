/**
 * Bundle H — Concept → Learning Activity Framework preferences.
 * Knowledge says what can be practiced; LAF decides how it is represented.
 */

import { findInstructionalConceptById } from "@/lib/learning/knowledge/instructional-library";
import type { LearningActivityType } from "@/lib/learning/activity/framework/types";
import { LEARNING_ACTIVITY_REGISTRY } from "@/lib/learning/activity/framework/registry";

export type ConceptActivitySuggestion = {
  conceptId: string;
  activityType: LearningActivityType;
  evidenceType: string;
  implementationKey: string;
  reason: string;
  practiceForms: string[];
};

/**
 * Map authored practiceForms (+ domain heuristics) onto existing LAF activity types.
 * Never invents a new activity framework.
 */
export function suggestActivitiesForConcept(
  conceptId: string,
): ConceptActivitySuggestion[] {
  const hit = findInstructionalConceptById(conceptId);
  if (!hit) return [];

  const forms = (hit.concept.practiceForms ?? []).map((f) => f.toLowerCase());
  const domain = hit.pack.domain;
  const suggestions: ConceptActivitySuggestion[] = [];

  const push = (
    type: LearningActivityType,
    reason: string,
  ) => {
    const entry = LEARNING_ACTIVITY_REGISTRY.find((e) => e.type === type);
    if (!entry) return;
    if (suggestions.some((s) => s.activityType === type)) return;
    suggestions.push({
      conceptId,
      activityType: type,
      evidenceType: entry.defaultEvidenceType,
      implementationKey: entry.implementationKey,
      reason,
      practiceForms: hit.concept.practiceForms ?? [],
    });
  };

  // Always allow lesson + practice + recall as the core loop.
  push("lesson", "Teach from canonical knowledge");
  push("practice", "Practice forms available on concept");
  push("recall", "Retention / active recall");

  if (
    forms.some((f) => /code|trace|compile|debug/.test(f)) ||
    domain === "programming"
  ) {
    push("coding", "Programming practiceForms / domain");
  }
  if (forms.some((f) => /sql|join|query/.test(f)) || conceptId.startsWith("sql-")) {
    push("sql", "SQL practiceForms / concept family");
  }
  if (
    forms.some((f) => /write|revise|thesis|paragraph|essay|draft/.test(f)) ||
    conceptId.startsWith("writing-")
  ) {
    push("writing", "Writing practiceForms / writing domain");
  }
  if (forms.some((f) => /lab|experiment|procedure/.test(f))) {
    push("lab", "Lab-oriented practiceForms");
  }
  if (forms.some((f) => /scenario|decision|case/.test(f))) {
    push("simulation", "Scenario / decision practiceForms");
  }
  if (forms.some((f) => /explain|teach-back|feynman/.test(f))) {
    push("writing", "Explanation / teach-back practice");
  }

  return suggestions;
}

/** Evidence type the LAF already associates with an activity type. */
export function evidenceTypeForActivityType(
  activityType: LearningActivityType,
): string | null {
  return (
    LEARNING_ACTIVITY_REGISTRY.find((e) => e.type === activityType)
      ?.defaultEvidenceType ?? null
  );
}

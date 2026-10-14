/**
 * 2P-9 — Stage / difficulty helpers + intervention → preferred stages.
 */

import type {
  ContentDifficulty,
  ContentInterventionPreference,
  LearningContentStage,
} from "./types";
import { LEARNING_CONTENT_STAGES } from "./types";

export function isLearningContentStage(
  value: unknown,
): value is LearningContentStage {
  return (
    typeof value === "string" &&
    (LEARNING_CONTENT_STAGES as readonly string[]).includes(value)
  );
}

export function isContentDifficulty(value: unknown): value is ContentDifficulty {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 5
  );
}

/**
 * Soft stage preferences AFTER intervention is known.
 * Preferences only — never hard diagnosis mappings / mandatory paths.
 */
export function preferredStagesForIntervention(
  preference: ContentInterventionPreference | null | undefined,
): LearningContentStage[] {
  switch (preference) {
    case "understand":
    case "six":
      return ["UNDERSTAND", "INTRODUCE"];
    case "practice":
      return ["PRACTICE", "APPLY"];
    case "apply":
    case "activity":
      return ["APPLY", "PRACTICE", "CHALLENGE"];
    case "challenge":
      return ["CHALLENGE", "APPLY"];
    case "retain":
      return ["RETAIN", "PRACTICE"];
    case "unspecified":
    default:
      return ["PRACTICE", "UNDERSTAND", "APPLY", "INTRODUCE", "CHALLENGE", "RETAIN"];
  }
}

export function normalizeConceptKey(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

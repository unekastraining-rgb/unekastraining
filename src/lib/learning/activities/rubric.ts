/**
 * Shared rubric evaluation for Writing / Lab / Simulation / Game / Project / Presentation.
 * Explicit criteria — not AI-as-proof-of-mastery.
 */

import {
  makeServerEvaluation,
  outcomeFromPassRatio,
} from "@/lib/learning/activities/server-evaluation";
import type { UniversalEvaluationResult } from "@/lib/learning/activities/execution-contract";
import type { MasteryFacetName } from "@/lib/learning/types";

export type RubricCriterion = {
  id: string;
  label: string;
  /** Case-insensitive substrings that demonstrate the criterion. */
  mustIncludeAny: string[];
  weight?: number;
};

export function evaluateAgainstRubric(input: {
  text: string;
  criteria: RubricCriterion[];
  skillFacet: MasteryFacetName;
  details?: Record<string, unknown>;
  /** Optional minimum artifact length — open/finish with a stub is not completion. */
  minChars?: number;
}): UniversalEvaluationResult {
  const text = input.text.trim();
  if (!text) {
    return makeServerEvaluation({
      outcome: "FAIL",
      score: 0,
      skillFacet: input.skillFacet,
      details: { ...(input.details ?? {}), error: "empty_artifact" },
    });
  }

  if (input.minChars != null && text.length < input.minChars) {
    return makeServerEvaluation({
      outcome: "FAIL",
      score: 0,
      skillFacet: input.skillFacet,
      details: {
        ...(input.details ?? {}),
        error: "artifact_too_short",
        minChars: input.minChars,
        length: text.length,
      },
    });
  }

  const lower = text.toLowerCase();
  let earned = 0;
  let total = 0;
  const perCriterion: Array<{ id: string; pass: boolean; label: string }> = [];

  for (const c of input.criteria) {
    const weight = c.weight ?? 1;
    total += weight;
    const pass = c.mustIncludeAny.some((needle) =>
      lower.includes(needle.toLowerCase()),
    );
    if (pass) earned += weight;
    perCriterion.push({ id: c.id, pass, label: c.label });
  }

  const ratio = total === 0 ? 0 : earned / total;
  return makeServerEvaluation({
    outcome: outcomeFromPassRatio(ratio),
    score: ratio,
    skillFacet: input.skillFacet,
    details: {
      ...(input.details ?? {}),
      mode: "explicit_rubric",
      perCriterion,
      earned,
      total,
    },
  });
}

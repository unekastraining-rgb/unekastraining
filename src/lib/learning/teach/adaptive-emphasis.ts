/**
 * Bundle H — Adaptive teaching emphasis from learner evidence × knowledge.
 * Soft emphasis only — never invents mastery; never skips required foundations.
 * Consumes existing LearnerConceptState + KL prerequisites.
 */

import { findInstructionalConceptById } from "@/lib/learning/knowledge/instructional-library";
import type { InstructionalConceptKnowledge } from "@/lib/learning/knowledge/instructional-library";
import type { LearnerConceptState } from "@/lib/learning/learner-state/types";
import {
  deriveFamiliarity,
  presentationHintsFor,
} from "@/lib/learning/personalized-teaching/rules";
import type { TeachingPresentationHint } from "@/lib/learning/personalized-teaching/types";

export type AdaptiveTeachingEmphasis = {
  focusConceptId: string;
  /** Hints for the focus concept (existing personalization vocabulary). */
  focusHints: TeachingPresentationHint[];
  /**
   * Prerequisite concept ids that already have demonstrated evidence
   * (exposure + correct attempt). Soft de-emphasis only — still teach if needed.
   */
  demonstratedPrerequisiteIds: string[];
  /**
   * Prerequisite ids with little/no evidence — keep foundational emphasis.
   */
  unresolvedPrerequisiteIds: string[];
  /** Prefer spending teaching time on these relative to demonstrated prereqs. */
  emphasizeConceptIds: string[];
  /** Soft note for teaching prompt / studio — not a mastery claim. */
  emphasisNote: string;
};

function isDemonstrated(state: LearnerConceptState | null | undefined): boolean {
  if (!state) return false;
  return (
    state.exposureCount >= 1 &&
    state.attemptCount >= 1 &&
    state.correctCount >= 1 &&
    state.lastOutcome === "correct"
  );
}

function prerequisiteIdsOf(concept: InstructionalConceptKnowledge): string[] {
  const fromField = concept.prerequisites ?? [];
  const fromRels = (concept.relationships ?? [])
    .filter((r) => r.kind === "prerequisite" || r.kind === "depends_on")
    .map((r) => r.targetConceptId);
  return Array.from(new Set([...fromField, ...fromRels]));
}

/**
 * Build adaptive emphasis for a focus concept using existing learner evidence.
 * Does not invent mastery labels. Does not remove prerequisites from the path.
 */
export function buildAdaptiveTeachingEmphasis(input: {
  focusConceptId: string;
  statesByConceptId: ReadonlyMap<string, LearnerConceptState | null>;
  pathConceptIds?: readonly string[];
}): AdaptiveTeachingEmphasis | null {
  const hit = findInstructionalConceptById(input.focusConceptId);
  if (!hit) return null;

  const focusState = input.statesByConceptId.get(input.focusConceptId);
  const familiarity = deriveFamiliarity({
    exposureCount: focusState?.exposureCount ?? 0,
    attemptCount: focusState?.attemptCount ?? 0,
  });
  const focusHints = presentationHintsFor({
    familiarity,
    incorrectCount: focusState?.incorrectCount ?? 0,
    correctCount: focusState?.correctCount ?? 0,
  });

  const prereqIds = prerequisiteIdsOf(hit.concept);
  const demonstratedPrerequisiteIds: string[] = [];
  const unresolvedPrerequisiteIds: string[] = [];

  for (const id of prereqIds) {
    if (!findInstructionalConceptById(id)) continue;
    if (isDemonstrated(input.statesByConceptId.get(id))) {
      demonstratedPrerequisiteIds.push(id);
    } else {
      unresolvedPrerequisiteIds.push(id);
    }
  }

  const path = input.pathConceptIds ?? [input.focusConceptId];
  const emphasizeConceptIds = path.filter((id) => {
    if (id === input.focusConceptId) return true;
    if (demonstratedPrerequisiteIds.includes(id)) return false;
    return true;
  });

  const emphasisNote =
    demonstratedPrerequisiteIds.length > 0
      ? `Learner already has demonstrated evidence for ${demonstratedPrerequisiteIds.length} prerequisite(s). Spend less time restating those foundations; keep unresolved prerequisites and the focus concept clear. Do not skip required conceptual foundations when they are unresolved.`
      : unresolvedPrerequisiteIds.length > 0
        ? `Keep prerequisite foundations visible before deepening the focus concept.`
        : `Teach the focus concept with available depth.`;

  return {
    focusConceptId: input.focusConceptId,
    focusHints,
    demonstratedPrerequisiteIds,
    unresolvedPrerequisiteIds,
    emphasizeConceptIds,
    emphasisNote,
  };
}

/** Compact prompt block for Six / Teaching Engine — optional additive. */
export function formatAdaptiveEmphasisPromptBlock(
  emphasis: AdaptiveTeachingEmphasis | null | undefined,
): string {
  if (!emphasis) return "";
  return [
    "## ADAPTIVE TEACHING EMPHASIS (from learner evidence × knowledge)",
    "Interaction history only — not ability labels. Do not invent mastery.",
    emphasis.emphasisNote,
    emphasis.demonstratedPrerequisiteIds.length
      ? `Demonstrated prerequisites (soft de-emphasize): ${emphasis.demonstratedPrerequisiteIds.join(", ")}`
      : "",
    emphasis.unresolvedPrerequisiteIds.length
      ? `Unresolved prerequisites (keep foundations): ${emphasis.unresolvedPrerequisiteIds.join(", ")}`
      : "",
    `Focus hints: ${emphasis.focusHints.join(", ") || "none"}`,
  ]
    .filter(Boolean)
    .join("\n");
}

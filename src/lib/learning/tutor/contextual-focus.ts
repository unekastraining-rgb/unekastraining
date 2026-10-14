/**
 * Bundle J — Tutor contextual focus from KL (augmentative; not source of truth).
 */

import { findInstructionalConceptById } from "@/lib/learning/knowledge/instructional-library";

export type TutorFocusContext = {
  conceptId?: string;
  conceptTitle?: string;
  definition?: string;
  focusLines: string[];
  /** Explicit: Tutor must not mutate canonical/orchestrator state. */
  nonAuthorityNote: string;
};

/**
 * Build a compact focus block for SixTutor from a KL concept + optional chunk text.
 */
export function buildTutorFocusContext(input: {
  conceptId?: string | null;
  chunkText?: string | null;
}): TutorFocusContext {
  const hit = input.conceptId
    ? findInstructionalConceptById(input.conceptId)
    : null;
  const lines: string[] = [];
  if (hit) {
    lines.push(`Concept: ${hit.concept.title} (${hit.concept.id})`);
    if (hit.concept.definition) {
      lines.push(`Definition: ${hit.concept.definition.slice(0, 220)}`);
    }
    const m =
      hit.concept.misconceptionDetails?.[0]?.misconception ??
      hit.concept.misconception;
    if (m) lines.push(`Watch for misconception: ${m.slice(0, 160)}`);
  }
  if (input.chunkText?.trim()) {
    lines.push(`Current moment: ${input.chunkText.trim().slice(0, 280)}`);
  }

  return {
    conceptId: hit?.concept.id,
    conceptTitle: hit?.concept.title,
    definition: hit?.concept.definition,
    focusLines: lines,
    nonAuthorityNote:
      "Tutor helps explain and guide. Knowledge Library, Learner Model, and Orchestrator remain authoritative.",
  };
}

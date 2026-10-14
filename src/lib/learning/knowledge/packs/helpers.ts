/**
 * Compact helpers for Knowledge Library pack authors (Phase 6+).
 * Keeps concept objects consistent without inventing a second schema.
 */

import type { InstructionalConceptKnowledge } from "@/lib/learning/knowledge/instructional-library";
import type {
  InstructionalMisconception,
  InstructionalRelationship,
  InstructionalRelationshipKind,
} from "@/lib/learning/knowledge/concept-profile";

/** Build a concept with required instructional fields; optional fields pass through. */
export function klConcept(
  input: InstructionalConceptKnowledge,
): InstructionalConceptKnowledge {
  return input;
}

/** Typed relationship edge helper. */
export function klRel(
  kind: InstructionalRelationshipKind,
  targetConceptId: string,
  reason?: string,
): InstructionalRelationship {
  return reason
    ? { kind, targetConceptId, reason }
    : { kind, targetConceptId };
}

/** Structured misconception helper. */
export function klMisconception(
  input: InstructionalMisconception,
): InstructionalMisconception {
  return input;
}

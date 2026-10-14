/**
 * Bundle H — Cross-system canonical knowledge bridges.
 * Core / Haul / Lucky / Practice / Studio share ONE Knowledge Library.
 */

import "@/lib/learning/knowledge/packs";
import { associateConceptsFromText } from "@/lib/learning/core/associate";
import { getCanonicalConceptsForWritingType } from "@/lib/haul/writing/knowledge-map";
import { findInstructionalConceptById } from "@/lib/learning/knowledge/instructional-library";
import { resolveTeachingKnowledgeContext } from "@/lib/learning/knowledge/teaching-knowledge-context";
import { suggestActivitiesForConcept } from "@/lib/learning/activity/concept-activities";
import {
  listRetentionVariantsForConcept,
  resolveConceptKeyForRetention,
} from "@/lib/learning/retention/variants";

export type CrossSystemKnowledgeLink = {
  system: "core" | "haul" | "studio" | "practice" | "lucky";
  conceptIds: string[];
  notes: string[];
};

/** Core: associate note text to canonical concepts without mutating notes. */
export function coreConceptsFromNoteText(
  text: string,
  title?: string,
): CrossSystemKnowledgeLink {
  const associations = associateConceptsFromText(text, { title });
  return {
    system: "core",
    conceptIds: associations.map((a) => a.conceptId),
    notes: associations.map(
      (a) => `${a.conceptId} (${a.confidence}, ${a.source})`,
    ),
  };
}

/** Haul: writing type → canonical writing concepts. */
export function haulConceptsForWritingType(
  writingTypeId: string,
): CrossSystemKnowledgeLink {
  const ids = getCanonicalConceptsForWritingType(writingTypeId);
  return {
    system: "haul",
    conceptIds: ids,
    notes: ids.map((id) => findInstructionalConceptById(id)?.concept.title ?? id),
  };
}

/** Studio: teaching context for a topic uses KL when available. */
export function studioKnowledgeForTopic(topic: string): CrossSystemKnowledgeLink {
  const ctx = resolveTeachingKnowledgeContext(topic);
  return {
    system: "studio",
    conceptIds: ctx?.concepts.map((c) => c.id) ?? [],
    notes: [
      ctx
        ? `source=${ctx.source}; resolution=${ctx.resolution}`
        : "no canonical teaching context",
    ],
  };
}

/** Practice: concept practiceForms → LAF activity suggestions. */
export function practiceActivitiesForConcept(
  conceptId: string,
): CrossSystemKnowledgeLink {
  const suggestions = suggestActivitiesForConcept(conceptId);
  return {
    system: "practice",
    conceptIds: [conceptId],
    notes: suggestions.map(
      (s) => `${s.activityType} → ${s.evidenceType} (${s.reason})`,
    ),
  };
}

/** Lucky: concept-aware retention variants when cataloged. */
export function luckyRecallForConceptTitle(
  conceptTitle: string,
): CrossSystemKnowledgeLink {
  const key =
    resolveConceptKeyForRetention({ conceptTitle }) ??
    resolveConceptKeyForRetention({ conceptKey: conceptTitle });
  const variants = key ? listRetentionVariantsForConcept(key) : [];
  return {
    system: "lucky",
    conceptIds: key ? [key] : [],
    notes: variants.map((v) => v.id),
  };
}

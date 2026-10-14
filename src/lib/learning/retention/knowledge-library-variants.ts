/**
 * Bundle J/L — KL conceptId → retention variants.
 * Canonical catalog is RETENTION_VARIANTS (variants.ts).
 * This module is a resolver only — not a second retention engine or duplicate rows.
 */

import {
  listRetentionVariantsForConcept,
  resolveConceptKeyForRetention,
  type RetentionVariantPrompt,
} from "@/lib/learning/retention/variants";
import { findInstructionalConceptById } from "@/lib/learning/knowledge/instructional-library";

/**
 * Resolve retention variants for a Knowledge Library concept id.
 * Delegates to the single RETENTION_VARIANTS catalog via listRetentionVariantsForConcept.
 */
export function listRetentionVariantsForKnowledgeConcept(
  conceptId: string,
): RetentionVariantPrompt[] {
  const hit = findInstructionalConceptById(conceptId);
  const key =
    resolveConceptKeyForRetention({
      conceptKey: conceptId,
      conceptTitle: hit?.concept.title,
    }) ?? conceptId;

  const byId = new Map<string, RetentionVariantPrompt>();
  for (const v of listRetentionVariantsForConcept(key)) byId.set(v.id, v);
  // Also try raw KL id when resolver mapped to an alias key that still has rows.
  if (key !== conceptId) {
    for (const v of listRetentionVariantsForConcept(conceptId)) byId.set(v.id, v);
  }
  return Array.from(byId.values()).sort((a, b) => a.id.localeCompare(b.id));
}

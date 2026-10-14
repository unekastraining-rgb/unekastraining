/**
 * Phase 16 — Deterministic concept association for Core content.
 * Never fabricates Knowledge Library IDs. Never mutates user content.
 */

import { resolveInstructionalKnowledge } from "@/lib/learning/knowledge/instructional-library";
import {
  findKnowledgeConceptById,
  isRegisteredKnowledgeConceptId,
} from "@/lib/learning/learner-state/concept-identity";
import { isGeneralTopicConceptId } from "@/lib/learning/knowledge/retrieval/general-identity";
import { normalizeLearningTarget } from "@/lib/learning/knowledge/retrieval/normalize-target";
import type { CoreConceptAssociation } from "@/lib/learning/core/types";

const MIN_TEXT_FOR_AUTO = 12;

/**
 * Associate text with Knowledge Library / general concepts.
 * Low-confidence / insufficient text → empty (advisory, not forced).
 */
export function associateConceptsFromText(
  text: string,
  options?: {
    userSelectedConceptIds?: readonly string[];
    title?: string | null;
  },
): CoreConceptAssociation[] {
  const associations: CoreConceptAssociation[] = [];
  const seen = new Set<string>();

  // Explicit user selection — highest authority when valid.
  for (const raw of options?.userSelectedConceptIds ?? []) {
    const id = raw.trim();
    if (!id || seen.has(id)) continue;
    if (!isRegisteredKnowledgeConceptId(id) && !isGeneralTopicConceptId(id)) {
      continue; // never fabricate
    }
    const ref = findKnowledgeConceptById(id);
    associations.push({
      conceptId: id,
      confidence: "high",
      source: "user-selected",
      title: ref?.concept.title,
    });
    seen.add(id);
  }

  const haystack = [options?.title?.trim() ?? "", text.trim()]
    .filter(Boolean)
    .join("\n");
  if (haystack.length < MIN_TEXT_FOR_AUTO) {
    return associations;
  }

  // Title-first KL resolution.
  if (options?.title?.trim()) {
    const fromTitle = resolveInstructionalKnowledge(options.title.trim());
    if (fromTitle?.matchedConcept && !seen.has(fromTitle.matchedConcept.id)) {
      associations.push({
        conceptId: fromTitle.matchedConcept.id,
        confidence: "high",
        source: "knowledge-library",
        title: fromTitle.matchedConcept.title,
      });
      seen.add(fromTitle.matchedConcept.id);
    }
  }

  // Phrase scan against normalized target + instructional resolve.
  const normalized = normalizeLearningTarget(haystack.slice(0, 200));
  if (normalized) {
    const fromNorm = resolveInstructionalKnowledge(normalized.normalizedTitle);
    if (fromNorm?.matchedConcept && !seen.has(fromNorm.matchedConcept.id)) {
      associations.push({
        conceptId: fromNorm.matchedConcept.id,
        confidence: "medium",
        source: "knowledge-library",
        title: fromNorm.matchedConcept.title,
      });
      seen.add(fromNorm.matchedConcept.id);
    }
  }

  // Keyword windows — look for known concept titles in text (deterministic).
  const lower = haystack.toLowerCase();
  const candidates = [
    "arraylist",
    "exceptions",
    "inheritance",
    "polymorphism",
    "supply and demand",
    "elasticity",
    "opportunity cost",
  ];
  for (const phrase of candidates) {
    if (!lower.includes(phrase)) continue;
    const hit = resolveInstructionalKnowledge(phrase);
    if (hit?.matchedConcept && !seen.has(hit.matchedConcept.id)) {
      associations.push({
        conceptId: hit.matchedConcept.id,
        confidence: "medium",
        source: "knowledge-library",
        title: hit.matchedConcept.title,
      });
      seen.add(hit.matchedConcept.id);
    }
  }

  return associations;
}

/**
 * Reject fabricated IDs — only registered KL or general: namespace.
 */
export function isValidCoreConceptId(conceptId: string): boolean {
  const id = conceptId.trim();
  if (!id) return false;
  return isRegisteredKnowledgeConceptId(id) || isGeneralTopicConceptId(id);
}

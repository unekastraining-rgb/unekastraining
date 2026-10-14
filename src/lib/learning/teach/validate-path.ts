/**
 * Bundle D — Teaching path validation.
 * Rejects duplicates, empty concepts, fabricated canonical IDs, and unsafe mappings.
 */

import { findInstructionalConceptById } from "@/lib/learning/knowledge/instructional-library";
import { isGeneralTopicConceptId } from "@/lib/learning/knowledge/retrieval/general-identity";
import type { InstructionalConceptKnowledge } from "@/lib/learning/knowledge/instructional-library";
import type { TeachScope } from "@/lib/learning/teach/scope";

export type TeachPathValidation = {
  accepted: boolean;
  reasons: string[];
  concepts: InstructionalConceptKnowledge[];
};

const UNSAFE_CROSS =
  /\b(quantum gardening|how to hack|weapon|bomb making)\b/i;

/**
 * Validate and clean a candidate teaching path.
 * Never fabricates replacements for rejected concepts.
 */
export function validateTeachPathConcepts(
  concepts: readonly InstructionalConceptKnowledge[],
  options?: {
    scope?: TeachScope;
    allowedIds?: ReadonlySet<string>;
    targetTitle?: string;
  },
): TeachPathValidation {
  const reasons: string[] = [];
  const cleaned: InstructionalConceptKnowledge[] = [];
  const seenIds = new Set<string>();
  const seenTitles = new Set<string>();
  const allowed = options?.allowedIds;

  for (const [i, raw] of concepts.entries()) {
    if (!raw) {
      reasons.push(`concept-${i}-missing`);
      continue;
    }
    const id = raw.id?.trim() ?? "";
    const title = raw.title?.trim() ?? "";
    if (!id || !title) {
      reasons.push(`concept-${i}-empty`);
      continue;
    }
    if (seenIds.has(id)) {
      reasons.push(`concept-${i}-duplicate-id`);
      continue;
    }
    const titleKey = title.toLowerCase();
    if (seenTitles.has(titleKey)) {
      reasons.push(`concept-${i}-duplicate-title`);
      continue;
    }

    const isGeneral = isGeneralTopicConceptId(id);
    const isKl = Boolean(findInstructionalConceptById(id));
    if (!isGeneral && !isKl) {
      reasons.push(`concept-${i}-fabricated-id`);
      continue;
    }
    if (allowed && !allowed.has(id) && isGeneral) {
      reasons.push(`concept-${i}-unallowed-id`);
      continue;
    }
    if (UNSAFE_CROSS.test(title) || UNSAFE_CROSS.test(raw.explanation ?? "")) {
      reasons.push(`concept-${i}-unsafe`);
      continue;
    }
    if (!raw.explanation?.trim() && !raw.definition?.trim()) {
      reasons.push(`concept-${i}-no-content`);
      continue;
    }

    seenIds.add(id);
    seenTitles.add(titleKey);
    cleaned.push(raw);
  }

  if (cleaned.length === 0) {
    reasons.push("empty-path");
  }

  const scope = options?.scope;
  if (scope === "concept-family" || scope === "broad-subject") {
    if (cleaned.length < 2) {
      reasons.push("insufficient-for-scope");
    }
  }

  return {
    accepted: cleaned.length > 0 && !reasons.includes("empty-path"),
    reasons,
    concepts: cleaned,
  };
}

/** Deduplicate by id then title; preserve order. */
export function dedupeTeachConcepts(
  concepts: readonly InstructionalConceptKnowledge[],
): InstructionalConceptKnowledge[] {
  const seenIds = new Set<string>();
  const seenTitles = new Set<string>();
  const out: InstructionalConceptKnowledge[] = [];
  for (const c of concepts) {
    if (!c?.id?.trim() || !c.title?.trim()) continue;
    if (seenIds.has(c.id)) continue;
    const tk = c.title.trim().toLowerCase();
    if (seenTitles.has(tk)) continue;
    seenIds.add(c.id);
    seenTitles.add(tk);
    out.push(c);
  }
  return out;
}

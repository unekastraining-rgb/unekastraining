/**
 * Bundle H — Reteach variation from authored Knowledge Library fields.
 * Used when Orchestrator chooses reteach — not a second teaching engine.
 */

import { findInstructionalConceptById } from "@/lib/learning/knowledge/instructional-library";
import type { InstructionalConceptKnowledge } from "@/lib/learning/knowledge/instructional-library";

export type ReteachVariationPlan = {
  conceptId: string;
  strategy:
    | "misconception_contrast"
    | "alternative_example"
    | "relationship_focus"
    | "application_focus"
    | "foundational_restatement";
  misconception?: string;
  correction?: string;
  contrast?: string;
  alternateExample?: string;
  relationshipNote?: string;
  applicationPrompt?: string;
  /** Prompt guidance for Teaching Engine / Six — grounded in authored fields only. */
  reteachGuidance: string;
};

function secondExample(concept: InstructionalConceptKnowledge): string | undefined {
  const pool = [
    ...(concept.examples ?? []),
    ...(concept.workedExamples ?? []),
    concept.example,
  ].filter((x): x is string => Boolean(x?.trim()));
  if (pool.length >= 2) return pool[1];
  if (pool.length === 1) return pool[0];
  return undefined;
}

/**
 * Prefer authored misconceptions / contrasts / alternate examples over regenerating
 * the same lesson. Falls back to foundational restatement when depth is sparse.
 */
export function buildReteachVariationPlan(
  conceptId: string,
): ReteachVariationPlan | null {
  const hit = findInstructionalConceptById(conceptId);
  if (!hit) return null;
  const c = hit.concept;
  const detail = c.misconceptionDetails?.[0];
  const misconception =
    detail?.misconception ?? c.misconception ?? c.misconceptions?.[0];

  if (misconception) {
    return {
      conceptId,
      strategy: "misconception_contrast",
      misconception,
      correction: detail?.correction,
      contrast: detail?.contrast,
      alternateExample: secondExample(c),
      reteachGuidance: [
        "RETEACH VARIATION: Do not repeat the first lesson word-for-word.",
        `Address this misconception: ${misconception}`,
        detail?.correction ? `Correction: ${detail.correction}` : "",
        detail?.contrast ? `Contrast: ${detail.contrast}` : "",
        secondExample(c) ? `Use a different example: ${secondExample(c)}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    };
  }

  const alt = secondExample(c);
  if (alt && c.example && alt !== c.example) {
    return {
      conceptId,
      strategy: "alternative_example",
      alternateExample: alt,
      reteachGuidance: `RETEACH VARIATION: Use a different worked example than the first pass.\nExample: ${alt}`,
    };
  }

  if ((c.relationships?.length ?? 0) > 0 || (c.relatedConcepts?.length ?? 0) > 0) {
    const rel =
      c.relationships?.[0] ??
      (c.relatedConcepts?.[0]
        ? { kind: "related_to", targetConceptId: c.relatedConcepts[0] }
        : null);
    return {
      conceptId,
      strategy: "relationship_focus",
      relationshipNote: rel
        ? `${rel.kind} → ${rel.targetConceptId}`
        : undefined,
      reteachGuidance:
        "RETEACH VARIATION: Emphasize how this concept connects to related ideas rather than restating only the definition.",
    };
  }

  if (c.applications?.length || c.transferPrompts?.length) {
    return {
      conceptId,
      strategy: "application_focus",
      applicationPrompt: c.transferPrompts?.[0] ?? c.applications?.[0],
      reteachGuidance:
        "RETEACH VARIATION: Lead with application/transfer rather than repeating the definition-first path.",
    };
  }

  return {
    conceptId,
    strategy: "foundational_restatement",
    reteachGuidance:
      "RETEACH VARIATION: Sparse authored contrast available — restate the foundation with a clearer plain-language explanation. Stay grounded in Knowledge Library fields; do not invent misconceptions.",
  };
}

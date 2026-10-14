/**
 * Phase 7 — Validate retrieved / general teaching knowledge structure.
 * Rejects thin, wrong-subject, or placeholder structures before teaching.
 */

import type { GeneralTeachingKnowledge } from "@/lib/learning/knowledge/retrieval/types";
import type { NormalizedLearningTarget } from "@/lib/learning/knowledge/retrieval/types";

const PLACEHOLDER =
  /\b(todo|placeholder|lorem ipsum|this topic is important because|as an ai)\b/i;

export type GeneralKnowledgeValidation = {
  accepted: boolean;
  reasons: string[];
};

/**
 * Structural validation for general teaching knowledge (not Phase 2B lesson validation).
 * Phase 2B still applies when AI generates SixWorkedLesson JSON.
 */
export function validateGeneralTeachingKnowledge(
  knowledge: GeneralTeachingKnowledge | null | undefined,
  target: NormalizedLearningTarget,
): GeneralKnowledgeValidation {
  const reasons: string[] = [];
  if (!knowledge) {
    return { accepted: false, reasons: ["missing-knowledge"] };
  }

  if (!knowledge.targetTitle?.trim()) {
    reasons.push("missing-target-title");
  }
  if (!knowledge.summary?.trim() || knowledge.summary.trim().length < 40) {
    reasons.push("thin-summary");
  }
  if (PLACEHOLDER.test(knowledge.summary ?? "")) {
    reasons.push("placeholder-summary");
  }
  if (!Array.isArray(knowledge.concepts) || knowledge.concepts.length < 2) {
    reasons.push("insufficient-concepts");
  }

  const titleTokens = target.normalizedTitle
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 4);

  for (const [i, c] of (knowledge.concepts ?? []).entries()) {
    if (!c.title?.trim() || !c.explanation?.trim()) {
      reasons.push(`concept-${i}-incomplete`);
      continue;
    }
    if (c.explanation.trim().length < 60) {
      reasons.push(`concept-${i}-thin`);
    }
    if (PLACEHOLDER.test(c.explanation) || PLACEHOLDER.test(c.title)) {
      reasons.push(`concept-${i}-placeholder`);
    }
  }

  // Soft subject alignment: at least one concept/summary should mention a title token
  // when the title has distinctive tokens (skip for very short titles).
  if (titleTokens.length > 0 && knowledge.concepts?.length) {
    const blob = `${knowledge.targetTitle} ${knowledge.summary} ${knowledge.concepts
      .map((c) => `${c.title} ${c.explanation}`)
      .join(" ")}`.toLowerCase();
    const hit = titleTokens.some((t) => blob.includes(t));
    if (!hit) {
      reasons.push("target-mismatch");
    }
  }

  return { accepted: reasons.length === 0, reasons };
}

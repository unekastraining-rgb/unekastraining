/**
 * Haul writing ↔ Knowledge Library concept mapping.
 * Registry remains UI structure; KL provides instructional meaning.
 * Prefer canonical writing-* ids when registered; general:writing:* stays fallback.
 */

import "@/lib/learning/knowledge/packs";
import { findInstructionalConceptById } from "@/lib/learning/knowledge/instructional-library";
import type { HaulWritingAiAction } from "@/lib/haul/writing/ai-actions";
import { getHaulWritingType } from "@/lib/haul/writing/registry";

/** Ordered path-style concept families by writing type (not duplicate knowledge trees). */
export const HAUL_WRITING_TYPE_CONCEPT_MAP: Record<string, readonly string[]> = {
  essay: [
    "writing-genre-essay",
    "writing-purpose",
    "writing-structure",
    "writing-thesis",
    "writing-topic-vs-thesis",
    "writing-introduction",
    "writing-body-paragraph",
    "writing-evidence",
    "writing-analysis",
    "writing-transitions",
    "writing-conclusion",
    "writing-revision",
  ],
  argumentative: [
    "writing-genre-argumentative",
    "writing-argument",
    "writing-claim",
    "writing-thesis",
    "writing-evidence",
    "writing-reasoning",
    "writing-counterargument",
    "writing-rebuttal",
    "writing-conclusion",
  ],
  "compare-contrast": [
    "writing-genre-compare-contrast",
    "writing-purpose",
    "writing-organization",
    "writing-thesis",
    "writing-analysis",
    "writing-transitions",
    "writing-conclusion",
  ],
  "research-paper": [
    "writing-genre-research",
    "writing-research-question",
    "writing-source",
    "writing-thesis",
    "writing-evidence",
    "writing-paraphrase",
    "writing-synthesis",
    "writing-analysis",
    "writing-citation",
    "writing-revision",
  ],
  analytical: [
    "writing-genre-analytical",
    "writing-thesis",
    "writing-analysis",
    "writing-analysis-vs-summary",
    "writing-evidence-vs-analysis",
    "writing-evidence",
    "writing-evidence-integration",
    "writing-conclusion",
  ],
  expository: [
    "writing-genre-essay",
    "writing-purpose",
    "writing-structure",
    "writing-clarity",
    "writing-body-paragraph",
    "writing-organization",
    "writing-conclusion",
  ],
  "narrative-essay": [
    "writing-purpose",
    "writing-audience",
    "writing-tone",
    "writing-organization",
    "writing-coherence",
    "writing-conclusion",
  ],
  reflective: [
    "writing-purpose",
    "writing-analysis",
    "writing-coherence",
    "writing-conclusion",
  ],
  "lab-report": [
    "writing-genre-lab-report",
    "writing-research-question",
    "writing-hypothesis",
    "writing-evidence",
    "writing-analysis",
    "writing-summary",
    "writing-conclusion",
  ],
  "case-study": [
    "writing-purpose",
    "writing-evidence",
    "writing-analysis",
    "writing-reasoning",
    "writing-conclusion",
  ],
  "discussion-post": [
    "writing-genre-discussion-post",
    "writing-purpose",
    "writing-claim",
    "writing-evidence",
    "writing-reasoning",
    "writing-conclusion",
  ],
  "professional-email": [
    "writing-genre-professional-email",
    "writing-purpose",
    "writing-audience",
    "writing-tone",
    "writing-clarity",
    "writing-editing",
    "writing-proofreading",
  ],
};

/** Action → preferred canonical concepts for AI grounding. */
export const HAUL_AI_ACTION_CONCEPT_MAP: Partial<
  Record<HaulWritingAiAction, readonly string[]>
> = {
  "generate-thesis": [
    "writing-thesis",
    "writing-topic-vs-thesis",
    "writing-claim",
    "writing-purpose",
  ],
  paraphrase: ["writing-paraphrase", "writing-summary", "writing-citation"],
  "improve-clarity": [
    "writing-clarity",
    "writing-coherence",
    "writing-editing",
    "writing-tone",
  ],
  clarify: ["writing-clarity", "writing-coherence"],
  simplify: ["writing-clarity", "writing-editing"],
  shorten: ["writing-clarity", "writing-editing"],
  expand: ["writing-evidence", "writing-analysis", "writing-body-paragraph"],
  feedback: [
    "writing-clarity",
    "writing-organization",
    "writing-evidence",
    "writing-evidence-vs-analysis",
    "writing-analysis",
    "writing-revision",
  ],
  "explain-section": ["writing-purpose", "writing-structure", "writing-genre-essay"],
  "help-build": ["writing-structure", "writing-body-paragraph", "writing-topic-vs-thesis"],
  outline: ["writing-structure", "writing-organization", "writing-genre-essay"],
  brainstorm: ["writing-purpose", "writing-claim"],
  rewrite: ["writing-revision", "writing-clarity"],
  "write-for-me": ["writing-purpose", "writing-structure"],
  continue: ["writing-coherence", "writing-transitions"],
};

/**
 * Prefer registered KL concept ids; drop unknowns (no general: fabrication here).
 */
export function filterRegisteredWritingConcepts(
  ids: readonly string[],
): string[] {
  const out: string[] = [];
  for (const id of ids) {
    if (!id?.trim()) continue;
    if (findInstructionalConceptById(id) && !out.includes(id)) {
      out.push(id);
    }
  }
  return out;
}

export function getCanonicalConceptsForWritingType(
  writingTypeId: string,
): string[] {
  const mapped = HAUL_WRITING_TYPE_CONCEPT_MAP[writingTypeId] ?? [];
  return filterRegisteredWritingConcepts(mapped);
}

export function getCanonicalConceptsForSection(
  writingTypeId: string,
  sectionId?: string,
): string[] {
  const type = getHaulWritingType(writingTypeId);
  const section = type?.sections.find(
    (s) => s.id === sectionId || (sectionId?.startsWith(s.id) ?? false),
  );
  const fromSection = section?.knowledgeConceptIds ?? [];
  const fromType = getCanonicalConceptsForWritingType(writingTypeId);
  return filterRegisteredWritingConcepts([...fromSection, ...fromType.slice(0, 4)]);
}

export function getCanonicalConceptsForAiAction(
  action: HaulWritingAiAction,
  writingTypeId: string,
  sectionId?: string,
): string[] {
  const fromAction = HAUL_AI_ACTION_CONCEPT_MAP[action] ?? [];
  const fromSection = getCanonicalConceptsForSection(writingTypeId, sectionId);
  return filterRegisteredWritingConcepts([...fromAction, ...fromSection]).slice(
    0,
    6,
  );
}

/**
 * Compact KL grounding for Haul AI — definition + key misconception only.
 * AI remains assistive; KL is the instructional source of truth.
 */
export function buildHaulWritingKnowledgeBlock(input: {
  action: HaulWritingAiAction;
  writingTypeId: string;
  sectionId?: string;
}): string {
  const ids = getCanonicalConceptsForAiAction(
    input.action,
    input.writingTypeId,
    input.sectionId,
  );
  if (ids.length === 0) return "";

  const lines: string[] = [
    "Canonical writing knowledge (use as instructional constraints; do not invent conflicting rules):",
  ];
  for (const id of ids) {
    const hit = findInstructionalConceptById(id);
    if (!hit) continue;
    const c = hit.concept;
    lines.push(`- ${c.title} (${c.id}): ${c.definition ?? c.explanation.slice(0, 180)}`);
    const misconception =
      c.misconceptionDetails?.[0]?.misconception ?? c.misconception;
    if (misconception) {
      lines.push(`  Avoid misconception: ${misconception}`);
    }
  }
  return lines.join("\n");
}

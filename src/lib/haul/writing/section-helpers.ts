/**
 * Helpers for building writing-type section trees.
 */

import type { HaulWritingSection } from "@/lib/haul/writing/types";

export function section(
  partial: HaulWritingSection,
): HaulWritingSection {
  return {
    required: true,
    ...partial,
  };
}

/** Standard body paragraph micro-structure used by essay-family types. */
export function bodyParagraphSection(
  index: number,
  options?: { required?: boolean },
): HaulWritingSection {
  const n = index;
  return section({
    id: `body-${n}`,
    title: `Body paragraph ${n}`,
    purpose: `Develop supporting idea ${n} with evidence and analysis.`,
    required: options?.required ?? n <= 3,
    repeatable: true,
    fields: [
      {
        id: "main-point",
        label: "Main point",
        placeholder: "What is the idea supporting your thesis?",
        multiline: true,
      },
      {
        id: "evidence",
        label: "Evidence / example",
        placeholder: "Evidence, example, fact, or reasoning",
        multiline: true,
      },
      {
        id: "analysis",
        label: "Explanation / analysis",
        placeholder: "Why does this evidence matter?",
        multiline: true,
      },
      {
        id: "connection",
        label: "Connection",
        placeholder: "How does this support your thesis?",
        multiline: true,
      },
    ],
    help: {
      explain:
        "A strong body paragraph states a clear point, supports it, explains the support, and ties back to the thesis.",
      tips: [
        "Lead with the point, not the quotation.",
        "Analysis should answer “so what?”",
        "One main idea per paragraph keeps focus.",
      ],
    },
    knowledgeConceptIds: ["writing-body-paragraph", "writing-evidence", "writing-analysis"],
  });
}

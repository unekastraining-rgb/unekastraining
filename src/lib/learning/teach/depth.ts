/**
 * Bundle D — Teaching depth contract (scope-aware).
 * Depth ≠ word count. Scales sections to scope without forcing artificial length.
 */

import type { TeachScope } from "@/lib/learning/teach/scope";

export type TeachingDepthSection =
  | "foundation"
  | "breakdown"
  | "connections"
  | "example"
  | "contrast"
  | "application"
  | "understanding-check";

const FAMILY_SECTIONS: TeachingDepthSection[] = [
  "foundation",
  "breakdown",
  "connections",
  "example",
  "contrast",
  "application",
  "understanding-check",
];

const FOCUSED_SECTIONS: TeachingDepthSection[] = [
  "foundation",
  "example",
  "contrast",
  "understanding-check",
];

const BROAD_SECTIONS: TeachingDepthSection[] = [
  "foundation",
  "breakdown",
  "example",
  "understanding-check",
];

const REVIEW_SECTIONS: TeachingDepthSection[] = [
  "foundation",
  "understanding-check",
];

export function teachingDepthSectionsForScope(
  scope: TeachScope,
): TeachingDepthSection[] {
  switch (scope) {
    case "focused-concept":
      return FOCUSED_SECTIONS;
    case "broad-subject":
      return BROAD_SECTIONS;
    case "review":
      return REVIEW_SECTIONS;
    case "course-section":
    case "concept-family":
    default:
      return FAMILY_SECTIONS;
  }
}

/**
 * Prompt block for the Teaching Engine — additive instructional contract.
 */
export function formatTeachingDepthPromptBlock(input: {
  scope: TeachScope;
  pathTitle: string;
  currentConceptTitle: string;
  conceptIndex: number;
  conceptTotal: number;
  nextConceptTitle?: string | null;
  reteach?: boolean;
}): string {
  const sections = teachingDepthSectionsForScope(input.scope);
  const lines = [
    "## TEACHING DEPTH CONTRACT",
    `Scope: ${input.scope}`,
    `Path: ${input.pathTitle}`,
    `Current concept: ${input.currentConceptTitle} (${input.conceptIndex + 1} of ${input.conceptTotal})`,
    input.nextConceptTitle
      ? `Next concept after evidence: ${input.nextConceptTitle}`
      : "Next concept: (end of path or await evidence)",
    "",
    "Teach THIS concept with appropriate depth for the scope — not the entire path in one lesson.",
    "Do not pad with filler. Prefer clear structure over more words.",
    "Required instructional moves for this concept:",
    ...sections.map((s, i) => `${i + 1}. ${labelForSection(s)}`),
  ];
  if (input.reteach) {
    lines.push(
      "",
      "Reteach mode: change explanation style, emphasize misconceptions with contrast, and use a fresh example — do not repeat the prior lesson verbatim.",
    );
  }
  if (input.scope === "broad-subject") {
    lines.push(
      "",
      "Broad subject: teach this introductory section only. Do not dump an entire discipline into one response.",
    );
  }
  if (input.scope === "focused-concept") {
    lines.push(
      "",
      "Focused concept: be concise but complete. Do not expand into a full course.",
    );
  }
  return lines.join("\n");
}

function labelForSection(section: TeachingDepthSection): string {
  switch (section) {
    case "foundation":
      return "Foundation — clear definition / core idea";
    case "breakdown":
      return "Breakdown — parts, steps, or mechanisms";
    case "connections":
      return "Connections — how this links to nearby concepts on the path";
    case "example":
      return "Example — one concrete worked illustration";
    case "contrast":
      return "Contrast — common misconception vs correct idea";
    case "application":
      return "Application — learner applies the idea briefly";
    case "understanding-check":
      return "Understanding check — one retrieval/check prompt";
  }
}

export type TeachingProgressionView = {
  pathId: string;
  pathTitle: string;
  scope: TeachScope;
  currentIndex: number;
  total: number;
  currentConceptId: string | null;
  currentConceptTitle: string | null;
  nextConceptId: string | null;
  nextConceptTitle: string | null;
  conceptTitles: string[];
  /** Bundle J — KL concept ids aligned with conceptTitles for curriculum overview. */
  conceptIds?: string[];
  depthSections: TeachingDepthSection[];
};

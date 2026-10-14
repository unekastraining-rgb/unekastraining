/**
 * Haul writing-type model — instructional structure for guided writing.
 * Additive to The Haul page/block system; not a second writing engine.
 */

export type HaulWritingCategory =
  | "academic"
  | "school"
  | "professional"
  | "creative";

export type HaulWritingTool =
  | "paraphrase"
  | "rewrite"
  | "expand"
  | "shorten"
  | "simplify"
  | "clarify"
  | "tone"
  | "grammar"
  | "write-for-me"
  | "continue"
  | "outline"
  | "brainstorm"
  | "thesis"
  | "examples"
  | "explain"
  | "feedback";

/**
 * Document editing mode (tool surface) — not the six-phase workflow strip.
 * Phase strip uses HaulWritingPhase in loop-phases.ts.
 */
export type HaulWritingMode = "learn" | "write" | "improve";

export type HaulWritingField = {
  id: string;
  label: string;
  placeholder?: string;
  multiline?: boolean;
};

export type HaulWritingExample = {
  label?: string;
  text: string;
};

export type HaulWritingSection = {
  id: string;
  title: string;
  purpose: string;
  prompt?: string;
  guidance?: string;
  required?: boolean;
  /** Nested fields within a section (optional). */
  fields?: HaulWritingField[];
  examples?: HaulWritingExample[];
  help?: {
    explain?: string;
    tips?: string[];
  };
  /** Knowledge Library concept ids when available (never invent). */
  knowledgeConceptIds?: string[];
  /** Allow learner to duplicate this section (e.g. body paragraphs). */
  repeatable?: boolean;
};

export type HaulWritingType = {
  id: string;
  title: string;
  category: HaulWritingCategory;
  description: string;
  purpose: string;
  sections: HaulWritingSection[];
  learningGoals?: string[];
  commonMistakes?: string[];
  availableTools?: HaulWritingTool[];
  /** What this writing type is, how it works, before-finish checks. */
  pedagogy?: {
    whatIsThis?: string;
    howStructured?: string;
    strongExampleNotes?: string;
    beforeFinish?: string[];
  };
  /** Depth of specialized pedagogy for this type. */
  specialization: "full" | "structured" | "generic";
};

export type HaulWritingSectionContent = {
  sectionId: string;
  title: string;
  body: string;
  fieldValues?: Record<string, string>;
};

/**
 * Structured writing document — coexists with classic HaulDoc blocks.
 * Stored separately so existing page JSON remains valid.
 */
export type HaulWritingDocument = {
  kind: "haul-writing-v1";
  id: string;
  writingTypeId: string;
  title: string;
  mode: HaulWritingMode;
  assignmentPrompt?: string;
  sections: HaulWritingSectionContent[];
  updatedAt: string;
  createdAt: string;
};

export const HAUL_WRITING_STORAGE_KEY = "study-haul-writing-docs-v1";
export const HAUL_WRITING_ACTIVE_KEY = "study-haul-writing-active-v1";

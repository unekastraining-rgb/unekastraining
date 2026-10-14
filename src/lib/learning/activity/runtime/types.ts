/**
 * Bundle I — Interactive activity runtime contract.
 * Extends LAF descriptors with learner-doable interaction forms.
 * Does not invent a second activity framework.
 */

import type { LearningActivityType } from "@/lib/learning/activity/framework/types";

/**
 * Concrete interaction forms the runtime can render.
 * Bundle L — aliases kept for compatibility:
 * - short_answer ≈ explain (free-text)
 * - classification ≈ multiple_choice with category choices
 * Builders may not emit every form; feedback evaluators still accept them.
 */
export type InteractiveForm =
  | "multiple_choice"
  | "multi_select"
  | "true_false"
  | "fill_in"
  | "short_answer"
  | "explain"
  | "ordering"
  | "matching"
  | "classification"
  | "prediction"
  | "code_trace"
  | "code_predict"
  | "code_write"
  | "sql_write"
  | "equation_solve"
  | "diagram_label"
  | "scenario";

export type InteractiveActivity = {
  id: string;
  conceptId: string;
  conceptTitle: string;
  subject?: string;
  domain?: string;
  form: InteractiveForm;
  /** Existing LAF activity type this interaction fulfills. */
  activityType: LearningActivityType;
  prompt: string;
  label?: string;
  /** Select / recognition. */
  choices?: string[];
  correctIndex?: number;
  correctIndices?: number[];
  /** Fill-in / equation — checked locally; not auto-revealed. */
  expectedAnswer?: string;
  answerAliases?: string[];
  /** Ordering. */
  orderItems?: string[];
  correctOrder?: string[];
  /** Matching: left items → correct right labels (parallel arrays). */
  matchLeft?: string[];
  matchRight?: string[];
  matchAnswer?: Record<string, string>;
  /** Subject surfaces from authored KL fields only. */
  codeSnippet?: string;
  tablesPreview?: string;
  diagramHint?: string;
  graphHint?: string;
  relatedConceptIds?: string[];
  authoredMisconception?: {
    misconception: string;
    correction?: string;
    contrast?: string;
  };
  /** Lucky-aligned: scores/evidence first; no automatic answer dump. */
  revealAnswerPolicy: "never_auto" | "on_request";
};

export type InteractiveSubmission = {
  activityId: string;
  form: InteractiveForm;
  selectedIndex?: number;
  selectedIndices?: number[];
  textAnswer?: string;
  orderedItems?: string[];
  matches?: Record<string, string>;
};

export type InteractiveFeedback = {
  outcome: "correct" | "incorrect" | "partial" | "completed" | "attempted";
  /** Learner-facing summary — never only “Correct!” / “Incorrect.” */
  summary: string;
  relatedConceptTitles: string[];
  misconceptionNote?: string;
  correctionNote?: string;
  contrastNote?: string;
  /** True when a local check was possible; false for open explain/write. */
  scored: boolean;
  /** Never includes the answer unless reveal was requested. */
  revealedAnswer?: string;
};

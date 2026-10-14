/**
 * 2P-12 — Universal Learning Scaffolding contract.
 *
 * Learner support projected from already-selected content/activity metadata.
 * Scaffolding supports learner action but is not learning evidence and does
 * not make learning decisions.
 */

export type LearningScaffoldKind =
  | "HINT"
  | "STEP"
  | "EXAMPLE"
  | "CHECKLIST"
  | "CONSTRAINT";

export type LearningScaffoldLevel = 1 | 2 | 3;

export type LearningScaffoldRevealPolicy = "ON_REQUEST" | "ALWAYS";

/**
 * Optional authored or projected learner support item.
 * Must not contain full solutions / answer keys.
 */
export type LearningScaffold = {
  kind: LearningScaffoldKind;
  label: string;
  content: string;
  level: LearningScaffoldLevel;
  revealPolicy: LearningScaffoldRevealPolicy;
  /** True when this item must not reveal the evaluated answer. */
  doesNotRevealAnswer: boolean;
};

/** Loose input before normalization (invalid entries are dropped). */
export type LearningScaffoldInput = {
  kind?: unknown;
  label?: unknown;
  content?: unknown;
  level?: unknown;
  revealPolicy?: unknown;
  doesNotRevealAnswer?: unknown;
};

export type LearningScaffoldTruthSummary = {
  isProjectionOnly: true;
  doesNotDiagnose: true;
  doesNotSelectIntervention: true;
  doesNotWriteEvidence: true;
  doesNotWriteMastery: true;
  doesNotCreateLucky: true;
  doesNotRevealAnswerByDefault: true;
  doesNotRequireLlm: true;
  hintRequestIsNotEvidence: true;
};

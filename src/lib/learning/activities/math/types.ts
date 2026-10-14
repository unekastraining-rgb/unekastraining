/**
 * 2P-39 — Math workspace types (specialized interaction, not a second engine).
 */

export type MathErrorCategory =
  | "SIGN_ERROR"
  | "DISTRIBUTION_ERROR"
  | "INVERSE_OPERATION_ERROR"
  | "COMBINATION_ERROR"
  | "EQUALITY_BREAK"
  | "ARITHMETIC_ERROR"
  | "UNSUPPORTED_TRANSFORM"
  | "NONE";

export type MathStep = {
  expression: string;
  operation?: string;
  explanation?: string;
};

/** Client working state — never authoritative evidence by itself. */
export type MathWorkspaceState = {
  problemId: string;
  steps: MathStep[];
  currentStep?: number;
  submitted: boolean;
};

export type MathChallengeScaffold = {
  kind: "HINT" | "STEP" | "EXAMPLE" | "CHECKLIST" | "CONSTRAINT";
  label: string;
  content: string;
  level?: 1 | 2 | 3;
  revealPolicy?: "ON_REQUEST" | "ALWAYS";
  doesNotRevealAnswer?: boolean;
};

export type MathChallenge = {
  id: string;
  title: string;
  objective: string;
  prompt: string;
  /** Starting equation shown to the learner. */
  equation: string;
  /** Exact expected solution for x (deterministic). */
  expectedX: number;
  /** Difficulty 1–5. */
  difficulty: 1 | 2 | 3 | 4 | 5;
  domainTag?: string;
  conceptHints?: readonly string[];
  misconceptionTargets?: readonly string[];
  scaffolds?: readonly MathChallengeScaffold[];
  successLooksLike?: string;
  /** When true, optional explanation field contributes to EXPLAIN scoring. */
  requireExplanation?: boolean;
  progressionStage?: "APPLY" | "CHALLENGE" | "RETAIN" | "PRACTICE";
  contextVariant?: string;
  contentKey?: string;
};

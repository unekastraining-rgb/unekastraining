/**
 * 2P-39 — Deterministic math workspace evaluation (no LLM).
 */

import {
  classifyStepError,
  equationsEquivalent,
  isSolvedForm,
  parseLinearEquation,
  solveLinearEquation,
} from "./algebra";
import type { MathChallenge } from "./types";
import type { MathErrorCategory } from "./types";
import {
  makeServerEvaluation,
  outcomeFromPassRatio,
} from "@/lib/learning/activities/server-evaluation";
import type { UniversalEvaluationResult } from "@/lib/learning/activities/execution-contract";

export type MathWorkspaceSubmission = {
  steps: string[];
  explanation?: string;
};

function misconceptionForCategory(cat: MathErrorCategory): string[] {
  switch (cat) {
    case "SIGN_ERROR":
      return ["sign error when moving terms"];
    case "DISTRIBUTION_ERROR":
      return ["forgetting to distribute to every term"];
    case "EQUALITY_BREAK":
    case "INVERSE_OPERATION_ERROR":
      return ["doing an operation to only one side"];
    case "ARITHMETIC_ERROR":
      return ["arithmetic slip in a valid transform"];
    case "UNSUPPORTED_TRANSFORM":
      return ["unsupported or unreadable algebraic form"];
    default:
      return [];
  }
}

/**
 * Evaluate a submitted step chain for a math challenge.
 * Opening/typing/hints are not evaluated here — only explicit submission payloads.
 */
export function evaluateMathWorkspace(
  challenge: MathChallenge,
  submission: MathWorkspaceSubmission,
): UniversalEvaluationResult {
  const steps = submission.steps
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (steps.length === 0) {
    return makeServerEvaluation({
      outcome: "FAIL",
      score: 0,
      skillFacet: "SOLVE",
      details: {
        mode: "math_linear_constrained",
        error: "empty_steps",
        finalCorrect: false,
        stepCorrect: false,
        errorCategory: "UNSUPPORTED_TRANSFORM" satisfies MathErrorCategory,
        misconceptionSignals: [],
      },
    });
  }

  // First step should match (or be equivalent to) the given equation.
  const start = parseLinearEquation(challenge.equation);
  const first = parseLinearEquation(steps[0]!);
  if (!start || !first || !equationsEquivalent(start, first)) {
    // Allow starting mid-chain only if first is still equivalent to original
    return makeServerEvaluation({
      outcome: "FAIL",
      score: 0.15,
      skillFacet: "SOLVE",
      details: {
        mode: "math_linear_constrained",
        error: "start_not_equivalent",
        finalCorrect: false,
        stepCorrect: false,
        errorCategory: "EQUALITY_BREAK" satisfies MathErrorCategory,
        misconceptionSignals: misconceptionForCategory("EQUALITY_BREAK"),
        feedback:
          "Your first step should match or stay equivalent to the given equation.",
      },
    });
  }

  const stepResults: Array<{
    index: number;
    ok: boolean;
    category: MathErrorCategory;
  }> = [];

  for (let i = 1; i < steps.length; i++) {
    const category = classifyStepError(
      steps[i - 1]!,
      steps[i]!,
      challenge.expectedX,
    );
    stepResults.push({
      index: i,
      ok: category === "NONE",
      category,
    });
  }

  const invalid = stepResults.find((r) => !r.ok);
  const last = steps[steps.length - 1]!;
  const finalCorrect = isSolvedForm(last, challenge.expectedX);
  const lastParsed = parseLinearEquation(last);
  const lastSol = lastParsed ? solveLinearEquation(lastParsed) : null;

  const validStepRatio =
    steps.length <= 1
      ? finalCorrect
        ? 1
        : 0
      : stepResults.filter((r) => r.ok).length / stepResults.length;

  let score = 0;
  if (finalCorrect && !invalid) score = 1;
  else if (finalCorrect && invalid) score = 0.7;
  else if (!finalCorrect && !invalid && validStepRatio >= 0.99) score = 0.45;
  else if (validStepRatio >= 0.5) score = 0.35 * validStepRatio;
  else score = Math.max(0, 0.2 * validStepRatio);

  let explanationBoost = 0;
  const explanation = (submission.explanation ?? "").trim();
  if (challenge.requireExplanation) {
    if (explanation.length >= 24) {
      const lower = explanation.toLowerCase();
      if (
        lower.includes("both") ||
        lower.includes("equal") ||
        lower.includes("isolate") ||
        lower.includes("subtract") ||
        lower.includes("add")
      ) {
        explanationBoost = 0.05;
      }
    }
  }

  score = Math.min(1, score + explanationBoost);

  const errorCategory: MathErrorCategory = invalid
    ? invalid.category
    : finalCorrect
      ? "NONE"
      : lastSol !== null && Math.abs(lastSol + challenge.expectedX) < 1e-6
        ? "SIGN_ERROR"
        : "ARITHMETIC_ERROR";

  const misconceptionSignals = [
    ...misconceptionForCategory(errorCategory),
    ...(invalid ? misconceptionForCategory(invalid.category) : []),
  ].filter((v, i, a) => a.indexOf(v) === i);

  const outcome = outcomeFromPassRatio(score);

  return makeServerEvaluation({
    outcome,
    score,
    skillFacet: "SOLVE",
    details: {
      mode: "math_linear_constrained",
      finalCorrect,
      stepCorrect: !invalid,
      validStepRatio,
      errorCategory,
      misconceptionSignals,
      expectedX: challenge.expectedX,
      observedX: lastSol,
      stepCount: steps.length,
      stepResults,
      explanationProvided: explanation.length > 0,
      // Never include a full worked solution answer key
      feedback: finalCorrect
        ? invalid
          ? "Final answer matches, but an earlier step broke equivalence."
          : "Solution accepted."
        : invalid
          ? "A step changed the equation in a way that is not equivalent."
          : "Keep transforming until x is isolated correctly.",
    },
  });
}

/** Check a single step transition without creating evidence. */
export function checkMathStep(input: {
  previous: string;
  next: string;
  expectedX: number;
}): {
  ok: boolean;
  category: MathErrorCategory;
  learnerMessage: string;
} {
  const category = classifyStepError(
    input.previous,
    input.next,
    input.expectedX,
  );
  if (category === "NONE") {
    return {
      ok: true,
      category,
      learnerMessage: "This step keeps the equation equivalent.",
    };
  }
  const messages: Record<MathErrorCategory, string> = {
    NONE: "",
    SIGN_ERROR: "Check the sign when you move a term across the equality.",
    DISTRIBUTION_ERROR:
      "When distributing, multiply every term inside the parentheses.",
    INVERSE_OPERATION_ERROR:
      "Use the inverse operation on both sides the same way.",
    COMBINATION_ERROR: "Combine like terms carefully before the next move.",
    EQUALITY_BREAK:
      "Both sides must receive the same transformation to stay equal.",
    ARITHMETIC_ERROR: "The structure looks close — recheck the arithmetic.",
    UNSUPPORTED_TRANSFORM:
      "Use a linear equation form this workspace can read (for example 2x+4=10).",
  };
  return {
    ok: false,
    category,
    learnerMessage: messages[category],
  };
}

/**
 * 2P-39 — Initial linear-equation math workspace content pack.
 * Deterministic problems with known solutions — not a CAS catalog flood.
 */

import type { MathChallenge } from "./types";

export const MATH_CHALLENGES: MathChallenge[] = [
  {
    id: "math-linear-basic",
    title: "Solve a one-step linear equation",
    objective: "Isolate x with valid both-sides transforms; arrive at x = 3.",
    prompt:
      "Solve for x. Show each equation on its own step. Start from the given equation.",
    equation: "2x + 4 = 10",
    expectedX: 3,
    difficulty: 2,
    domainTag: "mathematics",
    conceptHints: [
      "linear",
      "equation",
      "solve",
      "algebra",
      "isolate",
      "balance",
    ],
    misconceptionTargets: [
      "doing an operation to only one side",
      "sign error when moving terms",
    ],
    progressionStage: "PRACTICE",
    contextVariant: "2x+4=10",
    contentKey: "math-ws-linear-basic",
    scaffolds: [
      {
        kind: "HINT",
        label: "Undo addition",
        content: "What operation could undo the +4 on both sides?",
        level: 1,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
      {
        kind: "HINT",
        label: "Then the coefficient",
        content: "After removing 4, what coefficient is still attached to x?",
        level: 2,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
      {
        kind: "STEP",
        label: "Check equality",
        content: "Whatever you do to the left side, do the same to the right.",
        level: 1,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
    ],
    successLooksLike: "Valid steps ending at x = 3 with both-sides balance preserved.",
  },
  {
    id: "math-linear-subtract",
    title: "Solve with subtraction on the left",
    objective: "Solve 3x − 7 = 11 with valid transforms; x = 6.",
    prompt: "Solve for x. Record each transformed equation as a step.",
    equation: "3x - 7 = 11",
    expectedX: 6,
    difficulty: 2,
    domainTag: "mathematics",
    conceptHints: ["linear", "equation", "solve", "subtract", "algebra"],
    misconceptionTargets: ["sign error when moving terms"],
    progressionStage: "APPLY",
    contextVariant: "3x-7=11",
    contentKey: "math-ws-linear-subtract",
    scaffolds: [
      {
        kind: "HINT",
        label: "Undo subtraction",
        content: "What undoes subtracting 7 if you apply it to both sides?",
        level: 1,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
    ],
    successLooksLike: "Steps stay equivalent; final x = 6.",
  },
  {
    id: "math-linear-distribute",
    title: "Distribute, then solve",
    objective: "Expand 5(x + 2) = 25 correctly, then isolate x = 3.",
    prompt:
      "Solve for x. If you distribute, multiply every term inside the parentheses.",
    equation: "5(x + 2) = 25",
    expectedX: 3,
    difficulty: 3,
    domainTag: "mathematics",
    conceptHints: ["distribute", "parentheses", "linear", "equation", "algebra"],
    misconceptionTargets: ["forgetting to distribute to every term"],
    progressionStage: "APPLY",
    contextVariant: "5(x+2)=25",
    contentKey: "math-ws-linear-distribute",
    scaffolds: [
      {
        kind: "HINT",
        label: "Distribution",
        content: "5 times each part inside the parentheses — both the x and the 2.",
        level: 1,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
      {
        kind: "HINT",
        label: "After expanding",
        content: "Once expanded, undo addition, then undo the coefficient of x.",
        level: 2,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
    ],
    successLooksLike: "Correct distribution then isolation to x = 3.",
  },
  {
    id: "math-linear-both-sides",
    title: "Variables on both sides",
    objective: "Gather x terms, then isolate; solution x = 6.",
    prompt: "Solve for x. Combine like terms across the equality carefully.",
    equation: "2x + 3 = x + 9",
    expectedX: 6,
    difficulty: 3,
    domainTag: "mathematics",
    conceptHints: ["both sides", "like terms", "linear", "equation", "algebra"],
    misconceptionTargets: [
      "doing an operation to only one side",
      "sign error when moving terms",
    ],
    progressionStage: "CHALLENGE",
    contextVariant: "2x+3=x+9",
    contentKey: "math-ws-linear-both-sides",
    requireExplanation: true,
    scaffolds: [
      {
        kind: "HINT",
        label: "Gather x",
        content: "How could you get all x terms onto one side without breaking equality?",
        level: 1,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
      {
        kind: "HINT",
        label: "Justify",
        content: "Be ready to say why your first transform keeps both sides equal.",
        level: 2,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
    ],
    successLooksLike: "Valid gathering of like terms; x = 6; brief justification.",
  },
  {
    id: "math-linear-retain",
    title: "Recall: solve a fresh linear equation",
    objective: "Without notes, solve 4x + 8 = 0; x = −2.",
    prompt: "RETAIN: Solve for x in steps. Educational recall — show the equations.",
    equation: "4x + 8 = 0",
    expectedX: -2,
    difficulty: 2,
    domainTag: "mathematics",
    conceptHints: ["retain", "recall", "linear", "equation", "algebra"],
    misconceptionTargets: ["sign error when moving terms"],
    progressionStage: "RETAIN",
    contextVariant: "4x+8=0",
    contentKey: "math-ws-linear-retain",
    scaffolds: [
      {
        kind: "HINT",
        label: "Same process",
        content: "Undo constants first, then undo the coefficient of x — both sides.",
        level: 1,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
    ],
    successLooksLike: "Equivalent steps ending at x = -2.",
  },
];

export function getMathChallenge(id: string): MathChallenge | undefined {
  return MATH_CHALLENGES.find((c) => c.id === id);
}

export function listMathChallenges(): MathChallenge[] {
  return MATH_CHALLENGES.slice();
}

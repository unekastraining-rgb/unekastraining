/**
 * 2P-13 — Universal Learning Outcome Integrity contract.
 *
 * Completing an activity is not equivalent to demonstrating mastery.
 * Learning evidence comes from authoritative evaluation of the learner's
 * actual work or response.
 */

import type { EvidenceOutcomeName, MasteryFacetName } from "@/lib/learning/types";
import type { UniversalContentActivityKind } from "@/lib/learning/activities/content-contract";

/**
 * Three distinct layers — must not be collapsed in product logic.
 *
 * COMPLETION — learner finished the interaction/artifact submission for evaluation
 * EVALUATION — how the artifact performed against criteria
 * EVIDENCE   — LearningAttempt signal that may update ConceptMastery
 */
export type ActivityOutcomeLayer = "COMPLETION" | "EVALUATION" | "EVIDENCE";

export type ActivityOutcomeIntegritySummary = {
  /** Attempt finished enough for evaluation (submit of required work). */
  attemptCompleted: boolean;
  /** Authoritative evaluation outcome — never client-authored. */
  evaluationOutcome: EvidenceOutcomeName | null;
  /** True when a LearningAttempt was (or would be) recorded from evaluation. */
  evidenceRecorded: boolean;
  /** Facet written when evidence is recorded. */
  skillFacet: MasteryFacetName | null;
  /**
   * True when Adaptive may bind this attempt as step completion.
   * Independent of SUCCESS — FAIL/PARTIAL can still bind when contract allows.
   */
  adaptiveBindEligible: boolean | null;
};

export type ActivityOutcomeContractRow = {
  activityKind: UniversalContentActivityKind | "six" | "quiz" | "flashcard";
  completionGate: string;
  evaluator: string;
  outcomeSource: "server_evaluator";
  skillFacet: MasteryFacetName | "varies";
  adaptiveReady: boolean;
  /** FAIL/PARTIAL still completes the *attempt* when true. */
  failCompletesAttempt: true;
  /** FAIL may still Adaptive-bind when contract allows. */
  failMayAdaptiveBind: boolean;
  notes: string;
};

export type OutcomeIntegrityTruthSummary = {
  completionIsNotSuccess: true;
  successIsNotMastery: true;
  openDoesNotCreateEvidence: true;
  hintDoesNotCreateEvidence: true;
  clientOutcomeNotTrusted: true;
  progressionStageIsNotMastery: true;
  adaptiveBindIsNotMastery: true;
};

/** Static matrix documenting audited contracts (2P-13). */
export const ACTIVITY_OUTCOME_CONTRACT_MATRIX: readonly ActivityOutcomeContractRow[] =
  [
    {
      activityKind: "coding",
      completionGate: "POST evaluated work → LearningAttempt",
      evaluator: "evaluateCodingChallenge (execution/structural)",
      outcomeSource: "server_evaluator",
      skillFacet: "PERFORM",
      adaptiveReady: true,
      failCompletesAttempt: true,
      failMayAdaptiveBind: true,
      notes: "Empty/starter submit → FAIL attempt; not SUCCESS.",
    },
    {
      activityKind: "sql",
      completionGate: "POST evaluated SQL → LearningAttempt",
      evaluator: "evaluateSqlChallenge (sql.js)",
      outcomeSource: "server_evaluator",
      skillFacet: "PERFORM",
      adaptiveReady: true,
      failCompletesAttempt: true,
      failMayAdaptiveBind: true,
      notes: "Unsafe/empty SQL → FAIL.",
    },
    {
      activityKind: "lab",
      completionGate: "POST rubric-evaluated text → LearningAttempt",
      evaluator: "evaluateAgainstRubric",
      outcomeSource: "server_evaluator",
      skillFacet: "PERFORM",
      adaptiveReady: true,
      failCompletesAttempt: true,
      failMayAdaptiveBind: true,
      notes: "minChars + criteria; stub fails.",
    },
    {
      activityKind: "simulation",
      completionGate: "POST rubric-evaluated decision → LearningAttempt",
      evaluator: "evaluateAgainstRubric",
      outcomeSource: "server_evaluator",
      skillFacet: "varies",
      adaptiveReady: true,
      failCompletesAttempt: true,
      failMayAdaptiveBind: true,
      notes: "APPLY or SOLVE per challenge; both Adaptive-eligible (2P-13).",
    },
    {
      activityKind: "presentation",
      completionGate: "POST rubric-evaluated outline → LearningAttempt",
      evaluator: "evaluateAgainstRubric",
      outcomeSource: "server_evaluator",
      skillFacet: "PERFORM",
      adaptiveReady: true,
      failCompletesAttempt: true,
      failMayAdaptiveBind: true,
      notes: "Aligned PERFORM path.",
    },
    {
      activityKind: "writing",
      completionGate: "POST rubric-evaluated text → LearningAttempt",
      evaluator: "evaluateAgainstRubric",
      outcomeSource: "server_evaluator",
      skillFacet: "EXPLAIN",
      adaptiveReady: true,
      failCompletesAttempt: true,
      failMayAdaptiveBind: true,
      notes: "2P-18 — Adaptive-ready; AI assistance ≠ learner evidence.",
    },
    {
      activityKind: "project",
      completionGate: "POST rubric-evaluated plan → LearningAttempt",
      evaluator: "evaluateAgainstRubric",
      outcomeSource: "server_evaluator",
      skillFacet: "APPLY",
      adaptiveReady: true,
      failCompletesAttempt: true,
      failMayAdaptiveBind: true,
      notes: "2P-30 — Adaptive-ready; learner-authored plan required.",
    },
    {
      activityKind: "game",
      completionGate: "POST rubric-evaluated match → LearningAttempt",
      evaluator: "evaluateAgainstRubric (points ignored)",
      outcomeSource: "server_evaluator",
      skillFacet: "RECOGNIZE",
      adaptiveReady: true,
      failCompletesAttempt: true,
      failMayAdaptiveBind: true,
      notes: "2P-30 — Adaptive-ready; client points never authoritative.",
    },
    {
      activityKind: "six",
      completionGate: "Stage evaluate path (existing SIX)",
      evaluator: "SIX scorer (existing)",
      outcomeSource: "server_evaluator",
      skillFacet: "varies",
      adaptiveReady: true,
      failCompletesAttempt: true,
      failMayAdaptiveBind: false,
      notes: "Adaptive bind gated on final-stage pass — preserve SIX semantics.",
    },
    {
      activityKind: "quiz",
      completionGate: "Whole-quiz graded submit",
      evaluator: "gradeQuizAnswers",
      outcomeSource: "server_evaluator",
      skillFacet: "RECOGNIZE",
      adaptiveReady: true,
      failCompletesAttempt: true,
      failMayAdaptiveBind: true,
      notes: "Assessment boundary; score-agnostic Adaptive bind.",
    },
    {
      activityKind: "flashcard",
      completionGate: "Rated review → evidence",
      evaluator: "rating→outcome map",
      outcomeSource: "server_evaluator",
      skillFacet: "RETAIN",
      adaptiveReady: true,
      failCompletesAttempt: true,
      failMayAdaptiveBind: true,
      notes: "AGAIN may still Adaptive-bind.",
    },
  ];

export function outcomeIntegrityTruthSummary(): OutcomeIntegrityTruthSummary {
  return {
    completionIsNotSuccess: true,
    successIsNotMastery: true,
    openDoesNotCreateEvidence: true,
    hintDoesNotCreateEvidence: true,
    clientOutcomeNotTrusted: true,
    progressionStageIsNotMastery: true,
    adaptiveBindIsNotMastery: true,
  };
}

/**
 * Derive integrity summary from an already-evaluated attempt completion.
 * Pure projection — does not write evidence or mastery.
 */
export function summarizeActivityOutcomeIntegrity(input: {
  completion: {
    learningAttemptId: string;
    outcome: EvidenceOutcomeName;
    score: number | null;
  } | null;
  skillFacet?: MasteryFacetName | null;
  adaptiveBindEligible?: boolean | null;
}): ActivityOutcomeIntegritySummary {
  if (!input.completion) {
    return {
      attemptCompleted: false,
      evaluationOutcome: null,
      evidenceRecorded: false,
      skillFacet: input.skillFacet ?? null,
      adaptiveBindEligible: null,
    };
  }
  return {
    attemptCompleted: true,
    evaluationOutcome: input.completion.outcome,
    evidenceRecorded: Boolean(input.completion.learningAttemptId),
    skillFacet: input.skillFacet ?? null,
    adaptiveBindEligible: input.adaptiveBindEligible ?? null,
  };
}

/** Assert completion with FAIL is still a completed attempt (not incomplete). */
export function completionWithFailIsStillComplete(
  outcome: EvidenceOutcomeName,
): boolean {
  return (
    outcome === "FAIL" ||
    outcome === "PARTIAL" ||
    outcome === "SUCCESS"
  );
}

export function outcomeIntegrityModuleDoesNotWriteEvidence(
  sourceText: string,
): boolean {
  const stripped = sourceText
    .replace(
      /export function outcomeIntegrityModuleDoesNotWriteEvidence[\s\S]*$/m,
      "",
    )
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");
  const banned = [
    'from "@/lib/learning/mastery/apply"',
    "from '@/lib/learning/mastery/apply'",
    'from "@/lib/learning/evidence/record"',
    "from '@/lib/learning/evidence/record'",
    "applyEvidenceToMastery(",
    "recordEvidence(",
    "recordAuthoritativeActivityEvidence(",
    "orchestrateFromLearnerState(",
  ];
  return banned.every((b) => !stripped.includes(b));
}

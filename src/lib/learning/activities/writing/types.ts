/**
 * 2P-18 — Writing Adaptive types (additive contract on existing Writing).
 *
 * No WritingMastery, WritingEvidence, WritingOrchestrator, or second engine.
 * Domain differences live in content/prompts/sources/rubrics — not engines.
 */

import type { MasteryFacetName } from "@/lib/learning/types";
import type { RubricCriterion } from "@/lib/learning/activities/rubric";
import type { ContentAccessibilityMeta } from "@/lib/learning/content-production/enrichment";

/** Seed writing activity shapes (A–G). */
export type WritingActivityType =
  | "thesis"
  | "evidence_paragraph"
  | "source_analysis"
  | "paraphrasing"
  | "argument_structure"
  | "revision"
  | "citation";

/**
 * Lifecycle phases — interaction ≠ evaluation ≠ completion ≠ evidence ≠ mastery.
 */
export type WritingLifecyclePhase =
  | "launched"
  | "began"
  | "draft_exists"
  | "evaluated"
  | "revised"
  | "final_submitted"
  | "evidence_recorded"
  | "adaptive_bound";

export type WritingScaffoldLevel = "beginner" | "intermediate" | "challenge";

export type WritingCatalogScaffold = {
  kind: "HINT" | "STEP" | "EXAMPLE" | "CHECKLIST" | "CONSTRAINT";
  label: string;
  content: string;
  level?: 1 | 2 | 3;
  revealPolicy?: "ON_REQUEST" | "ALWAYS";
  doesNotRevealAnswer?: boolean;
};

/**
 * Authoritative learner artifact fields (reuse structured text payload).
 * AI assistance must never silently become learner evidence.
 */
export type WritingLearnerArtifact = {
  prompt: string;
  /** Learner-authored draft (pre-revision). */
  draft: string | null;
  /** Server evaluation summary (not client-forged). */
  evaluation: {
    outcome: string;
    score: number | null;
    perCriterion?: unknown;
  } | null;
  /** Learner revision when required. */
  revision: string | null;
  /** Authoritative final submission text used for evidence. */
  finalSubmission: string;
  /** Explicit: text evaluated came from learner fields, not aiAssistance. */
  learnerAuthored: true;
  /** Optional AI help text — never copied into finalSubmission automatically. */
  aiAssistance: string | null;
};

export type WritingAdaptiveActivity = {
  id: string;
  writingType: WritingActivityType;
  title: string;
  conceptKey: string;
  conceptTitle: string;
  objective: string;
  prompt: string;
  learnerTask: string;
  expectedArtifact: string;
  domainTag: string;
  skillFacet: MasteryFacetName;
  minChars: number;
  criteria: RubricCriterion[];
  /** When true, final must differ from draft and revision field is required. */
  requiresRevision: boolean;
  /** Why revision is not required (when false). */
  revisionNotRequiredReason?: string;
  /** Provided flawed draft for revision activities. */
  starterDraft?: string;
  /** Issues called out for revision activities. */
  revisionIssues?: readonly string[];
  /** Source passage for analysis / paraphrase / citation. */
  sourceMaterial?: string;
  conceptHints: readonly string[];
  scaffolds?: readonly WritingCatalogScaffold[];
  successLooksLike: string;
  progressionStage:
    | "INTRODUCE"
    | "UNDERSTAND"
    | "PRACTICE"
    | "APPLY"
    | "CHALLENGE"
    | "RETAIN";
  scaffoldingLevel: WritingScaffoldLevel;
  contextVariant: string;
  misconceptionTargets?: readonly string[];
  accessibility?: ContentAccessibilityMeta;
  version: string;
  readiness: "ADAPTIVE_READY";
};

export type WritingAdaptiveContractSummary = {
  activityLaunchedIsNotCompletion: true;
  typingIsNotNecessarilySuccess: true;
  failedEvaluationMayProduceEvidence: true;
  interactionSeparateFromEvaluation: true;
  evaluationSeparateFromCompletion: true;
  completionSeparateFromEvidence: true;
  evidenceSeparateFromMastery: true;
  usesUniversalRubric: true;
  usesUniversalEvidencePath: true;
  noWritingMasterySystem: true;
  noAiDetector: true;
  aiAssistanceIsNotLearnerEvidence: true;
};

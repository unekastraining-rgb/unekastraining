/**
 * 2P-11 / 2P-12 — Project already-selected content into a learner-facing experience.
 * Pure. No diagnosis, evidence, mastery, Adaptive mutation, or LLM.
 */

import type { UniversalActivityContentDescriptor } from "@/lib/learning/activities/content-contract";
import type { ContentProgressionEntry } from "@/lib/learning/content-progression/types";
import type { ContentCoverageStatus } from "@/lib/learning/content-coverage/types";
import type { LearningContentStage } from "@/lib/learning/content-progression/types";
import {
  activityScaffoldSourceFromContent,
  projectLearningScaffolds,
  type ActivityScaffoldSource,
} from "@/lib/learning/scaffolding";
import type {
  LearningExperienceActivityKind,
  LearningExperienceStageLabel,
  LearningExperienceTruthSummary,
  LearningExperienceView,
} from "./types";

export type ProjectLearningExperienceInput = {
  conceptId: string;
  conceptTitle?: string | null;
  activityKind: LearningExperienceActivityKind;
  /** 2P-7 catalog descriptor when resolved. */
  descriptor?: UniversalActivityContentDescriptor | null;
  /** 2P-9 progression entry when resolved. */
  progression?: ContentProgressionEntry | null;
  /** Optional Orchestrator/Adaptive reason string — pass-through only. */
  whyReason?: string | null;
  adaptiveContext?: boolean;
  coverageStatus?: ContentCoverageStatus | null;
  /** Optional pre-built scaffold source (tests / specialized callers). */
  scaffoldSource?: ActivityScaffoldSource | null;
};

function stageLabel(
  stage: LearningContentStage | null | undefined,
): LearningExperienceStageLabel | null {
  if (!stage) return null;
  switch (stage) {
    case "INTRODUCE":
      return "Introduction";
    case "UNDERSTAND":
      return "Understand";
    case "PRACTICE":
      return "Practice";
    case "APPLY":
      return "Apply";
    case "CHALLENGE":
      return "Challenge";
    case "RETAIN":
      return "Review";
    default:
      return null;
  }
}

function purposeFromStage(
  stage: LearningContentStage | null | undefined,
  activityKind: LearningExperienceActivityKind,
): string {
  switch (stage) {
    case "INTRODUCE":
      return "Get oriented to this concept.";
    case "UNDERSTAND":
      return "Build a clearer understanding of this concept.";
    case "PRACTICE":
      return "Practice applying this concept.";
    case "APPLY":
      return "Apply this concept in a realistic task.";
    case "CHALLENGE":
      return "Stretch your skill with a harder task.";
    case "RETAIN":
      return "Review this concept to help it stick.";
    default:
      break;
  }
  if (activityKind === "six") {
    return "Work through a guided learning technique for this concept.";
  }
  return "Practice this concept with a guided task.";
}

function expectedActionFor(
  kind: LearningExperienceActivityKind,
): string {
  switch (kind) {
    case "coding":
      return "Write code that meets the objective, then submit for evaluation.";
    case "sql":
      return "Write a SELECT query that answers the task, then submit.";
    case "lab":
      return "Record your procedure, observations, and conclusion, then submit.";
    case "simulation":
      return "Describe your decisions and the outcome, then submit.";
    case "presentation":
      return "Submit an outline that shows structure, explanation, and audience Q&A.";
    case "writing":
      return "Write your response in your own words, then submit.";
    case "project":
      return "Submit a plan covering objective, milestone, and success criteria.";
    case "game":
      return "Complete the matching task with accurate definitions, then submit.";
    case "six":
      return "Follow the technique prompts and submit your response.";
    default:
      return "Complete the task below, then submit.";
  }
}

function completionDescription(kind: LearningExperienceActivityKind): string {
  if (kind === "six") {
    return "Your response is evaluated by the guided technique. Success means you demonstrated understanding of the concept.";
  }
  return "Submit your work for server evaluation. Success means your submission meets the task criteria — not a self-declared score.";
}

/**
 * Project selected content + context into a learner-facing experience view.
 * Does not select content, diagnose, or write evidence/mastery.
 */
export function projectLearningExperience(
  input: ProjectLearningExperienceInput,
): LearningExperienceView {
  const progression = input.progression ?? null;
  const descriptor = input.descriptor ?? null;
  const stage = progression?.stage ?? null;

  const title =
    progression?.objective?.slice(0, 80) ||
    descriptor?.title ||
    "Learning activity";

  const objective =
    progression?.objective?.trim() ||
    descriptor?.objective?.trim() ||
    "Complete the learning task for this concept.";

  const instructions =
    descriptor?.task?.trim() ||
    progression?.objective?.trim() ||
    "Follow the instructions for this activity.";

  const context =
    progression?.contextVariant?.trim() ||
    descriptor?.domainContext?.trim() ||
    null;

  const whyReason = input.whyReason?.trim() || null;

  const contentId =
    progression?.contentId ?? descriptor?.contentId ?? null;

  const scaffoldSource =
    input.scaffoldSource ??
    activityScaffoldSourceFromContent({
      activityKind: input.activityKind,
      contentId,
      descriptor,
      objective,
    });

  const { scaffolds, successLooksLike } =
    projectLearningScaffolds(scaffoldSource);

  const firstHint =
    scaffolds.find((s) => s.kind === "HINT" && s.level === 1)?.content ??
    scaffolds.find((s) => s.kind === "HINT")?.content ??
    null;

  const firstExample =
    scaffolds.find((s) => s.kind === "EXAMPLE")?.content ?? null;

  return {
    conceptId: input.conceptId.trim(),
    conceptTitle: input.conceptTitle?.trim() || null,
    activityKind: input.activityKind,
    title,
    objective,
    instructions,
    context,
    hint: firstHint,
    example: firstExample,
    expectedAction: expectedActionFor(input.activityKind),
    purpose: purposeFromStage(stage, input.activityKind),
    whyReason,
    stage,
    stageLabel: stageLabel(stage),
    difficulty: progression?.difficulty ?? null,
    contentKey: progression?.contentKey ?? null,
    contentId,
    contentVersion: progression?.contentVersion ?? null,
    completionDescription: completionDescription(input.activityKind),
    successLooksLike,
    scaffolds,
    coverageStatus: input.coverageStatus ?? null,
    adaptiveContext: Boolean(input.adaptiveContext),
  };
}

export function learningExperienceTruthSummary(): LearningExperienceTruthSummary {
  return {
    isProjectionOnly: true,
    doesNotDiagnose: true,
    doesNotSelectIntervention: true,
    doesNotWriteEvidence: true,
    doesNotWriteMastery: true,
    doesNotCreateLucky: true,
    doesNotReplaceSix: true,
    doesNotCollapseAssessment: true,
    doesNotFabricateContent: true,
  };
}

export function experienceModuleDoesNotWriteMastery(
  sourceText: string,
): boolean {
  const stripped = sourceText
    .replace(/export function experienceModuleDoesNotWriteMastery[\s\S]*$/m, "")
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
    "selectActivityIntervention(",
  ];
  return banned.every((b) => !stripped.includes(b));
}

/**
 * 2P-12 — Project learner scaffolding from selected content / activity metadata.
 * Pure. No diagnosis, evidence, mastery, Adaptive mutation, content selection, or LLM.
 */

import type { UniversalActivityContentDescriptor } from "@/lib/learning/activities/content-contract";
import type { LearningExperienceActivityKind } from "@/lib/learning/experience/types";
import {
  normalizeLearningScaffold,
  normalizeLearningScaffolds,
  orderLearningScaffolds,
} from "./normalize";
import { projectSuccessLooksLike } from "./success";
import type {
  LearningScaffold,
  LearningScaffoldInput,
  LearningScaffoldTruthSummary,
} from "./types";

export type ActivityScaffoldSource = {
  activityKind: LearningExperienceActivityKind;
  objective?: string | null;
  starter?: string | null;
  entryFunction?: string | null;
  /** Rubric criterion labels only — never mustIncludeAny needles. */
  rubricLabels?: readonly string[] | null;
  minChars?: number | null;
  evaluationMode?: "execution" | "structural" | "sqljs" | "rubric" | "math_steps" | "network_state" | "language_match" | null;
  /** Authored scaffolds from challenge content (preferred). */
  authoredScaffolds?: readonly LearningScaffoldInput[] | null;
  authoredSuccessLooksLike?: string | null;
  descriptor?: UniversalActivityContentDescriptor | null;
};

export type ProjectLearningScaffoldResult = {
  scaffolds: LearningScaffold[];
  successLooksLike: string | null;
};

/**
 * Convert activity/content metadata into ordered learner scaffolds.
 * Does not invent concept-specific hints from titles alone.
 */
export function projectLearningScaffolds(
  source: ActivityScaffoldSource,
): ProjectLearningScaffoldResult {
  const authored = normalizeLearningScaffolds(source.authoredScaffolds);
  const derived: LearningScaffold[] = [];

  const objective = source.objective?.trim() || source.descriptor?.objective?.trim() || "";
  const starter = source.starter?.trim() || "";
  const entry = source.entryFunction?.trim() || "";

  if (starter.length > 0) {
    const step = normalizeLearningScaffold({
      kind: "STEP",
      label: "Start from the starter",
      content:
        "Complete the provided starter. Keep the required structure and fill in the missing parts — do not paste a finished answer from elsewhere.",
      level: 1,
      revealPolicy: "ALWAYS",
      doesNotRevealAnswer: true,
    });
    if (step) derived.push(step);
  }

  if (entry) {
    const constraint = normalizeLearningScaffold({
      kind: "CONSTRAINT",
      label: "Required entry point",
      content: `Your solution must define or use \`${entry}\` as specified by the task.`,
      level: 1,
      revealPolicy: "ON_REQUEST",
      doesNotRevealAnswer: true,
    });
    if (constraint) derived.push(constraint);
  }

  const labels = (source.rubricLabels ?? [])
    .map((l) => l.trim())
    .filter(Boolean);
  if (labels.length > 0) {
    const checklist = normalizeLearningScaffold({
      kind: "CHECKLIST",
      label: "Cover these criteria",
      content: labels.map((l) => `• ${l}`).join("\n"),
      level: 2,
      revealPolicy: "ON_REQUEST",
      doesNotRevealAnswer: true,
    });
    if (checklist) derived.push(checklist);
  }

  if (source.minChars != null && source.minChars > 0) {
    const lengthConstraint = normalizeLearningScaffold({
      kind: "CONSTRAINT",
      label: "Length",
      content: `Write at least ${source.minChars} characters so your response can be evaluated.`,
      level: 1,
      revealPolicy: "ON_REQUEST",
      doesNotRevealAnswer: true,
    });
    if (lengthConstraint) derived.push(lengthConstraint);
  }

  // Deterministic kind-level nudge only when we have an objective (existing
  // guidance tier) and no authored HINT yet — never from concept title alone.
  const hasAuthoredHint = authored.some((s) => s.kind === "HINT");
  if (objective && !hasAuthoredHint) {
    const nudge = kindLevelHint(source.activityKind, objective);
    if (nudge) derived.push(nudge);
  }

  // Prefer authored when same kind+level would duplicate; keep both if distinct.
  const merged = orderLearningScaffolds([...authored, ...derived]);

  return {
    scaffolds: merged,
    successLooksLike: projectSuccessLooksLike({
      activityKind: source.activityKind,
      objective: objective || null,
      evaluationMode:
        source.evaluationMode ?? source.descriptor?.evaluationMode ?? null,
      rubricLabels: labels,
      entryFunction: entry || null,
      minChars: source.minChars ?? null,
      authoredSuccessLooksLike: source.authoredSuccessLooksLike,
    }),
  };
}

function kindLevelHint(
  kind: LearningExperienceActivityKind,
  objective: string,
): LearningScaffold | null {
  let content: string;
  switch (kind) {
    case "coding":
      content =
        "Re-read the objective and check required function names or patterns in the prompt before submitting.";
      break;
    case "sql":
      content =
        "Start from SELECT and add only the columns and filters the task asks for.";
      break;
    case "math":
      content =
        "Keep both sides equal: undo constants first, then undo the coefficient of x.";
      break;
    case "networking":
      content =
        "Observe the symptom, inspect interface state, then verify with a simulated ping.";
      break;
    case "language":
      content =
        "Use speech recognition if available, or type the expected phrase; submit for a speech/typed match.";
      break;
    case "lab":
      content =
        "Walk through configure → test → observe → conclude in order.";
      break;
    case "simulation":
      content =
        "State your decision, what you expect to happen, and why.";
      break;
    case "six":
      // SIX keeps its own guides — only a soft nudge if projected.
      content =
        "Follow the technique prompts in order; respond in your own words.";
      break;
    default:
      content =
        "Re-read the goal and include the key ideas the task asks for.";
  }
  void objective;
  return normalizeLearningScaffold({
    kind: "HINT",
    label: "If you're stuck",
    content,
    level: 1,
    revealPolicy: "ON_REQUEST",
    doesNotRevealAnswer: true,
  });
}

export function learningScaffoldTruthSummary(): LearningScaffoldTruthSummary {
  return {
    isProjectionOnly: true,
    doesNotDiagnose: true,
    doesNotSelectIntervention: true,
    doesNotWriteEvidence: true,
    doesNotWriteMastery: true,
    doesNotCreateLucky: true,
    doesNotRevealAnswerByDefault: true,
    doesNotRequireLlm: true,
    hintRequestIsNotEvidence: true,
  };
}

export function scaffoldModuleDoesNotWriteEvidence(
  sourceText: string,
): boolean {
  const stripped = sourceText
    .replace(/export function scaffoldModuleDoesNotWriteEvidence[\s\S]*$/m, "")
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
    "createLucky",
    "handOffToLucky",
  ];
  return banned.every((b) => !stripped.includes(b));
}

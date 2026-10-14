/**
 * 2P-18 — Map writing Adaptive seeds → structured challenge rows.
 * Avoids importing structured/service (circular dependency).
 */

import type { WritingAdaptiveActivity } from "./types";
import { WRITING_ADAPTIVE_SEED_ACTIVITIES } from "./catalog";

export type WritingStructuredChallengeRow = {
  id: string;
  kind: "writing";
  title: string;
  objective: string;
  prompt: string;
  learningObjectType: "WRITING_EXERCISE";
  skillFacet: WritingAdaptiveActivity["skillFacet"];
  asPerform: false;
  domainTag: string;
  minChars: number;
  conceptHints: readonly string[];
  misconceptionTargets?: readonly string[];
  successLooksLike: string;
  accessibility?: WritingAdaptiveActivity["accessibility"];
  scaffolds?: WritingAdaptiveActivity["scaffolds"];
  starter?: string;
  criteria: WritingAdaptiveActivity["criteria"];
  rules: Record<string, unknown>;
};

export function writingActivityToStructuredChallenge(
  activity: WritingAdaptiveActivity,
): WritingStructuredChallengeRow {
  const sourceBlock = activity.sourceMaterial
    ? `\n\nSource material:\n${activity.sourceMaterial}`
    : "";
  const issuesBlock =
    activity.revisionIssues && activity.revisionIssues.length > 0
      ? `\n\nIdentified issues:\n- ${activity.revisionIssues.join("\n- ")}`
      : "";
  const draftBlock = activity.starterDraft
    ? `\n\nDraft to revise:\n"${activity.starterDraft}"`
    : "";

  return {
    id: activity.id,
    kind: "writing",
    title: activity.title,
    objective: activity.objective,
    prompt: `${activity.prompt}${sourceBlock}${draftBlock}${issuesBlock}`,
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: activity.skillFacet,
    asPerform: false,
    domainTag: activity.domainTag,
    minChars: activity.minChars,
    conceptHints: activity.conceptHints,
    misconceptionTargets: activity.misconceptionTargets,
    successLooksLike: activity.successLooksLike,
    accessibility: activity.accessibility,
    scaffolds: activity.scaffolds,
    starter: activity.requiresRevision ? activity.starterDraft ?? "" : "",
    criteria: activity.criteria,
    rules: {
      writingAdaptive: true,
      writingType: activity.writingType,
      requiresRevision: activity.requiresRevision,
      revisionNotRequiredReason: activity.revisionNotRequiredReason ?? null,
      starterDraft: activity.starterDraft ?? null,
      revisionIssues: activity.revisionIssues ?? null,
      sourceMaterial: activity.sourceMaterial ?? null,
      progressionStage: activity.progressionStage,
      scaffoldingLevel: activity.scaffoldingLevel,
      contextVariant: activity.contextVariant,
      version: activity.version,
      readiness: activity.readiness,
      expectedArtifact: activity.expectedArtifact,
      learnerTask: activity.learnerTask,
      conceptKey: activity.conceptKey,
    },
  };
}

export function listWritingAdaptiveStructuredChallenges(
  activities: readonly WritingAdaptiveActivity[] = WRITING_ADAPTIVE_SEED_ACTIVITIES,
): WritingStructuredChallengeRow[] {
  return activities.map(writingActivityToStructuredChallenge);
}

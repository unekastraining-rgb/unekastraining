/**
 * 2P-12 — Load activity metadata for scaffold projection (read-only catalog).
 * Does not select interventions or write evidence.
 */

import { getCodingChallenge } from "@/lib/learning/activities/coding/challenges";
import { getSqlChallenge } from "@/lib/learning/activities/sql/challenges";
import { getMathChallenge } from "@/lib/learning/activities/math/challenges";
import { getNetworkChallenge } from "@/lib/learning/activities/networking/challenges";
import { getLanguageChallenge } from "@/lib/learning/activities/language/challenges";
import {
  getStructuredChallenge,
  type StructuredActivityKind,
} from "@/lib/learning/activities/structured/service";
import type { UniversalActivityContentDescriptor } from "@/lib/learning/activities/content-contract";
import type { LearningExperienceActivityKind } from "@/lib/learning/experience/types";
import type { ActivityScaffoldSource } from "./project";
import type { LearningScaffoldInput } from "./types";

const STRUCTURED = new Set<StructuredActivityKind>([
  "writing",
  "lab",
  "simulation",
  "game",
  "project",
  "presentation",
]);

/**
 * Resolve catalog challenge fields into a scaffold source.
 * Returns a minimal source when content id is unknown (no fabrication).
 */
export function activityScaffoldSourceFromContent(input: {
  activityKind: LearningExperienceActivityKind;
  contentId?: string | null;
  descriptor?: UniversalActivityContentDescriptor | null;
  objective?: string | null;
}): ActivityScaffoldSource {
  const kind = input.activityKind;
  const contentId = input.contentId?.trim() || null;
  const base: ActivityScaffoldSource = {
    activityKind: kind,
    objective: input.objective ?? input.descriptor?.objective ?? null,
    evaluationMode: input.descriptor?.evaluationMode ?? null,
    descriptor: input.descriptor ?? null,
  };

  if (!contentId || kind === "six") {
    return base;
  }

  if (kind === "coding") {
    const c = getCodingChallenge(contentId);
    if (!c) return base;
    return {
      ...base,
      objective: c.objective,
      starter: c.starter,
      entryFunction: c.entryFunction,
      evaluationMode: c.tests.length > 0 ? "execution" : "structural",
      authoredScaffolds: c.scaffolds as LearningScaffoldInput[] | undefined,
      authoredSuccessLooksLike: c.successLooksLike ?? null,
    };
  }

  if (kind === "sql") {
    const c = getSqlChallenge(contentId);
    if (!c) return base;
    return {
      ...base,
      objective: c.objective,
      starter: c.starter,
      evaluationMode: "sqljs",
      authoredScaffolds: c.scaffolds as LearningScaffoldInput[] | undefined,
      authoredSuccessLooksLike: c.successLooksLike ?? null,
    };
  }

  if (kind === "math") {
    const c = getMathChallenge(contentId);
    if (!c) return base;
    return {
      ...base,
      objective: c.objective,
      starter: c.equation,
      evaluationMode: "math_steps",
      authoredScaffolds: c.scaffolds as LearningScaffoldInput[] | undefined,
      authoredSuccessLooksLike: c.successLooksLike ?? null,
    };
  }

  if (kind === "networking") {
    const c = getNetworkChallenge(contentId);
    if (!c) return base;
    return {
      ...base,
      objective: c.objective,
      starter: c.symptom,
      evaluationMode: "network_state",
      authoredScaffolds: c.scaffolds as LearningScaffoldInput[] | undefined,
      authoredSuccessLooksLike: c.successLooksLike ?? null,
    };
  }

  if (kind === "language") {
    const c = getLanguageChallenge(contentId);
    if (!c) return base;
    return {
      ...base,
      objective: c.objective,
      starter: c.exampleUtterance ?? c.prompt,
      evaluationMode: "language_match",
      authoredScaffolds: c.scaffolds as LearningScaffoldInput[] | undefined,
      authoredSuccessLooksLike: c.successLooksLike ?? null,
    };
  }

  if (STRUCTURED.has(kind as StructuredActivityKind)) {
    const c = getStructuredChallenge(contentId);
    if (!c || c.kind !== kind) return base;
    return {
      ...base,
      objective: c.objective,
      starter: c.starter ?? "",
      rubricLabels: c.criteria.map((x) => x.label),
      minChars: c.minChars ?? null,
      evaluationMode: "rubric",
      authoredScaffolds: c.scaffolds as LearningScaffoldInput[] | undefined,
      authoredSuccessLooksLike: c.successLooksLike ?? null,
    };
  }

  return base;
}

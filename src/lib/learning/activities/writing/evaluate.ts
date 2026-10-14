/**
 * 2P-18 — Writing evaluation via universal rubric + revision gate.
 * Failed evaluations still yield useful evidence details.
 */

import { evaluateAgainstRubric } from "@/lib/learning/activities/rubric";
import { makeServerEvaluation } from "@/lib/learning/activities/server-evaluation";
import type { UniversalEvaluationResult } from "@/lib/learning/activities/execution-contract";
import type { MasteryFacetName } from "@/lib/learning/types";
import type { RubricCriterion } from "@/lib/learning/activities/rubric";

import {
  extractWritingSubmissionFields,
  resolveLearnerAuthoredText,
} from "./artifact";
import { separateAiAssistanceFromEvidence } from "./ai-boundary";
import { getWritingAdaptiveActivity, getWritingAdaptiveMeta } from "./catalog";
import {
  assertWritingRevisionGate,
  stripWritingCompletionForgery,
} from "./revision";

export function evaluateWritingWork(input: {
  challengeId: string;
  criteria: RubricCriterion[];
  skillFacet: MasteryFacetName;
  minChars?: number;
  objective: string;
  domainTag?: string | null;
  work: Record<string, unknown>;
}): {
  evaluation: UniversalEvaluationResult;
  finalText: string;
  rejectedForgeryKeys: string[];
  meta: ReturnType<typeof getWritingAdaptiveMeta>;
} {
  const rejectedForgeryKeys = stripWritingCompletionForgery(input.work);
  const fields = extractWritingSubmissionFields(input.work);
  const separated = separateAiAssistanceFromEvidence({
    learnerText: resolveLearnerAuthoredText(fields),
    aiAssistance: fields.aiAssistance,
  });
  const meta = getWritingAdaptiveMeta(input.challengeId);
  const seed = getWritingAdaptiveActivity(input.challengeId);

  const revisionActivity = seed
    ? seed
    : meta
      ? {
          requiresRevision: meta.requiresRevision,
          minChars: input.minChars ?? 40,
          starterDraft: meta.starterDraft,
        }
      : null;

  if (revisionActivity?.requiresRevision) {
    const gate = assertWritingRevisionGate({
      activity: {
        requiresRevision: true,
        minChars: revisionActivity.minChars,
        starterDraft: revisionActivity.starterDraft,
      },
      fields: {
        ...fields,
        finalText: separated.evidenceText,
        revision: fields.revision,
      },
    });
    if (!gate.ok) {
      return {
        evaluation: makeServerEvaluation({
          outcome: "FAIL",
          score: 0,
          skillFacet: input.skillFacet,
          details: {
            kind: "writing",
            domainTag: input.domainTag ?? null,
            contentId: input.challengeId,
            objective: input.objective,
            mode: "revision_gate",
            error: gate.reason,
            learnerAuthored: true,
            aiAssistancePresent: Boolean(separated.aiAssistance),
            writingType: meta?.writingType ?? null,
            requiresRevision: true,
          },
        }),
        finalText: separated.evidenceText,
        rejectedForgeryKeys,
        meta,
      };
    }
  }

  const evaluation = evaluateAgainstRubric({
    text: separated.evidenceText,
    criteria: input.criteria,
    skillFacet: input.skillFacet,
    minChars: input.minChars,
    details: {
      kind: "writing",
      domainTag: input.domainTag ?? null,
      contentId: input.challengeId,
      objective: input.objective,
      learnerAuthored: true,
      aiAssistancePresent: Boolean(separated.aiAssistance),
      writingType: meta?.writingType ?? null,
      requiresRevision: meta?.requiresRevision ?? false,
      hadDraft: Boolean(fields.draft),
      hadRevision: Boolean(fields.revision),
      // Failed rubric still useful evidence — perCriterion included by rubric.
    },
  });

  return {
    evaluation,
    finalText: separated.evidenceText,
    rejectedForgeryKeys,
    meta,
  };
}

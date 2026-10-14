/**
 * Language workspace → server evaluation → LearningAttempt → ConceptMastery.
 * Play / record / transcript preview / hint never write evidence here.
 */

import { getLanguageChallenge } from "./challenges";
import { evaluateLanguageActivity } from "./evaluate";
import type { LanguageWorkspaceSubmission } from "./types";
import {
  recordAuthoritativeActivityEvidence,
  sanitizeClientActivitySubmission,
} from "@/lib/learning/activities/server-evaluation";
import type { UniversalActivityCompletion } from "@/lib/learning/activities/execution-contract";

function parseSubmission(
  work: Record<string, unknown>,
): LanguageWorkspaceSubmission {
  return {
    transcript:
      typeof work.transcript === "string" ? work.transcript : undefined,
    typedResponse:
      typeof work.typedResponse === "string" ? work.typedResponse : undefined,
    selectedOptionId:
      typeof work.selectedOptionId === "string"
        ? work.selectedOptionId
        : undefined,
    responseChannel:
      work.responseChannel === "spoken_transcript" ||
      work.responseChannel === "typed"
        ? work.responseChannel
        : undefined,
    recordingState:
      typeof work.recordingState === "string"
        ? (work.recordingState as LanguageWorkspaceSubmission["recordingState"])
        : undefined,
    speechCapability:
      work.speechCapability &&
      typeof work.speechCapability === "object" &&
      !Array.isArray(work.speechCapability)
        ? (work.speechCapability as LanguageWorkspaceSubmission["speechCapability"])
        : undefined,
  };
}

export async function submitLanguageChallenge(input: {
  learnerId: string;
  conceptId: string;
  challengeId: string;
  clientBody: Record<string, unknown>;
}): Promise<
  | {
      ok: true;
      completion: UniversalActivityCompletion;
      evaluationDetails: Record<string, unknown>;
      rejectedForgeryKeys: string[];
    }
  | { ok: false; reason: string; rejectedForgeryKeys?: string[] }
> {
  const { work, rejectedForgeryKeys } = sanitizeClientActivitySubmission(
    input.clientBody,
  );

  const challenge = getLanguageChallenge(input.challengeId);
  if (!challenge) {
    return { ok: false, reason: "unknown_challenge", rejectedForgeryKeys };
  }

  const submission = parseSubmission(work);

  const idempotencyKey =
    typeof work.idempotencyKey === "string"
      ? work.idempotencyKey.trim().slice(0, 128)
      : undefined;

  const evaluation = evaluateLanguageActivity(challenge, submission);
  const facet = challenge.skillFacet ?? "PERFORM";

  const recorded = await recordAuthoritativeActivityEvidence({
    learnerId: input.learnerId,
    conceptId: input.conceptId,
    learningObjectType: "LAB",
    skillFacet: facet,
    title: challenge.title,
    payloadRef: {
      kind: "language_workspace",
      id: challenge.id,
      contentId: challenge.id,
      contentKey: challenge.contentKey ?? null,
      objective: challenge.objective,
      domainTag: challenge.domainTag ?? null,
      contextVariant: challenge.contextVariant ?? null,
      ...(idempotencyKey ? { idempotencyKey } : {}),
    },
    successCriteria: {
      objective: challenge.objective,
      mode: challenge.mode,
      languageCode: challenge.languageCode,
      matchLabel: challenge.matchLabel ?? "Speech match",
    },
    evaluation,
    sourceKind: "language_workspace_submit",
    evidencePayload: {
      mode: challenge.mode,
      languageCode: challenge.languageCode,
      matchKind: evaluation.details.matchKind ?? null,
      responseChannel: evaluation.details.responseChannel ?? null,
      pronunciationQualityScore: null,
      misconceptionSignals: evaluation.details.misconceptionSignals ?? [],
      evaluationHonesty: "phrase_or_choice_match_not_pronunciation_quality",
    },
    asPerform: facet === "PERFORM",
  });

  if (!recorded.ok) {
    return { ok: false, reason: recorded.reason, rejectedForgeryKeys };
  }

  return {
    ok: true,
    completion: recorded.completion,
    evaluationDetails: evaluation.details,
    rejectedForgeryKeys,
  };
}

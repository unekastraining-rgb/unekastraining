/**
 * Coding challenge → server evaluation → LearningAttempt → ConceptMastery.
 */

import { getCodingChallenge } from "./challenges";
import { evaluateCodingChallenge } from "./evaluate";
import {
  recordAuthoritativeActivityEvidence,
  sanitizeClientActivitySubmission,
} from "@/lib/learning/activities/server-evaluation";
import type { UniversalActivityCompletion } from "@/lib/learning/activities/execution-contract";

export async function submitCodingChallenge(input: {
  learnerId: string;
  conceptId: string;
  challengeId: string;
  /** Raw client body — forgery fields stripped. */
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
  const code =
    typeof work.code === "string"
      ? work.code
      : typeof work.submission === "string"
        ? work.submission
        : "";

  const challenge = getCodingChallenge(input.challengeId);
  if (!challenge) return { ok: false, reason: "unknown_challenge", rejectedForgeryKeys };

  const idempotencyKey =
    typeof work.idempotencyKey === "string"
      ? work.idempotencyKey.trim().slice(0, 128)
      : undefined;

  const evaluation = evaluateCodingChallenge(challenge, code);
  const recorded = await recordAuthoritativeActivityEvidence({
    learnerId: input.learnerId,
    conceptId: input.conceptId,
    learningObjectType: "CODING_CHALLENGE",
    skillFacet: "PERFORM",
    title: challenge.title,
    payloadRef: {
      kind: "coding_challenge",
      id: challenge.id,
      contentId: challenge.id,
      objective: challenge.objective,
      language: challenge.language,
      domainTag: challenge.domainTag ?? null,
      ...(idempotencyKey ? { idempotencyKey } : {}),
    },
    successCriteria: {
      objective: challenge.objective,
      entryFunction: challenge.entryFunction,
      tests: challenge.tests.map((t) => t.id),
    },
    evaluation,
    sourceKind: "coding_challenge_submit",
    evidencePayload: {
      language: challenge.language,
      codeLength: code.length,
      // Never store full forged claims; code snippet capped for payload size
      codePreview: code.slice(0, 500),
    },
    asPerform: true,
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

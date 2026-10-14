import { getSqlChallenge } from "./challenges";
import { evaluateSqlChallenge } from "./evaluate";
import {
  recordAuthoritativeActivityEvidence,
  sanitizeClientActivitySubmission,
} from "@/lib/learning/activities/server-evaluation";
import type { UniversalActivityCompletion } from "@/lib/learning/activities/execution-contract";

export async function submitSqlChallenge(input: {
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
  const sql =
    typeof work.sql === "string"
      ? work.sql
      : typeof work.query === "string"
        ? work.query
        : "";

  const challenge = getSqlChallenge(input.challengeId);
  if (!challenge) {
    return { ok: false, reason: "unknown_challenge", rejectedForgeryKeys };
  }

  const idempotencyKey =
    typeof work.idempotencyKey === "string"
      ? work.idempotencyKey.trim().slice(0, 128)
      : undefined;

  const evaluation = await evaluateSqlChallenge(challenge, sql);
  const recorded = await recordAuthoritativeActivityEvidence({
    learnerId: input.learnerId,
    conceptId: input.conceptId,
    learningObjectType: "SQL_CHALLENGE",
    skillFacet: "PERFORM",
    title: challenge.title,
    payloadRef: {
      kind: "sql_challenge",
      id: challenge.id,
      contentId: challenge.id,
      objective: challenge.objective,
      domainTag: challenge.domainTag ?? null,
      ...(idempotencyKey ? { idempotencyKey } : {}),
    },
    successCriteria: {
      objective: challenge.objective,
      expectedRows: challenge.expectedRows.length,
    },
    evaluation,
    sourceKind: "sql_challenge_submit",
    evidencePayload: {
      sqlPreview: sql.slice(0, 400),
      contentId: challenge.id,
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

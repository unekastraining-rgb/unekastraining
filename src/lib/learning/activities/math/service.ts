/**
 * Math workspace → server evaluation → LearningAttempt → ConceptMastery.
 * Working state / check-step / hints never write evidence here.
 */

import { getMathChallenge } from "./challenges";
import { evaluateMathWorkspace } from "./evaluate";
import {
  recordAuthoritativeActivityEvidence,
  sanitizeClientActivitySubmission,
} from "@/lib/learning/activities/server-evaluation";
import type { UniversalActivityCompletion } from "@/lib/learning/activities/execution-contract";

function parseSteps(work: Record<string, unknown>): string[] {
  if (Array.isArray(work.steps)) {
    return work.steps.map((s) => String(s ?? "").trim()).filter(Boolean);
  }
  if (typeof work.text === "string" && work.text.trim()) {
    return work.text
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

export async function submitMathChallenge(input: {
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

  const challenge = getMathChallenge(input.challengeId);
  if (!challenge) {
    return { ok: false, reason: "unknown_challenge", rejectedForgeryKeys };
  }

  const steps = parseSteps(work);
  const explanation =
    typeof work.explanation === "string" ? work.explanation : undefined;

  const idempotencyKey =
    typeof work.idempotencyKey === "string"
      ? work.idempotencyKey.trim().slice(0, 128)
      : undefined;

  const evaluation = evaluateMathWorkspace(challenge, { steps, explanation });

  const recorded = await recordAuthoritativeActivityEvidence({
    learnerId: input.learnerId,
    conceptId: input.conceptId,
    learningObjectType: "LAB",
    skillFacet: "SOLVE",
    title: challenge.title,
    payloadRef: {
      kind: "math_workspace",
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
      expectedX: challenge.expectedX,
      equation: challenge.equation,
    },
    evaluation,
    sourceKind: "math_workspace_submit",
    evidencePayload: {
      stepCount: steps.length,
      errorCategory: evaluation.details.errorCategory ?? null,
      misconceptionSignals: evaluation.details.misconceptionSignals ?? [],
      finalCorrect: evaluation.details.finalCorrect ?? false,
      mode: "math_linear_constrained",
    },
    asPerform: false,
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

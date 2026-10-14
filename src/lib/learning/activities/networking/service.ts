/**
 * Network workspace → server evaluation → LearningAttempt → ConceptMastery.
 * Inspect / ping / hint never write evidence here.
 */

import { getNetworkChallenge } from "./challenges";
import { evaluateNetworkWorkspace } from "./evaluate";
import { cloneNetworkState } from "./state";
import type { NetworkState } from "./types";
import {
  recordAuthoritativeActivityEvidence,
  sanitizeClientActivitySubmission,
} from "@/lib/learning/activities/server-evaluation";
import type { UniversalActivityCompletion } from "@/lib/learning/activities/execution-contract";

function parseState(work: Record<string, unknown>): NetworkState | null {
  const raw = work.state;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  if (
    !Array.isArray(obj.nodes) ||
    !Array.isArray(obj.interfaces) ||
    !Array.isArray(obj.links)
  ) {
    return null;
  }
  return cloneNetworkState(raw as NetworkState);
}

export async function submitNetworkChallenge(input: {
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

  const challenge = getNetworkChallenge(input.challengeId);
  if (!challenge) {
    return { ok: false, reason: "unknown_challenge", rejectedForgeryKeys };
  }

  const state = parseState(work);
  if (!state) {
    return { ok: false, reason: "malformed_state", rejectedForgeryKeys };
  }

  const diagnosis =
    typeof work.diagnosis === "string" ? work.diagnosis : undefined;

  const idempotencyKey =
    typeof work.idempotencyKey === "string"
      ? work.idempotencyKey.trim().slice(0, 128)
      : undefined;

  const evaluation = evaluateNetworkWorkspace(challenge, { state, diagnosis });
  const facet = challenge.skillFacet ?? "SOLVE";

  const recorded = await recordAuthoritativeActivityEvidence({
    learnerId: input.learnerId,
    conceptId: input.conceptId,
    learningObjectType: "SIMULATION",
    skillFacet: facet,
    title: challenge.title,
    payloadRef: {
      kind: "network_workspace",
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
      faultKind: challenge.faultKind,
      faultTargetId: challenge.faultTargetId,
    },
    evaluation,
    sourceKind: "network_workspace_submit",
    evidencePayload: {
      faultKind: challenge.faultKind,
      errorCategory: evaluation.details.errorCategory ?? null,
      misconceptionSignals: evaluation.details.misconceptionSignals ?? [],
      mode: "network_topology_constrained",
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

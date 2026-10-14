/**
 * 2G-71 WS B — Server-authoritative activity evaluation boundary.
 *
 * Client may submit learner work only.
 * Client may NOT authoritatively submit SUCCESS/PARTIAL/FAIL, score,
 * mastery, evidence, learner identity, or concept ownership.
 */

import { db } from "@/lib/db";
import { buildEvidenceEnvelope } from "@/lib/learning/evidence/envelope";
import { recordEvidence } from "@/lib/learning/evidence/record";
import { applyEvidenceToMastery } from "@/lib/learning/mastery/apply";
import { ensureLearningObject } from "@/lib/learning/learning-object/ensure";
import { getOrCreateLearnerProfile } from "@/lib/learning/learner-profile";
import type {
  EvidenceOutcomeName,
  LearningObjectTypeName,
  MasteryFacetName,
} from "@/lib/learning/types";
import type {
  UniversalActivityCompletion,
  UniversalEvaluationResult,
} from "@/lib/learning/activities/execution-contract";
import { buildPerformEvidenceEnvelope } from "@/lib/learning/assessment/perform-evidence-contract";

/** Fields a malicious client might try to forge — always stripped. */
export type ClientForgeryFields = {
  outcome?: unknown;
  score?: unknown;
  mastery?: unknown;
  evidence?: unknown;
  learnerId?: unknown;
  userId?: unknown;
  conceptId?: unknown;
  skillFacet?: unknown;
  SUCCESS?: unknown;
  PARTIAL?: unknown;
  FAIL?: unknown;
};

export type SanitizeClientActivitySubmissionResult = {
  work: Record<string, unknown>;
  rejectedForgeryKeys: string[];
};

const FORGERY_KEYS = [
  "outcome",
  "score",
  "mastery",
  "evidence",
  "learnerId",
  "userId",
  "conceptId",
  "skillFacet",
  "SUCCESS",
  "PARTIAL",
  "FAIL",
  "ABANDONED",
  "conceptMastery",
  "learningAttemptId",
  "evidenceEnvelope",
] as const;

/**
 * Strip forged authority fields from client payload. Work remains.
 */
export function sanitizeClientActivitySubmission(
  body: Record<string, unknown>,
): SanitizeClientActivitySubmissionResult {
  const rejectedForgeryKeys: string[] = [];
  const work: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(body)) {
    if ((FORGERY_KEYS as readonly string[]).includes(key)) {
      rejectedForgeryKeys.push(key);
      continue;
    }
    // Nested forgeries under "evaluation" / "result"
    if (key === "evaluation" || key === "result" || key === "claim") {
      rejectedForgeryKeys.push(key);
      continue;
    }
    work[key] = value;
  }

  return { work, rejectedForgeryKeys };
}

export async function assertOwnedConcept(input: {
  learnerId: string;
  conceptId: string;
}): Promise<
  | { ok: true; concept: { id: string; learningSpaceId: string | null; title: string } }
  | { ok: false; reason: "missing_concept" | "foreign_concept" }
> {
  const conceptId = input.conceptId.trim();
  if (!conceptId) return { ok: false, reason: "missing_concept" };

  const concept = await db.concept.findFirst({
    where: { id: conceptId, userId: input.learnerId },
    select: { id: true, learningSpaceId: true, title: true },
  });
  if (!concept) return { ok: false, reason: "foreign_concept" };
  return { ok: true, concept };
}

export type RecordAuthoritativeActivityEvidenceInput = {
  learnerId: string;
  conceptId: string;
  learningObjectType: LearningObjectTypeName;
  skillFacet: MasteryFacetName;
  title: string;
  payloadRef: { kind: string; id: string; [key: string]: unknown };
  successCriteria?: Record<string, unknown>;
  evaluation: UniversalEvaluationResult;
  sourceKind: string;
  evidencePayload?: Record<string, unknown>;
  /** When true and facet is PERFORM, use PERFORM envelope helper. */
  asPerform?: boolean;
};

export type RecordAuthoritativeActivityEvidenceResult =
  | {
      ok: true;
      completion: UniversalActivityCompletion;
      rejectedClientClaims: true;
    }
  | { ok: false; reason: string };

/**
 * Persist evaluation → EvidenceEnvelope → LearningAttempt → ConceptMastery.
 * Uses session learnerId and owned conceptId only.
 */
export async function recordAuthoritativeActivityEvidence(
  input: RecordAuthoritativeActivityEvidenceInput,
): Promise<RecordAuthoritativeActivityEvidenceResult> {
  if (!input.evaluation.serverAuthoritative) {
    return { ok: false, reason: "evaluation_not_server_authoritative" };
  }

  const owned = await assertOwnedConcept({
    learnerId: input.learnerId,
    conceptId: input.conceptId,
  });
  if (!owned.ok) {
    return { ok: false, reason: owned.reason };
  }

  await getOrCreateLearnerProfile(input.learnerId);

  const learningObject = await ensureLearningObject({
    userId: input.learnerId,
    type: input.learningObjectType,
    title: input.title.slice(0, 120),
    conceptIds: [owned.concept.id],
    skillFacet: input.skillFacet,
    learningSpaceId: owned.concept.learningSpaceId,
    successCriteria: input.successCriteria ?? { objective: true },
    expectedEvidence: {
      skillFacet: input.skillFacet,
      outcomes: ["SUCCESS", "PARTIAL", "FAIL"],
    },
    payloadRef: input.payloadRef,
  });

  const sourceRef = {
    ...input.payloadRef,
    kind: input.sourceKind,
    activityId: input.payloadRef.id,
  };

  let envelope;
  if (input.asPerform || input.skillFacet === "PERFORM") {
    const built = buildPerformEvidenceEnvelope({
      learnerId: input.learnerId,
      learningObjectId: learningObject.id,
      conceptId: owned.concept.id,
      outcome: input.evaluation.outcome,
      score: input.evaluation.score,
      sourceRef,
      evidencePayload: {
        ...(input.evidencePayload ?? {}),
        evaluator: input.evaluation.details,
      },
    });
    if (!built.ok) return { ok: false, reason: built.reason };
    envelope = built.envelope;
  } else {
    envelope = buildEvidenceEnvelope({
      learnerId: input.learnerId,
      learningObjectId: learningObject.id,
      conceptId: owned.concept.id,
      skillFacet: input.skillFacet,
      outcome: input.evaluation.outcome,
      score: input.evaluation.score,
      sourceRef,
      evidencePayload: {
        ...(input.evidencePayload ?? {}),
        evaluator: input.evaluation.details,
      },
      endedAt: new Date(),
    });
  }

  const attempt = await recordEvidence(envelope);
  await applyEvidenceToMastery(envelope);

  return {
    ok: true,
    rejectedClientClaims: true,
    completion: {
      learningAttemptId: attempt.id,
      conceptId: owned.concept.id,
      outcome: input.evaluation.outcome,
      score: input.evaluation.score,
    },
  };
}

/** Map pass ratio → outcome (server only). */
export function outcomeFromPassRatio(ratio: number): EvidenceOutcomeName {
  if (ratio >= 0.8) return "SUCCESS";
  if (ratio >= 0.5) return "PARTIAL";
  return "FAIL";
}

export function makeServerEvaluation(input: {
  outcome: EvidenceOutcomeName;
  score: number | null;
  details?: Record<string, unknown>;
  skillFacet: MasteryFacetName;
}): UniversalEvaluationResult {
  return {
    serverAuthoritative: true,
    outcome: input.outcome,
    score: input.score,
    details: input.details ?? {},
    skillFacet: input.skillFacet,
  };
}

export function serverEvaluationTruthSummary(): {
  clientMaySubmitOutcome: false;
  clientMaySubmitScore: false;
  clientMaySubmitMastery: false;
  clientMaySubmitEvidence: false;
  clientMaySubmitLearnerIdentity: false;
  clientMaySubmitConceptOwnership: false;
  aiAloneIsNotObjectiveMastery: true;
} {
  return {
    clientMaySubmitOutcome: false,
    clientMaySubmitScore: false,
    clientMaySubmitMastery: false,
    clientMaySubmitEvidence: false,
    clientMaySubmitLearnerIdentity: false,
    clientMaySubmitConceptOwnership: false,
    aiAloneIsNotObjectiveMastery: true,
  };
}

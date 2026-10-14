import type { MasteryFacet } from "@/generated/prisma";

import {
  buildEvidenceEnvelope,
  outcomeFromScoreRatio,
} from "@/lib/learning/evidence/envelope";
import { recordEvidence } from "@/lib/learning/evidence/record";
import { getOrCreateLearnerProfile } from "@/lib/learning/learner-profile";
import { ensureLearningObject } from "@/lib/learning/learning-object/ensure";
import { applyEvidenceToMastery } from "@/lib/learning/mastery/apply";
import type {
  TutorEvidenceIntent,
  TutorMode,
  TutorRequest,
} from "@/lib/learning/tutor/types";

/** Minimum learner demonstration length for meaningful Tutor evidence. */
export const TUTOR_EVIDENCE_MIN_DEMONSTRATION_CHARS = 8;

/** Ordinary conversation must not create mastery evidence. */
export function shouldRecordTutorEvidence(
  intent: TutorEvidenceIntent | undefined,
): boolean {
  if (!intent || intent === "none") return false;
  return (
    intent === "explain" ||
    intent === "practice_answer" ||
    intent === "guided_task" ||
    intent === "apply" ||
    intent === "solve"
  );
}

export function facetForTutorEvidence(
  intent: TutorEvidenceIntent,
): MasteryFacet {
  switch (intent) {
    case "explain":
      return "EXPLAIN";
    case "apply":
      return "APPLY";
    case "solve":
      return "SOLVE";
    case "practice_answer":
    case "guided_task":
      return "APPLY";
    default:
      return "EXPLAIN";
  }
}

export function isTutorEvidenceIntent(
  value: unknown,
): value is TutorEvidenceIntent {
  return (
    value === "none" ||
    value === "explain" ||
    value === "practice_answer" ||
    value === "guided_task" ||
    value === "apply" ||
    value === "solve"
  );
}

export type TutorEvidenceAuthorization = {
  eligible: boolean;
  /** Server-approved intent used for facet / LO labeling when eligible. */
  evidenceIntent?: TutorEvidenceIntent;
  skillFacet?: MasteryFacet;
  reason: string;
};

function demonstrationChars(demo: string | null | undefined): number {
  return demo?.trim().length ?? 0;
}

/**
 * Phase 2G-67 — server-authoritative Tutor evidence gate.
 *
 * Client `evidenceIntent` / `clientEvidenceIntentRequest` never authorize writes.
 * Requires: server authorization flag + recordable intent + meaningful demonstration
 * + owned concept id (checked by caller / maybeRecord).
 */
export function resolveTutorEvidenceAuthorization(input: {
  request: Pick<
    TutorRequest,
    | "evidenceIntent"
    | "clientEvidenceIntentRequest"
    | "evidenceAuthorizedByServer"
    | "learnerDemonstration"
  >;
  /** Owned concept id from Tutor context (already ownership-filtered). */
  ownedConceptId: string | null;
}): TutorEvidenceAuthorization {
  const { request, ownedConceptId } = input;

  if (request.evidenceAuthorizedByServer !== true) {
    return {
      eligible: false,
      reason: "evidence_not_server_authorized",
    };
  }

  const intent = request.evidenceIntent;
  if (!shouldRecordTutorEvidence(intent)) {
    return {
      eligible: false,
      reason: "evidence_intent_none_or_unset",
    };
  }

  // Client-requested kind is contextual only — never overrides server intent.
  void request.clientEvidenceIntentRequest;

  if (!ownedConceptId) {
    return {
      eligible: false,
      reason: "no_owned_concept",
    };
  }

  const demoLen = demonstrationChars(request.learnerDemonstration);
  if (demoLen < TUTOR_EVIDENCE_MIN_DEMONSTRATION_CHARS) {
    return {
      eligible: false,
      reason: "insufficient_learner_demonstration",
    };
  }

  const evidenceIntent = intent as TutorEvidenceIntent;
  return {
    eligible: true,
    evidenceIntent,
    skillFacet: facetForTutorEvidence(evidenceIntent),
    reason: "server_authorized_meaningful_demonstration",
  };
}

/**
 * Best-effort ULE evidence for server-authorized tutoring demonstrations only.
 * Does not invent mastery scores — uses a conservative partial outcome when
 * no explicit score is provided (demonstration happened; quality unknown).
 *
 * `score` is server-caller-only (never taken from TutorRequest / client body).
 */
export async function maybeRecordTutorEvidence(input: {
  learnerId: string;
  mode: TutorMode;
  evidenceIntent: TutorEvidenceIntent;
  /** Must be true — client cannot authorize via evidenceIntent alone. */
  evidenceAuthorizedByServer: boolean;
  conceptId: string | null;
  learningSpaceId?: string | null;
  learningObjectId?: string | null;
  activityId?: string | null;
  learnerDemonstration?: string | null;
  tutorReplyExcerpt?: string | null;
  /** Optional 0–1 quality when a practice answer was graded (server-only). */
  score?: number | null;
}): Promise<{ learningAttemptId: string | null; recorded: boolean }> {
  const auth = resolveTutorEvidenceAuthorization({
    request: {
      evidenceIntent: input.evidenceIntent,
      evidenceAuthorizedByServer: input.evidenceAuthorizedByServer,
      learnerDemonstration: input.learnerDemonstration,
    },
    ownedConceptId: input.conceptId,
  });

  if (!auth.eligible || !auth.evidenceIntent || !auth.skillFacet) {
    return { learningAttemptId: null, recorded: false };
  }

  const evidenceIntent = auth.evidenceIntent;
  const skillFacet = auth.skillFacet;

  try {
    await getOrCreateLearnerProfile(input.learnerId);

    const learningObject =
      input.learningObjectId != null
        ? await ensureLearningObject({
            userId: input.learnerId,
            type: "TUTOR_TURN",
            title: `Tutor ${input.mode} · ${evidenceIntent}`,
            conceptIds: [input.conceptId!],
            skillFacet,
            learningSpaceId: input.learningSpaceId ?? null,
            payloadRef: {
              kind: "tutor_turn",
              learningObjectId: input.learningObjectId,
              activityId: input.activityId ?? null,
              mode: input.mode,
              evidenceIntent,
            },
          })
        : await ensureLearningObject({
            userId: input.learnerId,
            type: "TUTOR_TURN",
            title: `Tutor ${input.mode} · ${evidenceIntent}`,
            conceptIds: [input.conceptId!],
            skillFacet,
            learningSpaceId: input.learningSpaceId ?? null,
            payloadRef: {
              kind: "tutor_turn",
              activityId: input.activityId ?? null,
              mode: input.mode,
              evidenceIntent,
              // Stable-ish key per concept+intent+mode so we reuse LO rows.
              conceptId: input.conceptId,
            },
          });

    // Outcome/score: server-caller only. Never accept client SUCCESS/FAIL claims.
    const score =
      input.score != null && Number.isFinite(input.score)
        ? Math.max(0, Math.min(1, input.score))
        : 0.6;
    const outcome = outcomeFromScoreRatio(score);

    const envelope = buildEvidenceEnvelope({
      learnerId: input.learnerId,
      learningObjectId: learningObject.id,
      conceptId: input.conceptId!,
      skillFacet,
      outcome,
      score,
      confidence: null,
      misconceptionSignals: [],
      sourceRef: {
        kind: "tutor_interaction",
        mode: input.mode,
        evidenceIntent,
        activityId: input.activityId ?? null,
      },
      evidencePayload: {
        mode: input.mode,
        evidenceIntent,
        demonstrationChars: input.learnerDemonstration?.length ?? 0,
        replyChars: input.tutorReplyExcerpt?.length ?? 0,
        authorization: "server",
      },
      endedAt: new Date(),
    });

    const attempt = await recordEvidence(envelope);
    await applyEvidenceToMastery(envelope);
    return { learningAttemptId: attempt.id, recorded: true };
  } catch (error) {
    console.error("Tutor evidence recording failed:", error);
    return { learningAttemptId: null, recorded: false };
  }
}

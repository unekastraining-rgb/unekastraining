import type { LearningObjectType, MasteryFacet } from "@/generated/prisma";

import {
  buildEvidenceEnvelope,
  outcomeFromScoreRatio,
} from "@/lib/learning/evidence/envelope";
import { recordEvidence } from "@/lib/learning/evidence/record";
import { ensureConceptForTopic } from "@/lib/learning/knowledge/concept";
import { getOrCreateLearnerProfile } from "@/lib/learning/learner-profile";
import { ensureStudyEvaluateLearningObject } from "@/lib/learning/learning-object/ensure";
import { applyEvidenceToMastery } from "@/lib/learning/mastery/apply";

export type StudyEvaluateMode = "blurting" | "teach-me" | "six";

/**
 * Conservative facet / LO mapping from what Study Evaluate actually scores.
 * Does not claim PERFORM/SOLVE unless the activity demonstrates them.
 */
export function mapStudyEvaluateToLearningSignals(input: {
  mode: StudyEvaluateMode;
  sixComponent?: string | null;
}): {
  type: LearningObjectType;
  skillFacet: MasteryFacet;
  sixTechnique: string | null;
} {
  if (input.mode === "blurting") {
    return {
      type: "ACTIVE_RECALL",
      skillFacet: "RETAIN",
      sixTechnique: "active_recall",
    };
  }

  if (input.mode === "teach-me") {
    return {
      type: "FEYNMAN",
      skillFacet: "EXPLAIN",
      sixTechnique: "feynman",
    };
  }

  // mode === "six"
  const component = (input.sixComponent ?? "").toLowerCase();
  switch (component) {
    case "chunking":
      return {
        type: "OTHER",
        skillFacet: "RECOGNIZE",
        sixTechnique: "chunking",
      };
    case "detailed-explanation":
    case "detailed_explanation":
      return {
        type: "EXPLANATION",
        skillFacet: "EXPLAIN",
        sixTechnique: "detailed_explanation",
      };
    case "feynman":
      return {
        type: "FEYNMAN",
        skillFacet: "EXPLAIN",
        sixTechnique: "feynman",
      };
    case "visualization":
      return {
        type: "VISUALIZATION",
        // Written visualization step scored for understanding — EXPLAIN, not PERFORM.
        skillFacet: "EXPLAIN",
        sixTechnique: "visualization",
      };
    case "hands-on-practice":
    case "hands_on_practice":
      return {
        type: "HANDS_ON_PRACTICE",
        // Textual practice response — APPLY (not PERFORM without a live lab).
        skillFacet: "APPLY",
        sixTechnique: "hands_on_practice",
      };
    case "active-recall":
    case "active_recall":
      return {
        type: "ACTIVE_RECALL",
        skillFacet: "RETAIN",
        sixTechnique: "active_recall",
      };
    default:
      return {
        type: "OTHER",
        skillFacet: "EXPLAIN",
        sixTechnique: component || null,
      };
  }
}

/**
 * Study Evaluate → LO → Evidence → ConceptMastery.
 * Only records when a reliable Topic → Concept mapping exists (topicId required).
 */
export async function recordStudyEvaluateEvidence(input: {
  userId: string;
  mode: StudyEvaluateMode;
  topicId: string | null | undefined;
  scoreRatio: number;
  sixComponent?: string | null;
  stepIndex?: number | null;
  stepTitle?: string | null;
  misconceptions?: string[];
  gaps?: string[];
}): Promise<{
  recorded: boolean;
  conceptId: string | null;
  attemptId: string | null;
  reason?: string;
}> {
  if (!input.topicId) {
    return {
      recorded: false,
      conceptId: null,
      attemptId: null,
      reason:
        "No reliable Topic id for Study Evaluate — refusing to invent a Concept.",
    };
  }

  await getOrCreateLearnerProfile(input.userId);

  const concept = await ensureConceptForTopic(input.userId, input.topicId);
  const signals = mapStudyEvaluateToLearningSignals({
    mode: input.mode,
    sixComponent: input.sixComponent,
  });

  const learningObject = await ensureStudyEvaluateLearningObject({
    userId: input.userId,
    mode: input.mode,
    conceptId: concept.id,
    learningSpaceId: concept.learningSpaceId,
    sixComponent: input.sixComponent,
    stepIndex: input.stepIndex,
    title: input.stepTitle ?? `${input.mode}:${concept.title}`,
    type: signals.type,
    skillFacet: signals.skillFacet,
    sixTechnique: signals.sixTechnique,
  });

  const outcome = outcomeFromScoreRatio(input.scoreRatio);
  const misconceptionSignals = [
    ...(input.misconceptions ?? []).slice(0, 5).map((m) => `misconception:${m}`),
    ...(input.gaps ?? []).slice(0, 5).map((g) => `gap:${g}`),
  ];

  const envelope = buildEvidenceEnvelope({
    learnerId: input.userId,
    learningObjectId: learningObject.id,
    conceptId: concept.id,
    skillFacet: signals.skillFacet,
    outcome,
    score: input.scoreRatio,
    misconceptionSignals,
    sourceRef: {
      kind: "study_evaluate",
      mode: input.mode,
      topicId: input.topicId,
      sixComponent: input.sixComponent ?? null,
      stepIndex: input.stepIndex ?? null,
    },
    evidencePayload: {
      mode: input.mode,
      sixComponent: input.sixComponent ?? null,
      scoreRatio: input.scoreRatio,
    },
    endedAt: new Date(),
  });

  const attempt = await recordEvidence(envelope);
  await applyEvidenceToMastery(envelope);

  return {
    recorded: true,
    conceptId: concept.id,
    attemptId: attempt.id,
  };
}

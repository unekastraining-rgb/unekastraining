import type { ReviewRating } from "@/lib/academic";
import {
  buildEvidenceEnvelope,
  outcomeFromScoreRatio,
} from "@/lib/learning/evidence/envelope";
import { recordEvidence } from "@/lib/learning/evidence/record";
import { ensureConceptForTopic } from "@/lib/learning/knowledge/concept";
import { getOrCreateLearnerProfile } from "@/lib/learning/learner-profile";
import { ensureFlashcardLearningObject } from "@/lib/learning/learning-object/ensure";
import { applyEvidenceToMastery } from "@/lib/learning/mastery/apply";
import type { EvidenceOutcomeName } from "@/lib/learning/types";

function ratingToScoreRatio(rating: ReviewRating): number {
  if (rating === "EASY") return 0.9;
  if (rating === "GOOD") return 0.75;
  return 0.35;
}

function ratingToOutcome(rating: ReviewRating): EvidenceOutcomeName {
  // Align with existing TopicMasteryFromReview thresholds (EASY/GOOD succeed-ish).
  if (rating === "AGAIN") return "FAIL";
  if (rating === "GOOD") return outcomeFromScoreRatio(0.75); // PARTIAL
  return "SUCCESS";
}

/**
 * Flashcard review → LO → Evidence → ConceptMastery (RETAIN).
 * Requires a Topic (always present on Flashcard) so Concept mapping is reliable.
 * Does not invent Concepts. Does not alter SM-2.
 */
export async function recordFlashcardReviewEvidence(input: {
  userId: string;
  flashcard: {
    id: string;
    front: string;
    topicId: string;
  };
  rating: ReviewRating;
}): Promise<{
  recorded: boolean;
  conceptId: string | null;
  attemptId: string | null;
  reason?: string;
}> {
  if (!input.flashcard.topicId) {
    return {
      recorded: false,
      conceptId: null,
      attemptId: null,
      reason: "No topicId on flashcard — refusing to invent a Concept.",
    };
  }

  await getOrCreateLearnerProfile(input.userId);

  const concept = await ensureConceptForTopic(
    input.userId,
    input.flashcard.topicId,
  );

  const learningObject = await ensureFlashcardLearningObject({
    userId: input.userId,
    flashcardId: input.flashcard.id,
    front: input.flashcard.front,
    conceptId: concept.id,
    learningSpaceId: concept.learningSpaceId,
  });

  const score = ratingToScoreRatio(input.rating);
  const outcome = ratingToOutcome(input.rating);

  const envelope = buildEvidenceEnvelope({
    learnerId: input.userId,
    learningObjectId: learningObject.id,
    conceptId: concept.id,
    skillFacet: "RETAIN",
    outcome,
    score,
    misconceptionSignals:
      input.rating === "AGAIN" ? ["flashcard_again"] : [],
    sourceRef: {
      kind: "flashcard_review",
      flashcardId: input.flashcard.id,
      topicId: input.flashcard.topicId,
      rating: input.rating,
    },
    evidencePayload: {
      rating: input.rating,
      demonstrated: "spaced_recall",
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

import { db } from "@/lib/db";
import {
  aggregateEvidenceSignals,
  classifyEvidenceSourceKind,
  emptyEvidenceSignals,
} from "@/lib/learning/evidence/aggregate";
import { EVIDENCE_AGGREGATION_POLICY } from "@/lib/learning/evidence/aggregation-policy";
import { isEvidenceIntelligenceEnabled } from "@/lib/learning/evidence/intelligence-flag";
import { emptyFacetScores } from "@/lib/learning/mastery/facets";
import type { LearnerConceptMasterySummary } from "@/lib/learning/types";

/**
 * Map rich evidence buckets onto the LearnerConceptMasterySummary counter shape.
 * Activity / tutor / lucky land in `other` for backward-compatible summary counts;
 * full classification lives on EvidenceSignals / projectLearnerConceptState.
 */
function classifySourceKind(
  sourceRefJson: string,
): keyof LearnerConceptMasterySummary["evidenceSourceCounts"] {
  const kind = classifyEvidenceSourceKind(sourceRefJson);
  if (kind === "quiz" || kind === "flashcard" || kind === "study_evaluate") {
    return kind;
  }
  return "other";
}

/**
 * Minimum Learner Model read path:
 * "What do we know about this learner's mastery of this concept?"
 * Aggregates quiz + flashcard + Study Evaluate evidence via ConceptMastery + attempt sources.
 *
 * Phase 2F-2: when STUDY_HAUL_EVIDENCE_INTELLIGENCE is ON, attaches additive
 * evidenceSignals from the same owned LearningAttempt rows (read-only).
 */
export async function getLearnerConceptMastery(
  learnerId: string,
  conceptId: string,
): Promise<LearnerConceptMasterySummary | null> {
  const concept = await db.concept.findFirst({
    where: { id: conceptId, userId: learnerId },
  });
  if (!concept) return null;

  const mastery = await db.conceptMastery.findUnique({
    where: {
      userId_conceptId: { userId: learnerId, conceptId },
    },
  });

  const linkedTopic = await db.topic.findFirst({
    where: { conceptId },
    include: {
      masteries: {
        where: { userId: learnerId },
        take: 1,
      },
    },
  });

  const topicMasteryRow = linkedTopic?.masteries[0] ?? null;

  const recentMissedCount = linkedTopic
    ? await db.missedQuestion.count({
        where: {
          userId: learnerId,
          topicId: linkedTopic.id,
          mastered: false,
        },
      })
    : await db.missedQuestion.count({
        where: {
          userId: learnerId,
          mastered: false,
          prompt: { contains: concept.title.slice(0, 24) },
        },
      });

  const intelligenceOn = isEvidenceIntelligenceEnabled();

  const evidenceSourceCounts = {
    quiz: 0,
    flashcard: 0,
    study_evaluate: 0,
    other: 0,
  };

  let evidenceSignals: LearnerConceptMasterySummary["evidenceSignals"];

  try {
    if (intelligenceOn) {
      const rows = await db.learningAttempt.findMany({
        where: { userId: learnerId, conceptId },
        select: {
          outcome: true,
          skillFacet: true,
          sourceRefJson: true,
          misconceptionSignalsJson: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: EVIDENCE_AGGREGATION_POLICY.maxAttemptsFetched,
      });

      for (const attempt of rows) {
        evidenceSourceCounts[classifySourceKind(attempt.sourceRefJson)] += 1;
      }
      evidenceSignals = aggregateEvidenceSignals(rows);
    } else {
      const attempts = await db.learningAttempt.findMany({
        where: { userId: learnerId, conceptId },
        select: { sourceRefJson: true },
        take: 200,
        orderBy: { createdAt: "desc" },
      });
      for (const attempt of attempts) {
        evidenceSourceCounts[classifySourceKind(attempt.sourceRefJson)] += 1;
      }
    }
  } catch (error) {
    console.error(
      "Learner Model attempt/evidence read failed (mastery still returned):",
      error,
    );
    if (intelligenceOn) {
      evidenceSignals = emptyEvidenceSignals();
    }
  }

  return {
    learnerId,
    conceptId,
    conceptTitle: concept.title,
    facets: mastery
      ? {
          recognize: mastery.recognize,
          explain: mastery.explain,
          apply: mastery.apply,
          solve: mastery.solve,
          perform: mastery.perform,
          retain: mastery.retain,
          confidence: mastery.confidence,
        }
      : emptyFacetScores(),
    topicMastery: topicMasteryRow
      ? {
          topicId: topicMasteryRow.topicId,
          proficiency: topicMasteryRow.proficiency,
          confidence: topicMasteryRow.confidence,
          understanding: topicMasteryRow.understanding,
          recall: topicMasteryRow.recall,
          application: topicMasteryRow.application,
        }
      : null,
    recentMissedCount,
    evidenceSourceCounts,
    reviewCount: mastery?.reviewCount ?? 0,
    lastReviewedAt: mastery?.lastReviewedAt ?? null,
    nextReviewAt: mastery?.nextReviewAt ?? null,
    ...(evidenceSignals ? { evidenceSignals } : {}),
  };
}

import { db } from "@/lib/db";
import { getLearnerConceptMastery } from "@/lib/learning/learner-model/read";
import type { LearnerConceptMasterySummary } from "@/lib/learning/types";
import type { TutorRequest } from "@/lib/learning/tutor/types";

export interface TutorResolvedContext {
  /** Only concepts verified to belong to this learner. */
  conceptIds: string[];
  conceptTitles: string[];
  subjectDomain: string | null;
  learningSpaceTitle: string | null;
  masterySummaries: LearnerConceptMasterySummary[];
  usedLearnerModel: boolean;
  usedKnowledgeModel: boolean;
  contextBlock: string;
}

/**
 * Load Learner Model + Knowledge Model context safely.
 * Does not invent Concepts when resolution is uncertain.
 */
export async function loadTutorContext(
  request: TutorRequest,
): Promise<TutorResolvedContext> {
  const requestedIds = [...new Set(request.conceptIds?.filter(Boolean) ?? [])];
  const conceptIds: string[] = [];
  const conceptTitles: string[] = [];
  const masterySummaries: LearnerConceptMasterySummary[] = [];
  let usedLearnerModel = false;
  let usedKnowledgeModel = false;
  let subjectDomain = request.subjectDomain?.trim() || null;
  let learningSpaceTitle: string | null = null;

  try {
    if (request.learningSpaceId) {
      const space = await db.learningSpace.findFirst({
        where: { id: request.learningSpaceId, userId: request.learnerId },
        select: { title: true, subjectDomain: true },
      });
      if (space) {
        learningSpaceTitle = space.title;
        subjectDomain = subjectDomain ?? space.subjectDomain;
        usedKnowledgeModel = true;
      }
    }
  } catch (error) {
    console.error("Tutor learning-space context failed:", error);
  }

  for (const conceptId of requestedIds.slice(0, 5)) {
    try {
      const concept = await db.concept.findFirst({
        where: { id: conceptId, userId: request.learnerId },
        select: { id: true, title: true, subjectDomain: true },
      });
      if (!concept) {
        // Uncertain / foreign conceptId: skip — do not invent a Concept.
        continue;
      }
      usedKnowledgeModel = true;
      conceptIds.push(concept.id);
      conceptTitles.push(concept.title);
      subjectDomain = subjectDomain ?? concept.subjectDomain;

      const mastery = await getLearnerConceptMastery(
        request.learnerId,
        concept.id,
      );
      if (mastery) {
        usedLearnerModel = true;
        masterySummaries.push(mastery);
      }
    } catch (error) {
      console.error("Tutor concept/learner context failed:", error);
    }
  }

  const masteryLines = masterySummaries.map((summary) => {
    const f = summary.facets;
    return (
      `- “${summary.conceptTitle}”: recognize ${f.recognize.toFixed(2)}, ` +
      `explain ${f.explain.toFixed(2)}, apply ${f.apply.toFixed(2)}, ` +
      `retain ${f.retain.toFixed(2)}; evidence sources quiz=${summary.evidenceSourceCounts.quiz}, ` +
      `flashcard=${summary.evidenceSourceCounts.flashcard}, ` +
      `evaluate=${summary.evidenceSourceCounts.study_evaluate}; reviews=${summary.reviewCount}`
    );
  });

  const parts = [
    learningSpaceTitle ? `Learning space: ${learningSpaceTitle}` : null,
    subjectDomain ? `Subject/domain: ${subjectDomain}` : null,
    conceptTitles.length
      ? `Known concepts: ${conceptTitles.join("; ")}`
      : null,
    masteryLines.length
      ? `Learner model (do not invent beyond this):\n${masteryLines.join("\n")}`
      : "Learner model: limited or unavailable for this turn.",
    // Bundle O — surface active activity/focus without inventing a second engine.
    request.activityId
      ? `Active activity focus: ${request.activityId}`
      : null,
    request.learningObjectId
      ? `Learning object focus: ${request.learningObjectId}`
      : null,
    request.learnerDemonstration?.trim()
      ? `Learner artifact (context only):\n${request.learnerDemonstration.trim().slice(0, 1200)}`
      : null,
    request.instructionalContext?.trim()
      ? `Instructional context:\n${request.instructionalContext.trim().slice(0, 800)}`
      : null,
    request.signal ? `Learner signal: ${request.signal}` : null,
    request.modality ? `Modality: ${request.modality}` : null,
  ].filter(Boolean);

  return {
    conceptIds,
    conceptTitles,
    subjectDomain,
    learningSpaceTitle,
    masterySummaries,
    usedLearnerModel,
    usedKnowledgeModel,
    contextBlock: parts.join("\n"),
  };
}

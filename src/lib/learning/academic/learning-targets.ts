/**
 * Phase 14 — Attach Knowledge Library / general learning targets to academic items.
 * Reuses school-lms topic bridge; never fabricates KL IDs.
 */

import { urgencyFromDueAt } from "@/lib/learning/academic/infer";
import type {
  AcademicDeadline,
  AcademicItem,
  AcademicLearningTargetRef,
} from "@/lib/learning/academic/types";
import { findKnowledgeConceptById } from "@/lib/learning/learner-state/concept-identity";
import { isGeneralTopicConceptId } from "@/lib/learning/knowledge/retrieval/general-identity";
import { resolveInstructionalKnowledge } from "@/lib/learning/knowledge/instructional-library";
import {
  matchTopicForAssignmentTitle,
  type AssignmentTopicCandidate,
} from "@/lib/learning/school-lms/assignment-concept-bridge";

/**
 * Resolve learning targets for an academic item title.
 * Prefer owned Topic.conceptId; else KL title match; never invent KL ids.
 */
export function resolveLearningTargetsForAcademicItem(input: {
  title: string;
  courseId: string;
  topics?: readonly AssignmentTopicCandidate[];
}): AcademicLearningTargetRef[] {
  const targets: AcademicLearningTargetRef[] = [];

  if (input.topics?.length) {
    const matched = matchTopicForAssignmentTitle(
      input.title,
      input.topics,
      input.courseId,
    );
    if (matched?.topic.conceptId) {
      const conceptId = matched.topic.conceptId.trim();
      const known =
        findKnowledgeConceptById(conceptId) ||
        isGeneralTopicConceptId(conceptId);
      if (known) {
        targets.push({
          conceptId,
          title: matched.topic.name,
          alignment: matched.matchKind === "exact" ? "confirmed" : "inferred",
          source: isGeneralTopicConceptId(conceptId)
            ? "general"
            : "topic-bridge",
        });
        return targets;
      }
    }
  }

  // Soft KL title resolution — only when library knows the phrase.
  const resolved = resolveInstructionalKnowledge(input.title);
  if (resolved?.matchedConcept) {
    targets.push({
      conceptId: resolved.matchedConcept.id,
      title: resolved.matchedConcept.title,
      alignment: "inferred",
      source: "knowledge-library",
    });
  }

  return targets;
}

export function attachLearningTargets(
  item: AcademicItem,
  topics?: readonly AssignmentTopicCandidate[],
): AcademicItem {
  const learningTargets = resolveLearningTargetsForAcademicItem({
    title: item.title,
    courseId: item.courseId,
    topics,
  });
  return { ...item, learningTargets };
}

export function academicDeadlinesFromItems(
  items: readonly AcademicItem[],
): AcademicDeadline[] {
  return items
    .filter((i) => i.dueAt)
    .map((i) => ({
      id: `deadline:${i.id}`,
      itemId: i.id,
      courseId: i.courseId,
      userId: i.userId,
      dueAt: i.dueAt!,
      title: i.title,
      urgency: urgencyFromDueAt(i.dueAt),
      source: i.source,
    }))
    .sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime());
}

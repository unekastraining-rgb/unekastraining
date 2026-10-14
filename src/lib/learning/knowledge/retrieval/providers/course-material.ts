/**
 * Phase 7 — Provider 2: Course / user material grounding.
 * Grounding is optional instructional support — never becomes canonical KL.
 */

import { instructionalSourceForTeaching } from "@/lib/learning/knowledge/instructional-library";
import {
  domainForGeneral,
  ensureRootGeneralConcept,
  generalConceptId,
} from "@/lib/learning/knowledge/retrieval/general-identity";
import {
  buildKnowledgeGroundingContext,
  groundingRefToSource,
} from "@/lib/learning/knowledge/retrieval/provenance";
import type {
  KnowledgeRetrievalInput,
  NormalizedLearningTarget,
  RetrievedTeachingKnowledge,
  TeachingGroundingReference,
} from "@/lib/learning/knowledge/retrieval/types";

const MIN_GROUNDING = 200;

export function retrieveFromCourseMaterial(
  target: NormalizedLearningTarget,
  input: KnowledgeRetrievalInput,
): RetrievedTeachingKnowledge | null {
  const instructional = instructionalSourceForTeaching(input.groundingText ?? null);
  if (!instructional || instructional.length < MIN_GROUNDING) return null;

  const grounding: TeachingGroundingReference[] = [
    {
      kind: input.materialId ? "course-material" : "uploaded-text",
      label: input.materialTitle ?? input.courseTitle ?? "Course material",
      excerpt: instructional.slice(0, 400),
      materialId: input.materialId ?? undefined,
      courseId: input.courseId ?? undefined,
    },
  ];

  const courseSources = grounding.map(groundingRefToSource);
  const root = ensureRootGeneralConcept(target);
  const excerptConcept = {
    id: generalConceptId(target.slug, "from-material"),
    title: `${target.normalizedTitle} (from your materials)`,
    explanation: instructional.slice(0, 900),
    examples: [],
    misconceptions: [],
    vocabulary: [],
  };

  return {
    target,
    sourceKind: "course-material",
    title: target.normalizedTitle,
    subject: target.subject,
    domain: domainForGeneral(target),
    concepts: [
      {
        ...root,
        explanation: `Using your course materials to teach ${target.normalizedTitle}.`,
      },
      excerptConcept,
    ],
    pathConceptIds: [root.id, excerptConcept.id],
    grounding,
    sources: courseSources,
    groundingContext: buildKnowledgeGroundingContext({
      courseMaterials: courseSources,
    }),
    confidence: "medium",
    sourceSummary: "Instructional grounding from learner course/uploaded material.",
    limitations: [
      "Derived from learner materials — not Study Haul Knowledge Library canonical knowledge.",
    ],
  };
}

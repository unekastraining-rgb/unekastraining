/**
 * Bundle D — Focus a multi-concept teach path onto the current concept for the lesson.
 * Full path remains available for Orchestrator / progression metadata.
 */

import type { TeachingKnowledgeContext } from "@/lib/learning/knowledge/teaching-knowledge-context";
import type { TeachScope } from "@/lib/learning/teach/scope";
import {
  formatTeachingDepthPromptBlock,
  teachingDepthSectionsForScope,
  type TeachingProgressionView,
} from "@/lib/learning/teach/depth";
import type { DynamicLearningPath } from "@/lib/learning/knowledge/retrieval/dynamic-paths";

/**
 * Build a lesson-scoped context containing only the focus concept.
 * Preserves pack/provenance; does not shrink the orchestration path.
 */
export function focusTeachingContextForLesson(
  pathContext: TeachingKnowledgeContext,
  focusConceptId: string | null | undefined,
): TeachingKnowledgeContext {
  if (!focusConceptId || pathContext.concepts.length <= 1) {
    return pathContext;
  }
  const focus =
    pathContext.concepts.find((c) => c.id === focusConceptId) ??
    pathContext.primaryConcept ??
    pathContext.concepts[0];
  if (!focus) return pathContext;
  return {
    ...pathContext,
    concepts: [focus],
    primaryConcept: focus,
    // Keep learning-path resolution so consumers know a path exists;
    // lesson adapter uses the single focused concept.
    resolution:
      pathContext.concepts.length > 1
        ? "learning-path"
        : pathContext.resolution,
  };
}

export function buildTeachingProgressionView(input: {
  path: DynamicLearningPath | null;
  pathContext: TeachingKnowledgeContext;
  scope: TeachScope;
  focusConceptId: string | null | undefined;
  nextConceptId?: string | null;
}): TeachingProgressionView {
  const concepts =
    input.path?.concepts.map((c) => ({
      id: c.conceptId,
      title: c.title,
    })) ??
    input.pathContext.concepts.map((c) => ({ id: c.id, title: c.title }));

  let currentIndex = 0;
  if (input.focusConceptId) {
    const idx = concepts.findIndex((c) => c.id === input.focusConceptId);
    if (idx >= 0) currentIndex = idx;
  } else if (input.path) {
    currentIndex = input.path.currentIndex;
  }

  const current = concepts[currentIndex] ?? null;
  const nextId =
    input.nextConceptId ??
    concepts[currentIndex + 1]?.id ??
    null;
  const next = nextId
    ? concepts.find((c) => c.id === nextId) ?? null
    : concepts[currentIndex + 1] ?? null;

  return {
    pathId:
      input.path?.id ??
      input.pathContext.learningPathId ??
      `teach:${input.pathContext.target}`,
    pathTitle:
      input.path?.title ??
      input.pathContext.pack?.displayTitle ??
      input.pathContext.target,
    scope: input.scope,
    currentIndex,
    total: concepts.length,
    currentConceptId: current?.id ?? null,
    currentConceptTitle: current?.title ?? null,
    nextConceptId: next?.id ?? null,
    nextConceptTitle: next?.title ?? null,
    conceptTitles: concepts.map((c) => c.title),
    conceptIds: concepts.map((c) => c.id),
    depthSections: teachingDepthSectionsForScope(input.scope),
  };
}

export function teachingDepthBlockFromProgression(
  progression: TeachingProgressionView,
  options?: { reteach?: boolean },
): string {
  return formatTeachingDepthPromptBlock({
    scope: progression.scope,
    pathTitle: progression.pathTitle,
    currentConceptTitle:
      progression.currentConceptTitle ?? progression.pathTitle,
    conceptIndex: progression.currentIndex,
    conceptTotal: Math.max(1, progression.total),
    nextConceptTitle: progression.nextConceptTitle,
    reteach: options?.reteach,
  });
}

/**
 * Resolve which concept the lesson should teach given Orchestrator decision.
 */
export function resolveTeachFocusConceptId(input: {
  pathContext: TeachingKnowledgeContext;
  action?: string | null;
  conceptId?: string | null;
  nextConceptId?: string | null;
}): string | null {
  if (input.action === "advance" && input.nextConceptId) {
    return input.nextConceptId;
  }
  if (input.conceptId) return input.conceptId;
  return (
    input.pathContext.primaryConcept?.id ??
    input.pathContext.concepts[0]?.id ??
    null
  );
}

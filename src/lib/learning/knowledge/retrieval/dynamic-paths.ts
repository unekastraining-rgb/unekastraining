/**
 * Phase 11 — Dynamic Learning Paths for retrieved/general topics.
 * Canonical Knowledge Library paths remain preferred and untouched.
 * Dynamic paths are session-scoped and never auto-promoted to KL.
 */

import type { TeachingKnowledgeContext } from "@/lib/learning/knowledge/teaching-knowledge-context";
import {
  matchKnowledgeLearningPath,
  resolveTeachingKnowledgeContext,
} from "@/lib/learning/knowledge/teaching-knowledge-context";
import {
  isGeneralTopicConceptId,
  registerGeneralTeachingContext,
} from "@/lib/learning/knowledge/retrieval/general-identity";
import type { KnowledgeSourceKind } from "@/lib/learning/knowledge/retrieval/types";

export type DynamicLearningPathConcept = {
  conceptId: string;
  title: string;
  order: number;
  prerequisites?: string[];
};

export type DynamicLearningPath = {
  id: string;
  title: string;
  source: KnowledgeSourceKind | "retrieved" | "knowledge-library";
  concepts: DynamicLearningPathConcept[];
  currentIndex: number;
  /** True when derived from registered KL path. */
  canonical: boolean;
};

const SESSION_PATHS = new Map<string, DynamicLearningPath>();

/** Reject fabricated IDs that look like KL packs but aren't registered general/KL. */
export function isSafePathConceptId(
  conceptId: string,
  allowedIds: ReadonlySet<string>,
): boolean {
  const id = conceptId.trim();
  if (!id) return false;
  if (allowedIds.has(id)) return true;
  // Never invent bare KL-looking ids outside the allowed set.
  if (isGeneralTopicConceptId(id)) return allowedIds.has(id);
  return false;
}

/**
 * Build a path from TeachingKnowledgeContext.
 * KL learning-path → canonical.
 * general-retrieval → dynamic session path.
 */
export function learningPathFromTeachingContext(
  ctx: TeachingKnowledgeContext,
  options?: { currentConceptId?: string | null },
): DynamicLearningPath | null {
  if (!ctx.concepts.length) return null;

  const klPath = matchKnowledgeLearningPath(ctx.target);
  const fromLibrary = ctx.source === "knowledge-library";
  const canonical =
    fromLibrary &&
    (ctx.resolution === "learning-path" || Boolean(klPath));

  const concepts: DynamicLearningPathConcept[] = ctx.concepts.map((c, i) => ({
    conceptId: c.id,
    title: c.title,
    order: i,
    prerequisites: c.prerequisites,
  }));

  // Validate: every concept id must be in the context (no fabrication).
  const allowed = new Set(ctx.concepts.map((c) => c.id));
  for (const c of concepts) {
    if (!isSafePathConceptId(c.conceptId, allowed)) {
      return null;
    }
  }

  let currentIndex = 0;
  if (options?.currentConceptId) {
    const idx = concepts.findIndex((c) => c.conceptId === options.currentConceptId);
    if (idx >= 0) currentIndex = idx;
  }

  const path: DynamicLearningPath = {
    id:
      ctx.learningPathId ??
      (fromLibrary
        ? klPath?.id ?? `kl:${ctx.pack?.id ?? ctx.primaryConcept?.id ?? "concept"}`
        : `dynamic:${ctx.target.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60)}`),
    title: ctx.pack?.displayTitle ?? ctx.target,
    source: fromLibrary
      ? "knowledge-library"
      : ctx.knowledgeSourceKind ??
        (ctx.source === "combined"
          ? "combined"
          : ctx.source === "general-ai"
            ? "general-ai"
            : "retrieved"),
    concepts,
    currentIndex,
    canonical: fromLibrary,
  };

  if (!fromLibrary) {
    SESSION_PATHS.set(path.id, path);
    // Keep general registry warm for evidence continuation.
    registerGeneralTeachingContext(ctx, path.id.replace(/^dynamic:/, ""));
  }

  return path;
}

export function getSessionDynamicPath(pathId: string): DynamicLearningPath | null {
  return SESSION_PATHS.get(pathId) ?? null;
}

export function resetDynamicPathsForTests(): void {
  SESSION_PATHS.clear();
}

/** Next validated concept id, or null (never fabricate). */
export function nextConceptOnPath(
  path: DynamicLearningPath,
): string | null {
  const next = path.concepts[path.currentIndex + 1];
  return next?.conceptId ?? null;
}

/**
 * Prefer canonical KL path when the target matches a registered path or KL pack.
 * Dynamic generation must not replace KL.
 */
export function preferCanonicalPathTarget(target: string): boolean {
  if (matchKnowledgeLearningPath(target) != null) return true;
  return resolveTeachingKnowledgeContext(target) != null;
}

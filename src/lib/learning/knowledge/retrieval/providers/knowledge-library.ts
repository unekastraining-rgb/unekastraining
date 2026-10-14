/**
 * Phase 7 — Provider 1: Knowledge Library (highest confidence).
 */

import { buildKnowledgeGroundingContext } from "@/lib/learning/knowledge/retrieval/provenance";
import { resolveTeachingKnowledgeContext } from "@/lib/learning/knowledge/teaching-knowledge-context";
import type { NormalizedLearningTarget } from "@/lib/learning/knowledge/retrieval/types";
import type { RetrievedTeachingKnowledge } from "@/lib/learning/knowledge/retrieval/types";

export function retrieveFromKnowledgeLibrary(
  target: NormalizedLearningTarget,
): RetrievedTeachingKnowledge | null {
  // Prefer exact/normalized title; also try original phrasing.
  const ctx =
    resolveTeachingKnowledgeContext(target.normalizedTitle) ??
    resolveTeachingKnowledgeContext(target.original);
  if (!ctx || ctx.source !== "knowledge-library") return null;
  if (ctx.concepts.length === 0) return null;

  const pathConceptIds =
    ctx.resolution === "learning-path"
      ? ctx.concepts.map((c) => c.id)
      : ctx.resolution === "single-concept" && ctx.primaryConcept
        ? [ctx.primaryConcept.id]
        : undefined;

  const canonical = {
    kind: "knowledge-library" as const,
    id: ctx.primaryConcept?.id ?? ctx.pack?.id,
    title:
      ctx.primaryConcept?.title ??
      ctx.pack?.displayTitle ??
      target.normalizedTitle,
    confidence: "high" as const,
    provider: "knowledge-library",
  };

  return {
    target,
    sourceKind: "knowledge-library",
    title: canonical.title ?? target.normalizedTitle,
    subject: ctx.subject ?? target.subject,
    domain: ctx.domain,
    concepts: ctx.concepts,
    pathConceptIds,
    sources: [canonical],
    groundingContext: buildKnowledgeGroundingContext({ canonical }),
    confidence: "high",
    sourceSummary: "Structured Knowledge Library concept(s).",
  };
}

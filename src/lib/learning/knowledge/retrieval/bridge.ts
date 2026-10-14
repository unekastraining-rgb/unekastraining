/**
 * Phase 7 — Bridge RetrievedTeachingKnowledge → TeachingKnowledgeContext.
 */

import type {
  InstructionalConceptKnowledge,
  InstructionalKnowledgePack,
} from "@/lib/learning/knowledge/instructional-library";
import type { TeachingKnowledgeContext } from "@/lib/learning/knowledge/teaching-knowledge-context";
import {
  domainForGeneral,
  generalConceptId,
  generalRootConceptId,
  registerGeneralTeachingContext,
} from "@/lib/learning/knowledge/retrieval/general-identity";
import type {
  GeneralTeachingKnowledge,
  RetrievedTeachingKnowledge,
} from "@/lib/learning/knowledge/retrieval/types";
import { resolveTeachingKnowledgeContext } from "@/lib/learning/knowledge/teaching-knowledge-context";

function mapGeneralConcepts(
  knowledge: GeneralTeachingKnowledge,
  topicSlug: string,
): InstructionalConceptKnowledge[] {
  const seq =
    knowledge.suggestedSequence && knowledge.suggestedSequence.length > 0
      ? knowledge.suggestedSequence
      : knowledge.concepts.map((c) => c.id);

  const byLocal = new Map(
    knowledge.concepts.map((c) => [c.id.toLowerCase(), c] as const),
  );

  const ordered: InstructionalConceptKnowledge[] = [];
  const seen = new Set<string>();

  for (const localId of seq) {
    const raw =
      byLocal.get(localId.toLowerCase()) ??
      knowledge.concepts.find(
        (c) => c.title.toLowerCase() === localId.toLowerCase(),
      );
    if (!raw) continue;
    const id = generalConceptId(topicSlug, raw.id || raw.title);
    if (seen.has(id)) continue;
    seen.add(id);
    ordered.push({
      id,
      title: raw.title,
      explanation: raw.explanation,
      examples: raw.examples,
      example: raw.examples?.[0],
      misconceptions: raw.misconceptions,
      misconception: raw.misconceptions?.[0],
      relatedConcepts: raw.relatedConcepts,
      vocabulary: raw.vocabulary,
      prerequisites: raw.prerequisites,
      practiceForms: raw.practiceIdeas,
      checkPrompt: raw.recallPrompts?.[0],
      difficulty: 2,
    });
  }

  // Include any concepts missing from suggestedSequence.
  for (const raw of knowledge.concepts) {
    const id = generalConceptId(topicSlug, raw.id || raw.title);
    if (seen.has(id)) continue;
    seen.add(id);
    ordered.push({
      id,
      title: raw.title,
      explanation: raw.explanation,
      examples: raw.examples,
      example: raw.examples?.[0],
      misconceptions: raw.misconceptions,
      misconception: raw.misconceptions?.[0],
      vocabulary: raw.vocabulary,
      prerequisites: raw.prerequisites,
      difficulty: 2,
    });
  }

  return ordered;
}

export function teachingContextFromRetrieved(
  retrieved: RetrievedTeachingKnowledge,
): TeachingKnowledgeContext {
  // Canonical KL — reuse existing resolver so behavior stays identical.
  if (retrieved.sourceKind === "knowledge-library") {
    const existing =
      resolveTeachingKnowledgeContext(retrieved.target.normalizedTitle) ??
      resolveTeachingKnowledgeContext(retrieved.target.original);
    if (existing) return existing;
  }

  const concepts = retrieved.concepts;
  const pathIds = retrieved.pathConceptIds?.filter((id) =>
    concepts.some((c) => c.id === id),
  );
  const ordered =
    pathIds && pathIds.length > 0
      ? pathIds
          .map((id) => concepts.find((c) => c.id === id)!)
          .filter(Boolean)
      : concepts;

  const ephemeralPack: InstructionalKnowledgePack | null =
    retrieved.sourceKind === "knowledge-library"
      ? null
      : {
          id: `retrieval:${retrieved.target.slug}`,
          match: [],
          domain: retrieved.domain ?? domainForGeneral(retrieved.target),
          subject: retrieved.subject,
          displayTitle: retrieved.title,
          learningFrame: `You're learning ${retrieved.title}.`,
          cheatSheet: ordered.map((c) => c.title).join(" → "),
          concepts: ordered,
        };

  const source =
    retrieved.sourceKind === "general-ai"
      ? "general-ai"
      : retrieved.sourceKind === "course-material"
        ? "course-material"
        : retrieved.sourceKind === "user-note"
          ? "user-note"
          : retrieved.sourceKind === "retrieved-web"
            ? "retrieved-web"
            : retrieved.sourceKind === "combined"
              ? "combined"
              : "knowledge-library";

  // Preserve layered KL assembly + pack identity for canonical hits.
  if (source === "knowledge-library") {
    const kl =
      resolveTeachingKnowledgeContext(retrieved.target.normalizedTitle) ??
      resolveTeachingKnowledgeContext(retrieved.target.original);
    if (kl) {
      return {
        ...kl,
        grounding: retrieved.grounding ?? kl.grounding,
        sources: retrieved.sources ?? kl.sources,
        groundingContext: retrieved.groundingContext ?? kl.groundingContext,
        externalSnippets: retrieved.externalSnippets ?? kl.externalSnippets,
        limitations: retrieved.limitations ?? kl.limitations,
        sourceSummary: retrieved.sourceSummary ?? kl.sourceSummary,
        knowledgeSourceKind: retrieved.sourceKind,
        confidence: retrieved.confidence ?? kl.confidence,
      };
    }
  }

  const ctx: TeachingKnowledgeContext = {
    target: retrieved.target.normalizedTitle,
    domain: retrieved.domain ?? domainForGeneral(retrieved.target),
    subject: retrieved.subject ?? null,
    pack: ephemeralPack,
    concepts: ordered,
    primaryConcept: ordered[0] ?? null,
    source,
    resolution:
      ordered.length > 1 ? "general-retrieval" : "single-concept",
    learningPathId:
      ordered.length > 1 ? `general-path:${retrieved.target.slug}` : undefined,
    knowledgeSourceKind: retrieved.sourceKind,
    confidence: retrieved.confidence,
    grounding: retrieved.grounding,
    sources: retrieved.sources,
    groundingContext: retrieved.groundingContext,
    externalSnippets: retrieved.externalSnippets,
    limitations: retrieved.limitations,
    sourceSummary: retrieved.sourceSummary,
  };

  if (source !== "knowledge-library") {
    registerGeneralTeachingContext(ctx, retrieved.target.slug);
  }

  return ctx;
}

export function retrievedFromGeneralKnowledge(
  target: RetrievedTeachingKnowledge["target"],
  knowledge: GeneralTeachingKnowledge,
  options?: {
    grounding?: RetrievedTeachingKnowledge["grounding"];
    sourceKind?: "general-ai" | "combined";
    sources?: RetrievedTeachingKnowledge["sources"];
    groundingContext?: RetrievedTeachingKnowledge["groundingContext"];
    externalSnippets?: RetrievedTeachingKnowledge["externalSnippets"];
  },
): RetrievedTeachingKnowledge {
  const concepts = mapGeneralConcepts(knowledge, target.slug);
  // Ensure at least root exists when AI returns a single cluster.
  if (concepts.length === 0) {
    concepts.push({
      id: generalRootConceptId(target.slug),
      title: target.normalizedTitle,
      explanation: knowledge.summary,
    });
  }

  return {
    target,
    sourceKind: options?.sourceKind ?? "general-ai",
    title: knowledge.targetTitle || target.normalizedTitle,
    subject: knowledge.subject ?? target.subject,
    domain: (knowledge.domain as RetrievedTeachingKnowledge["domain"]) ?? target.domain,
    concepts,
    pathConceptIds: concepts.map((c) => c.id),
    grounding: options?.grounding,
    sources: options?.sources,
    groundingContext: options?.groundingContext,
    externalSnippets: options?.externalSnippets,
    confidence: options?.grounding?.length ? "medium" : "medium",
    sourceSummary:
      options?.sourceKind === "combined"
        ? "General instructional knowledge with learner material grounding."
        : "AI-generated general instructional knowledge (not Knowledge Library; not web retrieval).",
    limitations: [
      ...(knowledge.limitations ?? []),
      "Not canonical Knowledge Library content.",
      "Not web-retrieved unless retrieved-web sources are attached separately.",
    ],
  };
}

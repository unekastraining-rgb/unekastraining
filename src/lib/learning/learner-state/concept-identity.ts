/**
 * Phase 4A — Knowledge Library concept identity for learner evidence.
 *
 * Evidence conceptId must be a real Knowledge Library concept OR a
 * Phase 7 general-topic identity (`general:…`).
 * Never fabricate arbitrary IDs for unknown topics.
 */

import type {
  InstructionalConceptKnowledge,
  InstructionalDomain,
} from "@/lib/learning/knowledge/instructional-library";
import {
  findInstructionalConceptById,
  resolveInstructionalKnowledge,
} from "@/lib/learning/knowledge/instructional-library";
import {
  findGeneralConceptById,
  getRegisteredGeneralTeachingContext,
  isGeneralTopicConceptId,
} from "@/lib/learning/knowledge/retrieval/general-identity";
import { normalizeLearningTarget } from "@/lib/learning/knowledge/retrieval/normalize-target";
import {
  matchKnowledgeLearningPath,
  resolveTeachingKnowledgeContext,
  type TeachingKnowledgeContext,
} from "@/lib/learning/knowledge/teaching-knowledge-context";

export type ResolvedKnowledgeConceptRef = {
  conceptId: string;
  domain: InstructionalDomain;
  subject: string | null;
  packId: string;
  concept: InstructionalConceptKnowledge;
};

/** Look up a Knowledge Library or registered general concept by stable id. */
export function findKnowledgeConceptById(
  conceptId: string,
): ResolvedKnowledgeConceptRef | null {
  const hit = findInstructionalConceptById(conceptId);
  if (hit) {
    return {
      conceptId: hit.concept.id,
      domain: hit.pack.domain,
      subject: hit.pack.subject ?? null,
      packId: hit.pack.id,
      concept: hit.concept,
    };
  }

  const general = findGeneralConceptById(conceptId);
  if (!general) return null;
  return {
    conceptId: general.id,
    domain: "general",
    subject: null,
    packId: "general-retrieval",
    concept: general,
  };
}

/**
 * True when conceptId is a registered Knowledge Library concept
 * OR a well-formed Phase 7 general-topic identity.
 */
export function isRegisteredKnowledgeConceptId(conceptId: string): boolean {
  if (findInstructionalConceptById(conceptId)) return true;
  return isGeneralTopicConceptId(conceptId);
}

/**
 * Resolve which concept IDs an activity should attach to.
 *
 * - Single-concept targets → that concept only (not the whole pack).
 * - Explicit learning paths / general sequences → ordered concept ids.
 * - Unknown topics with no retrieval context → empty (stay unmapped).
 */
export function resolveEvidenceConceptIds(
  target: string,
): ResolvedKnowledgeConceptRef[] {
  const clean = target.trim();
  if (!clean) return [];

  const ctx =
    resolveTeachingKnowledgeContext(clean) ??
    (() => {
      const n = normalizeLearningTarget(clean);
      if (!n) return null;
      return (
        getRegisteredGeneralTeachingContext(n.slug) ??
        getRegisteredGeneralTeachingContext(n.normalizedTitle)
      );
    })();
  if (!ctx) return [];

  return conceptRefsFromTeachingContext(ctx);
}

export function conceptRefsFromTeachingContext(
  ctx: TeachingKnowledgeContext,
): ResolvedKnowledgeConceptRef[] {
  const packId = ctx.pack?.id ?? "general-retrieval";

  if (
    (ctx.resolution === "learning-path" ||
      ctx.resolution === "general-retrieval") &&
    ctx.concepts.length > 0
  ) {
    const path = matchKnowledgeLearningPath(ctx.target);
    const orderedIds =
      path?.conceptIds ?? ctx.concepts.map((c) => c.id);
    const refs: ResolvedKnowledgeConceptRef[] = [];
    for (const id of orderedIds) {
      const concept =
        ctx.concepts.find((c) => c.id === id) ??
        findKnowledgeConceptById(id)?.concept;
      if (!concept) continue;
      refs.push({
        conceptId: concept.id,
        domain: ctx.domain,
        subject: ctx.subject,
        packId,
        concept,
      });
    }
    return refs;
  }

  if (ctx.resolution === "single-concept" && ctx.primaryConcept) {
    return [
      {
        conceptId: ctx.primaryConcept.id,
        domain: ctx.domain,
        subject: ctx.subject,
        packId,
        concept: ctx.primaryConcept,
      },
    ];
  }

  // Pack-level resolution without an explicit path: expose primary only
  // so evidence does not blanket every concept in the pack.
  if (ctx.primaryConcept) {
    return [
      {
        conceptId: ctx.primaryConcept.id,
        domain: ctx.domain,
        subject: ctx.subject,
        packId,
        concept: ctx.primaryConcept,
      },
    ];
  }

  return [];
}

/**
 * Resolve a free-text topic to knowledge refs for evaluate / practice surfaces.
 * Returns [] when neither KL nor registered general retrieval knows the topic.
 */
export function resolveEvidenceConceptsForTopic(
  topic: string | null | undefined,
): ResolvedKnowledgeConceptRef[] {
  if (!topic?.trim()) return [];
  const fromTeaching = resolveEvidenceConceptIds(topic);
  if (fromTeaching.length > 0) return fromTeaching;

  // Fallback: raw instructional resolve (same library; no fabrication).
  const resolved = resolveInstructionalKnowledge(topic);
  if (!resolved?.matchedConcept) return [];
  return [
    {
      conceptId: resolved.matchedConcept.id,
      domain: resolved.domain,
      subject: resolved.subject,
      packId: resolved.pack.id,
      concept: resolved.matchedConcept,
    },
  ];
}

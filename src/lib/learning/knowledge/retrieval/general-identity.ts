/**
 * Phase 7 — General-topic concept identity (namespace-isolated from KL).
 *
 * Pattern: general:{topic-slug} or general:{topic-slug}:{concept-slug}
 * Never collides with canonical Knowledge Library ids (no general: prefix there).
 * Never silently becomes a Knowledge Library pack concept.
 */

import type {
  InstructionalConceptKnowledge,
  InstructionalDomain,
} from "@/lib/learning/knowledge/instructional-library";
import type { TeachingKnowledgeContext } from "@/lib/learning/knowledge/teaching-knowledge-context";
import type { NormalizedLearningTarget } from "@/lib/learning/knowledge/retrieval/types";

const GENERAL_ID_RE =
  /^general:[a-z0-9]+(?:-[a-z0-9]+)*(?::[a-z0-9]+(?:-[a-z0-9]+)*)*$/;

/** In-memory registry of retrieved general teaching contexts (session/process). */
const GENERAL_CONTEXT_BY_SLUG = new Map<string, TeachingKnowledgeContext>();
const GENERAL_CONCEPT_BY_ID = new Map<string, InstructionalConceptKnowledge>();

export function isGeneralTopicConceptId(conceptId: string): boolean {
  return GENERAL_ID_RE.test(conceptId.trim());
}

export function generalRootConceptId(slug: string): string {
  return `general:${slug}`;
}

export function generalConceptId(topicSlug: string, conceptSlug: string): string {
  const c = conceptSlug
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `general:${topicSlug}:${c || "concept"}`;
}

export function titleFromGeneralConceptId(conceptId: string): string {
  const rest = conceptId.replace(/^general:/, "");
  const part = rest.includes(":") ? rest.split(":").pop()! : rest;
  return part
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function registerGeneralTeachingContext(
  ctx: TeachingKnowledgeContext,
  slug: string,
): void {
  GENERAL_CONTEXT_BY_SLUG.set(slug, ctx);
  for (const concept of ctx.concepts) {
    if (isGeneralTopicConceptId(concept.id)) {
      GENERAL_CONCEPT_BY_ID.set(concept.id, concept);
    }
  }
}

export function getRegisteredGeneralTeachingContext(
  slugOrTarget: string,
): TeachingKnowledgeContext | null {
  const key = slugOrTarget.trim().toLowerCase();
  if (GENERAL_CONTEXT_BY_SLUG.has(key)) {
    return GENERAL_CONTEXT_BY_SLUG.get(key)!;
  }
  // Also try slugified form
  for (const [slug, ctx] of GENERAL_CONTEXT_BY_SLUG) {
    if (ctx.target.toLowerCase() === key || slug === key) return ctx;
  }
  return null;
}

export function findGeneralConceptById(
  conceptId: string,
): InstructionalConceptKnowledge | null {
  const clean = conceptId.trim();
  if (!isGeneralTopicConceptId(clean)) return null;
  const hit = GENERAL_CONCEPT_BY_ID.get(clean);
  if (hit) return hit;
  // Deterministic shell so evidence/orchestration can continue after restart.
  return {
    id: clean,
    title: titleFromGeneralConceptId(clean),
    explanation: `Learning target: ${titleFromGeneralConceptId(clean)}.`,
  };
}

/** Test helper — clear general registry. */
export function resetGeneralTeachingRegistryForTests(): void {
  GENERAL_CONTEXT_BY_SLUG.clear();
  GENERAL_CONCEPT_BY_ID.clear();
}

export function ensureRootGeneralConcept(
  target: NormalizedLearningTarget,
): InstructionalConceptKnowledge {
  const id = generalRootConceptId(target.slug);
  const existing = GENERAL_CONCEPT_BY_ID.get(id);
  if (existing) return existing;
  const concept: InstructionalConceptKnowledge = {
    id,
    title: target.normalizedTitle,
    explanation: `Introductory teaching knowledge for ${target.normalizedTitle}.`,
    difficulty: 1,
  };
  GENERAL_CONCEPT_BY_ID.set(id, concept);
  return concept;
}

export function domainForGeneral(
  target: NormalizedLearningTarget,
): InstructionalDomain {
  return target.domain ?? "general";
}

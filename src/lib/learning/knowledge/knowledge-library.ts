/**
 * Knowledge Library foundation (Phase 3A).
 *
 * Architecture:
 *   Knowledge Library
 *       ↓
 *   Knowledge Pack
 *       ↓
 *   Knowledge Concept(s)
 *       ↓
 *   Teaching Engine (lessonFromInstructionalPack / six-worked-lesson)
 *       ↓
 *   Lesson
 *
 * The library STORES and RESOLVES knowledge.
 * It does NOT generate lessons and does NOT invent knowledge for unknown targets.
 *
 * Existing pack registration (`registerInstructionalPack`) remains the
 * compatibility path; this module is the explicit architectural surface.
 */

import type {
  InstructionalConceptKnowledge,
  InstructionalDomain,
  InstructionalKnowledgePack,
  ResolvedInstructionalKnowledge,
} from "@/lib/learning/knowledge/instructional-library";
import {
  getInstructionalConcept,
  getInstructionalPackById,
  listInstructionalPacks,
  registerInstructionalPack,
  resolveInstructionalKnowledge,
} from "@/lib/learning/knowledge/instructional-library";

/** Broad knowledge domain (same vocabulary as instructional packs). */
export type KnowledgeDomain = InstructionalDomain;

/** A specific concept inside a subject/domain. */
export type KnowledgeConcept = InstructionalConceptKnowledge;

/** A grouped collection of related knowledge concepts. */
export type KnowledgePack = InstructionalKnowledgePack;

/** Structured resolution — knowledge only, never a lesson. */
export type ResolvedKnowledge = ResolvedInstructionalKnowledge;

/** Register a pack into the in-code Knowledge Library registry. */
export function registerKnowledgePack(pack: KnowledgePack): void {
  registerInstructionalPack(pack);
}

/** List all registered knowledge packs. */
export function listKnowledgePacks(): readonly KnowledgePack[] {
  return listInstructionalPacks();
}

/** Retrieve a pack by id, or null. */
export function getKnowledgePack(packId: string): KnowledgePack | null {
  return getInstructionalPackById(packId);
}

/** Retrieve a concept within a pack, or null. */
export function getKnowledgeConcept(
  packId: string,
  conceptId: string,
): KnowledgeConcept | null {
  return getInstructionalConcept(packId, conceptId);
}

/**
 * Resolve structured knowledge for a learning target.
 * Returns null when the library does not know the target.
 * Never fabricates a pack from domain proximity.
 */
export function resolveKnowledge(target: string): ResolvedKnowledge | null {
  return resolveInstructionalKnowledge(target);
}

/**
 * True when the library has registered knowledge for the target.
 * Distinct from lesson generation.
 */
export function hasKnowledgeForTarget(target: string): boolean {
  return resolveKnowledge(target) !== null;
}

export {
  resolveTeachingKnowledgeContext,
  formatKnowledgeLibraryPromptBlock,
  lessonFromTeachingKnowledgeContext,
  type TeachingKnowledgeContext,
  type AssembledTeachingSlice,
} from "@/lib/learning/knowledge/teaching-knowledge-context";
export {
  assembleTeachingKnowledge,
  orderedConceptsFromAssembly,
} from "@/lib/learning/knowledge/assemble-teaching-knowledge";
export {
  reportConceptCoverage,
  reportPackCoverage,
  reportLibraryCoverage,
  isConceptTeachable,
} from "@/lib/learning/knowledge/coverage";
export type {
  InstructionalRelationship,
  InstructionalMisconception,
  InstructionalCompletenessState,
  CurriculumMappingStub,
} from "@/lib/learning/knowledge/concept-profile";
export {
  KNOWLEDGE_LEARNING_PATHS,
  matchKnowledgeLearningPath,
} from "@/lib/learning/knowledge/learning-paths";

import type { ConceptRelationshipType } from "@/generated/prisma";

export const CONCEPT_RELATIONSHIP_TYPES = [
  "PREREQUISITE",
  "RELATED",
  "CONFUSABLE_WITH",
  "PART_OF",
] as const satisfies readonly ConceptRelationshipType[];

export type ConceptRelationshipTypeName =
  (typeof CONCEPT_RELATIONSHIP_TYPES)[number];

/** Symmetric types: stored once with a canonical endpoint order. */
export const SYMMETRIC_CONCEPT_RELATIONSHIP_TYPES = [
  "RELATED",
  "CONFUSABLE_WITH",
] as const satisfies readonly ConceptRelationshipTypeName[];

export type SymmetricConceptRelationshipType =
  (typeof SYMMETRIC_CONCEPT_RELATIONSHIP_TYPES)[number];

/** Suggested provenance labels (string, not a Prisma enum). */
export const CONCEPT_RELATIONSHIP_SOURCE_TYPES = [
  "MANUAL",
  "CORE_EXTRACT",
  "AI",
  "TOPIC",
  "IMPORT",
  "SYSTEM",
] as const;

export type ConceptRelationshipSourceType =
  (typeof CONCEPT_RELATIONSHIP_SOURCE_TYPES)[number];

export function isConceptRelationshipType(
  value: string,
): value is ConceptRelationshipTypeName {
  return (CONCEPT_RELATIONSHIP_TYPES as readonly string[]).includes(value);
}

export function isSymmetricConceptRelationshipType(
  type: ConceptRelationshipTypeName,
): type is SymmetricConceptRelationshipType {
  return (SYMMETRIC_CONCEPT_RELATIONSHIP_TYPES as readonly string[]).includes(
    type,
  );
}

/**
 * Normalize endpoint order for symmetric types so A RELATED B and B RELATED A
 * map to the same unique row (lexicographic from/to).
 */
export function normalizeConceptRelationshipEndpoints(
  type: ConceptRelationshipTypeName,
  fromConceptId: string,
  toConceptId: string,
): { fromConceptId: string; toConceptId: string } {
  if (!isSymmetricConceptRelationshipType(type)) {
    return { fromConceptId, toConceptId };
  }
  if (fromConceptId <= toConceptId) {
    return { fromConceptId, toConceptId };
  }
  return { fromConceptId: toConceptId, toConceptId: fromConceptId };
}

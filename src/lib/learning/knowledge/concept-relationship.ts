import type { ConceptRelationship, Prisma } from "@/generated/prisma";

import { db } from "@/lib/db";
import { isConceptRelationshipsEnabled } from "@/lib/learning/knowledge/concept-relationship-flag";
import {
  isConceptRelationshipType,
  normalizeConceptRelationshipEndpoints,
  type ConceptRelationshipTypeName,
} from "@/lib/learning/knowledge/concept-relationship-types";

export class ConceptRelationshipError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConceptRelationshipError";
  }
}

export type CreateConceptRelationshipInput = {
  userId: string;
  fromConceptId: string;
  toConceptId: string;
  type: ConceptRelationshipTypeName | string;
  confidence?: number | null;
  sourceType?: string | null;
  sourceId?: string | null;
  metadata?: Record<string, unknown> | null;
};

async function requireOwnedConcept(userId: string, conceptId: string) {
  const concept = await db.concept.findFirst({
    where: { id: conceptId, userId },
    select: {
      id: true,
      userId: true,
      learningSpaceId: true,
      metadataJson: true,
    },
  });
  if (!concept) {
    throw new ConceptRelationshipError(
      `Concept not found or not owned by user: ${conceptId}`,
    );
  }
  return concept;
}

function assertValidConfidence(confidence: number | null | undefined) {
  if (confidence == null) return;
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
    throw new ConceptRelationshipError(
      "confidence must be a number between 0 and 1 (inclusive).",
    );
  }
}

/**
 * Create a user-owned Concept↔Concept relationship.
 * Honors STUDY_HAUL_CONCEPT_RELATIONSHIPS; rejects self-edges and cross-user Concepts.
 */
export async function createConceptRelationship(
  input: CreateConceptRelationshipInput,
): Promise<ConceptRelationship> {
  if (!isConceptRelationshipsEnabled()) {
    throw new ConceptRelationshipError(
      "Concept relationships are disabled (STUDY_HAUL_CONCEPT_RELATIONSHIPS).",
    );
  }

  if (!isConceptRelationshipType(input.type)) {
    throw new ConceptRelationshipError(
      `Invalid relationship type: ${String(input.type)}`,
    );
  }

  if (input.fromConceptId === input.toConceptId) {
    throw new ConceptRelationshipError(
      "Self-relations are not allowed (fromConceptId must differ from toConceptId).",
    );
  }

  assertValidConfidence(input.confidence);

  // Ownership is mandatory. LearningSpace matching is contextual only —
  // do not reject when either/both Concepts have null learningSpaceId,
  // and do not auto-migrate Concepts between spaces.
  await requireOwnedConcept(input.userId, input.fromConceptId);
  await requireOwnedConcept(input.userId, input.toConceptId);

  const endpoints = normalizeConceptRelationshipEndpoints(
    input.type,
    input.fromConceptId,
    input.toConceptId,
  );

  const metadataJson = JSON.stringify(input.metadata ?? {});

  try {
    return await db.conceptRelationship.create({
      data: {
        userId: input.userId,
        fromConceptId: endpoints.fromConceptId,
        toConceptId: endpoints.toConceptId,
        type: input.type,
        confidence: input.confidence ?? null,
        sourceType: input.sourceType ?? null,
        sourceId: input.sourceId ?? null,
        metadataJson,
      },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      ("code" in error
        ? (error as { code?: string }).code === "P2002"
        : /Unique constraint/i.test(error.message))
    ) {
      throw new ConceptRelationshipError(
        "Duplicate relationship: this edge already exists.",
      );
    }
    throw error;
  }
}

export async function deleteConceptRelationship(
  userId: string,
  relationshipId: string,
): Promise<{ deleted: boolean }> {
  if (!isConceptRelationshipsEnabled()) {
    throw new ConceptRelationshipError(
      "Concept relationships are disabled (STUDY_HAUL_CONCEPT_RELATIONSHIPS).",
    );
  }

  const existing = await db.conceptRelationship.findFirst({
    where: { id: relationshipId, userId },
    select: { id: true },
  });
  if (!existing) {
    throw new ConceptRelationshipError("Relationship not found.");
  }

  await db.conceptRelationship.delete({ where: { id: existing.id } });
  return { deleted: true };
}

/**
 * Relationships where the concept is either endpoint, owned by the user.
 * Deterministic: type ASC, createdAt ASC, id ASC.
 */
export async function getConceptRelationships(
  userId: string,
  conceptId: string,
): Promise<ConceptRelationship[]> {
  await requireOwnedConcept(userId, conceptId);

  if (!isConceptRelationshipsEnabled()) {
    return [];
  }

  return db.conceptRelationship.findMany({
    where: {
      userId,
      OR: [{ fromConceptId: conceptId }, { toConceptId: conceptId }],
    },
    orderBy: [{ type: "asc" }, { createdAt: "asc" }, { id: "asc" }],
  });
}

async function listNeighborIds(
  userId: string,
  conceptId: string,
  type: ConceptRelationshipTypeName,
  direction: "outgoing" | "incoming" | "either",
): Promise<string[]> {
  await requireOwnedConcept(userId, conceptId);

  if (!isConceptRelationshipsEnabled()) {
    return [];
  }

  const where: Prisma.ConceptRelationshipWhereInput = {
    userId,
    type,
  };

  if (direction === "outgoing") {
    where.fromConceptId = conceptId;
  } else if (direction === "incoming") {
    where.toConceptId = conceptId;
  } else {
    where.OR = [{ fromConceptId: conceptId }, { toConceptId: conceptId }];
  }

  const rows = await db.conceptRelationship.findMany({
    where,
    select: { fromConceptId: true, toConceptId: true },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });

  const ids: string[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    const other =
      row.fromConceptId === conceptId ? row.toConceptId : row.fromConceptId;
    if (other === conceptId || seen.has(other)) continue;
    seen.add(other);
    ids.push(other);
  }
  return ids;
}

/**
 * PREREQUISITE: fromConcept requires toConcept.
 * Returns prerequisite Concept IDs that `conceptId` requires (outgoing edges).
 */
export async function getPrerequisiteConceptIds(
  userId: string,
  conceptId: string,
): Promise<string[]> {
  return listNeighborIds(userId, conceptId, "PREREQUISITE", "outgoing");
}

export async function getRelatedConceptIds(
  userId: string,
  conceptId: string,
): Promise<string[]> {
  return listNeighborIds(userId, conceptId, "RELATED", "either");
}

export async function getConfusableConceptIds(
  userId: string,
  conceptId: string,
): Promise<string[]> {
  return listNeighborIds(userId, conceptId, "CONFUSABLE_WITH", "either");
}

/**
 * PART_OF: fromConcept is part of toConcept.
 * Returns Concepts that `conceptId` is part of (outgoing edges).
 */
export async function getPartOfConceptIds(
  userId: string,
  conceptId: string,
): Promise<string[]> {
  return listNeighborIds(userId, conceptId, "PART_OF", "outgoing");
}

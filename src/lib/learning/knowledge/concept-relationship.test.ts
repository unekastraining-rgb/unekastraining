import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const {
  mockConceptFindFirst,
  mockConceptRelationshipCreate,
  mockConceptRelationshipFindFirst,
  mockConceptRelationshipFindMany,
  mockConceptRelationshipDelete,
  mockConceptMasteryFindUnique,
  mockLearningAttemptCreate,
} = vi.hoisted(() => ({
  mockConceptFindFirst: vi.fn(),
  mockConceptRelationshipCreate: vi.fn(),
  mockConceptRelationshipFindFirst: vi.fn(),
  mockConceptRelationshipFindMany: vi.fn(),
  mockConceptRelationshipDelete: vi.fn(),
  mockConceptMasteryFindUnique: vi.fn(),
  mockLearningAttemptCreate: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    concept: { findFirst: mockConceptFindFirst },
    conceptRelationship: {
      create: mockConceptRelationshipCreate,
      findFirst: mockConceptRelationshipFindFirst,
      findMany: mockConceptRelationshipFindMany,
      delete: mockConceptRelationshipDelete,
    },
    conceptMastery: { findUnique: mockConceptMasteryFindUnique },
    learningAttempt: { create: mockLearningAttemptCreate },
  },
}));

import { isConceptRelationshipsEnabled } from "@/lib/learning/knowledge/concept-relationship-flag";
import {
  CONCEPT_RELATIONSHIP_TYPES,
  normalizeConceptRelationshipEndpoints,
} from "@/lib/learning/knowledge/concept-relationship-types";
import {
  ConceptRelationshipError,
  createConceptRelationship,
  deleteConceptRelationship,
  getConceptRelationships,
  getConfusableConceptIds,
  getPartOfConceptIds,
  getPrerequisiteConceptIds,
  getRelatedConceptIds,
} from "@/lib/learning/knowledge/concept-relationship";

const USER_A = "user-a";
const USER_B = "user-b";
const CONCEPT_A = "concept-a";
const CONCEPT_B = "concept-b";
const CONCEPT_C = "concept-c";

function ownedConcept(
  id: string,
  userId: string,
  learningSpaceId: string | null = null,
) {
  return {
    id,
    userId,
    learningSpaceId,
    metadataJson: "{}",
  };
}

describe("Phase 2E-2 feature flag", () => {
  const original = process.env.STUDY_HAUL_CONCEPT_RELATIONSHIPS;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.STUDY_HAUL_CONCEPT_RELATIONSHIPS;
    } else {
      process.env.STUDY_HAUL_CONCEPT_RELATIONSHIPS = original;
    }
  });

  it("defaults OFF", () => {
    delete process.env.STUDY_HAUL_CONCEPT_RELATIONSHIPS;
    expect(isConceptRelationshipsEnabled()).toBe(false);
  });

  it("enables for 1/true/on/yes", () => {
    for (const value of ["1", "true", "on", "yes", "TRUE", "On"]) {
      process.env.STUDY_HAUL_CONCEPT_RELATIONSHIPS = value;
      expect(isConceptRelationshipsEnabled()).toBe(true);
    }
  });

  it("stays OFF for other values", () => {
    process.env.STUDY_HAUL_CONCEPT_RELATIONSHIPS = "maybe";
    expect(isConceptRelationshipsEnabled()).toBe(false);
  });
});

describe("symmetric endpoint normalization", () => {
  it("keeps directional endpoints for PREREQUISITE and PART_OF", () => {
    expect(
      normalizeConceptRelationshipEndpoints("PREREQUISITE", "z", "a"),
    ).toEqual({ fromConceptId: "z", toConceptId: "a" });
    expect(normalizeConceptRelationshipEndpoints("PART_OF", "z", "a")).toEqual({
      fromConceptId: "z",
      toConceptId: "a",
    });
  });

  it("canonicalizes RELATED and CONFUSABLE_WITH by lexicographic order", () => {
    expect(normalizeConceptRelationshipEndpoints("RELATED", "b", "a")).toEqual({
      fromConceptId: "a",
      toConceptId: "b",
    });
    expect(
      normalizeConceptRelationshipEndpoints("CONFUSABLE_WITH", "m", "k"),
    ).toEqual({ fromConceptId: "k", toConceptId: "m" });
    expect(normalizeConceptRelationshipEndpoints("RELATED", "a", "b")).toEqual({
      fromConceptId: "a",
      toConceptId: "b",
    });
  });
});

describe("createConceptRelationship", () => {
  const original = process.env.STUDY_HAUL_CONCEPT_RELATIONSHIPS;

  beforeEach(() => {
    process.env.STUDY_HAUL_CONCEPT_RELATIONSHIPS = "1";
    vi.clearAllMocks();
    mockConceptFindFirst.mockImplementation(
      async ({ where }: { where: { id: string; userId: string } }) => {
        if (where.userId !== USER_A) return null;
        if (where.id === CONCEPT_A) return ownedConcept(CONCEPT_A, USER_A);
        if (where.id === CONCEPT_B) return ownedConcept(CONCEPT_B, USER_A);
        if (where.id === CONCEPT_C) return ownedConcept(CONCEPT_C, USER_A);
        return null;
      },
    );
    mockConceptRelationshipCreate.mockImplementation(
      async ({ data }: { data: Record<string, unknown> }) => ({
        id: "rel-1",
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-01-01"),
        ...data,
      }),
    );
  });

  afterEach(() => {
    if (original === undefined) {
      delete process.env.STUDY_HAUL_CONCEPT_RELATIONSHIPS;
    } else {
      process.env.STUDY_HAUL_CONCEPT_RELATIONSHIPS = original;
    }
  });

  it("creates a PREREQUISITE relationship with direction preserved", async () => {
    const rel = await createConceptRelationship({
      userId: USER_A,
      fromConceptId: CONCEPT_A,
      toConceptId: CONCEPT_B,
      type: "PREREQUISITE",
      sourceType: "MANUAL",
      confidence: 1,
    });

    expect(mockConceptRelationshipCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: USER_A,
        fromConceptId: CONCEPT_A,
        toConceptId: CONCEPT_B,
        type: "PREREQUISITE",
        confidence: 1,
        sourceType: "MANUAL",
        metadataJson: "{}",
      }),
    });
    expect(rel.type).toBe("PREREQUISITE");
    expect(rel.fromConceptId).toBe(CONCEPT_A);
    expect(rel.toConceptId).toBe(CONCEPT_B);
  });

  it("creates PART_OF with direction preserved", async () => {
    await createConceptRelationship({
      userId: USER_A,
      fromConceptId: CONCEPT_A,
      toConceptId: CONCEPT_B,
      type: "PART_OF",
    });
    expect(mockConceptRelationshipCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        fromConceptId: CONCEPT_A,
        toConceptId: CONCEPT_B,
        type: "PART_OF",
      }),
    });
  });

  it("normalizes RELATED so reverse pair is the same edge", async () => {
    await createConceptRelationship({
      userId: USER_A,
      fromConceptId: CONCEPT_B,
      toConceptId: CONCEPT_A,
      type: "RELATED",
    });
    expect(mockConceptRelationshipCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        fromConceptId: CONCEPT_A,
        toConceptId: CONCEPT_B,
        type: "RELATED",
      }),
    });
  });

  it("normalizes CONFUSABLE_WITH symmetrically", async () => {
    await createConceptRelationship({
      userId: USER_A,
      fromConceptId: CONCEPT_C,
      toConceptId: CONCEPT_A,
      type: "CONFUSABLE_WITH",
    });
    expect(mockConceptRelationshipCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        fromConceptId: CONCEPT_A,
        toConceptId: CONCEPT_C,
        type: "CONFUSABLE_WITH",
      }),
    });
  });

  it("rejects self-relations for every relationship type", async () => {
    for (const type of CONCEPT_RELATIONSHIP_TYPES) {
      mockConceptRelationshipCreate.mockClear();
      await expect(
        createConceptRelationship({
          userId: USER_A,
          fromConceptId: CONCEPT_A,
          toConceptId: CONCEPT_A,
          type,
        }),
      ).rejects.toThrow(/Self-relations/);
      expect(mockConceptRelationshipCreate).not.toHaveBeenCalled();
    }
  });

  it("rejects cross-user Concepts in both directions", async () => {
    mockConceptFindFirst.mockImplementation(
      async ({ where }: { where: { id: string; userId: string } }) => {
        if (where.userId === USER_A && where.id === CONCEPT_A) {
          return ownedConcept(CONCEPT_A, USER_A);
        }
        return null;
      },
    );

    await expect(
      createConceptRelationship({
        userId: USER_A,
        fromConceptId: CONCEPT_A,
        toConceptId: CONCEPT_B,
        type: "PREREQUISITE",
      }),
    ).rejects.toThrow(/not owned/);

    await expect(
      createConceptRelationship({
        userId: USER_A,
        fromConceptId: CONCEPT_B,
        toConceptId: CONCEPT_A,
        type: "RELATED",
      }),
    ).rejects.toThrow(/not owned/);
  });

  it("rejects duplicate create for every relationship type via P2002 mapping", async () => {
    for (const type of CONCEPT_RELATIONSHIP_TYPES) {
      mockConceptRelationshipCreate.mockRejectedValueOnce(
        Object.assign(new Error("Unique constraint failed"), { code: "P2002" }),
      );
      await expect(
        createConceptRelationship({
          userId: USER_A,
          fromConceptId: CONCEPT_A,
          toConceptId: CONCEPT_B,
          type,
        }),
      ).rejects.toThrow(/Duplicate relationship/);
    }
  });

  it("rejects when flag is OFF", async () => {
    delete process.env.STUDY_HAUL_CONCEPT_RELATIONSHIPS;
    await expect(
      createConceptRelationship({
        userId: USER_A,
        fromConceptId: CONCEPT_A,
        toConceptId: CONCEPT_B,
        type: "RELATED",
      }),
    ).rejects.toThrow(/disabled/);
  });

  it("rejects invalid type", async () => {
    await expect(
      createConceptRelationship({
        userId: USER_A,
        fromConceptId: CONCEPT_A,
        toConceptId: CONCEPT_B,
        type: "MISCONCEPTION",
      }),
    ).rejects.toThrow(/Invalid relationship type/);
  });

  it("maps unique constraint to duplicate error", async () => {
    mockConceptRelationshipCreate.mockRejectedValueOnce(
      Object.assign(new Error("Unique constraint failed"), { code: "P2002" }),
    );
    await expect(
      createConceptRelationship({
        userId: USER_A,
        fromConceptId: CONCEPT_A,
        toConceptId: CONCEPT_B,
        type: "PREREQUISITE",
      }),
    ).rejects.toThrow(ConceptRelationshipError);
  });

  it("stores optional provenance and confidence", async () => {
    await createConceptRelationship({
      userId: USER_A,
      fromConceptId: CONCEPT_A,
      toConceptId: CONCEPT_B,
      type: "RELATED",
      confidence: 0.85,
      sourceType: "MANUAL",
      sourceId: "ui-1",
      metadata: { note: "user confirmed" },
    });
    expect(mockConceptRelationshipCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        confidence: 0.85,
        sourceType: "MANUAL",
        sourceId: "ui-1",
        metadataJson: JSON.stringify({ note: "user confirmed" }),
      }),
    });
  });

  it("rejects confidence outside 0..1", async () => {
    await expect(
      createConceptRelationship({
        userId: USER_A,
        fromConceptId: CONCEPT_A,
        toConceptId: CONCEPT_B,
        type: "RELATED",
        confidence: 1.5,
      }),
    ).rejects.toThrow(/confidence/);
  });
});

describe("relationship readers", () => {
  const original = process.env.STUDY_HAUL_CONCEPT_RELATIONSHIPS;

  beforeEach(() => {
    process.env.STUDY_HAUL_CONCEPT_RELATIONSHIPS = "1";
    vi.clearAllMocks();
    mockConceptFindFirst.mockResolvedValue(ownedConcept(CONCEPT_A, USER_A));
  });

  afterEach(() => {
    if (original === undefined) {
      delete process.env.STUDY_HAUL_CONCEPT_RELATIONSHIPS;
    } else {
      process.env.STUDY_HAUL_CONCEPT_RELATIONSHIPS = original;
    }
  });

  it("returns empty prerequisites when none exist", async () => {
    mockConceptRelationshipFindMany.mockResolvedValue([]);
    await expect(getPrerequisiteConceptIds(USER_A, CONCEPT_A)).resolves.toEqual(
      [],
    );
  });

  it("returns prerequisite ids for outgoing PREREQUISITE edges", async () => {
    mockConceptRelationshipFindMany.mockResolvedValue([
      { fromConceptId: CONCEPT_A, toConceptId: CONCEPT_B },
      { fromConceptId: CONCEPT_A, toConceptId: CONCEPT_C },
    ]);
    await expect(getPrerequisiteConceptIds(USER_A, CONCEPT_A)).resolves.toEqual([
      CONCEPT_B,
      CONCEPT_C,
    ]);
    expect(mockConceptRelationshipFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: USER_A,
          type: "PREREQUISITE",
          fromConceptId: CONCEPT_A,
        }),
      }),
    );
  });

  it("PREREQUISITE A→B does not make B require A", async () => {
    mockConceptFindFirst.mockResolvedValue(ownedConcept(CONCEPT_B, USER_A));
    mockConceptRelationshipFindMany.mockResolvedValue([]);
    await expect(getPrerequisiteConceptIds(USER_A, CONCEPT_B)).resolves.toEqual(
      [],
    );
    expect(mockConceptRelationshipFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          type: "PREREQUISITE",
          fromConceptId: CONCEPT_B,
        }),
      }),
    );
  });

  it("PART_OF reader uses outgoing edges only (no auto reverse)", async () => {
    mockConceptRelationshipFindMany.mockResolvedValue([
      { fromConceptId: CONCEPT_A, toConceptId: CONCEPT_B },
    ]);
    await expect(getPartOfConceptIds(USER_A, CONCEPT_A)).resolves.toEqual([
      CONCEPT_B,
    ]);
    expect(mockConceptRelationshipFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          type: "PART_OF",
          fromConceptId: CONCEPT_A,
        }),
      }),
    );
  });

  it("RELATED reader returns neighbor regardless of stored endpoint order", async () => {
    mockConceptRelationshipFindMany.mockResolvedValue([
      { fromConceptId: CONCEPT_A, toConceptId: CONCEPT_B },
    ]);
    await expect(getRelatedConceptIds(USER_A, CONCEPT_A)).resolves.toEqual([
      CONCEPT_B,
    ]);
    mockConceptFindFirst.mockResolvedValue(ownedConcept(CONCEPT_B, USER_A));
    mockConceptRelationshipFindMany.mockResolvedValue([
      { fromConceptId: CONCEPT_A, toConceptId: CONCEPT_B },
    ]);
    await expect(getRelatedConceptIds(USER_A, CONCEPT_B)).resolves.toEqual([
      CONCEPT_A,
    ]);
  });

  it("returns related / confusable / part-of neighbor ids", async () => {
    mockConceptRelationshipFindMany.mockResolvedValueOnce([
      { fromConceptId: CONCEPT_A, toConceptId: CONCEPT_B },
    ]);
    await expect(getRelatedConceptIds(USER_A, CONCEPT_A)).resolves.toEqual([
      CONCEPT_B,
    ]);

    mockConceptRelationshipFindMany.mockResolvedValueOnce([
      { fromConceptId: CONCEPT_B, toConceptId: CONCEPT_A },
    ]);
    await expect(getConfusableConceptIds(USER_A, CONCEPT_A)).resolves.toEqual([
      CONCEPT_B,
    ]);

    mockConceptRelationshipFindMany.mockResolvedValueOnce([
      { fromConceptId: CONCEPT_A, toConceptId: CONCEPT_C },
    ]);
    await expect(getPartOfConceptIds(USER_A, CONCEPT_A)).resolves.toEqual([
      CONCEPT_C,
    ]);
  });

  it("getConceptRelationships returns rows when flag ON", async () => {
    const rows = [
      {
        id: "r1",
        userId: USER_A,
        fromConceptId: CONCEPT_A,
        toConceptId: CONCEPT_B,
        type: "PREREQUISITE",
      },
    ];
    mockConceptRelationshipFindMany.mockResolvedValue(rows);
    await expect(getConceptRelationships(USER_A, CONCEPT_A)).resolves.toEqual(
      rows,
    );
  });

  it("returns empty list when flag OFF without writing", async () => {
    delete process.env.STUDY_HAUL_CONCEPT_RELATIONSHIPS;
    await expect(getConceptRelationships(USER_A, CONCEPT_A)).resolves.toEqual(
      [],
    );
    await expect(getPrerequisiteConceptIds(USER_A, CONCEPT_A)).resolves.toEqual(
      [],
    );
    expect(mockConceptRelationshipFindMany).not.toHaveBeenCalled();
  });

  it("deleteConceptRelationship enforces ownership", async () => {
    mockConceptRelationshipFindFirst.mockResolvedValue({ id: "rel-1" });
    mockConceptRelationshipDelete.mockResolvedValue({});
    await expect(deleteConceptRelationship(USER_A, "rel-1")).resolves.toEqual({
      deleted: true,
    });
    expect(mockConceptRelationshipDelete).toHaveBeenCalledWith({
      where: { id: "rel-1" },
    });
  });
});

describe("Phase 2E-2 preservation (schema + no intelligence side effects)", () => {
  it("declares ConceptRelationshipType enum values only", () => {
    expect([...CONCEPT_RELATIONSHIP_TYPES]).toEqual([
      "PREREQUISITE",
      "RELATED",
      "CONFUSABLE_WITH",
      "PART_OF",
    ]);
  });

  it("schema adds ConceptRelationship with cascade FKs and unique key", () => {
    const schema = readFileSync(
      path.join(process.cwd(), "prisma/schema.prisma"),
      "utf8",
    );
    expect(schema).toContain("enum ConceptRelationshipType");
    expect(schema).toContain("model ConceptRelationship");
    expect(schema).toContain("@@unique([userId, fromConceptId, toConceptId, type])");
    expect(schema).toContain(
      'Concept @relation("ConceptRelationshipFrom", fields: [fromConceptId], references: [id], onDelete: Cascade)',
    );
    expect(schema).toContain(
      'Concept @relation("ConceptRelationshipTo", fields: [toConceptId], references: [id], onDelete: Cascade)',
    );
    expect(schema).toContain("prerequisiteConceptIdsJson");
    expect(schema).toContain("model ConceptMastery");
    expect(schema).toContain("model TopicMastery");
    expect(schema).toContain("model LearningAttempt");
    expect(schema).toContain("model RetentionItem");
    expect(schema).toContain("parentId");
  });

  it("does not store relationships in Concept.metadataJson helpers", () => {
    const helper = readFileSync(
      path.join(
        process.cwd(),
        "src/lib/learning/knowledge/concept-relationship.ts",
      ),
      "utf8",
    );
    expect(helper).not.toMatch(/concept\.update/);
    expect(helper).not.toMatch(/metadataJson:\s*JSON\.stringify\([^)]*relationship/i);
  });

  it("does not modify Orchestrator diagnose/suggest/present", () => {
    for (const file of ["diagnose.ts", "suggest.ts", "present.ts"]) {
      const source = readFileSync(
        path.join(process.cwd(), `src/lib/learning/orchestrator/${file}`),
        "utf8",
      );
      expect(source).not.toMatch(/ConceptRelationship|prerequisite gap|getPrerequisiteConceptIds/);
    }
  });

  it("does not modify CORE bridge candidate generation for relationships", () => {
    const candidates = readFileSync(
      path.join(
        process.cwd(),
        "src/lib/learning/knowledge/core-bridge-candidates.ts",
      ),
      "utf8",
    );
    expect(candidates).not.toMatch(/ConceptRelationship|PREREQUISITE|CONFUSABLE_WITH/);
  });

  it("LearningObject ensure still writes prerequisiteConceptIdsJson only", () => {
    const ensure = readFileSync(
      path.join(process.cwd(), "src/lib/learning/learning-object/ensure.ts"),
      "utf8",
    );
    expect(ensure).toContain("prerequisiteConceptIdsJson");
    expect(ensure).not.toMatch(/createConceptRelationship|ConceptRelationship/);
  });

  it("does not call LLM or invent automatic evidence/mastery/LUCKY updates", () => {
    const helper = readFileSync(
      path.join(
        process.cwd(),
        "src/lib/learning/knowledge/concept-relationship.ts",
      ),
      "utf8",
    );
    expect(helper).not.toMatch(/openai|generateText|recordEvidence|applyEvidenceToMastery|upsertRetentionItem/i);
    expect(mockConceptMasteryFindUnique).not.toHaveBeenCalled();
    expect(mockLearningAttemptCreate).not.toHaveBeenCalled();
  });

  it("env example documents the feature flag", () => {
    const envExample = readFileSync(
      path.join(process.cwd(), ".env.example"),
      "utf8",
    );
    expect(envExample).toContain("STUDY_HAUL_CONCEPT_RELATIONSHIPS");
  });

  it("rejects other user's concept id even if present in DB under different owner", async () => {
    process.env.STUDY_HAUL_CONCEPT_RELATIONSHIPS = "1";
    mockConceptFindFirst.mockImplementation(
      async ({ where }: { where: { id: string; userId: string } }) => {
        if (where.userId === USER_B && where.id === CONCEPT_B) {
          return ownedConcept(CONCEPT_B, USER_B);
        }
        if (where.userId === USER_A && where.id === CONCEPT_A) {
          return ownedConcept(CONCEPT_A, USER_A);
        }
        return null;
      },
    );
    await expect(
      createConceptRelationship({
        userId: USER_A,
        fromConceptId: CONCEPT_A,
        toConceptId: CONCEPT_B,
        type: "RELATED",
      }),
    ).rejects.toThrow(/not owned/);
  });
});

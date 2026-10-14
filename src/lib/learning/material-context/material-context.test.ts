import { describe, expect, it, vi, beforeEach } from "vitest";

const {
  mockMaterialFindFirst,
  mockNoteFindMany,
  mockNoteFindFirst,
  mockLearningSpaceFindFirst,
  mockCourseMaterialFindFirst,
} = vi.hoisted(() => ({
  mockMaterialFindFirst: vi.fn(),
  mockNoteFindMany: vi.fn(),
  mockNoteFindFirst: vi.fn(),
  mockLearningSpaceFindFirst: vi.fn(),
  mockCourseMaterialFindFirst: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    courseMaterial: {
      findFirst: mockCourseMaterialFindFirst,
    },
    note: {
      findMany: mockNoteFindMany,
      findFirst: mockNoteFindFirst,
    },
    learningSpace: { findFirst: mockLearningSpaceFindFirst },
  },
}));

vi.mock("@/lib/materials/workbook-from-material", () => ({
  loadMaterialForUser: (...args: unknown[]) => mockMaterialFindFirst(...args),
}));

import {
  assertLearnerFacingProvenance,
  buildMaterialProvenance,
  MATERIAL_CONTEXT_EVIDENCE_BOUNDARY,
  materialContextCreatesEvidence,
  pickMaterialContextPriority,
  presentMaterialSourceCitation,
  resolveLearningMaterialContext,
  resolveOwnedMaterialContext,
  withMaterialIdQuery,
} from "@/lib/learning/material-context";
import { emptyDocument } from "@/lib/core/note-types";

describe("2P-28 material context evidence boundary", () => {
  it("display and navigation never create evidence", () => {
    expect(MATERIAL_CONTEXT_EVIDENCE_BOUNDARY.displayCreatesLearningAttempt).toBe(
      false,
    );
    expect(
      MATERIAL_CONTEXT_EVIDENCE_BOUNDARY.viewSourceCreatesLearningAttempt,
    ).toBe(false);
    expect(
      materialContextCreatesEvidence("activityInteractionMayCreateEvidence"),
    ).toBe(true);
  });
});

describe("2P-28 provenance", () => {
  it("preserves section and page when provided", () => {
    const p = buildMaterialProvenance({
      materialTitle: "Java Chapter 11",
      section: "Section 11.2",
      page: 4,
    });
    expect(p.label).toContain("Java Chapter 11");
    expect(p.label).toContain("Section 11.2");
    expect(p.label).toContain("page 4");
    expect(assertLearnerFacingProvenance(p.label)).toBe(true);
  });

  it("handles missing page/section", () => {
    const p = buildMaterialProvenance({ materialTitle: "Networking Notes" });
    expect(p.label).toBe("Source: Networking Notes");
    expect(p.page).toBeNull();
  });

  it("rejects id-like labels", () => {
    expect(assertLearnerFacingProvenance("cmuc9fks800005cqg29yebof7")).toBe(
      false,
    );
  });
});

describe("2P-28 source priority", () => {
  it("explicit wins over activity and concept", () => {
    expect(
      pickMaterialContextPriority({
        explicitMaterialId: "m1",
        activityMaterialId: "m2",
        conceptMaterialId: "m3",
        learningSpaceMaterialId: "m4",
      }),
    ).toEqual({ materialId: "m1", prioritySource: "explicit" });
  });

  it("falls through to none", () => {
    expect(pickMaterialContextPriority({})).toEqual({
      materialId: null,
      prioritySource: "none",
    });
  });
});

describe("2P-28 resolveOwnedMaterialContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLearningSpaceFindFirst.mockResolvedValue(null);
    mockNoteFindFirst.mockResolvedValue(null);
  });

  it("returns null for foreign material", async () => {
    mockMaterialFindFirst.mockResolvedValue(null);
    await expect(
      resolveOwnedMaterialContext({
        userId: "user_b",
        materialId: "mat_a",
      }),
    ).resolves.toBeNull();
  });

  it("resolves owned material without inventing page numbers", async () => {
    mockMaterialFindFirst.mockResolvedValue({
      id: "mat_1",
      title: "Chapter 11 notes",
      type: "DOCUMENT",
      courseId: "c1",
      extractedText: "Inheritance content",
      course: { id: "c1", title: "Java", code: "CS" },
    });
    const ctx = await resolveOwnedMaterialContext({
      userId: "user_a",
      materialId: "mat_1",
      conceptId: "concept_1",
    });
    expect(ctx?.materialId).toBe("mat_1");
    expect(ctx?.provenance.label).toMatch(/Source: Chapter 11 notes/);
    expect(ctx?.provenance.page).toBeNull();
    expect(ctx?.conceptId).toBe("concept_1");
  });
});

describe("2P-28 resolveLearningMaterialContext optional", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNoteFindMany.mockResolvedValue([]);
    mockLearningSpaceFindFirst.mockResolvedValue(null);
    mockCourseMaterialFindFirst.mockResolvedValue(null);
  });

  it("returns null context when absent", async () => {
    const result = await resolveLearningMaterialContext({
      userId: "user_a",
      conceptId: "concept_1",
    });
    expect(result.context).toBeNull();
    expect(result.prioritySource).toBe("none");
    expect(result.createsEvidence).toBe(false);
  });

  it("rejects foreign explicit material safely", async () => {
    mockMaterialFindFirst.mockResolvedValue(null);
    const result = await resolveLearningMaterialContext({
      userId: "user_a",
      explicitMaterialId: "foreign_mat",
    });
    expect(result.context).toBeNull();
    expect(result.prioritySource).toBe("none");
  });

  it("uses concept-linked material when notes confirm", async () => {
    const doc = {
      ...emptyDocument("type"),
      metadata: {
        materialSource: {
          materialId: "mat_1",
          title: "Linked notes",
          type: "DOCUMENT",
        },
        learningKnowledge: {
          version: 1,
          linkedConceptIds: ["concept_1"],
          candidateConcepts: [],
        },
      },
    };
    mockNoteFindMany.mockResolvedValue([
      {
        id: "note_1",
        materialId: "mat_1",
        contentJson: JSON.stringify(doc),
        updatedAt: new Date(),
        material: { title: "Linked notes" },
      },
    ]);
    mockMaterialFindFirst.mockResolvedValue({
      id: "mat_1",
      title: "Linked notes",
      type: "DOCUMENT",
      courseId: "c1",
      extractedText: "content",
      course: { id: "c1", title: "Course", code: null },
    });
    mockNoteFindFirst.mockResolvedValue({
      id: "note_1",
      contentJson: JSON.stringify(doc),
    });

    const result = await resolveLearningMaterialContext({
      userId: "user_a",
      conceptId: "concept_1",
    });
    expect(result.prioritySource).toBe("concept");
    expect(result.context?.materialId).toBe("mat_1");
  });
});

describe("2P-28 present + query helpers", () => {
  it("present returns null when context absent", () => {
    expect(presentMaterialSourceCitation(null)).toBeNull();
  });

  it("withMaterialIdQuery is additive and idempotent", () => {
    const href = withMaterialIdQuery(
      "/study/activities/lab?conceptId=c1",
      "mat_1",
    );
    expect(href).toContain("materialId=mat_1");
    expect(withMaterialIdQuery(href, "mat_2")).toContain("materialId=mat_1");
  });
});

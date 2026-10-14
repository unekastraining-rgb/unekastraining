import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";

const {
  mockMaterialFindFirst,
  mockMaterialFindMany,
  mockNoteFindFirst,
  mockNoteCreate,
  mockNoteUpdate,
  mockTopicFindMany,
  mockLearningSpaceFindFirst,
  mockConceptFindMany,
  mockConceptCreate,
  mockAttemptCount,
  mockMasteryFind,
} = vi.hoisted(() => ({
  mockMaterialFindFirst: vi.fn(),
  mockMaterialFindMany: vi.fn(),
  mockNoteFindFirst: vi.fn(),
  mockNoteCreate: vi.fn(),
  mockNoteUpdate: vi.fn(),
  mockTopicFindMany: vi.fn(),
  mockLearningSpaceFindFirst: vi.fn(),
  mockConceptFindMany: vi.fn(),
  mockConceptCreate: vi.fn(),
  mockAttemptCount: vi.fn(),
  mockMasteryFind: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    courseMaterial: {
      findFirst: mockMaterialFindFirst,
      findMany: mockMaterialFindMany,
    },
    note: {
      findFirst: mockNoteFindFirst,
      create: mockNoteCreate,
      update: mockNoteUpdate,
    },
    topic: { findMany: mockTopicFindMany },
    learningSpace: { findFirst: mockLearningSpaceFindFirst },
    concept: {
      findMany: mockConceptFindMany,
      create: mockConceptCreate,
    },
    learningAttempt: { count: mockAttemptCount },
    conceptMastery: { findUnique: mockMasteryFind },
  },
}));

import { emptyDocument } from "@/lib/core/note-types";
import { sourceRefFromCourseMaterial } from "@/lib/learning/content-pipeline/from-core";
import { assertSourceOwnership } from "@/lib/learning/content-pipeline/source";
import {
  MATERIAL_INGESTION_EVIDENCE_BOUNDARY,
  materialIngestionCreatesEvidence,
  presentLearnerFacingProvenance,
  prepareMaterialForLearning,
  searchOwnedMaterials,
  loadOwnedMaterialTutorContext,
  MaterialLearningError,
} from "@/lib/learning/material-ingestion";

describe("2P-27 material ingestion provenance", () => {
  it("presents learner-facing labels without DB ids", () => {
    const p = presentLearnerFacingProvenance({
      materialTitle: "Chapter 4 notes",
      section: "Section 4.2",
    });
    expect(p.label).toBe("Source: Chapter 4 notes, Section 4.2");
    expect(p.label).not.toMatch(/cuid|abc123|sourceRefId/i);
  });
});

describe("2P-27 evidence boundary", () => {
  it("upload/open/extract/confirm do not create evidence", () => {
    expect(MATERIAL_INGESTION_EVIDENCE_BOUNDARY.uploadCreatesLearningAttempt).toBe(
      false,
    );
    expect(MATERIAL_INGESTION_EVIDENCE_BOUNDARY.openCreatesLearningAttempt).toBe(
      false,
    );
    expect(
      MATERIAL_INGESTION_EVIDENCE_BOUNDARY.extractCreatesLearningAttempt,
    ).toBe(false);
    expect(
      MATERIAL_INGESTION_EVIDENCE_BOUNDARY.conceptConfirmCreatesLearningAttempt,
    ).toBe(false);
    expect(
      MATERIAL_INGESTION_EVIDENCE_BOUNDARY.ordinaryTutorQaCreatesEvidence,
    ).toBe(false);
    expect(
      materialIngestionCreatesEvidence("activityInteractionMayCreateEvidence"),
    ).toBe(true);
  });
});

describe("2P-27 source model ownership", () => {
  it("builds ContentSourceRef from CourseMaterial", () => {
    const ref = sourceRefFromCourseMaterial({
      materialId: "mat_1",
      title: "Java Chapter 11",
      learnerId: "user_a",
      excerpt: "inheritance…",
    });
    expect(ref.sourceId).toBe("course-material:mat_1");
    expect(ref.sourceType).toBe("course_material");
    expect(ref.ownerLearnerId).toBe("user_a");
  });

  it("rejects foreign source ownership", () => {
    const ref = sourceRefFromCourseMaterial({
      materialId: "mat_1",
      title: "Secret notes",
      learnerId: "user_a",
    });
    expect(assertSourceOwnership({ source: ref, learnerId: "user_b" })).toEqual({
      ok: false,
      reason: "foreign_source",
    });
    expect(assertSourceOwnership({ source: ref, learnerId: "user_a" })).toEqual({
      ok: true,
    });
  });
});

describe("2P-27 prepareMaterialForLearning", () => {
  const originalBridge = process.env.STUDY_HAUL_CORE_KNOWLEDGE_BRIDGE;
  const originalE2e = process.env.E2E_MODE;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STUDY_HAUL_CORE_KNOWLEDGE_BRIDGE = "1";
    delete process.env.E2E_MODE;
    mockTopicFindMany.mockResolvedValue([
      { name: "Inheritance", description: "Java inheritance basics" },
    ]);
    mockLearningSpaceFindFirst.mockResolvedValue(null);
    mockConceptFindMany.mockResolvedValue([]);
    mockAttemptCount.mockResolvedValue(0);
  });

  afterEach(() => {
    if (originalBridge === undefined) {
      delete process.env.STUDY_HAUL_CORE_KNOWLEDGE_BRIDGE;
    } else {
      process.env.STUDY_HAUL_CORE_KNOWLEDGE_BRIDGE = originalBridge;
    }
    if (originalE2e === undefined) {
      delete process.env.E2E_MODE;
    } else {
      process.env.E2E_MODE = originalE2e;
    }
  });

  it("returns not_found for foreign material (ownership)", async () => {
    mockMaterialFindFirst.mockResolvedValue(null);
    await expect(
      prepareMaterialForLearning("user_b", "mat_owned_by_a"),
    ).rejects.toBeInstanceOf(MaterialLearningError);
  });

  it("non-AI prepare persists extract without LearningAttempt", async () => {
    const material = {
      id: "mat_1",
      title: "Networking Notes",
      type: "DOCUMENT",
      extractedText:
        "Chapter 11 — TCP handshake\n\nThree-way handshake establishes a connection.\nSYN, SYN-ACK, ACK.",
      filePath: null,
      courseId: "course_1",
      course: { id: "course_1", title: "Networking", code: "NET" },
      url: null,
      sortOrder: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockMaterialFindFirst.mockResolvedValue(material);
    mockNoteFindFirst.mockResolvedValue(null);
    const createdNote = {
      id: "note_1",
      userId: "user_a",
      courseId: "course_1",
      materialId: "mat_1",
      contentJson: JSON.stringify(emptyDocument("type")),
    };
    mockNoteCreate.mockResolvedValue(createdNote);
    mockNoteUpdate.mockResolvedValue(createdNote);
    // After update, preview loads owned note — reuse findFirst for note in bridge
    mockNoteFindFirst
      .mockResolvedValueOnce(null) // workbook lookup
      .mockResolvedValue({
        id: "note_1",
        userId: "user_a",
        courseId: "course_1",
        topicId: null,
        materialId: "mat_1",
        contentJson: JSON.stringify({
          ...emptyDocument("type"),
          metadata: {
            chapterStudyExtract: {
              title: "Networking Notes",
              chapterOverview: "Cold-start",
              learningObjectives: [
                {
                  code: "LO 1",
                  statement: "Explain Inheritance",
                  keyPoints: ["basics"],
                },
              ],
              definitions: [
                { term: "Inheritance", definition: "Java inheritance basics" },
              ],
              frameworks: [],
              comparisons: [],
              mustKnow: [],
              studyToRemember: [],
              testYourself: [],
              processesOrSteps: [],
            },
          },
        }),
        topic: null,
      });

    const result = await prepareMaterialForLearning("user_a", "mat_1");
    expect(result.state === "READY" || result.state === "PARTIAL").toBe(true);
    expect(result.nonAi).toBe(true);
    expect(result.source.ownerLearnerId).toBe("user_a");
    expect(mockNoteUpdate).toHaveBeenCalled();
    expect(mockAttemptCount).not.toHaveBeenCalled();
    expect(mockMasteryFind).not.toHaveBeenCalled();
  });

  it("search is scoped to owner via course.userId", async () => {
    mockMaterialFindMany.mockResolvedValue([
      {
        id: "mat_1",
        title: "Java Chapter 11",
        type: "DOCUMENT",
        courseId: "c1",
        extractedText: "inheritance polymorphism",
        course: { title: "CS" },
      },
    ]);
    const hits = await searchOwnedMaterials("user_a", "inheritance");
    expect(hits).toHaveLength(1);
    expect(mockMaterialFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          course: { userId: "user_a" },
        }),
      }),
    );
  });

  it("tutor context returns null for foreign material", async () => {
    mockMaterialFindFirst.mockResolvedValue(null);
    const ctx = await loadOwnedMaterialTutorContext("user_b", "mat_a");
    expect(ctx).toBeNull();
  });
});

describe("2P-27 activity matrix documentation", () => {
  it("documents activity matrix without claiming unsupported paths", () => {
    const doc = fs.readFileSync(
      path.join(
        process.cwd(),
        "src/lib/learning/MATERIAL_TO_LEARNING.md",
      ),
      "utf8",
    );
    expect(doc).toMatch(/Activity matrix/i);
    expect(doc).toMatch(/LearningAttempt/i);
    expect(doc).toMatch(/not a new MaterialMastery|No MaterialTutor|No MaterialAdaptive/i);
  });
});

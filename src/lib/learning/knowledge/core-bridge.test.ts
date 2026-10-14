import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockNoteFindFirst,
  mockNoteFindMany,
  mockNoteUpdate,
  mockLearningSpaceFindFirst,
  mockConceptFindMany,
  mockConceptFindFirst,
  mockConceptCreate,
} = vi.hoisted(() => ({
  mockNoteFindFirst: vi.fn(),
  mockNoteFindMany: vi.fn(),
  mockNoteUpdate: vi.fn(),
  mockLearningSpaceFindFirst: vi.fn(),
  mockConceptFindMany: vi.fn(),
  mockConceptFindFirst: vi.fn(),
  mockConceptCreate: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    note: {
      findFirst: mockNoteFindFirst,
      findMany: mockNoteFindMany,
      update: mockNoteUpdate,
    },
    learningSpace: { findFirst: mockLearningSpaceFindFirst },
    concept: {
      findMany: mockConceptFindMany,
      findFirst: mockConceptFindFirst,
      create: mockConceptCreate,
    },
  },
}));

import type { ChapterStudyExtract } from "@/lib/core/chapter-study-extract";
import {
  extractKnowledgeCandidatesFromStudyExtract,
  normalizeConceptTitle,
  CORE_KNOWLEDGE_CANDIDATE_CAP,
} from "@/lib/learning/knowledge/core-bridge-candidates";
import { isCoreKnowledgeBridgeEnabled } from "@/lib/learning/knowledge/core-bridge-flag";
import {
  confirmCoreKnowledgeCandidate,
  mergeLearningKnowledgeIntoDocument,
  previewCoreKnowledgeBridge,
  rejectCoreKnowledgeCandidate,
} from "@/lib/learning/knowledge/core-bridge";
import {
  emptyLearningKnowledgeMeta,
  readLearningKnowledgeMeta,
} from "@/lib/learning/knowledge/core-bridge-types";
import { emptyDocument } from "@/lib/core/note-types";

const sampleExtract: ChapterStudyExtract = {
  title: "OOP",
  chapterOverview: "Overview",
  learningObjectives: [
    {
      code: "LO1",
      statement: "Explain inheritance in object-oriented programming.",
      keyPoints: ["subclass", "superclass"],
    },
  ],
  definitions: [
    { term: "Inheritance", definition: "A subclass reuses a superclass." },
    { term: "Polymorphism", definition: "Many forms." },
    { term: "Encapsulation", definition: "Hide internals." },
  ],
  frameworks: [{ name: "SOLID", items: ["S", "O", "L", "I", "D"] }],
  comparisons: [],
  mustKnow: [],
  studyToRemember: [],
  testYourself: [],
  processesOrSteps: [
    { name: "Fetch-decode-execute", steps: ["fetch", "decode", "execute"] },
  ],
  recommendedFormats: ["OUTLINE"],
};

describe("Phase 2E-1 feature flag", () => {
  const original = process.env.STUDY_HAUL_CORE_KNOWLEDGE_BRIDGE;
  const originalE2e = process.env.E2E_MODE;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.STUDY_HAUL_CORE_KNOWLEDGE_BRIDGE;
    } else {
      process.env.STUDY_HAUL_CORE_KNOWLEDGE_BRIDGE = original;
    }
    if (originalE2e === undefined) {
      delete process.env.E2E_MODE;
    } else {
      process.env.E2E_MODE = originalE2e;
    }
  });

  it("defaults OFF", () => {
    delete process.env.STUDY_HAUL_CORE_KNOWLEDGE_BRIDGE;
    delete process.env.E2E_MODE;
    expect(isCoreKnowledgeBridgeEnabled()).toBe(false);
  });

  it("enables for 1/true/on/yes", () => {
    delete process.env.E2E_MODE;
    process.env.STUDY_HAUL_CORE_KNOWLEDGE_BRIDGE = "1";
    expect(isCoreKnowledgeBridgeEnabled()).toBe(true);
  });

  it("enables when E2E_MODE is on", () => {
    delete process.env.STUDY_HAUL_CORE_KNOWLEDGE_BRIDGE;
    process.env.E2E_MODE = "1";
    expect(isCoreKnowledgeBridgeEnabled()).toBe(true);
  });
});

describe("candidate extraction + normalization", () => {
  it("normalizes titles conservatively", () => {
    expect(normalizeConceptTitle("  Inheritance!! ")).toBe("inheritance");
    expect(normalizeConceptTitle("Fetch–decode–execute")).toBe(
      "fetch decode execute",
    );
    expect(normalizeConceptTitle("Fetch-decode-execute")).toBe(
      "fetch-decode-execute",
    );
  });

  it("extracts definitions first and caps candidates", () => {
    const manyDefs: ChapterStudyExtract = {
      ...sampleExtract,
      definitions: Array.from({ length: 20 }, (_, i) => ({
        term: `Term ${i}`,
        definition: `Def ${i}`,
      })),
      learningObjectives: [],
      frameworks: [],
      processesOrSteps: [],
    };
    const candidates = extractKnowledgeCandidatesFromStudyExtract(manyDefs);
    expect(candidates.length).toBe(CORE_KNOWLEDGE_CANDIDATE_CAP);
    expect(candidates[0]!.sourceType).toBe("definition");
  });

  it("includes LO / framework / process and prefers topic concept", () => {
    const candidates = extractKnowledgeCandidatesFromStudyExtract(sampleExtract, {
      topicConcept: { id: "c-topic", title: "Inheritance" },
    });
    expect(candidates.some((c) => c.sourceType === "topic_concept")).toBe(true);
    expect(candidates.some((c) => c.sourceType === "definition")).toBe(true);
    expect(candidates.some((c) => c.sourceType === "framework")).toBe(true);
    expect(candidates.some((c) => c.sourceType === "process")).toBe(true);
    // Deduped Inheritance from topic + definition
    const inheritance = candidates.filter(
      (c) => c.normalizedTitle === "inheritance",
    );
    expect(inheritance).toHaveLength(1);
    expect(inheritance[0]!.existingConceptId).toBe("c-topic");
  });

  it("preserves unrelated metadata when merging learningKnowledge", () => {
    const doc = emptyDocument();
    doc.metadata = {
      chapterStudyExtract: sampleExtract,
      guideDismissed: true,
      materialSummary: "keep me",
    };
    const next = mergeLearningKnowledgeIntoDocument(doc, {
      ...emptyLearningKnowledgeMeta(),
      linkedConceptIds: ["c1"],
      confirmedAt: "2026-01-01T00:00:00.000Z",
    });
    expect(next.metadata?.guideDismissed).toBe(true);
    expect(next.metadata?.materialSummary).toBe("keep me");
    expect(next.metadata?.chapterStudyExtract?.title).toBe("OOP");
    expect(next.metadata?.learningKnowledge?.linkedConceptIds).toEqual(["c1"]);
  });

  it("reads learningKnowledge safely when missing", () => {
    expect(readLearningKnowledgeMeta(undefined).linkedConceptIds).toEqual([]);
  });
});

describe("preview / confirm / reject", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STUDY_HAUL_CORE_KNOWLEDGE_BRIDGE = "1";
    mockLearningSpaceFindFirst.mockResolvedValue(null);
    mockConceptFindMany.mockResolvedValue([]);
    mockConceptFindFirst.mockResolvedValue(null);
    mockConceptCreate.mockResolvedValue({
      id: "concept-new",
      title: "Polymorphism",
    });
    mockNoteUpdate.mockResolvedValue({});
  });

  afterEach(() => {
    delete process.env.STUDY_HAUL_CORE_KNOWLEDGE_BRIDGE;
  });

  function noteWithExtract(extraMeta: Record<string, unknown> = {}) {
    const doc = emptyDocument();
    doc.metadata = {
      chapterStudyExtract: sampleExtract,
      luckyOutcomeTarget: { topic: "keep" },
      ...extraMeta,
    };
    return {
      id: "note-1",
      userId: "user-1",
      courseId: "course-1",
      topicId: null,
      materialId: null,
      contentJson: JSON.stringify(doc),
      topic: null,
    };
  }

  it("flag OFF preview returns enabled false without creating Concepts", async () => {
    delete process.env.STUDY_HAUL_CORE_KNOWLEDGE_BRIDGE;
    const preview = await previewCoreKnowledgeBridge({
      userId: "user-1",
      noteId: "note-1",
    });
    expect(preview.enabled).toBe(false);
    expect(mockNoteFindFirst).not.toHaveBeenCalled();
    expect(mockConceptCreate).not.toHaveBeenCalled();
  });

  it("preview proposes candidates without creating Concepts or LearningSpaces", async () => {
    mockNoteFindFirst.mockResolvedValue(noteWithExtract());
    const preview = await previewCoreKnowledgeBridge({
      userId: "user-1",
      noteId: "note-1",
    });
    expect(preview.enabled).toBe(true);
    expect(preview.hasStudyExtract).toBe(true);
    expect(preview.candidates.length).toBeGreaterThan(0);
    expect(mockConceptCreate).not.toHaveBeenCalled();
    // findExisting only — never ensure/create LearningSpace
    expect(mockLearningSpaceFindFirst).toHaveBeenCalled();
  });

  it("reuses existing Concept on confirm and preserves unrelated metadata", async () => {
    mockNoteFindFirst.mockResolvedValue(noteWithExtract());
    mockConceptFindMany.mockResolvedValue([
      { id: "concept-poly", title: "Polymorphism" },
    ]);
    mockConceptFindFirst.mockResolvedValue({ id: "concept-poly" });

    const result = await confirmCoreKnowledgeCandidate({
      userId: "user-1",
      noteId: "note-1",
      candidateKey: "definition:polymorphism",
    });

    expect(result.created).toBe(false);
    expect(result.conceptId).toBe("concept-poly");
    expect(mockConceptCreate).not.toHaveBeenCalled();
    expect(mockNoteUpdate).toHaveBeenCalled();
    const saved = JSON.parse(
      mockNoteUpdate.mock.calls[0][0].data.contentJson as string,
    );
    expect(saved.metadata.luckyOutcomeTarget.topic).toBe("keep");
    expect(saved.metadata.learningKnowledge.linkedConceptIds).toContain(
      "concept-poly",
    );
  });

  it("creates owned Concept when none exists", async () => {
    mockNoteFindFirst.mockResolvedValue(noteWithExtract());
    mockConceptFindMany.mockResolvedValue([]);
    mockConceptFindFirst.mockResolvedValue(null);

    const result = await confirmCoreKnowledgeCandidate({
      userId: "user-1",
      noteId: "note-1",
      candidateKey: "definition:polymorphism",
    });

    expect(result.created).toBe(true);
    expect(mockConceptCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "user-1",
          title: "Polymorphism",
        }),
      }),
    );
  });

  it("rejects candidate without creating Concepts", async () => {
    mockNoteFindFirst.mockResolvedValue(noteWithExtract());
    await rejectCoreKnowledgeCandidate({
      userId: "user-1",
      noteId: "note-1",
      candidateKey: "definition:polymorphism",
    });
    expect(mockConceptCreate).not.toHaveBeenCalled();
    const saved = JSON.parse(
      mockNoteUpdate.mock.calls[0][0].data.contentJson as string,
    );
    const rejected = saved.metadata.learningKnowledge.candidateConcepts.find(
      (c: { key: string }) => c.key === "definition:polymorphism",
    );
    expect(rejected.status).toBe("rejected");
  });
});

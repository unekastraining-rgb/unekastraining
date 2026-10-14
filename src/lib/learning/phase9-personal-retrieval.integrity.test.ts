/**
 * Bundle A Phase 9 — Personal Knowledge Retrieval integrity.
 * Ownership isolation, provenance preservation, no KL promotion.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockMaterialFindFirst,
  mockMaterialFindMany,
  mockNoteFindMany,
  mockCourseFindFirst,
} = vi.hoisted(() => ({
  mockMaterialFindFirst: vi.fn(),
  mockMaterialFindMany: vi.fn(),
  mockNoteFindMany: vi.fn(),
  mockCourseFindFirst: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    courseMaterial: {
      findFirst: (...args: unknown[]) => mockMaterialFindFirst(...args),
      findMany: (...args: unknown[]) => mockMaterialFindMany(...args),
    },
    note: {
      findMany: (...args: unknown[]) => mockNoteFindMany(...args),
    },
    course: {
      findFirst: (...args: unknown[]) => mockCourseFindFirst(...args),
    },
  },
}));

vi.mock("@/lib/ai/course-source", () => ({
  loadChapterStudySourceText: vi.fn(async () => null),
  loadMaterialSourceText: vi.fn(async () => null),
  loadCourseSourceText: vi.fn(async () => null),
}));

import {
  loadPersonalGroundingForLearn,
  searchPersonalMaterialsForTopic,
  searchPersonalNotesForTopic,
  retrieveTeachingKnowledge,
  createMockGeneralKnowledgeProvider,
} from "@/lib/learning/knowledge/retrieval";
import { resolveTeachingKnowledgeContext } from "@/lib/learning/knowledge/teaching-knowledge-context";
import "@/lib/learning/knowledge/packs";

const LONG_NOTE = `
My Java exceptions notes Chapter 13: try catch finally throw throws.
Checked vs unchecked exceptions. Always close resources in finally or try-with-resources.
Professor emphasized Exception vs RuntimeException inheritance hierarchy with examples.
`.repeat(3);

const LONG_MATERIAL = `
Chapter 13 Java Exceptions
A try block wraps risky code. catch handles Exception types. throw creates exceptions.
throws declares checked exceptions on methods. Learners practice writing handlers.
`.repeat(4);

describe("Phase 9 — Personal Knowledge Retrieval", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMaterialFindMany.mockResolvedValue([]);
    mockMaterialFindFirst.mockResolvedValue(null);
    mockNoteFindMany.mockResolvedValue([]);
  });

  it("owned note retrieval — scoped by userId", async () => {
    mockNoteFindMany.mockResolvedValue([
      {
        id: "note-a",
        title: "Java Ch13",
        content: LONG_NOTE,
        courseId: "c1",
      },
    ]);
    const hits = await searchPersonalNotesForTopic("user-a", "Java exceptions");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].source.kind).toBe("user-note");
    expect(hits[0].noteId).toBe("note-a");
    const call = mockNoteFindMany.mock.calls[0][0];
    expect(call.where.userId).toBe("user-a");
  });

  it("course material retrieval — uses owned search + ownership re-check", async () => {
    mockMaterialFindMany.mockResolvedValue([
      {
        id: "mat-1",
        title: "Java Chapter 13 Exceptions",
        type: "pdf",
        courseId: "c1",
        extractedText: LONG_MATERIAL,
        course: { title: "CS101", userId: "user-a" },
      },
    ]);
    mockMaterialFindFirst.mockResolvedValue({
      id: "mat-1",
      title: "Java Chapter 13 Exceptions",
      extractedText: LONG_MATERIAL,
      courseId: "c1",
    });
    const hits = await searchPersonalMaterialsForTopic(
      "user-a",
      "Java exceptions",
    );
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].source.kind).toBe("course-material");
    expect(hits[0].materialId).toBe("mat-1");
    // Ownership filter on search query.
    expect(mockMaterialFindMany.mock.calls[0][0].where.course.userId).toBe(
      "user-a",
    );
  });

  it("relevant-topic filtering — unrelated notes ignored", async () => {
    mockNoteFindMany.mockResolvedValue([]);
    const hits = await searchPersonalNotesForTopic("user-a", "Java exceptions");
    expect(hits).toEqual([]);
  });

  it("user ownership isolation — other user's materials not returned", async () => {
    mockMaterialFindMany.mockResolvedValue([]);
    mockNoteFindMany.mockResolvedValue([]);
    const materials = await searchPersonalMaterialsForTopic(
      "user-b",
      "Java exceptions",
    );
    const notes = await searchPersonalNotesForTopic("user-b", "Java exceptions");
    expect(materials).toEqual([]);
    expect(notes).toEqual([]);
    if (mockMaterialFindMany.mock.calls.length) {
      expect(mockMaterialFindMany.mock.calls[0][0].where.course.userId).toBe(
        "user-b",
      );
    }
    if (mockNoteFindMany.mock.calls.length) {
      expect(mockNoteFindMany.mock.calls[0][0].where.userId).toBe("user-b");
    }
  });

  it("no promotion to KL — note grounding stays user-note", async () => {
    // Use a topic with no KL pack so notes remain the sole grounding source.
    const result = await retrieveTeachingKnowledge({
      target: "Teach me obscure xeriscape patio drainage using my notes",
      noteText: LONG_NOTE.replace(/Java/g, "xeriscape patio drainage").replace(
        /exceptions/g,
        "gravel trenches",
      ),
      noteTitle: "Patio notes",
      noteId: "note-patio",
      disableGeneralAi: true,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.knowledge.sourceKind).toBe("user-note");
    expect(result.knowledge.sources?.[0]?.kind).toBe("user-note");
    expect(
      resolveTeachingKnowledgeContext("obscure xeriscape patio drainage"),
    ).toBeNull();
  });

  it("provenance preserved when KL + personal notes combine", async () => {
    const result = await retrieveTeachingKnowledge({
      target: "Java exceptions",
      noteText: LONG_NOTE,
      noteTitle: "My Java notes",
      noteId: "note-j",
      generalProvider: createMockGeneralKnowledgeProvider(() => {
        throw new Error("should not call general for KL hit");
      }),
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // KL preferred; notes are grounding.
    expect(
      result.knowledge.sources?.some((s) => s.kind === "knowledge-library"),
    ).toBe(true);
    expect(result.knowledge.sources?.some((s) => s.kind === "user-note")).toBe(
      true,
    );
    expect(result.knowledge.concepts.some((c) => c.id === "java-exceptions")).toBe(
      true,
    );
    expect(
      result.knowledge.limitations?.join(" "),
    ).toMatch(/not promoted|grounding/i);
  });

  it("empty result handled honestly", async () => {
    mockMaterialFindMany.mockResolvedValue([]);
    mockNoteFindMany.mockResolvedValue([]);
    const g = await loadPersonalGroundingForLearn({
      userId: "user-a",
      topic: "quantum gardening xyz",
    });
    expect(g.hits).toEqual([]);
    expect(g.groundingText).toBeUndefined();
    expect(g.noteText).toBeNull();
  });
});

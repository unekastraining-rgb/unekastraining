import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockLearningSpaceFindFirst,
  mockConceptFindFirst,
  mockGetLearnerConceptMastery,
} = vi.hoisted(() => ({
  mockLearningSpaceFindFirst: vi.fn(),
  mockConceptFindFirst: vi.fn(),
  mockGetLearnerConceptMastery: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    learningSpace: { findFirst: mockLearningSpaceFindFirst },
    concept: { findFirst: mockConceptFindFirst },
  },
}));

vi.mock("@/lib/learning/learner-model/read", () => ({
  getLearnerConceptMastery: mockGetLearnerConceptMastery,
}));

import { loadTutorContext } from "@/lib/learning/tutor/context";

describe("Tutor Learner Model + Knowledge Model context", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reads concept mastery when present", async () => {
    mockLearningSpaceFindFirst.mockResolvedValue(null);
    mockConceptFindFirst.mockResolvedValue({
      id: "concept-1",
      title: "Inheritance",
      subjectDomain: "programming",
    });
    mockGetLearnerConceptMastery.mockResolvedValue({
      learnerId: "user-1",
      conceptId: "concept-1",
      conceptTitle: "Inheritance",
      facets: {
        recognize: 0.7,
        explain: 0.4,
        apply: 0.2,
        solve: 0,
        perform: 0,
        retain: 0.3,
      },
      topicMastery: null,
      recentMissedCount: 1,
      evidenceSourceCounts: {
        quiz: 2,
        flashcard: 0,
        study_evaluate: 0,
        other: 0,
      },
      reviewCount: 3,
      lastReviewedAt: null,
      nextReviewAt: null,
    });

    const ctx = await loadTutorContext({
      learnerId: "user-1",
      mode: "TEACH_ME",
      message: "Explain inheritance",
      conceptIds: ["concept-1"],
    });

    expect(ctx.usedKnowledgeModel).toBe(true);
    expect(ctx.usedLearnerModel).toBe(true);
    expect(ctx.conceptIds).toEqual(["concept-1"]);
    expect(ctx.conceptTitles).toEqual(["Inheritance"]);
    expect(ctx.contextBlock).toMatch(/Inheritance/);
    expect(ctx.contextBlock).toMatch(/explain 0\.40/);
    expect(mockConceptFindFirst).toHaveBeenCalledWith({
      where: { id: "concept-1", userId: "user-1" },
      select: { id: true, title: true, subjectDomain: true },
    });
  });

  it("handles missing learner mastery safely", async () => {
    mockConceptFindFirst.mockResolvedValue({
      id: "concept-2",
      title: "Photosynthesis",
      subjectDomain: "biology",
    });
    mockGetLearnerConceptMastery.mockResolvedValue(null);

    const ctx = await loadTutorContext({
      learnerId: "user-1",
      mode: "BEGINNER",
      message: "What is it?",
      conceptIds: ["concept-2"],
    });

    expect(ctx.usedKnowledgeModel).toBe(true);
    expect(ctx.usedLearnerModel).toBe(false);
    expect(ctx.masterySummaries).toEqual([]);
    expect(ctx.contextBlock).toMatch(/limited or unavailable/i);
  });

  it("preserves supplied concept when known and skips unknown without inventing", async () => {
    mockConceptFindFirst
      .mockResolvedValueOnce({
        id: "known",
        title: "Known Concept",
        subjectDomain: "math",
      })
      .mockResolvedValueOnce(null);

    mockGetLearnerConceptMastery.mockResolvedValue(null);

    const ctx = await loadTutorContext({
      learnerId: "user-1",
      mode: "GUIDED",
      message: "help",
      conceptIds: ["known", "junk-or-foreign"],
    });

    expect(ctx.conceptIds).toEqual(["known"]);
    expect(ctx.conceptTitles).toEqual(["Known Concept"]);
    expect(mockConceptFindFirst).toHaveBeenCalledTimes(2);
  });

  it("degrades gracefully when context loading throws", async () => {
    mockLearningSpaceFindFirst.mockRejectedValue(new Error("db down"));
    mockConceptFindFirst.mockRejectedValue(new Error("db down"));

    const ctx = await loadTutorContext({
      learnerId: "user-1",
      mode: "GUIDED",
      message: "help",
      learningSpaceId: "space-1",
      conceptIds: ["c1"],
    });

    expect(ctx.conceptIds).toEqual([]);
    expect(ctx.usedLearnerModel).toBe(false);
  });
});

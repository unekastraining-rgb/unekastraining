import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockLearnerProfileUpsert,
  mockTopicFindFirst,
  mockTopicUpdate,
  mockLearningSpaceFindUnique,
  mockCourseFindFirst,
  mockLearningSpaceCreate,
  mockConceptCreate,
  mockLearningObjectFindFirst,
  mockLearningObjectCreate,
  mockLearningAttemptCreate,
  mockConceptMasteryFindUnique,
  mockConceptMasteryUpsert,
  mockLearningAttemptFindMany,
  mockMissedQuestionCount,
  mockConceptFindFirst,
} = vi.hoisted(() => ({
  mockLearnerProfileUpsert: vi.fn(),
  mockTopicFindFirst: vi.fn(),
  mockTopicUpdate: vi.fn(),
  mockLearningSpaceFindUnique: vi.fn(),
  mockCourseFindFirst: vi.fn(),
  mockLearningSpaceCreate: vi.fn(),
  mockConceptCreate: vi.fn(),
  mockLearningObjectFindFirst: vi.fn(),
  mockLearningObjectCreate: vi.fn(),
  mockLearningAttemptCreate: vi.fn(),
  mockConceptMasteryFindUnique: vi.fn(),
  mockConceptMasteryUpsert: vi.fn(),
  mockLearningAttemptFindMany: vi.fn(),
  mockMissedQuestionCount: vi.fn(),
  mockConceptFindFirst: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    learnerProfile: { upsert: mockLearnerProfileUpsert },
    topic: { findFirst: mockTopicFindFirst, update: mockTopicUpdate },
    learningSpace: {
      findUnique: mockLearningSpaceFindUnique,
      create: mockLearningSpaceCreate,
      findFirst: vi.fn(),
    },
    course: { findFirst: mockCourseFindFirst },
    concept: { create: mockConceptCreate, findFirst: mockConceptFindFirst },
    learningObject: {
      findFirst: mockLearningObjectFindFirst,
      create: mockLearningObjectCreate,
    },
    learningAttempt: {
      create: mockLearningAttemptCreate,
      findMany: mockLearningAttemptFindMany,
    },
    conceptMastery: {
      findUnique: mockConceptMasteryFindUnique,
      upsert: mockConceptMasteryUpsert,
    },
    missedQuestion: { count: mockMissedQuestionCount },
    retentionItem: {
      upsert: vi.fn().mockResolvedValue({ id: "ri-mock" }),
      findUnique: vi.fn().mockResolvedValue(null),
      update: vi.fn(),
    },
  },
}));

import { applySm2Review } from "@/lib/academic";
import { recordFlashcardReviewEvidence } from "@/lib/learning/assessment/flashcard-bridge";
import {
  mapStudyEvaluateToLearningSignals,
  recordStudyEvaluateEvidence,
} from "@/lib/learning/assessment/evaluate-bridge";
import { getLearnerConceptMastery } from "@/lib/learning/learner-model/read";
import { readFileSync } from "node:fs";
import path from "node:path";

describe("ULE flashcard bridge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLearnerProfileUpsert.mockResolvedValue({ id: "lp-1" });
    mockTopicFindFirst.mockResolvedValue({
      id: "topic-1",
      name: "Osmosis",
      description: null,
      courseId: "course-1",
      conceptId: null,
      concept: null,
      course: {
        id: "course-1",
        userId: "user-1",
        title: "Bio",
        description: null,
        subject: "Biology",
      },
    });
    mockLearningSpaceFindUnique.mockResolvedValue(null);
    mockCourseFindFirst.mockResolvedValue({
      id: "course-1",
      userId: "user-1",
      title: "Bio",
      description: null,
      subject: "Biology",
    });
    mockLearningSpaceCreate.mockResolvedValue({
      id: "space-1",
      kind: "COURSE",
      courseId: "course-1",
    });
    mockConceptCreate.mockResolvedValue({
      id: "concept-1",
      title: "Osmosis",
      learningSpaceId: "space-1",
    });
    mockTopicUpdate.mockResolvedValue({});
    mockLearningObjectFindFirst.mockResolvedValue(null);
    mockLearningObjectCreate.mockResolvedValue({
      id: "lo-fc-1",
      type: "FLASHCARD",
      skillFacet: "RETAIN",
    });
    mockLearningAttemptCreate.mockResolvedValue({ id: "la-fc-1" });
    mockConceptMasteryFindUnique.mockResolvedValue(null);
    mockConceptMasteryUpsert.mockResolvedValue({
      id: "cm-1",
      retain: 0.1,
      recognize: 0,
    });
  });

  it("creates FLASHCARD LearningObject and RETAIN evidence on review", async () => {
    const result = await recordFlashcardReviewEvidence({
      userId: "user-1",
      flashcard: { id: "fc-1", front: "Define osmosis", topicId: "topic-1" },
      rating: "EASY",
    });

    expect(result.recorded).toBe(true);
    expect(result.conceptId).toBe("concept-1");
    expect(mockLearningObjectCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: "FLASHCARD",
        skillFacet: "RETAIN",
        conceptIdsJson: JSON.stringify(["concept-1"]),
      }),
    });
    expect(mockLearningAttemptCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        learningObjectId: "lo-fc-1",
        conceptId: "concept-1",
        skillFacet: "RETAIN",
        outcome: "SUCCESS",
      }),
    });
    expect(mockConceptMasteryUpsert).toHaveBeenCalled();
  });

  it("maps AGAIN to FAIL retain evidence", async () => {
    await recordFlashcardReviewEvidence({
      userId: "user-1",
      flashcard: { id: "fc-1", front: "Define osmosis", topicId: "topic-1" },
      rating: "AGAIN",
    });

    expect(mockLearningAttemptCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        outcome: "FAIL",
        misconceptionSignalsJson: JSON.stringify(["flashcard_again"]),
      }),
    });
  });

  it("refuses to invent a Concept without topicId", async () => {
    const result = await recordFlashcardReviewEvidence({
      userId: "user-1",
      flashcard: { id: "fc-1", front: "x", topicId: "" },
      rating: "GOOD",
    });
    expect(result.recorded).toBe(false);
    expect(mockLearningAttemptCreate).not.toHaveBeenCalled();
  });

  it("does not change SM-2 math (applySm2Review remains pure and independent)", () => {
    const before = { difficulty: 2.5, interval: 1, repetitions: 0 };
    const after = applySm2Review(before, "GOOD");
    expect(after.repetitions).toBe(1);
    expect(after.interval).toBe(1);
    expect(after.nextReviewAt).toBeInstanceOf(Date);
  });
});

describe("ULE study evaluate bridge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLearnerProfileUpsert.mockResolvedValue({ id: "lp-1" });
    mockTopicFindFirst.mockResolvedValue({
      id: "topic-1",
      name: "Exceptions",
      description: null,
      courseId: "course-1",
      conceptId: "concept-1",
      concept: {
        id: "concept-1",
        title: "Exceptions",
        learningSpaceId: "space-1",
      },
      course: {
        id: "course-1",
        userId: "user-1",
        title: "Java",
        description: null,
        subject: "CS",
      },
    });
    mockLearningObjectFindFirst.mockResolvedValue(null);
    mockLearningObjectCreate.mockResolvedValue({
      id: "lo-eval-1",
      type: "FEYNMAN",
    });
    mockLearningAttemptCreate.mockResolvedValue({ id: "la-eval-1" });
    mockConceptMasteryFindUnique.mockResolvedValue(null);
    mockConceptMasteryUpsert.mockResolvedValue({
      id: "cm-1",
      explain: 0.1,
      retain: 0,
    });
  });

  it("maps modes to conservative facets", () => {
    expect(mapStudyEvaluateToLearningSignals({ mode: "blurting" })).toEqual({
      type: "ACTIVE_RECALL",
      skillFacet: "RETAIN",
      sixTechnique: "active_recall",
    });
    expect(mapStudyEvaluateToLearningSignals({ mode: "teach-me" })).toEqual({
      type: "FEYNMAN",
      skillFacet: "EXPLAIN",
      sixTechnique: "feynman",
    });
    expect(
      mapStudyEvaluateToLearningSignals({
        mode: "six",
        sixComponent: "hands-on-practice",
      }),
    ).toEqual({
      type: "HANDS_ON_PRACTICE",
      skillFacet: "APPLY",
      sixTechnique: "hands_on_practice",
    });
    expect(
      mapStudyEvaluateToLearningSignals({
        mode: "six",
        sixComponent: "chunking",
      }).skillFacet,
    ).toBe("RECOGNIZE");
  });

  it("teach-me produces EXPLAIN evidence linked to Concept", async () => {
    const result = await recordStudyEvaluateEvidence({
      userId: "user-1",
      mode: "teach-me",
      topicId: "topic-1",
      scoreRatio: 0.85,
      misconceptions: ["confuses checked/unchecked"],
      gaps: ["RuntimeException"],
    });

    expect(result.recorded).toBe(true);
    expect(result.conceptId).toBe("concept-1");
    expect(result.attemptId).toBe("la-eval-1");
    expect(mockLearningObjectCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: "FEYNMAN",
        skillFacet: "EXPLAIN",
      }),
    });
    expect(mockLearningAttemptCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        learningObjectId: "lo-eval-1",
        skillFacet: "EXPLAIN",
        outcome: "SUCCESS",
        conceptId: "concept-1",
      }),
    });
    expect(mockConceptMasteryUpsert).toHaveBeenCalled();
  });

  it("skips recording when topicId is missing (no invented Concept)", async () => {
    const result = await recordStudyEvaluateEvidence({
      userId: "user-1",
      mode: "blurting",
      topicId: null,
      scoreRatio: 0.9,
    });
    expect(result.recorded).toBe(false);
    expect(result.attemptId).toBeNull();
    expect(result.reason).toMatch(/refusing to invent/i);
    expect(mockLearningAttemptCreate).not.toHaveBeenCalled();
  });
});

describe("ULE learner model multi-source read", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reflects flashcard and evaluate evidence source counts", async () => {
    mockConceptFindFirst.mockResolvedValue({
      id: "concept-1",
      title: "Exceptions",
      userId: "user-1",
    });
    mockConceptMasteryFindUnique.mockResolvedValue({
      recognize: 0.2,
      explain: 0.3,
      apply: 0,
      solve: 0,
      perform: 0,
      retain: 0.4,
      confidence: 0.25,
      reviewCount: 5,
      lastReviewedAt: new Date(),
      nextReviewAt: null,
    });
    mockTopicFindFirst.mockResolvedValue({
      id: "topic-1",
      conceptId: "concept-1",
      masteries: [
        {
          topicId: "topic-1",
          proficiency: 0.5,
          confidence: 0.4,
          understanding: 0.4,
          recall: 0.5,
          application: 0.2,
        },
      ],
    });
    mockMissedQuestionCount.mockResolvedValue(0);
    mockLearningAttemptFindMany.mockResolvedValue([
      { sourceRefJson: JSON.stringify({ kind: "quiz_attempt" }) },
      { sourceRefJson: JSON.stringify({ kind: "flashcard_review" }) },
      { sourceRefJson: JSON.stringify({ kind: "study_evaluate" }) },
      { sourceRefJson: JSON.stringify({ kind: "flashcard_review" }) },
    ]);

    const summary = await getLearnerConceptMastery("user-1", "concept-1");
    expect(summary?.facets.retain).toBe(0.4);
    expect(summary?.facets.explain).toBe(0.3);
    expect(summary?.evidenceSourceCounts).toEqual({
      quiz: 1,
      flashcard: 2,
      study_evaluate: 1,
      other: 0,
    });
  });
});

describe("ULE 2B-1 route preservation", () => {
  it("keeps SM-2 + TopicMastery on flashcards and isolates ULE errors", () => {
    const source = readFileSync(
      path.join(process.cwd(), "app/api/flashcards/route.ts"),
      "utf8",
    );
    expect(source).toContain("applySm2Review");
    expect(source).toContain("updateTopicMasteryFromReview");
    expect(source).toContain("recordFlashcardReviewEvidence");
    expect(source).toContain("ULE flashcard evidence bridge failed");
  });

  it("keeps Study Evaluate scoring and isolates ULE errors", () => {
    const source = readFileSync(
      path.join(process.cwd(), "app/api/study/evaluate/route.ts"),
      "utf8",
    );
    expect(source).toContain("updateTopicMastery");
    expect(source).toContain("recordStudyEvaluateEvidence");
    expect(source).toContain("ULE study-evaluate evidence bridge failed");
    // Scoring response always includes evaluation; adaptive payload is additive only.
    expect(source).toContain("success: true");
    expect(source).toContain("data: evaluation");
    expect(source).toContain("adaptivePayload");
  });

  it("does not touch CORE / SIX / LUCKY product modules in this phase", () => {
    // Sanity: bridges live under learning/assessment only.
    const flashcardBridge = readFileSync(
      path.join(
        process.cwd(),
        "src/lib/learning/assessment/flashcard-bridge.ts",
      ),
      "utf8",
    );
    const evaluateBridge = readFileSync(
      path.join(
        process.cwd(),
        "src/lib/learning/assessment/evaluate-bridge.ts",
      ),
      "utf8",
    );
    expect(flashcardBridge).not.toMatch(/CoreNotesWorkspace|lucky-engine|six-guides/);
    expect(evaluateBridge).not.toMatch(/CoreNotesWorkspace|lucky-engine/);
  });
});

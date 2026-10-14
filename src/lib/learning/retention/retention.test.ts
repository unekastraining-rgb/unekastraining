import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  defaultPriorityForSource,
  nextReviewAtForOutcome,
  statusForDueAt,
} from "@/lib/learning/retention/schedule";

const {
  mockUpsert,
  mockFindMany,
  mockFindFirst,
  mockUpdate,
  mockCount,
  mockMissedFindMany,
  mockFlashFindMany,
  mockMasteryFindMany,
  mockMasteryFindUnique,
  mockTopicFindFirst,
  mockTopicUpdate,
  mockLearningSpaceFindUnique,
  mockCourseFindFirst,
  mockLearningSpaceCreate,
  mockConceptCreate,
} = vi.hoisted(() => ({
  mockUpsert: vi.fn(),
  mockFindMany: vi.fn(),
  mockFindFirst: vi.fn(),
  mockUpdate: vi.fn(),
  mockCount: vi.fn(),
  mockMissedFindMany: vi.fn(),
  mockFlashFindMany: vi.fn(),
  mockMasteryFindMany: vi.fn(),
  mockMasteryFindUnique: vi.fn(),
  mockTopicFindFirst: vi.fn(),
  mockTopicUpdate: vi.fn(),
  mockLearningSpaceFindUnique: vi.fn(),
  mockCourseFindFirst: vi.fn(),
  mockLearningSpaceCreate: vi.fn(),
  mockConceptCreate: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    retentionItem: {
      upsert: mockUpsert,
      findMany: mockFindMany,
      findFirst: mockFindFirst,
      findUnique: mockMasteryFindUnique,
      update: mockUpdate,
      count: mockCount,
    },
    missedQuestion: { findMany: mockMissedFindMany },
    flashcard: { findMany: mockFlashFindMany },
    conceptMastery: {
      findMany: mockMasteryFindMany,
      findUnique: mockMasteryFindUnique,
    },
    topic: { findFirst: mockTopicFindFirst, update: mockTopicUpdate },
    learningSpace: {
      findUnique: mockLearningSpaceFindUnique,
      create: mockLearningSpaceCreate,
      findFirst: vi.fn(),
    },
    course: { findFirst: mockCourseFindFirst },
    concept: { create: mockConceptCreate, findFirst: vi.fn() },
  },
}));

import {
  findDueRetentionItems,
  findPriorityRetentionItems,
  recordRetentionOutcome,
  upsertRetentionItem,
} from "@/lib/learning/retention/service";
import {
  syncFlashcardRetentionItem,
  syncMissedQuestionRetentionItem,
  syncWeakMasteryRetentionItem,
} from "@/lib/learning/retention/bridges";

describe("RetentionItem schedule helpers", () => {
  it("computes next review from outcomes without FSRS/SM-2 replacement", () => {
    const from = new Date("2026-01-01T00:00:00Z");
    const success = nextReviewAtForOutcome("SUCCESS", from);
    const fail = nextReviewAtForOutcome("FAIL", from);
    expect(success.getTime() - from.getTime()).toBe(72 * 60 * 60 * 1000);
    expect(fail.getTime() - from.getTime()).toBe(12 * 60 * 60 * 1000);
  });

  it("widens SUCCESS spacing after consecutive successes (2P-52)", () => {
    const from = new Date("2026-01-01T00:00:00Z");
    const second = nextReviewAtForOutcome("SUCCESS", from, {
      priorSuccessStreak: 1,
    });
    expect(second.getTime() - from.getTime()).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it("marks past dueAt as DUE", () => {
    expect(statusForDueAt(new Date(Date.now() - 1000))).toBe("DUE");
    expect(statusForDueAt(new Date(Date.now() + 60_000))).toBe("ACTIVE");
  });

  it("assigns source priorities with missed > weak > flashcard", () => {
    expect(defaultPriorityForSource("MISSED_QUESTION")).toBeGreaterThan(
      defaultPriorityForSource("WEAK_MASTERY"),
    );
    expect(defaultPriorityForSource("WEAK_MASTERY")).toBeGreaterThan(
      defaultPriorityForSource("FLASHCARD"),
    );
  });
});

describe("RetentionItem service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("upserts RetentionItem by unique source key", async () => {
    mockUpsert.mockResolvedValue({
      id: "ri-1",
      userId: "user-1",
      sourceType: "MISSED_QUESTION",
      sourceRef: "mq-1",
    });

    await upsertRetentionItem({
      userId: "user-1",
      sourceType: "MISSED_QUESTION",
      sourceRef: "mq-1",
      dueAt: new Date(),
    });

    expect(mockUpsert).toHaveBeenCalledWith({
      where: {
        userId_sourceType_sourceRef: {
          userId: "user-1",
          sourceType: "MISSED_QUESTION",
          sourceRef: "mq-1",
        },
      },
      create: expect.objectContaining({
        userId: "user-1",
        sourceType: "MISSED_QUESTION",
        sourceRef: "mq-1",
      }),
      update: expect.any(Object),
    });
  });

  it("selects due items ordered by priority then dueAt", async () => {
    mockFindMany.mockResolvedValue([]);
    await findDueRetentionItems("user-1", { limit: 10 });
    expect(mockFindMany).toHaveBeenCalledWith({
      where: expect.objectContaining({ userId: "user-1" }),
      orderBy: [{ priority: "desc" }, { dueAt: "asc" }],
      take: 10,
    });
  });

  it("finds priority retention items for the learner only", async () => {
    mockFindMany.mockResolvedValue([]);
    await findPriorityRetentionItems("user-a", { limit: 5 });
    expect(mockFindMany).toHaveBeenCalledWith({
      where: {
        userId: "user-a",
        status: { in: ["ACTIVE", "DUE"] },
      },
      orderBy: [{ priority: "desc" }, { dueAt: "asc" }],
      take: 5,
    });
  });

  it("records outcome and schedules next review", async () => {
    mockFindFirst.mockResolvedValue({
      id: "ri-1",
      userId: "user-1",
      reviewCount: 0,
    });
    mockUpdate.mockResolvedValue({ id: "ri-1", lastOutcome: "FAIL" });

    await recordRetentionOutcome({
      userId: "user-1",
      retentionItemId: "ri-1",
      outcome: "FAIL",
    });

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "ri-1" },
      data: expect.objectContaining({
        lastOutcome: "FAIL",
        reviewCount: { increment: 1 },
        dueAt: expect.any(Date),
      }),
    });
  });

  it("does not update another learner's retention item", async () => {
    mockFindFirst.mockResolvedValue(null);
    const result = await recordRetentionOutcome({
      userId: "user-b",
      retentionItemId: "ri-1",
      outcome: "SUCCESS",
    });
    expect(result).toBeNull();
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

describe("Retention bridges", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpsert.mockResolvedValue({ id: "ri-x" });
    mockTopicFindFirst.mockResolvedValue({
      id: "topic-1",
      name: "Loops",
      description: null,
      courseId: "course-1",
      conceptId: "concept-1",
      concept: {
        id: "concept-1",
        title: "Loops",
        learningSpaceId: "space-1",
      },
      course: {
        id: "course-1",
        userId: "user-1",
        title: "CS",
        description: null,
        subject: "CS",
      },
    });
  });

  it("MissedQuestion bridge upserts MISSED_QUESTION RetentionItem", async () => {
    await syncMissedQuestionRetentionItem({
      userId: "user-1",
      missedQuestionId: "mq-1",
      topicId: "topic-1",
      nextReviewAt: new Date("2026-01-02"),
    });
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId_sourceType_sourceRef: {
            userId: "user-1",
            sourceType: "MISSED_QUESTION",
            sourceRef: "mq-1",
          },
        },
      }),
    );
  });

  it("flashcard due bridge mirrors SM-2 nextReviewAt (does not replace SM-2)", async () => {
    const due = new Date("2026-01-03");
    await syncFlashcardRetentionItem({
      userId: "user-1",
      flashcardId: "fc-1",
      topicId: "topic-1",
      nextReviewAt: due,
    });
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          sourceType: "FLASHCARD",
          sourceRef: "fc-1",
          dueAt: due,
          metadataJson: expect.stringContaining("flashcard_sm2"),
        }),
      }),
    );
  });

  it("weak mastery bridge creates item only with evidence and weak retain", async () => {
    await syncWeakMasteryRetentionItem({
      userId: "user-1",
      conceptId: "concept-1",
      retain: 0.2,
      reviewCount: 3,
      nextReviewAt: new Date(),
    });
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId_sourceType_sourceRef: {
            userId: "user-1",
            sourceType: "WEAK_MASTERY",
            sourceRef: "concept-1",
          },
        },
      }),
    );

    mockUpsert.mockClear();
    const skipped = await syncWeakMasteryRetentionItem({
      userId: "user-1",
      conceptId: "concept-1",
      retain: 0.2,
      reviewCount: 0,
    });
    expect(skipped).toBeNull();
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("idempotent: same source upserts the same unique key twice", async () => {
    await syncMissedQuestionRetentionItem({
      userId: "user-1",
      missedQuestionId: "mq-1",
      topicId: "topic-1",
    });
    await syncMissedQuestionRetentionItem({
      userId: "user-1",
      missedQuestionId: "mq-1",
      topicId: "topic-1",
    });
    expect(mockUpsert).toHaveBeenCalledTimes(2);
    const keys = mockUpsert.mock.calls.map(
      (call) => call[0].where.userId_sourceType_sourceRef.sourceRef,
    );
    expect(keys).toEqual(["mq-1", "mq-1"]);
  });
});

describe("Phase 2C preservation", () => {
  it("Lucky API reads RetentionItem without rewriting Lucky UI", () => {
    const luckyApi = readFileSync(
      path.join(process.cwd(), "app/api/study/lucky/route.ts"),
      "utf8",
    );
    const luckyView = readFileSync(
      path.join(process.cwd(), "app/study/lucky/lucky-engine-view.tsx"),
      "utf8",
    );
    expect(luckyApi).toContain("syncRetentionSourcesForUser");
    expect(luckyApi).toContain("buildLuckySession");
    expect(luckyView).not.toContain("RetentionItem");
    expect(luckyView).toContain("Lucky Engine");
  });

  it("quiz / flashcard bridges are best-effort and preserve SM-2 / scoring paths", () => {
    const quiz = readFileSync(
      path.join(process.cwd(), "app/api/quizzes/[id]/submit/route.ts"),
      "utf8",
    );
    const flash = readFileSync(
      path.join(process.cwd(), "app/api/flashcards/route.ts"),
      "utf8",
    );
    expect(quiz).toContain("missedQuestion.create");
    expect(quiz).toContain("syncMissedQuestionRetentionItem");
    expect(quiz).toContain("quiz still saved");
    expect(flash).toContain("applySm2Review");
    expect(flash).toContain("syncFlashcardRetentionItem");
    expect(flash).toContain("review still saved");
  });

  it("schema keeps TopicMastery / Flashcard SM-2 / MissedQuestion", () => {
    const schema = readFileSync(
      path.join(process.cwd(), "prisma/schema.prisma"),
      "utf8",
    );
    expect(schema).toContain("model RetentionItem");
    expect(schema).toContain("model TopicMastery");
    expect(schema).toContain("model Flashcard");
    expect(schema).toContain("model MissedQuestion");
    expect(schema).toContain("contentJson");
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockLearnerProfileUpsert,
  mockLearningSpaceFindFirst,
  mockLearningSpaceFindUnique,
  mockLearningSpaceCreate,
  mockConceptCreate,
  mockConceptFindFirst,
  mockTopicFindFirst,
  mockTopicUpdate,
  mockCourseFindFirst,
  mockLearningObjectFindFirst,
  mockLearningObjectCreate,
  mockLearningAttemptCreate,
  mockConceptMasteryFindUnique,
  mockConceptMasteryUpsert,
  mockMissedQuestionCount,
} = vi.hoisted(() => ({
  mockLearnerProfileUpsert: vi.fn(),
  mockLearningSpaceFindFirst: vi.fn(),
  mockLearningSpaceFindUnique: vi.fn(),
  mockLearningSpaceCreate: vi.fn(),
  mockConceptCreate: vi.fn(),
  mockConceptFindFirst: vi.fn(),
  mockTopicFindFirst: vi.fn(),
  mockTopicUpdate: vi.fn(),
  mockCourseFindFirst: vi.fn(),
  mockLearningObjectFindFirst: vi.fn(),
  mockLearningObjectCreate: vi.fn(),
  mockLearningAttemptCreate: vi.fn(),
  mockConceptMasteryFindUnique: vi.fn(),
  mockConceptMasteryUpsert: vi.fn(),
  mockMissedQuestionCount: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    learnerProfile: { upsert: mockLearnerProfileUpsert },
    learningSpace: {
      findFirst: mockLearningSpaceFindFirst,
      findUnique: mockLearningSpaceFindUnique,
      create: mockLearningSpaceCreate,
    },
    concept: {
      create: mockConceptCreate,
      findFirst: mockConceptFindFirst,
    },
    topic: {
      findFirst: mockTopicFindFirst,
      update: mockTopicUpdate,
    },
    course: { findFirst: mockCourseFindFirst },
    learningObject: {
      findFirst: mockLearningObjectFindFirst,
      create: mockLearningObjectCreate,
    },
    learningAttempt: { create: mockLearningAttemptCreate, findMany: vi.fn().mockResolvedValue([]) },
    conceptMastery: {
      findUnique: mockConceptMasteryFindUnique,
      upsert: mockConceptMasteryUpsert,
    },
    retentionItem: {
      upsert: vi.fn().mockResolvedValue({ id: "ri-mock" }),
      findUnique: vi.fn().mockResolvedValue(null),
      update: vi.fn(),
    },
    missedQuestion: { count: mockMissedQuestionCount },
  },
}));

import { recordQuizAttemptEvidence } from "@/lib/learning/assessment/quiz-bridge";
import { createConcept } from "@/lib/learning/knowledge/concept";
import { getLearnerConceptMastery } from "@/lib/learning/learner-model/read";
import { createLearningSpace } from "@/lib/learning/learning-space";
import { ensureQuizQuestionLearningObject } from "@/lib/learning/learning-object/ensure";
import { applyEvidenceToMastery } from "@/lib/learning/mastery/apply";
import { buildEvidenceEnvelope } from "@/lib/learning/evidence/envelope";

describe("ULE LearningSpace / Concept foundations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a LearningSpace without a Course", async () => {
    mockLearningSpaceCreate.mockResolvedValue({
      id: "space-1",
      kind: "SELF_DIRECTED",
      courseId: null,
      title: "Hobby: Guitar",
    });

    const space = await createLearningSpace({
      userId: "user-1",
      kind: "SELF_DIRECTED",
      title: "Hobby: Guitar",
    });

    expect(space.courseId).toBeNull();
    expect(mockLearningSpaceCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        kind: "SELF_DIRECTED",
        courseId: null,
        title: "Hobby: Guitar",
      }),
    });
  });

  it("creates a Concept without a Course", async () => {
    mockConceptCreate.mockResolvedValue({
      id: "concept-1",
      title: "Multiplication",
      learningSpaceId: "space-1",
    });

    const concept = await createConcept({
      userId: "user-1",
      title: "Multiplication",
      learningSpaceId: "space-1",
    });

    expect(concept.title).toBe("Multiplication");
    expect(mockConceptCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: "Multiplication",
        learningSpaceId: "space-1",
      }),
    });
  });

  it("creates a LearningObject that references a Concept", async () => {
    mockLearningObjectFindFirst.mockResolvedValue(null);
    mockLearningObjectCreate.mockResolvedValue({
      id: "lo-1",
      type: "QUIZ_ITEM",
      conceptIdsJson: JSON.stringify(["concept-1"]),
    });

    const lo = await ensureQuizQuestionLearningObject({
      userId: "user-1",
      quizId: "quiz-1",
      questionId: "qq-1",
      prompt: "What is 2×3?",
      conceptId: "concept-1",
      learningSpaceId: "space-1",
    });

    expect(lo.id).toBe("lo-1");
    expect(mockLearningObjectCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: "QUIZ_ITEM",
        conceptIdsJson: JSON.stringify(["concept-1"]),
        skillFacet: "RECOGNIZE",
      }),
    });
  });
});

describe("ULE Evidence → Mastery → Learner Model", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("records evidence and updates a mastery facet", async () => {
    mockConceptMasteryFindUnique.mockResolvedValue(null);
    mockConceptMasteryUpsert.mockResolvedValue({
      id: "cm-1",
      recognize: 0.1,
      explain: 0,
      apply: 0,
      solve: 0,
      perform: 0,
      retain: 0.025,
      confidence: 0.05,
    });

    const envelope = buildEvidenceEnvelope({
      learnerId: "user-1",
      learningObjectId: "lo-1",
      conceptId: "concept-1",
      skillFacet: "RECOGNIZE",
      outcome: "SUCCESS",
      score: 1,
      sourceRef: { kind: "quiz_attempt", quizId: "quiz-1" },
    });

    mockLearningAttemptCreate.mockResolvedValue({ id: "attempt-ev-1" });

    const { recordEvidence } = await import("@/lib/learning/evidence/record");
    await recordEvidence(envelope);
    const mastery = await applyEvidenceToMastery(envelope);

    expect(mockLearningAttemptCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        learningObjectId: "lo-1",
        conceptId: "concept-1",
        skillFacet: "RECOGNIZE",
        outcome: "SUCCESS",
      }),
    });
    expect(mastery?.recognize).toBe(0.1);
    expect(mockConceptMasteryUpsert).toHaveBeenCalled();
  });

  it("Learner Model reads faceted mastery for a concept", async () => {
    mockConceptFindFirst.mockResolvedValue({
      id: "concept-1",
      title: "Java Exceptions",
      userId: "user-1",
    });
    mockConceptMasteryFindUnique.mockResolvedValue({
      recognize: 0.4,
      explain: 0.1,
      apply: 0,
      solve: 0,
      perform: 0,
      retain: 0.1,
      confidence: 0.2,
      reviewCount: 3,
      lastReviewedAt: new Date("2026-01-01"),
      nextReviewAt: new Date("2026-01-04"),
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
          recall: 0.6,
          application: 0.3,
        },
      ],
    });
    mockMissedQuestionCount.mockResolvedValue(2);

    const summary = await getLearnerConceptMastery("user-1", "concept-1");

    expect(summary?.facets.recognize).toBe(0.4);
    expect(summary?.facets.perform).toBe(0);
    expect(summary?.topicMastery?.recall).toBe(0.6);
    expect(summary?.recentMissedCount).toBe(2);
    expect(summary?.evidenceSourceCounts).toEqual({
      quiz: 0,
      flashcard: 0,
      study_evaluate: 0,
      other: 0,
    });
  });
});

describe("ULE quiz bridge (existing quiz path)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLearnerProfileUpsert.mockResolvedValue({ id: "lp-1", userId: "user-1" });
    mockTopicFindFirst.mockResolvedValue({
      id: "topic-1",
      name: "Loops",
      description: null,
      courseId: "course-1",
      conceptId: null,
      concept: null,
      course: {
        id: "course-1",
        userId: "user-1",
        title: "CS101",
        description: null,
        subject: "CS",
      },
    });
    mockLearningSpaceFindUnique.mockResolvedValue(null);
    mockCourseFindFirst.mockResolvedValue({
      id: "course-1",
      userId: "user-1",
      title: "CS101",
      description: null,
      subject: "CS",
    });
    mockLearningSpaceCreate.mockResolvedValue({
      id: "space-course",
      kind: "COURSE",
      courseId: "course-1",
    });
    mockConceptCreate.mockResolvedValue({
      id: "concept-loops",
      title: "Loops",
      learningSpaceId: "space-course",
    });
    mockTopicUpdate.mockResolvedValue({});
    mockLearningObjectFindFirst.mockResolvedValue(null);
    mockLearningObjectCreate.mockResolvedValue({
      id: "lo-qq1",
      type: "QUIZ_ITEM",
    });
    mockLearningAttemptCreate.mockResolvedValue({ id: "la-1" });
    mockConceptMasteryFindUnique.mockResolvedValue(null);
    mockConceptMasteryUpsert.mockResolvedValue({
      id: "cm-1",
      recognize: 0.1,
      perform: 0,
    });
  });

  it("quiz attempt produces Evidence and updates ConceptMastery (TopicMastery left to submit route)", async () => {
    const result = await recordQuizAttemptEvidence({
      userId: "user-1",
      quiz: {
        id: "quiz-1",
        title: "Loops quiz",
        courseId: "course-1",
        topicId: "topic-1",
        questions: [
          {
            id: "qq-1",
            prompt: "What is a for loop?",
            topicId: "topic-1",
            type: "MULTIPLE_CHOICE",
          },
        ],
      },
      attemptId: "attempt-1",
      graded: [{ questionId: "qq-1", isCorrect: true }],
    });

    expect(result.evidenceCount).toBe(1);
    expect(result.conceptIds).toContain("concept-loops");
    expect(result.attempts).toEqual([
      {
        attemptId: "la-1",
        conceptId: "concept-loops",
        questionId: "qq-1",
      },
    ]);
    expect(mockLearningAttemptCreate).toHaveBeenCalled();
    expect(mockConceptMasteryUpsert).toHaveBeenCalled();
    expect(mockTopicUpdate).toHaveBeenCalledWith({
      where: { id: "topic-1" },
      data: { conceptId: "concept-loops" },
    });
  });

  it("selectAuthoritativeQuizCompletionAttemptId picks last matching concept", async () => {
    const { selectAuthoritativeQuizCompletionAttemptId } = await import(
      "@/lib/learning/assessment/quiz-bridge"
    );
    expect(
      selectAuthoritativeQuizCompletionAttemptId({
        runConceptId: "concept-a",
        attempts: [
          { attemptId: "a1", conceptId: "concept-a", questionId: "q1" },
          { attemptId: "a2", conceptId: "concept-b", questionId: "q2" },
          { attemptId: "a3", conceptId: "concept-a", questionId: "q3" },
        ],
      }),
    ).toBe("a3");
    expect(
      selectAuthoritativeQuizCompletionAttemptId({
        runConceptId: "concept-x",
        attempts: [
          { attemptId: "a1", conceptId: "concept-a", questionId: "q1" },
        ],
      }),
    ).toBeNull();
  });

  it("records FAIL evidence with misconception signal on miss", async () => {
    await recordQuizAttemptEvidence({
      userId: "user-1",
      quiz: {
        id: "quiz-1",
        title: "Loops quiz",
        courseId: "course-1",
        topicId: "topic-1",
        questions: [
          {
            id: "qq-2",
            prompt: "While vs for?",
            topicId: "topic-1",
            type: "MULTIPLE_CHOICE",
          },
        ],
      },
      attemptId: "attempt-2",
      graded: [{ questionId: "qq-2", isCorrect: false }],
    });

    expect(mockLearningAttemptCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        outcome: "FAIL",
        misconceptionSignalsJson: JSON.stringify([
          "quiz_miss:multiple_choice",
        ]),
      }),
    });
  });
});

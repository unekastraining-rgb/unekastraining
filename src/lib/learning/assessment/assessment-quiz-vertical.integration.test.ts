/**
 * Phase 2G-50 — Assessment → Quiz → Evidence vertical integration.
 *
 * Proves existing seams work together. Assessment stops at launch; Quiz owns
 * submit/evidence/mastery; Adaptive bind owns progression.
 *
 * Deepest practical boundary: library consumer + quiz-bridge + submit-bind.
 * Full HTTP QuizTaker→submit is covered by source contracts (not a new E2E harness).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const {
  mockLearnerProfileUpsert,
  mockLearningSpaceFindUnique,
  mockLearningSpaceCreate,
  mockConceptCreate,
  mockTopicFindFirst,
  mockTopicUpdate,
  mockCourseFindFirst,
  mockLearningObjectFindFirst,
  mockLearningObjectCreate,
  mockLearningAttemptCreate,
  mockConceptMasteryFindUnique,
  mockConceptMasteryUpsert,
  mockGetAdaptiveSequenceRun,
  mockGetCurrentAdaptiveSequenceStep,
  mockLearningAttemptFindFirst,
  mockRecordAdaptiveSequenceCompletionAndPlanNext,
} = vi.hoisted(() => ({
  mockLearnerProfileUpsert: vi.fn(),
  mockLearningSpaceFindUnique: vi.fn(),
  mockLearningSpaceCreate: vi.fn(),
  mockConceptCreate: vi.fn(),
  mockTopicFindFirst: vi.fn(),
  mockTopicUpdate: vi.fn(),
  mockCourseFindFirst: vi.fn(),
  mockLearningObjectFindFirst: vi.fn(),
  mockLearningObjectCreate: vi.fn(),
  mockLearningAttemptCreate: vi.fn(),
  mockConceptMasteryFindUnique: vi.fn(),
  mockConceptMasteryUpsert: vi.fn(),
  mockGetAdaptiveSequenceRun: vi.fn(),
  mockGetCurrentAdaptiveSequenceStep: vi.fn(),
  mockLearningAttemptFindFirst: vi.fn(),
  mockRecordAdaptiveSequenceCompletionAndPlanNext: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    learnerProfile: { upsert: mockLearnerProfileUpsert },
    learningSpace: {
      findUnique: mockLearningSpaceFindUnique,
      create: mockLearningSpaceCreate,
      findFirst: vi.fn(),
    },
    concept: {
      create: mockConceptCreate,
      findFirst: vi.fn(),
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
    learningAttempt: {
      create: mockLearningAttemptCreate,
      findFirst: mockLearningAttemptFindFirst,
      findMany: vi.fn().mockResolvedValue([]),
    },
    conceptMastery: {
      findUnique: mockConceptMasteryFindUnique,
      upsert: mockConceptMasteryUpsert,
    },
    retentionItem: {
      upsert: vi.fn().mockResolvedValue({ id: "ri-mock" }),
      findUnique: vi.fn().mockResolvedValue(null),
      update: vi.fn(),
    },
    missedQuestion: { count: vi.fn().mockResolvedValue(0) },
    quiz: { findFirst: vi.fn() },
  },
}));

vi.mock("@/lib/learning/sequence/service", () => ({
  getAdaptiveSequenceRun: mockGetAdaptiveSequenceRun,
}));

vi.mock("@/lib/learning/sequence/coordinator", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/learning/sequence/coordinator")
  >("@/lib/learning/sequence/coordinator");
  return {
    ...actual,
    getCurrentAdaptiveSequenceStep: mockGetCurrentAdaptiveSequenceStep,
    recordAdaptiveSequenceCompletionAndPlanNext:
      mockRecordAdaptiveSequenceCompletionAndPlanNext,
    recordAdaptiveSequenceCompletion: vi.fn(),
  };
});

import { runStandaloneAssessmentConsumer } from "@/lib/learning/assessment/standalone-assessment-consumer";
import { recordQuizAttemptEvidence } from "@/lib/learning/assessment/quiz-bridge";
import { createExplicitLearningIntent } from "@/lib/learning/intent/project";
import {
  bindQuizSubmitToAdaptiveSequence,
  isQuizAdaptiveCompletionEligible,
} from "@/lib/learning/sequence/quiz-submit-bind";

function read(rel: string): string {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

function ownedQuizFinder(quizId: string) {
  return vi.fn(async () => ({
    ok: true as const,
    quizId,
    title: "Loops quiz",
    topicId: "topic-1",
  }));
}

function setupQuizBridgeMocks() {
  mockLearnerProfileUpsert.mockResolvedValue({ id: "lp-1", userId: "user-a" });
  mockTopicFindFirst.mockResolvedValue({
    id: "topic-1",
    name: "Loops",
    description: null,
    courseId: "course-1",
    conceptId: null,
    concept: null,
    course: {
      id: "course-1",
      userId: "user-a",
      title: "CS101",
      description: null,
      subject: "CS",
    },
  });
  mockLearningSpaceFindUnique.mockResolvedValue(null);
  mockCourseFindFirst.mockResolvedValue({
    id: "course-1",
    userId: "user-a",
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
  mockLearningAttemptCreate.mockResolvedValue({ id: "la-current-1" });
  mockConceptMasteryFindUnique.mockResolvedValue(null);
  mockConceptMasteryUpsert.mockResolvedValue({
    id: "cm-1",
    recognize: 0.1,
    perform: 0,
  });
}

describe("Phase 2G-50 Assessment → Quiz → Evidence vertical", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupQuizBridgeMocks();
  });

  it("standalone: ASSESS → owned Quiz launch → current QuizAttempt evidence → mastery", async () => {
    const ownedQuizId = "quiz-owned-vertical";
    const verifyOwnedQuiz = ownedQuizFinder(ownedQuizId);

    // ——— Assessment (plan → resolve → prepare → launch) ———
    const assessment = await runStandaloneAssessmentConsumer({
      learnerId: "user-a",
      conceptId: "concept-loops",
      intent: createExplicitLearningIntent({ purpose: "ASSESS" }),
      diagnosis: "UNDERSTANDING_GAP",
      adapterKey: "quiz",
      verifyOwnedQuiz,
    });

    expect(assessment.ok).toBe(true);
    if (!assessment.ok) return;
    expect(assessment.plan.status).toBe("ready");
    expect(assessment.plan.adapterKey).toBe("quiz");
    expect(assessment.activityOutcome.status).toBe("ready");
    if (assessment.activityOutcome.status !== "ready") return;

    const { launch, activity } = assessment.activityOutcome;
    expect(launch.href).toBe(`/quizzes/${ownedQuizId}`);
    expect(launch.adaptive).toBeUndefined();
    expect(activity.activityRef).toEqual({
      kind: "quiz",
      id: ownedQuizId,
    });
    expect(verifyOwnedQuiz).toHaveBeenCalledWith({
      userId: "user-a",
      conceptId: "concept-loops",
    });

    // Mutation audit: Assessment launch creates zero QuizAttempt / LearningAttempt / mastery
    expect(mockLearningAttemptCreate).not.toHaveBeenCalled();
    expect(mockConceptMasteryUpsert).not.toHaveBeenCalled();

    // ——— Quiz submission evidence (existing bridge; current attempt id) ———
    // Authoritative correlation: THIS submit's QuizAttempt id — not "latest" search.
    const currentQuizAttemptId = "qa-current-submit-50";
    const evidence = await recordQuizAttemptEvidence({
      userId: "user-a",
      quiz: {
        id: ownedQuizId,
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
      attemptId: currentQuizAttemptId,
      graded: [{ questionId: "qq-1", isCorrect: true }],
    });

    expect(evidence.evidenceCount).toBe(1);
    expect(evidence.attempts[0]?.attemptId).toBe("la-current-1");
    expect(mockLearningAttemptCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user-a",
        skillFacet: "RECOGNIZE",
        outcome: "SUCCESS",
        sourceRefJson: expect.stringContaining(currentQuizAttemptId),
      }),
    });
    const sourceRef = JSON.parse(
      mockLearningAttemptCreate.mock.calls[0]![0].data.sourceRefJson as string,
    ) as { kind: string; quizId: string; attemptId: string };
    expect(sourceRef).toEqual({
      kind: "quiz_attempt",
      quizId: ownedQuizId,
      attemptId: currentQuizAttemptId,
      questionId: "qq-1",
    });
    // Must not correlate via an older attempt id.
    expect(sourceRef.attemptId).not.toBe("qa-old-unrelated");
    expect(mockConceptMasteryUpsert).toHaveBeenCalled();
  });

  it("0% submitted Quiz still produces LearningAttempt (completion ≠ score)", async () => {
    const currentQuizAttemptId = "qa-zero-score";
    mockLearningAttemptCreate.mockResolvedValue({ id: "la-zero" });

    const evidence = await recordQuizAttemptEvidence({
      userId: "user-a",
      quiz: {
        id: "quiz-owned-vertical",
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
      attemptId: currentQuizAttemptId,
      graded: [{ questionId: "qq-1", isCorrect: false }],
    });

    expect(evidence.evidenceCount).toBe(1);
    expect(mockLearningAttemptCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        outcome: "FAIL",
        sourceRefJson: expect.stringContaining(currentQuizAttemptId),
      }),
    });
    expect(
      isQuizAdaptiveCompletionEligible({
        questionCount: 1,
        gradedCount: 1,
        evidenceAttempts: evidence.attempts,
      }).eligible,
    ).toBe(true);
  });

  it("adaptive: Assessment launch preserves context → bind uses current Attempt only", async () => {
    const ownedQuizId = "quiz-adapt-50";
    const assessment = await runStandaloneAssessmentConsumer({
      learnerId: "user-a",
      conceptId: "concept-loops",
      intent: createExplicitLearningIntent({ purpose: "ASSESS" }),
      diagnosis: "UNDERSTANDING_GAP",
      adapterKey: "quiz",
      adaptive: { runId: "run-50", stepIndex: 0 },
      verifyOwnedQuiz: ownedQuizFinder(ownedQuizId),
    });
    expect(assessment.ok).toBe(true);
    if (!assessment.ok) return;
    expect(assessment.activityOutcome.status).toBe("ready");
    if (assessment.activityOutcome.status !== "ready") return;

    expect(assessment.activityOutcome.launch.href).toBe(
      `/quizzes/${ownedQuizId}?adaptiveRunId=run-50&adaptiveStep=0`,
    );
    expect(assessment.activityOutcome.launch.adaptive).toEqual({
      runId: "run-50",
      stepIndex: 0,
    });
    expect(mockRecordAdaptiveSequenceCompletionAndPlanNext).not.toHaveBeenCalled();

    // QuizTaker forwards adaptive query params on submit (existing contract).
    const taker = read("app/quizzes/[id]/quiz-taker.tsx");
    expect(taker).toContain("adaptiveRunId");
    expect(taker).toContain("adaptiveStep");
    const submit = read("app/api/quizzes/[id]/submit/route.ts");
    expect(submit).toContain("bindQuizSubmitToAdaptiveSequence");
    expect(submit).toContain("body.adaptiveRunId");

    // Evidence from THIS submit, then existing adaptive bind.
    const currentQuizAttemptId = "qa-adapt-current";
    mockLearningAttemptCreate.mockResolvedValue({ id: "la-adapt-1" });
    const evidence = await recordQuizAttemptEvidence({
      userId: "user-a",
      quiz: {
        id: ownedQuizId,
        title: "Loops quiz",
        courseId: "course-1",
        topicId: "topic-1",
        questions: [
          {
            id: "qq-1",
            prompt: "loop?",
            topicId: "topic-1",
            type: "MULTIPLE_CHOICE",
          },
        ],
      },
      attemptId: currentQuizAttemptId,
      graded: [{ questionId: "qq-1", isCorrect: false }],
    });

    mockGetAdaptiveSequenceRun.mockResolvedValue({
      id: "run-50",
      userId: "user-a",
      conceptId: "concept-loops",
      status: "ACTIVE",
      currentStepIndex: 0,
      steps: [{ intervention: "quiz", learningObjectId: null }],
      interventionHistory: [],
    });
    mockGetCurrentAdaptiveSequenceStep.mockResolvedValue({
      kind: "active",
      run: {
        id: "run-50",
        conceptId: "concept-loops",
        currentStepIndex: 0,
        steps: [{ intervention: "quiz", learningObjectId: null }],
      },
      step: { intervention: "quiz", learningObjectId: null },
      stepIndex: 0,
    });
    mockLearningAttemptFindFirst.mockResolvedValue({
      id: "la-adapt-1",
      userId: "user-a",
      conceptId: "concept-loops",
      learningObjectId: "lo-qq1",
      skillFacet: "RECOGNIZE",
      sourceRefJson: JSON.stringify({
        kind: "quiz_attempt",
        quizId: ownedQuizId,
        attemptId: currentQuizAttemptId,
        questionId: "qq-1",
      }),
    });
    mockRecordAdaptiveSequenceCompletionAndPlanNext.mockResolvedValue({
      kind: "NEXT_STEP",
      run: { id: "run-50" },
      currentStep: { intervention: "chunking" },
      stepIndex: 1,
      historyEntry: {},
      orchestrator: {},
    });

    const bind = await bindQuizSubmitToAdaptiveSequence({
      userId: "user-a",
      quizId: ownedQuizId,
      adaptiveRunId: "run-50",
      adaptiveStep: 0,
      questionCount: 1,
      gradedCount: 1,
      evidenceAttempts: evidence.attempts,
    });

    expect(bind.kind).toBe("bound");
    if (bind.kind !== "bound") return;
    expect(bind.completionAttemptId).toBe("la-adapt-1");
    expect(mockRecordAdaptiveSequenceCompletionAndPlanNext).toHaveBeenCalledWith(
      expect.objectContaining({
        attemptId: "la-adapt-1",
        runId: "run-50",
        stepIndex: 0,
      }),
    );

    // Assessment modules do not call the coordinator.
    const consumer = read(
      "src/lib/learning/assessment/standalone-assessment-consumer.ts",
    );
    expect(consumer).not.toMatch(
      /bindQuizSubmitToAdaptiveSequence|recordAdaptiveSequenceCompletion|lucky/i,
    );
  });

  it("security: foreign Quiz cannot be launched; no evidence side effects from Assessment", async () => {
    const assessment = await runStandaloneAssessmentConsumer({
      learnerId: "user-a",
      conceptId: "concept-loops",
      intent: createExplicitLearningIntent({ purpose: "ASSESS" }),
      diagnosis: "UNDERSTANDING_GAP",
      adapterKey: "quiz",
      // Learner B's quiz is never returned by owned lookup for user-a.
      verifyOwnedQuiz: async () => ({ ok: false, reason: "NO_QUIZ" }),
    });

    expect(assessment.ok).toBe(true);
    if (!assessment.ok) return;
    expect(assessment.activityOutcome).toEqual({
      status: "unavailable",
      reason: "activity_not_available",
    });
    expect(mockLearningAttemptCreate).not.toHaveBeenCalled();
    expect(mockConceptMasteryUpsert).not.toHaveBeenCalled();
    expect(mockRecordAdaptiveSequenceCompletionAndPlanNext).not.toHaveBeenCalled();

    const route = read("app/api/study/assessment/route.ts");
    expect(route).toContain("void body.quizId");
  });

  it("without explicit adapterKey, ASSESS does not select Quiz", async () => {
    const assessment = await runStandaloneAssessmentConsumer({
      learnerId: "user-a",
      conceptId: "concept-loops",
      intent: createExplicitLearningIntent({ purpose: "ASSESS" }),
      diagnosis: "UNDERSTANDING_GAP",
      verifyOwnedQuiz: ownedQuizFinder("quiz-should-not-matter"),
    });
    expect(assessment.ok).toBe(true);
    if (!assessment.ok) return;
    expect(assessment.activityOutcome).toEqual({ status: "skipped" });
    expect(assessment.plan.adapterKey).toBeUndefined();
  });

  it("no duplicate architecture; existing surfaces unchanged", () => {
    for (const file of [
      "src/lib/learning/assessment/standalone-assessment-consumer.ts",
      "src/lib/learning/assessment/activity-launch.ts",
      "src/lib/learning/assessment/workflow.ts",
    ]) {
      expect(read(file)).not.toMatch(
        /AssessmentAttempt|AssessmentEvidence|AssessmentResult|AssessmentMastery/,
      );
    }

    const files = [
      "src/lib/learning/tutor/index.ts",
      "src/lib/csl/lucky-engine.ts",
      "app/core/page.tsx",
      "src/lib/learning/orchestrator/diagnose.ts",
    ];
    for (const file of files) {
      const source = read(file);
      expect(source).not.toContain("runStandaloneAssessmentConsumer");
      expect(source).not.toContain("launchAssessmentActivity");
    }

    expect(read("app/api/quizzes/[id]/submit/route.ts")).toContain(
      "recordQuizAttemptEvidence",
    );
  });
});

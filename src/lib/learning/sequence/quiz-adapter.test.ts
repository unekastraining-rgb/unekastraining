/**
 * Phase 2G-14 — Quiz Adaptive adapter + submit bind.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const {
  mockGetAdaptiveSequenceRun,
  mockGetCurrentAdaptiveSequenceStep,
  mockLearningAttemptFindFirst,
  mockLearningObjectFindFirst,
  mockTopicFindFirst,
  mockQuizFindFirst,
  mockRecordAdaptiveSequenceCompletionAndPlanNext,
} = vi.hoisted(() => ({
  mockGetAdaptiveSequenceRun: vi.fn(),
  mockGetCurrentAdaptiveSequenceStep: vi.fn(),
  mockLearningAttemptFindFirst: vi.fn(),
  mockLearningObjectFindFirst: vi.fn(),
  mockTopicFindFirst: vi.fn(),
  mockQuizFindFirst: vi.fn(),
  mockRecordAdaptiveSequenceCompletionAndPlanNext: vi.fn(),
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

vi.mock("@/lib/db", () => ({
  db: {
    learningAttempt: { findFirst: mockLearningAttemptFindFirst },
    learningObject: { findFirst: mockLearningObjectFindFirst },
    topic: { findFirst: mockTopicFindFirst },
    quiz: { findFirst: mockQuizFindFirst },
  },
}));

import {
  isQuizAdaptiveCompletionEligible,
  bindQuizSubmitToAdaptiveSequence,
  adaptiveQuizResponsePayload,
} from "@/lib/learning/sequence/quiz-submit-bind";
import {
  assertQuizCompatibleAttempt,
  findOwnedQuizForConcept,
  isSupportedQuizIntervention,
  normalizeQuizIntervention,
  quizAdaptiveHref,
  resolveQuizSequenceStep,
  resolveOwnedQuizSequenceStep,
  recordQuizAdaptiveSequenceCompletionAndPlanNext,
  QuizAdapterError,
} from "@/lib/learning/sequence/quiz-adapter";

describe("Phase 2G-14 quiz adaptive adapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("normalizes quiz intervention and builds adaptive href", () => {
    expect(normalizeQuizIntervention("QUIZ")).toBe("quiz");
    expect(isSupportedQuizIntervention("quiz")).toBe(true);
    expect(isSupportedQuizIntervention("chunking")).toBe(false);
    expect(
      quizAdaptiveHref("quiz-1", { adaptiveRunId: "run-1", adaptiveStep: 0 }),
    ).toBe("/quizzes/quiz-1?adaptiveRunId=run-1&adaptiveStep=0");
    expect(quizAdaptiveHref("quiz-1")).toBe("/quizzes/quiz-1");
  });

  it("resolveQuizSequenceStep accepts quiz only", () => {
    expect(
      resolveQuizSequenceStep({ intervention: "quiz", learningObjectId: null }),
    ).toEqual({ intervention: "quiz", learningObjectId: null });
    expect(() =>
      resolveQuizSequenceStep({
        intervention: "chunking",
        learningObjectId: null,
      }),
    ).toThrow(QuizAdapterError);
  });

  it("findOwnedQuizForConcept returns owned quiz via Concept→Topic→Quiz", async () => {
    mockTopicFindFirst.mockResolvedValue({ id: "topic-1", name: "Loops" });
    mockQuizFindFirst.mockResolvedValue({
      id: "quiz-9",
      title: "Loops quiz",
      userId: "user-a",
    });

    const found = await findOwnedQuizForConcept({
      userId: "user-a",
      conceptId: "concept-a",
    });
    expect(found).toEqual({
      ok: true,
      quizId: "quiz-9",
      title: "Loops quiz",
      topicId: "topic-1",
    });
    expect(mockQuizFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-a", topicId: "topic-1" },
      }),
    );
  });

  it("findOwnedQuizForConcept returns NO_QUIZ without creating", async () => {
    mockTopicFindFirst.mockResolvedValue({ id: "topic-1", name: "Loops" });
    mockQuizFindFirst.mockResolvedValue(null);
    expect(
      await findOwnedQuizForConcept({
        userId: "user-a",
        conceptId: "concept-a",
      }),
    ).toEqual({ ok: false, reason: "NO_QUIZ" });
  });

  it("resolveOwnedQuizSequenceStep launches owned topic quiz with adaptive context", async () => {
    mockTopicFindFirst.mockResolvedValue({ id: "topic-1", name: "Loops" });
    mockQuizFindFirst.mockResolvedValue({
      id: "quiz-9",
      title: "Loops quiz",
      userId: "user-a",
    });

    const resolved = await resolveOwnedQuizSequenceStep({
      userId: "user-a",
      conceptId: "concept-a",
      step: { intervention: "quiz", learningObjectId: null },
      hrefParams: { adaptiveRunId: "run-1", adaptiveStep: 2 },
    });

    expect(resolved.quizId).toBe("quiz-9");
    expect(resolved.href).toContain("adaptiveRunId=run-1");
    expect(resolved.href).toContain("adaptiveStep=2");
  });

  it("assertQuizCompatibleAttempt requires quiz_attempt sourceRef", () => {
    expect(() =>
      assertQuizCompatibleAttempt({
        id: "a1",
        userId: "u",
        conceptId: "c",
        learningObjectId: "lo",
        skillFacet: "RECOGNIZE",
        sourceRefJson: JSON.stringify({
          kind: "quiz_attempt",
          quizId: "q1",
          attemptId: "qa1",
          questionId: "qq1",
        }),
      }),
    ).not.toThrow();

    expect(() =>
      assertQuizCompatibleAttempt({
        id: "a1",
        userId: "u",
        conceptId: "c",
        learningObjectId: "lo",
        skillFacet: "RECOGNIZE",
        sourceRefJson: JSON.stringify({ kind: "study_evaluate", mode: "six" }),
      }),
    ).toThrow(/not quiz attempt/);
  });

  it("completion gate: submit with full grading is COMPLETE; incomplete is not", () => {
    expect(
      isQuizAdaptiveCompletionEligible({
        questionCount: 3,
        gradedCount: 3,
        evidenceAttempts: [
          { attemptId: "a1", conceptId: "c", questionId: "q1" },
        ],
      }).eligible,
    ).toBe(true);

    expect(
      isQuizAdaptiveCompletionEligible({
        questionCount: 3,
        gradedCount: 2,
        evidenceAttempts: [
          { attemptId: "a1", conceptId: "c", questionId: "q1" },
        ],
      }).reason,
    ).toBe("incomplete_grading");

    expect(
      isQuizAdaptiveCompletionEligible({
        questionCount: 3,
        gradedCount: 3,
        evidenceAttempts: [],
      }).reason,
    ).toBe("evidence_unavailable");
  });

  it("skips bind without adaptive context (normal quiz)", async () => {
    const result = await bindQuizSubmitToAdaptiveSequence({
      userId: "user-a",
      quizId: "quiz-1",
      adaptiveRunId: undefined,
      adaptiveStep: undefined,
      questionCount: 2,
      gradedCount: 2,
      evidenceAttempts: [
        { attemptId: "la-1", conceptId: "c1", questionId: "q1" },
        { attemptId: "la-2", conceptId: "c1", questionId: "q2" },
      ],
    });
    expect(result).toEqual({ kind: "skipped", reason: "no_adaptive_context" });
    expect(adaptiveQuizResponsePayload(result)).toBeUndefined();
  });

  it("binds last concept-matching Attempt and does not invent evidence", async () => {
    mockGetAdaptiveSequenceRun.mockResolvedValue({
      id: "run-1",
      userId: "user-a",
      conceptId: "concept-a",
      status: "ACTIVE",
      currentStepIndex: 0,
      steps: [{ intervention: "quiz", learningObjectId: null }],
      interventionHistory: [],
    });
    mockGetCurrentAdaptiveSequenceStep.mockResolvedValue({
      kind: "active",
      run: {
        id: "run-1",
        conceptId: "concept-a",
        currentStepIndex: 0,
        steps: [{ intervention: "quiz", learningObjectId: null }],
      },
      step: { intervention: "quiz", learningObjectId: null },
      stepIndex: 0,
    });
    mockLearningAttemptFindFirst.mockResolvedValue({
      id: "la-2",
      userId: "user-a",
      conceptId: "concept-a",
      learningObjectId: "lo-2",
      skillFacet: "RECOGNIZE",
      sourceRefJson: JSON.stringify({
        kind: "quiz_attempt",
        quizId: "quiz-1",
        attemptId: "qa-1",
        questionId: "q2",
      }),
    });
    mockRecordAdaptiveSequenceCompletionAndPlanNext.mockResolvedValue({
      kind: "NEXT_STEP",
      run: { id: "run-1" },
      currentStep: { intervention: "chunking" },
      stepIndex: 1,
      historyEntry: {},
      orchestrator: {},
    });

    const result = await bindQuizSubmitToAdaptiveSequence({
      userId: "user-a",
      quizId: "quiz-1",
      adaptiveRunId: "run-1",
      adaptiveStep: 0,
      questionCount: 2,
      gradedCount: 2,
      evidenceAttempts: [
        { attemptId: "la-1", conceptId: "concept-a", questionId: "q1" },
        { attemptId: "la-2", conceptId: "concept-a", questionId: "q2" },
      ],
    });

    expect(result.kind).toBe("bound");
    if (result.kind !== "bound") return;
    expect(result.completionAttemptId).toBe("la-2");
    expect(mockRecordAdaptiveSequenceCompletionAndPlanNext).toHaveBeenCalledWith(
      expect.objectContaining({
        attemptId: "la-2",
        runId: "run-1",
        stepIndex: 0,
      }),
    );
  });

  it("rejects when no Attempt matches run concept", async () => {
    mockGetAdaptiveSequenceRun.mockResolvedValue({
      id: "run-1",
      userId: "user-a",
      conceptId: "concept-a",
      status: "ACTIVE",
      currentStepIndex: 0,
      steps: [{ intervention: "quiz", learningObjectId: null }],
    });

    const result = await bindQuizSubmitToAdaptiveSequence({
      userId: "user-a",
      quizId: "quiz-1",
      adaptiveRunId: "run-1",
      adaptiveStep: 0,
      questionCount: 1,
      gradedCount: 1,
      evidenceAttempts: [
        { attemptId: "la-1", conceptId: "concept-other", questionId: "q1" },
      ],
    });
    expect(result.kind).toBe("error");
    if (result.kind !== "error") return;
    expect(result.code).toBe("ATTEMPT_CONCEPT_MISMATCH");
  });

  it("rejects non-quiz current Adaptive step", async () => {
    mockGetAdaptiveSequenceRun.mockResolvedValue({
      id: "run-1",
      userId: "user-a",
      conceptId: "concept-a",
      status: "ACTIVE",
      currentStepIndex: 0,
      steps: [{ intervention: "chunking", learningObjectId: null }],
    });

    const result = await bindQuizSubmitToAdaptiveSequence({
      userId: "user-a",
      quizId: "quiz-1",
      adaptiveRunId: "run-1",
      adaptiveStep: 0,
      questionCount: 1,
      gradedCount: 1,
      evidenceAttempts: [
        { attemptId: "la-1", conceptId: "concept-a", questionId: "q1" },
      ],
    });
    expect(result.kind).toBe("error");
    if (result.kind !== "error") return;
    expect(result.code).toBe("NOT_QUIZ_STEP");
  });

  it("submit route binds optionally; does not create a second Attempt writer", () => {
    const submit = readFileSync(
      path.join(process.cwd(), "app/api/quizzes/[id]/submit/route.ts"),
      "utf8",
    );
    expect(submit).toContain("bindQuizSubmitToAdaptiveSequence");
    expect(submit).toContain("recordQuizAttemptEvidence");
    expect(submit).toContain("adaptiveRunId");
    expect(submit).not.toMatch(/learningAttempt\.create/);
    expect(submit).not.toContain("syncWeakMasteryRetentionItem");
  });

  it("QuizTaker preserves results and adaptive return CTA", () => {
    const taker = readFileSync(
      path.join(process.cwd(), "app/quizzes/[id]/quiz-taker.tsx"),
      "utf8",
    );
    expect(taker).toContain("AdaptiveReturnStrip");
    expect(taker).toContain("adaptiveRunId");
    expect(taker).toContain("hasAdaptiveContext");
    expect(taker).toContain("setResults");
    const completion = readFileSync(
      path.join(
        process.cwd(),
        "src/lib/learning/experience/activity-completion-present.ts",
      ),
      "utf8",
    );
    expect(completion).toContain("/study/adaptive/");
    expect(completion).toContain("createsEvidence: false");
  });

  it("preservation — Lucky / Study Now / CORE free of quiz adaptive bind", () => {
    const files = [
      "src/lib/csl/lucky-engine.ts",
      "src/lib/csl/study-now.ts",
      "app/core/page.tsx",
    ];
    for (const file of files) {
      const source = readFileSync(path.join(process.cwd(), file), "utf8");
      expect(source).not.toContain("bindQuizSubmitToAdaptiveSequence");
    }
  });

  it("low score still COMPLETE — score is not the completion gate", () => {
    const gate = isQuizAdaptiveCompletionEligible({
      questionCount: 5,
      gradedCount: 5,
      evidenceAttempts: [
        { attemptId: "la-1", conceptId: "c", questionId: "q1" },
      ],
    });
    expect(gate.eligible).toBe(true);
    expect(gate.reason).toBe("quiz_submitted");
  });

  it("recordQuizAdaptiveSequenceCompletionAndPlanNext validates then plans", async () => {
    mockGetCurrentAdaptiveSequenceStep.mockResolvedValue({
      kind: "active",
      run: {
        id: "run-1",
        conceptId: "concept-a",
        currentStepIndex: 0,
        steps: [{ intervention: "quiz", learningObjectId: null }],
      },
      step: { intervention: "quiz", learningObjectId: null },
      stepIndex: 0,
    });
    mockLearningAttemptFindFirst.mockResolvedValue({
      id: "la-1",
      userId: "user-a",
      conceptId: "concept-a",
      learningObjectId: "lo-1",
      skillFacet: "RECOGNIZE",
      sourceRefJson: JSON.stringify({
        kind: "quiz_attempt",
        quizId: "quiz-1",
        attemptId: "qa-1",
        questionId: "q1",
      }),
    });
    mockRecordAdaptiveSequenceCompletionAndPlanNext.mockResolvedValue({
      kind: "ALREADY_PROCESSED",
      run: { id: "run-1" },
      historyEntry: { attemptId: "la-1" },
      duplicate: true,
    });

    const plan = await recordQuizAdaptiveSequenceCompletionAndPlanNext({
      userId: "user-a",
      runId: "run-1",
      attemptId: "la-1",
      stepIndex: 0,
      expectedQuizId: "quiz-1",
    });
    expect(plan.kind).toBe("ALREADY_PROCESSED");
  });
});

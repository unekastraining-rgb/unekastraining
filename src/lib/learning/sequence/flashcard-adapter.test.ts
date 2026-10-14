/**
 * Phase 2G-54 — Flashcard Adaptive adapter + review bind.
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
  mockFlashcardFindFirst,
  mockRecordAdaptiveSequenceCompletionAndPlanNext,
} = vi.hoisted(() => ({
  mockGetAdaptiveSequenceRun: vi.fn(),
  mockGetCurrentAdaptiveSequenceStep: vi.fn(),
  mockLearningAttemptFindFirst: vi.fn(),
  mockLearningObjectFindFirst: vi.fn(),
  mockTopicFindFirst: vi.fn(),
  mockFlashcardFindFirst: vi.fn(),
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
    flashcard: { findFirst: mockFlashcardFindFirst },
  },
}));

import {
  isFlashcardAdaptiveCompletionEligible,
  bindFlashcardReviewToAdaptiveSequence,
  adaptiveFlashcardResponsePayload,
} from "@/lib/learning/sequence/flashcard-review-bind";
import {
  assertFlashcardCompatibleAttempt,
  flashcardAdaptiveHref,
  isSupportedFlashcardIntervention,
  normalizeFlashcardIntervention,
  resolveFlashcardSequenceStep,
  resolveOwnedFlashcardSequenceStep,
  recordFlashcardAdaptiveSequenceCompletionAndPlanNext,
  FlashcardAdapterError,
  FLASHCARD_INTERVENTION,
} from "@/lib/learning/sequence/flashcard-adapter";

function flashcardAttempt(partial?: {
  id?: string;
  userId?: string;
  conceptId?: string | null;
  flashcardId?: string;
  skillFacet?: string;
}) {
  const flashcardId = partial?.flashcardId ?? "card-1";
  return {
    id: partial?.id ?? "la-1",
    userId: partial?.userId ?? "user-a",
    conceptId: partial?.conceptId ?? "concept-a",
    learningObjectId: "lo-fc-1",
    skillFacet: partial?.skillFacet ?? "RETAIN",
    sourceRefJson: JSON.stringify({
      kind: "flashcard_review",
      flashcardId,
      topicId: "topic-1",
      rating: "GOOD",
    }),
  };
}

describe("Phase 2G-54 flashcard adaptive adapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("normalizes flashcard intervention and builds adaptive href", () => {
    expect(normalizeFlashcardIntervention("FLASHCARDS")).toBe("flashcard");
    expect(isSupportedFlashcardIntervention("flashcard")).toBe(true);
    expect(isSupportedFlashcardIntervention("quiz")).toBe(false);
    expect(
      flashcardAdaptiveHref(
        { courseId: "c1", topicName: "Mitosis" },
        { adaptiveRunId: "run-1", adaptiveStep: 0 },
      ),
    ).toBe(
      "/flashcards?courseId=c1&topic=Mitosis&adaptiveRunId=run-1&adaptiveStep=0",
    );
  });

  it("resolveFlashcardSequenceStep accepts flashcard only", () => {
    expect(
      resolveFlashcardSequenceStep({
        intervention: "flashcard",
        learningObjectId: null,
      }),
    ).toEqual({ intervention: "flashcard", learningObjectId: null });
    expect(() =>
      resolveFlashcardSequenceStep({
        intervention: "quiz",
        learningObjectId: null,
      }),
    ).toThrow(FlashcardAdapterError);
  });

  it("resolveOwnedFlashcardSequenceStep launches due owned card with adaptive context", async () => {
    mockTopicFindFirst.mockResolvedValue({
      id: "topic-1",
      name: "Cells",
      courseId: "course-1",
    });
    mockFlashcardFindFirst.mockResolvedValue({
      id: "card-9",
      userId: "user-a",
    });

    const resolved = await resolveOwnedFlashcardSequenceStep({
      userId: "user-a",
      conceptId: "concept-a",
      step: { intervention: "flashcard", learningObjectId: null },
      hrefParams: { adaptiveRunId: "run-1", adaptiveStep: 2 },
    });
    expect(resolved.flashcardId).toBe("card-9");
    expect(resolved.intervention).toBe(FLASHCARD_INTERVENTION);
    expect(resolved.href).toContain("adaptiveRunId=run-1");
    expect(resolved.href).toContain("adaptiveStep=2");
    expect(resolved.href).toContain("/flashcards?");
  });

  describe("evidence correlation", () => {
    it("valid flashcard_review Attempt with matching flashcardId passes", () => {
      expect(() =>
        assertFlashcardCompatibleAttempt(flashcardAttempt(), {
          expectedFlashcardId: "card-1",
        }),
      ).not.toThrow();
    });

    it("wrong Flashcard id does not bind", () => {
      expect(() =>
        assertFlashcardCompatibleAttempt(flashcardAttempt(), {
          expectedFlashcardId: "card-other",
        }),
      ).toThrow(/flashcardId does not match/);
    });

    it("same concept quiz Attempt does not bind", () => {
      expect(() =>
        assertFlashcardCompatibleAttempt({
          ...flashcardAttempt(),
          sourceRefJson: JSON.stringify({
            kind: "quiz_attempt",
            quizId: "q1",
          }),
          skillFacet: "RECOGNIZE",
        }),
      ).toThrow(/not flashcard review/);
    });

    it("RECOGNIZE facet does not bind", () => {
      expect(() =>
        assertFlashcardCompatibleAttempt(
          flashcardAttempt({ skillFacet: "RECOGNIZE" }),
        ),
      ).toThrow(/RETAIN/);
    });
  });

  describe("completion eligibility / rating semantics", () => {
    it("rating that produced Attempt is eligible (AGAIN/GOOD/EASY score-agnostic)", () => {
      expect(
        isFlashcardAdaptiveCompletionEligible({
          recorded: true,
          attemptId: "la-1",
        }),
      ).toEqual({ eligible: true, reason: "flashcard_rated" });
    });

    it("launch/open alone is not eligible", () => {
      expect(
        isFlashcardAdaptiveCompletionEligible({
          recorded: false,
          attemptId: null,
        }),
      ).toEqual({ eligible: false, reason: "evidence_unavailable" });
    });

    it("existing rating outcomes remain FAIL/PARTIAL/SUCCESS (source contract)", () => {
      const bridge = readFileSync(
        path.join(
          process.cwd(),
          "src/lib/learning/assessment/flashcard-bridge.ts",
        ),
        "utf8",
      );
      expect(bridge).toContain('if (rating === "AGAIN") return "FAIL"');
      expect(bridge).toContain("outcomeFromScoreRatio(0.75)");
      expect(bridge).toContain('skillFacet: "RETAIN"');
    });
  });

  describe("bindFlashcardReviewToAdaptiveSequence", () => {
    it("missing adaptive context skips (normal review unchanged)", async () => {
      const result = await bindFlashcardReviewToAdaptiveSequence({
        userId: "user-a",
        flashcardId: "card-1",
        adaptiveRunId: undefined,
        adaptiveStep: undefined,
        recorded: true,
        attemptId: "la-1",
      });
      expect(result).toEqual({
        kind: "skipped",
        reason: "no_adaptive_context",
      });
      expect(mockRecordAdaptiveSequenceCompletionAndPlanNext).not.toHaveBeenCalled();
    });

    it("valid current Attempt binds once", async () => {
      mockGetAdaptiveSequenceRun.mockResolvedValue({
        id: "run-1",
        conceptId: "concept-a",
        currentStepIndex: 0,
        steps: [{ intervention: "flashcard", learningObjectId: null }],
        interventionHistory: [],
        status: "ACTIVE",
      });
      mockGetCurrentAdaptiveSequenceStep.mockResolvedValue({
        kind: "active",
        run: {
          id: "run-1",
          conceptId: "concept-a",
          currentStepIndex: 0,
          steps: [{ intervention: "flashcard", learningObjectId: null }],
          interventionHistory: [],
          status: "ACTIVE",
        },
        stepIndex: 0,
        step: { intervention: "flashcard", learningObjectId: null },
      });
      mockLearningAttemptFindFirst.mockResolvedValue(flashcardAttempt());
      mockRecordAdaptiveSequenceCompletionAndPlanNext.mockResolvedValue({
        kind: "advanced",
        run: { id: "run-1" },
      });

      const result = await bindFlashcardReviewToAdaptiveSequence({
        userId: "user-a",
        flashcardId: "card-1",
        adaptiveRunId: "run-1",
        adaptiveStep: 0,
        recorded: true,
        attemptId: "la-1",
      });
      expect(result.kind).toBe("bound");
      if (result.kind !== "bound") return;
      expect(result.completionAttemptId).toBe("la-1");
      expect(mockRecordAdaptiveSequenceCompletionAndPlanNext).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-a",
          runId: "run-1",
          attemptId: "la-1",
          stepIndex: 0,
        }),
      );
      // expectedFlashcardId is enforced in assert before coordinator call
      expect(mockLearningAttemptFindFirst).toHaveBeenCalled();
    });

    it("foreign learner / ownership mismatch surfaces as error", async () => {
      mockGetAdaptiveSequenceRun.mockResolvedValue({
        id: "run-1",
        conceptId: "concept-a",
        currentStepIndex: 0,
        steps: [{ intervention: "flashcard", learningObjectId: null }],
        interventionHistory: [],
        status: "ACTIVE",
      });
      mockGetCurrentAdaptiveSequenceStep.mockResolvedValue({
        kind: "active",
        run: {
          id: "run-1",
          conceptId: "concept-a",
          currentStepIndex: 0,
          steps: [{ intervention: "flashcard", learningObjectId: null }],
          interventionHistory: [],
          status: "ACTIVE",
        },
        stepIndex: 0,
        step: { intervention: "flashcard", learningObjectId: null },
      });
      mockLearningAttemptFindFirst.mockResolvedValue(
        flashcardAttempt({ userId: "other-user" }),
      );

      const result = await bindFlashcardReviewToAdaptiveSequence({
        userId: "user-a",
        flashcardId: "card-1",
        adaptiveRunId: "run-1",
        adaptiveStep: 0,
        recorded: true,
        attemptId: "la-1",
      });
      expect(result.kind).toBe("error");
      if (result.kind !== "error") return;
      expect(result.code).toBe("ATTEMPT_OWNERSHIP_MISMATCH");
    });

    it("unrelated historical Attempt (wrong flashcardId) rejected", async () => {
      mockGetAdaptiveSequenceRun.mockResolvedValue({
        id: "run-1",
        conceptId: "concept-a",
        currentStepIndex: 0,
        steps: [{ intervention: "flashcard", learningObjectId: null }],
        interventionHistory: [],
        status: "ACTIVE",
      });
      mockGetCurrentAdaptiveSequenceStep.mockResolvedValue({
        kind: "active",
        run: {
          id: "run-1",
          conceptId: "concept-a",
          currentStepIndex: 0,
          steps: [{ intervention: "flashcard", learningObjectId: null }],
          interventionHistory: [],
          status: "ACTIVE",
        },
        stepIndex: 0,
        step: { intervention: "flashcard", learningObjectId: null },
      });
      mockLearningAttemptFindFirst.mockResolvedValue(
        flashcardAttempt({ flashcardId: "card-old" }),
      );

      const result = await bindFlashcardReviewToAdaptiveSequence({
        userId: "user-a",
        flashcardId: "card-1",
        adaptiveRunId: "run-1",
        adaptiveStep: 0,
        recorded: true,
        attemptId: "la-old",
      });
      expect(result.kind).toBe("error");
      if (result.kind !== "error") return;
      expect(result.code).toBe("ATTEMPT_INCOMPATIBLE");
    });

    it("non-flashcard step rejected", async () => {
      mockGetAdaptiveSequenceRun.mockResolvedValue({
        id: "run-1",
        conceptId: "concept-a",
        currentStepIndex: 0,
        steps: [{ intervention: "quiz", learningObjectId: null }],
        interventionHistory: [],
        status: "ACTIVE",
      });

      const result = await bindFlashcardReviewToAdaptiveSequence({
        userId: "user-a",
        flashcardId: "card-1",
        adaptiveRunId: "run-1",
        adaptiveStep: 0,
        recorded: true,
        attemptId: "la-1",
      });
      expect(result).toEqual({
        kind: "error",
        runId: "run-1",
        code: "NOT_FLASHCARD_STEP",
        message: "Current Adaptive step is not a flashcard activity.",
      });
    });

    it("stale step rejected via adapter", async () => {
      mockGetAdaptiveSequenceRun.mockResolvedValue({
        id: "run-1",
        conceptId: "concept-a",
        currentStepIndex: 1,
        steps: [
          { intervention: "flashcard", learningObjectId: null },
          { intervention: "flashcard", learningObjectId: null },
        ],
        interventionHistory: [],
        status: "ACTIVE",
      });
      mockGetCurrentAdaptiveSequenceStep.mockResolvedValue({
        kind: "active",
        run: {
          id: "run-1",
          conceptId: "concept-a",
          currentStepIndex: 1,
          steps: [
            { intervention: "flashcard", learningObjectId: null },
            { intervention: "flashcard", learningObjectId: null },
          ],
          interventionHistory: [],
          status: "ACTIVE",
        },
        stepIndex: 1,
        step: { intervention: "flashcard", learningObjectId: null },
      });
      mockLearningAttemptFindFirst.mockResolvedValue(flashcardAttempt());

      await expect(
        recordFlashcardAdaptiveSequenceCompletionAndPlanNext({
          userId: "user-a",
          runId: "run-1",
          attemptId: "la-1",
          stepIndex: 0,
          expectedFlashcardId: "card-1",
        }),
      ).rejects.toMatchObject({ code: "NO_ACTIVE_STEP" });
    });
  });

  describe("route / UI / vertical contract", () => {
    it("PATCH binds after evidence; no client complete flag; UI forwards adaptive", () => {
      const route = readFileSync(
        path.join(process.cwd(), "app/api/flashcards/route.ts"),
        "utf8",
      );
      expect(route).toContain("recordFlashcardReviewEvidence");
      expect(route).toContain("bindFlashcardReviewToAdaptiveSequence");
      expect(route).toContain("void body.complete");
      expect(route).toContain("applySm2Review");

      const view = readFileSync(
        path.join(process.cwd(), "app/flashcards/flashcards-view.tsx"),
        "utf8",
      );
      expect(view).toContain("adaptiveRunId");
      expect(view).toContain("adaptiveStep");
      expect(view).not.toContain("complete: true");
    });

    it("vertical spine: rating → evidence → bind → coordinator (source)", () => {
      const route = readFileSync(
        path.join(process.cwd(), "app/api/flashcards/route.ts"),
        "utf8",
      );
      const evidenceIdx = route.indexOf("recordFlashcardReviewEvidence");
      const bindIdx = route.indexOf("bindFlashcardReviewToAdaptiveSequence");
      expect(evidenceIdx).toBeGreaterThan(-1);
      expect(bindIdx).toBeGreaterThan(evidenceIdx);

      expect(adaptiveFlashcardResponsePayload({
        kind: "skipped",
        reason: "no_adaptive_context",
      })).toBeUndefined();
    });

    it("Assessment does not own Adaptive progression", () => {
      const assessment = readFileSync(
        path.join(
          process.cwd(),
          "src/lib/learning/assessment/flashcard-assessment-adapter.ts",
        ),
        "utf8",
      );
      expect(assessment).not.toMatch(
        /bindFlashcard|recordAdaptiveSequenceCompletion/,
      );
    });
  });
});

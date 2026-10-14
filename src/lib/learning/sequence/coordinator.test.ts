/**
 * Phase 2G-3 — AdaptiveSequenceCoordinator unit tests.
 * Mocks DB + Orchestrator; does not launch UI or create evidence/mastery.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockConceptFindFirst,
  mockLearningObjectFindFirst,
  mockLearningAttemptFindFirst,
  mockAdaptiveSequenceRunCreate,
  mockAdaptiveSequenceRunFindFirst,
  mockAdaptiveSequenceRunFindMany,
  mockAdaptiveSequenceRunUpdate,
  mockAdaptiveSequenceRunUpdateMany,
  mockOrchestrateForConcept,
  mockLearningAttemptCreate,
  mockConceptMasteryUpsert,
  mockRetentionItemUpsert,
} = vi.hoisted(() => ({
  mockConceptFindFirst: vi.fn(),
  mockLearningObjectFindFirst: vi.fn(),
  mockLearningAttemptFindFirst: vi.fn(),
  mockAdaptiveSequenceRunCreate: vi.fn(),
  mockAdaptiveSequenceRunFindFirst: vi.fn(),
  mockAdaptiveSequenceRunFindMany: vi.fn(),
  mockAdaptiveSequenceRunUpdate: vi.fn(),
  mockAdaptiveSequenceRunUpdateMany: vi.fn(),
  mockOrchestrateForConcept: vi.fn(),
  mockLearningAttemptCreate: vi.fn(),
  mockConceptMasteryUpsert: vi.fn(),
  mockRetentionItemUpsert: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    concept: { findFirst: mockConceptFindFirst },
    learningObject: { findFirst: mockLearningObjectFindFirst },
    learningAttempt: {
      findFirst: mockLearningAttemptFindFirst,
      create: mockLearningAttemptCreate,
    },
    adaptiveSequenceRun: {
      create: mockAdaptiveSequenceRunCreate,
      findFirst: mockAdaptiveSequenceRunFindFirst,
      findMany: mockAdaptiveSequenceRunFindMany,
      update: mockAdaptiveSequenceRunUpdate,
      updateMany: mockAdaptiveSequenceRunUpdateMany,
    },
    conceptMastery: { upsert: mockConceptMasteryUpsert },
    retentionItem: { upsert: mockRetentionItemUpsert },
  },
}));

vi.mock("@/lib/learning/orchestrator", () => ({
  orchestrateForConcept: mockOrchestrateForConcept,
}));

vi.mock("@/lib/learning/sequence/lucky-handoff", () => ({
  syncLuckyRetentionAfterSequenceComplete: vi.fn().mockResolvedValue(undefined),
}));

import {
  abandonAdaptiveSequence,
  completeAdaptiveSequence,
  getCurrentAdaptiveSequenceStep,
  getNextAdaptiveIntervention,
  recordAdaptiveSequenceCompletion,
  resumeAdaptiveSequenceRun,
  startAdaptiveSequenceRun,
} from "@/lib/learning/sequence/coordinator";
import { AdaptiveSequenceCoordinatorError } from "@/lib/learning/sequence/coordinator-errors";
import { MAX_SEQUENCE_STEPS } from "@/lib/learning/sequence/policy";
import {
  serializeInterventionHistory,
  serializeSteps,
} from "@/lib/learning/sequence/json";
import type { OrchestratorResult } from "@/lib/learning/orchestrator/diagnose";

const USER_A = "user-a";
const USER_B = "user-b";
const CONCEPT_A = "concept-a";
const RUN_ID = "run-1";
const ATTEMPT_ID = "attempt-1";

function orchResult(
  partial: Partial<OrchestratorResult> &
    Pick<OrchestratorResult, "diagnosis" | "intervention">,
): OrchestratorResult {
  return {
    learnerId: USER_A,
    conceptId: CONCEPT_A,
    conceptTitle: "Exceptions",
    reason: "test",
    confidence: "MEDIUM",
    signals: {
      facets: {
        recognize: 0.2,
        explain: 0.2,
        apply: 0.2,
        solve: 0,
        perform: 0,
        retain: 0.2,
        confidence: 0.3,
      },
      evidenceSourceCounts: {
        quiz: 2,
        flashcard: 0,
        study_evaluate: 0,
        other: 0,
      },
      reviewCount: 2,
      evidenceSourceKinds: 1,
      usedTopicMasteryFallback: false,
    },
    ...partial,
  };
}

function runRow(overrides: Record<string, unknown> = {}) {
  return {
    id: RUN_ID,
    userId: USER_A,
    conceptId: CONCEPT_A,
    status: "ACTIVE",
    currentStepIndex: 0,
    stepsJson: serializeSteps([
      { intervention: "detailed-explanation", learningObjectId: null },
    ]),
    interventionHistoryJson: "[]",
    lastAttemptId: null,
    createdAt: new Date("2026-09-18T12:00:00.000Z"),
    updatedAt: new Date("2026-09-18T12:00:00.000Z"),
    ...overrides,
  };
}

describe("Phase 2G-3 AdaptiveSequenceCoordinator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConceptFindFirst.mockResolvedValue({ id: CONCEPT_A, userId: USER_A });
    mockAdaptiveSequenceRunCreate.mockImplementation(async ({ data }) =>
      runRow(data),
    );
    mockAdaptiveSequenceRunFindFirst.mockResolvedValue(runRow());
    mockAdaptiveSequenceRunUpdate.mockImplementation(async ({ data }) => {
      const existing = mockAdaptiveSequenceRunFindFirst.mock.results.at(-1)
        ?.value;
      const base =
        existing && typeof existing.then === "function"
          ? await existing
          : runRow();
      return { ...base, ...data };
    });
    mockAdaptiveSequenceRunUpdateMany.mockImplementation(async ({ data }) => {
      const prev = await mockAdaptiveSequenceRunFindFirst();
      const next = { ...prev, ...data };
      mockAdaptiveSequenceRunFindFirst.mockResolvedValue(next);
      return { count: 1 };
    });
  });

  describe("START", () => {
    it("1–6. owned concept starts run from Orchestrator; no Attempt/Mastery/Retention", async () => {
      mockOrchestrateForConcept.mockResolvedValue(
        orchResult({
          diagnosis: "UNDERSTANDING_GAP",
          intervention: {
            kind: "six",
            sixComponent: "detailed-explanation",
            title: "Detailed Explanation",
            emoji: "📖",
            href: "/study/six/detailed-explanation",
          },
        }),
      );

      const result = await startAdaptiveSequenceRun({
        userId: USER_A,
        conceptId: CONCEPT_A,
      });

      expect(result.kind).toBe("started");
      if (result.kind !== "started") return;
      expect(result.currentStep.intervention).toBe("detailed-explanation");
      expect(result.currentStep.learningObjectId).toBeNull();
      expect(result.run.status).toBe("ACTIVE");
      expect(mockOrchestrateForConcept).toHaveBeenCalledWith(
        USER_A,
        CONCEPT_A,
        undefined,
      );
      expect(mockLearningAttemptCreate).not.toHaveBeenCalled();
      expect(mockConceptMasteryUpsert).not.toHaveBeenCalled();
      expect(mockRetentionItemUpsert).not.toHaveBeenCalled();
    });

    it("7. NO_INTERVENTION does not create an active run", async () => {
      mockOrchestrateForConcept.mockResolvedValue(
        orchResult({
          diagnosis: "NO_INTERVENTION",
          intervention: null,
        }),
      );
      const result = await startAdaptiveSequenceRun({
        userId: USER_A,
        conceptId: CONCEPT_A,
      });
      expect(result.kind).toBe("no_sequence_needed");
      expect(mockAdaptiveSequenceRunCreate).not.toHaveBeenCalled();
    });

    it("8. cross-user / missing mastery → no invent step; ownership on create", async () => {
      mockOrchestrateForConcept.mockResolvedValue(null);
      const missing = await startAdaptiveSequenceRun({
        userId: USER_A,
        conceptId: CONCEPT_A,
      });
      expect(missing.kind).toBe("no_sequence_needed");
      expect(mockAdaptiveSequenceRunCreate).not.toHaveBeenCalled();

      mockOrchestrateForConcept.mockResolvedValue(
        orchResult({
          diagnosis: "APPLICATION_GAP",
          intervention: {
            kind: "six",
            sixComponent: "hands-on-practice",
            title: "Hands-on",
            emoji: "🛠️",
            href: "/study/six/hands-on-practice",
          },
        }),
      );
      mockConceptFindFirst.mockResolvedValueOnce(null);
      await expect(
        startAdaptiveSequenceRun({
          userId: USER_A,
          conceptId: "foreign-concept",
        }),
      ).rejects.toThrow(/not owned/i);
    });

    it("2G-73: Adaptive-ready activityIntervention becomes ACTIVITY step", async () => {
      mockOrchestrateForConcept.mockResolvedValue(
        orchResult({
          diagnosis: "APPLICATION_GAP",
          intervention: {
            kind: "six",
            sixComponent: "hands-on-practice",
            title: "Hands-on",
            emoji: "🛠️",
            href: "/study/six/hands-on-practice",
          },
          activityIntervention: {
            kind: "activity",
            adapterKey: "coding",
            activityType: "CODING_CHALLENGE",
            title: "Coding practice",
            reason: "Practice with coding",
            href: "/study/activities/coding?conceptId=concept-a",
            evidenceFacet: "PERFORM",
          },
        }),
      );

      const result = await startAdaptiveSequenceRun({
        userId: USER_A,
        conceptId: CONCEPT_A,
      });

      expect(result.kind).toBe("started");
      if (result.kind !== "started") return;
      expect(result.currentStep.intervention).toBe("coding");
      expect(result.currentStep.learningObjectId).toBeNull();
      expect(mockLearningAttemptCreate).not.toHaveBeenCalled();
    });

    it("2G-73: Adaptive-ready game activityIntervention becomes ACTIVITY step (2P-30)", async () => {
      mockOrchestrateForConcept.mockResolvedValue(
        orchResult({
          diagnosis: "APPLICATION_GAP",
          intervention: {
            kind: "six",
            sixComponent: "hands-on-practice",
            title: "Hands-on",
            emoji: "🛠️",
            href: "/study/six/hands-on-practice",
          },
          activityIntervention: {
            kind: "activity",
            adapterKey: "game",
            activityType: "GAME",
            title: "Learning game",
            reason: "Practice recognition with a learning game",
            href: "/study/activities/game?conceptId=concept-a",
            evidenceFacet: "RECOGNIZE",
          },
        }),
      );

      const result = await startAdaptiveSequenceRun({
        userId: USER_A,
        conceptId: CONCEPT_A,
      });

      expect(result.kind).toBe("started");
      if (result.kind !== "started") return;
      expect(result.currentStep.intervention).toBe("game");
      expect(result.currentStep.learningObjectId).toBeNull();
      expect(mockLearningAttemptCreate).not.toHaveBeenCalled();
    });

    it("2G-73: non-Adaptive-ready activityIntervention falls back to SIX", async () => {
      mockOrchestrateForConcept.mockResolvedValue(
        orchResult({
          diagnosis: "APPLICATION_GAP",
          intervention: {
            kind: "six",
            sixComponent: "hands-on-practice",
            title: "Hands-on",
            emoji: "🛠️",
            href: "/study/six/hands-on-practice",
          },
          activityIntervention: {
            kind: "activity",
            // quiz is assessment-only — not a universal Adaptive-ready key
            adapterKey: "quiz",
            activityType: "QUIZ_ITEM",
            title: "Quiz",
            reason: "should not become universal Adaptive step",
            href: "/quizzes/x",
            evidenceFacet: "RECOGNIZE",
          },
        }),
      );

      const result = await startAdaptiveSequenceRun({
        userId: USER_A,
        conceptId: CONCEPT_A,
      });

      expect(result.kind).toBe("started");
      if (result.kind !== "started") return;
      expect(result.currentStep.intervention).toBe("hands-on-practice");
    });

    it("2G-73: existing SIX step resumes without activity rewrite", async () => {
      mockAdaptiveSequenceRunFindFirst.mockResolvedValue(
        runRow({
          stepsJson: serializeSteps([
            { intervention: "detailed-explanation", learningObjectId: null },
          ]),
        }),
      );
      const resumed = await resumeAdaptiveSequenceRun(USER_A, RUN_ID);
      expect(resumed.kind).toBe("active");
      if (resumed.kind !== "active") return;
      expect(resumed.currentStep?.intervention).toBe("detailed-explanation");
    });

    it("2G-73: coding Adaptive step resumes as coding", async () => {
      mockAdaptiveSequenceRunFindFirst.mockResolvedValue(
        runRow({
          stepsJson: serializeSteps([
            { intervention: "coding", learningObjectId: null },
          ]),
        }),
      );
      const cur = await getCurrentAdaptiveSequenceStep(USER_A, RUN_ID);
      expect(cur.kind).toBe("active");
      if (cur.kind !== "active") return;
      expect(cur.step.intervention).toBe("coding");
    });
  });

  describe("CURRENT STEP / RESUME", () => {
    it("9. active run returns current step", async () => {
      const cur = await getCurrentAdaptiveSequenceStep(USER_A, RUN_ID);
      expect(cur.kind).toBe("active");
      if (cur.kind !== "active") return;
      expect(cur.step.intervention).toBe("detailed-explanation");
      expect(cur.stepIndex).toBe(0);
    });

    it("10. terminal run returns terminal state", async () => {
      mockAdaptiveSequenceRunFindFirst.mockResolvedValue(
        runRow({ status: "COMPLETED" }),
      );
      const cur = await getCurrentAdaptiveSequenceStep(USER_A, RUN_ID);
      expect(cur.kind).toBe("terminal");
    });

    it("32–34. resume restores state without evidence/mastery mutation", async () => {
      const resumed = await resumeAdaptiveSequenceRun(USER_A, RUN_ID);
      expect(resumed.kind).toBe("active");
      if (resumed.kind !== "active") return;
      expect(resumed.currentStep?.intervention).toBe("detailed-explanation");
      expect(mockLearningAttemptCreate).not.toHaveBeenCalled();
      expect(mockConceptMasteryUpsert).not.toHaveBeenCalled();
      expect(mockOrchestrateForConcept).not.toHaveBeenCalled();
    });

    it("28–29. completed/abandoned cannot resume as active", async () => {
      mockAdaptiveSequenceRunFindFirst.mockResolvedValue(
        runRow({ status: "ABANDONED" }),
      );
      const abandoned = await resumeAdaptiveSequenceRun(USER_A, RUN_ID);
      expect(abandoned.kind).toBe("terminal");
    });
  });

  describe("COMPLETION", () => {
    it("12–15. valid Attempt associates, advances cursor, updates lastAttemptId", async () => {
      mockLearningAttemptFindFirst.mockResolvedValue({
        id: ATTEMPT_ID,
        userId: USER_A,
        conceptId: CONCEPT_A,
        learningObjectId: "lo-x",
        outcome: "FAIL",
      });
      mockAdaptiveSequenceRunUpdate.mockResolvedValue(
        runRow({
          currentStepIndex: 1,
          lastAttemptId: ATTEMPT_ID,
          interventionHistoryJson: serializeInterventionHistory([
            {
              stepIndex: 0,
              intervention: "detailed-explanation",
              learningObjectId: null,
              attemptId: ATTEMPT_ID,
            },
          ]),
        }),
      );

      const result = await recordAdaptiveSequenceCompletion({
        userId: USER_A,
        runId: RUN_ID,
        attemptId: ATTEMPT_ID,
      });

      expect(result.kind).toBe("recorded");
      if (result.kind !== "recorded") return;
      expect(result.historyEntry.attemptId).toBe(ATTEMPT_ID);
      expect(result.run.lastAttemptId).toBe(ATTEMPT_ID);
      expect(result.run.currentStepIndex).toBe(1);
      // FAIL does not auto-complete/abandon
      expect(result.run.status).toBe("ACTIVE");
      expect(mockLearningAttemptCreate).not.toHaveBeenCalled();
    });

    it("16. duplicate attemptId is idempotent", async () => {
      mockAdaptiveSequenceRunFindFirst.mockResolvedValue(
        runRow({
          interventionHistoryJson: serializeInterventionHistory([
            {
              stepIndex: 0,
              intervention: "detailed-explanation",
              attemptId: ATTEMPT_ID,
            },
          ]),
          lastAttemptId: ATTEMPT_ID,
          currentStepIndex: 1,
        }),
      );
      const result = await recordAdaptiveSequenceCompletion({
        userId: USER_A,
        runId: RUN_ID,
        attemptId: ATTEMPT_ID,
      });
      expect(result.kind).toBe("idempotent");
      expect(mockAdaptiveSequenceRunUpdate).not.toHaveBeenCalled();
      expect(mockLearningAttemptFindFirst).not.toHaveBeenCalled();
    });

    it("17–19. wrong user / concept / LO rejected", async () => {
      mockLearningAttemptFindFirst.mockResolvedValueOnce({
        id: ATTEMPT_ID,
        userId: USER_B,
        conceptId: CONCEPT_A,
        learningObjectId: null,
        outcome: "SUCCESS",
      });
      await expect(
        recordAdaptiveSequenceCompletion({
          userId: USER_A,
          runId: RUN_ID,
          attemptId: ATTEMPT_ID,
        }),
      ).rejects.toMatchObject({ code: "ATTEMPT_OWNERSHIP_MISMATCH" });

      mockAdaptiveSequenceRunFindFirst.mockResolvedValue(runRow());
      mockLearningAttemptFindFirst.mockResolvedValueOnce({
        id: ATTEMPT_ID,
        userId: USER_A,
        conceptId: "other-concept",
        learningObjectId: null,
        outcome: "SUCCESS",
      });
      await expect(
        recordAdaptiveSequenceCompletion({
          userId: USER_A,
          runId: RUN_ID,
          attemptId: ATTEMPT_ID,
        }),
      ).rejects.toMatchObject({ code: "ATTEMPT_CONCEPT_MISMATCH" });

      mockAdaptiveSequenceRunFindFirst.mockResolvedValue(
        runRow({
          stepsJson: serializeSteps([
            {
              intervention: "detailed-explanation",
              learningObjectId: "lo-expected",
            },
          ]),
        }),
      );
      mockLearningAttemptFindFirst.mockResolvedValueOnce({
        id: ATTEMPT_ID,
        userId: USER_A,
        conceptId: CONCEPT_A,
        learningObjectId: "lo-other",
        outcome: "SUCCESS",
      });
      await expect(
        recordAdaptiveSequenceCompletion({
          userId: USER_A,
          runId: RUN_ID,
          attemptId: ATTEMPT_ID,
        }),
      ).rejects.toMatchObject({ code: "ATTEMPT_LEARNING_OBJECT_MISMATCH" });
    });

    it("20. nonexistent Attempt rejected", async () => {
      mockLearningAttemptFindFirst.mockResolvedValue(null);
      await expect(
        recordAdaptiveSequenceCompletion({
          userId: USER_A,
          runId: RUN_ID,
          attemptId: "missing",
        }),
      ).rejects.toMatchObject({ code: "ATTEMPT_NOT_FOUND" });
    });

    it("24–25. FAIL does not auto-complete/abandon or force same-intervention loop", async () => {
      mockLearningAttemptFindFirst.mockResolvedValue({
        id: ATTEMPT_ID,
        userId: USER_A,
        conceptId: CONCEPT_A,
        learningObjectId: null,
        outcome: "FAIL",
      });
      mockAdaptiveSequenceRunUpdate.mockResolvedValue(
        runRow({
          status: "ACTIVE",
          currentStepIndex: 1,
          lastAttemptId: ATTEMPT_ID,
        }),
      );
      const result = await recordAdaptiveSequenceCompletion({
        userId: USER_A,
        runId: RUN_ID,
        attemptId: ATTEMPT_ID,
      });
      expect(result.kind).toBe("recorded");
      expect(result.run.status).toBe("ACTIVE");
      // No automatic Orchestrator call on record
      expect(mockOrchestrateForConcept).not.toHaveBeenCalled();
    });
  });

  describe("NEXT INTERVENTION + SAFEGUARDS", () => {
    it("returns Orchestrator recommendation without appending a step", async () => {
      mockAdaptiveSequenceRunFindFirst.mockResolvedValue(
        runRow({
          currentStepIndex: 1,
          interventionHistoryJson: serializeInterventionHistory([
            {
              stepIndex: 0,
              intervention: "detailed-explanation",
              attemptId: ATTEMPT_ID,
            },
          ]),
        }),
      );
      mockOrchestrateForConcept.mockResolvedValue(
        orchResult({
          diagnosis: "APPLICATION_GAP",
          intervention: {
            kind: "six",
            sixComponent: "hands-on-practice",
            title: "Hands-on",
            emoji: "🛠️",
            href: "/study/six/hands-on-practice",
          },
        }),
      );
      const next = await getNextAdaptiveIntervention(USER_A, RUN_ID);
      expect(next.kind).toBe("recommendation");
      if (next.kind !== "recommendation") return;
      expect(next.immediateRepeat).toBe(false);
      expect(next.orchestrator.intervention?.sixComponent).toBe(
        "hands-on-practice",
      );
      expect(mockAdaptiveSequenceRunUpdate).not.toHaveBeenCalled();
    });

    it("22. immediate repeated intervention resolved via legal alternate when available (2P-42)", async () => {
      mockAdaptiveSequenceRunFindFirst.mockResolvedValue(
        runRow({
          currentStepIndex: 1,
          interventionHistoryJson: serializeInterventionHistory([
            {
              stepIndex: 0,
              intervention: "detailed-explanation",
              attemptId: ATTEMPT_ID,
            },
          ]),
        }),
      );
      mockOrchestrateForConcept.mockResolvedValue(
        orchResult({
          diagnosis: "UNDERSTANDING_GAP",
          intervention: {
            kind: "six",
            sixComponent: "detailed-explanation",
            title: "Detailed Explanation",
            emoji: "📖",
            href: "/study/six/detailed-explanation",
          },
        }),
      );
      const next = await getNextAdaptiveIntervention(USER_A, RUN_ID);
      expect(next.kind).toBe("recommendation");
      if (next.kind !== "recommendation") return;
      expect(next.immediateRepeat).toBe(false);
      expect(next.orchestrator.intervention?.sixComponent).toBe("feynman");
    });

    it("22b. immediate repeat remains flagged when no legal alternate (APPLICATION_GAP)", async () => {
      mockAdaptiveSequenceRunFindFirst.mockResolvedValue(
        runRow({
          currentStepIndex: 1,
          interventionHistoryJson: serializeInterventionHistory([
            {
              stepIndex: 0,
              intervention: "hands-on-practice",
              attemptId: ATTEMPT_ID,
            },
          ]),
        }),
      );
      mockOrchestrateForConcept.mockResolvedValue(
        orchResult({
          diagnosis: "APPLICATION_GAP",
          intervention: {
            kind: "six",
            sixComponent: "hands-on-practice",
            title: "Hands-on",
            emoji: "🛠️",
            href: "/study/six/hands-on-practice",
          },
          signals: {
            facets: {
              recognize: 0.7,
              explain: 0.7,
              apply: 0.2,
              solve: 0.1,
              perform: 0,
              retain: 0.3,
              confidence: 0.5,
            },
            evidenceSourceCounts: {
              quiz: 2,
              flashcard: 0,
              study_evaluate: 0,
              other: 0,
            },
            reviewCount: 2,
            evidenceSourceKinds: 1,
            usedTopicMasteryFallback: false,
          },
        }),
      );
      const next = await getNextAdaptiveIntervention(USER_A, RUN_ID);
      expect(next.kind).toBe("recommendation");
      if (next.kind !== "recommendation") return;
      expect(next.immediateRepeat).toBe(true);
    });

    it("21. max-step policy enforced", async () => {
      const history = Array.from({ length: MAX_SEQUENCE_STEPS }, (_, i) => ({
        stepIndex: i,
        intervention: "chunking",
        attemptId: `a-${i}`,
      }));
      mockAdaptiveSequenceRunFindFirst.mockResolvedValue(
        runRow({
          currentStepIndex: MAX_SEQUENCE_STEPS,
          stepsJson: serializeSteps(
            history.map((h) => ({ intervention: h.intervention })),
          ),
          interventionHistoryJson: serializeInterventionHistory(history),
        }),
      );
      const cur = await getCurrentAdaptiveSequenceStep(USER_A, RUN_ID);
      expect(cur.kind).toBe("max_steps");

      const next = await getNextAdaptiveIntervention(USER_A, RUN_ID);
      expect(next.kind).toBe("max_steps");

      await expect(
        recordAdaptiveSequenceCompletion({
          userId: USER_A,
          runId: RUN_ID,
          attemptId: "new-attempt",
        }),
      ).rejects.toMatchObject({ code: "MAX_STEPS_REACHED" });
    });

    it("23/30/31. terminal runs cannot advance", async () => {
      mockAdaptiveSequenceRunFindFirst.mockResolvedValue(
        runRow({ status: "COMPLETED" }),
      );
      await expect(
        recordAdaptiveSequenceCompletion({
          userId: USER_A,
          runId: RUN_ID,
          attemptId: ATTEMPT_ID,
        }),
      ).rejects.toMatchObject({ code: "RUN_COMPLETED" });

      await expect(
        getNextAdaptiveIntervention(USER_A, RUN_ID),
      ).rejects.toMatchObject({ code: "RUN_COMPLETED" });
    });
  });

  describe("LIFECYCLE + OWNERSHIP", () => {
    it("26–27. ACTIVE → COMPLETED / ABANDONED", async () => {
      mockAdaptiveSequenceRunUpdate.mockResolvedValueOnce(
        runRow({ status: "COMPLETED" }),
      );
      const completed = await completeAdaptiveSequence(USER_A, RUN_ID);
      expect(completed.status).toBe("COMPLETED");

      mockAdaptiveSequenceRunFindFirst.mockResolvedValue(runRow());
      mockAdaptiveSequenceRunUpdate.mockResolvedValueOnce(
        runRow({ status: "ABANDONED" }),
      );
      const abandoned = await abandonAdaptiveSequence(USER_A, RUN_ID);
      expect(abandoned.status).toBe("ABANDONED");
    });

    it("35–37. another learner cannot read/modify or attach attempts", async () => {
      mockAdaptiveSequenceRunFindFirst.mockResolvedValue(null);
      await expect(
        getCurrentAdaptiveSequenceStep(USER_B, RUN_ID),
      ).rejects.toMatchObject({ code: "RUN_NOT_FOUND" });

      await expect(
        recordAdaptiveSequenceCompletion({
          userId: USER_B,
          runId: RUN_ID,
          attemptId: ATTEMPT_ID,
        }),
      ).rejects.toMatchObject({ code: "RUN_NOT_FOUND" });
    });
  });
});

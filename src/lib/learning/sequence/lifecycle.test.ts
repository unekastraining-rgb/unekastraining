/**
 * Phase 2G-6 — Resume, lifecycle, duplicate-submit, and stale-step hardening.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const {
  mockLearningAttemptFindFirst,
  mockAdaptiveSequenceRunFindFirst,
  mockAdaptiveSequenceRunUpdate,
  mockAdaptiveSequenceRunUpdateMany,
  mockOrchestrateForConcept,
  mockLearningAttemptCreate,
  mockConceptMasteryUpsert,
  mockRetentionItemUpsert,
} = vi.hoisted(() => ({
  mockLearningAttemptFindFirst: vi.fn(),
  mockAdaptiveSequenceRunFindFirst: vi.fn(),
  mockAdaptiveSequenceRunUpdate: vi.fn(),
  mockAdaptiveSequenceRunUpdateMany: vi.fn(),
  mockOrchestrateForConcept: vi.fn(),
  mockLearningAttemptCreate: vi.fn(),
  mockConceptMasteryUpsert: vi.fn(),
  mockRetentionItemUpsert: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    learningAttempt: {
      findFirst: mockLearningAttemptFindFirst,
      create: mockLearningAttemptCreate,
    },
    adaptiveSequenceRun: {
      findFirst: mockAdaptiveSequenceRunFindFirst,
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
  getAdaptiveSequenceLastAttemptPointer,
  getNextAdaptiveIntervention,
  recordAdaptiveSequenceCompletion,
  recordAdaptiveSequenceCompletionAndPlanNext,
  resumeAdaptiveSequenceRun,
} from "@/lib/learning/sequence/coordinator";
import { MAX_SEQUENCE_STEPS } from "@/lib/learning/sequence/policy";
import {
  serializeInterventionHistory,
  serializeSteps,
} from "@/lib/learning/sequence/json";
import type { OrchestratorResult } from "@/lib/learning/orchestrator/diagnose";

const USER_A = "user-a";
const USER_B = "user-b";
const RUN_A = "run-a";
const RUN_B = "run-b";
const CONCEPT_A = "concept-a";

function runRow(overrides: Record<string, unknown> = {}) {
  return {
    id: RUN_A,
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

function orch(component: string): OrchestratorResult {
  return {
    learnerId: USER_A,
    conceptId: CONCEPT_A,
    conceptTitle: "Exceptions",
    diagnosis: "APPLICATION_GAP",
    intervention: {
      kind: "six",
      sixComponent: component as "hands-on-practice",
      title: component,
      emoji: "📚",
      href: `/study/six/${component}`,
    },
    reason: "test",
    confidence: "MEDIUM",
    signals: {
      facets: {
        recognize: 0.3,
        explain: 0.3,
        apply: 0.2,
        solve: 0,
        perform: 0,
        retain: 0.3,
        confidence: 0.4,
      },
      evidenceSourceCounts: {
        quiz: 1,
        flashcard: 0,
        study_evaluate: 1,
        other: 0,
      },
      reviewCount: 2,
      evidenceSourceKinds: 2,
      usedTopicMasteryFallback: false,
    },
  };
}

describe("Phase 2G-6 lifecycle hardening", () => {
  let state: ReturnType<typeof runRow>;

  beforeEach(() => {
    vi.clearAllMocks();
    state = runRow();
    mockAdaptiveSequenceRunFindFirst.mockReset();
    mockAdaptiveSequenceRunUpdate.mockReset();
    mockAdaptiveSequenceRunUpdateMany.mockReset();
    mockAdaptiveSequenceRunFindFirst.mockImplementation(async () => state);
    mockAdaptiveSequenceRunUpdate.mockImplementation(async ({ data }) => {
      state = { ...state, ...data };
      return state;
    });
    mockAdaptiveSequenceRunUpdateMany.mockImplementation(
      async ({ where, data }) => {
        if (
          where?.currentStepIndex !== undefined &&
          where.currentStepIndex !== state.currentStepIndex
        ) {
          return { count: 0 };
        }
        if (where?.status && where.status !== state.status) {
          return { count: 0 };
        }
        state = { ...state, ...data };
        return { count: 1 };
      },
    );
    mockLearningAttemptFindFirst.mockResolvedValue({
      id: "attempt-1",
      userId: USER_A,
      conceptId: CONCEPT_A,
      learningObjectId: "lo",
      outcome: "SUCCESS",
    });
  });

  describe("RESUME", () => {
    it("1–4. active resume is read-only at same step", async () => {
      const resumed = await resumeAdaptiveSequenceRun(USER_A, RUN_A);
      expect(resumed.kind).toBe("active");
      if (resumed.kind !== "active") return;
      expect(resumed.currentStep?.intervention).toBe("detailed-explanation");
      expect(resumed.run.currentStepIndex).toBe(0);
      expect(mockOrchestrateForConcept).not.toHaveBeenCalled();
      expect(mockLearningAttemptCreate).not.toHaveBeenCalled();
      expect(mockConceptMasteryUpsert).not.toHaveBeenCalled();
      expect(mockAdaptiveSequenceRunUpdate).not.toHaveBeenCalled();
      expect(mockAdaptiveSequenceRunUpdateMany).not.toHaveBeenCalled();
    });

    it("5–6. completed/abandoned resume is terminal", async () => {
      state = runRow({ status: "COMPLETED" });
      expect((await resumeAdaptiveSequenceRun(USER_A, RUN_A)).kind).toBe(
        "terminal",
      );
      state = runRow({ status: "ABANDONED" });
      expect((await resumeAdaptiveSequenceRun(USER_A, RUN_A)).kind).toBe(
        "terminal",
      );
    });

    it("lastAttemptId missing Attempt degrades safely", async () => {
      state = runRow({ lastAttemptId: "ghost-attempt" });
      mockLearningAttemptFindFirst.mockResolvedValueOnce(null);
      const pointer = await getAdaptiveSequenceLastAttemptPointer(USER_A, RUN_A);
      expect(pointer.lastAttemptId).toBe("ghost-attempt");
      expect(pointer.attemptExists).toBe(false);
    });
  });

  describe("ABANDON / COMPLETE", () => {
    it("7–11. abandon locks the run", async () => {
      mockAdaptiveSequenceRunUpdate.mockImplementation(async ({ data }) => {
        state = { ...state, ...data };
        return state;
      });
      const abandoned = await abandonAdaptiveSequence(USER_A, RUN_A);
      expect(abandoned.status).toBe("ABANDONED");

      await expect(
        recordAdaptiveSequenceCompletion({
          userId: USER_A,
          runId: RUN_A,
          attemptId: "attempt-1",
        }),
      ).rejects.toMatchObject({ code: "RUN_ABANDONED" });
      await expect(
        getNextAdaptiveIntervention(USER_A, RUN_A),
      ).rejects.toMatchObject({ code: "RUN_ABANDONED" });
      await expect(completeAdaptiveSequence(USER_A, RUN_A)).rejects.toMatchObject(
        { code: "RUN_ABANDONED" },
      );
      const resumed = await resumeAdaptiveSequenceRun(USER_A, RUN_A);
      expect(resumed.kind).toBe("terminal");
    });

    it("12–16. complete locks the run", async () => {
      state = runRow();
      const completed = await completeAdaptiveSequence(USER_A, RUN_A);
      expect(completed.status).toBe("COMPLETED");

      await expect(
        recordAdaptiveSequenceCompletion({
          userId: USER_A,
          runId: RUN_A,
          attemptId: "attempt-1",
        }),
      ).rejects.toMatchObject({ code: "RUN_COMPLETED" });
      await expect(abandonAdaptiveSequence(USER_A, RUN_A)).rejects.toMatchObject(
        { code: "RUN_COMPLETED" },
      );
      expect((await resumeAdaptiveSequenceRun(USER_A, RUN_A)).kind).toBe(
        "terminal",
      );
    });
  });

  describe("DUPLICATE / STALE / DIFFERENT ATTEMPT", () => {
    it("17–21. same Attempt twice is idempotent; Orchestrator once via planNext", async () => {
      mockOrchestrateForConcept.mockResolvedValue(orch("hands-on-practice"));

      const first = await recordAdaptiveSequenceCompletionAndPlanNext({
        userId: USER_A,
        runId: RUN_A,
        attemptId: "attempt-1",
      });
      expect(first.kind).toBe("NEXT_STEP");
      expect(mockOrchestrateForConcept).toHaveBeenCalledTimes(1);

      const second = await recordAdaptiveSequenceCompletionAndPlanNext({
        userId: USER_A,
        runId: RUN_A,
        attemptId: "attempt-1",
      });
      expect(second.kind).toBe("ALREADY_PROCESSED");
      expect(mockOrchestrateForConcept).toHaveBeenCalledTimes(1);
      expect(second.run.interventionHistory).toHaveLength(1);
    });

    it("22–24. old/future stepIndex rejected; current accepted", async () => {
      state = runRow({ currentStepIndex: 1 });
      state.stepsJson = serializeSteps([
        { intervention: "detailed-explanation" },
        { intervention: "feynman" },
      ]);

      await expect(
        recordAdaptiveSequenceCompletion({
          userId: USER_A,
          runId: RUN_A,
          attemptId: "attempt-new",
          stepIndex: 0,
        }),
      ).rejects.toMatchObject({ code: "STALE_STEP" });

      await expect(
        recordAdaptiveSequenceCompletion({
          userId: USER_A,
          runId: RUN_A,
          attemptId: "attempt-new",
          stepIndex: 2,
        }),
      ).rejects.toMatchObject({ code: "INVALID_CURRENT_STEP" });

      mockLearningAttemptFindFirst.mockResolvedValue({
        id: "attempt-new",
        userId: USER_A,
        conceptId: CONCEPT_A,
        learningObjectId: "lo",
        outcome: "PARTIAL",
      });
      const ok = await recordAdaptiveSequenceCompletion({
        userId: USER_A,
        runId: RUN_A,
        attemptId: "attempt-new",
        stepIndex: 1,
      });
      expect(ok.kind).toBe("recorded");
    });

    it("25–26. different Attempt on advanced step rejected; current accepted", async () => {
      state = runRow({
        currentStepIndex: 1,
        interventionHistoryJson: serializeInterventionHistory([
          {
            stepIndex: 0,
            intervention: "detailed-explanation",
            attemptId: "attempt-1",
          },
        ]),
        stepsJson: serializeSteps([
          { intervention: "detailed-explanation" },
          { intervention: "feynman" },
        ]),
      });

      await expect(
        recordAdaptiveSequenceCompletion({
          userId: USER_A,
          runId: RUN_A,
          attemptId: "attempt-2",
          stepIndex: 0,
        }),
      ).rejects.toMatchObject({ code: "STALE_STEP" });

      mockLearningAttemptFindFirst.mockResolvedValue({
        id: "attempt-2",
        userId: USER_A,
        conceptId: CONCEPT_A,
        learningObjectId: "lo",
        outcome: "FAIL",
      });
      const ok = await recordAdaptiveSequenceCompletion({
        userId: USER_A,
        runId: RUN_A,
        attemptId: "attempt-2",
      });
      expect(ok.kind).toBe("recorded");
    });
  });

  describe("CONCURRENCY / MULTI-RUN / MAX / REPEAT", () => {
    it("27. stale cursor cannot silently advance twice", async () => {
      state = runRow({
        currentStepIndex: 1,
        interventionHistoryJson: serializeInterventionHistory([
          {
            stepIndex: 0,
            intervention: "detailed-explanation",
            attemptId: "attempt-other",
          },
        ]),
        stepsJson: serializeSteps([
          { intervention: "detailed-explanation" },
          { intervention: "feynman" },
        ]),
      });

      await expect(
        recordAdaptiveSequenceCompletion({
          userId: USER_A,
          runId: RUN_A,
          attemptId: "attempt-1",
          stepIndex: 0,
        }),
      ).rejects.toMatchObject({ code: "STALE_STEP" });

      // Concurrent writer lost the race on matching cursor:
      mockAdaptiveSequenceRunUpdateMany.mockImplementationOnce(async () => ({
        count: 0,
      }));
      state = runRow({ currentStepIndex: 0 });
      mockLearningAttemptFindFirst.mockResolvedValue({
        id: "attempt-race",
        userId: USER_A,
        conceptId: CONCEPT_A,
        learningObjectId: "lo",
        outcome: "SUCCESS",
      });
      // After failed write, persisted state already advanced without this attempt.
      mockAdaptiveSequenceRunFindFirst
        .mockResolvedValueOnce(runRow({ currentStepIndex: 0 }))
        .mockResolvedValueOnce(
          runRow({
            currentStepIndex: 1,
            interventionHistoryJson: serializeInterventionHistory([
              {
                stepIndex: 0,
                intervention: "detailed-explanation",
                attemptId: "attempt-other",
              },
            ]),
            stepsJson: serializeSteps([
              { intervention: "detailed-explanation" },
              { intervention: "feynman" },
            ]),
          }),
        );

      await expect(
        recordAdaptiveSequenceCompletion({
          userId: USER_A,
          runId: RUN_A,
          attemptId: "attempt-race",
        }),
      ).rejects.toMatchObject({ code: "CONCURRENT_MODIFICATION" });
    });

    it("28–29. two runs are independent; cross-user rejected", async () => {
      const runA = runRow({ id: RUN_A });
      const runB = runRow({
        id: RUN_B,
        currentStepIndex: 0,
        stepsJson: serializeSteps([{ intervention: "chunking" }]),
      });

      mockAdaptiveSequenceRunFindFirst.mockImplementation(async ({ where }) => {
        if (where?.id === RUN_B) return runB;
        if (where?.userId === USER_B) return null;
        return runA;
      });

      const a = await resumeAdaptiveSequenceRun(USER_A, RUN_A);
      const b = await resumeAdaptiveSequenceRun(USER_A, RUN_B);
      expect(a.kind).toBe("active");
      expect(b.kind).toBe("active");
      if (a.kind === "active" && b.kind === "active") {
        expect(a.currentStep?.intervention).toBe("detailed-explanation");
        expect(b.currentStep?.intervention).toBe("chunking");
      }

      expect(await resumeAdaptiveSequenceRun(USER_B, RUN_A)).toEqual({
        kind: "not_found",
      });
    });

    it("30–31. max-step stop skips Orchestrator", async () => {
      const history = Array.from({ length: MAX_SEQUENCE_STEPS - 1 }, (_, i) => ({
        stepIndex: i,
        intervention: "chunking",
        attemptId: `a-${i}`,
      }));
      const steps = [
        ...history.map((h) => ({ intervention: h.intervention })),
        { intervention: "feynman" },
      ];
      state = runRow({
        currentStepIndex: MAX_SEQUENCE_STEPS - 1,
        stepsJson: serializeSteps(steps),
        interventionHistoryJson: serializeInterventionHistory(history),
      });

      const result = await recordAdaptiveSequenceCompletionAndPlanNext({
        userId: USER_A,
        runId: RUN_A,
        attemptId: "attempt-1",
      });
      expect(result.kind).toBe("STOP_MAX_STEPS");
      expect(mockOrchestrateForConcept).not.toHaveBeenCalled();
    });

    it("32–33. immediate repeat STOPs when no legal alternate (APPLICATION_GAP singleton)", async () => {
      state = runRow({
        stepsJson: serializeSteps([{ intervention: "hands-on-practice" }]),
      });
      mockOrchestrateForConcept.mockResolvedValue({
        ...orch("hands-on-practice"),
        diagnosis: "APPLICATION_GAP",
        intervention: {
          kind: "six",
          sixComponent: "hands-on-practice",
          title: "Hands-on Practice",
          emoji: "🛠️",
          href: "/study/six/hands-on-practice",
        },
      });

      const result = await recordAdaptiveSequenceCompletionAndPlanNext({
        userId: USER_A,
        runId: RUN_A,
        attemptId: "attempt-1",
      });
      expect(result.kind).toBe("STOP_IMMEDIATE_REPEAT");
      if (result.kind !== "STOP_IMMEDIATE_REPEAT") return;
      expect(result.run.steps).toHaveLength(1);
    });
  });
});

describe("Phase 2G-6 preservation", () => {
  it("34–40. no product/LUCKY/SIX/evidence wiring; no API route", () => {
    const coord = readFileSync(
      path.join(process.cwd(), "src/lib/learning/sequence/coordinator.ts"),
      "utf8",
    );
    expect(coord).toContain("updateAdaptiveSequenceRunStateIfCursorMatches");
    expect(coord).toContain("STALE_STEP");
    expect(coord).not.toMatch(/recordEvidence|applyEvidenceToMastery|upsertRetentionItem/);
    expect(coord).not.toMatch(/router\.|redirect/);

    expect(
      existsSync(path.join(process.cwd(), "app/api/learning/sequence/route.ts")),
    ).toBe(false);

    const diagnose = readFileSync(
      path.join(process.cwd(), "src/lib/learning/orchestrator/diagnose.ts"),
      "utf8",
    );
    expect(diagnose).not.toMatch(/STALE_STEP|AdaptiveSequenceRun/);

    const six = readFileSync(path.join(process.cwd(), "src/lib/csl/six.ts"), "utf8");
    expect(six).not.toMatch(/AdaptiveSequence|STALE_STEP/);

    const hub = readFileSync(
      path.join(process.cwd(), "app/study/study-hub-view.tsx"),
      "utf8",
    );
    expect(hub).not.toMatch(/resumeAdaptiveSequenceRun|recordAdaptiveSequenceCompletion/);
  });
});

/**
 * Phase 2G-5 — Evidence → re-orchestrate → append next step.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const {
  mockConceptFindFirst,
  mockLearningAttemptFindFirst,
  mockAdaptiveSequenceRunFindFirst,
  mockAdaptiveSequenceRunUpdate,
  mockAdaptiveSequenceRunUpdateMany,
  mockAdaptiveSequenceRunCreate,
  mockOrchestrateForConcept,
  mockLearningAttemptCreate,
  mockConceptMasteryUpsert,
  mockRetentionItemUpsert,
  mockLearningObjectFindFirst,
} = vi.hoisted(() => ({
  mockConceptFindFirst: vi.fn(),
  mockLearningAttemptFindFirst: vi.fn(),
  mockAdaptiveSequenceRunFindFirst: vi.fn(),
  mockAdaptiveSequenceRunUpdate: vi.fn(),
  mockAdaptiveSequenceRunUpdateMany: vi.fn(),
  mockAdaptiveSequenceRunCreate: vi.fn(),
  mockOrchestrateForConcept: vi.fn(),
  mockLearningAttemptCreate: vi.fn(),
  mockConceptMasteryUpsert: vi.fn(),
  mockRetentionItemUpsert: vi.fn(),
  mockLearningObjectFindFirst: vi.fn(),
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

import type { OrchestratorResult } from "@/lib/learning/orchestrator/diagnose";
import {
  recordAdaptiveSequenceCompletionAndPlanNext,
} from "@/lib/learning/sequence/coordinator";
import { MAX_SEQUENCE_STEPS } from "@/lib/learning/sequence/policy";
import {
  serializeInterventionHistory,
  serializeSteps,
} from "@/lib/learning/sequence/json";

const USER_A = "user-a";
const USER_B = "user-b";
const CONCEPT_A = "concept-a";
const RUN_ID = "run-1";
const ATTEMPT_ID = "attempt-1";

function orch(
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
        recognize: 0.3,
        explain: 0.3,
        apply: 0.3,
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
    ...partial,
  };
}

function sixIntervention(component: string) {
  return {
    kind: "six" as const,
    sixComponent: component as
      | "chunking"
      | "detailed-explanation"
      | "feynman"
      | "visualization"
      | "hands-on-practice"
      | "active-recall",
    title: component,
    emoji: "📚",
    href: `/study/six/${component}`,
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

function attemptRow(outcome: string, overrides: Record<string, unknown> = {}) {
  return {
    id: ATTEMPT_ID,
    userId: USER_A,
    conceptId: CONCEPT_A,
    learningObjectId: "lo-any",
    outcome,
    ...overrides,
  };
}

describe("Phase 2G-5 recordAdaptiveSequenceCompletionAndPlanNext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConceptFindFirst.mockResolvedValue({ id: CONCEPT_A, userId: USER_A });
    mockAdaptiveSequenceRunFindFirst.mockResolvedValue(runRow());
    mockLearningAttemptFindFirst.mockResolvedValue(attemptRow("SUCCESS"));
    mockAdaptiveSequenceRunUpdate.mockImplementation(async ({ data }) => {
      const prev = await mockAdaptiveSequenceRunFindFirst();
      return { ...prev, ...data };
    });
    mockAdaptiveSequenceRunUpdateMany.mockImplementation(async ({ data }) => {
      const prev = await mockAdaptiveSequenceRunFindFirst();
      const next = { ...prev, ...data };
      mockAdaptiveSequenceRunFindFirst.mockResolvedValue(next);
      return { count: 1 };
    });
  });

  it("1–7. completed Attempt re-orchestrates and appends next step", async () => {
    let state = runRow();
    mockAdaptiveSequenceRunFindFirst.mockImplementation(async () => state);
    mockAdaptiveSequenceRunUpdateMany.mockImplementation(async ({ data }) => {
      state = { ...state, ...data };
      return { count: 1 };
    });
    mockAdaptiveSequenceRunUpdate.mockImplementation(async ({ data }) => {
      state = { ...state, ...data };
      return state;
    });
    mockOrchestrateForConcept.mockResolvedValue(
      orch({
        diagnosis: "APPLICATION_GAP",
        intervention: sixIntervention("hands-on-practice"),
      }),
    );

    const result = await recordAdaptiveSequenceCompletionAndPlanNext({
      userId: USER_A,
      runId: RUN_ID,
      attemptId: ATTEMPT_ID,
    });

    expect(result.kind).toBe("NEXT_STEP");
    if (result.kind !== "NEXT_STEP") return;
    expect(result.currentStep.intervention).toBe("hands-on-practice");
    expect(result.stepIndex).toBe(1);
    expect(result.historyEntry.attemptId).toBe(ATTEMPT_ID);
    expect(result.historyEntry.intervention).toBe("detailed-explanation");
    expect(result.run.steps).toHaveLength(2);
    expect(result.run.interventionHistory).toHaveLength(1);
    expect(result.run.interventionHistory[0]?.attemptId).toBe(ATTEMPT_ID);
    expect(mockOrchestrateForConcept).toHaveBeenCalledTimes(1);
    expect(mockLearningAttemptCreate).not.toHaveBeenCalled();
    expect(mockConceptMasteryUpsert).not.toHaveBeenCalled();
  });

  it("8–10. NO_INTERVENTION stops cleanly without fake step or auto-complete", async () => {
    let state = runRow();
    mockAdaptiveSequenceRunFindFirst.mockImplementation(async () => state);
    mockAdaptiveSequenceRunUpdateMany.mockImplementation(async ({ data }) => {
      state = { ...state, ...data };
      return { count: 1 };
    });
    mockOrchestrateForConcept.mockResolvedValue(
      orch({ diagnosis: "NO_INTERVENTION", intervention: null }),
    );

    const result = await recordAdaptiveSequenceCompletionAndPlanNext({
      userId: USER_A,
      runId: RUN_ID,
      attemptId: ATTEMPT_ID,
    });

    expect(result.kind).toBe("STOP_NO_INTERVENTION");
    if (result.kind !== "STOP_NO_INTERVENTION") return;
    expect(result.run.status).toBe("ACTIVE");
    expect(result.run.steps).toHaveLength(1);
    expect(mockAdaptiveSequenceRunUpdateMany).toHaveBeenCalledTimes(1); // record only
  });

  it("11–13. immediate same intervention picks legal SIX alternate when available (2P-42)", async () => {
    let state = runRow();
    mockAdaptiveSequenceRunFindFirst.mockImplementation(async () => state);
    mockAdaptiveSequenceRunUpdate.mockImplementation(async ({ data }) => {
      state = { ...state, ...data };
      return state;
    });
    mockAdaptiveSequenceRunUpdateMany.mockImplementation(async ({ data }) => {
      state = { ...state, ...data };
      return { count: 1 };
    });
    mockOrchestrateForConcept.mockResolvedValue(
      orch({
        diagnosis: "UNDERSTANDING_GAP",
        intervention: sixIntervention("detailed-explanation"),
      }),
    );

    const result = await recordAdaptiveSequenceCompletionAndPlanNext({
      userId: USER_A,
      runId: RUN_ID,
      attemptId: ATTEMPT_ID,
    });

    // Co-eligible UNDERSTANDING_GAP techniques → feynman alternate instead of STOP.
    expect(result.kind).toBe("NEXT_STEP");
    if (result.kind !== "NEXT_STEP") return;
    expect(result.currentStep.intervention).not.toBe("detailed-explanation");
    expect(result.currentStep.intervention).toBe("feynman");
    expect(result.run.steps).toHaveLength(2);
  });

  it("11b. immediate repeat STOPs when no legal alternate exists (APPLICATION_GAP singleton)", async () => {
    let state = runRow({
      stepsJson: serializeSteps([{ intervention: "hands-on-practice" }]),
      interventionHistoryJson: serializeInterventionHistory([]),
    });
    mockAdaptiveSequenceRunFindFirst.mockImplementation(async () => state);
    mockAdaptiveSequenceRunUpdate.mockImplementation(async ({ data }) => {
      state = { ...state, ...data };
      return state;
    });
    mockAdaptiveSequenceRunUpdateMany.mockImplementation(async ({ data }) => {
      state = { ...state, ...data };
      return { count: 1 };
    });
    mockOrchestrateForConcept.mockResolvedValue(
      orch({
        diagnosis: "APPLICATION_GAP",
        intervention: sixIntervention("hands-on-practice"),
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
            quiz: 1,
            flashcard: 0,
            study_evaluate: 1,
            other: 0,
          },
          reviewCount: 2,
          evidenceSourceKinds: 2,
          usedTopicMasteryFallback: false,
        },
      }),
    );

    const result = await recordAdaptiveSequenceCompletionAndPlanNext({
      userId: USER_A,
      runId: RUN_ID,
      attemptId: ATTEMPT_ID,
    });

    expect(result.kind).toBe("STOP_IMMEDIATE_REPEAT");
    if (result.kind !== "STOP_IMMEDIATE_REPEAT") return;
    expect(result.run.steps).toHaveLength(1);
    expect(result.orchestrator.intervention?.sixComponent).toBe(
      "hands-on-practice",
    );
  });

  it("14–15. max steps prevents append and skips further Orchestrator when already at max", async () => {
    const history = Array.from({ length: MAX_SEQUENCE_STEPS - 1 }, (_, i) => ({
      stepIndex: i,
      intervention: "chunking",
      attemptId: `a-${i}`,
    }));
    const steps = history.map((h) => ({ intervention: h.intervention }));
    // One remaining active step to complete → history becomes MAX
    steps.push({ intervention: "feynman" });

    mockAdaptiveSequenceRunFindFirst.mockResolvedValue(
      runRow({
        currentStepIndex: MAX_SEQUENCE_STEPS - 1,
        stepsJson: serializeSteps(steps),
        interventionHistoryJson: serializeInterventionHistory(history),
      }),
    );
    mockAdaptiveSequenceRunUpdate.mockResolvedValue(
      runRow({
        currentStepIndex: MAX_SEQUENCE_STEPS,
        stepsJson: serializeSteps(steps),
        lastAttemptId: ATTEMPT_ID,
        interventionHistoryJson: serializeInterventionHistory([
          ...history,
          {
            stepIndex: MAX_SEQUENCE_STEPS - 1,
            intervention: "feynman",
            attemptId: ATTEMPT_ID,
          },
        ]),
      }),
    );

    const result = await recordAdaptiveSequenceCompletionAndPlanNext({
      userId: USER_A,
      runId: RUN_ID,
      attemptId: ATTEMPT_ID,
    });

    expect(result.kind).toBe("STOP_MAX_STEPS");
    expect(mockOrchestrateForConcept).not.toHaveBeenCalled();
  });

  it("16–19. SUCCESS / PARTIAL / FAIL re-orchestrate; ABANDONED attempt does not abandon run", async () => {
    for (const outcome of ["SUCCESS", "PARTIAL", "FAIL", "ABANDONED"] as const) {
      vi.clearAllMocks();
      mockAdaptiveSequenceRunFindFirst.mockResolvedValue(runRow());
      mockLearningAttemptFindFirst.mockResolvedValue(attemptRow(outcome));
      mockOrchestrateForConcept.mockResolvedValue(
        orch({
          diagnosis: "RECALL_GAP",
          intervention: sixIntervention("active-recall"),
        }),
      );
      mockAdaptiveSequenceRunUpdate
        .mockResolvedValueOnce(
          runRow({
            status: "ACTIVE",
            currentStepIndex: 1,
            lastAttemptId: ATTEMPT_ID,
            interventionHistoryJson: serializeInterventionHistory([
              {
                stepIndex: 0,
                intervention: "detailed-explanation",
                attemptId: ATTEMPT_ID,
              },
            ]),
          }),
        )
        .mockResolvedValueOnce(
          runRow({
            status: "ACTIVE",
            currentStepIndex: 1,
            stepsJson: serializeSteps([
              { intervention: "detailed-explanation" },
              { intervention: "active-recall" },
            ]),
            interventionHistoryJson: serializeInterventionHistory([
              {
                stepIndex: 0,
                intervention: "detailed-explanation",
                attemptId: ATTEMPT_ID,
              },
            ]),
          }),
        );

      const result = await recordAdaptiveSequenceCompletionAndPlanNext({
        userId: USER_A,
        runId: RUN_ID,
        attemptId: ATTEMPT_ID,
      });
      expect(result.kind).toBe("NEXT_STEP");
      expect(result.run.status).toBe("ACTIVE");
      expect(mockOrchestrateForConcept).toHaveBeenCalled();
    }
  });

  it("20–23. foreign Attempt / wrong concept / wrong LO / foreign run rejected", async () => {
    mockLearningAttemptFindFirst.mockResolvedValueOnce(
      attemptRow("SUCCESS", { userId: USER_B }),
    );
    await expect(
      recordAdaptiveSequenceCompletionAndPlanNext({
        userId: USER_A,
        runId: RUN_ID,
        attemptId: ATTEMPT_ID,
      }),
    ).rejects.toMatchObject({ code: "ATTEMPT_OWNERSHIP_MISMATCH" });

    mockAdaptiveSequenceRunFindFirst.mockResolvedValue(runRow());
    mockLearningAttemptFindFirst.mockResolvedValueOnce(
      attemptRow("SUCCESS", { conceptId: "other" }),
    );
    await expect(
      recordAdaptiveSequenceCompletionAndPlanNext({
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
    mockLearningAttemptFindFirst.mockResolvedValueOnce(
      attemptRow("SUCCESS", { learningObjectId: "lo-other" }),
    );
    await expect(
      recordAdaptiveSequenceCompletionAndPlanNext({
        userId: USER_A,
        runId: RUN_ID,
        attemptId: ATTEMPT_ID,
      }),
    ).rejects.toMatchObject({ code: "ATTEMPT_LEARNING_OBJECT_MISMATCH" });

    mockAdaptiveSequenceRunFindFirst.mockResolvedValue(null);
    await expect(
      recordAdaptiveSequenceCompletionAndPlanNext({
        userId: USER_B,
        runId: RUN_ID,
        attemptId: ATTEMPT_ID,
      }),
    ).rejects.toMatchObject({ code: "RUN_NOT_FOUND" });
  });

  it("24–27. same Attempt twice is ALREADY_PROCESSED without second Orchestrator call", async () => {
    mockAdaptiveSequenceRunFindFirst.mockResolvedValue(
      runRow({
        currentStepIndex: 1,
        stepsJson: serializeSteps([
          { intervention: "detailed-explanation" },
          { intervention: "feynman" },
        ]),
        interventionHistoryJson: serializeInterventionHistory([
          {
            stepIndex: 0,
            intervention: "detailed-explanation",
            attemptId: ATTEMPT_ID,
          },
        ]),
        lastAttemptId: ATTEMPT_ID,
      }),
    );

    const result = await recordAdaptiveSequenceCompletionAndPlanNext({
      userId: USER_A,
      runId: RUN_ID,
      attemptId: ATTEMPT_ID,
    });

    expect(result.kind).toBe("ALREADY_PROCESSED");
    if (result.kind !== "ALREADY_PROCESSED") return;
    expect(result.run.steps).toHaveLength(2);
    expect(result.run.interventionHistory).toHaveLength(1);
    expect(mockOrchestrateForConcept).not.toHaveBeenCalled();
    expect(mockAdaptiveSequenceRunUpdate).not.toHaveBeenCalled();
  });
});

describe("Phase 2G-5 preservation", () => {
  it("28–32. diagnose / SIX / Attempt / mastery / LUCKY untouched by plan-next", () => {
    const coord = readFileSync(
      path.join(process.cwd(), "src/lib/learning/sequence/coordinator.ts"),
      "utf8",
    );
    expect(coord).toContain("recordAdaptiveSequenceCompletionAndPlanNext");
    expect(coord).toContain("orchestrateForConcept");
    expect(coord).not.toMatch(/recordEvidence|applyEvidenceToMastery|upsertRetentionItem/);
    expect(coord).not.toMatch(/router\.|window\.|redirect/);

    const diagnose = readFileSync(
      path.join(process.cwd(), "src/lib/learning/orchestrator/diagnose.ts"),
      "utf8",
    );
    expect(diagnose).not.toMatch(
      /recordAdaptiveSequenceCompletionAndPlanNext|AdaptiveSequenceRun/,
    );

    const evaluate = readFileSync(
      path.join(process.cwd(), "src/lib/learning/assessment/evaluate-bridge.ts"),
      "utf8",
    );
    expect(evaluate).not.toMatch(/recordAdaptiveSequenceCompletionAndPlanNext/);

    const retention = readFileSync(
      path.join(process.cwd(), "src/lib/learning/retention/index.ts"),
      "utf8",
    );
    expect(retention).not.toMatch(/recordAdaptiveSequenceCompletionAndPlanNext/);
  });
});

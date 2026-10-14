/**
 * Phase 2G-7 — Explicit COMPLETE → existing syncWeakMasteryRetentionItem handoff.
 * Spies on the retention bridge; does not re-test retention engine internals.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
  mockGetLearnerConceptMastery,
  mockSyncWeakMasteryRetentionItem,
} = vi.hoisted(() => ({
  mockLearningAttemptFindFirst: vi.fn(),
  mockAdaptiveSequenceRunFindFirst: vi.fn(),
  mockAdaptiveSequenceRunUpdate: vi.fn(),
  mockAdaptiveSequenceRunUpdateMany: vi.fn(),
  mockOrchestrateForConcept: vi.fn(),
  mockLearningAttemptCreate: vi.fn(),
  mockConceptMasteryUpsert: vi.fn(),
  mockRetentionItemUpsert: vi.fn(),
  mockGetLearnerConceptMastery: vi.fn(),
  mockSyncWeakMasteryRetentionItem: vi.fn(),
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

vi.mock("@/lib/learning/learner-model/read", () => ({
  getLearnerConceptMastery: mockGetLearnerConceptMastery,
}));

vi.mock("@/lib/learning/retention", () => ({
  syncWeakMasteryRetentionItem: mockSyncWeakMasteryRetentionItem,
}));

import type { LearnerConceptMasterySummary } from "@/lib/learning/types";
import type { OrchestratorResult } from "@/lib/learning/orchestrator/diagnose";
import {
  abandonAdaptiveSequence,
  completeAdaptiveSequence,
  recordAdaptiveSequenceCompletionAndPlanNext,
} from "@/lib/learning/sequence/coordinator";
import { MAX_SEQUENCE_STEPS } from "@/lib/learning/sequence/policy";
import {
  serializeInterventionHistory,
  serializeSteps,
} from "@/lib/learning/sequence/json";

const USER_A = "user-a";
const USER_B = "user-b";
const RUN_A = "run-a";
const CONCEPT_A = "concept-a";

function masterySummary(
  overrides: Omit<Partial<LearnerConceptMasterySummary>, "facets"> & {
    facets?: Partial<LearnerConceptMasterySummary["facets"]>;
  } = {},
): LearnerConceptMasterySummary {
  const { facets: facetOverrides, ...rest } = overrides;
  return {
    learnerId: USER_A,
    conceptId: CONCEPT_A,
    conceptTitle: "Exceptions",
    facets: {
      recognize: 0.4,
      explain: 0.4,
      apply: 0.3,
      solve: 0.2,
      perform: 0.2,
      retain: 0.3,
      confidence: 0.4,
      ...(facetOverrides ?? {}),
    },
    topicMastery: null,
    recentMissedCount: 0,
    evidenceSourceCounts: {
      quiz: 1,
      flashcard: 0,
      study_evaluate: 1,
      other: 0,
    },
    reviewCount: 2,
    lastReviewedAt: new Date("2026-09-18T10:00:00.000Z"),
    nextReviewAt: new Date("2026-09-20T10:00:00.000Z"),
    ...rest,
  };
}

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

describe("Phase 2G-7 Lucky retention handoff", () => {
  let state: ReturnType<typeof runRow>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
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
    mockGetLearnerConceptMastery.mockResolvedValue(masterySummary());
    mockSyncWeakMasteryRetentionItem.mockResolvedValue({
      id: "ret-1",
      sourceType: "WEAK_MASTERY",
      sourceRef: CONCEPT_A,
    });
  });

  afterEach(() => {
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("1. COMPLETED + weak mastery invokes existing WEAK_MASTERY bridge", async () => {
    const nextReviewAt = new Date("2026-09-20T10:00:00.000Z");
    mockGetLearnerConceptMastery.mockResolvedValue(
      masterySummary({
        facets: { retain: 0.3 },
        reviewCount: 3,
        nextReviewAt,
      }),
    );

    const completed = await completeAdaptiveSequence(USER_A, RUN_A);

    expect(completed.status).toBe("COMPLETED");
    expect(mockGetLearnerConceptMastery).toHaveBeenCalledWith(
      USER_A,
      CONCEPT_A,
    );
    expect(mockSyncWeakMasteryRetentionItem).toHaveBeenCalledTimes(1);
    expect(mockSyncWeakMasteryRetentionItem).toHaveBeenCalledWith({
      userId: USER_A,
      conceptId: CONCEPT_A,
      retain: 0.3,
      reviewCount: 3,
      nextReviewAt,
      fromAdaptiveCompletion: true,
    });
    expect(mockConceptMasteryUpsert).not.toHaveBeenCalled();
    expect(mockRetentionItemUpsert).not.toHaveBeenCalled();
    expect(mockLearningAttemptCreate).not.toHaveBeenCalled();
  });

  it("2. COMPLETED + strong mastery still calls bridge (bridge completes/no-ops)", async () => {
    mockGetLearnerConceptMastery.mockResolvedValue(
      masterySummary({
        facets: { retain: 0.7 },
        reviewCount: 4,
      }),
    );
    mockSyncWeakMasteryRetentionItem.mockResolvedValue(null);

    const completed = await completeAdaptiveSequence(USER_A, RUN_A);

    expect(completed.status).toBe("COMPLETED");
    expect(mockSyncWeakMasteryRetentionItem).toHaveBeenCalledWith(
      expect.objectContaining({
        retain: 0.7,
        reviewCount: 4,
      }),
    );
  });

  it("3. missing ConceptMastery summary — COMPLETED, no forced retention", async () => {
    mockGetLearnerConceptMastery.mockResolvedValue(null);

    const completed = await completeAdaptiveSequence(USER_A, RUN_A);

    expect(completed.status).toBe("COMPLETED");
    expect(mockSyncWeakMasteryRetentionItem).not.toHaveBeenCalled();
    expect(mockConceptMasteryUpsert).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
  });

  it("4. reviewCount < 1 — COMPLETED; bridge invoked and may no-op", async () => {
    mockGetLearnerConceptMastery.mockResolvedValue(
      masterySummary({
        facets: { retain: 0.2 },
        reviewCount: 0,
      }),
    );
    mockSyncWeakMasteryRetentionItem.mockResolvedValue(null);

    const completed = await completeAdaptiveSequence(USER_A, RUN_A);

    expect(completed.status).toBe("COMPLETED");
    expect(mockSyncWeakMasteryRetentionItem).toHaveBeenCalledWith(
      expect.objectContaining({ reviewCount: 0, retain: 0.2 }),
    );
  });

  it("5. retention bridge throws — sequence stays COMPLETED", async () => {
    mockSyncWeakMasteryRetentionItem.mockRejectedValue(
      new Error("retention down"),
    );

    const completed = await completeAdaptiveSequence(USER_A, RUN_A);

    expect(completed.status).toBe("COMPLETED");
    expect(state.status).toBe("COMPLETED");
    expect(errorSpy).toHaveBeenCalled();
    expect(mockConceptMasteryUpsert).not.toHaveBeenCalled();
  });

  it("6. ABANDONED — no retention handoff", async () => {
    const abandoned = await abandonAdaptiveSequence(USER_A, RUN_A);
    expect(abandoned.status).toBe("ABANDONED");
    expect(mockGetLearnerConceptMastery).not.toHaveBeenCalled();
    expect(mockSyncWeakMasteryRetentionItem).not.toHaveBeenCalled();
  });

  it("7. ACTIVE without completion — no retention handoff", async () => {
    expect(state.status).toBe("ACTIVE");
    expect(mockGetLearnerConceptMastery).not.toHaveBeenCalled();
    expect(mockSyncWeakMasteryRetentionItem).not.toHaveBeenCalled();
  });

  it("8. STOP_NO_INTERVENTION — no retention handoff", async () => {
    mockOrchestrateForConcept.mockResolvedValue({
      ...orch("hands-on-practice"),
      diagnosis: "NO_INTERVENTION",
      intervention: null,
    });

    const result = await recordAdaptiveSequenceCompletionAndPlanNext({
      userId: USER_A,
      runId: RUN_A,
      attemptId: "attempt-1",
    });

    expect(result.kind).toBe("STOP_NO_INTERVENTION");
    expect(state.status).toBe("ACTIVE");
    expect(mockGetLearnerConceptMastery).not.toHaveBeenCalled();
    expect(mockSyncWeakMasteryRetentionItem).not.toHaveBeenCalled();
  });

  it("9. STOP_IMMEDIATE_REPEAT — no retention handoff", async () => {
    state = {
      ...state,
      stepsJson: serializeSteps([{ intervention: "hands-on-practice" }]),
    };
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
    expect(state.status).toBe("ACTIVE");
    expect(mockGetLearnerConceptMastery).not.toHaveBeenCalled();
    expect(mockSyncWeakMasteryRetentionItem).not.toHaveBeenCalled();
  });

  it("10. STOP_MAX_STEPS — no retention handoff", async () => {
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
    expect(state.status).toBe("ACTIVE");
    expect(mockOrchestrateForConcept).not.toHaveBeenCalled();
    expect(mockGetLearnerConceptMastery).not.toHaveBeenCalled();
    expect(mockSyncWeakMasteryRetentionItem).not.toHaveBeenCalled();
  });

  it("11. duplicate/terminal completion — no second handoff", async () => {
    await completeAdaptiveSequence(USER_A, RUN_A);
    expect(mockSyncWeakMasteryRetentionItem).toHaveBeenCalledTimes(1);

    await expect(completeAdaptiveSequence(USER_A, RUN_A)).rejects.toMatchObject(
      { code: "RUN_COMPLETED" },
    );
    expect(mockSyncWeakMasteryRetentionItem).toHaveBeenCalledTimes(1);
    expect(mockGetLearnerConceptMastery).toHaveBeenCalledTimes(1);
  });

  it("12. cross-user run cannot trigger retention", async () => {
    mockAdaptiveSequenceRunFindFirst.mockResolvedValue(null);

    await expect(completeAdaptiveSequence(USER_B, RUN_A)).rejects.toThrow();
    expect(mockSyncWeakMasteryRetentionItem).not.toHaveBeenCalled();
    expect(mockGetLearnerConceptMastery).not.toHaveBeenCalled();
  });

  it("13. preservation — no Attempt/mastery/orchestrator/schema side effects on complete", async () => {
    await completeAdaptiveSequence(USER_A, RUN_A);

    expect(mockLearningAttemptCreate).not.toHaveBeenCalled();
    expect(mockConceptMasteryUpsert).not.toHaveBeenCalled();
    expect(mockOrchestrateForConcept).not.toHaveBeenCalled();
    expect(mockRetentionItemUpsert).not.toHaveBeenCalled();

    const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");
    expect(existsSync(schemaPath)).toBe(true);
    const schema = readFileSync(schemaPath, "utf8");
    const runBlock = schema.match(
      /model AdaptiveSequenceRun \{[\s\S]*?\n\}/,
    )?.[0];
    expect(runBlock).toBeTruthy();
    expect(runBlock).not.toMatch(/RetentionItem|retentionItemId|sourceType/);
    expect(schema).toContain("WEAK_MASTERY");

    const handoff = readFileSync(
      path.join(process.cwd(), "src/lib/learning/sequence/lucky-handoff.ts"),
      "utf8",
    );
    expect(handoff).toContain("syncWeakMasteryRetentionItem");
    expect(handoff).not.toMatch(/stepsJson|currentStepIndex/);
  });
});

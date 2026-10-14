/**
 * Phase 2G-2 — AdaptiveSequenceRun domain unit tests.
 * Mocks DB; does not create LearningAttempt / ConceptMastery / RetentionItem.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockConceptFindFirst,
  mockLearningObjectFindFirst,
  mockAdaptiveSequenceRunCreate,
  mockAdaptiveSequenceRunFindFirst,
  mockAdaptiveSequenceRunFindMany,
  mockAdaptiveSequenceRunUpdate,
  mockAdaptiveSequenceRunUpdateMany,
  mockAdaptiveSequenceRunDelete,
  mockLearningAttemptCreate,
  mockConceptMasteryUpsert,
  mockRetentionItemUpsert,
  mockTopicMasteryUpsert,
  mockStudySessionCreate,
  mockLearningObjectCreate,
} = vi.hoisted(() => ({
  mockConceptFindFirst: vi.fn(),
  mockLearningObjectFindFirst: vi.fn(),
  mockAdaptiveSequenceRunCreate: vi.fn(),
  mockAdaptiveSequenceRunFindFirst: vi.fn(),
  mockAdaptiveSequenceRunFindMany: vi.fn(),
  mockAdaptiveSequenceRunUpdate: vi.fn(),
  mockAdaptiveSequenceRunUpdateMany: vi.fn(),
  mockAdaptiveSequenceRunDelete: vi.fn(),
  mockLearningAttemptCreate: vi.fn(),
  mockConceptMasteryUpsert: vi.fn(),
  mockRetentionItemUpsert: vi.fn(),
  mockTopicMasteryUpsert: vi.fn(),
  mockStudySessionCreate: vi.fn(),
  mockLearningObjectCreate: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    concept: { findFirst: mockConceptFindFirst },
    learningObject: {
      findFirst: mockLearningObjectFindFirst,
      create: mockLearningObjectCreate,
    },
    adaptiveSequenceRun: {
      create: mockAdaptiveSequenceRunCreate,
      findFirst: mockAdaptiveSequenceRunFindFirst,
      findMany: mockAdaptiveSequenceRunFindMany,
      update: mockAdaptiveSequenceRunUpdate,
      updateMany: mockAdaptiveSequenceRunUpdateMany,
      delete: mockAdaptiveSequenceRunDelete,
    },
    learningAttempt: { create: mockLearningAttemptCreate },
    conceptMastery: { upsert: mockConceptMasteryUpsert },
    retentionItem: { upsert: mockRetentionItemUpsert },
    topicMastery: { upsert: mockTopicMasteryUpsert },
    studySession: { create: mockStudySessionCreate },
  },
}));

import {
  AdaptiveSequenceRunError,
  abandonAdaptiveSequenceRun,
  completeAdaptiveSequenceRun,
  createAdaptiveSequenceRun,
  deleteAdaptiveSequenceRun,
  getAdaptiveSequenceRun,
  listAdaptiveSequenceRuns,
  updateAdaptiveSequenceRunState,
} from "@/lib/learning/sequence";
import {
  assertValidCurrentStepIndex,
  parseInterventionHistoryJson,
  parseStepsJson,
  serializeInterventionHistory,
  serializeSteps,
} from "@/lib/learning/sequence/json";

const USER_A = "user-a";
const USER_B = "user-b";
const CONCEPT_A = "concept-a";
const CONCEPT_B = "concept-b";
const LO_A = "lo-a";
const RUN_ID = "run-1";

function ownedConcept(id: string, userId: string) {
  return { id, userId };
}

function baseRow(overrides: Record<string, unknown> = {}) {
  return {
    id: RUN_ID,
    userId: USER_A,
    conceptId: CONCEPT_A,
    status: "ACTIVE",
    currentStepIndex: 0,
    stepsJson: serializeSteps([
      { intervention: "detailed-explanation", learningObjectId: LO_A },
    ]),
    interventionHistoryJson: "[]",
    lastAttemptId: null,
    createdAt: new Date("2026-09-18T12:00:00.000Z"),
    updatedAt: new Date("2026-09-18T12:00:00.000Z"),
    ...overrides,
  };
}

describe("Phase 2G-2 AdaptiveSequenceRun JSON helpers", () => {
  it("parses and serializes steps + history", () => {
    const steps = [
      { intervention: "hands-on-practice", learningObjectId: LO_A },
      { intervention: "active-recall", learningObjectId: null },
    ];
    const history = [
      {
        stepIndex: 0,
        intervention: "hands-on-practice",
        learningObjectId: LO_A,
        attemptId: "attempt-1",
      },
    ];
    expect(parseStepsJson(serializeSteps(steps))).toEqual(steps);
    expect(parseInterventionHistoryJson(serializeInterventionHistory(history))).toEqual(
      history,
    );
  });

  it("rejects malformed stepsJson", () => {
    expect(() => parseStepsJson("{")).toThrow(AdaptiveSequenceRunError);
    expect(() => parseStepsJson("{}")).toThrow(AdaptiveSequenceRunError);
    expect(() => parseStepsJson('[{"learningObjectId":"x"}]')).toThrow(
      AdaptiveSequenceRunError,
    );
    expect(() =>
      parseStepsJson(
        '[{"intervention":"x","payload":{"answer":"no"}}]',
      ),
    ).toThrow(AdaptiveSequenceRunError);
  });

  it("rejects malformed interventionHistoryJson", () => {
    expect(() => parseInterventionHistoryJson("not-json")).toThrow(
      AdaptiveSequenceRunError,
    );
    expect(() =>
      parseInterventionHistoryJson('[{"intervention":"x"}]'),
    ).toThrow(AdaptiveSequenceRunError);
  });

  it("validates currentStepIndex bounds", () => {
    expect(() => assertValidCurrentStepIndex(-1, 2)).toThrow(
      AdaptiveSequenceRunError,
    );
    // Index === length is awaiting-next (2G-3); only greater-than is invalid.
    expect(() => assertValidCurrentStepIndex(3, 2)).toThrow(
      AdaptiveSequenceRunError,
    );
    expect(() => assertValidCurrentStepIndex(0, 0)).toThrow(
      AdaptiveSequenceRunError,
    );
    expect(() => assertValidCurrentStepIndex(0, 1)).not.toThrow();
    expect(() => assertValidCurrentStepIndex(2, 2)).not.toThrow();
  });
});

describe("Phase 2G-2 AdaptiveSequenceRun service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConceptFindFirst.mockResolvedValue(ownedConcept(CONCEPT_A, USER_A));
    mockLearningObjectFindFirst.mockResolvedValue({
      id: LO_A,
      userId: USER_A,
    });
    mockAdaptiveSequenceRunCreate.mockImplementation(async ({ data }) =>
      baseRow(data),
    );
    mockAdaptiveSequenceRunFindFirst.mockResolvedValue(baseRow());
    mockAdaptiveSequenceRunUpdate.mockImplementation(async ({ data }) =>
      baseRow(data),
    );
    mockAdaptiveSequenceRunUpdateMany.mockImplementation(async ({ data }) => {
      // Simulate CAS success — caller re-reads via findFirst.
      mockAdaptiveSequenceRunFindFirst.mockResolvedValueOnce(baseRow(data));
      return { count: 1 };
    });
    mockAdaptiveSequenceRunDelete.mockResolvedValue(baseRow());
    mockAdaptiveSequenceRunFindMany.mockResolvedValue([baseRow()]);
  });

  it("1. creates an ACTIVE run", async () => {
    const run = await createAdaptiveSequenceRun({
      userId: USER_A,
      conceptId: CONCEPT_A,
      steps: [{ intervention: "detailed-explanation", learningObjectId: LO_A }],
    });
    expect(run.status).toBe("ACTIVE");
    expect(run.currentStepIndex).toBe(0);
    expect(mockAdaptiveSequenceRunCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: USER_A,
          conceptId: CONCEPT_A,
          status: "ACTIVE",
          lastAttemptId: null,
        }),
      }),
    );
  });

  it("2–3. accepts owned concept; rejects cross-user concept", async () => {
    mockConceptFindFirst.mockResolvedValueOnce(null);
    await expect(
      createAdaptiveSequenceRun({
        userId: USER_A,
        conceptId: CONCEPT_B,
        steps: [{ intervention: "chunking" }],
      }),
    ).rejects.toThrow(/not owned/i);

    mockConceptFindFirst.mockResolvedValueOnce(ownedConcept(CONCEPT_A, USER_A));
    await createAdaptiveSequenceRun({
      userId: USER_A,
      conceptId: CONCEPT_A,
      steps: [{ intervention: "chunking" }],
    });
    expect(mockConceptFindFirst).toHaveBeenCalledWith({
      where: { id: CONCEPT_A, userId: USER_A },
      select: { id: true, userId: true },
    });
  });

  it("4. retrieval is ownership-scoped", async () => {
    mockAdaptiveSequenceRunFindFirst.mockResolvedValueOnce(null);
    expect(await getAdaptiveSequenceRun(USER_B, RUN_ID)).toBeNull();
    expect(mockAdaptiveSequenceRunFindFirst).toHaveBeenCalledWith({
      where: { id: RUN_ID, userId: USER_B },
    });
  });

  it("5–7. zero-based index; rejects negative and out-of-range", async () => {
    await expect(
      createAdaptiveSequenceRun({
        userId: USER_A,
        conceptId: CONCEPT_A,
        steps: [{ intervention: "chunking" }],
        currentStepIndex: -1,
      }),
    ).rejects.toThrow(/negative/i);

    await expect(
      createAdaptiveSequenceRun({
        userId: USER_A,
        conceptId: CONCEPT_A,
        steps: [{ intervention: "chunking" }],
        currentStepIndex: 1,
      }),
    ).rejects.toThrow(/out of range/i);

    const ok = await createAdaptiveSequenceRun({
      userId: USER_A,
      conceptId: CONCEPT_A,
      steps: [
        { intervention: "chunking" },
        { intervention: "feynman" },
      ],
      currentStepIndex: 1,
    });
    expect(ok.currentStepIndex).toBe(1);
  });

  it("8. validates owned LearningObject step references", async () => {
    mockLearningObjectFindFirst.mockResolvedValueOnce(null);
    await expect(
      createAdaptiveSequenceRun({
        userId: USER_A,
        conceptId: CONCEPT_A,
        steps: [{ intervention: "chunking", learningObjectId: "foreign-lo" }],
      }),
    ).rejects.toThrow(/LearningObject not found or not owned/i);
  });

  it("9–10. persists intervention history and nullable lastAttemptId", async () => {
    const history = [
      {
        stepIndex: 0,
        intervention: "detailed-explanation",
        learningObjectId: LO_A,
        attemptId: "attempt-9",
      },
    ];
    await createAdaptiveSequenceRun({
      userId: USER_A,
      conceptId: CONCEPT_A,
      steps: [{ intervention: "detailed-explanation", learningObjectId: LO_A }],
      interventionHistory: history,
      lastAttemptId: "attempt-9",
    });
    expect(mockAdaptiveSequenceRunCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          lastAttemptId: "attempt-9",
          interventionHistoryJson: serializeInterventionHistory(history),
        }),
      }),
    );

    await createAdaptiveSequenceRun({
      userId: USER_A,
      conceptId: CONCEPT_A,
      steps: [{ intervention: "chunking" }],
      lastAttemptId: null,
    });
    expect(mockAdaptiveSequenceRunCreate).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ lastAttemptId: null }),
      }),
    );
  });

  it("11–12. ACTIVE → COMPLETED and ACTIVE → ABANDONED", async () => {
    mockAdaptiveSequenceRunUpdateMany.mockResolvedValueOnce({ count: 1 });
    mockAdaptiveSequenceRunFindFirst.mockResolvedValueOnce(
      baseRow({ status: "COMPLETED" }),
    );
    const completed = await completeAdaptiveSequenceRun(USER_A, RUN_ID);
    expect(completed.status).toBe("COMPLETED");
    expect(mockAdaptiveSequenceRunUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: RUN_ID,
          userId: USER_A,
          status: "ACTIVE",
        }),
        data: { status: "COMPLETED" },
      }),
    );

    mockAdaptiveSequenceRunUpdateMany.mockResolvedValueOnce({ count: 1 });
    mockAdaptiveSequenceRunFindFirst.mockResolvedValueOnce(
      baseRow({ status: "ABANDONED" }),
    );
    const abandoned = await abandonAdaptiveSequenceRun(USER_A, RUN_ID);
    expect(abandoned.status).toBe("ABANDONED");
  });

  it("13–16. terminal states cannot reactivate or cross-transition; same-status is idempotent", async () => {
    mockAdaptiveSequenceRunFindFirst.mockResolvedValue(
      baseRow({ status: "COMPLETED" }),
    );
    await expect(
      updateAdaptiveSequenceRunState(USER_A, RUN_ID, { currentStepIndex: 0 }),
    ).rejects.toThrow(/Cannot update state of a COMPLETED/);

    // Duplicate COMPLETED → COMPLETED is idempotent (2P-34 CAS).
    mockAdaptiveSequenceRunUpdateMany.mockResolvedValueOnce({ count: 0 });
    mockAdaptiveSequenceRunFindFirst.mockResolvedValueOnce(
      baseRow({ status: "COMPLETED" }),
    );
    const again = await completeAdaptiveSequenceRun(USER_A, RUN_ID);
    expect(again.status).toBe("COMPLETED");

    mockAdaptiveSequenceRunUpdateMany.mockResolvedValueOnce({ count: 0 });
    mockAdaptiveSequenceRunFindFirst.mockResolvedValueOnce(
      baseRow({ status: "COMPLETED" }),
    );
    await expect(abandonAdaptiveSequenceRun(USER_A, RUN_ID)).rejects.toThrow(
      /COMPLETED → ABANDONED/,
    );

    mockAdaptiveSequenceRunFindFirst.mockResolvedValue(
      baseRow({ status: "ABANDONED" }),
    );
    await expect(
      updateAdaptiveSequenceRunState(USER_A, RUN_ID, { currentStepIndex: 0 }),
    ).rejects.toThrow(/Cannot update state of a ABANDONED/);

    mockAdaptiveSequenceRunUpdateMany.mockResolvedValueOnce({ count: 0 });
    mockAdaptiveSequenceRunFindFirst.mockResolvedValueOnce(
      baseRow({ status: "ABANDONED" }),
    );
    await expect(completeAdaptiveSequenceRun(USER_A, RUN_ID)).rejects.toThrow(
      /ABANDONED → COMPLETED/,
    );

    mockAdaptiveSequenceRunUpdateMany.mockResolvedValueOnce({ count: 0 });
    mockAdaptiveSequenceRunFindFirst.mockResolvedValueOnce(
      baseRow({ status: "ABANDONED" }),
    );
    const abandonedAgain = await abandonAdaptiveSequenceRun(USER_A, RUN_ID);
    expect(abandonedAgain.status).toBe("ABANDONED");
  });

  it("17–18. empty/invalid steps rejected", async () => {
    await expect(
      createAdaptiveSequenceRun({
        userId: USER_A,
        conceptId: CONCEPT_A,
        steps: [],
      }),
    ).rejects.toThrow(/at least one step/i);

    await expect(
      createAdaptiveSequenceRun({
        userId: USER_A,
        conceptId: CONCEPT_A,
        steps: [{ intervention: "  " }],
      }),
    ).rejects.toThrow(AdaptiveSequenceRunError);
  });

  it("19. list is ownership scoped", async () => {
    await listAdaptiveSequenceRuns(USER_A, { status: "ACTIVE", limit: 10 });
    expect(mockAdaptiveSequenceRunFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: USER_A, status: "ACTIVE" }),
      }),
    );
  });

  it("20–22. sequence ops do not create/mutate Attempt, Mastery, Retention", async () => {
    await createAdaptiveSequenceRun({
      userId: USER_A,
      conceptId: CONCEPT_A,
      steps: [{ intervention: "chunking" }],
    });
    await updateAdaptiveSequenceRunState(USER_A, RUN_ID, {
      currentStepIndex: 0,
      lastAttemptId: "attempt-pointer-only",
      interventionHistory: [
        {
          stepIndex: 0,
          intervention: "chunking",
          attemptId: "attempt-pointer-only",
        },
      ],
    });
    await completeAdaptiveSequenceRun(USER_A, RUN_ID);

    expect(mockLearningAttemptCreate).not.toHaveBeenCalled();
    expect(mockConceptMasteryUpsert).not.toHaveBeenCalled();
    expect(mockRetentionItemUpsert).not.toHaveBeenCalled();
    expect(mockTopicMasteryUpsert).not.toHaveBeenCalled();
    expect(mockStudySessionCreate).not.toHaveBeenCalled();
    expect(mockLearningObjectCreate).not.toHaveBeenCalled();
  });

  it("deleting a run does not touch LearningAttempt", async () => {
    mockAdaptiveSequenceRunFindFirst.mockResolvedValueOnce({ id: RUN_ID });
    const deleted = await deleteAdaptiveSequenceRun(USER_A, RUN_ID);
    expect(deleted).toBe(true);
    expect(mockAdaptiveSequenceRunDelete).toHaveBeenCalledWith({
      where: { id: RUN_ID },
    });
    expect(mockLearningAttemptCreate).not.toHaveBeenCalled();
    // No learningAttempt.delete exists on the mock / service path.
  });
});

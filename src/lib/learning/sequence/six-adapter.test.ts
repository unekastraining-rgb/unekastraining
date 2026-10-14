/**
 * Phase 2G-4 — SIX activity adapter tests.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const {
  mockLearningObjectFindFirst,
  mockLearningAttemptFindFirst,
  mockAdaptiveSequenceRunFindFirst,
  mockAdaptiveSequenceRunUpdate,
  mockAdaptiveSequenceRunUpdateMany,
  mockLearningAttemptCreate,
  mockConceptMasteryUpsert,
  mockRetentionItemUpsert,
  mockOrchestrateForConcept,
} = vi.hoisted(() => ({
  mockLearningObjectFindFirst: vi.fn(),
  mockLearningAttemptFindFirst: vi.fn(),
  mockAdaptiveSequenceRunFindFirst: vi.fn(),
  mockAdaptiveSequenceRunUpdate: vi.fn(),
  mockAdaptiveSequenceRunUpdateMany: vi.fn(),
  mockLearningAttemptCreate: vi.fn(),
  mockConceptMasteryUpsert: vi.fn(),
  mockRetentionItemUpsert: vi.fn(),
  mockOrchestrateForConcept: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    learningObject: { findFirst: mockLearningObjectFindFirst },
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

import { SIX_ACTIVITIES } from "@/lib/csl/six";
import { sixGuideHref } from "@/lib/csl/six-guides";
import {
  assertSixCompatibleAttempt,
  isSupportedSixIntervention,
  normalizeSixIntervention,
  recordSixAdaptiveSequenceCompletion,
  resolveCurrentSixAdaptiveActivity,
  resolveOwnedSixSequenceStep,
  resolveSixSequenceStep,
  SixAdapterError,
} from "@/lib/learning/sequence/six-adapter";
import {
  serializeInterventionHistory,
  serializeSteps,
} from "@/lib/learning/sequence/json";

const USER_A = "user-a";
const USER_B = "user-b";
const CONCEPT_A = "concept-a";
const RUN_ID = "run-1";
const ATTEMPT_ID = "attempt-1";
const LO_ID = "lo-1";

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

describe("Phase 2G-4 SIX adapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAdaptiveSequenceRunFindFirst.mockResolvedValue(runRow());
    mockAdaptiveSequenceRunUpdate.mockImplementation(async ({ data }) =>
      runRow(data),
    );
    mockAdaptiveSequenceRunUpdateMany.mockImplementation(async ({ data }) => {
      const next = runRow(data);
      mockAdaptiveSequenceRunFindFirst.mockResolvedValue(next);
      return { count: 1 };
    });
  });

  it("1. each SIX intervention resolves correctly", () => {
    for (const activity of SIX_ACTIVITIES) {
      const resolved = resolveSixSequenceStep({
        intervention: activity.id,
      });
      expect(resolved.sixComponent).toBe(activity.id);
      expect(resolved.activity.id).toBe(activity.id);
      expect(resolved.href).toBe(sixGuideHref(activity.id));
      expect(resolved.evaluate).toEqual({
        mode: "six",
        sixComponent: activity.id,
      });
      expect(resolved.learningSignals.sixTechnique).toBeTruthy();
    }

    // Underscore form accepted (existing evaluate-bridge tolerance).
    expect(
      resolveSixSequenceStep({ intervention: "hands_on_practice" })
        .sixComponent,
    ).toBe("hands-on-practice");
  });

  it("2–3. unknown / malformed steps rejected", () => {
    expect(() =>
      resolveSixSequenceStep({ intervention: "not-a-six-thing" }),
    ).toThrow(SixAdapterError);
    expect(() => resolveSixSequenceStep({ intervention: "  " })).toThrow(
      SixAdapterError,
    );
    expect(() =>
      resolveSixSequenceStep({ intervention: "" } as never),
    ).toThrow(SixAdapterError);
    expect(isSupportedSixIntervention("quiz")).toBe(false);
    expect(normalizeSixIntervention("detailed_explanation")).toBe(
      "detailed-explanation",
    );
  });

  it("4–6. adapter does not create Attempt / Mastery / Retention", async () => {
    await resolveOwnedSixSequenceStep(USER_A, {
      intervention: "chunking",
    });
    expect(mockLearningAttemptCreate).not.toHaveBeenCalled();
    expect(mockConceptMasteryUpsert).not.toHaveBeenCalled();
    expect(mockRetentionItemUpsert).not.toHaveBeenCalled();
  });

  it("8. reuses existing SIX href source of truth", () => {
    const resolved = resolveSixSequenceStep(
      { intervention: "feynman" },
      { courseId: "c1", topicId: "t1", topicName: "Exceptions" },
    );
    expect(resolved.href).toBe(
      sixGuideHref("feynman", {
        courseId: "c1",
        topicId: "t1",
        topicName: "Exceptions",
      }),
    );
    expect(resolved.href.startsWith("/study/six/feynman")).toBe(true);
  });

  it("9. existing LearningObject is ownership-checked", async () => {
    mockLearningObjectFindFirst.mockResolvedValueOnce(null);
    await expect(
      resolveOwnedSixSequenceStep(USER_A, {
        intervention: "chunking",
        learningObjectId: LO_ID,
      }),
    ).rejects.toMatchObject({ code: "LEARNING_OBJECT_NOT_OWNED" });

    mockLearningObjectFindFirst.mockResolvedValueOnce({
      id: LO_ID,
      userId: USER_A,
    });
    const ok = await resolveOwnedSixSequenceStep(USER_A, {
      intervention: "chunking",
      learningObjectId: LO_ID,
    });
    expect(ok.learningObjectId).toBe(LO_ID);
  });

  it("10–13. Attempt compatibility for coordinator recording", async () => {
    mockLearningAttemptFindFirst.mockResolvedValue({
      id: ATTEMPT_ID,
      userId: USER_A,
      conceptId: CONCEPT_A,
      learningObjectId: "any-lo",
      skillFacet: "EXPLAIN",
      sourceRefJson: JSON.stringify({
        kind: "study_evaluate",
        mode: "six",
        sixComponent: "detailed-explanation",
      }),
    });
    mockAdaptiveSequenceRunUpdate.mockResolvedValue(
      runRow({
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
    );
    mockAdaptiveSequenceRunUpdateMany.mockImplementation(async ({ data }) => {
      const next = runRow({
        currentStepIndex: 1,
        lastAttemptId: ATTEMPT_ID,
        interventionHistoryJson: serializeInterventionHistory([
          {
            stepIndex: 0,
            intervention: "detailed-explanation",
            attemptId: ATTEMPT_ID,
          },
        ]),
        ...data,
      });
      mockAdaptiveSequenceRunFindFirst.mockResolvedValue(next);
      return { count: 1 };
    });

    const recorded = await recordSixAdaptiveSequenceCompletion({
      userId: USER_A,
      runId: RUN_ID,
      attemptId: ATTEMPT_ID,
    });
    expect(recorded.kind).toBe("recorded");
    expect(mockOrchestrateForConcept).not.toHaveBeenCalled();
    expect(mockLearningAttemptCreate).not.toHaveBeenCalled();

    // Foreign attempt
    mockAdaptiveSequenceRunFindFirst.mockResolvedValue(runRow());
    mockLearningAttemptFindFirst.mockResolvedValueOnce({
      id: ATTEMPT_ID,
      userId: USER_B,
      conceptId: CONCEPT_A,
      learningObjectId: "any-lo",
      skillFacet: "EXPLAIN",
      sourceRefJson: JSON.stringify({
        kind: "study_evaluate",
        mode: "six",
        sixComponent: "detailed-explanation",
      }),
    });
    await expect(
      recordSixAdaptiveSequenceCompletion({
        userId: USER_A,
        runId: RUN_ID,
        attemptId: ATTEMPT_ID,
      }),
    ).rejects.toMatchObject({ code: "ATTEMPT_OWNERSHIP_MISMATCH" });

    // Wrong concept
    mockLearningAttemptFindFirst.mockResolvedValueOnce({
      id: ATTEMPT_ID,
      userId: USER_A,
      conceptId: "other",
      learningObjectId: "any-lo",
      skillFacet: "EXPLAIN",
      sourceRefJson: JSON.stringify({
        kind: "study_evaluate",
        mode: "six",
        sixComponent: "detailed-explanation",
      }),
    });
    await expect(
      recordSixAdaptiveSequenceCompletion({
        userId: USER_A,
        runId: RUN_ID,
        attemptId: ATTEMPT_ID,
      }),
    ).rejects.toMatchObject({ code: "ATTEMPT_CONCEPT_MISMATCH" });

    // Incompatible LO when step expects one
    mockAdaptiveSequenceRunFindFirst.mockResolvedValue(
      runRow({
        stepsJson: serializeSteps([
          {
            intervention: "detailed-explanation",
            learningObjectId: LO_ID,
          },
        ]),
      }),
    );
    mockLearningObjectFindFirst.mockResolvedValue({
      id: LO_ID,
      userId: USER_A,
    });
    mockLearningAttemptFindFirst.mockResolvedValueOnce({
      id: ATTEMPT_ID,
      userId: USER_A,
      conceptId: CONCEPT_A,
      learningObjectId: "other-lo",
      skillFacet: "EXPLAIN",
      sourceRefJson: JSON.stringify({
        kind: "study_evaluate",
        mode: "six",
        sixComponent: "detailed-explanation",
      }),
    });
    await expect(
      recordSixAdaptiveSequenceCompletion({
        userId: USER_A,
        runId: RUN_ID,
        attemptId: ATTEMPT_ID,
      }),
    ).rejects.toMatchObject({ code: "ATTEMPT_LEARNING_OBJECT_MISMATCH" });
  });

  it("rejects non-SIX attempts", () => {
    const resolved = resolveSixSequenceStep({
      intervention: "active-recall",
    });
    expect(() =>
      assertSixCompatibleAttempt({
        userId: USER_A,
        conceptId: CONCEPT_A,
        resolved,
        attempt: {
          id: ATTEMPT_ID,
          userId: USER_A,
          conceptId: CONCEPT_A,
          learningObjectId: "lo",
          skillFacet: "RECOGNIZE",
          sourceRefJson: JSON.stringify({
            kind: "quiz_attempt",
          }),
        },
      }),
    ).toThrow(SixAdapterError);
  });

  it("14–16. resolve current activity without navigation / evaluate / re-orchestrate", async () => {
    const result = await resolveCurrentSixAdaptiveActivity(USER_A, RUN_ID, {
      courseId: "c1",
    });
    expect(result.kind).toBe("resolved");
    if (result.kind !== "resolved") return;
    expect(result.activity.href).toContain("/study/six/detailed-explanation");
    expect(result.activity.evaluate.mode).toBe("six");
    expect(mockOrchestrateForConcept).not.toHaveBeenCalled();
    expect(mockLearningAttemptCreate).not.toHaveBeenCalled();
  });
});

describe("Phase 2G-4 SIX adapter preservation", () => {
  it("7. does not modify SIX catalog / guides / evaluate-bridge source", () => {
    const adapter = readFileSync(
      path.join(process.cwd(), "src/lib/learning/sequence/six-adapter.ts"),
      "utf8",
    );
    expect(adapter).toContain('from "@/lib/csl/six"');
    expect(adapter).toContain('from "@/lib/csl/six-guides"');
    expect(adapter).toContain("mapStudyEvaluateToLearningSignals");
    expect(adapter).toContain("sixGuideHref");
    expect(adapter).not.toMatch(/router\.|window\.|fetch\(|redirect/);
    expect(adapter).not.toMatch(/recordEvidence|applyEvidenceToMastery/);

    const six = readFileSync(
      path.join(process.cwd(), "src/lib/csl/six.ts"),
      "utf8",
    );
    expect(six).toContain("SIX_ACTIVITIES");
    expect(six).not.toMatch(/AdaptiveSequence|six-adapter/);

    const evaluate = readFileSync(
      path.join(process.cwd(), "src/lib/learning/assessment/evaluate-bridge.ts"),
      "utf8",
    );
    expect(evaluate).toContain("recordStudyEvaluateEvidence");
    expect(evaluate).not.toMatch(/AdaptiveSequence|six-adapter|recordSix/);

    const evaluateRoute = readFileSync(
      path.join(process.cwd(), "app/api/study/evaluate/route.ts"),
      "utf8",
    );
    // Phase 2G-10: optional bind via six-evaluate-bind only; still one Attempt writer.
    expect(evaluateRoute).toContain("bindSixEvaluateAttemptToAdaptiveSequence");
    expect(evaluateRoute).toContain("recordStudyEvaluateEvidence");
    expect(evaluateRoute).not.toMatch(/learningAttempt\.create/);
    expect(evaluateRoute).not.toMatch(/from \"@\/lib\/learning\/sequence\/six-adapter\"/);
  });

  it("does not add SIX UI or navigation hooks", () => {
    const sixPage = readFileSync(
      path.join(process.cwd(), "app/study/six/[component]/page.tsx"),
      "utf8",
    );
    expect(sixPage).not.toMatch(
      /resolveSixSequenceStep|recordSixAdaptiveSequenceCompletion/,
    );
  });
});

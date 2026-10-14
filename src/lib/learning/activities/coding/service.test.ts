import { describe, expect, it, vi, beforeEach } from "vitest";

const mockConceptFindFirst = vi.fn();
const mockLearningObjectFindFirst = vi.fn();
const mockLearningObjectCreate = vi.fn();
const mockLearningAttemptCreate = vi.fn();
const mockConceptMasteryFindUnique = vi.fn();
const mockConceptMasteryUpsert = vi.fn();
const mockLearnerProfileUpsert = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    concept: { findFirst: (...a: unknown[]) => mockConceptFindFirst(...a) },
    learningObject: {
      findFirst: (...a: unknown[]) => mockLearningObjectFindFirst(...a),
      create: (...a: unknown[]) => mockLearningObjectCreate(...a),
    },
    learningAttempt: {
      create: (...a: unknown[]) => mockLearningAttemptCreate(...a),
    },
    conceptMastery: {
      findUnique: (...a: unknown[]) => mockConceptMasteryFindUnique(...a),
      upsert: (...a: unknown[]) => mockConceptMasteryUpsert(...a),
    },
    learnerProfile: {
      upsert: (...a: unknown[]) => mockLearnerProfileUpsert(...a),
    },
    retentionItem: {
      upsert: vi.fn().mockResolvedValue({ id: "ri-1" }),
      findUnique: vi.fn().mockResolvedValue(null),
      update: vi.fn(),
    },
  },
}));

import { submitCodingChallenge } from "./service";
import { createAssessmentAdapterRegistry } from "@/lib/learning/assessment/adapter-registry";
import {
  createCodingAssessmentAdapter,
  registerUniversalActivityAssessmentAdapters,
} from "@/lib/learning/activities/assessment-adapters";
import { performProductImplementationStatus } from "@/lib/learning/activities/perform-producer";

describe("coding submit → evidence path", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLearnerProfileUpsert.mockResolvedValue({ id: "lp1" });
    mockConceptFindFirst.mockResolvedValue({
      id: "concept-1",
      learningSpaceId: null,
      title: "Add",
    });
    mockLearningObjectFindFirst.mockResolvedValue(null);
    mockLearningObjectCreate.mockResolvedValue({ id: "lo-1" });
    mockLearningAttemptCreate.mockResolvedValue({ id: "attempt-1" });
    mockConceptMasteryFindUnique.mockResolvedValue(null);
    mockConceptMasteryUpsert.mockResolvedValue({ id: "cm-1" });
  });

  it("records LearningAttempt + ConceptMastery for valid owned concept", async () => {
    const result = await submitCodingChallenge({
      learnerId: "user-1",
      conceptId: "concept-1",
      challengeId: "js-sum-two",
      clientBody: {
        code: "function add(a, b) { return a + b; }",
        outcome: "FAIL",
        score: 0,
        learnerId: "attacker",
      },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok");
    expect(result.completion.outcome).toBe("SUCCESS");
    expect(result.rejectedForgeryKeys).toEqual(
      expect.arrayContaining(["outcome", "score", "learnerId"]),
    );
    expect(mockLearningAttemptCreate).toHaveBeenCalled();
    expect(mockConceptMasteryUpsert).toHaveBeenCalled();
    const attemptData = mockLearningAttemptCreate.mock.calls[0][0].data;
    expect(attemptData.userId).toBe("user-1");
    expect(attemptData.skillFacet).toBe("PERFORM");
    expect(attemptData.outcome).toBe("SUCCESS");
  });

  it("rejects foreign concept", async () => {
    mockConceptFindFirst.mockResolvedValue(null);
    const result = await submitCodingChallenge({
      learnerId: "user-1",
      conceptId: "foreign",
      challengeId: "js-sum-two",
      clientBody: { code: "function add(a,b){return a+b}" },
    });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected fail");
    expect(result.reason).toBe("foreign_concept");
    expect(mockLearningAttemptCreate).not.toHaveBeenCalled();
  });
});

describe("assessment adapters + PERFORM", () => {
  it("registers coding/sql/writing without affecting empty default registry", () => {
    expect(createAssessmentAdapterRegistry().list()).toHaveLength(0);
    const reg = registerUniversalActivityAssessmentAdapters();
    expect(reg.list().map((a) => a.key).sort()).toEqual([
      "coding",
      "sql",
      "writing",
    ]);
    const coding = createCodingAssessmentAdapter();
    expect(coding.resolve({ plan: { status: "ready", conceptId: "c1", adapterKey: "coding" } }).activityType).toBe(
      "CODING_CHALLENGE",
    );
  });

  it("PERFORM producers exist without PERFORM_GAP", () => {
    const s = performProductImplementationStatus();
    expect(s.orchestratorPerformGapAdded).toBe(false);
    expect(s.fakeProducer).toBe(false);
    expect(s.producers.length).toBeGreaterThan(0);
  });
});

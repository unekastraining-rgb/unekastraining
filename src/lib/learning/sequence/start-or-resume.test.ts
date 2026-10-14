/**
 * Phase 2G-9 — startOrResumeAdaptiveSequenceForConcept.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockListActiveAdaptiveSequenceRuns,
  mockStartAdaptiveSequenceRun,
} = vi.hoisted(() => ({
  mockListActiveAdaptiveSequenceRuns: vi.fn(),
  mockStartAdaptiveSequenceRun: vi.fn(),
}));

vi.mock("@/lib/learning/sequence/coordinator", () => ({
  listActiveAdaptiveSequenceRuns: mockListActiveAdaptiveSequenceRuns,
  startAdaptiveSequenceRun: mockStartAdaptiveSequenceRun,
}));

import { AdaptiveSequenceRunError } from "@/lib/learning/sequence/errors";
import { startOrResumeAdaptiveSequenceForConcept } from "@/lib/learning/sequence/start-or-resume";

describe("Phase 2G-9 startOrResumeAdaptiveSequenceForConcept", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reuses most recently updated ACTIVE run without starting another", async () => {
    mockListActiveAdaptiveSequenceRuns.mockResolvedValue([
      { id: "run-new" },
      { id: "run-old" },
    ]);

    const result = await startOrResumeAdaptiveSequenceForConcept(
      "user-a",
      "concept-a",
    );

    expect(result).toEqual({
      kind: "ok",
      runId: "run-new",
      resumed: true,
    });
    expect(mockStartAdaptiveSequenceRun).not.toHaveBeenCalled();
  });

  it("starts exactly one run when none are ACTIVE", async () => {
    mockListActiveAdaptiveSequenceRuns.mockResolvedValue([]);
    mockStartAdaptiveSequenceRun.mockResolvedValue({
      kind: "started",
      run: { id: "run-created" },
      currentStep: { intervention: "chunking" },
      orchestrator: {},
    });

    const result = await startOrResumeAdaptiveSequenceForConcept(
      "user-a",
      "concept-a",
    );

    expect(result).toEqual({
      kind: "ok",
      runId: "run-created",
      resumed: false,
    });
    expect(mockStartAdaptiveSequenceRun).toHaveBeenCalledTimes(1);
    expect(mockStartAdaptiveSequenceRun).toHaveBeenCalledWith({
      userId: "user-a",
      conceptId: "concept-a",
    });
  });

  it("maps unowned/missing Concept to not_found", async () => {
    mockListActiveAdaptiveSequenceRuns.mockResolvedValue([]);
    mockStartAdaptiveSequenceRun.mockRejectedValue(
      new AdaptiveSequenceRunError("Concept not found or not owned by user: x"),
    );

    const result = await startOrResumeAdaptiveSequenceForConcept(
      "user-a",
      "foreign-concept",
    );

    expect(result).toEqual({ kind: "not_found" });
  });

  it("returns no_sequence when Orchestrator says none needed", async () => {
    mockListActiveAdaptiveSequenceRuns.mockResolvedValue([]);
    mockStartAdaptiveSequenceRun.mockResolvedValue({
      kind: "no_sequence_needed",
      reason: "Orchestrator reported NO_INTERVENTION — no sequence needed.",
      orchestrator: null,
    });

    const result = await startOrResumeAdaptiveSequenceForConcept(
      "user-a",
      "concept-a",
    );

    expect(result.kind).toBe("no_sequence");
  });

  it("rejects empty conceptId", async () => {
    const result = await startOrResumeAdaptiveSequenceForConcept("user-a", "  ");
    expect(result).toEqual({ kind: "not_found" });
    expect(mockListActiveAdaptiveSequenceRuns).not.toHaveBeenCalled();
  });
});

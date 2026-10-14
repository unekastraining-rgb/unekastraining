/**
 * Phase 2G-10/2G-12 — SIX evaluate → Adaptive Sequence bind (completion gate).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const {
  mockRecordSixAdaptiveSequenceCompletionAndPlanNext,
} = vi.hoisted(() => ({
  mockRecordSixAdaptiveSequenceCompletionAndPlanNext: vi.fn(),
}));

vi.mock("@/lib/learning/sequence/six-adapter", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/learning/sequence/six-adapter")
  >("@/lib/learning/sequence/six-adapter");
  return {
    ...actual,
    recordSixAdaptiveSequenceCompletionAndPlanNext:
      mockRecordSixAdaptiveSequenceCompletionAndPlanNext,
  };
});

import {
  adaptiveEvaluateResponsePayload,
  bindSixEvaluateAttemptToAdaptiveSequence,
} from "@/lib/learning/sequence/six-evaluate-bind";
import { SixAdapterError } from "@/lib/learning/sequence/six-adapter";

describe("Phase 2G-12 six-evaluate-bind completion gate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("skips when adaptive context absent (normal SIX)", async () => {
    const result = await bindSixEvaluateAttemptToAdaptiveSequence({
      userId: "user-a",
      adaptiveRunId: undefined,
      adaptiveStep: undefined,
      attemptId: "attempt-1",
      sixComponent: "chunking",
      stepIndex: 2,
      evaluationScore: 90,
    });
    expect(result).toEqual({ kind: "skipped", reason: "no_adaptive_context" });
    expect(
      mockRecordSixAdaptiveSequenceCompletionAndPlanNext,
    ).not.toHaveBeenCalled();
    expect(adaptiveEvaluateResponsePayload(result)).toBeUndefined();
  });

  it("1–2. intermediate stage does not bind; Attempt path not invoked", async () => {
    for (const stepIndex of [0, 1]) {
      mockRecordSixAdaptiveSequenceCompletionAndPlanNext.mockClear();
      const result = await bindSixEvaluateAttemptToAdaptiveSequence({
        userId: "user-a",
        adaptiveRunId: "run-1",
        adaptiveStep: 0,
        attemptId: "attempt-mid",
        sixComponent: "chunking",
        stepIndex,
        evaluationScore: 95,
        sixStageCount: 3,
      });
      expect(result).toEqual({
        kind: "skipped",
        reason: "six_activity_incomplete",
      });
      expect(adaptiveEvaluateResponsePayload(result)).toBeUndefined();
      expect(
        mockRecordSixAdaptiveSequenceCompletionAndPlanNext,
      ).not.toHaveBeenCalled();
    }
  });

  it("3. final/completed activity binds adaptive sequence", async () => {
    mockRecordSixAdaptiveSequenceCompletionAndPlanNext.mockResolvedValue({
      kind: "NEXT_STEP",
      run: { id: "run-1" },
      currentStep: { intervention: "chunking" },
      stepIndex: 1,
      historyEntry: {},
      orchestrator: {},
    });

    const result = await bindSixEvaluateAttemptToAdaptiveSequence({
      userId: "user-a",
      adaptiveRunId: "run-1",
      adaptiveStep: 0,
      attemptId: "attempt-final",
      sixComponent: "chunking",
      stepIndex: 2,
      evaluationScore: 88,
      sixStageCount: 3,
    });

    expect(result.kind).toBe("bound");
    expect(
      mockRecordSixAdaptiveSequenceCompletionAndPlanNext,
    ).toHaveBeenCalledWith({
      userId: "user-a",
      runId: "run-1",
      attemptId: "attempt-final",
      stepIndex: 0,
    });
    expect(adaptiveEvaluateResponsePayload(result)?.outcome).toBe("NEXT_STEP");
  });

  it("final stage FAIL/low score does not bind (retry stays in SIX)", async () => {
    const result = await bindSixEvaluateAttemptToAdaptiveSequence({
      userId: "user-a",
      adaptiveRunId: "run-1",
      adaptiveStep: 0,
      attemptId: "attempt-fail",
      sixComponent: "active-recall",
      stepIndex: 2,
      evaluationScore: 40,
      sixStageCount: 3,
    });
    expect(result).toEqual({
      kind: "skipped",
      reason: "final_stage_not_passing",
    });
    expect(
      mockRecordSixAdaptiveSequenceCompletionAndPlanNext,
    ).not.toHaveBeenCalled();
  });

  it("errors when attemptId missing on eligible final stage", async () => {
    const result = await bindSixEvaluateAttemptToAdaptiveSequence({
      userId: "user-a",
      adaptiveRunId: "run-1",
      adaptiveStep: 0,
      attemptId: null,
      sixComponent: "chunking",
      stepIndex: 2,
      evaluationScore: 90,
    });
    expect(result.kind).toBe("error");
    if (result.kind !== "error") return;
    expect(result.code).toBe("EVIDENCE_UNAVAILABLE");
    expect(
      mockRecordSixAdaptiveSequenceCompletionAndPlanNext,
    ).not.toHaveBeenCalled();
  });

  it("maps SixAdapterError to safe error payload", async () => {
    mockRecordSixAdaptiveSequenceCompletionAndPlanNext.mockRejectedValue(
      new SixAdapterError("ATTEMPT_CONCEPT_MISMATCH", "wrong concept"),
    );
    const result = await bindSixEvaluateAttemptToAdaptiveSequence({
      userId: "user-a",
      adaptiveRunId: "run-1",
      adaptiveStep: 0,
      attemptId: "attempt-1",
      sixComponent: "chunking",
      stepIndex: 2,
      evaluationScore: 90,
    });
    expect(result.kind).toBe("error");
    if (result.kind !== "error") return;
    expect(result.code).toBe("ATTEMPT_CONCEPT_MISMATCH");
  });

  it("evaluate route passes gate inputs; does not create a second Attempt writer", () => {
    const evaluate = readFileSync(
      path.join(process.cwd(), "app/api/study/evaluate/route.ts"),
      "utf8",
    );
    expect(evaluate).toContain("bindSixEvaluateAttemptToAdaptiveSequence");
    expect(evaluate).toContain("recordStudyEvaluateEvidence");
    expect(evaluate).toContain("adaptiveRunId");
    expect(evaluate).toContain("evaluationScore: evaluation.score");
    expect(evaluate).toContain("sixStageCount: body.sixStageCount");
    expect(evaluate).toContain("sixComponent: component");
    expect(evaluate).not.toMatch(/learningAttempt\.create/);
    expect(evaluate).not.toMatch(/applyEvidenceToMastery/);
  });

  it("SixGuidedSession returns to adaptive run only with adaptive bind payload", () => {
    const session = readFileSync(
      path.join(process.cwd(), "src/components/study/SixGuidedSession.tsx"),
      "utf8",
    );
    expect(session).toContain("adaptiveRunId");
    expect(session).toContain("hasAdaptiveContext");
    expect(session).toContain("/study/adaptive/");
    expect(session).toContain("data.adaptive");
    expect(session).toContain("sixStageCount: practiceSteps.length");
  });

  it("sixGuideHref remains backward compatible without adaptive params", () => {
    const guides = readFileSync(
      path.join(process.cwd(), "src/lib/csl/six-guides.ts"),
      "utf8",
    );
    expect(guides).toContain("adaptiveRunId");
    expect(guides).toContain("adaptiveStep");
  });

  it("preservation — Study Now / Six panel / CORE / Lucky free of evaluate bind", () => {
    const files = [
      "src/lib/csl/study-now.ts",
      "src/components/study/SixRecommendationsPanel.tsx",
      "app/core/page.tsx",
      "src/lib/csl/lucky-engine.ts",
    ];
    for (const file of files) {
      const source = readFileSync(path.join(process.cwd(), file), "utf8");
      expect(source).not.toContain("bindSixEvaluateAttemptToAdaptiveSequence");
      expect(source).not.toContain("adaptiveRunId");
    }
  });

  it("regression narrative — intermediate vs final vs normal SIX", async () => {
    // Adaptive SIX stage 1 / 2 → remain (no bind)
    const mid = await bindSixEvaluateAttemptToAdaptiveSequence({
      userId: "user-a",
      adaptiveRunId: "run-1",
      adaptiveStep: 0,
      attemptId: "a1",
      sixComponent: "detailed-explanation",
      stepIndex: 0,
      evaluationScore: 80,
      sixStageCount: 3,
    });
    expect(mid.kind).toBe("skipped");

    // Adaptive SIX final stage pass → bind
    mockRecordSixAdaptiveSequenceCompletionAndPlanNext.mockResolvedValue({
      kind: "NEXT_STEP",
      run: { id: "run-1" },
      currentStep: { intervention: "chunking" },
      stepIndex: 1,
      historyEntry: {},
      orchestrator: {},
    });
    const final = await bindSixEvaluateAttemptToAdaptiveSequence({
      userId: "user-a",
      adaptiveRunId: "run-1",
      adaptiveStep: 0,
      attemptId: "a3",
      sixComponent: "detailed-explanation",
      stepIndex: 2,
      evaluationScore: 80,
      sixStageCount: 3,
    });
    expect(final.kind).toBe("bound");

    // Normal SIX (no adaptive) never calls planNext even on final stage
    mockRecordSixAdaptiveSequenceCompletionAndPlanNext.mockClear();
    const normal = await bindSixEvaluateAttemptToAdaptiveSequence({
      userId: "user-a",
      adaptiveRunId: "",
      adaptiveStep: undefined,
      attemptId: "a-normal",
      sixComponent: "detailed-explanation",
      stepIndex: 2,
      evaluationScore: 80,
      sixStageCount: 3,
    });
    expect(normal.kind).toBe("skipped");
    expect(
      mockRecordSixAdaptiveSequenceCompletionAndPlanNext,
    ).not.toHaveBeenCalled();
  });
});

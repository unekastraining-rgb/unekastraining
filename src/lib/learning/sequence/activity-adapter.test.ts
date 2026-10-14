/**
 * Phase 2G-73 — Universal Activity Adaptive adapter + bind.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const {
  mockGetCurrentAdaptiveSequenceStep,
  mockLearningAttemptFindFirst,
  mockRecordAdaptiveSequenceCompletionAndPlanNext,
} = vi.hoisted(() => ({
  mockGetCurrentAdaptiveSequenceStep: vi.fn(),
  mockLearningAttemptFindFirst: vi.fn(),
  mockRecordAdaptiveSequenceCompletionAndPlanNext: vi.fn(),
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
  };
});

vi.mock("@/lib/db", () => ({
  db: {
    learningAttempt: { findFirst: mockLearningAttemptFindFirst },
  },
}));

import {
  ActivityAdapterError,
  bindUniversalActivityAttemptToAdaptiveSequence,
  isActivityAdaptiveCompletionEligible,
  isSupportedUniversalActivityIntervention,
  normalizeUniversalActivityIntervention,
  resolveOwnedUniversalActivitySequenceStep,
  resolveUniversalActivitySequenceStep,
  universalActivityAdaptiveHref,
} from "@/lib/learning/sequence/activity-adapter";
import { getActivityAdaptiveCompletionContract } from "@/lib/learning/sequence/activity-adaptive-completion";
import { bindUniversalActivityToAdaptive } from "@/lib/learning/activities/adaptive-bind";

function activityAttempt(partial?: {
  userId?: string;
  conceptId?: string | null;
  skillFacet?: string;
  outcome?: string;
  kind?: string;
}) {
  return {
    userId: partial?.userId ?? "user-a",
    conceptId: partial?.conceptId ?? "concept-a",
    skillFacet: partial?.skillFacet ?? "PERFORM",
    outcome: partial?.outcome ?? "SUCCESS",
    sourceRefJson: JSON.stringify({
      kind: partial?.kind ?? "coding_challenge_submit",
      challengeId: "coding-hello",
    }),
  };
}

describe("Phase 2G-73 universal activity Adaptive adapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("normalizes Adaptive-ready interventions and builds launch href with context", () => {
    expect(normalizeUniversalActivityIntervention("CODING")).toBe("coding");
    expect(isSupportedUniversalActivityIntervention("sql")).toBe(true);
    expect(isSupportedUniversalActivityIntervention("writing")).toBe(true);
    expect(
      universalActivityAdaptiveHref("coding", "concept-a", {
        adaptiveRunId: "run-1",
        adaptiveStep: 2,
      }),
    ).toBe(
      "/study/activities/coding?conceptId=concept-a&adaptiveRunId=run-1&adaptiveStep=2",
    );
  });

  it("resolveUniversalActivitySequenceStep rejects SIX/Quiz; accepts Game/Project (2P-30)", () => {
    expect(
      resolveUniversalActivitySequenceStep({
        intervention: "lab",
        learningObjectId: null,
      }),
    ).toEqual({ intervention: "lab", learningObjectId: null });

    expect(() =>
      resolveUniversalActivitySequenceStep({
        intervention: "detailed-explanation",
        learningObjectId: null,
      }),
    ).toThrow(ActivityAdapterError);

    expect(() =>
      resolveUniversalActivitySequenceStep({
        intervention: "quiz",
        learningObjectId: null,
      }),
    ).toThrow(ActivityAdapterError);

    expect(
      resolveUniversalActivitySequenceStep({
        intervention: "game",
        learningObjectId: null,
      }),
    ).toEqual({ intervention: "game", learningObjectId: null });

    expect(
      resolveUniversalActivitySequenceStep({
        intervention: "project",
        learningObjectId: null,
      }),
    ).toEqual({ intervention: "project", learningObjectId: null });
  });

  it("resolveOwnedUniversalActivitySequenceStep preserves opaque refs and learner title", () => {
    const resolved = resolveOwnedUniversalActivitySequenceStep({
      userId: "user-a",
      conceptId: "concept-a",
      step: { intervention: "coding", learningObjectId: "lo-opaque" },
      hrefParams: { adaptiveRunId: "run-1", adaptiveStep: 0 },
    });

    expect(resolved.adapterKey).toBe("coding");
    expect(resolved.title).toBe("Coding practice");
    expect(resolved.title.toLowerCase()).not.toContain("adapterkey");
    expect(resolved.learningObjectId).toBe("lo-opaque");
    expect(resolved.href).toContain("adaptiveRunId=run-1");
    expect(resolved.href).toContain("adaptiveStep=0");
    expect(resolved.href).toContain("conceptId=concept-a");
    // Step payload stays thin — no challenge catalog embed.
    expect(resolved.step).toEqual({
      intervention: "coding",
      learningObjectId: "lo-opaque",
    });
  });

  it("completion gate: ownership, concept, facet, outcome, sourceRef", () => {
    const contract = getActivityAdaptiveCompletionContract("coding")!;

    expect(
      isActivityAdaptiveCompletionEligible({
        contract,
        attempt: activityAttempt(),
        expectedLearnerId: "user-a",
        expectedConceptId: "concept-a",
      }).eligible,
    ).toBe(true);

    expect(
      isActivityAdaptiveCompletionEligible({
        contract,
        attempt: activityAttempt({ userId: "user-b" }),
        expectedLearnerId: "user-a",
        expectedConceptId: "concept-a",
      }).reason,
    ).toBe("attempt_ownership_mismatch");

    expect(
      isActivityAdaptiveCompletionEligible({
        contract,
        attempt: activityAttempt({ conceptId: "other" }),
        expectedLearnerId: "user-a",
        expectedConceptId: "concept-a",
      }).reason,
    ).toBe("concept_mismatch");

    expect(
      isActivityAdaptiveCompletionEligible({
        contract,
        attempt: activityAttempt({ skillFacet: "RETAIN" }),
        expectedLearnerId: "user-a",
        expectedConceptId: "concept-a",
      }).reason,
    ).toBe("skill_facet_mismatch");

    expect(
      isActivityAdaptiveCompletionEligible({
        contract,
        attempt: activityAttempt({ outcome: "ABANDONED" }),
        expectedLearnerId: "user-a",
        expectedConceptId: "concept-a",
      }).reason,
    ).toBe("outcome_not_accepted");

    expect(
      isActivityAdaptiveCompletionEligible({
        contract,
        attempt: activityAttempt({ kind: "quiz_attempt" }),
        expectedLearnerId: "user-a",
        expectedConceptId: "concept-a",
      }).reason,
    ).toBe("source_ref_mismatch");

    expect(
      isActivityAdaptiveCompletionEligible({
        contract,
        attempt: activityAttempt({ outcome: "FAIL" }),
        expectedLearnerId: "user-a",
        expectedConceptId: "concept-a",
      }).eligible,
    ).toBe(true);
  });

  it("bind skips when current step is not a universal activity", async () => {
    mockGetCurrentAdaptiveSequenceStep.mockResolvedValue({
      kind: "active",
      run: {
        id: "run-1",
        conceptId: "concept-a",
        currentStepIndex: 0,
        steps: [{ intervention: "detailed-explanation", learningObjectId: null }],
      },
      step: { intervention: "detailed-explanation", learningObjectId: null },
      stepIndex: 0,
    });

    const result = await bindUniversalActivityAttemptToAdaptiveSequence({
      userId: "user-a",
      runId: "run-1",
      attemptId: "la-1",
    });
    expect(result).toEqual({
      kind: "skipped",
      reason: "step_not_universal_activity",
    });
    expect(mockRecordAdaptiveSequenceCompletionAndPlanNext).not.toHaveBeenCalled();
  });

  it("bind validates attempt then advances via coordinator (no invent)", async () => {
    mockGetCurrentAdaptiveSequenceStep.mockResolvedValue({
      kind: "active",
      run: {
        id: "run-1",
        conceptId: "concept-a",
        currentStepIndex: 0,
        steps: [{ intervention: "coding", learningObjectId: null }],
      },
      step: { intervention: "coding", learningObjectId: null },
      stepIndex: 0,
    });
    mockLearningAttemptFindFirst.mockResolvedValue({
      id: "la-1",
      ...activityAttempt(),
    });
    mockRecordAdaptiveSequenceCompletionAndPlanNext.mockResolvedValue({
      kind: "next_step",
      run: { id: "run-1" },
      nextStep: { intervention: "detailed-explanation", learningObjectId: null },
    });

    const result = await bindUniversalActivityAttemptToAdaptiveSequence({
      userId: "user-a",
      runId: "run-1",
      attemptId: "la-1",
      stepIndex: 0,
    });

    expect(result.kind).toBe("bound");
    expect(mockRecordAdaptiveSequenceCompletionAndPlanNext).toHaveBeenCalledWith({
      userId: "user-a",
      runId: "run-1",
      attemptId: "la-1",
      stepIndex: 0,
    });
    expect(mockLearningAttemptFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "la-1", userId: "user-a" },
      }),
    );
  });

  it("bind soft path ignores client when no adaptiveRunId", async () => {
    const result = await bindUniversalActivityToAdaptive({
      learnerId: "user-a",
      learningAttemptId: "la-1",
      clientBody: { completed: true, learnerId: "forged" },
    });
    expect(result).toEqual({ kind: "skipped", reason: "no_adaptive_run" });
    expect(mockGetCurrentAdaptiveSequenceStep).not.toHaveBeenCalled();
  });

  it("bind soft path skips non-activity Adaptive steps (SIX preserved)", async () => {
    mockGetCurrentAdaptiveSequenceStep.mockResolvedValue({
      kind: "active",
      run: {
        id: "run-1",
        conceptId: "concept-a",
        currentStepIndex: 0,
        steps: [{ intervention: "chunking", learningObjectId: null }],
      },
      step: { intervention: "chunking", learningObjectId: null },
      stepIndex: 0,
    });

    const result = await bindUniversalActivityToAdaptive({
      learnerId: "user-a",
      learningAttemptId: "la-1",
      clientBody: { adaptiveRunId: "run-1", adaptiveStepIndex: 0 },
    });
    expect(result).toEqual({
      kind: "skipped",
      reason: "step_not_universal_activity",
    });
  });

  it("Adaptive run page resolves activity before SIX and uses learner titles", () => {
    const pageSrc = readFileSync(
      path.join(process.cwd(), "src/lib/learning/sequence/adaptive-run-page.ts"),
      "utf8",
    );
    expect(pageSrc).toMatch(/isSupportedUniversalActivityIntervention/);
    expect(pageSrc).toMatch(/resolveOwnedUniversalActivitySequenceStep/);
    expect(pageSrc.indexOf("isSupportedUniversalActivityIntervention")).toBeLessThan(
      pageSrc.lastIndexOf("resolveSixActivitySafe"),
    );
  });

  it("ActivityWorkspace forwards adaptiveStepIndex; never trusts client mastery", () => {
    const workspace = readFileSync(
      path.join(
        process.cwd(),
        "src/components/study/ActivityWorkspace.tsx",
      ),
      "utf8",
    );
    expect(workspace).toMatch(/adaptiveStepIndex/);
    expect(workspace).not.toMatch(/conceptMastery|learningAttemptId/);
  });
});

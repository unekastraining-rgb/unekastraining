/**
 * Phase 2G-73 — Universal Activity Adaptive completion contracts.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  ACTIVITY_ADAPTIVE_COMPLETION_CONTRACTS,
  activityAdaptiveCompletionTruthSummary,
  getActivityAdaptiveCompletionContract,
  isAdaptiveReadyActivityAdapterKey,
  isSupportedUniversalActivityIntervention,
  normalizeUniversalActivityIntervention,
} from "@/lib/learning/sequence/activity-adaptive-completion";
import { getActivityInterventionCapability } from "@/lib/learning/orchestrator/activity-intervention-capability";

describe("Phase 2G-73 activity Adaptive completion contracts", () => {
  it("marks coding/sql/math/networking/language/lab/simulation/presentation/writing/game/project Adaptive-ready", () => {
    for (const key of [
      "coding",
      "sql",
      "math",
      "networking",
      "language",
      "lab",
      "simulation",
      "presentation",
      "writing",
      "game",
      "project",
    ] as const) {
      expect(isAdaptiveReadyActivityAdapterKey(key)).toBe(true);
      expect(getActivityAdaptiveCompletionContract(key)?.adaptiveReady).toBe(
        true,
      );
      expect(normalizeUniversalActivityIntervention(key)).toBe(key);
      expect(isSupportedUniversalActivityIntervention(key)).toBe(true);
    }
    expect(ACTIVITY_ADAPTIVE_COMPLETION_CONTRACTS).toHaveLength(11);
  });

  it("does not mark quiz/flashcard/SIX as universal Adaptive interventions", () => {
    for (const key of [
      "quiz",
      "flashcard",
      "chunking",
    ] as const) {
      expect(isAdaptiveReadyActivityAdapterKey(key)).toBe(false);
      expect(normalizeUniversalActivityIntervention(key)).toBeNull();
      expect(isSupportedUniversalActivityIntervention(key)).toBe(false);
    }
  });

  it("PRODUCT-READY activities can lack Adaptive readiness (invariant retained)", () => {
    // 2P-30 — Game/Project are Adaptive-ready; quiz remains assessment-only path.
    expect(getActivityInterventionCapability("game")?.launchIntegrated).toBe(
      true,
    );
    expect(getActivityInterventionCapability("project")?.launchIntegrated).toBe(
      true,
    );
    expect(getActivityInterventionCapability("game")?.adaptiveBindIntegrated).toBe(
      true,
    );
    expect(
      getActivityInterventionCapability("project")?.adaptiveBindIntegrated,
    ).toBe(true);
    expect(
      getActivityInterventionCapability("writing")?.adaptiveBindIntegrated,
    ).toBe(true);
    expect(activityAdaptiveCompletionTruthSummary().productReadyMeansAdaptiveReady).toBe(
      false,
    );
  });

  it("truth summary forbids launch/open completion and fabrication", () => {
    expect(activityAdaptiveCompletionTruthSummary()).toEqual({
      launchCompletesStep: false,
      openCompletesStep: false,
      adaptiveCreatesLearningAttempt: false,
      fabricationAllowed: false,
      productReadyMeansAdaptiveReady: false,
    });
  });

  it("contracts require evaluated sourceRef kinds and accept FAIL as attempt evidence", () => {
    const coding = getActivityAdaptiveCompletionContract("coding")!;
    expect(coding.sourceRefKinds).toContain("coding_challenge_submit");
    expect(coding.acceptOutcomes).toEqual(
      expect.arrayContaining(["SUCCESS", "PARTIAL", "FAIL"]),
    );
    expect(coding.acceptOutcomes).not.toContain("ABANDONED");

    const simulation = getActivityAdaptiveCompletionContract("simulation")!;
    expect(simulation.requiredSkillFacets).toContain("APPLY");
    expect(simulation.requiredSkillFacets).toContain("SOLVE");
    expect(simulation.sourceRefKinds).toContain("simulation_challenge_submit");
  });

  it("source files keep Adaptive gate separate from evidence writers", () => {
    const root = process.cwd();
    const completion = readFileSync(
      path.join(
        root,
        "src/lib/learning/sequence/activity-adaptive-completion.ts",
      ),
      "utf8",
    );
    const adapter = readFileSync(
      path.join(root, "src/lib/learning/sequence/activity-adapter.ts"),
      "utf8",
    );
    expect(completion).not.toMatch(/learningAttempt\.create|conceptMastery/);
    expect(adapter).toMatch(/Does not create LearningAttempt/);
    expect(adapter).not.toMatch(/learningAttempt\.create/);
  });
});

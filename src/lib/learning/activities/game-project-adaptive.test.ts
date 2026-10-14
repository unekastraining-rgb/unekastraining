/**
 * 2P-30 — Game / Project → Adaptive Universal Activity Integration tests.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  ADAPTIVE_READY_ACTIVITY_KEYS,
  PRODUCT_READY_NOT_ADAPTIVE_KEYS,
} from "@/lib/learning/decision-loop";
import {
  gameAdaptiveContractTruthSummary,
  gameInteractionIsNotCompletion,
  inferGameLifecyclePhase,
} from "@/lib/learning/activities/game";
import {
  projectAdaptiveContractTruthSummary,
  projectArtifactIntegrityOk,
  projectInteractionIsNotCompletion,
  inferProjectLifecyclePhase,
} from "@/lib/learning/activities/project";
import {
  getActivityAdaptiveCompletionContract,
  isAdaptiveReadyActivityAdapterKey,
  isSupportedUniversalActivityIntervention,
} from "@/lib/learning/sequence/activity-adaptive-completion";
import { getActivityInterventionCapability } from "@/lib/learning/orchestrator/activity-intervention-capability";
import {
  getStructuredChallenge,
  listStructuredChallenges,
} from "@/lib/learning/activities/structured/service";
import { UNIVERSAL_LEARNER_CONTEXT_EVIDENCE_BOUNDARY } from "@/lib/learning/universal-learner-context";

describe("2P-30 Game Adaptive contract", () => {
  it("marks game Adaptive-ready with RECOGNIZE + game_challenge_submit", () => {
    expect(isAdaptiveReadyActivityAdapterKey("game")).toBe(true);
    expect(isSupportedUniversalActivityIntervention("game")).toBe(true);
    expect(ADAPTIVE_READY_ACTIVITY_KEYS).toContain("game");
    expect(PRODUCT_READY_NOT_ADAPTIVE_KEYS).not.toContain("game");
    const contract = getActivityAdaptiveCompletionContract("game")!;
    expect(contract.sourceRefKinds).toContain("game_challenge_submit");
    expect(contract.requiredSkillFacets).toContain("RECOGNIZE");
    expect(contract.acceptOutcomes).toEqual(
      expect.arrayContaining(["SUCCESS", "PARTIAL", "FAIL"]),
    );
    expect(contract.acceptOutcomes).not.toContain("ABANDONED");
    expect(
      getActivityInterventionCapability("game")?.adaptiveBindIntegrated,
    ).toBe(true);
    expect(
      getActivityInterventionCapability("game")?.interventionEligible,
    ).toBe(true);
  });

  it("separates launch/interaction from completion; points ≠ mastery", () => {
    expect(
      gameInteractionIsNotCompletion(
        inferGameLifecyclePhase({
          launched: true,
          beganInteraction: true,
          evaluated: false,
          evidenceRecorded: false,
          adaptiveBound: false,
        }),
      ),
    ).toBe(true);
    const summary = gameAdaptiveContractTruthSummary();
    expect(summary.activityLaunchedIsNotCompletion).toBe(true);
    expect(summary.pointsAloneAreNotMastery).toBe(true);
    expect(summary.noGameMasterySystem).toBe(true);
    expect(summary.luckyRemainsDownstream).toBe(true);
    expect(summary.resumeMidGameNotSupported).toBe(true);
  });

  it("ships game catalog challenges with RECOGNIZE facet", () => {
    const games = listStructuredChallenges("game");
    expect(games.length).toBeGreaterThanOrEqual(2);
    for (const g of games) {
      expect(getStructuredChallenge(g.id)?.kind).toBe("game");
      expect(getStructuredChallenge(g.id)?.skillFacet).toBe("RECOGNIZE");
    }
  });
});

describe("2P-30 Project Adaptive contract", () => {
  it("marks project Adaptive-ready with APPLY + project_challenge_submit", () => {
    expect(isAdaptiveReadyActivityAdapterKey("project")).toBe(true);
    expect(isSupportedUniversalActivityIntervention("project")).toBe(true);
    expect(ADAPTIVE_READY_ACTIVITY_KEYS).toContain("project");
    expect(PRODUCT_READY_NOT_ADAPTIVE_KEYS).not.toContain("project");
    const contract = getActivityAdaptiveCompletionContract("project")!;
    expect(contract.sourceRefKinds).toContain("project_challenge_submit");
    expect(contract.requiredSkillFacets).toContain("APPLY");
    expect(
      getActivityInterventionCapability("project")?.adaptiveBindIntegrated,
    ).toBe(true);
    expect(
      getActivityInterventionCapability("project")?.createOnly,
    ).toBe(false);
  });

  it("preserves learner-authored artifact integrity", () => {
    expect(
      projectArtifactIntegrityOk({
        learnerAuthored: false,
        finalSubmission: "objective milestone criteria",
      }).ok,
    ).toBe(false);
    expect(
      projectArtifactIntegrityOk({
        learnerAuthored: true,
        finalSubmission: "",
      }).reason,
    ).toBe("empty_final");
    expect(
      projectArtifactIntegrityOk({
        learnerAuthored: true,
        finalSubmission: "Objective: learn SQL. Milestone: week 1. Success criteria: pass quiz.",
      }).ok,
    ).toBe(true);
    expect(
      projectInteractionIsNotCompletion(
        inferProjectLifecyclePhase({
          launched: true,
          beganDrafting: true,
          evaluated: false,
          evidenceRecorded: false,
          adaptiveBound: false,
        }),
      ),
    ).toBe(true);
    const summary = projectAdaptiveContractTruthSummary();
    expect(summary.aiAssistanceIsNotLearnerEvidence).toBe(true);
    expect(summary.noProjectEvidenceWriter).toBe(true);
  });
});

describe("2P-30 universal separation invariants", () => {
  it("evidence ≠ automatic completion; completion ≠ mastery; mastery ≠ retention", () => {
    // Launch/display never create evidence (shared with 2P-29 boundary).
    expect(
      UNIVERSAL_LEARNER_CONTEXT_EVIDENCE_BOUNDARY.startAdaptiveCreatesLearningAttempt,
    ).toBe(false);
    const completion = readFileSync(
      path.join(
        process.cwd(),
        "src/lib/learning/sequence/activity-adaptive-completion.ts",
      ),
      "utf8",
    );
    expect(completion).toContain("Launch/open alone never completes");
    expect(completion).not.toMatch(/learningAttempt\.create|conceptMastery/);
    const lucky = readFileSync(
      path.join(process.cwd(), "src/lib/learning/sequence/lucky-handoff.ts"),
      "utf8",
    );
    expect(lucky).toMatch(/COMPLETED|completeAdaptiveSequence/);
  });

  it("no GameEngine / ProjectEngine / PerformanceEngine / PERFORM_GAP invented", () => {
    const root = process.cwd();
    const audit = readFileSync(
      path.join(root, "src/lib/learning/UNIVERSAL_ACTIVITY_COMPLETION_AUDIT.md"),
      "utf8",
    );
    expect(audit).toMatch(/PERFORM_GAP.*[Dd]eferred|[Dd]eferred.*PERFORM_GAP/);
    expect(audit).toContain("No GameEngine");
    const completion = readFileSync(
      path.join(root, "src/lib/learning/UNIVERSAL_ACTIVITY_COMPLETION.md"),
      "utf8",
    );
    expect(completion).toContain("No GameEngine");
    expect(completion).not.toMatch(/\bclass GameEngine\b|\bclass ProjectEngine\b/);
  });
});

/**
 * 2P-43 — Longitudinal learner growth continuity tests.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import { CANONICAL_ULE_MASTERY_SOURCE } from "@/lib/learning/mastery/mastery-truth";
import { presentGrowthCenter } from "@/lib/learning/learner-model/present-growth-center";
import { presentLearnerModelVisibility } from "@/lib/learning/mastery/present-learner-model";
import { ORCHESTRATOR_FACET_STRONG } from "@/lib/learning/orchestrator/diagnose";
import {
  learnerGrowthContinuityTruthSummary,
  learnerNextActionTruthSummary,
  presentLearnerGrowthContinuity,
  presentLearnerGrowthHubTeaser,
  presentTemporalTruthBuckets,
  resolveLearnerNextAction,
  temporalTruthTruthSummary,
} from "@/lib/learning/learner-growth";

const root = process.cwd();

function read(rel: string) {
  return readFileSync(path.join(root, rel), "utf8");
}

function strongMastery() {
  return {
    recognize: ORCHESTRATOR_FACET_STRONG,
    explain: ORCHESTRATOR_FACET_STRONG,
    apply: ORCHESTRATOR_FACET_STRONG,
    solve: ORCHESTRATOR_FACET_STRONG,
    perform: ORCHESTRATOR_FACET_STRONG,
    retain: ORCHESTRATOR_FACET_STRONG,
    confidence: 0.7,
    reviewCount: 4,
  };
}

describe("2P-43 temporal truth", () => {
  it("separates recently vs historically demonstrated without mastery decay", () => {
    const visibility = presentLearnerModelVisibility([
      {
        conceptId: "c-recent",
        conceptTitle: "Linear Equations",
        recentlyUpdated: true,
        conceptMastery: strongMastery(),
      },
      {
        conceptId: "c-old",
        conceptTitle: "Authorization",
        recentlyUpdated: false,
        conceptMastery: strongMastery(),
      },
      {
        conceptId: "c-weak",
        conceptTitle: "NPV",
        conceptMastery: {
          recognize: 0.2,
          explain: 0.2,
          apply: 0.2,
          solve: 0.1,
          perform: 0.1,
          retain: 0.2,
          confidence: 0.2,
          reviewCount: 3,
        },
      },
      {
        conceptId: "c-empty",
        conceptTitle: "Cold War",
        conceptMastery: null,
      },
    ]);

    const temporal = presentTemporalTruthBuckets(visibility);
    expect(temporal.recentlyDemonstrated.map((r) => r.conceptId)).toEqual([
      "c-recent",
    ]);
    expect(temporal.historicallyDemonstrated.map((r) => r.conceptId)).toEqual([
      "c-old",
    ]);
    expect(temporal.currentlyWeak.some((r) => r.conceptId === "c-weak")).toBe(
      true,
    );
    expect(
      temporal.needsMoreEvidence.some((r) => r.conceptId === "c-empty"),
    ).toBe(true);
    expect(temporal.recentlyDemonstrated[0]?.learnerLabel).toBe(
      "Recently demonstrated",
    );
    expect(temporal.historicallyDemonstrated[0]?.learnerLabel).toBe(
      "Previously demonstrated",
    );
    expect(temporalTruthTruthSummary().inventsMasteryDecay).toBe(false);
    expect(temporalTruthTruthSummary().claimsForeverMastery).toBe(false);
  });
});

describe("2P-43 next action continuity", () => {
  it("prefers Adaptive resume deterministically", () => {
    const a = resolveLearnerNextAction({
      conceptId: "c1",
      activeRunId: "run-a",
    });
    const b = resolveLearnerNextAction({
      conceptId: "c1",
      activeRunId: "run-a",
    });
    expect(a).toEqual(b);
    expect(a.kind).toBe("CONTINUE_ADAPTIVE");
    expect(a.source).toBe("adaptive_resume");
    expect(a.adaptiveRunId).toBe("run-a");
    expect(a.reason).toMatch(/left off/i);
  });

  it("starts Adaptive for focus when no active run", () => {
    const next = resolveLearnerNextAction({ conceptId: "focus-1" });
    expect(next.kind).toBe("START_ADAPTIVE");
    expect(next.source).toBe("growth_focus");
    expect(next.conceptId).toBe("focus-1");
  });

  it("soft-opens LUCKY only when Adaptive has nothing and retention is due", () => {
    const none = resolveLearnerNextAction({});
    expect(none.kind).toBe("NONE");

    const lucky = resolveLearnerNextAction({ dueRetentionAvailable: true });
    expect(lucky.kind).toBe("OPEN_LUCKY");
    expect(lucky.source).toBe("lucky");
    expect(lucky.href).toBe("/study/lucky");

    // Active Adaptive still wins over LUCKY
    const resumeWins = resolveLearnerNextAction({
      activeRunId: "run-1",
      dueRetentionAvailable: true,
    });
    expect(resumeWins.kind).toBe("CONTINUE_ADAPTIVE");
  });

  it("does not claim to be a planner", () => {
    expect(learnerNextActionTruthSummary().isPlanner).toBe(false);
    expect(learnerNextActionTruthSummary().deterministic).toBe(true);
  });
});

describe("2P-43 continuity snapshot + Hub teaser", () => {
  it("composes Growth Center + temporal + next action", () => {
    const visibility = presentLearnerModelVisibility([
      {
        conceptId: "weak-auth",
        conceptTitle: "Authorization decisions",
        conceptMastery: {
          recognize: 0.2,
          explain: 0.2,
          apply: 0.15,
          solve: 0.1,
          perform: 0.1,
          retain: 0.2,
          confidence: 0.2,
          reviewCount: 2,
        },
      },
      {
        conceptId: "strong-old",
        conceptTitle: "Linear equations",
        recentlyUpdated: false,
        conceptMastery: strongMastery(),
      },
      {
        conceptId: "strong-new",
        conceptTitle: "Quadratic forms",
        recentlyUpdated: true,
        conceptMastery: strongMastery(),
      },
    ]);
    const growth = presentGrowthCenter({ visibility });
    const continuity = presentLearnerGrowthContinuity({
      growth,
      activeRunByConceptId: { "weak-auth": "run-weak" },
    });

    expect(continuity.source).toBe(CANONICAL_ULE_MASTERY_SOURCE);
    expect(continuity.primaryResumeRunId).toBe("run-weak");
    expect(continuity.nextAction.kind).toBe("CONTINUE_ADAPTIVE");
    expect(continuity.temporal.historicallyDemonstrated[0]?.conceptId).toBe(
      "strong-old",
    );
    expect(continuity.temporal.recentlyDemonstrated[0]?.conceptId).toBe(
      "strong-new",
    );

    const teaser = presentLearnerGrowthHubTeaser(continuity);
    expect(teaser.hasActiveAdaptive).toBe(true);
    expect(teaser.continueHref).toBeTruthy();
    expect(teaser.needsWorkLine).toMatch(/Authorization/i);
    expect(teaser.recentlyDemonstratedLine).toMatch(/Quadratic/i);
    expect(teaser.historicallyDemonstratedLine).toMatch(/Linear/i);
    expect(teaser.growthCenterHref).toBe("/study/learner-model");

    // Determinism
    const again = presentLearnerGrowthContinuity({
      growth,
      activeRunByConceptId: { "weak-auth": "run-weak" },
    });
    expect(again.nextAction).toEqual(continuity.nextAction);
  });

  it("truth summary forbids second engines", () => {
    const t = learnerGrowthContinuityTruthSummary();
    expect(t.createsGrowthEngine).toBe(false);
    expect(t.createsJourneyEngine).toBe(false);
    expect(t.createsPlanningEngine).toBe(false);
    expect(t.createsProgressEngine).toBe(false);
    expect(t.createsSecondMasteryStore).toBe(false);
    expect(t.createsSecondRetention).toBe(false);
    expect(t.usesExistingGrowthCenter).toBe(true);
  });
});

describe("2P-43 wiring + ownership invariants", () => {
  it("resolve never trusts client userId", () => {
    const resolve = read("src/lib/learning/learner-growth/resolve.ts");
    expect(resolve).toContain("where: { userId: uid }");
    expect(resolve).toContain("session userId");
    expect(resolve).not.toMatch(/body\.userId|input\.clientUserId/);
  });

  it("Hub strip and Growth Center consume continuity", () => {
    const strip = read(
      "src/components/study/LearnerGrowthContinuityStrip.tsx",
    );
    const hub = read("app/study/study-hub-view.tsx");
    const studyPage = read("app/study/page.tsx");
    const growthPage = read("app/study/learner-model/page.tsx");
    const panel = read("src/components/study/LearnerGrowthCenterPanel.tsx");

    expect(strip).toContain("data-learner-growth-continuity-strip");
    expect(hub).toContain("LearnerGrowthContinuityStrip");
    expect(studyPage).toContain("resolveLearnerGrowthContinuityForUser");
    expect(growthPage).toContain("resolveLearnerGrowthContinuityForUser");
    expect(panel).toContain("data-growth-continuity-temporal");
  });

  it("resume path does not write LearningAttempt on open", () => {
    const startOrResume = read("src/lib/learning/sequence/start-or-resume.ts");
    expect(startOrResume).toContain("listActiveAdaptiveSequenceRuns");
    expect(startOrResume).not.toMatch(/recordEvidence|createLearningAttempt/);
  });
});

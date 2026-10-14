/**
 * 2P-45 — Universal Performance & Demonstration Layer tests.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import { emptyFacetScores } from "@/lib/learning/mastery/facets";
import {
  ORCHESTRATOR_FACET_STRONG,
  orchestrateFromLearnerState,
} from "@/lib/learning/orchestrator/diagnose";
import { rankActivityInterventionCandidates } from "@/lib/learning/orchestrator/activity-intervention-ranking";
import { ACTIVITY_INTERVENTION_CAPABILITIES } from "@/lib/learning/orchestrator/activity-intervention-capability";
import { FACET_PRODUCER_COVERAGE, PERFORM_COVERAGE_LIMITATION } from "@/lib/learning/learner-model/producers";
import { performProductImplementationStatus } from "@/lib/learning/activities/perform-producer";
import { performanceEvidenceTruthSummary } from "@/lib/learning/activities/performance-evidence-contract";
import { classifyEvidenceSufficiency } from "@/lib/learning/evidence/evidence-sufficiency";
import { presentConceptProgress } from "@/lib/learning/mastery/present-concept-progress";
import { performProductBridgeStatus } from "@/lib/learning/assessment/perform-evidence-contract";
import type { LearnerConceptMasterySummary } from "@/lib/learning/types";

const root = process.cwd();
function read(rel: string) {
  return readFileSync(path.join(root, rel), "utf8");
}

function summary(partial: {
  facets?: Partial<LearnerConceptMasterySummary["facets"]>;
  evidenceSourceCounts?: LearnerConceptMasterySummary["evidenceSourceCounts"];
  reviewCount?: number;
}): LearnerConceptMasterySummary {
  return {
    learnerId: "user-1",
    conceptId: "concept-1",
    conceptTitle: "Network Lab Skills",
    facets: { ...emptyFacetScores(), ...partial.facets },
    topicMastery: null,
    recentMissedCount: 0,
    evidenceSourceCounts: partial.evidenceSourceCounts ?? {
      quiz: 2,
      flashcard: 1,
      study_evaluate: 1,
      other: 0,
    },
    reviewCount: partial.reviewCount ?? 4,
    lastReviewedAt: null,
    nextReviewAt: null,
  };
}

describe("2P-45 performance contract", () => {
  it("forbids PerformanceEngine and PERFORM_GAP", () => {
    const t = performanceEvidenceTruthSummary();
    expect(t.inventsPerformanceEngine).toBe(false);
    expect(t.inventsPerformGap).toBe(false);
    expect(t.completionIsNotEvidence).toBe(true);
    expect(t.openIsNotEvidence).toBe(true);
    expect(PERFORM_COVERAGE_LIMITATION.orchestratorPerformGap).toBe(false);
    expect(performProductImplementationStatus().orchestratorPerformGapAdded).toBe(
      false,
    );
    expect(read("src/lib/learning/orchestrator/diagnose.ts")).not.toContain(
      "PERFORM_GAP",
    );
  });

  it("inventory includes networking and language PERFORM producers", () => {
    expect(FACET_PRODUCER_COVERAGE.PERFORM).toContain("networking");
    expect(FACET_PRODUCER_COVERAGE.PERFORM).toContain("language");
    expect(FACET_PRODUCER_COVERAGE.PERFORM).toContain("coding");
    expect(performProductBridgeStatus().realPerformProducerExists).toBe(true);
  });
});

describe("2P-45 Orchestrator performance need (no new enum)", () => {
  it("understand+apply strong with weak perform → APPLICATION_GAP", () => {
    const result = orchestrateFromLearnerState(
      summary({
        reviewCount: 5,
        facets: {
          recognize: ORCHESTRATOR_FACET_STRONG,
          explain: ORCHESTRATOR_FACET_STRONG,
          apply: ORCHESTRATOR_FACET_STRONG,
          solve: 0.5,
          perform: 0.1,
          retain: ORCHESTRATOR_FACET_STRONG,
        },
      }),
    );
    expect(result.diagnosis).toBe("APPLICATION_GAP");
    expect(result.reason).toMatch(/demonstrated performance|meaningful task/i);
    expect(result.diagnosis).not.toBe("NO_INTERVENTION");
  });

  it("keeps NO_INTERVENTION when perform is also adequate", () => {
    const result = orchestrateFromLearnerState(
      summary({
        reviewCount: 6,
        evidenceSourceCounts: {
          quiz: 2,
          flashcard: 2,
          study_evaluate: 2,
          other: 0,
        },
        facets: {
          recognize: 0.8,
          explain: 0.75,
          apply: 0.7,
          perform: 0.7,
          retain: 0.7,
        },
      }),
    );
    expect(result.diagnosis).toBe("NO_INTERVENTION");
  });
});

describe("2P-45 ranking soft-prefers performCapable", () => {
  it("prefers performCapable over non-perform when preferPerformProducers", () => {
    const coding = ACTIVITY_INTERVENTION_CAPABILITIES.find(
      (c) => c.adapterKey === "coding",
    );
    const simulation = ACTIVITY_INTERVENTION_CAPABILITIES.find(
      (c) => c.adapterKey === "simulation",
    );
    expect(coding?.performCapable).toBe(true);
    expect(simulation?.performCapable).toBe(false);

    const equalCompat = {
      status: "MATCH" as const,
      strength: 1 as const,
      matchedTokens: ["lab"],
      reason: "title_topic_cue_match" as const,
    };
    const ranked = rankActivityInterventionCandidates(
      [
        {
          capability: simulation!,
          compatibility: equalCompat,
        },
        {
          capability: coding!,
          compatibility: equalCompat,
        },
      ],
      { preferPerformProducers: true },
    );
    expect(ranked[0]?.capability.adapterKey).toBe("coding");

    const again = rankActivityInterventionCandidates(
      [
        {
          capability: simulation!,
          compatibility: equalCompat,
        },
        {
          capability: coding!,
          compatibility: equalCompat,
        },
      ],
      { preferPerformProducers: true },
    );
    expect(again[0]?.capability.adapterKey).toBe(ranked[0]?.capability.adapterKey);
  });
});

describe("2P-45 facets + sufficiency", () => {
  it("PERFORM remains distinct from APPLY/SOLVE in presentation", () => {
    const view = presentConceptProgress({
      conceptId: "c1",
      conceptMastery: {
        recognize: ORCHESTRATOR_FACET_STRONG,
        explain: ORCHESTRATOR_FACET_STRONG,
        apply: ORCHESTRATOR_FACET_STRONG,
        solve: 0.2,
        perform: 0.2,
        retain: ORCHESTRATOR_FACET_STRONG,
        confidence: 0.6,
        reviewCount: 4,
      },
    });
    if (view.status !== "available") throw new Error("expected available");
    expect(view.demonstrated).toContain("Application");
    expect(view.mayNeedPractice).toContain("Performance");
    expect(view.mayNeedPractice).toContain("Problem solving");
  });

  it("thin PERFORM evidence does not claim demonstrated", () => {
    const view = presentConceptProgress({
      conceptId: "c1",
      conceptMastery: {
        recognize: 0.2,
        explain: 0.2,
        apply: 0.2,
        solve: 0.2,
        perform: ORCHESTRATOR_FACET_STRONG,
        retain: 0.2,
        confidence: 0.4,
        reviewCount: 1,
      },
    });
    if (view.status !== "available") throw new Error("expected available");
    const perform = view.dimensions.find((d) => d.facet === "PERFORM");
    expect(perform?.status).toBe("developing");
    expect(classifyEvidenceSufficiency({ reviewCount: 1 })).toBe("thin");
  });
});

describe("2P-45 wiring", () => {
  it("diagnose wires preferPerformProducers", () => {
    const diagnose = read("src/lib/learning/orchestrator/diagnose.ts");
    expect(diagnose).toContain("preferPerformProducers");
    expect(diagnose).toContain("facets.perform < WEAK");
    const ranking = read(
      "src/lib/learning/orchestrator/activity-intervention-ranking.ts",
    );
    expect(ranking).toContain("preferPerformProducers");
    expect(ranking).toContain("performCapable");
  });
});

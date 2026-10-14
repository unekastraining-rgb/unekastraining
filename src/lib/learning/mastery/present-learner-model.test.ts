import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  learnerModelVisibilityTruthSummary,
  presentLearnerModelVisibility,
} from "./present-learner-model";
import { CANONICAL_ULE_MASTERY_SOURCE } from "./mastery-truth";
import { ORCHESTRATOR_FACET_STRONG } from "@/lib/learning/orchestrator/diagnose";

describe("presentLearnerModelVisibility", () => {
  it("uses ConceptMastery only and classifies without fake precision", () => {
    const view = presentLearnerModelVisibility([
      {
        conceptId: "strong-1",
        conceptTitle: "Osmosis",
        recentlyUpdated: true,
        conceptMastery: {
          recognize: ORCHESTRATOR_FACET_STRONG,
          explain: ORCHESTRATOR_FACET_STRONG,
          apply: ORCHESTRATOR_FACET_STRONG,
          solve: ORCHESTRATOR_FACET_STRONG,
          perform: ORCHESTRATOR_FACET_STRONG,
          retain: ORCHESTRATOR_FACET_STRONG,
          confidence: 0.7,
          reviewCount: 5,
        },
      },
      {
        conceptId: "weak-1",
        conceptTitle: "Diffusion",
        conceptMastery: {
          recognize: 0.2,
          explain: 0.2,
          apply: 0.2,
          solve: 0,
          perform: 0,
          retain: 0.2,
          confidence: 0.2,
          reviewCount: 3,
        },
      },
      {
        conceptId: "none-1",
        conceptTitle: "Mitosis",
        conceptMastery: null,
      },
    ]);

    expect(view.source).toBe(CANONICAL_ULE_MASTERY_SOURCE);
    expect(view.strengths.some((s) => s.conceptId === "strong-1")).toBe(true);
    expect(view.needsMorePractice.some((s) => s.conceptId === "weak-1")).toBe(
      true,
    );
    expect(view.insufficientEvidence.some((s) => s.conceptId === "none-1")).toBe(
      true,
    );
    expect(view.recentDemonstrated.some((r) => r.conceptId === "strong-1")).toBe(
      true,
    );
    const blob = JSON.stringify(view);
    expect(blob).not.toMatch(/attemptId|evidencePayload|0\.45|0\.55/);
  });

  it("truth: no new Learner Model table", () => {
    const t = learnerModelVisibilityTruthSummary();
    expect(t.createsNewLearnerModelTable).toBe(false);
    expect(t.usesConceptMastery).toBe(true);
    const src = readFileSync(
      join(process.cwd(), "src/lib/learning/mastery/present-learner-model.ts"),
      "utf8",
    );
    expect(src).not.toMatch(/prisma\.|model LearnerModel/);
  });
});

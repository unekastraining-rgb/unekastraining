/**
 * Phase 2G-12 — SIX guided completion characterization + adaptive gate.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import { SIX_GUIDES } from "@/lib/csl/six-guides";
import {
  SIX_STAGE_PASS_SCORE,
  isSixAdaptiveCompletionEligible,
  isSixStagePassing,
  resolveTrustedSixGuidedStageCount,
  sixGuideCompletionCharacterization,
} from "@/lib/csl/six-completion";

describe("Phase 2G-12 SIX completion characterization", () => {
  it("documents each technique's actual guide stages and completion signals", () => {
    const rows = sixGuideCompletionCharacterization();
    expect(rows).toHaveLength(6);

    for (const row of rows) {
      expect(row.guideStageCount).toBe(3);
      expect(row.stageTitles).toHaveLength(3);
      expect(row.stagePassScore).toBe(65);
      expect(SIX_GUIDES[row.technique].steps.map((s) => s.title)).toEqual(
        row.stageTitles,
      );
    }

    expect(rows.map((r) => r.technique).sort()).toEqual(
      [
        "active-recall",
        "chunking",
        "detailed-explanation",
        "feynman",
        "hands-on-practice",
        "visualization",
      ].sort(),
    );
  });

  it("stage pass matches SixGuidedSession threshold (score >= 65)", () => {
    expect(SIX_STAGE_PASS_SCORE).toBe(65);
    expect(isSixStagePassing(64)).toBe(false);
    expect(isSixStagePassing(65)).toBe(true);
    expect(isSixStagePassing(100)).toBe(true);

    const session = readFileSync(
      path.join(process.cwd(), "src/components/study/SixGuidedSession.tsx"),
      "utf8",
    );
    expect(session).toContain("SIX_STAGE_PASS_SCORE");
    expect(session).toContain("sixStageCount: practiceSteps.length");
  });

  it("trusted stage count prefers validated client length, else static guide (3)", () => {
    expect(
      resolveTrustedSixGuidedStageCount({
        component: "chunking",
        clientStageCount: 2,
      }),
    ).toBe(2);
    expect(
      resolveTrustedSixGuidedStageCount({
        component: "chunking",
        clientStageCount: 4,
      }),
    ).toBe(4);
    expect(
      resolveTrustedSixGuidedStageCount({
        component: "chunking",
        clientStageCount: 1,
      }),
    ).toBe(3);
    expect(
      resolveTrustedSixGuidedStageCount({
        component: "chunking",
      }),
    ).toBe(3);
    expect(
      resolveTrustedSixGuidedStageCount({
        component: "not-a-technique",
      }),
    ).toBeNull();
  });

  it("adaptive gate: intermediate stages are not eligible", () => {
    for (const stepIndex of [0, 1]) {
      const gate = isSixAdaptiveCompletionEligible({
        component: "chunking",
        stepIndex,
        evaluationScore: 90,
        clientStageCount: 3,
      });
      expect(gate.eligible).toBe(false);
      expect(gate.reason).toBe("six_activity_incomplete");
    }
  });

  it("adaptive gate: final stage below pass score is not eligible (retry stays in SIX)", () => {
    const gate = isSixAdaptiveCompletionEligible({
      component: "feynman",
      stepIndex: 2,
      evaluationScore: 64,
      clientStageCount: 3,
    });
    expect(gate.eligible).toBe(false);
    expect(gate.reason).toBe("final_stage_not_passing");
  });

  it("adaptive gate: final stage at pass score is eligible", () => {
    const gate = isSixAdaptiveCompletionEligible({
      component: "visualization",
      stepIndex: 2,
      evaluationScore: 65,
      clientStageCount: 3,
    });
    expect(gate.eligible).toBe(true);
    expect(gate.reason).toBe("six_activity_complete");
  });

  it("adaptive gate: two-stage lesson completes on stepIndex 1", () => {
    expect(
      isSixAdaptiveCompletionEligible({
        component: "hands-on-practice",
        stepIndex: 0,
        evaluationScore: 90,
        clientStageCount: 2,
      }).eligible,
    ).toBe(false);
    expect(
      isSixAdaptiveCompletionEligible({
        component: "hands-on-practice",
        stepIndex: 1,
        evaluationScore: 90,
        clientStageCount: 2,
      }).eligible,
    ).toBe(true);
  });
});

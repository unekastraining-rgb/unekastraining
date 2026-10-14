import { describe, expect, it } from "vitest";
import {
  evaluateStructuredChallenge,
  getStructuredChallenge,
} from "./service";

describe("structured activity rubrics", () => {
  it("writing requires learner-authored criteria hits", () => {
    const c = getStructuredChallenge("write-explain-photosynthesis")!;
    const fail = evaluateStructuredChallenge(c, "I like plants.");
    expect(fail.outcome).toBe("FAIL");
    const pass = evaluateStructuredChallenge(
      c,
      "Plants use sunlight and carbon dioxide with water in a process that makes glucose and oxygen because of chlorophyll.",
    );
    expect(pass.outcome).toBe("SUCCESS");
    expect(pass.skillFacet).toBe("EXPLAIN");
  });

  it("game ignores points — rubric only", () => {
    const c = getStructuredChallenge("game-vocab-match")!;
    const withPointsOnly = evaluateStructuredChallenge(c, "I scored 100 points!");
    expect(withPointsOnly.outcome).toBe("FAIL");
    const withDefs = evaluateStructuredChallenge(
      c,
      "Mitochondria make ATP energy. Nucleus holds DNA. Ribosome builds protein.",
    );
    expect(withDefs.outcome).toBe("SUCCESS");
    expect(withDefs.details.pointsIgnored).toBe(true);
  });

  it("lab and presentation can produce PERFORM facet", () => {
    const lab = getStructuredChallenge("lab-observe-density")!;
    expect(lab.asPerform).toBe(true);
    const labEval = evaluateStructuredChallenge(
      lab,
      "I observed the object float because its density is less than water when mass over volume is low.",
    );
    expect(labEval.skillFacet).toBe("PERFORM");

    const pres = getStructuredChallenge("presentation-outline")!;
    expect(pres.asPerform).toBe(true);
  });

  it("project creation alone with empty artifact fails", () => {
    const c = getStructuredChallenge("project-study-plan")!;
    expect(evaluateStructuredChallenge(c, "").outcome).toBe("FAIL");
  });

  it("simulation requires decision + consequence criteria", () => {
    const c = getStructuredChallenge("sim-supply-demand")!;
    const result = evaluateStructuredChallenge(
      c,
      JSON.stringify({
        educationalOnly: true,
        decision: {
          action: "predict",
          prediction: "up",
          reasoning:
            "Demand rose with fixed supply, creating upward equilibrium price pressure and possible shortage.",
        },
      }),
    );
    expect(result.outcome).toBe("SUCCESS");
    expect(result.details.mode).toBe("educational_market");
    expect(result.details.profitIsNotMastery).toBe(true);
  });
});

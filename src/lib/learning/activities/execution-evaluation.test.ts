import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  activityExecutionTruthSummary,
  ACTIVITY_LIFECYCLE_STAGES,
} from "./execution-contract";
import {
  sanitizeClientActivitySubmission,
  serverEvaluationTruthSummary,
  makeServerEvaluation,
  outcomeFromPassRatio,
} from "./server-evaluation";

describe("2G-71 WS A execution contract", () => {
  it("distinguishes lifecycle stages and does not replace adapters", () => {
    expect(ACTIVITY_LIFECYCLE_STAGES).toContain("evaluation");
    expect(ACTIVITY_LIFECYCLE_STAGES).toContain("progression");
    const t = activityExecutionTruthSummary();
    expect(t.replacesQuizSixFlashcardAdapters).toBe(false);
    expect(t.conflatesActivityWithEvidence).toBe(false);
    expect(t.activityOwnsMasteryMath).toBe(false);
  });
});

describe("2G-71 WS B server-authoritative evaluation", () => {
  it("rejects forged score/outcome/mastery/learner/concept from client", () => {
    const { work, rejectedForgeryKeys } = sanitizeClientActivitySubmission({
      code: "function add(a,b){return a+b}",
      outcome: "SUCCESS",
      score: 1,
      mastery: { recognize: 1 },
      learnerId: "attacker",
      userId: "attacker",
      conceptId: "stolen",
      evaluation: { outcome: "SUCCESS" },
    });
    expect(work.code).toContain("function add");
    expect(rejectedForgeryKeys).toEqual(
      expect.arrayContaining([
        "outcome",
        "score",
        "mastery",
        "learnerId",
        "userId",
        "conceptId",
        "evaluation",
      ]),
    );
    expect(work).not.toHaveProperty("outcome");
    expect(work).not.toHaveProperty("score");
  });

  it("truth summary forbids client authority", () => {
    const t = serverEvaluationTruthSummary();
    expect(t.clientMaySubmitOutcome).toBe(false);
    expect(t.clientMaySubmitScore).toBe(false);
    expect(t.clientMaySubmitMastery).toBe(false);
    expect(t.clientMaySubmitLearnerIdentity).toBe(false);
    expect(t.aiAloneIsNotObjectiveMastery).toBe(true);
  });

  it("makeServerEvaluation is always authoritative", () => {
    const ev = makeServerEvaluation({
      outcome: "PARTIAL",
      score: 0.6,
      skillFacet: "PERFORM",
    });
    expect(ev.serverAuthoritative).toBe(true);
    expect(outcomeFromPassRatio(1)).toBe("SUCCESS");
    expect(outcomeFromPassRatio(0.5)).toBe("PARTIAL");
    expect(outcomeFromPassRatio(0.2)).toBe("FAIL");
  });

  it("server-evaluation never trusts client outcome in source", () => {
    const src = readFileSync(
      join(process.cwd(), "src/lib/learning/activities/server-evaluation.ts"),
      "utf8",
    );
    expect(src).toContain("sanitizeClientActivitySubmission");
    expect(src).toContain("assertOwnedConcept");
    expect(src).toContain("recordEvidence");
    expect(src).toContain("applyEvidenceToMastery");
  });
});

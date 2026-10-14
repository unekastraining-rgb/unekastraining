/**
 * 2P-39 — Constrained math workspace evaluation + algebra helpers.
 */

import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  classifyStepError,
  equationsEquivalent,
  parseLinearEquation,
  solveLinearEquation,
} from "@/lib/learning/activities/math/algebra";
import {
  getMathChallenge,
  listMathChallenges,
  MATH_CHALLENGES,
} from "@/lib/learning/activities/math/challenges";
import {
  checkMathStep,
  evaluateMathWorkspace,
} from "@/lib/learning/activities/math/evaluate";
import { MATH_WORKSPACE_PROGRESSION_ENTRIES } from "@/lib/learning/activities/math/progression";

describe("2P-39 constrained algebra", () => {
  it("parses and solves supported linear forms", () => {
    const eq = parseLinearEquation("2x + 4 = 10");
    expect(eq).not.toBeNull();
    expect(solveLinearEquation(eq!)).toBeCloseTo(3);

    const dist = parseLinearEquation("5(x+2)=25");
    expect(solveLinearEquation(dist!)).toBeCloseTo(3);

    const both = parseLinearEquation("2x+3=x+9");
    expect(solveLinearEquation(both!)).toBeCloseTo(6);
  });

  it("detects equivalence and sign / equality errors", () => {
    const a = parseLinearEquation("2x+4=10")!;
    const b = parseLinearEquation("2x=6")!;
    expect(equationsEquivalent(a, b)).toBe(true);

    expect(classifyStepError("2x+4=10", "2x=6", 3)).toBe("NONE");
    expect(classifyStepError("2x+4=10", "2x=14", 3)).not.toBe("NONE");
    // Sign mistake: subtracted 5 instead of adding → 2x = 4 (should be 2x = 14).
    expect(classifyStepError("2x-5=9", "2x=4", 7)).toBe("SIGN_ERROR");
  });

  it("flags distribution mistakes", () => {
    expect(classifyStepError("5(x+2)=25", "5x+2=25", 3)).toBe(
      "DISTRIBUTION_ERROR",
    );
  });
});

describe("2P-39 evaluateMathWorkspace", () => {
  const challenge = getMathChallenge("math-linear-basic")!;

  it("accepts a valid step chain", () => {
    const result = evaluateMathWorkspace(challenge, {
      steps: ["2x + 4 = 10", "2x = 6", "x = 3"],
    });
    expect(result.outcome).toBe("SUCCESS");
    expect(result.details.finalCorrect).toBe(true);
    expect(result.details.stepCorrect).toBe(true);
    expect(result.skillFacet).toBe("SOLVE");
  });

  it("rejects incorrect final answer", () => {
    const result = evaluateMathWorkspace(challenge, {
      steps: ["2x + 4 = 10", "2x = 6", "x = 4"],
    });
    expect(result.outcome).not.toBe("SUCCESS");
    expect(result.details.finalCorrect).toBe(false);
  });

  it("flags invalid transforms without forging SUCCESS", () => {
    const result = evaluateMathWorkspace(challenge, {
      steps: ["2x + 4 = 10", "2x = 14", "x = 7"],
    });
    expect(result.details.stepCorrect).toBe(false);
    expect(result.outcome).not.toBe("SUCCESS");
    expect(String(result.details.errorCategory)).not.toBe("NONE");
  });

  it("checkMathStep does not invent answers", () => {
    const ok = checkMathStep({
      previous: "2x+4=10",
      next: "2x=6",
      expectedX: 3,
    });
    expect(ok.ok).toBe(true);
    expect(ok.learnerMessage).not.toMatch(/x\s*=\s*3/i);

    const bad = checkMathStep({
      previous: "2x+4=10",
      next: "2x=14",
      expectedX: 3,
    });
    expect(bad.ok).toBe(false);
    expect(bad.learnerMessage).not.toMatch(/the answer is/i);
  });
});

describe("2P-39 math content pack", () => {
  it("ships a focused deterministic pack", () => {
    expect(MATH_CHALLENGES.length).toBeGreaterThanOrEqual(4);
    expect(MATH_CHALLENGES.length).toBeLessThanOrEqual(8);
    for (const c of listMathChallenges()) {
      expect(Number.isFinite(c.expectedX)).toBe(true);
      expect(c.scaffolds?.some((s) => s.doesNotRevealAnswer !== false)).toBe(
        true,
      );
    }
    expect(MATH_WORKSPACE_PROGRESSION_ENTRIES).toHaveLength(5);
  });
});

describe("2P-39 submitMathChallenge evidence boundary", () => {
  const mockRecord = vi.fn();

  beforeEach(() => {
    vi.resetModules();
    mockRecord.mockReset();
  });

  it("records SOLVE evidence only through submit path", async () => {
    vi.doMock("@/lib/learning/activities/server-evaluation", async () => {
      const actual = await vi.importActual<
        typeof import("@/lib/learning/activities/server-evaluation")
      >("@/lib/learning/activities/server-evaluation");
      return {
        ...actual,
        recordAuthoritativeActivityEvidence: mockRecord,
      };
    });

    mockRecord.mockResolvedValue({
      ok: true,
      completion: {
        learningAttemptId: "la-1",
        conceptId: "c-1",
        outcome: "SUCCESS",
        score: 1,
      },
      rejectedClientClaims: true,
    });

    const { submitMathChallenge } = await import(
      "@/lib/learning/activities/math/service"
    );

    const forged = await submitMathChallenge({
      learnerId: "user-1",
      conceptId: "c-1",
      challengeId: "math-linear-basic",
      clientBody: {
        steps: ["2x+4=10", "2x=6", "x=3"],
        outcome: "SUCCESS",
        score: 1,
        learnerId: "attacker",
      },
    });

    expect(forged.ok).toBe(true);
    if (forged.ok) {
      expect(forged.rejectedForgeryKeys.length).toBeGreaterThan(0);
    }
    expect(mockRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceKind: "math_workspace_submit",
        skillFacet: "SOLVE",
        learnerId: "user-1",
      }),
    );
  });
});

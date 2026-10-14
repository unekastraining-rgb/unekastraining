import { describe, expect, it } from "vitest";
import { getCodingChallenge } from "./challenges";
import { evaluateCodingChallenge } from "./evaluate";

describe("coding challenge evaluation", () => {
  it("passes correct JS solution via vm sandbox", () => {
    const challenge = getCodingChallenge("js-sum-two")!;
    const result = evaluateCodingChallenge(
      challenge,
      "function add(a, b) { return a + b; }",
    );
    expect(result.serverAuthoritative).toBe(true);
    expect(result.outcome).toBe("SUCCESS");
    expect(result.score).toBe(1);
    expect(result.skillFacet).toBe("PERFORM");
  });

  it("fails incorrect JS solution", () => {
    const challenge = getCodingChallenge("js-sum-two")!;
    const result = evaluateCodingChallenge(
      challenge,
      "function add(a, b) { return a - b; }",
    );
    expect(result.outcome).toBe("FAIL");
    expect(result.score!).toBeLessThan(0.5);
  });

  it("ignores client-claimed success in code string alone is not enough without tests", () => {
    const challenge = getCodingChallenge("js-is-even")!;
    const result = evaluateCodingChallenge(
      challenge,
      "function isEven(n) { return false; }",
    );
    expect(result.outcome).toBe("FAIL");
  });

  it("python uses structural criteria (no host shell)", () => {
    const challenge = getCodingChallenge("py-add")!;
    const good = evaluateCodingChallenge(
      challenge,
      "def add(a, b):\n    return a + b\n",
    );
    expect(good.outcome).toBe("SUCCESS");
    expect(good.details.mode).toBe("structural_criteria");
  });
});

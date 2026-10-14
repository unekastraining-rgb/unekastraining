/**
 * Phase 2G-15 — shared Adaptive launch context parsing.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  parseAdaptiveLaunchContext,
  parseAdaptiveRunId,
  parseAdaptiveStepIndex,
} from "@/lib/learning/sequence/adaptive-launch-context";

describe("Phase 2G-15 adaptive-launch-context", () => {
  it("parses opaque adaptiveRunId / adaptiveStep identically for adapters", () => {
    expect(parseAdaptiveRunId(" run-1 ")).toBe("run-1");
    expect(parseAdaptiveRunId(undefined)).toBe("");
    expect(parseAdaptiveRunId(42)).toBe("");
    expect(parseAdaptiveStepIndex(0)).toBe(0);
    expect(parseAdaptiveStepIndex("3")).toBe(3);
    expect(parseAdaptiveStepIndex(-1)).toBeNull();
    expect(parseAdaptiveStepIndex("x")).toBeNull();
  });

  it("SIX and Quiz bind modules use the shared parsers", () => {
    const six = readFileSync(
      path.join(process.cwd(), "src/lib/learning/sequence/six-evaluate-bind.ts"),
      "utf8",
    );
    const quiz = readFileSync(
      path.join(process.cwd(), "src/lib/learning/sequence/quiz-submit-bind.ts"),
      "utf8",
    );
    expect(six).toContain("parseAdaptiveRunId");
    expect(six).toContain("parseAdaptiveStepIndex");
    expect(quiz).toContain("parseAdaptiveRunId");
    expect(quiz).toContain("parseAdaptiveStepIndex");
    expect(six).not.toContain("function parseAdaptiveStep");
    expect(quiz).not.toContain("function parseAdaptiveStep");
  });

  it("2G-22: absent intent leaves Adaptive parsing unchanged", () => {
    const ctx = parseAdaptiveLaunchContext({
      adaptiveRunId: "run-1",
      adaptiveStep: 0,
    });
    expect(ctx.runId).toBe("run-1");
    expect(ctx.stepIndex).toBe(0);
    expect(ctx.intent).toBeNull();
  });
});

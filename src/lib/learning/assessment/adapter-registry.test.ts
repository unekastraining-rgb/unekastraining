/**
 * Phase 2G-38 — Assessment Adapter Registry tests.
 * Uses a stub adapter only — Quiz must remain unregistered.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  createAssessmentAdapterRegistry,
  type AssessmentAdapter,
  type AssessmentAdapterContext,
} from "@/lib/learning/assessment/adapter-registry";
import { runAssessmentWorkflow } from "@/lib/learning/assessment/workflow";
import { resolveAssessmentMode } from "@/lib/learning/assessment/assessment-mode-policy";
import { createExplicitLearningIntent } from "@/lib/learning/intent/project";
import type { AssessmentWorkflowHandoff } from "@/lib/learning/orchestrator/assessment-handoff";

function stubAdapter(
  key: string,
  activityType: "CODING_CHALLENGE" | "LAB" | "SIMULATION" = "CODING_CHALLENGE",
): AssessmentAdapter {
  return {
    key,
    canHandle(context: AssessmentAdapterContext): boolean {
      return context.plan.status === "ready";
    },
    resolve(_context: AssessmentAdapterContext) {
      void _context;
      return {
        adapterKey: key,
        activityType,
      };
    },
  };
}

describe("Phase 2G-38 AssessmentAdapterRegistry", () => {
  it("1–2. register and resolve by opaque key", () => {
    const registry = createAssessmentAdapterRegistry();
    expect(registry.register(stubAdapter("coding")).ok).toBe(true);
    const resolved = registry.resolve("coding");
    expect(resolved.ok).toBe(true);
    if (resolved.ok) {
      expect(resolved.adapter.key).toBe("coding");
    }
  });

  it("3. unknown key returns safe not_found", () => {
    const registry = createAssessmentAdapterRegistry();
    expect(registry.resolve("missing")).toEqual({
      ok: false,
      reason: "not_found",
    });
  });

  it("4. duplicate keys rejected", () => {
    const registry = createAssessmentAdapterRegistry();
    expect(registry.register(stubAdapter("lab")).ok).toBe(true);
    expect(registry.register(stubAdapter("lab"))).toEqual({
      ok: false,
      reason: "duplicate_key",
    });
    expect(registry.list()).toHaveLength(1);
  });

  it("5. deterministic list order (insertion)", () => {
    const registry = createAssessmentAdapterRegistry();
    registry.register(stubAdapter("writing"));
    registry.register(stubAdapter("presentation"));
    expect(registry.list().map((a) => a.key)).toEqual([
      "writing",
      "presentation",
    ]);
  });

  it("6–8. adapter contract + resolution without execution", () => {
    const registry = createAssessmentAdapterRegistry();
    const adapter = stubAdapter("simulation", "SIMULATION");
    registry.register(adapter);

    const plan = {
      status: "ready" as const,
      assessmentMode: "DIAGNOSTIC" as const,
      conceptId: "concept-anatomy",
    };
    const context: AssessmentAdapterContext = { plan, learnerId: "user-1" };
    expect(adapter.canHandle(context)).toBe(true);
    const resolution = adapter.resolve(context);
    expect(resolution).toEqual({
      adapterKey: "simulation",
      activityType: "SIMULATION",
    });
  });

  it("9–11. registry source does not run activities or write evidence/mastery", () => {
    const source = readFileSync(
      path.join(process.cwd(), "src/lib/learning/assessment/adapter-registry.ts"),
      "utf8",
    );
    expect(source).not.toMatch(
      /recordEvidence|applyEvidenceToMastery|recordQuiz/,
    );
    expect(source).not.toMatch(/\blaunch\s*\(|\.submit\(|\.grade\(/);
    expect(source).not.toMatch(/prisma|db\./i);
  });

  it("12–14. no Adaptive / Quiz wiring; ASSESS does not imply Quiz", () => {
    const source = readFileSync(
      path.join(process.cwd(), "src/lib/learning/assessment/adapter-registry.ts"),
      "utf8",
    );
    expect(source).not.toMatch(/quiz-adapter|recordQuiz|AdaptiveSequence/);
    expect(source).not.toMatch(/ASSESS\s*→\s*Quiz|default.*quiz/i);

    const registry = createAssessmentAdapterRegistry();
    expect(registry.has("quiz")).toBe(false);
    expect(registry.list()).toEqual([]);
  });

  it("15. subject-agnostic keys (mechanism, not subject)", () => {
    const registry = createAssessmentAdapterRegistry();
    expect(registry.register(stubAdapter("sql")).ok).toBe(true);
    expect(registry.resolve("sql").ok).toBe(true);
    // No subject-named adapters required.
    expect(registry.resolve("JavaAssessment").ok).toBe(false);
  });

  it("16–18. workflow / mode policy / diagnosis isolation unchanged", () => {
    const handoff: AssessmentWorkflowHandoff = { purpose: "ASSESS" };
    const plan = runAssessmentWorkflow({
      learnerId: "user-1",
      assessmentHandoff: handoff,
      decisionContext: {
        intent: createExplicitLearningIntent({ purpose: "ASSESS" }),
      },
      diagnosis: "NO_INTERVENTION",
      conceptId: "concept-1",
    });
    expect(plan.status).toBe("ready");
    expect(plan.assessmentMode).toBe("VERIFICATION");
    expect(plan.adapterKey).toBeUndefined();
    expect(plan.activityType).toBeUndefined();

    expect(
      resolveAssessmentMode({
        diagnosis: "INSUFFICIENT_EVIDENCE",
        intentSource: "EXPLICIT",
      }),
    ).toBe("DIAGNOSTIC");
  });

  it("invalid adapter / empty key rejected", () => {
    const registry = createAssessmentAdapterRegistry();
    expect(
      registry.register({ key: "  " } as unknown as AssessmentAdapter),
    ).toEqual({ ok: false, reason: "invalid_adapter" });
    expect(registry.resolve("")).toEqual({
      ok: false,
      reason: "invalid_key",
    });
  });
});

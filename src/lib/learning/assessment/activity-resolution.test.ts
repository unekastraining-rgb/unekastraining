/**
 * Phase 2G-42 — Thin Assessment Activity Resolution tests.
 */
import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  createAssessmentAdapterRegistry,
  type AssessmentAdapter,
  type AssessmentAdapterContext,
} from "@/lib/learning/assessment/adapter-registry";
import { resolveAssessmentActivity } from "@/lib/learning/assessment/activity-resolution";
import {
  runAssessmentWorkflow,
  type AssessmentPlan,
} from "@/lib/learning/assessment/workflow";
import { createExplicitLearningIntent } from "@/lib/learning/intent/project";

function stubAdapter(
  key: string,
  activityType: "CODING_CHALLENGE" | "LAB" | "SIMULATION" | "SQL_CHALLENGE" = "CODING_CHALLENGE",
): AssessmentAdapter {
  return {
    key,
    canHandle(context: AssessmentAdapterContext): boolean {
      return context.plan.status === "ready";
    },
    resolve(context: AssessmentAdapterContext) {
      void context;
      return { adapterKey: key, activityType };
    },
  };
}

function readyPlan(partial?: Partial<AssessmentPlan>): AssessmentPlan {
  const base = runAssessmentWorkflow({
    learnerId: "user-1",
    assessmentHandoff: { purpose: "ASSESS" },
    decisionContext: {
      intent: createExplicitLearningIntent({ purpose: "ASSESS" }),
    },
    diagnosis: "UNDERSTANDING_GAP",
    conceptId: "concept-1",
  });
  return { ...base, ...partial };
}

describe("Phase 2G-42 resolveAssessmentActivity", () => {
  it("valid ready plan + registered adapter key → resolution with activityType", () => {
    const registry = createAssessmentAdapterRegistry();
    registry.register(stubAdapter("coding", "CODING_CHALLENGE"));

    const result = resolveAssessmentActivity(
      readyPlan({ adapterKey: "coding" }),
      "user-1",
      registry,
    );

    expect(result).toEqual({
      ok: true,
      resolution: {
        adapterKey: "coding",
        activityType: "CODING_CHALLENGE",
      },
      learnerId: "user-1",
    });
  });

  it("ready plan without adapterKey → activity_resolution_unavailable (no default)", () => {
    const registry = createAssessmentAdapterRegistry();
    registry.register(stubAdapter("coding"));

    const result = resolveAssessmentActivity(
      readyPlan(),
      "user-1",
      registry,
    );

    expect(result).toEqual({
      ok: false,
      reason: "activity_resolution_unavailable",
    });
  });

  it("unknown adapter key → registry not_found", () => {
    const registry = createAssessmentAdapterRegistry();
    const result = resolveAssessmentActivity(
      readyPlan({ adapterKey: "missing" }),
      "user-1",
      registry,
    );
    expect(result).toEqual({ ok: false, reason: "not_found" });
  });

  it("deferred / blocked plans do not resolve", () => {
    const registry = createAssessmentAdapterRegistry();
    registry.register(stubAdapter("coding"));

    expect(
      resolveAssessmentActivity(
        {
          status: "deferred",
          conceptId: "concept-1",
          adapterKey: "coding",
        },
        "user-1",
        registry,
      ),
    ).toEqual({ ok: false, reason: "plan_not_ready" });

    expect(
      resolveAssessmentActivity(
        {
          status: "blocked",
          conceptId: "concept-1",
          blockReason: "assessment_handoff_required",
          adapterKey: "coding",
        },
        "user-1",
        registry,
      ),
    ).toEqual({ ok: false, reason: "plan_not_ready" });
  });

  it("preserves activityType from adapter.resolve", () => {
    const registry = createAssessmentAdapterRegistry();
    registry.register(stubAdapter("sql", "SQL_CHALLENGE"));

    const result = resolveAssessmentActivity(
      readyPlan({ adapterKey: "sql", activityType: "LAB" }),
      "learner-abc",
      registry,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.resolution.activityType).toBe("SQL_CHALLENGE");
  });

  it("learnerId crosses the boundary into adapter context", () => {
    const registry = createAssessmentAdapterRegistry();
    const canHandle = vi.fn((ctx: AssessmentAdapterContext) => {
      expect(ctx.learnerId).toBe("learner-bound");
      return true;
    });
    const resolve = vi.fn((ctx: AssessmentAdapterContext) => {
      expect(ctx.learnerId).toBe("learner-bound");
      return {
        adapterKey: "lab",
        activityType: "LAB" as const,
      };
    });

    registry.register({
      key: "lab",
      canHandle,
      resolve,
    });

    const result = resolveAssessmentActivity(
      readyPlan({ adapterKey: "lab" }),
      "  learner-bound  ",
      registry,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.learnerId).toBe("learner-bound");
    expect(canHandle).toHaveBeenCalledOnce();
    expect(resolve).toHaveBeenCalledOnce();
  });

  it("adaptive context remains passive — plan.adaptive not mutated", () => {
    const registry = createAssessmentAdapterRegistry();
    registry.register(stubAdapter("coding"));
    const adaptive = { runId: "run-1", stepIndex: 2 };
    const plan = readyPlan({ adapterKey: "coding", adaptive });

    const result = resolveAssessmentActivity(plan, "user-1", registry);
    expect(result.ok).toBe(true);
    expect(plan.adaptive).toEqual({ runId: "run-1", stepIndex: 2 });
    expect(adaptive).toEqual({ runId: "run-1", stepIndex: 2 });
  });

  it("adapter_cannot_handle when canHandle returns false", () => {
    const registry = createAssessmentAdapterRegistry();
    registry.register({
      key: "coding",
      canHandle: () => false,
      resolve: () => ({
        adapterKey: "coding",
        activityType: "CODING_CHALLENGE",
      }),
    });

    expect(
      resolveAssessmentActivity(
        readyPlan({ adapterKey: "coding" }),
        "user-1",
        registry,
      ),
    ).toEqual({ ok: false, reason: "adapter_cannot_handle" });
  });

  it("no Quiz registered or selected; empty registry does not invent Quiz", () => {
    const empty = createAssessmentAdapterRegistry();
    expect(empty.list()).toEqual([]);
    expect(empty.has("quiz")).toBe(false);

    expect(
      resolveAssessmentActivity(
        readyPlan({ adapterKey: "quiz" }),
        "user-1",
        empty,
      ),
    ).toEqual({ ok: false, reason: "not_found" });

    const source = readFileSync(
      path.join(
        process.cwd(),
        "src/lib/learning/assessment/activity-resolution.ts",
      ),
      "utf8",
    );
    expect(source).not.toMatch(/quiz-bridge|quiz-adapter|QUIZ_ITEM/);
    expect(source).not.toMatch(/register\(.*quiz/i);
  });

  it("resolution does not execute activity / evidence / mastery / Adaptive", () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        "src/lib/learning/assessment/activity-resolution.ts",
      ),
      "utf8",
    );
    expect(source).toContain("resolveAssessmentActivity");
    expect(source).toContain("registry.resolve");
    expect(source).not.toMatch(
      /startOrResume|recordEvidence|applyEvidenceToMastery|recordAdaptive|coordinator/,
    );
    expect(source).not.toMatch(/prisma|db\./);
  });

  it("workflow-produced ready plans stay unresolved until adapterKey is set", () => {
    const plan = runAssessmentWorkflow({
      learnerId: "user-1",
      assessmentHandoff: { purpose: "ASSESS" },
      decisionContext: {
        intent: createExplicitLearningIntent({ purpose: "ASSESS" }),
      },
      diagnosis: "UNDERSTANDING_GAP",
      conceptId: "concept-java",
    });
    expect(plan.status).toBe("ready");
    expect(plan.adapterKey).toBeUndefined();

    const registry = createAssessmentAdapterRegistry();
    registry.register(stubAdapter("coding"));
    expect(resolveAssessmentActivity(plan, "user-1", registry)).toEqual({
      ok: false,
      reason: "activity_resolution_unavailable",
    });
  });
});

/**
 * Phase 2G-43 — Assessment activity preparation / descriptor tests.
 * Uses a test-only fake adapter — no Quiz registration or production fakes.
 */
import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  createAssessmentAdapterRegistry,
  type AssessmentAdapter,
  type AssessmentAdapterContext,
  type AssessmentActivityResolution,
} from "@/lib/learning/assessment/adapter-registry";
import { prepareAssessmentActivity } from "@/lib/learning/assessment/activity-preparation";
import {
  runAssessmentWorkflow,
  type AssessmentPlan,
} from "@/lib/learning/assessment/workflow";
import { createExplicitLearningIntent } from "@/lib/learning/intent/project";

function fakeCodingAdapter(): AssessmentAdapter {
  return {
    key: "coding",
    canHandle(context: AssessmentAdapterContext): boolean {
      return context.plan.status === "ready";
    },
    resolve() {
      return {
        adapterKey: "coding",
        activityType: "CODING_CHALLENGE",
      };
    },
    prepare() {
      return {
        activityRef: { kind: "coding_challenge", id: "challenge-stub-1" },
      };
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
  return {
    ...base,
    adapterKey: "coding",
    activityType: "CODING_CHALLENGE",
    ...partial,
  };
}

function codingResolution(
  partial?: Partial<AssessmentActivityResolution>,
): AssessmentActivityResolution {
  return {
    adapterKey: "coding",
    activityType: "CODING_CHALLENGE",
    ...partial,
  };
}

describe("Phase 2G-43 prepareAssessmentActivity", () => {
  it("1. ready plan + valid resolution → descriptor", async () => {
    const result = await prepareAssessmentActivity({
      plan: readyPlan(),
      resolution: codingResolution(),
      learnerId: "user-1",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.descriptor).toEqual({
      adapterKey: "coding",
      activityType: "CODING_CHALLENGE",
      conceptId: "concept-1",
      learnerId: "user-1",
      assessmentMode: "DIAGNOSTIC",
    });
  });

  it("2. non-ready plan → rejected", async () => {
    expect(
      await prepareAssessmentActivity({
        plan: {
          status: "deferred",
          conceptId: "concept-1",
          adapterKey: "coding",
        },
        resolution: codingResolution(),
        learnerId: "user-1",
      }),
    ).toEqual({ ok: false, reason: "plan_not_ready" });

    expect(
      await prepareAssessmentActivity({
        plan: {
          status: "blocked",
          conceptId: "concept-1",
          blockReason: "assessment_handoff_required",
        },
        resolution: codingResolution(),
        learnerId: "user-1",
      }),
    ).toEqual({ ok: false, reason: "plan_not_ready" });
  });

  it("3. missing resolution → rejected", async () => {
    expect(
      await prepareAssessmentActivity({
        plan: readyPlan(),
        resolution: null,
        learnerId: "user-1",
      }),
    ).toEqual({ ok: false, reason: "resolution_required" });
  });

  it("4. plan/resolution adapter key mismatch → rejected", async () => {
    expect(
      await prepareAssessmentActivity({
        plan: readyPlan({ adapterKey: "coding" }),
        resolution: codingResolution({ adapterKey: "lab" }),
        learnerId: "user-1",
      }),
    ).toEqual({ ok: false, reason: "adapter_key_mismatch" });
  });

  it("5. plan/resolution activity type mismatch → rejected", async () => {
    expect(
      await prepareAssessmentActivity({
        plan: readyPlan({
          adapterKey: "coding",
          activityType: "CODING_CHALLENGE",
        }),
        resolution: {
          adapterKey: "coding",
          activityType: "LAB",
        },
        learnerId: "user-1",
      }),
    ).toEqual({ ok: false, reason: "activity_type_mismatch" });
  });

  it("6–7. concept and assessmentMode preserved", async () => {
    const plan = readyPlan({
      conceptId: "concept-anatomy-heart",
      assessmentMode: "VERIFICATION",
    });
    const result = await prepareAssessmentActivity({
      plan,
      resolution: codingResolution(),
      learnerId: "user-9",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.descriptor.conceptId).toBe("concept-anatomy-heart");
    expect(result.descriptor.assessmentMode).toBe("VERIFICATION");
  });

  it("8. standalone — adaptive absent", async () => {
    const result = await prepareAssessmentActivity({
      plan: readyPlan({ adaptive: undefined }),
      resolution: codingResolution(),
      learnerId: "user-1",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.descriptor.adaptive).toBeUndefined();
  });

  it("9–10. adaptive context preserved passively; not mutated", async () => {
    const adaptive = { runId: "run-abc", stepIndex: 3 };
    const plan = readyPlan({ adaptive });
    const result = await prepareAssessmentActivity({
      plan,
      resolution: codingResolution(),
      learnerId: "user-1",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.descriptor.adaptive).toEqual({
      runId: "run-abc",
      stepIndex: 3,
    });
    expect(plan.adaptive).toEqual({ runId: "run-abc", stepIndex: 3 });
    expect(adaptive).toEqual({ runId: "run-abc", stepIndex: 3 });
  });

  it("malformed adaptive on plan → adaptive_context_invalid", async () => {
    expect(
      await prepareAssessmentActivity({
        plan: readyPlan({
          adaptive: { runId: "", stepIndex: 0 },
        }),
        resolution: codingResolution(),
        learnerId: "user-1",
      }),
    ).toEqual({ ok: false, reason: "adaptive_context_invalid" });
  });

  it("14. optional adapter.prepare merges opaque activityRef (test-only fake)", async () => {
    const registry = createAssessmentAdapterRegistry();
    registry.register(fakeCodingAdapter());

    const result = await prepareAssessmentActivity({
      plan: readyPlan(),
      resolution: codingResolution(),
      learnerId: "user-1",
      registry,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.descriptor.activityRef).toEqual({
      kind: "coding_challenge",
      id: "challenge-stub-1",
    });
  });

  it("unavailable prepare contribution → activity_not_available", async () => {
    const registry = createAssessmentAdapterRegistry();
    registry.register({
      key: "coding",
      canHandle: () => true,
      resolve: () => ({
        adapterKey: "coding",
        activityType: "CODING_CHALLENGE",
      }),
      prepare: () => ({ unavailable: true }),
    });
    expect(
      await prepareAssessmentActivity({
        plan: readyPlan(),
        resolution: codingResolution(),
        learnerId: "user-1",
        registry,
      }),
    ).toEqual({ ok: false, reason: "activity_not_available" });
  });

  it("11–13. no evidence/mastery/execution/Quiz dependency in preparation source", () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        "src/lib/learning/assessment/activity-preparation.ts",
      ),
      "utf8",
    );
    expect(source).toContain("prepareAssessmentActivity");
    expect(source).toContain("Option B");
    expect(source).not.toMatch(
      /startOrResume|recordEvidence|applyEvidenceToMastery|recordAdaptive|coordinator/,
    );
    expect(source).not.toMatch(/quiz-bridge|QUIZ_ITEM/);
    expect(source).not.toMatch(/prisma|db\./);
    expect(source).not.toMatch(/\bredirect\b/);
  });

  it("adapter.prepare is not required — universal descriptor without registry", async () => {
    const prepareSpy = vi.fn();
    void prepareSpy;
    const result = await prepareAssessmentActivity({
      plan: readyPlan(),
      resolution: codingResolution(),
      learnerId: "user-1",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.descriptor.activityRef).toBeUndefined();
  });
});

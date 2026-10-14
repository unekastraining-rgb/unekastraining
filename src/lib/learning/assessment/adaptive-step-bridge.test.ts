/**
 * Phase 2G-39 — AssessmentPlan ↔ Adaptive step bridge tests.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  bindAssessmentPlanToAdaptiveStep,
} from "@/lib/learning/assessment/adaptive-step-bridge";
import {
  runAssessmentWorkflow,
  type AssessmentPlan,
} from "@/lib/learning/assessment/workflow";
import { createExplicitLearningIntent } from "@/lib/learning/intent/project";
import type { AssessmentWorkflowHandoff } from "@/lib/learning/orchestrator/assessment-handoff";

const handoff: AssessmentWorkflowHandoff = { purpose: "ASSESS" };

function readyPlan(partial?: Partial<AssessmentPlan>): AssessmentPlan {
  return runAssessmentWorkflow({
    learnerId: "user-1",
    assessmentHandoff: handoff,
    decisionContext: {
      intent: createExplicitLearningIntent({ purpose: "ASSESS" }),
    },
    diagnosis: "NO_INTERVENTION",
    conceptId: "concept-1",
    ...partial,
  });
}

describe("Phase 2G-39 bindAssessmentPlanToAdaptiveStep", () => {
  it("1–5. ready plan + valid adaptive context → binding", () => {
    const plan = readyPlan();
    const result = bindAssessmentPlanToAdaptiveStep(plan, {
      runId: "run-abc",
      stepIndex: 2,
    });
    expect(result).toEqual({
      ok: true,
      binding: {
        runId: "run-abc",
        stepIndex: 2,
        conceptId: "concept-1",
        assessmentMode: "VERIFICATION",
      },
    });
  });

  it("6. missing run ID rejected", () => {
    expect(
      bindAssessmentPlanToAdaptiveStep(readyPlan(), {
        runId: "  ",
        stepIndex: 0,
      }),
    ).toEqual({ ok: false, reason: "missing_run_id" });
  });

  it("7. invalid / negative step index rejected", () => {
    expect(
      bindAssessmentPlanToAdaptiveStep(readyPlan(), {
        runId: "run-1",
        stepIndex: -1,
      }),
    ).toEqual({ ok: false, reason: "invalid_step_index" });
  });

  it("8. concept mismatch rejected when expectedConceptId provided", () => {
    expect(
      bindAssessmentPlanToAdaptiveStep(
        readyPlan(),
        { runId: "run-1", stepIndex: 0 },
        { expectedConceptId: "concept-other" },
      ),
    ).toEqual({ ok: false, reason: "concept_mismatch" });
  });

  it("9. non-ready plan cannot bind", () => {
    const blocked: AssessmentPlan = {
      status: "blocked",
      conceptId: "concept-1",
      blockReason: "assessment_handoff_required",
    };
    expect(
      bindAssessmentPlanToAdaptiveStep(blocked, {
        runId: "run-1",
        stepIndex: 0,
      }),
    ).toEqual({ ok: false, reason: "plan_not_ready" });
  });

  it("10. missing assessment mode cannot bind", () => {
    const plan: AssessmentPlan = {
      status: "ready",
      conceptId: "concept-1",
    };
    expect(
      bindAssessmentPlanToAdaptiveStep(plan, {
        runId: "run-1",
        stepIndex: 0,
      }),
    ).toEqual({ ok: false, reason: "assessment_mode_required" });
  });

  it("11–12. plan without adaptive remains valid; bridge skips when absent", () => {
    const plan = readyPlan();
    expect(plan.adaptive).toBeUndefined();
    expect(plan.status).toBe("ready");
    expect(bindAssessmentPlanToAdaptiveStep(plan)).toEqual({
      ok: false,
      reason: "adaptive_context_absent",
    });
  });

  it("plan.adaptive used when explicit context omitted", () => {
    const plan = runAssessmentWorkflow({
      learnerId: "user-1",
      assessmentHandoff: handoff,
      decisionContext: {
        intent: createExplicitLearningIntent({ purpose: "ASSESS" }),
      },
      diagnosis: "UNDERSTANDING_GAP",
      conceptId: "concept-java",
      adaptive: { runId: "run-from-plan", stepIndex: 1 },
    });
    expect(plan.adaptive).toEqual({
      runId: "run-from-plan",
      stepIndex: 1,
    });
    const result = bindAssessmentPlanToAdaptiveStep(plan);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.binding.runId).toBe("run-from-plan");
      expect(result.binding.stepIndex).toBe(1);
      expect(result.binding.assessmentMode).toBe("DIAGNOSTIC");
    }
  });

  it("13–20. bridge is pure — no run mutation / Quiz / evidence", () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        "src/lib/learning/assessment/adaptive-step-bridge.ts",
      ),
      "utf8",
    );
    expect(source).not.toMatch(
      /createAdaptiveSequenceRun|updateAdaptiveSequenceRun|recordAdaptiveSequenceCompletion/,
    );
    expect(source).not.toMatch(
      /recordEvidence|applyEvidenceToMastery|recordQuiz|db\.|prisma/i,
    );
    expect(source).not.toMatch(/quiz-adapter|createAssessmentAdapterRegistry/);
    expect(source).toContain("Does not create/mutate runs");
  });
});

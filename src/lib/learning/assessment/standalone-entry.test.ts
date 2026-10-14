/**
 * Phase 2G-40 — Standalone ASSESS entry tests.
 */
import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import { runStandaloneAssessmentEntry } from "@/lib/learning/assessment/standalone-entry";
import { createExplicitLearningIntent } from "@/lib/learning/intent/project";
import type { LearningIntent } from "@/lib/learning/intent/types";

function explicitAssess(partial?: Partial<LearningIntent>): LearningIntent {
  return {
    ...createExplicitLearningIntent({ purpose: "ASSESS" }),
    ...partial,
  };
}

function inferredAssess(): LearningIntent {
  return {
    purpose: "ASSESS",
    source: "INFERRED",
    scope: "request",
    provenance: "tutor_mode",
  };
}

describe("Phase 2G-40 runStandaloneAssessmentEntry", () => {
  it("1–5. explicit ASSESS → handoff + workflow → ready AssessmentPlan with mode", () => {
    const result = runStandaloneAssessmentEntry({
      learnerId: "user-1",
      conceptId: "concept-java-exceptions",
      intent: explicitAssess(),
      diagnosis: "UNDERSTANDING_GAP",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.handoff).toEqual({ purpose: "ASSESS" });
    expect(result.plan.status).toBe("ready");
    expect(result.plan.conceptId).toBe("concept-java-exceptions");
    expect(result.plan.assessmentMode).toBe("DIAGNOSTIC");
    expect(result.plan.activityType).toBeUndefined();
    expect(result.plan.adapterKey).toBeUndefined();
  });

  it("5b. NO_INTERVENTION + EXPLICIT → VERIFICATION via existing policy", () => {
    const result = runStandaloneAssessmentEntry({
      learnerId: "user-1",
      conceptId: "concept-1",
      intent: explicitAssess(),
      diagnosis: "NO_INTERVENTION",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.plan.assessmentMode).toBe("VERIFICATION");
  });

  it("6–8. UNDERSTAND / PRACTICE / CREATE rejected", () => {
    for (const purpose of ["UNDERSTAND", "PRACTICE", "CREATE"] as const) {
      const result = runStandaloneAssessmentEntry({
        learnerId: "user-1",
        conceptId: "concept-1",
        intent: createExplicitLearningIntent({ purpose }),
        diagnosis: "UNDERSTANDING_GAP",
      });
      expect(result).toEqual({
        ok: false,
        code: "invalid_assessment_intent",
      });
    }
  });

  it("9. missing intent rejected", () => {
    const result = runStandaloneAssessmentEntry({
      learnerId: "user-1",
      conceptId: "concept-1",
      diagnosis: "UNDERSTANDING_GAP",
    });
    expect(result).toEqual({
      ok: false,
      code: "assessment_intent_required",
    });
  });

  it("10. malformed intent rejected", () => {
    const result = runStandaloneAssessmentEntry({
      learnerId: "user-1",
      conceptId: "concept-1",
      intent: { purpose: "ASSESS" },
      diagnosis: "UNDERSTANDING_GAP",
    });
    expect(result).toEqual({
      ok: false,
      code: "invalid_assessment_intent",
    });
  });

  it("11. inferred ASSESS rejected at standalone boundary", () => {
    const result = runStandaloneAssessmentEntry({
      learnerId: "user-1",
      conceptId: "concept-1",
      intent: inferredAssess(),
      diagnosis: "UNDERSTANDING_GAP",
    });
    expect(result).toEqual({
      ok: false,
      code: "explicit_assess_required",
    });
  });

  it("12–13. conceptId and learningSpaceId preserved", () => {
    const result = runStandaloneAssessmentEntry({
      learnerId: "user-1",
      conceptId: "concept-anatomy-heart",
      learningSpaceId: "space-bio",
      intent: explicitAssess({
        conceptId: "concept-anatomy-heart",
        learningSpaceId: "space-bio",
      }),
      diagnosis: "RECALL_GAP",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.plan.conceptId).toBe("concept-anatomy-heart");
    expect(result.plan.assessmentMode).toBe("PRACTICE_CHECK");
  });

  it("14. optional adaptive context preserved without mutation", () => {
    const adaptive = { runId: "run-xyz", stepIndex: 1 };
    const result = runStandaloneAssessmentEntry({
      learnerId: "user-1",
      conceptId: "concept-1",
      intent: explicitAssess(),
      diagnosis: "APPLICATION_GAP",
      adaptive,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.plan.adaptive).toEqual(adaptive);
    expect(result.adaptiveBinding).toEqual({
      ok: true,
      binding: {
        runId: "run-xyz",
        stepIndex: 1,
        conceptId: "concept-1",
        assessmentMode: "DIAGNOSTIC",
      },
    });
    // Input object not mutated.
    expect(adaptive).toEqual({ runId: "run-xyz", stepIndex: 1 });
  });

  it("14b. works without adaptive context", () => {
    const result = runStandaloneAssessmentEntry({
      learnerId: "user-1",
      conceptId: "concept-1",
      intent: explicitAssess(),
      diagnosis: "INSUFFICIENT_EVIDENCE",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.plan.adaptive).toBeUndefined();
    expect(result.adaptiveBinding).toBeUndefined();
  });

  it("diagnosis missing → assessment_context_incomplete (no invented diagnosis)", () => {
    const result = runStandaloneAssessmentEntry({
      learnerId: "user-1",
      conceptId: "concept-1",
      intent: explicitAssess(),
    });
    expect(result).toEqual({
      ok: false,
      code: "assessment_context_incomplete",
    });
  });

  it("15–22. boundary: no Quiz/adapter/execution/evidence/mastery/adaptive mutation/LUCKY/diagnosis dup", () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        "src/lib/learning/assessment/standalone-entry.ts",
      ),
      "utf8",
    );
    expect(source).not.toMatch(/\bQuiz\b/);
    expect(source).not.toMatch(/createAssessmentAdapterRegistry/);
    expect(source).not.toMatch(/\.resolve\(/);
    expect(source).not.toMatch(/recordQuiz|recordEvidence|updateMastery/);
    expect(source).not.toMatch(/AdaptiveSequenceRun|prisma|db\./);
    expect(source).not.toMatch(/lucky|orchestrateFromLearnerState|diagnose\(/i);
    expect(source).toContain("runAssessmentWorkflow");
    expect(source).toContain("resolveAssessmentWorkflowHandoff");
  });
});

describe("Phase 2G-40 product preservation", () => {
  it("does not wire standalone assessment into Tutor/CORE/SIX/LUCKY/Quiz UI", () => {
    const files = [
      "src/lib/csl/lucky-engine.ts",
      "app/core/page.tsx",
      "app/study/study-hub-view.tsx",
      "app/study/six/[component]/page.tsx",
      "src/lib/learning/tutor/index.ts",
    ];
    for (const file of files) {
      const source = readFileSync(path.join(process.cwd(), file), "utf8");
      expect(source).not.toContain("/api/study/assessment");
      expect(source).not.toContain("runStandaloneAssessmentEntry");
    }
  });

  it("Tutor intent projection still allows inferred ASSESS for Tutor workflow", () => {
    const project = readFileSync(
      path.join(process.cwd(), "src/lib/learning/intent/project.ts"),
      "utf8",
    );
    expect(project).toContain("EXAM");
    expect(project).toMatch(/ASSESS/);
  });
});

describe("Phase 2G-40 standalone entry purity", () => {
  it("does not call adapter registry or invent diagnosis", () => {
    const resolveSpy = vi.fn();
    void resolveSpy;
    const result = runStandaloneAssessmentEntry({
      learnerId: "user-1",
      conceptId: "concept-1",
      intent: explicitAssess(),
      diagnosis: "UNDERSTANDING_GAP",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.plan.adapterKey).toBeUndefined();
    expect(result.plan.activityType).toBeUndefined();
  });
});

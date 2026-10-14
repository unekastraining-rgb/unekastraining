/**
 * Phase 2G-41 — Design-assumption inspection tests (no production bridge).
 *
 * Freezes architectural invariants documented in ACTIVITY_BRIDGE_DESIGN.md:
 * Assessment Workflow does not execute activities; registry has no Quiz;
 * plan leaves adapterKey/activityType unset; ASSESS ≠ QUIZ.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import { createAssessmentAdapterRegistry } from "@/lib/learning/assessment/adapter-registry";
import { runAssessmentWorkflow } from "@/lib/learning/assessment/workflow";
import { runStandaloneAssessmentEntry } from "@/lib/learning/assessment/standalone-entry";
import { createExplicitLearningIntent } from "@/lib/learning/intent/project";

function read(rel: string): string {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

describe("Phase 2G-41 AssessmentPlan → Activity Bridge design assumptions", () => {
  it("ready AssessmentPlan leaves activityType and adapterKey unset (selection is bridge)", () => {
    const plan = runAssessmentWorkflow({
      learnerId: "user-1",
      assessmentHandoff: { purpose: "ASSESS" },
      decisionContext: {
        intent: createExplicitLearningIntent({ purpose: "ASSESS" }),
      },
      diagnosis: "UNDERSTANDING_GAP",
      conceptId: "concept-1",
    });
    expect(plan.status).toBe("ready");
    expect(plan.assessmentMode).toBe("DIAGNOSTIC");
    expect(plan.activityType).toBeUndefined();
    expect(plan.adapterKey).toBeUndefined();
  });

  it("fresh AssessmentAdapterRegistry has no adapters (Quiz not registered)", () => {
    const registry = createAssessmentAdapterRegistry();
    expect(registry.list()).toEqual([]);
    expect(registry.has("quiz")).toBe(false);
  });

  it("standalone entry returns plan without resolving registry or Quiz", () => {
    const result = runStandaloneAssessmentEntry({
      learnerId: "user-1",
      conceptId: "concept-1",
      intent: createExplicitLearningIntent({ purpose: "ASSESS" }),
      diagnosis: "NO_INTERVENTION",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.plan.adapterKey).toBeUndefined();
    expect(result.plan.activityType).toBeUndefined();

    const entry = read("src/lib/learning/assessment/standalone-entry.ts");
    expect(entry).not.toMatch(/createAssessmentAdapterRegistry/);
    expect(entry).not.toMatch(/recordQuizAttemptEvidence/);
    expect(entry).not.toMatch(/quiz-adapter/);
  });

  it("workflow source does not own activity execution or registry resolve", () => {
    const workflow = read("src/lib/learning/assessment/workflow.ts");
    expect(workflow).toContain("runAssessmentWorkflow");
    expect(workflow).not.toMatch(/createAssessmentAdapterRegistry/);
    expect(workflow).not.toMatch(/recordQuiz|recordEvidence|applyEvidenceToMastery/);
    expect(workflow).not.toMatch(/quizAdaptiveHref|startOrResumeAdaptive/);
  });

  it("AssessmentAdapter contract is resolve-identity only (no mastery/evidence)", () => {
    const registry = read("src/lib/learning/assessment/adapter-registry.ts");
    expect(registry).toContain("canHandle");
    expect(registry).toContain("AssessmentActivityResolution");
    expect(registry).not.toMatch(/applyEvidenceToMastery|recordEvidence/);
    expect(registry).not.toMatch(/QuizTaker|generateQuiz/);
  });

  it("design artifact documents Option C and ASSESS ≠ QUIZ", () => {
    const design = read(
      "src/lib/learning/assessment/ACTIVITY_BRIDGE_DESIGN.md",
    );
    expect(design).toContain("Recommended option: C");
    expect(design).toContain("Universal Assessment Activity Bridge");
    expect(design).toContain("ASSESS ≠ QUIZ");
    expect(design).toContain("Assessment Workflow does not own activity execution");
    expect(design).toContain("Assessment Adapter does not own mastery");
    expect(design).toContain("Standalone");
    expect(design).toContain("Adaptive");
  });

  it("quiz evidence bridge remains separate from assessment planning", () => {
    const quizBridge = read("src/lib/learning/assessment/quiz-bridge.ts");
    expect(quizBridge).toContain("recordQuizAttemptEvidence");
    expect(quizBridge).not.toContain("runAssessmentWorkflow");
    expect(quizBridge).not.toContain("AssessmentAdapterRegistry");
  });
});

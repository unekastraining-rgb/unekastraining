/**
 * Phase 2G-37 — Assessment mode policy tests.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  createExplicitLearningIntent,
  projectTutorModeToLearningIntent,
} from "@/lib/learning/intent/project";
import { resolveAssessmentMode } from "@/lib/learning/assessment/assessment-mode-policy";
import {
  runAssessmentWorkflow,
  type AssessmentWorkflowRequest,
} from "@/lib/learning/assessment/workflow";
import type { AssessmentWorkflowHandoff } from "@/lib/learning/orchestrator/assessment-handoff";
import type { OrchestratorDiagnosis } from "@/lib/learning/orchestrator/diagnose";

const assessHandoff: AssessmentWorkflowHandoff = { purpose: "ASSESS" };

function request(
  partial: Partial<AssessmentWorkflowRequest> & {
    diagnosis: OrchestratorDiagnosis;
  },
): AssessmentWorkflowRequest {
  return {
    learnerId: "user-1",
    assessmentHandoff: assessHandoff,
    conceptId: "concept-1",
    decisionContext: {
      intent: createExplicitLearningIntent({ purpose: "ASSESS" }),
    },
    ...partial,
  };
}

describe("Phase 2G-37 resolveAssessmentMode", () => {
  it("4. UNDERSTANDING_GAP → DIAGNOSTIC", () => {
    expect(
      resolveAssessmentMode({
        diagnosis: "UNDERSTANDING_GAP",
        intentSource: "EXPLICIT",
      }),
    ).toBe("DIAGNOSTIC");
  });

  it("5. APPLICATION_GAP → DIAGNOSTIC", () => {
    expect(
      resolveAssessmentMode({
        diagnosis: "APPLICATION_GAP",
        intentSource: "EXPLICIT",
      }),
    ).toBe("DIAGNOSTIC");
  });

  it("6–7. RECALL / RETENTION → PRACTICE_CHECK", () => {
    expect(
      resolveAssessmentMode({
        diagnosis: "RECALL_GAP",
        intentSource: "EXPLICIT",
      }),
    ).toBe("PRACTICE_CHECK");
    expect(
      resolveAssessmentMode({
        diagnosis: "RETENTION_GAP",
        intentSource: "INFERRED",
      }),
    ).toBe("PRACTICE_CHECK");
  });

  it("8. INSUFFICIENT_EVIDENCE never VERIFICATION", () => {
    expect(
      resolveAssessmentMode({
        diagnosis: "INSUFFICIENT_EVIDENCE",
        intentSource: "EXPLICIT",
      }),
    ).toBe("DIAGNOSTIC");
    expect(
      resolveAssessmentMode({
        diagnosis: "INSUFFICIENT_EVIDENCE",
        intentSource: "INFERRED",
      }),
    ).toBe("DIAGNOSTIC");
  });

  it("9. NO_INTERVENTION + EXPLICIT → VERIFICATION", () => {
    expect(
      resolveAssessmentMode({
        diagnosis: "NO_INTERVENTION",
        intentSource: "EXPLICIT",
      }),
    ).toBe("VERIFICATION");
  });

  it("10. NO_INTERVENTION + INFERRED → conservative PRACTICE_CHECK", () => {
    expect(
      resolveAssessmentMode({
        diagnosis: "NO_INTERVENTION",
        intentSource: "INFERRED",
      }),
    ).toBe("PRACTICE_CHECK");
    expect(
      resolveAssessmentMode({
        diagnosis: "NO_INTERVENTION",
        intentSource: null,
      }),
    ).toBe("PRACTICE_CHECK");
  });

  it("16. deterministic for identical inputs", () => {
    const input = {
      diagnosis: "APPLICATION_GAP" as const,
      intentSource: "EXPLICIT" as const,
    };
    expect(resolveAssessmentMode(input)).toBe(resolveAssessmentMode(input));
  });
});

describe("Phase 2G-37 runAssessmentWorkflow + mode policy", () => {
  it("1. valid explicit ASSESS → ready with mode", () => {
    const plan = runAssessmentWorkflow(
      request({ diagnosis: "UNDERSTANDING_GAP" }),
    );
    expect(plan.status).toBe("ready");
    expect(plan.assessmentMode).toBe("DIAGNOSTIC");
    expect(plan.conceptId).toBe("concept-1");
  });

  it("2. valid inferred ASSESS accepted (Tutor EXAM projection)", () => {
    const inferred = projectTutorModeToLearningIntent("EXAM");
    expect(inferred?.source).toBe("INFERRED");
    const plan = runAssessmentWorkflow(
      request({
        diagnosis: "NO_INTERVENTION",
        decisionContext: { intent: inferred },
      }),
    );
    expect(plan.status).toBe("ready");
    expect(plan.assessmentMode).toBe("PRACTICE_CHECK");
  });

  it("3. non-ASSESS handoff blocked", () => {
    const plan = runAssessmentWorkflow(
      request({
        diagnosis: "NO_INTERVENTION",
        assessmentHandoff: undefined,
      }),
    );
    expect(plan.status).toBe("blocked");
  });

  it("9b. explicit ASSESS + NO_INTERVENTION → VERIFICATION ready", () => {
    const plan = runAssessmentWorkflow(
      request({ diagnosis: "NO_INTERVENTION" }),
    );
    expect(plan.status).toBe("ready");
    expect(plan.assessmentMode).toBe("VERIFICATION");
  });

  it("8b. INSUFFICIENT_EVIDENCE + explicit ASSESS → DIAGNOSTIC not VERIFICATION", () => {
    const plan = runAssessmentWorkflow(
      request({ diagnosis: "INSUFFICIENT_EVIDENCE" }),
    );
    expect(plan.assessmentMode).toBe("DIAGNOSTIC");
    expect(plan.assessmentMode).not.toBe("VERIFICATION");
  });

  it("11–15. no diagnosis mutation, Quiz, adapter, evidence, or mastery", () => {
    const policy = readFileSync(
      path.join(
        process.cwd(),
        "src/lib/learning/assessment/assessment-mode-policy.ts",
      ),
      "utf8",
    );
    const workflow = readFileSync(
      path.join(process.cwd(), "src/lib/learning/assessment/workflow.ts"),
      "utf8",
    );
    expect(policy).not.toMatch(/orchestrateFromLearnerState|diagnose\(/);
    expect(policy + workflow).not.toMatch(
      /recordQuiz|recordEvidence|applyEvidenceToMastery/,
    );
    expect(policy).not.toMatch(/adapterKey\s*=/);
    const plan = runAssessmentWorkflow(
      request({ diagnosis: "UNDERSTANDING_GAP" }),
    );
    expect(plan.activityType).toBeUndefined();
    expect(plan.adapterKey).toBeUndefined();
    expect(JSON.stringify(plan)).not.toMatch(/quiz/i);
  });

  it("17. subject-agnostic concept ids", () => {
    for (const conceptId of [
      "concept-java",
      "concept-calculus",
      "concept-anatomy",
    ]) {
      const plan = runAssessmentWorkflow(
        request({ diagnosis: "RECALL_GAP", conceptId }),
      );
      expect(plan.assessmentMode).toBe("PRACTICE_CHECK");
      expect(plan.conceptId).toBe(conceptId);
    }
  });
});

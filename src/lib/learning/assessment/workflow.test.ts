/**
 * Phase 2G-36 — Assessment Workflow stub tests.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import { createExplicitLearningIntent } from "@/lib/learning/intent/project";
import type { AssessmentWorkflowHandoff } from "@/lib/learning/orchestrator/assessment-handoff";
import {
  runAssessmentWorkflow,
  type AssessmentWorkflowRequest,
} from "@/lib/learning/assessment/workflow";

const assessHandoff: AssessmentWorkflowHandoff = { purpose: "ASSESS" };

function baseRequest(
  partial?: Partial<AssessmentWorkflowRequest>,
): AssessmentWorkflowRequest {
  return {
    learnerId: "user-1",
    assessmentHandoff: assessHandoff,
    decisionContext: {
      intent: createExplicitLearningIntent({ purpose: "ASSESS" }),
    },
    diagnosis: "UNDERSTANDING_GAP",
    conceptId: "concept-java-exceptions",
    ...partial,
  };
}

describe("Phase 2G-36 runAssessmentWorkflow", () => {
  it("1–3. valid ASSESS handoff → ready plan with conceptId (2G-37 mode)", () => {
    const plan = runAssessmentWorkflow(baseRequest());
    expect(plan.status).toBe("ready");
    expect(plan.conceptId).toBe("concept-java-exceptions");
    expect(plan.assessmentMode).toBe("DIAGNOSTIC");
    expect(plan.activityType).toBeUndefined();
    expect(plan.adapterKey).toBeUndefined();
    expect(plan.targetFacets).toBeUndefined();
    expect(plan.blockReason).toBeUndefined();
  });

  it("4. assessmentMode is derived by policy when not overridden", () => {
    const plan = runAssessmentWorkflow(baseRequest());
    expect(plan.assessmentMode).toBe("DIAGNOSTIC");
  });

  it("4b. assessmentMode passes through when caller supplies it", () => {
    const plan = runAssessmentWorkflow(
      baseRequest({ assessmentMode: "PRACTICE_CHECK" }),
    );
    expect(plan.assessmentMode).toBe("PRACTICE_CHECK");
    expect(plan.status).toBe("ready");
  });

  it("5. non-ASSESS handoff cannot enter as assessment", () => {
    const plan = runAssessmentWorkflow(
      baseRequest({
        assessmentHandoff: { purpose: "ASSESS" as const },
        decisionContext: {
          intent: createExplicitLearningIntent({ purpose: "PRACTICE" }),
        },
      }),
    );
    // Handoff is still ASSESS — valid entry (intent on context is separate).
    expect(plan.status).toBe("ready");

    const blocked = runAssessmentWorkflow(
      baseRequest({
        assessmentHandoff: undefined,
        decisionContext: {
          intent: createExplicitLearningIntent({ purpose: "PRACTICE" }),
        },
      }),
    );
    expect(blocked.status).toBe("blocked");
    expect(blocked.blockReason).toBe("assessment_handoff_required");
  });

  it("5b. forged non-ASSESS purpose on handoff is blocked", () => {
    const plan = runAssessmentWorkflow(
      baseRequest({
        assessmentHandoff: { purpose: "PRACTICE" } as unknown as AssessmentWorkflowHandoff,
      }),
    );
    expect(plan.status).toBe("blocked");
    expect(plan.blockReason).toBe("assessment_handoff_required");
  });

  it("6. missing / malformed handoff is blocked safely", () => {
    expect(
      runAssessmentWorkflow(baseRequest({ assessmentHandoff: null })).status,
    ).toBe("blocked");
    expect(
      runAssessmentWorkflow(baseRequest({ assessmentHandoff: undefined }))
        .blockReason,
    ).toBe("assessment_handoff_required");
    expect(
      runAssessmentWorkflow(
        baseRequest({
          assessmentHandoff: { purpose: "QUIZ" } as unknown as AssessmentWorkflowHandoff,
        }),
      ).status,
    ).toBe("blocked");
  });

  it("6b. missing learner or concept blocks", () => {
    expect(
      runAssessmentWorkflow(baseRequest({ learnerId: "  " })).blockReason,
    ).toBe("learner_id_required");
    expect(
      runAssessmentWorkflow(baseRequest({ conceptId: "" })).blockReason,
    ).toBe("concept_id_required");
  });

  it("7–9. workflow source does not execute Quiz / evidence / mastery", () => {
    const source = readFileSync(
      path.join(process.cwd(), "src/lib/learning/assessment/workflow.ts"),
      "utf8",
    );
    expect(source).not.toMatch(/recordQuiz|recordEvidence|applyEvidenceToMastery/);
    expect(source).not.toMatch(/prisma|db\./i);
    expect(source).toContain("Does not select activities");
    const plan = runAssessmentWorkflow(baseRequest());
    expect(plan.adapterKey).toBeUndefined();
    expect(JSON.stringify(plan)).not.toMatch(/quiz/i);
  });

  it("10. diagnosis is consumed as context only (unchanged on plan)", () => {
    const diagnoses = [
      "UNDERSTANDING_GAP",
      "APPLICATION_GAP",
      "INSUFFICIENT_EVIDENCE",
      "NO_INTERVENTION",
    ] as const;
    for (const diagnosis of diagnoses) {
      const plan = runAssessmentWorkflow(baseRequest({ diagnosis }));
      expect(plan.status).toBe("ready");
      expect(plan.assessmentMode).toBeDefined();
      expect(plan).not.toHaveProperty("diagnosis");
    }
  });

  it("11. subject-agnostic — any conceptId works", () => {
    for (const conceptId of [
      "concept-java",
      "concept-calculus",
      "concept-wwii",
      "concept-anatomy",
      "concept-spanish",
    ]) {
      expect(runAssessmentWorkflow(baseRequest({ conceptId })).conceptId).toBe(
        conceptId,
      );
    }
  });

  it("12. adaptive context is accepted and not returned as mutated state", () => {
    const adaptive = { runId: "run-1", stepIndex: 2 };
    const frozen = { ...adaptive };
    const plan = runAssessmentWorkflow(baseRequest({ adaptive }));
    expect(plan.status).toBe("ready");
    expect(plan.adaptive).toEqual(frozen);
    expect(adaptive).toEqual(frozen);
  });
});

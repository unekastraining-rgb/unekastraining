/**
 * Phase 2G-34 — Assessment Workflow handoff seam (metadata only).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import { createExplicitLearningIntent } from "@/lib/learning/intent/project";
import { projectTutorModeToLearningIntent } from "@/lib/learning/intent/project";
import { emptyFacetScores } from "@/lib/learning/mastery/facets";
import { orchestrateFromLearnerState } from "@/lib/learning/orchestrator/diagnose";
import { presentOrchestratorSuggestion } from "@/lib/learning/orchestrator/present";
import { resolveAssessmentWorkflowHandoff } from "@/lib/learning/orchestrator/assessment-handoff";
import type { LearnerConceptMasterySummary } from "@/lib/learning/types";
import type { OrchestratorResult } from "@/lib/learning/orchestrator/diagnose";

function summary(
  partial: Omit<Partial<LearnerConceptMasterySummary>, "facets"> & {
    facets?: Partial<LearnerConceptMasterySummary["facets"]>;
  },
): LearnerConceptMasterySummary {
  return {
    learnerId: "user-1",
    conceptId: "concept-1",
    conceptTitle: "Java Exceptions",
    facets: { ...emptyFacetScores(), ...partial.facets },
    topicMastery: partial.topicMastery ?? null,
    recentMissedCount: partial.recentMissedCount ?? 0,
    evidenceSourceCounts: partial.evidenceSourceCounts ?? {
      quiz: 2,
      flashcard: 1,
      study_evaluate: 1,
      other: 0,
    },
    reviewCount: partial.reviewCount ?? 4,
    lastReviewedAt: null,
    nextReviewAt: null,
  };
}

const route = {
  courseId: "course-1",
  topicId: "topic-1",
  topicName: "Java Exceptions",
};

const understandingWeak = summary({
  facets: { recognize: 0.2, explain: 0.2, apply: 0.1, retain: 0.1 },
});

function decisionWithoutHandoff(result: OrchestratorResult) {
  const {
    decisionContext: _c,
    assessmentHandoff: _h,
    ...rest
  } = result;
  void _c;
  void _h;
  return rest;
}

describe("Phase 2G-34 AssessmentWorkflowHandoff", () => {
  it("ASSESS present — result and presentation expose handoff", () => {
    const result = orchestrateFromLearnerState(understandingWeak, {
      ...route,
      intent: createExplicitLearningIntent({ purpose: "ASSESS" }),
    });
    expect(result.assessmentHandoff).toEqual({ purpose: "ASSESS" });
    expect(result.decisionContext?.intent?.purpose).toBe("ASSESS");

    const view = presentOrchestratorSuggestion(result);
    expect(view!.assessmentHandoff).toEqual({ purpose: "ASSESS" });
  });

  it("ASSESS absent — no handoff", () => {
    const result = orchestrateFromLearnerState(understandingWeak, route);
    expect(result.assessmentHandoff).toBeUndefined();
    expect(presentOrchestratorSuggestion(result)!.assessmentHandoff).toBeUndefined();
  });

  it("UNDERSTAND / PRACTICE / CREATE do not create handoff", () => {
    for (const purpose of ["UNDERSTAND", "PRACTICE", "CREATE"] as const) {
      const result = orchestrateFromLearnerState(understandingWeak, {
        ...route,
        intent: createExplicitLearningIntent({ purpose }),
      });
      expect(result.assessmentHandoff).toBeUndefined();
      expect(resolveAssessmentWorkflowHandoff(result.decisionContext)).toBeUndefined();
    }
  });

  it("explicit and inferred ASSESS both create handoff; source preserved", () => {
    const explicit = createExplicitLearningIntent({ purpose: "ASSESS" });
    const inferred = projectTutorModeToLearningIntent("EXAM");
    expect(inferred?.source).toBe("INFERRED");

    const explicitResult = orchestrateFromLearnerState(understandingWeak, {
      ...route,
      intent: explicit,
    });
    const inferredResult = orchestrateFromLearnerState(understandingWeak, {
      ...route,
      intent: inferred,
    });

    expect(explicitResult.assessmentHandoff).toEqual({ purpose: "ASSESS" });
    expect(inferredResult.assessmentHandoff).toEqual({ purpose: "ASSESS" });
    expect(explicitResult.decisionContext?.intent?.source).toBe("EXPLICIT");
    expect(inferredResult.decisionContext?.intent?.source).toBe("INFERRED");
    expect(inferredResult.decisionContext?.intent?.provenance).toBe("tutor_mode");
  });

  it("diagnosis and SIX intervention unchanged vs no-intent baseline", () => {
    const baseline = orchestrateFromLearnerState(understandingWeak, route);
    const withAssess = orchestrateFromLearnerState(understandingWeak, {
      ...route,
      intent: createExplicitLearningIntent({ purpose: "ASSESS" }),
    });
    expect(withAssess.diagnosis).toBe(baseline.diagnosis);
    expect(decisionWithoutHandoff(withAssess)).toEqual(
      decisionWithoutHandoff(baseline),
    );
    expect(withAssess.intervention?.kind).toBe("six");
    expect(withAssess.intervention?.sixComponent).toBe(
      baseline.intervention?.sixComponent,
    );
  });

  it("ASSESS handoff does not select or launch Quiz", () => {
    const result = orchestrateFromLearnerState(understandingWeak, {
      ...route,
      intent: createExplicitLearningIntent({ purpose: "ASSESS" }),
    });
    expect(result.intervention?.kind).toBe("six");
    expect(result.intervention?.href).toContain("/study/six/");
    expect(result.intervention?.href).not.toMatch(/\/quizzes\//);
    expect(JSON.stringify(result.assessmentHandoff)).not.toMatch(/quiz/i);

    const handoffSource = readFileSync(
      path.join(
        process.cwd(),
        "src/lib/learning/orchestrator/assessment-handoff.ts",
      ),
      "utf8",
    );
    expect(handoffSource).not.toMatch(/recordQuiz|LearningAttempt|EvidenceEnvelope/);
    expect(handoffSource).toContain("Does not select adapters");
  });

  it("malformed intent does not create ASSESS handoff", () => {
    const result = orchestrateFromLearnerState(understandingWeak, {
      ...route,
      intent: { purpose: "QUIZ_ME" },
    });
    expect(result.decisionContext).toEqual({ intent: null });
    expect(result.assessmentHandoff).toBeUndefined();
  });

  it("present options ASSESS attach handoff without changing CTA/href", () => {
    const baseline = orchestrateFromLearnerState(understandingWeak, route);
    const baselineView = presentOrchestratorSuggestion(baseline);
    const assessView = presentOrchestratorSuggestion(baseline, {
      intent: createExplicitLearningIntent({ purpose: "ASSESS" }),
    });
    expect(assessView!.assessmentHandoff).toEqual({ purpose: "ASSESS" });
    expect(assessView!.href).toBe(baselineView!.href);
    expect(assessView!.actionLabel).toBe(baselineView!.actionLabel);
    expect(assessView!.notice).toBe(baselineView!.notice);
  });
});

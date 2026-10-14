/**
 * Phase 2G-30 — LearningDecisionContext at Orchestrator orchestration boundary.
 * Context is received and attached; diagnosis stays identical.
 * Phase 2G-32: UNDERSTAND/PRACTICE may soft-prefer within legal SIX candidates.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import { createExplicitLearningIntent } from "@/lib/learning/intent/project";
import { emptyFacetScores } from "@/lib/learning/mastery/facets";
import { orchestrateFromLearnerState } from "@/lib/learning/orchestrator/diagnose";
import { presentOrchestratorSuggestion } from "@/lib/learning/orchestrator/present";
import type { LearnerConceptMasterySummary } from "@/lib/learning/types";
import type { OrchestratorResult } from "@/lib/learning/orchestrator/diagnose";
import type { OrchestratorSuggestionView } from "@/lib/learning/orchestrator/present";

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

const PURPOSES = ["UNDERSTAND", "PRACTICE", "ASSESS", "CREATE"] as const;

const route = {
  courseId: "course-1",
  topicId: "topic-1",
  topicName: "Java Exceptions",
};

function decisionSlice(result: OrchestratorResult) {
  const {
    decisionContext: _ctx,
    assessmentHandoff: _handoff,
    activityIntervention: _activity,
    ...rest
  } = result;
  void _ctx;
  void _handoff;
  void _activity;
  return rest;
}

function learnerFacingSlice(view: OrchestratorSuggestionView | null) {
  if (!view) return null;
  const {
    learningIntent: _intent,
    decisionContext: _ctx,
    assessmentHandoff: _handoff,
    activityIntervention: _activity,
    ...rest
  } = view;
  void _intent;
  void _ctx;
  void _handoff;
  void _activity;
  return rest;
}

describe("Phase 2G-30 orchestrateFromLearnerState decision context boundary", () => {
  const understandingWeak = summary({
    facets: { recognize: 0.2, explain: 0.2, apply: 0.1, retain: 0.1 },
  });

  it("baseline — no context leaves result without decisionContext", () => {
    const result = orchestrateFromLearnerState(understandingWeak, route);
    expect(result.decisionContext).toBeUndefined();
    expect(result.diagnosis).toBe("UNDERSTANDING_GAP");
    expect(result.intervention?.kind).toBe("six");
  });

  it("UNDERSTAND / PRACTICE may soft-prefer; ASSESS / CREATE keep intervention", () => {
    const baseline = orchestrateFromLearnerState(understandingWeak, route);
    for (const purpose of PURPOSES) {
      const withIntent = orchestrateFromLearnerState(understandingWeak, {
        ...route,
        intent: createExplicitLearningIntent({ purpose }),
      });
      expect(withIntent.diagnosis).toBe(baseline.diagnosis);
      expect(withIntent.decisionContext?.intent?.purpose).toBe(purpose);
      if (purpose === "ASSESS" || purpose === "CREATE") {
        expect(decisionSlice(withIntent)).toEqual(decisionSlice(baseline));
      }
    }
  });

  it("ASSESS does not become Quiz", () => {
    const result = orchestrateFromLearnerState(understandingWeak, {
      ...route,
      intent: createExplicitLearningIntent({ purpose: "ASSESS" }),
    });
    expect(result.intervention?.kind).toBe("six");
    expect(result.intervention?.sixComponent).not.toBe("quiz");
    expect(result.intervention?.href).not.toMatch(/\/quizzes\//);
  });

  it("explicit null intent is preserved on decisionContext", () => {
    const baseline = orchestrateFromLearnerState(understandingWeak, route);
    const withNull = orchestrateFromLearnerState(understandingWeak, {
      ...route,
      intent: null,
    });
    expect(decisionSlice(withNull)).toEqual(decisionSlice(baseline));
    expect(withNull.decisionContext).toEqual({ intent: null });
  });

  it("malformed intent normalizes to null without throwing", () => {
    const baseline = orchestrateFromLearnerState(understandingWeak, route);
    const malformed = orchestrateFromLearnerState(understandingWeak, {
      ...route,
      intent: { purpose: "QUIZ_ME" },
    });
    expect(decisionSlice(malformed)).toEqual(decisionSlice(baseline));
    expect(malformed.decisionContext).toEqual({ intent: null });
  });

  it("nested decisionContext carries opaque concept / learning-space ids", () => {
    const result = orchestrateFromLearnerState(understandingWeak, {
      ...route,
      decisionContext: {
        intent: createExplicitLearningIntent({ purpose: "PRACTICE" }),
        conceptId: "concept-opaque-42",
        learningSpaceId: "space-opaque-7",
      },
    });
    expect(result.decisionContext?.conceptId).toBe("concept-opaque-42");
    expect(result.decisionContext?.learningSpaceId).toBe("space-opaque-7");
    expect(result.decisionContext?.intent?.purpose).toBe("PRACTICE");
    // Diagnosed concept id remains the learner-state concept, not context metadata.
    expect(result.conceptId).toBe("concept-1");
  });

  it("top-level intent wins over nested decisionContext.intent", () => {
    const result = orchestrateFromLearnerState(understandingWeak, {
      ...route,
      decisionContext: {
        intent: createExplicitLearningIntent({ purpose: "UNDERSTAND" }),
      },
      intent: createExplicitLearningIntent({ purpose: "CREATE" }),
    });
    expect(result.decisionContext?.intent?.purpose).toBe("CREATE");
  });

  it("presentation parity when context arrives via orchestration result", () => {
    const baseline = orchestrateFromLearnerState(understandingWeak, route);
    const withCtx = orchestrateFromLearnerState(understandingWeak, {
      ...route,
      intent: createExplicitLearningIntent({ purpose: "ASSESS" }),
    });
    const baselineView = presentOrchestratorSuggestion(baseline);
    const withCtxView = presentOrchestratorSuggestion(withCtx);
    expect(learnerFacingSlice(withCtxView)).toEqual(
      learnerFacingSlice(baselineView),
    );
    expect(withCtxView!.decisionContext?.intent?.purpose).toBe("ASSESS");
    expect(withCtxView!.learningIntent?.purpose).toBe("ASSESS");
    expect(baselineView!.decisionContext).toBeUndefined();
  });

  it("diagnosis rules remain intent-blind; ASSESS is not a policy branch", () => {
    const source = readFileSync(
      path.join(process.cwd(), "src/lib/learning/orchestrator/diagnose.ts"),
      "utf8",
    );
    // No diagnosis/intervention branch on ASSESS or CREATE purpose.
    expect(source).not.toMatch(/if\s*\([^)]*purpose\s*===\s*["']ASSESS["']/);
    expect(source).not.toMatch(/if\s*\([^)]*purpose\s*===\s*["']CREATE["']/);
    expect(source).toContain("preferSixWithIntent");
    expect(source).toContain("withAssessmentWorkflowHandoff");
    expect(source).toContain("Diagnosis rules remain intent-blind");
  });
});

/**
 * Phase 2G-28 — Contextual LearningIntent on Orchestrator present/suggest.
 * Intent is metadata only: diagnosis and intervention must stay identical.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import { createExplicitLearningIntent } from "@/lib/learning/intent/project";
import { emptyFacetScores } from "@/lib/learning/mastery/facets";
import { orchestrateFromLearnerState } from "@/lib/learning/orchestrator/diagnose";
import {
  presentOrchestratorSuggestion,
  resolvePresentLearningIntent,
} from "@/lib/learning/orchestrator/present";
import type { LearningIntent } from "@/lib/learning/intent/types";
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

function diagnoseAndPresent(
  state: LearnerConceptMasterySummary,
  intent?: LearningIntent | null,
) {
  const result = orchestrateFromLearnerState(state, {
    courseId: "course-1",
    topicId: "topic-1",
    topicName: state.conceptTitle,
  });
  const view =
    intent === undefined
      ? presentOrchestratorSuggestion(result)
      : presentOrchestratorSuggestion(result, { intent });
  return { result, view };
}

function expectDecisionParity(
  baseline: { result: OrchestratorResult; view: OrchestratorSuggestionView | null },
  other: { result: OrchestratorResult; view: OrchestratorSuggestionView | null },
) {
  expect(other.result.diagnosis).toBe(baseline.result.diagnosis);
  expect(other.result.intervention?.sixComponent).toBe(
    baseline.result.intervention?.sixComponent ?? undefined,
  );
  expect(other.result.intervention?.kind).toBe(
    baseline.result.intervention?.kind ?? undefined,
  );
  expect(learnerFacingSlice(other.view)).toEqual(
    learnerFacingSlice(baseline.view),
  );
}

describe("Phase 2G-28 resolvePresentLearningIntent", () => {
  it("distinguishes absent / null / valid / invalid", () => {
    expect(resolvePresentLearningIntent(undefined)).toBeUndefined();
    expect(resolvePresentLearningIntent({})).toBeUndefined();
    expect(resolvePresentLearningIntent({ intent: null })).toBeNull();
    expect(
      resolvePresentLearningIntent({
        intent: createExplicitLearningIntent({ purpose: "ASSESS" }),
      }),
    ).toMatchObject({ purpose: "ASSESS", source: "EXPLICIT" });
    expect(
      resolvePresentLearningIntent({ intent: { purpose: "LEARN" } }),
    ).toBeNull();
  });
});

describe("Phase 2G-28 presentOrchestratorSuggestion intent parity", () => {
  const understandingWeak = summary({
    facets: { recognize: 0.2, explain: 0.2, apply: 0.1, retain: 0.1 },
  });

  it("1. no intent — baseline unchanged shape", () => {
    const { result, view } = diagnoseAndPresent(understandingWeak);
    expect(result.diagnosis).toBe("UNDERSTANDING_GAP");
    expect(view).not.toBeNull();
    expect(view!.learningIntent).toBeUndefined();
    expect(view!.actionLabel).toBe("Try it");
    expect(view!.href).toContain("/study/six/");
  });

  it("2–5. UNDERSTAND / PRACTICE / ASSESS / CREATE do not change decision", () => {
    const baseline = diagnoseAndPresent(understandingWeak);
    for (const purpose of PURPOSES) {
      const withIntent = diagnoseAndPresent(
        understandingWeak,
        createExplicitLearningIntent({ purpose }),
      );
      expectDecisionParity(baseline, withIntent);
      expect(withIntent.view!.learningIntent?.purpose).toBe(purpose);
    }
  });

  it("4b. ASSESS does not produce Quiz intervention", () => {
    const { result, view } = diagnoseAndPresent(
      understandingWeak,
      createExplicitLearningIntent({ purpose: "ASSESS" }),
    );
    expect(result.intervention?.kind).toBe("six");
    expect(result.intervention?.sixComponent).not.toBe("quiz");
    expect(view!.href).not.toMatch(/\/quizzes\//);
    expect(view!.learningIntent?.purpose).toBe("ASSESS");
  });

  it("6. explicit intent null behaves like omit for decision; field is null", () => {
    const baseline = diagnoseAndPresent(understandingWeak);
    const withNull = diagnoseAndPresent(understandingWeak, null);
    expectDecisionParity(baseline, withNull);
    expect(withNull.view!.learningIntent).toBeNull();
  });

  it("7. invalid intent normalizes to null via parser", () => {
    const baseline = diagnoseAndPresent(understandingWeak);
    const result = orchestrateFromLearnerState(understandingWeak, {
      courseId: "course-1",
      topicId: "topic-1",
    });
    const view = presentOrchestratorSuggestion(result, {
      intent: { purpose: "QUIZ_ME" },
    });
    expectDecisionParity(baseline, { result, view });
    expect(view!.learningIntent).toBeNull();
  });

  it("8–9. diagnosis + intervention parity across representative states", () => {
    const states: LearnerConceptMasterySummary[] = [
      summary({
        facets: { recognize: 0.2, explain: 0.15, apply: 0.1, retain: 0.1 },
      }),
      summary({
        facets: {
          recognize: 0.7,
          explain: 0.65,
          apply: 0.2,
          retain: 0.5,
        },
      }),
      summary({
        reviewCount: 5,
        evidenceSourceCounts: {
          quiz: 1,
          flashcard: 3,
          study_evaluate: 1,
          other: 0,
        },
        facets: {
          recognize: 0.7,
          explain: 0.7,
          apply: 0.65,
          retain: 0.2,
        },
      }),
      summary({
        reviewCount: 0,
        evidenceSourceCounts: {
          quiz: 0,
          flashcard: 0,
          study_evaluate: 0,
          other: 0,
        },
        facets: emptyFacetScores(),
      }),
      summary({
        reviewCount: 6,
        evidenceSourceCounts: {
          quiz: 2,
          flashcard: 2,
          study_evaluate: 2,
          other: 0,
        },
        facets: {
          recognize: 0.8,
          explain: 0.8,
          apply: 0.75,
          retain: 0.7,
        },
      }),
      summary({
        recentMissedCount: 5,
        facets: { recognize: 0.2, explain: 0.2, apply: 0.1, retain: 0.1 },
      }),
    ];

    for (const state of states) {
      const baseline = diagnoseAndPresent(state);
      for (const purpose of PURPOSES) {
        expectDecisionParity(
          baseline,
          diagnoseAndPresent(
            state,
            createExplicitLearningIntent({ purpose }),
          ),
        );
      }
      expectDecisionParity(baseline, diagnoseAndPresent(state, null));
    }
  });

  it("10. presentation parity — CTA, href, copy unchanged when intent present", () => {
    const baseline = diagnoseAndPresent(understandingWeak);
    const withAssess = diagnoseAndPresent(
      understandingWeak,
      createExplicitLearningIntent({ purpose: "ASSESS" }),
    );
    expect(withAssess.view!.notice).toBe(baseline.view!.notice);
    expect(withAssess.view!.reason).toBe(baseline.view!.reason);
    expect(withAssess.view!.recommendationLabel).toBe(
      baseline.view!.recommendationLabel,
    );
    expect(withAssess.view!.actionLabel).toBe(baseline.view!.actionLabel);
    expect(withAssess.view!.href).toBe(baseline.view!.href);
    expect(withAssess.view!.softWording).toBe(baseline.view!.softWording);
  });

  it("11. diagnose.ts does not import or parse LearningIntent for diagnosis", () => {
    const diagnose = readFileSync(
      path.join(process.cwd(), "src/lib/learning/orchestrator/diagnose.ts"),
      "utf8",
    );
    expect(diagnose).not.toMatch(/import\s+.*LearningIntent/);
    expect(diagnose).not.toContain("parseLearningIntent");
    expect(diagnose).not.toContain("resolvePresentLearningIntent");
  });

  it("security — present does not use intent for ownership", () => {
    const present = readFileSync(
      path.join(process.cwd(), "src/lib/learning/orchestrator/present.ts"),
      "utf8",
    );
    expect(present).toContain("Never drives diagnosis");
    expect(present).not.toMatch(/userId|ownership|authorize/i);
  });
});

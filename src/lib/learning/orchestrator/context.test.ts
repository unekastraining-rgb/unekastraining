/**
 * Phase 2G-29 — LearningDecisionContext contract + decision parity.
 */
import { describe, expect, it } from "vitest";

import { createExplicitLearningIntent } from "@/lib/learning/intent/project";
import { emptyFacetScores } from "@/lib/learning/mastery/facets";
import { orchestrateFromLearnerState } from "@/lib/learning/orchestrator/diagnose";
import {
  isEmptyLearningDecisionContext,
  normalizeLearningDecisionContext,
  type LearningDecisionContext,
} from "@/lib/learning/orchestrator/context";
import {
  presentOrchestratorSuggestion,
  resolvePresentDecisionContext,
  resolvePresentLearningIntent,
} from "@/lib/learning/orchestrator/present";
import type { LearnerConceptMasterySummary } from "@/lib/learning/types";
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
  options?: Parameters<typeof presentOrchestratorSuggestion>[1],
) {
  const result = orchestrateFromLearnerState(state, {
    courseId: "course-1",
    topicId: "topic-1",
    topicName: state.conceptTitle,
  });
  const view = presentOrchestratorSuggestion(result, options);
  return { result, view };
}

describe("Phase 2G-29 normalizeLearningDecisionContext", () => {
  it("1. empty context is valid", () => {
    expect(normalizeLearningDecisionContext()).toEqual({});
    expect(normalizeLearningDecisionContext(null)).toEqual({});
    expect(normalizeLearningDecisionContext({})).toEqual({});
    expect(isEmptyLearningDecisionContext({})).toBe(true);
  });

  it("3–6. valid purposes survive normalization", () => {
    for (const purpose of PURPOSES) {
      const intent = createExplicitLearningIntent({ purpose });
      const ctx = normalizeLearningDecisionContext({ intent });
      expect(ctx.intent).toMatchObject({
        purpose,
        source: "EXPLICIT",
      });
      expect(isEmptyLearningDecisionContext(ctx)).toBe(false);
    }
  });

  it("7. explicit null remains null", () => {
    expect(normalizeLearningDecisionContext({ intent: null })).toEqual({
      intent: null,
    });
  });

  it("8. malformed intent becomes null safely", () => {
    expect(
      normalizeLearningDecisionContext({ intent: { purpose: "QUIZ_ME" } }),
    ).toEqual({ intent: null });
    expect(
      normalizeLearningDecisionContext({ intent: "PRACTICE" }),
    ).toEqual({ intent: null });
  });

  it("9–10. concept / learning-space ids remain opaque and unchanged", () => {
    const ctx = normalizeLearningDecisionContext({
      conceptId: "concept-opaque-42",
      learningSpaceId: "space-opaque-7",
    });
    expect(ctx.conceptId).toBe("concept-opaque-42");
    expect(ctx.learningSpaceId).toBe("space-opaque-7");
  });

  it("explicit null ids remain null", () => {
    expect(
      normalizeLearningDecisionContext({
        conceptId: null,
        learningSpaceId: null,
      }),
    ).toEqual({ conceptId: null, learningSpaceId: null });
  });
});

describe("Phase 2G-29 PresentOrchestratorOptions → context", () => {
  it("2. no-intent options behave like previous no-context path", () => {
    expect(resolvePresentDecisionContext(undefined)).toBeUndefined();
    expect(resolvePresentDecisionContext({})).toBeUndefined();
    expect(resolvePresentLearningIntent(undefined)).toBeUndefined();
    expect(resolvePresentLearningIntent({})).toBeUndefined();
  });

  it("top-level intent (2G-28) still resolves", () => {
    const intent = createExplicitLearningIntent({ purpose: "PRACTICE" });
    expect(resolvePresentLearningIntent({ intent })).toMatchObject({
      purpose: "PRACTICE",
    });
    expect(resolvePresentDecisionContext({ intent })).toMatchObject({
      intent: { purpose: "PRACTICE" },
    });
  });

  it("nested context.intent resolves; top-level intent wins on conflict", () => {
    const nested = createExplicitLearningIntent({ purpose: "UNDERSTAND" });
    const top = createExplicitLearningIntent({ purpose: "ASSESS" });
    expect(
      resolvePresentDecisionContext({
        context: { intent: nested },
        intent: top,
      })?.intent?.purpose,
    ).toBe("ASSESS");
    expect(
      resolvePresentDecisionContext({
        context: { intent: nested, conceptId: "c-1" },
      }),
    ).toMatchObject({
      intent: { purpose: "UNDERSTAND" },
      conceptId: "c-1",
    });
  });
});

describe("Phase 2G-29 context does not alter decisions", () => {
  const understandingWeak = summary({
    facets: { recognize: 0.2, explain: 0.2, apply: 0.1, retain: 0.1 },
  });

  it("2. no-context presentation matches baseline shape", () => {
    const { result, view } = diagnoseAndPresent(understandingWeak);
    expect(result.diagnosis).toBe("UNDERSTANDING_GAP");
    expect(view!.learningIntent).toBeUndefined();
    expect(view!.decisionContext).toBeUndefined();
    expect(view!.href).toContain("/study/six/");
  });

  it("11–12. context metadata does not change diagnosis or intervention", () => {
    const baseline = diagnoseAndPresent(understandingWeak);
    const contexts: Array<LearningDecisionContext | { intent: unknown }> = [
      {},
      { intent: null },
      ...PURPOSES.map((purpose) => ({
        intent: createExplicitLearningIntent({ purpose }),
      })),
      {
        intent: createExplicitLearningIntent({ purpose: "ASSESS" }),
        conceptId: "concept-opaque-99",
        learningSpaceId: "space-opaque-99",
      },
      { intent: { purpose: "LEARN" } },
    ];

    for (const context of contexts) {
      const viaNested = diagnoseAndPresent(understandingWeak, { context });
      const flatOptions: Parameters<typeof presentOrchestratorSuggestion>[1] =
        {};
      if ("intent" in context) flatOptions.intent = context.intent;
      if ("conceptId" in context) {
        flatOptions.conceptId = (context as LearningDecisionContext).conceptId;
      }
      if ("learningSpaceId" in context) {
        flatOptions.learningSpaceId = (
          context as LearningDecisionContext
        ).learningSpaceId;
      }
      const viaFlat =
        Object.keys(flatOptions).length > 0
          ? diagnoseAndPresent(understandingWeak, flatOptions)
          : diagnoseAndPresent(understandingWeak, { context: {} });

      for (const other of [viaNested, viaFlat]) {
        expect(other.result.diagnosis).toBe(baseline.result.diagnosis);
        expect(other.result.intervention?.kind).toBe(
          baseline.result.intervention?.kind,
        );
        expect(other.result.intervention?.sixComponent).toBe(
          baseline.result.intervention?.sixComponent,
        );
        expect(learnerFacingSlice(other.view)).toEqual(
          learnerFacingSlice(baseline.view),
        );
      }
    }
  });

  it("13. ASSESS does not become Quiz", () => {
    const { result, view } = diagnoseAndPresent(understandingWeak, {
      context: {
        intent: createExplicitLearningIntent({ purpose: "ASSESS" }),
      },
    });
    expect(result.intervention?.kind).toBe("six");
    expect(result.intervention?.sixComponent).not.toBe("quiz");
    expect(view!.href).not.toMatch(/\/quizzes\//);
    expect(view!.decisionContext?.intent?.purpose).toBe("ASSESS");
  });
});

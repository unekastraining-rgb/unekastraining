/**
 * Phase 2G-32 — Soft UNDERSTAND / PRACTICE preference within legal SIX set.
 */
import { describe, expect, it } from "vitest";

import { createExplicitLearningIntent } from "@/lib/learning/intent/project";
import { emptyFacetScores } from "@/lib/learning/mastery/facets";
import {
  isUnderstandingFacetLocked,
  orchestrateFromLearnerState,
} from "@/lib/learning/orchestrator/diagnose";
import {
  applySoftIntentPreference,
  legalSixCandidates,
} from "@/lib/learning/orchestrator/intent-preference";
import type { LearnerConceptMasterySummary } from "@/lib/learning/types";
import type { OrchestratorResult } from "@/lib/learning/orchestrator/diagnose";
import type { SixComponent } from "@/lib/csl/six";

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

function decisionCore(result: OrchestratorResult) {
  const {
    decisionContext: _c,
    assessmentHandoff: _h,
    reason: _r,
    ...rest
  } = result;
  void _c;
  void _h;
  void _r;
  return rest;
}

function run(
  state: LearnerConceptMasterySummary,
  purpose?: "UNDERSTAND" | "PRACTICE" | "ASSESS" | "CREATE" | null,
) {
  if (purpose === undefined) {
    return orchestrateFromLearnerState(state, route);
  }
  if (purpose === null) {
    return orchestrateFromLearnerState(state, { ...route, intent: null });
  }
  return orchestrateFromLearnerState(state, {
    ...route,
    intent: createExplicitLearningIntent({ purpose }),
  });
}

describe("Phase 2G-32 soft intent preference", () => {
  /** Unlocked UNDERSTANDING_GAP: baseline feynman via explain+0.05 < recognize. */
  const unlockedUnderstanding = summary({
    facets: {
      recognize: 0.4,
      explain: 0.3,
      apply: 0.1,
      retain: 0.1,
    },
  });

  /** Facet-locked: recognize substantially lower → active-recall only. */
  const lockedRecognizeWeak = summary({
    facets: {
      recognize: 0.2,
      explain: 0.7,
      apply: 0.5,
      retain: 0.5,
    },
  });

  const applicationGap = summary({
    facets: {
      recognize: 0.7,
      explain: 0.7,
      apply: 0.2,
      retain: 0.5,
    },
  });

  const recallGap = summary({
    facets: {
      recognize: 0.7,
      explain: 0.7,
      apply: 0.65,
      retain: 0.2,
    },
  });

  const insufficient = summary({
    reviewCount: 0,
    evidenceSourceCounts: {
      quiz: 0,
      flashcard: 0,
      study_evaluate: 0,
      other: 0,
    },
    facets: emptyFacetScores(),
  });

  const allStrong = summary({
    reviewCount: 6,
    facets: {
      recognize: 0.8,
      explain: 0.8,
      apply: 0.75,
      perform: 0.7,
      retain: 0.7,
    },
  });

  it("7. no intent — baseline unlocked understanding selects feynman", () => {
    const baseline = run(unlockedUnderstanding);
    expect(baseline.diagnosis).toBe("UNDERSTANDING_GAP");
    expect(baseline.intervention?.sixComponent).toBe("feynman");
    expect(
      isUnderstandingFacetLocked(unlockedUnderstanding.facets, false),
    ).toBe(false);
  });

  it("1. UNDERSTAND soft-prefers detailed-explanation among co-eligible", () => {
    const baseline = run(unlockedUnderstanding);
    const withUnderstand = run(unlockedUnderstanding, "UNDERSTAND");
    expect(withUnderstand.diagnosis).toBe(baseline.diagnosis);
    expect(withUnderstand.intervention?.sixComponent).toBe(
      "detailed-explanation",
    );
    const legal = legalSixCandidates(
      "UNDERSTANDING_GAP",
      baseline.intervention!.sixComponent,
      false,
    );
    expect(legal).toContain("detailed-explanation");
    expect(legal).toContain(baseline.intervention!.sixComponent);
  });

  it("2. PRACTICE prefers Hands-on when already legal (APPLICATION_GAP)", () => {
    const baseline = run(applicationGap);
    const withPractice = run(applicationGap, "PRACTICE");
    expect(baseline.diagnosis).toBe("APPLICATION_GAP");
    expect(baseline.intervention?.sixComponent).toBe("hands-on-practice");
    expect(withPractice.diagnosis).toBe("APPLICATION_GAP");
    expect(withPractice.intervention?.sixComponent).toBe("hands-on-practice");
  });

  it("3. PRACTICE + UNDERSTANDING_GAP does not invent Hands-on", () => {
    const baseline = run(unlockedUnderstanding);
    const withPractice = run(unlockedUnderstanding, "PRACTICE");
    expect(withPractice.diagnosis).toBe("UNDERSTANDING_GAP");
    expect(withPractice.intervention?.sixComponent).toBe(
      baseline.intervention?.sixComponent,
    );
    expect(withPractice.intervention?.sixComponent).not.toBe(
      "hands-on-practice",
    );
    expect(withPractice.intervention?.kind).toBe("six");
  });

  it("4. ASSESS changes nothing for representative diagnoses", () => {
    const states = [
      unlockedUnderstanding,
      applicationGap,
      recallGap,
      insufficient,
      lockedRecognizeWeak,
    ];
    for (const state of states) {
      const baseline = run(state);
      const withAssess = run(state, "ASSESS");
      expect(withAssess.diagnosis).toBe(baseline.diagnosis);
      expect(decisionCore(withAssess)).toEqual(decisionCore(baseline));
      expect(withAssess.intervention?.kind ?? null).not.toBe("quiz");
      expect(withAssess.intervention?.href ?? "").not.toMatch(/\/quizzes\//);
    }
  });

  it("5. CREATE changes nothing", () => {
    const baseline = run(unlockedUnderstanding);
    const withCreate = run(unlockedUnderstanding, "CREATE");
    expect(decisionCore(withCreate)).toEqual(decisionCore(baseline));
  });

  it("6. malformed intent does not alter policy", () => {
    const baseline = run(unlockedUnderstanding);
    const malformed = orchestrateFromLearnerState(unlockedUnderstanding, {
      ...route,
      intent: { purpose: "QUIZ_ME" },
    });
    expect(decisionCore(malformed)).toEqual(decisionCore(baseline));
    expect(malformed.decisionContext).toEqual({ intent: null });
  });

  it("8. NO_INTERVENTION remains null regardless of intent", () => {
    for (const purpose of [
      undefined,
      "UNDERSTAND",
      "PRACTICE",
      "ASSESS",
      "CREATE",
    ] as const) {
      const result =
        purpose === undefined ? run(allStrong) : run(allStrong, purpose);
      expect(result.diagnosis).toBe("NO_INTERVENTION");
      expect(result.intervention).toBeNull();
    }
  });

  it("insufficient evidence — intent cannot bypass Chunking", () => {
    const baseline = run(insufficient);
    expect(baseline.diagnosis).toBe("INSUFFICIENT_EVIDENCE");
    expect(baseline.intervention?.sixComponent).toBe("chunking");
    for (const purpose of ["UNDERSTAND", "PRACTICE", "ASSESS", "CREATE"] as const) {
      const result = run(insufficient, purpose);
      expect(result.diagnosis).toBe("INSUFFICIENT_EVIDENCE");
      expect(result.intervention?.sixComponent).toBe("chunking");
    }
  });

  it("facet-locked UNDERSTANDING_GAP — UNDERSTAND cannot override active-recall", () => {
    const baseline = run(lockedRecognizeWeak);
    expect(baseline.intervention?.sixComponent).toBe("active-recall");
    expect(
      isUnderstandingFacetLocked(lockedRecognizeWeak.facets, false),
    ).toBe(true);
    const withUnderstand = run(lockedRecognizeWeak, "UNDERSTAND");
    expect(withUnderstand.diagnosis).toBe("UNDERSTANDING_GAP");
    expect(withUnderstand.intervention?.sixComponent).toBe("active-recall");
  });

  it("diagnosis remains identical across all intents for each state", () => {
    const states = [
      unlockedUnderstanding,
      applicationGap,
      recallGap,
      insufficient,
      allStrong,
      lockedRecognizeWeak,
    ];
    for (const state of states) {
      const baseline = run(state);
      for (const purpose of [
        "UNDERSTAND",
        "PRACTICE",
        "ASSESS",
        "CREATE",
        null,
      ] as const) {
        expect(run(state, purpose).diagnosis).toBe(baseline.diagnosis);
      }
    }
  });

  it("selected UNDERSTAND/PRACTICE intervention is always in legal candidate set", () => {
    const baseline = run(unlockedUnderstanding);
    const legal = legalSixCandidates(
      baseline.diagnosis,
      baseline.intervention!.sixComponent as SixComponent,
      false,
    );
    const under = run(unlockedUnderstanding, "UNDERSTAND");
    const practice = run(unlockedUnderstanding, "PRACTICE");
    expect(legal).toContain(under.intervention!.sixComponent);
    expect(legal).toContain(practice.intervention!.sixComponent);
  });

  it("applySoftIntentPreference ignores ASSESS/CREATE", () => {
    const legal: SixComponent[] = [
      "feynman",
      "detailed-explanation",
      "visualization",
    ];
    expect(applySoftIntentPreference(legal, "feynman", "ASSESS")).toBe(
      "feynman",
    );
    expect(applySoftIntentPreference(legal, "feynman", "CREATE")).toBe(
      "feynman",
    );
    expect(applySoftIntentPreference(legal, "feynman", "UNDERSTAND")).toBe(
      "detailed-explanation",
    );
  });
});

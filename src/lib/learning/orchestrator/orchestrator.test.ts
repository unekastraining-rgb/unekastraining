import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import { SIX_ACTIVITIES, type SixComponent } from "@/lib/csl/six";
import { emptyFacetScores } from "@/lib/learning/mastery/facets";
import {
  computeOrchestratorConfidence,
  canDistinguishRecognizeFromExplain,
  isFacetSubstantiallyLower,
  orchestrateFromLearnerState,
  pickUnderstandingIntervention,
} from "@/lib/learning/orchestrator/diagnose";
import type { LearnerConceptMasterySummary } from "@/lib/learning/types";

function summary(partial: {
  facets?: Partial<LearnerConceptMasterySummary["facets"]>;
  topicMastery?: LearnerConceptMasterySummary["topicMastery"];
  recentMissedCount?: number;
  evidenceSourceCounts?: LearnerConceptMasterySummary["evidenceSourceCounts"];
  reviewCount?: number;
  lastReviewedAt?: Date | null;
  nextReviewAt?: Date | null;
}): LearnerConceptMasterySummary {
  return {
    learnerId: "user-1",
    conceptId: "concept-1",
    conceptTitle: "Java Exceptions",
    facets: { ...emptyFacetScores(), ...partial.facets },
    topicMastery: partial.topicMastery ?? null,
    recentMissedCount: partial.recentMissedCount ?? 0,
    evidenceSourceCounts: partial.evidenceSourceCounts ?? {
      quiz: 0,
      flashcard: 0,
      study_evaluate: 0,
      other: 0,
    },
    reviewCount: partial.reviewCount ?? 0,
    lastReviewedAt: partial.lastReviewedAt ?? null,
    nextReviewAt: partial.nextReviewAt ?? null,
  };
}

const ALL_SIX = new Set(SIX_ACTIVITIES.map((a) => a.id));

describe("Orchestrator v1 diagnosis", () => {
  it("weak RECOGNIZE/EXPLAIN → UNDERSTANDING_GAP", () => {
    const result = orchestrateFromLearnerState(
      summary({
        reviewCount: 3,
        evidenceSourceCounts: { quiz: 2, flashcard: 0, study_evaluate: 1, other: 0 },
        facets: { recognize: 0.2, explain: 0.15, apply: 0.1, retain: 0.1 },
      }),
    );
    expect(result.diagnosis).toBe("UNDERSTANDING_GAP");
    expect(result.intervention?.kind).toBe("six");
    expect(ALL_SIX.has(result.intervention!.sixComponent)).toBe(true);
    expect(result.reason.toLowerCase()).toMatch(/recognition|understanding/);
    expect(result.reason).not.toMatch(/don't understand Java/i);
  });

  it("strong recognize/explain + weak APPLY → APPLICATION_GAP → hands-on-practice", () => {
    const result = orchestrateFromLearnerState(
      summary({
        reviewCount: 4,
        evidenceSourceCounts: { quiz: 1, flashcard: 0, study_evaluate: 2, other: 0 },
        facets: {
          recognize: 0.7,
          explain: 0.65,
          apply: 0.2,
          retain: 0.5,
        },
      }),
    );
    expect(result.diagnosis).toBe("APPLICATION_GAP");
    expect(result.intervention?.sixComponent).toBe("hands-on-practice");
    expect(result.reason.toLowerCase()).toMatch(/application/);
  });

  it("strong understand/apply + weak RETAIN → retention/recall → active-recall", () => {
    const result = orchestrateFromLearnerState(
      summary({
        reviewCount: 5,
        evidenceSourceCounts: { quiz: 1, flashcard: 3, study_evaluate: 1, other: 0 },
        facets: {
          recognize: 0.7,
          explain: 0.7,
          apply: 0.65,
          retain: 0.2,
        },
      }),
    );
    expect(["RETENTION_GAP", "RECALL_GAP"]).toContain(result.diagnosis);
    expect(result.intervention?.sixComponent).toBe("active-recall");
  });

  it("strong current evidence → NO_INTERVENTION", () => {
    const result = orchestrateFromLearnerState(
      summary({
        reviewCount: 6,
        evidenceSourceCounts: { quiz: 2, flashcard: 2, study_evaluate: 2, other: 0 },
        facets: {
          recognize: 0.8,
          explain: 0.75,
          apply: 0.7,
          perform: 0.7,
          retain: 0.7,
          confidence: 0.7,
        },
      }),
    );
    expect(result.diagnosis).toBe("NO_INTERVENTION");
    expect(result.intervention).toBeNull();
  });

  it("insufficient evidence → LOW confidence, not an unsupported hard diagnosis", () => {
    const result = orchestrateFromLearnerState(summary({ reviewCount: 0 }));
    expect(result.diagnosis).toBe("INSUFFICIENT_EVIDENCE");
    expect(result.confidence).toBe("LOW");
    expect(result.intervention?.sixComponent).toBe("chunking");
    expect(result.reason.toLowerCase()).toMatch(/enough learning evidence/);
  });
});

describe("Orchestrator v1 intervention selection", () => {
  it("UNDERSTANDING_GAP maps to an existing SIX intervention id", () => {
    const result = orchestrateFromLearnerState(
      summary({
        reviewCount: 2,
        evidenceSourceCounts: { quiz: 2, flashcard: 0, study_evaluate: 0, other: 0 },
        facets: { recognize: 0.7, explain: 0.2 },
      }),
    );
    expect(result.diagnosis).toBe("UNDERSTANDING_GAP");
    expect(result.intervention?.sixComponent).toBe("feynman");
    expect(result.intervention?.href).toContain("/study/six/feynman");
  });

  it("APPLICATION_GAP maps to hands-on-practice", () => {
    const result = orchestrateFromLearnerState(
      summary({
        reviewCount: 3,
        evidenceSourceCounts: { quiz: 0, flashcard: 0, study_evaluate: 3, other: 0 },
        facets: { recognize: 0.6, explain: 0.6, apply: 0.2, retain: 0.5 },
      }),
    );
    expect(result.intervention?.sixComponent).toBe("hands-on-practice");
    expect(result.intervention?.href).toContain("/study/six/hands-on-practice");
  });

  it("RECALL/RETENTION maps to active-recall", () => {
    const result = orchestrateFromLearnerState(
      summary({
        reviewCount: 2,
        evidenceSourceCounts: { quiz: 0, flashcard: 2, study_evaluate: 0, other: 0 },
        facets: { recognize: 0.6, explain: 0.6, apply: 0.55, retain: 0.2 },
      }),
    );
    expect(result.intervention?.sixComponent).toBe("active-recall");
  });

  it("only uses valid existing SIX identifiers", () => {
    const components: SixComponent[] = [
      "chunking",
      "detailed-explanation",
      "feynman",
      "visualization",
      "hands-on-practice",
      "active-recall",
    ];
    for (const id of components) {
      expect(ALL_SIX.has(id)).toBe(true);
    }
  });

  it("does not duplicate SIX catalog — uses SIX_ACTIVITIES titles", () => {
    const result = orchestrateFromLearnerState(
      summary({
        reviewCount: 2,
        evidenceSourceCounts: { quiz: 2, flashcard: 0, study_evaluate: 0, other: 0 },
        facets: { recognize: 0.2, explain: 0.2 },
      }),
    );
    const meta = SIX_ACTIVITIES.find(
      (a) => a.id === result.intervention?.sixComponent,
    );
    expect(result.intervention?.title).toBe(meta?.title);
  });
});

describe("Orchestrator v1 multi-source signals", () => {
  it("quiz, flashcard, and study_evaluate counts contribute to confidence", () => {
    const multi = orchestrateFromLearnerState(
      summary({
        reviewCount: 4,
        evidenceSourceCounts: { quiz: 2, flashcard: 2, study_evaluate: 2, other: 0 },
        facets: { recognize: 0.2, explain: 0.2, apply: 0.1, retain: 0.1 },
      }),
    );
    expect(multi.signals.evidenceSourceCounts.quiz).toBe(2);
    expect(multi.signals.evidenceSourceCounts.flashcard).toBe(2);
    expect(multi.signals.evidenceSourceCounts.study_evaluate).toBe(2);
    expect(multi.confidence).toBe("HIGH");

    const single = orchestrateFromLearnerState(
      summary({
        reviewCount: 1,
        evidenceSourceCounts: { quiz: 1, flashcard: 0, study_evaluate: 0, other: 0 },
        facets: { recognize: 0.2, explain: 0.2 },
      }),
    );
    expect(single.confidence).toBe("LOW");
  });

  it("facet differences are independent (apply weak does not erase retain)", () => {
    const result = orchestrateFromLearnerState(
      summary({
        reviewCount: 3,
        evidenceSourceCounts: { quiz: 1, flashcard: 1, study_evaluate: 1, other: 0 },
        facets: {
          recognize: 0.7,
          explain: 0.7,
          apply: 0.2,
          retain: 0.8,
        },
      }),
    );
    expect(result.diagnosis).toBe("APPLICATION_GAP");
    expect(result.signals.facets.retain).toBe(0.8);
  });
});

describe("Orchestrator confidence + safety", () => {
  it("computeOrchestratorConfidence stays coarse (HIGH/MEDIUM/LOW)", () => {
    expect(
      computeOrchestratorConfidence({
        reviewCount: 5,
        evidenceEvents: 6,
        sourceKinds: 3,
        usedTopicMasteryFallback: false,
        diagnosis: "UNDERSTANDING_GAP",
      }),
    ).toBe("HIGH");
    expect(
      computeOrchestratorConfidence({
        reviewCount: 0,
        evidenceEvents: 0,
        sourceKinds: 0,
        usedTopicMasteryFallback: false,
        diagnosis: "INSUFFICIENT_EVIDENCE",
      }),
    ).toBe("LOW");
  });

  it("reasons do not reveal answers or internal DB ids as learner copy", () => {
    const result = orchestrateFromLearnerState(
      summary({
        reviewCount: 2,
        evidenceSourceCounts: { quiz: 2, flashcard: 0, study_evaluate: 0, other: 0 },
        facets: { recognize: 0.2, explain: 0.2 },
      }),
      { courseId: "course-xyz", topicId: "topic-abc" },
    );
    expect(result.reason).not.toMatch(/course-xyz|topic-abc|prisma|sqlite/i);
    expect(result.reason).not.toMatch(/correct answer/i);
  });

  it("does not modify LUCKY / TopicMastery / CORE modules", () => {
    const diagnose = readFileSync(
      path.join(process.cwd(), "src/lib/learning/orchestrator/diagnose.ts"),
      "utf8",
    );
    expect(diagnose).not.toMatch(/lucky-engine|updateTopicMastery|contentJson/);
    expect(diagnose).toContain("sixGuideHref");
    expect(diagnose).toContain("SIX_ACTIVITIES");
  });

  it("recommendation-only: no auto-launch language in API surface", () => {
    const orchIndex = readFileSync(
      path.join(process.cwd(), "src/lib/learning/orchestrator/index.ts"),
      "utf8",
    );
    expect(orchIndex).toMatch(/recommendation-only/i);
  });
});

describe("Phase 2G-18 Orchestrator facet interpretation", () => {
  it("1. Recognize weak + Explain strong → UNDERSTANDING_GAP + active-recall (not Quiz)", () => {
    const result = orchestrateFromLearnerState(
      summary({
        reviewCount: 4,
        evidenceSourceCounts: {
          quiz: 1,
          flashcard: 0,
          study_evaluate: 2,
          other: 0,
        },
        facets: {
          recognize: 0.3,
          explain: 0.85,
          apply: 0.8,
          retain: 0.75,
        },
      }),
    );
    expect(result.diagnosis).toBe("UNDERSTANDING_GAP");
    expect(result.intervention?.kind).toBe("six");
    expect(result.intervention?.sixComponent).toBe("active-recall");
    expect(result.reason.toLowerCase()).toMatch(/recognition|retriev/);
    expect(JSON.stringify(result.intervention)).not.toMatch(/"quiz"/i);
  });

  it("2. Recognize strong + Explain weak → UNDERSTANDING_GAP + feynman", () => {
    const result = orchestrateFromLearnerState(
      summary({
        reviewCount: 4,
        evidenceSourceCounts: {
          quiz: 1,
          flashcard: 0,
          study_evaluate: 2,
          other: 0,
        },
        facets: {
          recognize: 0.85,
          explain: 0.35,
          apply: 0.5,
          retain: 0.5,
        },
      }),
    );
    expect(result.diagnosis).toBe("UNDERSTANDING_GAP");
    expect(result.intervention?.sixComponent).toBe("feynman");
    expect(result.reason.toLowerCase()).toMatch(/explain/);
  });

  it("3. Both Recognize and Explain weak → existing detailed-explanation path", () => {
    const result = orchestrateFromLearnerState(
      summary({
        reviewCount: 3,
        evidenceSourceCounts: {
          quiz: 2,
          flashcard: 0,
          study_evaluate: 1,
          other: 0,
        },
        facets: {
          recognize: 0.2,
          explain: 0.15,
          apply: 0.1,
          retain: 0.1,
        },
      }),
    );
    expect(result.diagnosis).toBe("UNDERSTANDING_GAP");
    expect(result.intervention?.sixComponent).toBe("detailed-explanation");
  });

  it("4. Both strong + Apply weak → APPLICATION_GAP (not stolen by understanding)", () => {
    const result = orchestrateFromLearnerState(
      summary({
        reviewCount: 4,
        evidenceSourceCounts: {
          quiz: 1,
          flashcard: 0,
          study_evaluate: 2,
          other: 0,
        },
        facets: {
          recognize: 0.7,
          explain: 0.65,
          apply: 0.2,
          retain: 0.5,
        },
      }),
    );
    expect(result.diagnosis).toBe("APPLICATION_GAP");
    expect(result.intervention?.sixComponent).toBe("hands-on-practice");
  });

  it("5. Both strong + Retain weak → existing recall/retention → active-recall", () => {
    const result = orchestrateFromLearnerState(
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
    );
    expect(["RETENTION_GAP", "RECALL_GAP"]).toContain(result.diagnosis);
    expect(result.intervention?.sixComponent).toBe("active-recall");
  });

  it("6. All strong → NO_INTERVENTION", () => {
    const result = orchestrateFromLearnerState(
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
          explain: 0.75,
          apply: 0.7,
          perform: 0.7,
          retain: 0.7,
        },
      }),
    );
    expect(result.diagnosis).toBe("NO_INTERVENTION");
    expect(result.intervention).toBeNull();
  });

  it("7. Insufficient evidence unchanged", () => {
    const result = orchestrateFromLearnerState(summary({ reviewCount: 0 }));
    expect(result.diagnosis).toBe("INSUFFICIENT_EVIDENCE");
    expect(result.intervention?.sixComponent).toBe("chunking");
  });

  it("8. Repeated-failure path does not invent a new diagnosis enum", () => {
    const diagnose = readFileSync(
      path.join(process.cwd(), "src/lib/learning/orchestrator/diagnose.ts"),
      "utf8",
    );
    expect(diagnose).not.toMatch(/RECOGNITION_GAP|EXPLANATION_GAP|ASSESSMENT_GAP/);
    const result = orchestrateFromLearnerState(
      summary({
        reviewCount: 4,
        evidenceSourceCounts: {
          quiz: 3,
          flashcard: 0,
          study_evaluate: 1,
          other: 0,
        },
        facets: { recognize: 0.2, explain: 0.2, apply: 0.1, retain: 0.1 },
      }),
    );
    expect(result.diagnosis).toBe("UNDERSTANDING_GAP");
  });

  it("9. No Quiz emission across facet-split understanding states", () => {
    const states = [
      { recognize: 0.3, explain: 0.85, apply: 0.8, retain: 0.75 },
      { recognize: 0.85, explain: 0.35, apply: 0.5, retain: 0.5 },
      { recognize: 0.2, explain: 0.2, apply: 0.1, retain: 0.1 },
    ];
    for (const facets of states) {
      const result = orchestrateFromLearnerState(
        summary({
          reviewCount: 3,
          evidenceSourceCounts: {
            quiz: 2,
            flashcard: 0,
            study_evaluate: 1,
            other: 0,
          },
          facets,
        }),
      );
      expect(result.intervention?.kind).toBe("six");
      expect(result.intervention).not.toMatchObject({ kind: "quiz" });
      expect(ALL_SIX.has(result.intervention!.sixComponent)).toBe(true);
    }
  });

  it("10. TopicMastery fallback does not falsely claim Recognize-vs-Explain split", () => {
    expect(
      canDistinguishRecognizeFromExplain({
        usedTopicMasteryFallback: true,
        recognize: 0.3,
        explain: 0.3,
      }),
    ).toBe(false);

    const result = orchestrateFromLearnerState(
      summary({
        reviewCount: 0,
        evidenceSourceCounts: {
          quiz: 0,
          flashcard: 0,
          study_evaluate: 0,
          other: 0,
        },
        topicMastery: {
          topicId: "topic-1",
          proficiency: 0.3,
          confidence: 0.4,
          understanding: 0.3,
          recall: 0.7,
          application: 0.7,
        },
        facets: emptyFacetScores(),
      }),
    );
    expect(result.signals.usedTopicMasteryFallback).toBe(true);
    expect(result.diagnosis).toBe("UNDERSTANDING_GAP");
    // Collapsed recognize=explain=0.3 → both weak → detailed-explanation, not active-recall
    expect(result.intervention?.sixComponent).toBe("detailed-explanation");
    expect(result.reason).not.toMatch(/explanation is stronger than recognition/i);
  });

  it("helpers use existing WEAK/STRONG bands", () => {
    expect(isFacetSubstantiallyLower(0.3, 0.85)).toBe(true);
    expect(isFacetSubstantiallyLower(0.5, 0.85)).toBe(false);
    expect(isFacetSubstantiallyLower(0.3, 0.5)).toBe(false);
    expect(
      pickUnderstandingIntervention(
        {
          ...emptyFacetScores(),
          recognize: 0.3,
          explain: 0.85,
        },
        false,
      ),
    ).toBe("active-recall");
  });
});

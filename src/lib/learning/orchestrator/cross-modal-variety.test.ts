/**
 * 2P-42 — Cross-modal variety: ranking demotion, alternate picks, no forced variety.
 */

import { describe, expect, it } from "vitest";

import {
  getActivityInterventionCapability,
} from "@/lib/learning/orchestrator/activity-intervention-capability";
import {
  rankActivityInterventionCandidates,
} from "@/lib/learning/orchestrator/activity-intervention-ranking";
import {
  selectActivityIntervention,
} from "@/lib/learning/orchestrator/activity-intervention-policy";
import {
  crossModalVarietyTruthSummary,
  extractRecentActivityAdapterKeys,
  pickAlternateLegalSixComponent,
  resolveImmediateRepeatAlternate,
} from "@/lib/learning/orchestrator/cross-modal-variety";
import type { OrchestratorResult } from "@/lib/learning/orchestrator/diagnose";
import { evaluateActivityCompatibility } from "@/lib/learning/orchestrator/activity-intervention-compatibility";

function baseOrch(
  partial: Partial<OrchestratorResult> &
    Pick<OrchestratorResult, "diagnosis" | "intervention">,
): OrchestratorResult {
  return {
    learnerId: "learner-1",
    conceptId: "concept-1",
    conceptTitle: "Java inheritance",
    reason: "test",
    confidence: "MEDIUM",
    signals: {
      facets: {
        recognize: 0.3,
        explain: 0.3,
        apply: 0.3,
        solve: 0.1,
        perform: 0,
        retain: 0.3,
        confidence: 0.4,
      },
      evidenceSourceCounts: {
        quiz: 1,
        flashcard: 0,
        study_evaluate: 1,
        other: 0,
      },
      reviewCount: 2,
      evidenceSourceKinds: 2,
      usedTopicMasteryFallback: false,
    },
    ...partial,
  };
}

describe("2P-42 cross-modal variety helpers", () => {
  it("truth summary: no new engines / no forced variety", () => {
    const t = crossModalVarietyTruthSummary();
    expect(t.inventsEngines).toBe(false);
    expect(t.forcesVariety).toBe(false);
    expect(t.mutatesDiagnosis).toBe(false);
  });

  it("extractRecentActivityAdapterKeys ignores SIX strings", () => {
    expect(
      extractRecentActivityAdapterKeys([
        { intervention: "detailed-explanation" },
        { intervention: "coding" },
        { intervention: "math" },
      ]),
    ).toEqual(["coding", "math"]);
  });

  it("soft-demotes recent adapter without removing sole match", () => {
    const coding = getActivityInterventionCapability("coding")!;
    const sql = getActivityInterventionCapability("sql")!;
    const codingCompat = evaluateActivityCompatibility(coding, {
      conceptTitle: "Java inheritance coding practice",
      subjectDomain: "computer science",
    });
    const sqlCompat = evaluateActivityCompatibility(sql, {
      conceptTitle: "SQL SELECT filtering",
      subjectDomain: "SQL",
    });
    expect(codingCompat.status).toBe("MATCH");
    expect(sqlCompat.status).toBe("MATCH");

    const ranked = rankActivityInterventionCandidates(
      [
        { capability: coding, compatibility: codingCompat },
        { capability: sql, compatibility: sqlCompat },
      ],
      { demoteAdapterKeys: ["coding"] },
    );
    // Different domains → both MATCH with strength 2; demotion breaks the tie.
    expect(ranked[0]?.capability.adapterKey).toBe("sql");

    const onlyCoding = rankActivityInterventionCandidates(
      [{ capability: coding, compatibility: codingCompat }],
      { demoteAdapterKeys: ["coding"] },
    );
    expect(onlyCoding[0]?.capability.adapterKey).toBe("coding");
  });

  it("preferSolveProducers soft-biases SOLVE adapters under equal strength", () => {
    const math = getActivityInterventionCapability("math")!;
    const lab = getActivityInterventionCapability("lab")!;
    const equalCompat = {
      status: "MATCH" as const,
      strength: 1 as const,
      matchedTokens: ["practice"],
      reason: "title_topic_cue_match" as const,
    };
    const ranked = rankActivityInterventionCandidates(
      [
        { capability: lab, compatibility: equalCompat },
        { capability: math, compatibility: equalCompat },
      ],
      { preferSolveProducers: true },
    );
    expect(ranked[0]?.capability.adapterKey).toBe("math");
    expect(ranked[0]?.capability.evidenceFacetsProduced).toContain("SOLVE");
  });

  it("selectActivityIntervention demotes recent coding when SQL also matches", () => {
    const without = selectActivityIntervention({
      diagnosis: "APPLICATION_GAP",
      conceptId: "c1",
      conceptTitle: "Database query practice",
      subjectDomain: "SQL",
      intentPurpose: "PRACTICE",
    });
    expect(without?.adapterKey).toBe("sql");

    const withDemote = selectActivityIntervention({
      diagnosis: "APPLICATION_GAP",
      conceptId: "c1",
      conceptTitle: "Database query practice",
      subjectDomain: "SQL",
      intentPurpose: "PRACTICE",
      recentAdapterKeys: ["sql"],
    });
    // Sole domain match remains sql — variety not forced.
    expect(withDemote?.adapterKey).toBe("sql");
  });

  it("pickAlternateLegalSixComponent respects UNDERSTANDING co-eligible set", () => {
    expect(
      pickAlternateLegalSixComponent({
        diagnosis: "UNDERSTANDING_GAP",
        baseline: "detailed-explanation",
        facetLocked: false,
        exclude: "detailed-explanation",
      }),
    ).toBe("feynman");

    expect(
      pickAlternateLegalSixComponent({
        diagnosis: "APPLICATION_GAP",
        baseline: "hands-on-practice",
        facetLocked: false,
        exclude: "hands-on-practice",
      }),
    ).toBeNull();
  });

  it("resolveImmediateRepeatAlternate picks SIX alternate or returns null", () => {
    const alt = resolveImmediateRepeatAlternate(
      baseOrch({
        diagnosis: "UNDERSTANDING_GAP",
        intervention: {
          kind: "six",
          sixComponent: "detailed-explanation",
          title: "Detailed Explanation",
          emoji: "📖",
          href: "/study/six/detailed-explanation",
        },
      }),
      "detailed-explanation",
    );
    expect(alt?.intervention?.sixComponent).toBe("feynman");

    const none = resolveImmediateRepeatAlternate(
      baseOrch({
        diagnosis: "APPLICATION_GAP",
        intervention: {
          kind: "six",
          sixComponent: "hands-on-practice",
          title: "Hands-on",
          emoji: "🛠️",
          href: "/study/six/hands-on-practice",
        },
        signals: {
          facets: {
            recognize: 0.7,
            explain: 0.7,
            apply: 0.2,
            solve: 0.1,
            perform: 0,
            retain: 0.3,
            confidence: 0.5,
          },
          evidenceSourceCounts: {
            quiz: 1,
            flashcard: 0,
            study_evaluate: 0,
            other: 0,
          },
          reviewCount: 2,
          evidenceSourceKinds: 1,
          usedTopicMasteryFallback: false,
        },
      }),
      "hands-on-practice",
    );
    expect(none).toBeNull();
  });
});

/**
 * 2G-77 — Compatibility matching hardening (token/phrase, not substring).
 */

import { describe, expect, it } from "vitest";

import { createExplicitLearningIntent } from "@/lib/learning/intent/project";
import { emptyFacetScores } from "@/lib/learning/mastery/facets";
import { getActivityInterventionCapability } from "@/lib/learning/orchestrator/activity-intervention-capability";
import {
  activityCompatibilityTruthSummary,
  evaluateActivityCompatibility,
  hintMatchesAsPhrase,
  normalizeCompatibilityText,
  selectMaximalPhraseMatches,
  tokenizeCompatibilityText,
} from "@/lib/learning/orchestrator/activity-intervention-compatibility";
import { selectActivityIntervention } from "@/lib/learning/orchestrator/activity-intervention-policy";
import { orchestrateFromLearnerState } from "@/lib/learning/orchestrator/diagnose";
import type { LearnerConceptMasterySummary } from "@/lib/learning/types";

function applicationSummary(
  conceptTitle: string,
): LearnerConceptMasterySummary {
  return {
    learnerId: "user-1",
    conceptId: "concept-1",
    conceptTitle,
    facets: {
      ...emptyFacetScores(),
      recognize: 0.7,
      explain: 0.65,
      apply: 0.2,
      retain: 0.5,
    },
    topicMastery: null,
    recentMissedCount: 0,
    evidenceSourceCounts: {
      quiz: 2,
      flashcard: 1,
      study_evaluate: 1,
      other: 0,
    },
    reviewCount: 4,
    lastReviewedAt: null,
    nextReviewAt: null,
  };
}

describe("2G-77 compatibility matching primitives", () => {
  it("normalizes separators without inventing tokens", () => {
    expect(normalizeCompatibilityText("  Computer Science / Software  ")).toBe(
      "computer science software",
    );
    expect(tokenizeCompatibilityText("computer science / software")).toEqual([
      "computer",
      "science",
      "software",
    ]);
  });

  it("matches contiguous phrases, not substring containment", () => {
    const tokens = tokenizeCompatibilityText("computer science");
    expect(hintMatchesAsPhrase("computer science", tokens)).toBe(true);
    expect(hintMatchesAsPhrase("science", tokens)).toBe(true); // token exists
    expect(hintMatchesAsPhrase("java", tokenizeCompatibilityText("javascript"))).toBe(
      false,
    );
    expect(
      hintMatchesAsPhrase("lab", tokenizeCompatibilityText("laboratory methods")),
    ).toBe(false);
    expect(
      hintMatchesAsPhrase("sql", tokenizeCompatibilityText("postgresql")),
    ).toBe(false);
    expect(
      hintMatchesAsPhrase("art", tokenizeCompatibilityText("partial credit")),
    ).toBe(false);
  });

  it("longest phrase outranks shorter overlapping tokens", () => {
    const own = [{ hint: "science", phraseLength: 1 }];
    const competitors = [{ hint: "computer science", phraseLength: 2 }];
    const selected = selectMaximalPhraseMatches(own, competitors);
    expect(selected.maxPhraseLength).toBe(2);
    expect(selected.ownMaximal).toHaveLength(0);
    expect(selected.competitorHasMaximal).toBe(true);
  });

  it("truth forbids substring containment matching", () => {
    const t = activityCompatibilityTruthSummary();
    expect(t.usesSubstringContainment).toBe(false);
    expect(t.prefersLongerPhraseMatches).toBe(true);
    expect(t.guessesWhenInsufficient).toBe(false);
  });
});

describe("2G-77 computer science / science regression", () => {
  it("computer science does NOT MATCH Lab via science substring/token alone", () => {
    const lab = getActivityInterventionCapability("lab")!;
    const result = evaluateActivityCompatibility(lab, {
      conceptTitle: "Intro",
      subjectDomain: "computer science",
    });
    expect(result.status).toBe("NO_MATCH");
    expect(result.reason).toBe("subject_domain_matches_other_activity_family");
  });

  it("computer science MATCHES Coding via explicit phrase hint", () => {
    const coding = getActivityInterventionCapability("coding")!;
    const result = evaluateActivityCompatibility(coding, {
      conceptTitle: "Intro",
      subjectDomain: "computer science",
    });
    expect(result.status).toBe("MATCH");
    expect(result.strength).toBe(2);
    expect(result.matchedTokens.some((t) => /computer science/i.test(t))).toBe(
      true,
    );
  });

  it("public selection path: computer science → Coding, not Lab", () => {
    const selected = selectActivityIntervention({
      diagnosis: "APPLICATION_GAP",
      conceptId: "concept-1",
      conceptTitle: "Week 3",
      subjectDomain: "computer science",
      intentPurpose: "PRACTICE",
    });
    expect(selected?.adapterKey).toBe("coding");
    expect(selected?.adapterKey).not.toBe("lab");
  });

  it("orchestrateFromLearnerState: computer science selects Coding after diagnosis", () => {
    const result = orchestrateFromLearnerState(
      applicationSummary("Algorithms"),
      {
        subjectDomain: "computer science",
        intent: createExplicitLearningIntent({ purpose: "PRACTICE" }),
      },
    );
    expect(result.diagnosis).toBe("APPLICATION_GAP");
    expect(result.intervention?.kind).toBe("six");
    expect(result.activityIntervention?.adapterKey).toBe("coding");
  });
});

describe("2G-77 substring collision boundaries (registry hints)", () => {
  it("java does not match inside javascript token", () => {
    const coding = getActivityInterventionCapability("coding")!;
    // Domain is only the word javascript — matches via "javascript" hint, not "java"
    const js = evaluateActivityCompatibility(coding, {
      conceptTitle: "x",
      subjectDomain: "javascript",
    });
    expect(js.status).toBe("MATCH");
    expect(js.matchedTokens).toContain("javascript");
    expect(js.matchedTokens).not.toContain("java");

    // Title containing javascript should not fire bare "java" as the sole reason
    const titleOnly = evaluateActivityCompatibility(coding, {
      conceptTitle: "Modern Javascript Patterns",
    });
    expect(titleOnly.status).toBe("MATCH");
  });

  it("lab does not match laboratory as a substring", () => {
    const lab = getActivityInterventionCapability("lab")!;
    expect(
      evaluateActivityCompatibility(lab, {
        conceptTitle: "x",
        subjectDomain: "laboratory methods",
      }).status,
    ).toBe("INSUFFICIENT_CONTEXT");
  });

  it("sql does not match inside unrelated identifiers", () => {
    const sql = getActivityInterventionCapability("sql")!;
    expect(
      evaluateActivityCompatibility(sql, {
        conceptTitle: "x",
        subjectDomain: "nosql-ish",
      }).status,
    ).toBe("INSUFFICIENT_CONTEXT");
  });

  it("standalone science domain still MATCHES Lab", () => {
    const lab = getActivityInterventionCapability("lab")!;
    expect(
      evaluateActivityCompatibility(lab, {
        conceptTitle: "x",
        subjectDomain: "science",
      }).status,
    ).toBe("MATCH");
  });
});

describe("2G-77 legitimate matches preserved", () => {
  it("javascript programming → Coding", () => {
    expect(
      selectActivityIntervention({
        diagnosis: "APPLICATION_GAP",
        conceptId: "c1",
        conceptTitle: "Functions",
        subjectDomain: "javascript programming",
        intentPurpose: "PRACTICE",
      })?.adapterKey,
    ).toBe("coding");
  });

  it("sql / database → SQL", () => {
    expect(
      selectActivityIntervention({
        diagnosis: "APPLICATION_GAP",
        conceptId: "c1",
        conceptTitle: "Queries",
        subjectDomain: "sql database",
        intentPurpose: "PRACTICE",
      })?.adapterKey,
    ).toBe("sql");
  });

  it("chemistry → Lab", () => {
    expect(
      selectActivityIntervention({
        diagnosis: "APPLICATION_GAP",
        conceptId: "c1",
        conceptTitle: "Unit 2",
        subjectDomain: "chemistry",
        intentPurpose: "PRACTICE",
      })?.adapterKey,
    ).toBe("lab");
  });

  it("unrecognized domain → no activity (SIX path at orchestrator)", () => {
    const selected = selectActivityIntervention({
      diagnosis: "APPLICATION_GAP",
      conceptId: "c1",
      conceptTitle: "JavaScript Functions",
      subjectDomain: "medieval history",
      intentPurpose: "PRACTICE",
    });
    expect(selected).toBeNull();

    const orch = orchestrateFromLearnerState(
      applicationSummary("JavaScript Functions"),
      {
        subjectDomain: "medieval history",
        intent: createExplicitLearningIntent({ purpose: "PRACTICE" }),
      },
    );
    expect(orch.diagnosis).toBe("APPLICATION_GAP");
    expect(orch.activityIntervention).toBeUndefined();
    expect(orch.intervention?.kind).toBe("six");
  });

  it("same domain inputs remain deterministic", () => {
    const input = {
      diagnosis: "APPLICATION_GAP" as const,
      conceptId: "c1",
      conceptTitle: "Week 1",
      subjectDomain: "computer science",
      intentPurpose: "PRACTICE" as const,
    };
    expect(selectActivityIntervention(input)?.adapterKey).toBe(
      selectActivityIntervention(input)?.adapterKey,
    );
  });
});

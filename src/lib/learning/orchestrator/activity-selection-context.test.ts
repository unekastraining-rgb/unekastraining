/**
 * 2G-74 — Adaptive Activity Selection & Context Quality tests.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import { createExplicitLearningIntent } from "@/lib/learning/intent/project";
import { emptyFacetScores } from "@/lib/learning/mastery/facets";
import {
  getActivityInterventionCapability,
  listActivityInterventionCapabilities,
} from "@/lib/learning/orchestrator/activity-intervention-capability";
import {
  activityCompatibilityTruthSummary,
  evaluateActivityCompatibility,
} from "@/lib/learning/orchestrator/activity-intervention-compatibility";
import {
  activityRankingTruthSummary,
  pickTopRankedActivityCandidate,
  rankActivityInterventionCandidates,
} from "@/lib/learning/orchestrator/activity-intervention-ranking";
import {
  activityInterventionPolicyTruthSummary,
  evaluateCapabilityCompatibilityForSituation,
  isCapabilityAvailableForSituation,
  isCapabilityLegalForSituation,
  resolveLegalActivityInterventionCandidates,
  resolveRankedActivityInterventionCandidates,
  selectActivityIntervention,
  withActivityInterventionSuggestion,
} from "@/lib/learning/orchestrator/activity-intervention-policy";
import { orchestrateFromLearnerState } from "@/lib/learning/orchestrator/diagnose";
import { isAdaptiveReadyActivityAdapterKey } from "@/lib/learning/sequence/activity-adaptive-completion";
import type { LearnerConceptMasterySummary } from "@/lib/learning/types";

function summary(
  partial: Omit<Partial<LearnerConceptMasterySummary>, "facets"> & {
    facets?: Partial<LearnerConceptMasterySummary["facets"]>;
    conceptTitle?: string;
  },
): LearnerConceptMasterySummary {
  return {
    learnerId: "user-1",
    conceptId: "concept-1",
    conceptTitle: partial.conceptTitle ?? "Cell Biology",
    facets: { ...emptyFacetScores(), ...partial.facets },
    topicMastery: null,
    recentMissedCount: 0,
    evidenceSourceCounts: {
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

const applicationGap = summary({
  conceptTitle: "JavaScript Functions",
  facets: { recognize: 0.7, explain: 0.65, apply: 0.2, retain: 0.5 },
});

function practiceInput(
  overrides: Partial<{
    conceptTitle: string;
    topicName: string | null;
    subjectDomain: string | null;
    conceptId: string;
    diagnosis: "APPLICATION_GAP";
  }> = {},
) {
  return {
    diagnosis: "APPLICATION_GAP" as const,
    conceptId: overrides.conceptId ?? "concept-1",
    conceptTitle: overrides.conceptTitle ?? "JavaScript Functions",
    topicName: overrides.topicName,
    subjectDomain: overrides.subjectDomain,
    intentPurpose: "PRACTICE" as const,
  };
}

describe("2G-74 capability / Adaptive-ready", () => {
  it("recognizes Adaptive-ready activities", () => {
    for (const key of [
      "coding",
      "sql",
      "lab",
      "simulation",
      "presentation",
      "writing",
    ] as const) {
      expect(isAdaptiveReadyActivityAdapterKey(key)).toBe(true);
      expect(getActivityInterventionCapability(key)?.adaptiveBindIntegrated).toBe(
        true,
      );
      expect(getActivityInterventionCapability(key)?.interventionEligible).toBe(
        true,
      );
    }
  });

  it("rejects assessment-only for universal selection; Game/Project Adaptive-ready (2P-30)", () => {
    for (const key of ["quiz", "flashcard"] as const) {
      expect(isAdaptiveReadyActivityAdapterKey(key)).toBe(false);
      expect(
        isCapabilityLegalForSituation(
          getActivityInterventionCapability(key)!,
          practiceInput(),
        ),
      ).toBe(false);
    }
    expect(isAdaptiveReadyActivityAdapterKey("game")).toBe(true);
    expect(isAdaptiveReadyActivityAdapterKey("project")).toBe(true);
  });
});

describe("2G-74 compatibility", () => {
  it("Coding MATCH on programming title cues", () => {
    const r = evaluateActivityCompatibility(
      getActivityInterventionCapability("coding")!,
      { conceptTitle: "JavaScript Functions" },
    );
    expect(r.status).toBe("MATCH");
    expect(r.strength).toBe(1);
    expect(r.matchedTokens.length).toBeGreaterThan(0);
  });

  it("Coding MATCH on authoritative subjectDomain", () => {
    const r = evaluateActivityCompatibility(
      getActivityInterventionCapability("coding")!,
      {
        conceptTitle: "Week 3 Lesson",
        subjectDomain: "computer science / software",
      },
    );
    expect(r.status).toBe("MATCH");
    expect(r.strength).toBe(2);
    expect(r.reason).toBe("subject_domain_match");
  });

  it("SQL MATCH on database context", () => {
    expect(
      evaluateActivityCompatibility(getActivityInterventionCapability("sql")!, {
        conceptTitle: "Relational database queries",
      }).status,
    ).toBe("MATCH");
    expect(
      evaluateActivityCompatibility(getActivityInterventionCapability("sql")!, {
        conceptTitle: "Intro",
        subjectDomain: "SQL",
      }).status,
    ).toBe("MATCH");
  });

  it("Lab MATCH on science/lab context", () => {
    expect(
      evaluateActivityCompatibility(getActivityInterventionCapability("lab")!, {
        conceptTitle: "Density lab experiment",
      }).status,
    ).toBe("MATCH");
    expect(
      evaluateActivityCompatibility(getActivityInterventionCapability("lab")!, {
        conceptTitle: "Unit 2",
        subjectDomain: "chemistry",
      }).status,
    ).toBe("MATCH");
  });

  it("Simulation MATCH on economics/scenario context", () => {
    expect(
      evaluateActivityCompatibility(
        getActivityInterventionCapability("simulation")!,
        { conceptTitle: "Supply and demand markets" },
      ).status,
    ).toBe("MATCH");
  });

  it("Presentation MATCH on presentation/performance context", () => {
    expect(
      evaluateActivityCompatibility(
        getActivityInterventionCapability("presentation")!,
        { conceptTitle: "Audience speech outline" },
      ).status,
    ).toBe("MATCH");
  });

  it("NO_MATCH when subjectDomain belongs to another activity family", () => {
    const coding = evaluateActivityCompatibility(
      getActivityInterventionCapability("coding")!,
      { conceptTitle: "Anything", subjectDomain: "sql database" },
    );
    expect(coding.status).toBe("NO_MATCH");
    expect(coding.reason).toBe("subject_domain_matches_other_activity_family");

    const sqlOnChem = evaluateActivityCompatibility(
      getActivityInterventionCapability("sql")!,
      { conceptTitle: "Anything", subjectDomain: "biology lab" },
    );
    expect(sqlOnChem.status).toBe("NO_MATCH");
  });

  it("INSUFFICIENT_CONTEXT when no cues and no guessing", () => {
    const r = evaluateActivityCompatibility(
      getActivityInterventionCapability("coding")!,
      { conceptTitle: "Photosynthesis" },
    );
    expect(r.status).toBe("INSUFFICIENT_CONTEXT");
    expect(activityCompatibilityTruthSummary().guessesWhenInsufficient).toBe(
      false,
    );
  });

  it("INSUFFICIENT_CONTEXT when subjectDomain is unrecognized", () => {
    const r = evaluateActivityCompatibility(
      getActivityInterventionCapability("coding")!,
      {
        conceptTitle: "JavaScript Functions",
        subjectDomain: "medieval history",
      },
    );
    expect(r.status).toBe("INSUFFICIENT_CONTEXT");
    expect(r.reason).toBe("subject_domain_unrecognized");
  });

  it("truth: compatibility does not write evidence/mastery or contaminate diagnosis", () => {
    const t = activityCompatibilityTruthSummary();
    expect(t.contaminatesDiagnosis).toBe(false);
    expect(t.writesEvidence).toBe(false);
    expect(t.writesMastery).toBe(false);
    expect(t.prefersSubjectDomainOverTitle).toBe(true);
    expect(t.usesSubstringContainment).toBe(false);
    expect(t.prefersLongerPhraseMatches).toBe(true);
  });
});

describe("2G-74 diagnosis integrity", () => {
  it("diagnosis unchanged when activity context varies", () => {
    const a = orchestrateFromLearnerState(applicationGap, {
      topicName: "JavaScript Functions",
      subjectDomain: "computer science",
    });
    const b = orchestrateFromLearnerState(applicationGap, {
      topicName: "Unrelated",
      subjectDomain: "medieval history",
    });
    const c = orchestrateFromLearnerState(applicationGap);
    expect(a.diagnosis).toBe("APPLICATION_GAP");
    expect(b.diagnosis).toBe("APPLICATION_GAP");
    expect(c.diagnosis).toBe("APPLICATION_GAP");
    expect(a.intervention?.kind).toBe("six");
    expect(b.intervention?.kind).toBe("six");
  });

  it("activity availability cannot create APPLICATION_GAP", () => {
    const strong = summary({
      conceptTitle: "JavaScript Functions",
      facets: {
        recognize: 0.8,
        explain: 0.8,
        apply: 0.8,
        solve: 0.7,
        perform: 0.7,
        retain: 0.75,
      },
    });
    const result = orchestrateFromLearnerState(strong, {
      subjectDomain: "computer science",
      intent: createExplicitLearningIntent({ purpose: "PRACTICE" }),
    });
    expect(result.diagnosis).not.toBe("APPLICATION_GAP");
  });
});

describe("2G-74 APPLICATION_GAP lane", () => {
  it("compatible coding activity can produce activityIntervention", () => {
    const selected = selectActivityIntervention(practiceInput());
    expect(selected?.adapterKey).toBe("coding");
  });

  it("insufficient context falls back to SIX (no activity)", () => {
    expect(
      selectActivityIntervention(
        practiceInput({ conceptTitle: "Photosynthesis" }),
      ),
    ).toBeNull();
    const orch = orchestrateFromLearnerState(
      summary({
        conceptTitle: "Photosynthesis",
        facets: { recognize: 0.7, explain: 0.65, apply: 0.2, retain: 0.5 },
      }),
      { intent: createExplicitLearningIntent({ purpose: "PRACTICE" }) },
    );
    expect(orch.diagnosis).toBe("APPLICATION_GAP");
    expect(orch.intervention?.kind).toBe("six");
    expect(orch.activityIntervention).toBeUndefined();
  });

  it("incompatible / unrecognized subjectDomain falls back to SIX", () => {
    // Authoritative domain present but unrecognized → no activity (even with coding title).
    expect(
      selectActivityIntervention(
        practiceInput({
          conceptTitle: "JavaScript Functions",
          subjectDomain: "medieval history",
        }),
      ),
    ).toBeNull();

    // Domain owned by another family → coding is NO_MATCH (sql may still win).
    expect(
      evaluateCapabilityCompatibilityForSituation(
        getActivityInterventionCapability("coding")!,
        practiceInput({
          conceptTitle: "JavaScript Functions",
          subjectDomain: "sql database",
        }),
      ).status,
    ).toBe("NO_MATCH");
  });

  it("unavailable without conceptId falls back", () => {
    expect(
      selectActivityIntervention(practiceInput({ conceptId: "  " })),
    ).toBeNull();
    expect(
      isCapabilityAvailableForSituation(
        getActivityInterventionCapability("coding")!,
        practiceInput({ conceptId: "  " }),
      ),
    ).toBe(false);
  });

  it("SQL preferred when subjectDomain is SQL even if title mentions code", () => {
    const selected = selectActivityIntervention(
      practiceInput({
        conceptTitle: "Writing code for queries",
        subjectDomain: "SQL",
      }),
    );
    expect(selected?.adapterKey).toBe("sql");
  });
});

describe("2G-74 understanding / recall / retention / insufficient / none", () => {
  it("UNDERSTANDING_GAP remains SIX-first with no activity", () => {
    const input = {
      diagnosis: "UNDERSTANDING_GAP" as const,
      conceptId: "concept-1",
      conceptTitle: "JavaScript Functions",
      intentPurpose: "PRACTICE" as const,
    };
    expect(resolveLegalActivityInterventionCandidates(input)).toHaveLength(0);
    expect(selectActivityIntervention(input)).toBeNull();
  });

  it("RECALL_GAP / RETENTION_GAP stay retrieval/retention — no Universal Activity", () => {
    for (const diagnosis of ["RECALL_GAP", "RETENTION_GAP"] as const) {
      expect(
        selectActivityIntervention({
          diagnosis,
          conceptId: "concept-1",
          conceptTitle: "JavaScript Functions",
          intentPurpose: "PRACTICE",
        }),
      ).toBeNull();
    }
  });

  it("INSUFFICIENT_EVIDENCE and NO_INTERVENTION select no activity", () => {
    for (const diagnosis of [
      "INSUFFICIENT_EVIDENCE",
      "NO_INTERVENTION",
    ] as const) {
      expect(
        selectActivityIntervention({
          diagnosis,
          conceptId: "concept-1",
          conceptTitle: "JavaScript Functions",
          intentPurpose: "PRACTICE",
        }),
      ).toBeNull();
    }
  });
});

describe("2G-74 intent soft preference", () => {
  it("PRACTICE unlocks compatible activity; cannot override UNDERSTANDING_GAP", () => {
    expect(selectActivityIntervention(practiceInput())?.adapterKey).toBe(
      "coding",
    );
    const understanding = orchestrateFromLearnerState(
      summary({
        conceptTitle: "JavaScript Functions",
        facets: { recognize: 0.2, explain: 0.15, apply: 0.5, retain: 0.4 },
      }),
      { intent: createExplicitLearningIntent({ purpose: "PRACTICE" }) },
    );
    expect(understanding.diagnosis).toBe("UNDERSTANDING_GAP");
    expect(understanding.activityIntervention).toBeUndefined();
  });

  it("UNDERSTAND does not force an activity", () => {
    const orch = orchestrateFromLearnerState(applicationGap, {
      topicName: "JavaScript Functions",
      intent: createExplicitLearningIntent({ purpose: "UNDERSTAND" }),
    });
    expect(orch.diagnosis).toBe("APPLICATION_GAP");
    expect(orch.activityIntervention).toBeUndefined();
  });

  it("ASSESS remains Assessment workflow; CREATE stays specialized", () => {
    for (const purpose of ["ASSESS", "CREATE"] as const) {
      expect(
        selectActivityIntervention({
          ...practiceInput(),
          intentPurpose: purpose,
        }),
      ).toBeNull();
    }
    const assess = orchestrateFromLearnerState(applicationGap, {
      topicName: "JavaScript Functions",
      intent: createExplicitLearningIntent({ purpose: "ASSESS" }),
    });
    expect(assess.assessmentHandoff).toEqual({ purpose: "ASSESS" });
    expect(assess.activityIntervention).toBeUndefined();
    expect(assess.decisionContext?.intent?.purpose).toBe("ASSESS");
    expect(assess.intervention?.kind).toBe("six");
  });
});

describe("2G-74 ranking", () => {
  it("same inputs produce the same selected activity", () => {
    const a = selectActivityIntervention(practiceInput());
    const b = selectActivityIntervention(practiceInput());
    expect(a?.adapterKey).toBe(b?.adapterKey);
    expect(a?.adapterKey).toBe("coding");
  });

  it("subjectDomain strength outranks title-only competing cues", () => {
    const coding = getActivityInterventionCapability("coding")!;
    const sql = getActivityInterventionCapability("sql")!;
    const ranked = rankActivityInterventionCandidates([
      {
        capability: coding,
        compatibility: evaluateActivityCompatibility(coding, {
          conceptTitle: "SQL query programming",
        }),
      },
      {
        capability: sql,
        compatibility: evaluateActivityCompatibility(sql, {
          conceptTitle: "Intro",
          subjectDomain: "SQL database",
        }),
      },
    ]);
    expect(ranked[0]?.capability.adapterKey).toBe("sql");
    expect(ranked[0]?.compatibility.strength).toBe(2);
    expect(activityRankingTruthSummary().deterministic).toBe(true);
    expect(activityRankingTruthSummary().llmSelection).toBe(false);
  });

  it("multiple title matches resolve by token count then registry order", () => {
    const coding = getActivityInterventionCapability("coding")!;
    const sql = getActivityInterventionCapability("sql")!;
    const context = {
      conceptTitle: "SQL database query select table",
    };
    const top = pickTopRankedActivityCandidate([
      {
        capability: coding,
        compatibility: evaluateActivityCompatibility(coding, context),
      },
      {
        capability: sql,
        compatibility: evaluateActivityCompatibility(sql, context),
      },
    ]);
    // SQL has more matching hints in this title (sql, database, query, select, table).
    expect(top?.capability.adapterKey).toBe("sql");
  });

  it("ranked resolver order is stable across calls", () => {
    const input = practiceInput({
      conceptTitle: "SQL database programming",
    });
    const first = resolveRankedActivityInterventionCandidates(input).map(
      (c) => c.capability.adapterKey,
    );
    const second = resolveRankedActivityInterventionCandidates(input).map(
      (c) => c.capability.adapterKey,
    );
    expect(first).toEqual(second);
  });
});

describe("2G-74 availability / Adaptive integrity", () => {
  it("compatibility MATCH can still fail availability", () => {
    const coding = getActivityInterventionCapability("coding")!;
    expect(
      evaluateCapabilityCompatibilityForSituation(coding, practiceInput())
        .status,
    ).toBe("MATCH");
    expect(
      isCapabilityAvailableForSituation(
        coding,
        practiceInput({ conceptId: "" }),
      ),
    ).toBe(false);
  });

  it("selected activity is Adaptive-ready; policy does not write evidence/mastery", () => {
    const selected = selectActivityIntervention(practiceInput());
    expect(selected).not.toBeNull();
    expect(isAdaptiveReadyActivityAdapterKey(selected!.adapterKey)).toBe(true);
    const t = activityInterventionPolicyTruthSummary();
    expect(t.createsLearningAttempt).toBe(false);
    expect(t.createsConceptMastery).toBe(false);
    expect(t.layersSeparated).toBe(true);
    expect(t.insufficientContextAutoSelects).toBe(false);
  });

  it("client-supplied adapter identity cannot bypass server selection", () => {
    const orch = orchestrateFromLearnerState(
      summary({
        conceptTitle: "Photosynthesis",
        facets: { recognize: 0.7, explain: 0.65, apply: 0.2, retain: 0.5 },
      }),
      {
        topicName: "Photosynthesis",
        intent: createExplicitLearningIntent({ purpose: "PRACTICE" }),
      },
    );
    // Even if a client wished for coding, insufficient context yields no activity.
    expect(orch.activityIntervention).toBeUndefined();
    const forced = withActivityInterventionSuggestion(orch, {
      topicName: "Photosynthesis",
      subjectDomain: null,
    });
    expect(forced.activityIntervention).toBeUndefined();
    expect(forced.diagnosis).toBe(orch.diagnosis);
  });

  it("source: selector and diagnose do not write LearningAttempt/ConceptMastery", () => {
    const root = process.cwd();
    for (const rel of [
      "src/lib/learning/orchestrator/activity-intervention-compatibility.ts",
      "src/lib/learning/orchestrator/activity-intervention-ranking.ts",
      "src/lib/learning/orchestrator/activity-intervention-policy.ts",
    ]) {
      const src = readFileSync(path.join(root, rel), "utf8");
      expect(src).not.toMatch(/learningAttempt\.create|conceptMastery\.upsert/);
    }
    const diagnose = readFileSync(
      path.join(root, "src/lib/learning/orchestrator/diagnose.ts"),
      "utf8",
    );
    expect(diagnose).not.toContain("PERFORM_GAP");
    expect(diagnose).toMatch(/subjectDomain/);
  });

  it("registry lists product activities; Game/Project Adaptive-ready (2P-30)", () => {
    const keys = listActivityInterventionCapabilities().map((c) => c.adapterKey);
    expect(keys).toEqual(
      expect.arrayContaining([
        "coding",
        "sql",
        "lab",
        "game",
        "writing",
        "project",
        "quiz",
      ]),
    );
    expect(getActivityInterventionCapability("game")?.adaptiveBindIntegrated).toBe(
      true,
    );
    expect(
      getActivityInterventionCapability("project")?.adaptiveBindIntegrated,
    ).toBe(true);
  });
});

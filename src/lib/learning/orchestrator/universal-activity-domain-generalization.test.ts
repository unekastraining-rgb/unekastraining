/**
 * 2P-5 — Universal Activity domain generalization.
 *
 * Proves new/unlisted domains flow through existing capability → compatibility →
 * policy without requiring a new learning engine, subject taxonomy, or fabricated activity.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import { createExplicitLearningIntent } from "@/lib/learning/intent/project";
import { emptyFacetScores } from "@/lib/learning/mastery/facets";
import {
  ACTIVITY_INTERVENTION_CAPABILITIES,
  activityCapabilityTruthSummary,
  getActivityInterventionCapability,
  listCapabilitiesSupportingCharacteristic,
  listActivityInterventionCapabilities,
} from "@/lib/learning/orchestrator/activity-intervention-capability";
import {
  evaluateActivityCompatibility,
} from "@/lib/learning/orchestrator/activity-intervention-compatibility";
import {
  selectActivityIntervention,
  withActivityInterventionSuggestion,
} from "@/lib/learning/orchestrator/activity-intervention-policy";
import { orchestrateFromLearnerState } from "@/lib/learning/orchestrator/diagnose";
import {
  ADAPTIVE_READY_ACTIVITY_KEYS,
  PRODUCT_READY_NOT_ADAPTIVE_KEYS,
} from "@/lib/learning/decision-loop";
import { isAdaptiveReadyActivityAdapterKey } from "@/lib/learning/sequence/activity-adaptive-completion";
import type { LearnerConceptMasterySummary } from "@/lib/learning/types";

const root = process.cwd();

function read(rel: string) {
  return readFileSync(path.join(root, rel), "utf8");
}

function applicationGapSummary(
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

function practiceSelect(input: {
  conceptTitle: string;
  subjectDomain: string | null;
  topicName?: string | null;
}) {
  return selectActivityIntervention({
    diagnosis: "APPLICATION_GAP",
    conceptId: "concept-1",
    conceptTitle: input.conceptTitle,
    topicName: input.topicName ?? null,
    subjectDomain: input.subjectDomain,
    intentPurpose: "PRACTICE",
  });
}

function orchWithDomain(conceptTitle: string, subjectDomain: string | null) {
  const base = orchestrateFromLearnerState(
    applicationGapSummary(conceptTitle),
  );
  return withActivityInterventionSuggestion(
    {
      ...base,
      decisionContext: {
        intent: createExplicitLearningIntent({ purpose: "PRACTICE" }),
      },
    },
    { subjectDomain },
  );
}

describe("2P-5 Universal Activity domain generalization", () => {
  it("capabilities declare learning characteristics without becoming subject engines", () => {
    const truth = activityCapabilityTruthSummary();
    expect(truth.requiresSubjectTaxonomy).toBe(false);
    expect(truth.activitiesAreSubjectEngines).toBe(false);
    expect(truth.replacesSix).toBe(false);
    expect(truth.contaminatesDiagnosis).toBe(false);

    for (const cap of listActivityInterventionCapabilities()) {
      expect(Array.isArray(cap.supportsLearningCharacteristics)).toBe(true);
      expect(cap.supportsLearningCharacteristics.length).toBeGreaterThan(0);
    }

    const scenario = listCapabilitiesSupportingCharacteristic("scenario_reasoning");
    expect(scenario.some((c) => c.adapterKey === "simulation")).toBe(true);
    const procedural = listCapabilitiesSupportingCharacteristic(
      "procedural_execution",
    );
    expect(procedural.some((c) => c.adapterKey === "lab")).toBe(true);
  });

  it("Networking domain: specialized workspace matches; other families NO_MATCH (2P-40)", () => {
    const coding = getActivityInterventionCapability("coding")!;
    const sim = getActivityInterventionCapability("simulation")!;
    const lab = getActivityInterventionCapability("lab")!;
    const networking = getActivityInterventionCapability("networking")!;

    for (const cap of [coding, sim, lab]) {
      const compat = evaluateActivityCompatibility(cap, {
        conceptTitle: "Diagnose subnet connectivity",
        subjectDomain: "networking",
      });
      expect(compat.status).toBe("NO_MATCH");
      expect(compat.reason).toBe(
        "subject_domain_matches_other_activity_family",
      );
    }

    expect(
      evaluateActivityCompatibility(networking, {
        conceptTitle: "Diagnose subnet connectivity",
        subjectDomain: "networking",
      }).status,
    ).toBe("MATCH");

    const selected = practiceSelect({
      conceptTitle: "Diagnose subnet connectivity",
      subjectDomain: "networking",
    });
    expect(selected?.adapterKey).toBe("networking");

    const orch = orchWithDomain(
      "Diagnose subnet connectivity",
      "networking",
    );
    expect(orch.diagnosis).toBe("APPLICATION_GAP");
    expect(orch.activityIntervention?.adapterKey).toBe("networking");
  });

  it("Electrical domain: Simulation/Lab capability evaluable; no subject map required", () => {
    const lab = getActivityInterventionCapability("lab")!;
    expect(lab.supportsLearningCharacteristics).toContain("troubleshooting");
    expect(lab.supportsLearningCharacteristics).toContain("procedural_execution");

    const compat = evaluateActivityCompatibility(lab, {
      conceptTitle: "Diagnose circuit fault",
      subjectDomain: "electrical",
    });
    expect(compat.status).toBe("INSUFFICIENT_CONTEXT");

    // Mechanism cue in title (not a domain→activity map):
    const procedureMatch = evaluateActivityCompatibility(lab, {
      conceptTitle: "Lab procedure for circuit measurement",
      subjectDomain: null,
    });
    expect(procedureMatch.status).toBe("MATCH");

    const selected = practiceSelect({
      conceptTitle: "Diagnose circuit fault",
      subjectDomain: "electrical",
    });
    expect(selected).toBeNull();
  });

  it("Nursing domain: Simulation mechanism supports scenario_reasoning; domain alone does not auto-select", () => {
    const sim = getActivityInterventionCapability("simulation")!;
    expect(sim.supportsLearningCharacteristics).toContain("scenario_reasoning");
    expect(sim.supportsLearningCharacteristics).toContain("decision_making");

    expect(
      evaluateActivityCompatibility(sim, {
        conceptTitle: "Prioritize patient triage",
        subjectDomain: "nursing",
      }).status,
    ).toBe("INSUFFICIENT_CONTEXT");

    expect(
      practiceSelect({
        conceptTitle: "Prioritize patient triage",
        subjectDomain: "nursing",
      }),
    ).toBeNull();

    // Mechanism cue without inventing a nursing enum:
    expect(
      evaluateActivityCompatibility(sim, {
        conceptTitle: "Clinical decision scenario practice",
        subjectDomain: null,
      }).status,
    ).toBe("MATCH");
  });

  it("Unknown domain safety: no crash, no fabricate, SIX remains", () => {
    const domain = "xyz-unknown-domain-42";
    for (const cap of ACTIVITY_INTERVENTION_CAPABILITIES.filter(
      (c) => c.interventionEligible && c.contextHints.length > 0,
    )) {
      const compat = evaluateActivityCompatibility(cap, {
        conceptTitle: "Some future concept",
        subjectDomain: domain,
      });
      expect(compat.status).toBe("INSUFFICIENT_CONTEXT");
    }

    const orch = orchWithDomain("Some future concept", domain);
    expect(orch.diagnosis).toBe("APPLICATION_GAP");
    expect(orch.intervention?.kind).toBe("six");
    expect(orch.activityIntervention).toBeUndefined();
  });

  it("Same mechanism, different domains: Simulation characteristic list is domain-agnostic", () => {
    const sim = getActivityInterventionCapability("simulation")!;
    const domains = ["economics", "nursing", "networking", "history"];
    for (const subjectDomain of domains) {
      // Capability still exists and can be evaluated for every domain string.
      const result = evaluateActivityCompatibility(sim, {
        conceptTitle: "Apply a scenario",
        subjectDomain,
      });
      expect(["MATCH", "NO_MATCH", "INSUFFICIENT_CONTEXT"]).toContain(
        result.status,
      );
    }
    expect(sim.activityType).toBe("SIMULATION");
  });

  it("Same domain, multiple mechanisms: CS can match Coding; Lab rejects CS family", () => {
    const coding = getActivityInterventionCapability("coding")!;
    const lab = getActivityInterventionCapability("lab")!;
    expect(
      evaluateActivityCompatibility(coding, {
        conceptTitle: "JavaScript Functions",
        subjectDomain: "computer science",
      }).status,
    ).toBe("MATCH");
    expect(
      evaluateActivityCompatibility(lab, {
        conceptTitle: "JavaScript Functions",
        subjectDomain: "computer science",
      }).status,
    ).toBe("NO_MATCH");
  });

  it("Domain change does not change diagnosis", () => {
    const base = applicationGapSummary("JavaScript Functions");
    const d1 = orchestrateFromLearnerState(base).diagnosis;
    const d2 = orchWithDomain("JavaScript Functions", "nursing").diagnosis;
    const d3 = orchWithDomain("JavaScript Functions", "computer science")
      .diagnosis;
    expect(d1).toBe("APPLICATION_GAP");
    expect(d2).toBe(d1);
    expect(d3).toBe(d1);
  });

  it("Authoritative domain wins over title cues (no inventing domain from title)", () => {
    const coding = getActivityInterventionCapability("coding")!;
    const result = evaluateActivityCompatibility(coding, {
      conceptTitle: "JavaScript Functions",
      subjectDomain: "nursing",
    });
    expect(result.status).toBe("INSUFFICIENT_CONTEXT");
    expect(result.reason).toBe("subject_domain_unrecognized");
  });

  it("Determinism: identical inputs → identical selection", () => {
    const a = practiceSelect({
      conceptTitle: "JavaScript Functions",
      subjectDomain: "computer science",
    });
    const b = practiceSelect({
      conceptTitle: "JavaScript Functions",
      subjectDomain: "computer science",
    });
    expect(a?.adapterKey).toBe("coding");
    expect(b?.adapterKey).toBe(a?.adapterKey);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("Adaptive-ready inventory includes game/project (2P-30)", () => {
    for (const key of ADAPTIVE_READY_ACTIVITY_KEYS) {
      expect(isAdaptiveReadyActivityAdapterKey(key)).toBe(true);
    }
    expect([...PRODUCT_READY_NOT_ADAPTIVE_KEYS]).toEqual([]);
    expect(ADAPTIVE_READY_ACTIVITY_KEYS).toContain("game");
    expect(ADAPTIVE_READY_ACTIVITY_KEYS).toContain("project");
    expect(PRODUCT_READY_NOT_ADAPTIVE_KEYS).not.toContain("writing");
  });

  it("SIX remains first-class; Assessment remains separate; no subject engines", () => {
    expect(activityCapabilityTruthSummary().replacesSix).toBe(false);
    expect(activityCapabilityTruthSummary().quizIsGenericIntervention).toBe(
      false,
    );
    const quiz = getActivityInterventionCapability("quiz")!;
    expect(quiz.assessmentOnly).toBe(true);
    expect(quiz.interventionEligible).toBe(false);

    const schema = read("prisma/schema.prisma");
    expect(schema).toMatch(/subjectDomain\s+String\?/);
    expect(schema).not.toMatch(/enum SubjectDomain|enum LearningDomain/);

    expect(read("src/lib/learning/orchestrator/diagnose.ts")).not.toContain(
      "subjectDomain ===",
    );
  });

  it("Regression: Coding still auto-selects for CS APPLICATION_GAP + PRACTICE", () => {
    const selected = practiceSelect({
      conceptTitle: "JavaScript Functions",
      subjectDomain: "computer science",
    });
    expect(selected?.adapterKey).toBe("coding");
  });

  it("No second engines introduced in capability module", () => {
    const src = read(
      "src/lib/learning/orchestrator/activity-intervention-capability.ts",
    );
    expect(src).not.toMatch(/createTable|model DomainMastery|new Orchestrator/);
    expect(src).toContain("supportsLearningCharacteristics");
    expect(src).toContain("Activities are mechanisms");
  });
});

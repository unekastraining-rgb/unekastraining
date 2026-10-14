/**
 * 2G-72 — Activity intervention capability + policy tests.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import { createExplicitLearningIntent } from "@/lib/learning/intent/project";
import { emptyFacetScores } from "@/lib/learning/mastery/facets";
import {
  activityCapabilityTruthSummary,
  getActivityInterventionCapability,
  listActivityInterventionCapabilities,
} from "@/lib/learning/orchestrator/activity-intervention-capability";
import {
  activityInterventionPolicyTruthSummary,
  isCapabilityLegalForSituation,
  resolveLegalActivityInterventionCandidates,
  selectActivityIntervention,
  withActivityInterventionSuggestion,
} from "@/lib/learning/orchestrator/activity-intervention-policy";
import { orchestrateFromLearnerState } from "@/lib/learning/orchestrator/diagnose";
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

describe("2G-72 activity capability registry", () => {
  it("is deterministic and does not claim product-ready means selectable", () => {
    const list = listActivityInterventionCapabilities();
    expect(list.length).toBeGreaterThan(5);
    expect(activityCapabilityTruthSummary().productReadyMeansOrchestratorSelectable).toBe(
      false,
    );
    expect(activityCapabilityTruthSummary().replacesSix).toBe(false);
    expect(getActivityInterventionCapability("quiz")?.assessmentOnly).toBe(true);
    expect(getActivityInterventionCapability("writing")?.createOnly).toBe(false);
    expect(getActivityInterventionCapability("writing")?.interventionEligible).toBe(
      true,
    );
    expect(getActivityInterventionCapability("game")?.interventionEligible).toBe(
      true,
    );
    expect(getActivityInterventionCapability("project")?.interventionEligible).toBe(
      true,
    );
  });
});

describe("2G-72 activity intervention policy", () => {
  it("rejects unsupported / assessment-only / create-only for generic weakness", () => {
    const input = {
      diagnosis: "APPLICATION_GAP" as const,
      conceptId: "concept-1",
      conceptTitle: "JavaScript Functions",
      intentPurpose: "PRACTICE" as const,
    };
    expect(
      isCapabilityLegalForSituation(
        getActivityInterventionCapability("quiz")!,
        input,
      ),
    ).toBe(false);
    // 2P-18 — Writing is intervention-capable for APPLICATION_GAP + PRACTICE
    expect(
      isCapabilityLegalForSituation(
        getActivityInterventionCapability("writing")!,
        input,
      ),
    ).toBe(true);
    // 2P-30 — Game/Project Adaptive-ready and intervention-eligible
    expect(
      isCapabilityLegalForSituation(
        getActivityInterventionCapability("project")!,
        input,
      ),
    ).toBe(true);
    expect(
      isCapabilityLegalForSituation(
        getActivityInterventionCapability("game")!,
        input,
      ),
    ).toBe(true);
  });

  it("UNDERSTANDING_GAP does not auto-select Coding/SQL/Lab", () => {
    const input = {
      diagnosis: "UNDERSTANDING_GAP" as const,
      conceptId: "concept-1",
      conceptTitle: "JavaScript Functions",
      intentPurpose: "PRACTICE" as const,
    };
    expect(resolveLegalActivityInterventionCandidates(input)).toHaveLength(0);
    expect(selectActivityIntervention(input)).toBeNull();
  });

  it("RECALL_GAP / RETENTION_GAP / INSUFFICIENT / NO_INTERVENTION stay conservative", () => {
    for (const diagnosis of [
      "RECALL_GAP",
      "RETENTION_GAP",
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

  it("APPLICATION_GAP may select coding when PRACTICE + coding context", () => {
    const selected = selectActivityIntervention({
      diagnosis: "APPLICATION_GAP",
      conceptId: "concept-1",
      conceptTitle: "JavaScript Functions",
      topicName: "Intro to coding",
      intentPurpose: "PRACTICE",
    });
    expect(selected?.adapterKey).toBe("coding");
    expect(selected?.kind).toBe("activity");
    expect(selected?.href).toContain("/study/activities/coding");
    expect(selected?.reason.toLowerCase()).toContain("application");
  });

  it("APPLICATION_GAP without PRACTICE intent does not select coding", () => {
    expect(
      selectActivityIntervention({
        diagnosis: "APPLICATION_GAP",
        conceptId: "concept-1",
        conceptTitle: "JavaScript Functions",
        intentPurpose: null,
      }),
    ).toBeNull();
  });

  it("APPLICATION_GAP + PRACTICE without concept context does not select coding", () => {
    expect(
      selectActivityIntervention({
        diagnosis: "APPLICATION_GAP",
        conceptId: "concept-1",
        conceptTitle: "Photosynthesis",
        intentPurpose: "PRACTICE",
      }),
    ).toBeNull();
  });

  it("ASSESS / CREATE intents never unlock generic activity intervention", () => {
    for (const intentPurpose of ["ASSESS", "CREATE"] as const) {
      expect(
        selectActivityIntervention({
          diagnosis: "APPLICATION_GAP",
          conceptId: "concept-1",
          conceptTitle: "JavaScript Functions",
          intentPurpose,
        }),
      ).toBeNull();
    }
  });

  it("unavailable without conceptId", () => {
    expect(
      selectActivityIntervention({
        diagnosis: "APPLICATION_GAP",
        conceptId: "  ",
        conceptTitle: "JavaScript Functions",
        intentPurpose: "PRACTICE",
      }),
    ).toBeNull();
  });

  it("truth: policy does not write evidence/mastery or add PERFORM_GAP", () => {
    const t = activityInterventionPolicyTruthSummary();
    expect(t.mutatesDiagnosis).toBe(false);
    expect(t.replacesSixIntervention).toBe(false);
    expect(t.createsLearningAttempt).toBe(false);
    expect(t.createsConceptMastery).toBe(false);
    expect(t.performGapAdded).toBe(false);
    const diagnose = readFileSync(
      path.join(process.cwd(), "src/lib/learning/orchestrator/diagnose.ts"),
      "utf8",
    );
    expect(diagnose).not.toContain("PERFORM_GAP");
    expect(diagnose).not.toMatch(/recordEvidence|applyEvidenceToMastery/);
  });
});

describe("2G-72 orchestrateFromLearnerState integration", () => {
  it("preserves SIX intervention; adds activityIntervention only when legal", () => {
    const baseline = orchestrateFromLearnerState(applicationGap, {
      courseId: "c1",
      topicId: "t1",
      topicName: "JavaScript Functions",
    });
    expect(baseline.diagnosis).toBe("APPLICATION_GAP");
    expect(baseline.intervention?.kind).toBe("six");
    expect(baseline.intervention?.sixComponent).toBe("hands-on-practice");
    expect(baseline.activityIntervention).toBeUndefined();

    const withPractice = orchestrateFromLearnerState(applicationGap, {
      courseId: "c1",
      topicId: "t1",
      topicName: "JavaScript Functions",
      intent: createExplicitLearningIntent({ purpose: "PRACTICE" }),
    });
    expect(withPractice.diagnosis).toBe("APPLICATION_GAP");
    expect(withPractice.intervention?.sixComponent).toBe("hands-on-practice");
    expect(withPractice.activityIntervention?.adapterKey).toBe("coding");
  });

  it("intent cannot override UNDERSTANDING_GAP into coding", () => {
    const weak = summary({
      conceptTitle: "JavaScript Functions",
      facets: { recognize: 0.2, explain: 0.2, apply: 0.1, retain: 0.1 },
    });
    const result = orchestrateFromLearnerState(weak, {
      intent: createExplicitLearningIntent({ purpose: "PRACTICE" }),
      topicName: "JavaScript Functions",
    });
    expect(result.diagnosis).toBe("UNDERSTANDING_GAP");
    expect(result.intervention?.kind).toBe("six");
    expect(result.activityIntervention).toBeUndefined();
  });

  it("withActivityInterventionSuggestion never changes diagnosis", () => {
    const result = orchestrateFromLearnerState(applicationGap);
    const decorated = withActivityInterventionSuggestion(
      {
        ...result,
        decisionContext: {
          intent: createExplicitLearningIntent({ purpose: "PRACTICE" }),
        },
      },
      { topicName: "SQL queries" },
    );
    expect(decorated.diagnosis).toBe(result.diagnosis);
    expect(decorated.intervention?.sixComponent).toBe(
      result.intervention?.sixComponent,
    );
  });
});

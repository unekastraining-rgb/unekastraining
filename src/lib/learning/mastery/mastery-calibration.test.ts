/**
 * 2P-44 — Mastery calibration & evidence sufficiency tests.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  classifyEvidenceSufficiency,
  evidenceSufficiencyIsThin,
  evidenceSufficiencyLearnerLabel,
  evidenceSufficiencyTruthSummary,
  EVIDENCE_SUFFICIENCY_POLICY,
} from "@/lib/learning/evidence/evidence-sufficiency";
import {
  interpretConflictingEvidence,
  conflictingEvidenceTruthSummary,
} from "@/lib/learning/evidence/conflicting-evidence";
import {
  calibrateFacetStatus,
  calibrateOrchestratorDiagnosis,
  masteryCalibrationTruthSummary,
} from "@/lib/learning/mastery/mastery-calibration";
import { presentConceptProgress } from "@/lib/learning/mastery/present-concept-progress";
import { presentLearnerModelVisibility } from "@/lib/learning/mastery/present-learner-model";
import { presentGrowthCenter } from "@/lib/learning/learner-model/present-growth-center";
import { presentTemporalTruthBuckets } from "@/lib/learning/learner-growth";
import { emptyFacetScores } from "@/lib/learning/mastery/facets";
import { orchestrateFromLearnerState } from "@/lib/learning/orchestrator/diagnose";
import { ORCHESTRATOR_FACET_STRONG } from "@/lib/learning/orchestrator/diagnose";
import type { LearnerConceptMasterySummary } from "@/lib/learning/types";
import { emptyEvidenceSignals } from "@/lib/learning/evidence/aggregate";

const root = process.cwd();
function read(rel: string) {
  return readFileSync(path.join(root, rel), "utf8");
}

function summary(partial: {
  facets?: Partial<LearnerConceptMasterySummary["facets"]>;
  evidenceSourceCounts?: LearnerConceptMasterySummary["evidenceSourceCounts"];
  reviewCount?: number;
}): LearnerConceptMasterySummary {
  return {
    learnerId: "user-1",
    conceptId: "concept-1",
    conceptTitle: "Linear Equations",
    facets: { ...emptyFacetScores(), ...partial.facets },
    topicMastery: null,
    recentMissedCount: 0,
    evidenceSourceCounts: partial.evidenceSourceCounts ?? {
      quiz: 0,
      flashcard: 0,
      study_evaluate: 0,
      other: 0,
    },
    reviewCount: partial.reviewCount ?? 0,
    lastReviewedAt: null,
    nextReviewAt: null,
  };
}

describe("2P-44 evidence sufficiency", () => {
  it("classifies none → thin → emerging → adequate → rich", () => {
    expect(classifyEvidenceSufficiency({ reviewCount: 0 })).toBe("none");
    expect(classifyEvidenceSufficiency({ reviewCount: 1 })).toBe("thin");
    expect(classifyEvidenceSufficiency({ reviewCount: 2 })).toBe("emerging");
    expect(
      classifyEvidenceSufficiency({
        reviewCount: 3,
        sourceKinds: 2,
        evidenceEvents: 4,
      }),
    ).toBe("adequate");
    expect(
      classifyEvidenceSufficiency({
        reviewCount: 5,
        sourceKinds: 3,
        evidenceEvents: 6,
      }),
    ).toBe("rich");
    expect(evidenceSufficiencyIsThin("thin")).toBe(true);
    expect(evidenceSufficiencyLearnerLabel("thin")).toMatch(/building/i);
    expect(EVIDENCE_SUFFICIENCY_POLICY.adequateMinReviews).toBe(3);
  });

  it("is deterministic and forbids second engines", () => {
    const a = classifyEvidenceSufficiency({ reviewCount: 2, sourceKinds: 1 });
    const b = classifyEvidenceSufficiency({ reviewCount: 2, sourceKinds: 1 });
    expect(a).toBe(b);
    expect(evidenceSufficiencyTruthSummary().inventsMasteryDecay).toBe(false);
    expect(evidenceSufficiencyTruthSummary().createsSecondMasteryEngine).toBe(
      false,
    );
  });
});

describe("2P-44 facet calibration", () => {
  it("downgrades demonstrated → developing when evidence is thin", () => {
    expect(calibrateFacetStatus("demonstrated", "thin")).toBe("developing");
    expect(calibrateFacetStatus("demonstrated", "adequate")).toBe(
      "demonstrated",
    );
    expect(calibrateFacetStatus("needs_more_practice", "thin")).toBe(
      "needs_more_practice",
    );
  });

  it("presentConceptProgress does not claim demonstrated on one review", () => {
    const thin = presentConceptProgress({
      conceptId: "c1",
      conceptTitle: "Auth",
      conceptMastery: {
        recognize: ORCHESTRATOR_FACET_STRONG,
        explain: ORCHESTRATOR_FACET_STRONG,
        apply: ORCHESTRATOR_FACET_STRONG,
        solve: ORCHESTRATOR_FACET_STRONG,
        perform: ORCHESTRATOR_FACET_STRONG,
        retain: ORCHESTRATOR_FACET_STRONG,
        confidence: 0.6,
        reviewCount: 1,
      },
    });
    expect(thin.status).toBe("available");
    if (thin.status !== "available") throw new Error("expected available");
    expect(thin.demonstrated).toHaveLength(0);
    expect(thin.dimensions.every((d) => d.status !== "demonstrated")).toBe(
      true,
    );
    expect(thin.dimensions[0]?.learnerLine).toMatch(/still building/i);

    const adequate = presentConceptProgress({
      conceptId: "c1",
      conceptTitle: "Auth",
      conceptMastery: {
        recognize: ORCHESTRATOR_FACET_STRONG,
        explain: ORCHESTRATOR_FACET_STRONG,
        apply: ORCHESTRATOR_FACET_STRONG,
        solve: ORCHESTRATOR_FACET_STRONG,
        perform: ORCHESTRATOR_FACET_STRONG,
        retain: ORCHESTRATOR_FACET_STRONG,
        confidence: 0.7,
        reviewCount: 4,
      },
    });
    if (adequate.status !== "available") throw new Error("expected available");
    expect(adequate.demonstrated.length).toBeGreaterThan(0);
  });

  it("facets remain distinct — recognize strong does not imply apply", () => {
    const view = presentConceptProgress({
      conceptId: "c1",
      conceptMastery: {
        recognize: ORCHESTRATOR_FACET_STRONG,
        explain: ORCHESTRATOR_FACET_STRONG,
        apply: 0.2,
        solve: 0,
        perform: 0,
        retain: 0.3,
        confidence: 0.5,
        reviewCount: 4,
      },
    });
    if (view.status !== "available") throw new Error("expected available");
    expect(view.demonstrated).toContain("Recognition");
    expect(view.mayNeedPractice).toContain("Application");
  });
});

describe("2P-44 conflicting evidence", () => {
  it("reads recent failure streak without inventing decay", () => {
    const signals = emptyEvidenceSignals();
    signals.recentFailCount = 3;
    signals.recentSuccessCount = 0;
    signals.repeatedFailure = "strong";
    signals.totalAttempts = 5;
    const reading = interpretConflictingEvidence({
      signals,
      sufficiency: "emerging",
    });
    expect(reading.reading).toBe("recent_failure_streak");
    expect(reading.learnerSafeLine).toMatch(/repeated difficulty/i);
    expect(conflictingEvidenceTruthSummary().inventsMasteryDecay).toBe(false);
  });

  it("reads recovery after failures", () => {
    const signals = emptyEvidenceSignals();
    signals.recentFailCount = 1;
    signals.recentSuccessCount = 3;
    signals.repeatedFailure = "none";
    const reading = interpretConflictingEvidence({
      signals,
      sufficiency: "emerging",
    });
    expect(reading.reading).toBe("recent_recovery");
  });
});

describe("2P-44 Orchestrator soft calibration", () => {
  it("does not claim NO_INTERVENTION on thin evidence", () => {
    const calibrated = calibrateOrchestratorDiagnosis({
      diagnosis: "NO_INTERVENTION",
      sufficiency: "thin",
    });
    expect(calibrated.diagnosis).toBe("INSUFFICIENT_EVIDENCE");
    expect(calibrated.softened).toBe(true);

    const result = orchestrateFromLearnerState(
      summary({
        reviewCount: 1,
        evidenceSourceCounts: {
          quiz: 1,
          flashcard: 0,
          study_evaluate: 0,
          other: 0,
        },
        facets: {
          recognize: 0.8,
          explain: 0.8,
          apply: 0.8,
          perform: 0.8,
          retain: 0.8,
        },
      }),
    );
    expect(result.diagnosis).toBe("INSUFFICIENT_EVIDENCE");
    expect(result.confidence).toBe("LOW");
    expect(result.reason).toMatch(/still limited|thin|not claim/i);
  });

  it("keeps APPLICATION_GAP on adequate evidence", () => {
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
  });

  it("keeps UNDERSTANDING_GAP on thin but softens reason", () => {
    const result = orchestrateFromLearnerState(
      summary({
        reviewCount: 1,
        evidenceSourceCounts: {
          quiz: 1,
          flashcard: 0,
          study_evaluate: 0,
          other: 0,
        },
        facets: { recognize: 0.2, explain: 0.15, apply: 0.1, retain: 0.1 },
      }),
    );
    expect(result.diagnosis).toBe("UNDERSTANDING_GAP");
    expect(result.reason).toMatch(/thin/i);
  });

  it("preserves NO_INTERVENTION when evidence is adequate+", () => {
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
  });
});

describe("2P-44 Growth continuity wording", () => {
  it("does not put thin high scores into What I know strengths", () => {
    const visibility = presentLearnerModelVisibility([
      {
        conceptId: "thin-strong",
        conceptTitle: "Sparse",
        recentlyUpdated: true,
        conceptMastery: {
          recognize: ORCHESTRATOR_FACET_STRONG,
          explain: ORCHESTRATOR_FACET_STRONG,
          apply: ORCHESTRATOR_FACET_STRONG,
          solve: ORCHESTRATOR_FACET_STRONG,
          perform: ORCHESTRATOR_FACET_STRONG,
          retain: ORCHESTRATOR_FACET_STRONG,
          confidence: 0.6,
          reviewCount: 1,
        },
      },
    ]);
    expect(visibility.strengths).toHaveLength(0);
    expect(visibility.developing.length + visibility.needsMorePractice.length).toBeGreaterThan(
      0,
    );
    const growth = presentGrowthCenter({ visibility });
    expect(JSON.stringify(growth)).not.toMatch(/forever|permanently mastered/i);
    const temporal = presentTemporalTruthBuckets(visibility);
    expect(temporal.recentlyDemonstrated).toHaveLength(0);
  });

  it("truth summaries forbid engines and decay", () => {
    expect(masteryCalibrationTruthSummary().inventsMasteryDecay).toBe(false);
    expect(masteryCalibrationTruthSummary().createsSecondMasteryEngine).toBe(
      false,
    );
  });
});

describe("2P-44 wiring invariants", () => {
  it("diagnose uses sufficiency calibration; applyFacetDelta unchanged", () => {
    const diagnose = read("src/lib/learning/orchestrator/diagnose.ts");
    expect(diagnose).toContain("calibrateOrchestratorDiagnosis");
    expect(diagnose).toContain("classifyEvidenceSufficiency");
    const apply = read("src/lib/learning/mastery/apply.ts");
    expect(apply).not.toContain("classifyEvidenceSufficiency");
    const facets = read("src/lib/learning/mastery/facets.ts");
    expect(facets).not.toContain("classifyEvidenceSufficiency");
  });

  it("open/hint paths still do not record evidence", () => {
    const route = read("app/api/study/activities/[kind]/route.ts");
    expect(route).toMatch(/checkStep|diagnostic/);
    expect(route).toMatch(/recordEvidence|recordAuthoritative|LearningAttempt/);
    const serverEval = read(
      "src/lib/learning/activities/server-evaluation.ts",
    );
    expect(serverEval).toContain("recordEvidence");
  });
});

import { describe, expect, it } from "vitest";
import { LEARNING_OBJECT_TYPES } from "@/lib/learning/types";
import {
  ACTIVITY_FOUNDATION_TYPES,
  activityFoundationStatus,
  codingActivityFoundation,
  foundationTypesAreLearningObjectTypes,
  gameActivityFoundation,
  labActivityFoundation,
  presentationActivityFoundation,
  projectActivityFoundation,
  rejectClientClaimedSuccess,
  simulationActivityFoundation,
  sqlActivityFoundation,
  writingActivityFoundation,
} from "./activity-foundations";

describe("activity foundations WS10–17", () => {
  it("all foundation types exist in LEARNING_OBJECT_TYPES", () => {
    expect(
      foundationTypesAreLearningObjectTypes(LEARNING_OBJECT_TYPES),
    ).toBe(true);
  });

  it("each foundation is FOUNDATION maturity only", () => {
    for (const type of ACTIVITY_FOUNDATION_TYPES) {
      const s = activityFoundationStatus(type);
      expect(s.maturity).toBe("FOUNDATION");
      expect(s.realEvaluatingActivity).toBe(false);
      expect(s.evidenceClosed).toBe(false);
      expect(s.productComplete).toBe(false);
    }
  });

  it("factory helpers declare launch≠evidence and points≠mastery", () => {
    const factories = [
      codingActivityFoundation(),
      sqlActivityFoundation(),
      labActivityFoundation(),
      simulationActivityFoundation(),
      gameActivityFoundation(),
      writingActivityFoundation(),
      projectActivityFoundation(),
      presentationActivityFoundation(),
    ];
    for (const f of factories) {
      expect(f.launchIsNotEvidence).toBe(true);
      expect(f.pointsAreNotMastery).toBe(true);
      expect(f.evaluationAuthoritative).toBe(true);
    }
  });

  it("rejects client-claimed SUCCESS without server evaluation", () => {
    expect(
      rejectClientClaimedSuccess({
        clientClaimedSuccess: true,
        serverEvaluated: false,
      }).accepted,
    ).toBe(false);
    expect(
      rejectClientClaimedSuccess({
        clientClaimedSuccess: true,
        serverEvaluated: true,
      }).accepted,
    ).toBe(true);
  });
});

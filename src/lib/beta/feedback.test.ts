import { describe, expect, it } from "vitest";

import {
  BETA_FEEDBACK_CATEGORIES,
  betaFeedbackTruthSummary,
  isBetaFeedbackCategory,
} from "./feedback";

describe("beta feedback", () => {
  it("exposes controlled-beta categories", () => {
    expect(BETA_FEEDBACK_CATEGORIES).toEqual([
      "CONFUSING",
      "BROKEN",
      "TOO_EASY",
      "TOO_HARD",
      "NOT_RELEVANT",
      "GREAT",
      "OTHER",
    ]);
    expect(isBetaFeedbackCategory("CONFUSING")).toBe(true);
    expect(isBetaFeedbackCategory("PASSWORD")).toBe(false);
  });

  it("truth summary: feedback is not evidence or mastery", () => {
    const t = betaFeedbackTruthSummary();
    expect(t.isNotLearningAttempt).toBe(true);
    expect(t.doesNotUpdateConceptMastery).toBe(true);
    expect(t.doesNotModifyLearnerModel).toBe(true);
    expect(t.sessionOwned).toBe(true);
  });
});

import { describe, expect, it } from "vitest";

import { recommendSixForMastery } from "./six-recommendations";

describe("recommendSixForMastery", () => {
  it("starts with chunking when never reviewed", () => {
    const result = recommendSixForMastery({
      proficiency: 0,
      understanding: 0,
      recall: 0,
      application: 0,
      reviewCount: 0,
    });
    expect(result.component).toBe("chunking");
  });

  it("prioritizes explanation when understanding is low", () => {
    const result = recommendSixForMastery({
      proficiency: 0.4,
      understanding: 0.2,
      recall: 0.8,
      application: 0.8,
      reviewCount: 3,
    });
    expect(result.component).toBe("detailed-explanation");
  });

  it("prioritizes active recall when recall is weak", () => {
    const result = recommendSixForMastery({
      proficiency: 0.55,
      understanding: 0.7,
      recall: 0.2,
      application: 0.7,
      reviewCount: 4,
    });
    expect(result.component).toBe("active-recall");
  });
});

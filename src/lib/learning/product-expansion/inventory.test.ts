/**
 * 2P-14 — Product expansion inventory helper tests (no engine implementations).
 */

import { describe, expect, it } from "vitest";

import {
  buildUniversalActivityInventory,
  classifyFutureExperienceCandidate,
  educationalMarketSimulationIsNotBrokerage,
  listAdaptiveReadyUniversalActivityKeys,
  listProductReadyNotAdaptiveActivityKeys,
  productExpansionRequiresSubjectEnum,
  productExpansionTruthSummary,
} from "@/lib/learning/product-expansion/inventory";

describe("2P-14 Product expansion inventory", () => {
  it("Adaptive-ready universals match completion contracts (incl. game/project 2P-30)", () => {
    expect(listAdaptiveReadyUniversalActivityKeys()).toEqual([
      "coding",
      "sql",
      "math",
      "networking",
      "language",
      "lab",
      "simulation",
      "presentation",
      "writing",
      "game",
      "project",
    ]);
  });

  it("no product-only universal gap after 2P-30; Writing/Game/Project Adaptive-ready", () => {
    const keys = listProductReadyNotAdaptiveActivityKeys();
    expect(keys).toEqual([]);
    expect(keys).not.toContain("writing");
    expect(keys).not.toContain("game");
    expect(keys).not.toContain("project");
    expect(keys).not.toContain("coding");
  });

  it("inventory snapshot does not invent engines or subject enums", () => {
    const rows = buildUniversalActivityInventory();
    expect(rows.length).toBeGreaterThanOrEqual(8);
    expect(rows.find((r) => r.adapterKey === "coding")?.adaptiveReady).toBe(
      true,
    );
    expect(rows.find((r) => r.adapterKey === "writing")?.adaptiveReady).toBe(
      true,
    );
    expect(productExpansionRequiresSubjectEnum()).toBe(false);
    expect(educationalMarketSimulationIsNotBrokerage()).toBe(true);
    expect(
      productExpansionTruthSummary().doesNotImplementNewEnginesInThisPhase,
    ).toBe(true);
  });

  it("classifies educational market sim as content-in-existing (not brokerage)", () => {
    expect(
      classifyFutureExperienceCandidate("market-trading-educational-sim"),
    ).toBe("CONTENT_IN_EXISTING");
    expect(classifyFutureExperienceCandidate("3d-spatial-anatomy")).toBe(
      "SPECIALIZED_ENGINE",
    );
    expect(classifyFutureExperienceCandidate("math-workspace")).toBe(
      "SPECIALIZED_ENGINE",
    );
    expect(classifyFutureExperienceCandidate("clinical-scenario")).toBe(
      "CONTENT_IN_EXISTING",
    );
  });
});

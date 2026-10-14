/**
 * 2P-17 — Educational market & trading simulation tests.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  EDUCATIONAL_MARKET_SCENARIOS,
  applySimulatedBuy,
  educationalMarketBoundaryTruthSummary,
  educationalMarketIsNotBrokerage,
  educationalMarketIsNotRealMoney,
  educationalMarketStateTruthSummary,
  evaluateEducationalMarketSubmission,
  getEducationalMarketScenario,
  listEducationalMarketScenarios,
  makeEducationalMarketState,
  parseEducationalMarketArtifact,
  projectEducationalMarketChart,
  serializeEducationalMarketArtifact,
  sourceMentionsForbiddenBrokerageInfra,
  buildEducationalMarketJournalEntry,
} from "@/lib/learning/activities/simulation/educational-market";
import { evaluateStructuredChallenge, getStructuredChallenge } from "@/lib/learning/activities/structured/service";
import { evaluateContentCoverage } from "@/lib/learning/content-coverage";
import { selectProgressionContent } from "@/lib/learning/content-progression";
import { resolveLearningExperience } from "@/lib/learning/experience";
import { isAdaptiveReadyActivityAdapterKey } from "@/lib/learning/sequence/activity-adaptive-completion";

const root = process.cwd();

function read(rel: string) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("2P-17 educational market boundary", () => {
  it("is fake-money only — not brokerage / real money / advice", () => {
    expect(educationalMarketIsNotBrokerage()).toBe(true);
    expect(educationalMarketIsNotRealMoney()).toBe(true);
    const t = educationalMarketBoundaryTruthSummary();
    expect(t.noBrokerageApis).toBe(true);
    expect(t.profitIsNotMastery).toBe(true);
    expect(t.lossIsNotAutomaticFailure).toBe(true);
  });

  it("module sources do not mention brokerage APIs", () => {
    for (const rel of [
      "src/lib/learning/activities/simulation/educational-market/scenarios.ts",
      "src/lib/learning/activities/simulation/educational-market/evaluate.ts",
      "src/lib/learning/activities/simulation/educational-market/state.ts",
      "src/lib/learning/activities/simulation/educational-market/to-challenge.ts",
    ]) {
      expect(sourceMentionsForbiddenBrokerageInfra(read(rel))).toBe(false);
    }
    // Boundary helper lists forbidden vendor patterns intentionally — keep it educational-only.
    expect(educationalMarketIsNotBrokerage()).toBe(true);
  });
});

describe("2P-17 simulation state", () => {
  it("builds deterministic fake-money state", () => {
    const s = makeEducationalMarketState({
      cash: 1000,
      currentPrices: { EDU: 50 },
      holdings: [{ symbol: "EDU", shares: 2, avgCost: 40 }],
    });
    expect(s.realMoney).toBe(false);
    expect(s.brokerage).toBe(false);
    expect(s.portfolioValue).toBe(1100);
    expect(educationalMarketStateTruthSummary().deterministic).toBe(true);
  });

  it("applies simulated buy without real money", () => {
    const s = makeEducationalMarketState({
      cash: 1000,
      currentPrices: { EDU: 50 },
    });
    const next = applySimulatedBuy(s, "EDU", 4, 50);
    expect("error" in next).toBe(false);
    if (!("error" in next)) {
      expect(next.cash).toBe(800);
      expect(next.holdings[0]?.shares).toBe(4);
    }
    expect(applySimulatedBuy(s, "EDU", 100, 50)).toEqual({
      error: "insufficient_fake_cash",
    });
  });
});

describe("2P-17 scenario catalog", () => {
  it("has 8–15 high-quality scenarios", () => {
    const n = listEducationalMarketScenarios().length;
    expect(n).toBeGreaterThanOrEqual(8);
    expect(n).toBeLessThanOrEqual(15);
    expect(EDUCATIONAL_MARKET_SCENARIOS.every((s) => s.state.realMoney === false)).toBe(
      true,
    );
  });

  it("covers core concept families", () => {
    const kinds = new Set(EDUCATIONAL_MARKET_SCENARIOS.map((s) => s.kind));
    expect(kinds.has("market_order")).toBe(true);
    expect(kinds.has("supply_demand")).toBe(true);
    expect(kinds.has("position_sizing")).toBe(true);
    expect(kinds.has("diversification")).toBe(true);
    expect(kinds.has("market_event")).toBe(true);
  });
});

describe("2P-17 evaluation", () => {
  it("market order requires reasoning — not profit claims", () => {
    const s = getEducationalMarketScenario("sim-market-order-edu")!;
    const fail = evaluateEducationalMarketSubmission(s, "");
    expect(fail.outcome).toBe("FAIL");

    const badAdvice = evaluateEducationalMarketSubmission(
      s,
      serializeEducationalMarketArtifact({
        decision: {
          action: "buy",
          quantity: 20,
          orderType: "market",
          reasoning: "Guaranteed profit with real brokerage deposit into bank.",
        },
      }),
    );
    expect(badAdvice.outcome).toBe("FAIL");

    const pass = evaluateEducationalMarketSubmission(
      s,
      serializeEducationalMarketArtifact({
        decision: {
          action: "buy",
          quantity: 20,
          orderType: "market",
          reasoning:
            "I choose a market order for fill speed, accepting slippage risk on this fake paper portfolio.",
        },
      }),
    );
    expect(pass.outcome).toBe("SUCCESS");
    expect(pass.details.profitIsNotMastery).toBe(true);
  });

  it("position sizing respects risk budget", () => {
    const s = getEducationalMarketScenario("edu-mkt-position-sizing-2pct")!;
    const oversized = evaluateEducationalMarketSubmission(
      s,
      serializeEducationalMarketArtifact({
        decision: {
          action: "buy",
          quantity: 80,
          reasoning: "I ignore the 2% risk stop budget and buy as many as possible.",
        },
      }),
    );
    expect(oversized.outcome).not.toBe("SUCCESS");

    const ok = evaluateEducationalMarketSubmission(
      s,
      serializeEducationalMarketArtifact({
        decision: {
          action: "size_position",
          quantity: 40,
          reasoning:
            "Risk budget is $200 at a $5 stop, so max 40 shares respects the 2% risk constraint.",
        },
      }),
    );
    expect(ok.outcome).toBe("SUCCESS");
  });

  it("diversification rejects extreme concentration", () => {
    const s = getEducationalMarketScenario("edu-mkt-diversify-allocate")!;
    const concentrated = evaluateEducationalMarketSubmission(
      s,
      serializeEducationalMarketArtifact({
        decision: {
          action: "allocate",
          allocations: { AAA: 90, BBB: 5, CCC: 5 },
          reasoning: "Put almost everything in AAA for diversification risk.",
        },
      }),
    );
    expect(concentrated.outcome).not.toBe("SUCCESS");

    const ok = evaluateEducationalMarketSubmission(
      s,
      serializeEducationalMarketArtifact({
        decision: {
          action: "allocate",
          allocations: { AAA: 34, BBB: 33, CCC: 33 },
          reasoning:
            "Spread allocation to diversify and avoid concentration risk across three names.",
        },
      }),
    );
    expect(ok.outcome).toBe("SUCCESS");
  });

  it("supply/demand evaluates prediction + reasoning", () => {
    const s = getEducationalMarketScenario("sim-supply-demand")!;
    const ok = evaluateEducationalMarketSubmission(
      s,
      serializeEducationalMarketArtifact({
        decision: {
          action: "predict",
          prediction: "up",
          reasoning:
            "When demand rises and supply is fixed, equilibrium price is pressured upward.",
        },
      }),
    );
    expect(ok.outcome).toBe("SUCCESS");
  });

  it("structured challenge path uses market evaluator", () => {
    const c = getEducationalMarketScenario("edu-mkt-event-earnings")!;
    const challenge = getStructuredChallenge(c.id)!;
    const result = evaluateStructuredChallenge(
      challenge,
      serializeEducationalMarketArtifact({
        decision: {
          action: "hold",
          reasoning:
            "After the earnings gap, risk remains because the move may already be priced in.",
        },
      }),
    );
    expect(result.details.mode).toBe("educational_market");
  });
});

describe("2P-17 chart + journal", () => {
  it("projects educational chart — not a trading terminal", () => {
    const s = getEducationalMarketScenario("edu-mkt-event-earnings")!;
    const chart = projectEducationalMarketChart(s);
    expect(chart.educationalOnly).toBe(true);
    expect(chart.notATradingTerminal).toBe(true);
    expect(chart.eventMarkers.length).toBeGreaterThan(0);
  });

  it("journal is educational context only", () => {
    const entry = buildEducationalMarketJournalEntry({
      action: "hold",
      reasoning: "Waiting reduces chase risk after the simulated run-up.",
      confidence: "low",
    });
    expect(entry.notFinancialAdvice).toBe(true);
    expect(parseEducationalMarketArtifact(
      serializeEducationalMarketArtifact({ decision: entry.decision, journal: entry }),
    )?.action).toBe("hold");
  });
});

describe("2P-17 progression + Adaptive readiness", () => {
  it("coverage AVAILABLE for market-orders simulation", () => {
    const coverage = evaluateContentCoverage({
      conceptKey: "market-orders",
      activityKind: "simulation",
    });
    expect(coverage.status).toBe("AVAILABLE");
  });

  it("progression variation across position-sizing stages", () => {
    const a = selectProgressionContent({
      conceptKey: "position-sizing",
      preferredStages: ["APPLY"],
    });
    const b = selectProgressionContent({
      conceptKey: "position-sizing",
      preferredStages: ["CHALLENGE"],
    });
    expect(a.ok && b.ok).toBe(true);
    if (a.ok && b.ok) {
      expect(a.entry.contentId).not.toBe(b.entry.contentId);
    }
  });

  it("experience resolves for Adaptive-ready simulation", () => {
    expect(isAdaptiveReadyActivityAdapterKey("simulation")).toBe(true);
    const resolved = resolveLearningExperience({
      conceptId: "c-fin",
      conceptTitle: "Market orders",
      activityKind: "simulation",
      contentId: "sim-market-order-edu",
    });
    expect(resolved.coverageStatus).toBe("AVAILABLE");
    expect(resolved.experience?.scaffolds.length).toBeGreaterThan(0);
  });
});

/**
 * 2P-17 — Minimal educational chart projection (not a trading terminal).
 */

import type {
  EducationalMarketChartView,
  EducationalMarketScenario,
} from "./types";

export function projectEducationalMarketChart(
  scenario: EducationalMarketScenario,
  symbol?: string,
): EducationalMarketChartView {
  const sym =
    symbol ??
    Object.keys(scenario.state.currentPrices)[0] ??
    scenario.state.holdings[0]?.symbol ??
    "EDU";
  const points = scenario.state.priceSeries.length
    ? scenario.state.priceSeries
    : [
        { t: 0, price: scenario.state.currentPrices[sym] ?? 50 },
        { t: 1, price: scenario.state.currentPrices[sym] ?? 50 },
      ];
  const eventMarkers = points
    .filter((p) => p.event)
    .map((p) => ({ t: p.t, label: p.event! }));

  return {
    symbol: sym,
    points,
    entryPrice: scenario.state.currentPrices[sym] ?? null,
    eventMarkers,
    educationalOnly: true,
    notATradingTerminal: true,
  };
}

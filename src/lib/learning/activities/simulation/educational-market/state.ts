/**
 * 2P-17 — Deterministic educational market simulation state helpers.
 */

import {
  EDUCATIONAL_MARKET_DISCLAIMER,
  type EducationalMarketHolding,
  type EducationalMarketPricePoint,
  type EducationalMarketSimulationState,
} from "./types";

export function portfolioValue(
  cash: number,
  holdings: readonly EducationalMarketHolding[],
  prices: Record<string, number>,
): number {
  let value = cash;
  for (const h of holdings) {
    const px = prices[h.symbol] ?? h.avgCost;
    value += h.shares * px;
  }
  return Math.round(value * 100) / 100;
}

export function makeEducationalMarketState(input: {
  cash: number;
  holdings?: readonly EducationalMarketHolding[];
  currentPrices: Record<string, number>;
  priceSeries?: EducationalMarketPricePoint[];
  marketEvents?: string[];
  scenarioNotes?: string[];
}): EducationalMarketSimulationState {
  const holdings = [...(input.holdings ?? [])];
  return {
    currencyLabel: "FAKE_USD",
    educationalOnly: true,
    realMoney: false,
    brokerage: false,
    cash: input.cash,
    holdings,
    currentPrices: { ...input.currentPrices },
    portfolioValue: portfolioValue(input.cash, holdings, input.currentPrices),
    priceSeries: [...(input.priceSeries ?? [])],
    marketEvents: [...(input.marketEvents ?? [])],
    scenarioNotes: [
      EDUCATIONAL_MARKET_DISCLAIMER,
      ...(input.scenarioNotes ?? []),
    ],
  };
}

/** Apply a buy with fake cash — never goes negative cash silently. */
export function applySimulatedBuy(
  state: EducationalMarketSimulationState,
  symbol: string,
  shares: number,
  fillPrice: number,
): EducationalMarketSimulationState | { error: string } {
  if (shares <= 0) return { error: "invalid_quantity" };
  const cost = shares * fillPrice;
  if (cost > state.cash + 1e-9) return { error: "insufficient_fake_cash" };
  const holdings = [...state.holdings];
  const idx = holdings.findIndex((h) => h.symbol === symbol);
  if (idx >= 0) {
    const prev = holdings[idx]!;
    const totalShares = prev.shares + shares;
    const avgCost =
      (prev.avgCost * prev.shares + fillPrice * shares) / totalShares;
    holdings[idx] = { symbol, shares: totalShares, avgCost };
  } else {
    holdings.push({ symbol, shares, avgCost: fillPrice });
  }
  const cash = Math.round((state.cash - cost) * 100) / 100;
  return {
    ...state,
    cash,
    holdings,
    portfolioValue: portfolioValue(cash, holdings, state.currentPrices),
  };
}

export function applySimulatedSell(
  state: EducationalMarketSimulationState,
  symbol: string,
  shares: number,
  fillPrice: number,
): EducationalMarketSimulationState | { error: string } {
  if (shares <= 0) return { error: "invalid_quantity" };
  const holdings = [...state.holdings];
  const idx = holdings.findIndex((h) => h.symbol === symbol);
  if (idx < 0 || holdings[idx]!.shares < shares) {
    return { error: "insufficient_shares" };
  }
  const prev = holdings[idx]!;
  const remaining = prev.shares - shares;
  if (remaining === 0) holdings.splice(idx, 1);
  else holdings[idx] = { ...prev, shares: remaining };
  const cash = Math.round((state.cash + shares * fillPrice) * 100) / 100;
  return {
    ...state,
    cash,
    holdings,
    portfolioValue: portfolioValue(cash, holdings, state.currentPrices),
  };
}

export function educationalMarketStateTruthSummary(): {
  fakeMoneyOnly: true;
  notBrokerage: true;
  notRealMoney: true;
  deterministic: true;
} {
  return {
    fakeMoneyOnly: true,
    notBrokerage: true,
    notRealMoney: true,
    deterministic: true,
  };
}

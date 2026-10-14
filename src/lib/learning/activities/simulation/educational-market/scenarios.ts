/**
 * 2P-17 — Educational market scenario catalog (deterministic fixtures).
 * Fake money only. Offline. No live market API.
 */

import { makeEducationalMarketState } from "./state";
import {
  EDUCATIONAL_MARKET_DISCLAIMER,
  type EducationalMarketScenario,
} from "./types";

const series = (
  prices: number[],
  events: Array<{ i: number; label: string }> = [],
) =>
  prices.map((price, t) => ({
    t,
    price,
    event: events.find((e) => e.i === t)?.label,
  }));

export const EDUCATIONAL_MARKET_SCENARIOS: EducationalMarketScenario[] = [
  {
    id: "sim-market-order-edu",
    kind: "market_order",
    title: "Educational market order (fake money)",
    conceptKey: "market-orders",
    conceptTitle: "Market orders",
    objective:
      "Choose a simulated market vs limit order with fake money and explain fill/slippage risk.",
    prompt:
      "Paper portfolio: fake $10,000. Stock EDU ≈ $50. You want ~20 shares. Choose market or limit, state quantity, explain fill/slippage risk, and describe the resulting fake cash/position. Educational simulation only — no brokerage.",
    skillFacet: "APPLY",
    difficulty: 3,
    stage: "APPLY",
    contextVariant: "fake portfolio EDU stock",
    state: makeEducationalMarketState({
      cash: 10000,
      currentPrices: { EDU: 50 },
      priceSeries: series([48, 49, 50, 50.2, 49.8]),
      scenarioNotes: ["Goal: obtain ~20 shares with awareness of fill risk."],
    }),
    successRules: [
      { type: "action_in", actions: ["buy"] },
      { type: "quantity_min", min: 1 },
      { type: "quantity_max", max: 200 },
      {
        type: "reasoning_keywords",
        anyOf: ["slippage", "fill", "speed", "immediate", "certainty", "limit", "market"],
      },
    ],
    reasoningMustIncludeAny: ["slippage", "fill", "risk", "market", "limit"],
    misconceptionTargets: [
      "market orders always fill at the last printed price",
      "limit orders guarantee an immediate fill",
    ],
    successLooksLike:
      "You choose an order type, justify fill vs price control, and describe fake-money portfolio impact.",
    scaffolds: [
      {
        kind: "CONSTRAINT",
        label: "Educational only",
        content: EDUCATIONAL_MARKET_DISCLAIMER,
        level: 1,
        revealPolicy: "ALWAYS",
        doesNotRevealAnswer: true,
      },
      {
        kind: "HINT",
        label: "Order types",
        content:
          "Market orders prioritize speed of fill; limit orders prioritize price control.",
        level: 1,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
    ],
    accessibility: {
      altDescription:
        "Decide between a simulated market or limit order using fake money.",
      reducedComplexity: true,
      extendedTimeSuggested: true,
    },
    outcomeNarrative:
      "A coherent market-order choice trades price certainty for fill speed in this paper portfolio.",
    disclaimer: EDUCATIONAL_MARKET_DISCLAIMER,
  },
  {
    id: "edu-mkt-limit-order-patience",
    kind: "limit_order",
    title: "Limit order patience (fake money)",
    conceptKey: "limit-orders",
    conceptTitle: "Limit orders",
    objective:
      "Place a simulated limit buy below the ask and explain why it may not fill immediately.",
    prompt:
      "EDU last $52, you prefer not to pay above $50. Using fake $5,000, choose a limit buy, quantity, limit price ≤ $50, and explain non-fill risk. Do not assume an immediate fill.",
    skillFacet: "APPLY",
    difficulty: 3,
    stage: "PRACTICE",
    contextVariant: "limit below ask",
    state: makeEducationalMarketState({
      cash: 5000,
      currentPrices: { EDU: 52 },
      priceSeries: series([51, 52, 52.5, 52.2]),
      scenarioNotes: ["Ask is above your preferred max price."],
    }),
    successRules: [
      { type: "action_in", actions: ["buy"] },
      { type: "order_type", orderType: "limit" },
      { type: "quantity_min", min: 1 },
      {
        type: "reasoning_keywords",
        anyOf: ["may not fill", "not fill", "patience", "price control", "wait"],
      },
    ],
    reasoningMustIncludeAny: ["limit", "fill", "price"],
    misconceptionTargets: ["limit orders always execute immediately"],
    successLooksLike:
      "You set a limit at or below $50 and explain that fill is not guaranteed.",
    scaffolds: [
      {
        kind: "CONSTRAINT",
        label: "Educational only",
        content: EDUCATIONAL_MARKET_DISCLAIMER,
        level: 1,
        revealPolicy: "ALWAYS",
        doesNotRevealAnswer: true,
      },
    ],
    outcomeNarrative:
      "A limit below the market may improve price but can leave you unfilled.",
    disclaimer: EDUCATIONAL_MARKET_DISCLAIMER,
  },
  {
    id: "sim-supply-demand",
    kind: "supply_demand",
    title: "Price adjustment simulation",
    conceptKey: "supply-and-demand",
    conceptTitle: "Supply and demand",
    objective:
      "Predict price direction when demand rises and explain the market outcome.",
    prompt:
      "Demand for GOOD rises while supply is initially fixed. Predict price direction (up/down/unchanged), choose hold/buy as a paper response if any, and explain equilibrium pressure using supply and demand.",
    skillFacet: "APPLY",
    difficulty: 3,
    stage: "APPLY",
    contextVariant: "gasoline market demand up",
    state: makeEducationalMarketState({
      cash: 2000,
      currentPrices: { GOOD: 40 },
      priceSeries: series([38, 39, 40], [{ i: 2, label: "Demand spike" }]),
      marketEvents: ["Demand rises; supply fixed short-run"],
      scenarioNotes: ["Focus on directional relationship, not a trade tip."],
    }),
    successRules: [
      { type: "prediction", prediction: "up" },
      {
        type: "reasoning_keywords",
        anyOf: ["demand", "supply", "equilibrium", "shortage", "pressure"],
      },
    ],
    reasoningMustIncludeAny: ["demand", "supply"],
    misconceptionTargets: ["price falls when demand rises with fixed supply"],
    successLooksLike:
      "You predict higher price pressure and link it to demand vs supply.",
    scaffolds: [
      {
        kind: "HINT",
        label: "Direction",
        content:
          "When more buyers compete for the same short-run supply, what happens to price pressure?",
        level: 1,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
    ],
    outcomeNarrative:
      "Rising demand with fixed supply creates upward price pressure toward a new equilibrium.",
    disclaimer: EDUCATIONAL_MARKET_DISCLAIMER,
  },
  {
    id: "edu-mkt-supply-shock",
    kind: "supply_demand",
    title: "Supply shock price prediction",
    conceptKey: "supply-and-demand",
    conceptTitle: "Supply and demand",
    objective:
      "Predict price direction after a negative supply shock and justify with supply/demand.",
    prompt:
      "A supply shock reduces available units of WHT while demand is unchanged. Predict price direction and explain why using supply and demand language.",
    skillFacet: "APPLY",
    difficulty: 3,
    stage: "CHALLENGE",
    contextVariant: "multi-factor supply shock",
    state: makeEducationalMarketState({
      cash: 1500,
      currentPrices: { WHT: 25 },
      priceSeries: series([24, 25, 25], [{ i: 2, label: "Supply shock" }]),
      marketEvents: ["Unexpected supply reduction"],
    }),
    successRules: [
      { type: "prediction", prediction: "up" },
      {
        type: "reasoning_keywords",
        anyOf: ["supply", "shock", "scarce", "shortage", "less supply"],
      },
    ],
    reasoningMustIncludeAny: ["supply", "price"],
    misconceptionTargets: ["supply shocks always lower prices"],
    successLooksLike:
      "You predict upward pressure and cite reduced supply relative to demand.",
    scaffolds: [
      {
        kind: "CONSTRAINT",
        label: "Educational only",
        content: EDUCATIONAL_MARKET_DISCLAIMER,
        level: 1,
        revealPolicy: "ALWAYS",
        doesNotRevealAnswer: true,
      },
    ],
    outcomeNarrative:
      "Lower supply with unchanged demand tends to raise equilibrium price.",
    disclaimer: EDUCATIONAL_MARKET_DISCLAIMER,
  },
  {
    id: "edu-mkt-position-sizing-2pct",
    kind: "position_sizing",
    title: "Risk-aware position sizing",
    conceptKey: "position-sizing",
    conceptTitle: "Position sizing",
    objective:
      "Size a simulated position so risk stays within a 2% fake-account risk budget.",
    prompt:
      "Fake account $10,000. Risk budget: max 2% ($200) if stop is hit. EDU at $50, stop $5 below entry. Choose buy quantity such that loss at stop ≤ $200. Explain the risk math.",
    skillFacet: "SOLVE",
    difficulty: 3,
    stage: "APPLY",
    contextVariant: "2 percent risk budget",
    state: makeEducationalMarketState({
      cash: 10000,
      currentPrices: { EDU: 50 },
      priceSeries: series([49, 50, 50.5]),
      scenarioNotes: ["Stop distance $5 → max shares = 200/5 = 40."],
    }),
    successRules: [
      { type: "action_in", actions: ["size_position", "buy"] },
      { type: "quantity_max", max: 40 },
      { type: "quantity_min", min: 1 },
      {
        type: "reasoning_keywords",
        anyOf: ["2%", "2 percent", "200", "risk", "stop"],
      },
    ],
    reasoningMustIncludeAny: ["risk", "stop"],
    misconceptionTargets: [
      "using all cash is always better than sizing to a risk budget",
    ],
    successLooksLike:
      "Quantity ≤ 40 shares with reasoning that ties stop distance to the $200 risk budget.",
    scaffolds: [
      {
        kind: "STEP",
        label: "Risk math",
        content:
          "Risk dollars ÷ stop distance ≈ max shares. Keep the result at or under the budget.",
        level: 2,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
    ],
    accessibility: {
      altDescription:
        "Choose a share quantity that respects a 2% fake-account risk budget.",
      extendedTimeSuggested: true,
    },
    outcomeNarrative:
      "Position size follows risk budget, not maximum buying power.",
    disclaimer: EDUCATIONAL_MARKET_DISCLAIMER,
  },
  {
    id: "edu-mkt-position-oversize",
    kind: "position_sizing",
    title: "Reject oversized risk",
    conceptKey: "position-sizing",
    conceptTitle: "Position sizing",
    objective:
      "Identify that a proposed size violates the risk constraint and choose a compliant size or hold.",
    prompt:
      "Fake $8,000. Max risk 1% ($80). EDU $40 with $4 stop. A friend suggests buying 50 shares. Decide: hold, or buy a compliant quantity. Explain why 50 shares violates the budget.",
    skillFacet: "SOLVE",
    difficulty: 4,
    stage: "CHALLENGE",
    contextVariant: "oversize trap",
    state: makeEducationalMarketState({
      cash: 8000,
      currentPrices: { EDU: 40 },
      priceSeries: series([39, 40, 40.5]),
    }),
    successRules: [
      { type: "action_in", actions: ["hold", "buy", "size_position"] },
      { type: "quantity_max", max: 20 },
      {
        type: "reasoning_keywords",
        anyOf: ["violat", "too large", "over", "risk", "1%", "80"],
      },
    ],
    reasoningMustIncludeAny: ["risk"],
    misconceptionTargets: ["friend suggestions override risk budgets"],
    successLooksLike:
      "You reject 50 shares (risk $200) and either hold or size ≤ 20 shares with reasoning.",
    scaffolds: [
      {
        kind: "HINT",
        label: "Check the math",
        content: "50 shares × $4 stop = $200 risk vs $80 budget.",
        level: 2,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
    ],
    outcomeNarrative:
      "Educational success is respecting the risk constraint, not maximizing size.",
    disclaimer: EDUCATIONAL_MARKET_DISCLAIMER,
  },
  {
    id: "edu-mkt-diversify-allocate",
    kind: "diversification",
    title: "Diversified fake portfolio allocation",
    conceptKey: "diversification",
    conceptTitle: "Diversification",
    objective:
      "Allocate fake capital across multiple assets without extreme concentration.",
    prompt:
      "Allocate 100% of fake capital across AAA, BBB, and CCC. No single name above 50%. Explain diversification vs concentration.",
    skillFacet: "APPLY",
    difficulty: 3,
    stage: "APPLY",
    contextVariant: "three asset equal-ish",
    state: makeEducationalMarketState({
      cash: 9000,
      currentPrices: { AAA: 30, BBB: 45, CCC: 20 },
      priceSeries: series([30, 30, 31]),
    }),
    successRules: [
      { type: "action_in", actions: ["allocate"] },
      { type: "allocation_max_any", maxPercent: 50 },
      { type: "allocation_min_symbols", minSymbols: 3 },
      {
        type: "reasoning_keywords",
        anyOf: ["diversif", "concentrat", "spread", "risk"],
      },
    ],
    reasoningMustIncludeAny: ["diversif", "risk", "allocat"],
    misconceptionTargets: ["putting all capital in the 'best' name is safer"],
    successLooksLike:
      "Three names used, none above 50%, with diversification reasoning.",
    scaffolds: [
      {
        kind: "CONSTRAINT",
        label: "Educational only",
        content: EDUCATIONAL_MARKET_DISCLAIMER,
        level: 1,
        revealPolicy: "ALWAYS",
        doesNotRevealAnswer: true,
      },
    ],
    outcomeNarrative:
      "Spreading exposure reduces single-name concentration risk in this paper exercise.",
    disclaimer: EDUCATIONAL_MARKET_DISCLAIMER,
  },
  {
    id: "edu-mkt-diversify-concentration",
    kind: "diversification",
    title: "Spot concentration risk",
    conceptKey: "diversification",
    conceptTitle: "Diversification",
    objective:
      "Identify an over-concentrated allocation and propose a more diversified paper plan.",
    prompt:
      "Current paper book: 90% MEGA, 5% SMALL, 5% CASH. Re-allocate so no name exceeds 60% and at least two risk assets are used. Explain concentration risk.",
    skillFacet: "APPLY",
    difficulty: 4,
    stage: "CHALLENGE",
    contextVariant: "90 percent concentration trap",
    state: makeEducationalMarketState({
      cash: 500,
      holdings: [{ symbol: "MEGA", shares: 100, avgCost: 90 }],
      currentPrices: { MEGA: 90, SMALL: 15 },
      priceSeries: series([88, 90, 91]),
    }),
    successRules: [
      { type: "action_in", actions: ["allocate"] },
      { type: "allocation_max_any", maxPercent: 60 },
      { type: "allocation_min_symbols", minSymbols: 2 },
      {
        type: "reasoning_keywords",
        anyOf: ["concentrat", "diversif", "single", "risk"],
      },
    ],
    reasoningMustIncludeAny: ["concentrat", "diversif"],
    misconceptionTargets: ["concentration is fine if the name is popular"],
    successLooksLike:
      "You reduce MEGA dominance and explain concentration risk in educational terms.",
    scaffolds: [
      {
        kind: "HINT",
        label: "Concentration",
        content:
          "If one name dominates outcomes, what happens when that name alone has a bad day?",
        level: 1,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
    ],
    outcomeNarrative:
      "Lowering single-name dominance is the educational goal — not forecasting MEGA.",
    disclaimer: EDUCATIONAL_MARKET_DISCLAIMER,
  },
  {
    id: "edu-mkt-event-earnings",
    kind: "market_event",
    title: "Earnings surprise decision",
    conceptKey: "market-events",
    conceptTitle: "Market events",
    objective:
      "Respond to a simulated earnings beat with a reasoned paper action — not a guaranteed profit claim.",
    prompt:
      "EDU reports better-than-expected earnings (simulated). Price gaps from $40 to $44 on the chart. Choose buy, sell, or hold for a paper position of 0 shares now, and explain opportunity vs risk. Do not claim guaranteed returns.",
    skillFacet: "APPLY",
    difficulty: 3,
    stage: "APPLY",
    contextVariant: "earnings beat gap",
    state: makeEducationalMarketState({
      cash: 4000,
      currentPrices: { EDU: 44 },
      priceSeries: series(
        [39, 40, 40, 44],
        [{ i: 3, label: "Earnings beat (simulated)" }],
      ),
      marketEvents: ["Simulated earnings surprise: beat estimates"],
    }),
    successRules: [
      { type: "action_in", actions: ["buy", "sell", "hold"] },
      {
        type: "reasoning_keywords",
        anyOf: ["earnings", "gap", "risk", "volatil", "already", "priced"],
      },
    ],
    reasoningMustIncludeAny: ["risk", "earnings"],
    misconceptionTargets: [
      "an earnings beat guarantees further upside",
      "simulated profit equals understanding",
    ],
    successLooksLike:
      "You pick an action and reason about post-gap risk/opportunity without promising profits.",
    scaffolds: [
      {
        kind: "CONSTRAINT",
        label: "Not advice",
        content:
          "This is an educational scenario. Simulated outcomes are not predictions or advice.",
        level: 1,
        revealPolicy: "ALWAYS",
        doesNotRevealAnswer: true,
      },
    ],
    outcomeNarrative:
      "Post-event decisions weigh information already reflected in the simulated gap.",
    disclaimer: EDUCATIONAL_MARKET_DISCLAIMER,
  },
  {
    id: "edu-mkt-event-rate-hike",
    kind: "market_event",
    title: "Interest-rate hike scenario",
    conceptKey: "market-events",
    conceptTitle: "Market events",
    objective:
      "Explain how a simulated rate hike can pressure growth-sensitive paper assets and choose a coherent action.",
    prompt:
      "Simulated news: policy rate unexpectedly hiked. GROW is a long-duration growth name at $120. With fake $6,000 and no shares yet, choose buy/sell/hold and explain rate-sensitivity risk. No guaranteed outcome claims.",
    skillFacet: "EXPLAIN",
    difficulty: 4,
    stage: "CHALLENGE",
    contextVariant: "rate hike growth name",
    state: makeEducationalMarketState({
      cash: 6000,
      currentPrices: { GROW: 120 },
      priceSeries: series(
        [125, 123, 120],
        [{ i: 2, label: "Rate hike (simulated)" }],
      ),
      marketEvents: ["Unexpected simulated rate hike"],
    }),
    successRules: [
      { type: "action_in", actions: ["buy", "sell", "hold"] },
      {
        type: "reasoning_keywords",
        anyOf: ["rate", "interest", "discount", "growth", "pressure", "risk"],
      },
    ],
    reasoningMustIncludeAny: ["rate", "risk"],
    misconceptionTargets: ["rate hikes always help all stocks equally"],
    successLooksLike:
      "You connect higher rates to pressure on growth-sensitive valuations and justify an action.",
    scaffolds: [
      {
        kind: "HINT",
        label: "Rates & growth",
        content:
          "Higher discount rates often weigh on long-duration growth valuations — discuss risk, not certainty.",
        level: 2,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
    ],
    outcomeNarrative:
      "Educational focus is mechanism (rates → valuation pressure), not a trade tip.",
    disclaimer: EDUCATIONAL_MARKET_DISCLAIMER,
  },
  {
    id: "edu-mkt-hold-vs-chase",
    kind: "hold_vs_chase",
    title: "Hold vs chase after a run-up",
    conceptKey: "opportunity-cost",
    conceptTitle: "Opportunity cost",
    objective:
      "Decide whether to chase a simulated run-up or hold cash, explaining opportunity cost and FOMO risk.",
    prompt:
      "MOMO ran from $10 to $18 in the simulated series. You still have fake $2,000 cash and 0 shares. Choose buy or hold and explain opportunity cost vs chasing risk. Profit is not automatic mastery.",
    skillFacet: "APPLY",
    difficulty: 3,
    stage: "PRACTICE",
    contextVariant: "chase after run-up",
    state: makeEducationalMarketState({
      cash: 2000,
      currentPrices: { MOMO: 18 },
      priceSeries: series([10, 12, 15, 18]),
    }),
    successRules: [
      { type: "action_in", actions: ["buy", "hold"] },
      {
        type: "reasoning_keywords",
        anyOf: ["opportunity", "chase", "fomo", "already", "risk", "run"],
      },
    ],
    reasoningMustIncludeAny: ["risk", "opportunity"],
    misconceptionTargets: ["missing a move always means you should buy now"],
    successLooksLike:
      "You choose buy or hold with explicit opportunity-cost / chase-risk reasoning.",
    scaffolds: [
      {
        kind: "CONSTRAINT",
        label: "Educational only",
        content: EDUCATIONAL_MARKET_DISCLAIMER,
        level: 1,
        revealPolicy: "ALWAYS",
        doesNotRevealAnswer: true,
      },
    ],
    outcomeNarrative:
      "Either action can be educationally coherent if opportunity cost and chase risk are addressed.",
    disclaimer: EDUCATIONAL_MARKET_DISCLAIMER,
  },
  {
    id: "edu-mkt-volatility-risk",
    kind: "volatility_risk",
    title: "Volatility and risk tolerance",
    conceptKey: "volatility-risk",
    conceptTitle: "Volatility and risk",
    objective:
      "Match a paper position size to stated low risk tolerance under high simulated volatility.",
    prompt:
      "VOL swings ±8% daily in the chart. Risk tolerance: low. Fake cash $5,000. Choose hold or a small buy (≤ 20 shares at $25) and explain why high volatility argues for smaller size or waiting.",
    skillFacet: "APPLY",
    difficulty: 3,
    stage: "APPLY",
    contextVariant: "high vol low tolerance",
    state: makeEducationalMarketState({
      cash: 5000,
      currentPrices: { VOL: 25 },
      priceSeries: series([23, 27, 24, 28, 25]),
      scenarioNotes: ["Low risk tolerance stated in the objective."],
    }),
    successRules: [
      { type: "action_in", actions: ["hold", "buy"] },
      { type: "quantity_max", max: 20 },
      {
        type: "reasoning_keywords",
        anyOf: ["volatil", "swing", "risk tolerance", "smaller", "wait"],
      },
    ],
    reasoningMustIncludeAny: ["volatil", "risk"],
    misconceptionTargets: ["high volatility means you should size up for 'opportunity'"],
    successLooksLike:
      "You hold or buy ≤ 20 shares and connect volatility to position size / waiting.",
    scaffolds: [
      {
        kind: "HINT",
        label: "Volatility",
        content:
          "Wider swings increase the chance of large short-term paper losses for the same share count.",
        level: 1,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
    ],
    accessibility: {
      altDescription:
        "Choose hold or a small fake-money buy under high volatility and low risk tolerance.",
      reducedComplexity: true,
    },
    outcomeNarrative:
      "Educational alignment is risk tolerance + volatility, not maximizing short-term simulated P&L.",
    disclaimer: EDUCATIONAL_MARKET_DISCLAIMER,
  },
];

export function getEducationalMarketScenario(
  id: string,
): EducationalMarketScenario | null {
  return EDUCATIONAL_MARKET_SCENARIOS.find((s) => s.id === id) ?? null;
}

export function listEducationalMarketScenarios(): EducationalMarketScenario[] {
  return [...EDUCATIONAL_MARKET_SCENARIOS];
}

export function isEducationalMarketScenarioId(id: string): boolean {
  return getEducationalMarketScenario(id) != null;
}

/**
 * 2P-17 — Educational market / trading simulation types.
 *
 * Educational Simulation only: fake money, deterministic scenarios.
 * NOT a brokerage. NOT real-money trading. NOT financial advice.
 */

import type { MasteryFacetName } from "@/lib/learning/types";
import type { ContentEnrichmentFields } from "@/lib/learning/content-production/enrichment";

export type EducationalMarketScaffold = {
  kind: "HINT" | "STEP" | "EXAMPLE" | "CHECKLIST" | "CONSTRAINT";
  label: string;
  content: string;
  level?: 1 | 2 | 3;
  revealPolicy?: "ON_REQUEST" | "ALWAYS";
  doesNotRevealAnswer?: boolean;
};

export type EducationalMarketAction =
  | "buy"
  | "sell"
  | "hold"
  | "allocate"
  | "predict"
  | "size_position";

export type EducationalMarketOrderType = "market" | "limit";

export type EducationalMarketScenarioKind =
  | "market_order"
  | "limit_order"
  | "supply_demand"
  | "position_sizing"
  | "diversification"
  | "market_event"
  | "hold_vs_chase"
  | "volatility_risk";

export type EducationalMarketHolding = {
  symbol: string;
  shares: number;
  avgCost: number;
};

export type EducationalMarketPricePoint = {
  t: number;
  price: number;
  /** Optional educational event marker. */
  event?: string;
};

/** Deterministic paper portfolio — never real money. */
export type EducationalMarketSimulationState = {
  currencyLabel: "FAKE_USD";
  educationalOnly: true;
  realMoney: false;
  brokerage: false;
  cash: number;
  holdings: EducationalMarketHolding[];
  currentPrices: Record<string, number>;
  portfolioValue: number;
  priceSeries: EducationalMarketPricePoint[];
  marketEvents: string[];
  scenarioNotes: string[];
};

export type EducationalMarketDecision = {
  action: EducationalMarketAction;
  symbol?: string;
  quantity?: number;
  orderType?: EducationalMarketOrderType;
  limitPrice?: number;
  /** Allocations as percentages 0–100 keyed by symbol (must sum ~100). */
  allocations?: Record<string, number>;
  prediction?: "up" | "down" | "unchanged";
  /** Learner reasoning — required for educational evaluation. */
  reasoning: string;
  expectedOutcome?: string;
  confidence?: "low" | "medium" | "high";
};

export type EducationalMarketSuccessRule =
  | {
      type: "action_in";
      actions: readonly EducationalMarketAction[];
    }
  | {
      type: "order_type";
      orderType: EducationalMarketOrderType;
    }
  | {
      type: "prediction";
      prediction: "up" | "down" | "unchanged";
    }
  | {
      type: "quantity_max";
      max: number;
    }
  | {
      type: "quantity_min";
      min: number;
    }
  | {
      type: "allocation_max_any";
      maxPercent: number;
    }
  | {
      type: "allocation_min_symbols";
      minSymbols: number;
    }
  | {
      type: "reasoning_keywords";
      anyOf: readonly string[];
    };

export type EducationalMarketScenario = {
  id: string;
  kind: EducationalMarketScenarioKind;
  title: string;
  conceptKey: string;
  conceptTitle: string;
  objective: string;
  prompt: string;
  skillFacet: MasteryFacetName;
  difficulty: 1 | 2 | 3 | 4 | 5;
  stage: "INTRODUCE" | "UNDERSTAND" | "PRACTICE" | "APPLY" | "CHALLENGE" | "RETAIN";
  contextVariant: string;
  state: EducationalMarketSimulationState;
  /** What the learner must demonstrate for objective alignment. */
  successRules: readonly EducationalMarketSuccessRule[];
  /** Soft rubric keywords for reasoning (AND with structured rules). */
  reasoningMustIncludeAny: readonly string[];
  misconceptionTargets?: readonly string[];
  successLooksLike: string;
  scaffolds?: readonly EducationalMarketScaffold[];
  accessibility?: ContentEnrichmentFields["accessibility"];
  /** Simulated outcome narrative after a coherent decision (educational). */
  outcomeNarrative: string;
  disclaimer: string;
};

export type EducationalMarketChartView = {
  symbol: string;
  points: EducationalMarketPricePoint[];
  entryPrice: number | null;
  eventMarkers: Array<{ t: number; label: string }>;
  educationalOnly: true;
  notATradingTerminal: true;
};

export type EducationalMarketJournalEntry = {
  decision: EducationalMarketDecision;
  recordedAtIso: string;
  educationalOnly: true;
  notFinancialAdvice: true;
};

export const EDUCATIONAL_MARKET_DISCLAIMER =
  "Educational simulation with fake money only. Not a brokerage, not financial advice, and simulated outcomes do not predict real-world returns.";

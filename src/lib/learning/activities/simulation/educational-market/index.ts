/**
 * 2P-17 — Educational Market & Trading Simulation (universal Simulation content).
 *
 * Fake money · deterministic scenarios · not a brokerage · not financial advice.
 */

export type {
  EducationalMarketAction,
  EducationalMarketChartView,
  EducationalMarketDecision,
  EducationalMarketJournalEntry,
  EducationalMarketOrderType,
  EducationalMarketScenario,
  EducationalMarketScenarioKind,
  EducationalMarketSimulationState,
  EducationalMarketSuccessRule,
} from "./types";

export {
  EDUCATIONAL_MARKET_DISCLAIMER,
} from "./types";

export {
  makeEducationalMarketState,
  applySimulatedBuy,
  applySimulatedSell,
  portfolioValue,
  educationalMarketStateTruthSummary,
} from "./state";

export {
  EDUCATIONAL_MARKET_SCENARIOS,
  getEducationalMarketScenario,
  listEducationalMarketScenarios,
  isEducationalMarketScenarioId,
} from "./scenarios";

export {
  parseEducationalMarketArtifact,
  evaluateEducationalMarketSubmission,
} from "./evaluate";

export { projectEducationalMarketChart } from "./chart";

export {
  buildEducationalMarketJournalEntry,
  serializeEducationalMarketArtifact,
} from "./journal";

export {
  educationalMarketIsNotBrokerage,
  educationalMarketIsNotRealMoney,
  educationalMarketIsNotFinancialAdvice,
  sourceMentionsForbiddenBrokerageInfra,
  educationalMarketBoundaryTruthSummary,
} from "./boundary";

export {
  educationalMarketScenarioToStructuredChallenge,
  listEducationalMarketStructuredChallenges,
} from "./to-challenge";

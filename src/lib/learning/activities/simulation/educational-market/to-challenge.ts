/**
 * 2P-17 — Map educational market scenarios → simulation challenge rows.
 * Avoids importing structured/service (circular dependency).
 */

import type { MasteryFacetName } from "@/lib/learning/types";
import type { EducationalMarketScenario } from "./types";

/** Subset of StructuredChallenge fields produced for finance simulations. */
export type EducationalMarketChallengeRow = {
  id: string;
  kind: "simulation";
  title: string;
  objective: string;
  prompt: string;
  learningObjectType: "SIMULATION";
  skillFacet: MasteryFacetName;
  asPerform: false;
  domainTag: "finance";
  minChars: number;
  conceptHints: readonly string[];
  misconceptionTargets?: readonly string[];
  successLooksLike: string;
  accessibility?: EducationalMarketScenario["accessibility"];
  scaffolds?: EducationalMarketScenario["scaffolds"];
  rules: Record<string, unknown>;
  criteria: Array<{
    id: string;
    label: string;
    mustIncludeAny: string[];
  }>;
};

export function educationalMarketScenarioToStructuredChallenge(
  scenario: EducationalMarketScenario,
): EducationalMarketChallengeRow {
  return {
    id: scenario.id,
    kind: "simulation",
    title: scenario.title,
    objective: scenario.objective,
    prompt: scenario.prompt,
    learningObjectType: "SIMULATION",
    skillFacet: scenario.skillFacet,
    asPerform: false,
    domainTag: "finance",
    minChars: 40,
    conceptHints: [
      scenario.conceptKey.replace(/-/g, " "),
      ...scenario.conceptTitle.toLowerCase().split(/\s+/),
      "finance",
      "trading",
      "simulation",
      "fake money",
    ],
    misconceptionTargets: scenario.misconceptionTargets,
    successLooksLike: scenario.successLooksLike,
    accessibility: scenario.accessibility,
    scaffolds: scenario.scaffolds,
    rules: {
      domains: ["finance", "trading-education"],
      educationalMarket: true,
      educationalOnly: true,
      realMoney: false,
      brokerage: false,
      scenarioKind: scenario.kind,
      conceptKey: scenario.conceptKey,
      state: scenario.state,
    },
    criteria: [
      {
        id: "reasoning",
        label: "Educational reasoning",
        mustIncludeAny: [...scenario.reasoningMustIncludeAny, "because", "risk"],
      },
      {
        id: "paper",
        label: "Simulated / fake money framing",
        mustIncludeAny: [
          "fake",
          "paper",
          "simulated",
          "educational",
          "cash",
          "shares",
          "allocat",
          "hold",
          "buy",
          "sell",
        ],
      },
    ],
  };
}

export function listEducationalMarketStructuredChallenges(
  scenarios: readonly EducationalMarketScenario[],
): EducationalMarketChallengeRow[] {
  return scenarios.map(educationalMarketScenarioToStructuredChallenge);
}

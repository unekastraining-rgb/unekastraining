/**
 * 2P-17 — Evaluate educational market decisions.
 * Reasoning + objective alignment matter. Simulated P&L alone is not mastery.
 */

import {
  makeServerEvaluation,
  outcomeFromPassRatio,
} from "@/lib/learning/activities/server-evaluation";
import type { UniversalEvaluationResult } from "@/lib/learning/activities/execution-contract";
import type {
  EducationalMarketDecision,
  EducationalMarketScenario,
  EducationalMarketSuccessRule,
} from "./types";

export function parseEducationalMarketArtifact(
  artifact: string,
): EducationalMarketDecision | null {
  const trimmed = artifact.trim();
  if (!trimmed) return null;

  try {
    const parsed = JSON.parse(trimmed) as Record<string, unknown>;
    const decision =
      parsed.decision && typeof parsed.decision === "object"
        ? (parsed.decision as Record<string, unknown>)
        : parsed;
    const action = decision.action;
    const reasoning =
      typeof decision.reasoning === "string"
        ? decision.reasoning
        : typeof parsed.reasoning === "string"
          ? parsed.reasoning
          : "";
    if (typeof action !== "string" || !reasoning.trim()) return null;
    return {
      action: action as EducationalMarketDecision["action"],
      symbol: typeof decision.symbol === "string" ? decision.symbol : undefined,
      quantity:
        typeof decision.quantity === "number" ? decision.quantity : undefined,
      orderType:
        decision.orderType === "market" || decision.orderType === "limit"
          ? decision.orderType
          : undefined,
      limitPrice:
        typeof decision.limitPrice === "number"
          ? decision.limitPrice
          : undefined,
      allocations:
        decision.allocations && typeof decision.allocations === "object"
          ? (decision.allocations as Record<string, number>)
          : undefined,
      prediction:
        decision.prediction === "up" ||
        decision.prediction === "down" ||
        decision.prediction === "unchanged"
          ? decision.prediction
          : undefined,
      reasoning: reasoning.trim(),
      expectedOutcome:
        typeof decision.expectedOutcome === "string"
          ? decision.expectedOutcome
          : undefined,
      confidence:
        decision.confidence === "low" ||
        decision.confidence === "medium" ||
        decision.confidence === "high"
          ? decision.confidence
          : undefined,
    };
  } catch {
    // Fall through to text heuristic for legacy free-text submissions.
  }

  const lower = trimmed.toLowerCase();
  let action: EducationalMarketDecision["action"] | null = null;
  if (/\bhold\b/.test(lower)) action = "hold";
  else if (/\ballocate\b|\ballocation\b/.test(lower)) action = "allocate";
  else if (/\bpredict\b|\bprice (will )?(rise|fall|up|down)/.test(lower))
    action = "predict";
  else if (/\bsell\b/.test(lower)) action = "sell";
  else if (/\bbuy\b|\bmarket order\b|\blimit order\b|\bshares\b/.test(lower))
    action = "buy";
  else if (/\bsize\b|\bposition\b/.test(lower)) action = "size_position";
  else if (/\bdemand\b/.test(lower) && /\bsupply\b/.test(lower))
    action = "predict";

  if (!action || trimmed.length < 40) return null;

  const qtyMatch = lower.match(/\b(\d+)\s*shares?\b/);
  const prediction = lower.includes("unchanged")
    ? "unchanged"
    : /\b(up|rise|risen|rose|higher|increase)\b/.test(lower)
      ? "up"
      : /\b(down|fall|lower|decrease)\b/.test(lower)
        ? "down"
        : undefined;

  return {
    action,
    quantity: qtyMatch ? Number(qtyMatch[1]) : undefined,
    orderType: lower.includes("limit")
      ? "limit"
      : lower.includes("market")
        ? "market"
        : undefined,
    prediction,
    reasoning: trimmed,
  };
}

function rulePasses(
  rule: EducationalMarketSuccessRule,
  decision: EducationalMarketDecision,
): boolean {
  switch (rule.type) {
    case "action_in":
      return rule.actions.includes(decision.action);
    case "order_type":
      // Limit scenario: require limit. Market scenario: market OR explicit discussion.
      if (rule.orderType === "limit") return decision.orderType === "limit";
      return (
        decision.orderType === "market" ||
        decision.reasoning.toLowerCase().includes("market")
      );
    case "prediction":
      return decision.prediction === rule.prediction;
    case "quantity_max":
      if (decision.action === "hold" && decision.quantity == null) return true;
      return decision.quantity != null && decision.quantity <= rule.max;
    case "quantity_min":
      if (decision.action === "hold") return true;
      return decision.quantity != null && decision.quantity >= rule.min;
    case "allocation_max_any": {
      const alloc = decision.allocations ?? {};
      const values = Object.values(alloc);
      if (values.length === 0) return false;
      return values.every((v) => v <= rule.maxPercent);
    }
    case "allocation_min_symbols": {
      const alloc = decision.allocations ?? {};
      const nonzero = Object.values(alloc).filter((v) => v > 0).length;
      return nonzero >= rule.minSymbols;
    }
    case "reasoning_keywords": {
      const lower = decision.reasoning.toLowerCase();
      return rule.anyOf.some((k) => lower.includes(k.toLowerCase()));
    }
    default:
      return false;
  }
}

/**
 * Evaluate a market scenario submission.
 * Simulated profit is intentionally NOT a pass criterion.
 */
export function evaluateEducationalMarketSubmission(
  scenario: EducationalMarketScenario,
  artifact: string,
): UniversalEvaluationResult {
  const decision = parseEducationalMarketArtifact(artifact);
  if (!decision) {
    return makeServerEvaluation({
      outcome: "FAIL",
      score: 0,
      skillFacet: scenario.skillFacet,
      details: {
        mode: "educational_market",
        error: "missing_or_invalid_decision",
        contentId: scenario.id,
        objective: scenario.objective,
        educationalOnly: true,
        profitIsNotMastery: true,
      },
    });
  }

  if (decision.reasoning.trim().length < 24) {
    return makeServerEvaluation({
      outcome: "FAIL",
      score: 0,
      skillFacet: scenario.skillFacet,
      details: {
        mode: "educational_market",
        error: "reasoning_too_short",
        contentId: scenario.id,
        educationalOnly: true,
        profitIsNotMastery: true,
      },
    });
  }

  const ruleResults = scenario.successRules.map((rule) => ({
    rule,
    pass: rulePasses(rule, decision),
  }));
  const rulesPassed = ruleResults.filter((r) => r.pass).length;
  const rulesTotal = ruleResults.length || 1;

  const lower = decision.reasoning.toLowerCase();
  const reasoningHit = scenario.reasoningMustIncludeAny.some((k) =>
    lower.includes(k.toLowerCase()),
  );

  // All structured success rules must pass — partial credit is not SUCCESS.
  // Reasoning keywords contribute to score but cannot override a failed rule.
  const allRulesPass = ruleResults.every((r) => r.pass);
  const ruleRatio = rulesPassed / rulesTotal;
  const reasoningScore = reasoningHit ? 1 : 0;
  const score = allRulesPass
    ? ruleRatio * 0.7 + reasoningScore * 0.3
    : Math.min(0.45, ruleRatio * 0.5 + reasoningScore * 0.2);

  // Guard: claims of guaranteed profit / real brokerage fail educational integrity.
  const integrityFail =
    /\bguaranteed (profit|returns?)\b/i.test(decision.reasoning) ||
    /\breal (money|brokerage|account)\b/i.test(decision.reasoning) ||
    /\bdeposit\b.*\bbank\b/i.test(decision.reasoning);

  const finalScore = integrityFail ? Math.min(score, 0.2) : score;

  return makeServerEvaluation({
    outcome:
      integrityFail || !allRulesPass || !reasoningHit
        ? "FAIL"
        : outcomeFromPassRatio(finalScore),
    score: finalScore,
    skillFacet: scenario.skillFacet,
    details: {
      mode: "educational_market",
      contentId: scenario.id,
      objective: scenario.objective,
      educationalOnly: true,
      realMoney: false,
      brokerage: false,
      profitIsNotMastery: true,
      lossIsNotAutomaticFailure: true,
      notFinancialAdvice: true,
      decision,
      ruleResults: ruleResults.map((r) => ({
        type: r.rule.type,
        pass: r.pass,
      })),
      reasoningHit,
      integrityFail,
      outcomeNarrative: scenario.outcomeNarrative,
      disclaimer: scenario.disclaimer,
    },
  });
}

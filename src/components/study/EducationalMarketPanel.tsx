"use client";

/**
 * 2P-17 — Educational market simulation panel (fake money only).
 * Not a trading terminal. Not a brokerage. Not financial advice.
 */

import { useEffect, useMemo, useState } from "react";

import type {
  EducationalMarketAction,
  EducationalMarketChartView,
  EducationalMarketDecision,
  EducationalMarketOrderType,
  EducationalMarketSimulationState,
} from "@/lib/learning/activities/simulation/educational-market";
import {
  EDUCATIONAL_MARKET_DISCLAIMER,
  buildEducationalMarketJournalEntry,
  serializeEducationalMarketArtifact,
} from "@/lib/learning/activities/simulation/educational-market";

export type EducationalMarketPanelProps = {
  scenarioId: string;
  state: EducationalMarketSimulationState;
  chart: EducationalMarketChartView;
  prompt: string;
  onArtifactChange: (artifact: string) => void;
};

export function EducationalMarketPanel({
  scenarioId,
  state,
  chart,
  prompt,
  onArtifactChange,
}: EducationalMarketPanelProps) {
  const [action, setAction] = useState<EducationalMarketAction>("hold");
  const [orderType, setOrderType] =
    useState<EducationalMarketOrderType>("market");
  const [quantity, setQuantity] = useState(10);
  const [limitPrice, setLimitPrice] = useState(
    chart.entryPrice ?? Object.values(state.currentPrices)[0] ?? 50,
  );
  const [prediction, setPrediction] = useState<"up" | "down" | "unchanged">(
    "up",
  );
  const [reasoning, setReasoning] = useState("");
  const [expectedOutcome, setExpectedOutcome] = useState("");
  const [confidence, setConfidence] = useState<"low" | "medium" | "high">(
    "medium",
  );
  const symbols = Object.keys(state.currentPrices);
  const [allocations, setAllocations] = useState<Record<string, number>>(() => {
    const n = Math.max(symbols.length, 1);
    const even = Math.floor(100 / n);
    const out: Record<string, number> = {};
    symbols.forEach((s, i) => {
      out[s] = i === n - 1 ? 100 - even * (n - 1) : even;
    });
    return out;
  });

  const decision: EducationalMarketDecision = useMemo(
    () => ({
      action,
      symbol: symbols[0],
      quantity:
        action === "hold" || action === "predict" || action === "allocate"
          ? undefined
          : quantity,
      orderType:
        action === "buy" || action === "sell" ? orderType : undefined,
      limitPrice: orderType === "limit" ? limitPrice : undefined,
      allocations: action === "allocate" ? allocations : undefined,
      prediction:
        action === "predict" ||
        scenarioId.includes("supply") ||
        scenarioId.includes("shock")
          ? prediction
          : undefined,
      reasoning,
      expectedOutcome: expectedOutcome || undefined,
      confidence,
    }),
    [
      action,
      allocations,
      confidence,
      expectedOutcome,
      limitPrice,
      orderType,
      prediction,
      quantity,
      reasoning,
      scenarioId,
      symbols,
    ],
  );

  useEffect(() => {
    const journal = buildEducationalMarketJournalEntry(decision);
    onArtifactChange(
      serializeEducationalMarketArtifact({ decision, journal }),
    );
  }, [decision, onArtifactChange]);

  const maxPrice = Math.max(...chart.points.map((p) => p.price), 1);
  const minPrice = Math.min(...chart.points.map((p) => p.price), 0);
  const span = Math.max(maxPrice - minPrice, 1);

  return (
    <section
      className="space-y-4 rounded-2xl border border-teal-200 bg-teal-50/40 p-4"
      data-educational-market
      data-real-money="false"
      data-brokerage="false"
      aria-label="Educational market simulation"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">
        Educational simulation · fake money only
      </p>
      <p className="text-xs text-stone-600">{EDUCATIONAL_MARKET_DISCLAIMER}</p>
      <p className="text-sm text-stone-800">{prompt}</p>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-white/80 p-3 text-sm">
          <p className="text-xs text-stone-500">Fake cash</p>
          <p className="font-semibold text-stone-900">
            {state.currencyLabel} {state.cash.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl bg-white/80 p-3 text-sm">
          <p className="text-xs text-stone-500">Paper portfolio</p>
          <p className="font-semibold text-stone-900">
            {state.currencyLabel} {state.portfolioValue.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl bg-white/80 p-3 text-sm">
          <p className="text-xs text-stone-500">Prices</p>
          <p className="font-semibold text-stone-900">
            {Object.entries(state.currentPrices)
              .map(([s, p]) => `${s} ${p}`)
              .join(" · ")}
          </p>
        </div>
      </div>

      <div data-educational-chart aria-hidden="true">
        <p className="mb-1 text-xs font-semibold text-stone-500">
          Educational price path ({chart.symbol}) — not a trading terminal
        </p>
        <svg viewBox="0 0 320 80" className="h-20 w-full rounded-lg bg-white">
          {chart.points.map((p, i) => {
            if (i === 0) return null;
            const prev = chart.points[i - 1]!;
            const x1 = (prev.t / Math.max(chart.points.length - 1, 1)) * 300 + 10;
            const x2 = (p.t / Math.max(chart.points.length - 1, 1)) * 300 + 10;
            const y1 = 70 - ((prev.price - minPrice) / span) * 55;
            const y2 = 70 - ((p.price - minPrice) / span) * 55;
            return (
              <line
                key={`seg-${i}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#0f766e"
                strokeWidth="2"
              />
            );
          })}
          {chart.eventMarkers.map((m) => {
            const x = (m.t / Math.max(chart.points.length - 1, 1)) * 300 + 10;
            return (
              <g key={`ev-${m.t}-${m.label}`}>
                <line x1={x} y1={8} x2={x} y2={72} stroke="#a8a29e" strokeDasharray="3 3" />
                <text x={x + 2} y={12} className="fill-stone-500" fontSize="7">
                  {m.label.slice(0, 18)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-medium text-stone-700">
          Decision
          <select
            className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2"
            value={action}
            onChange={(e) => setAction(e.target.value as EducationalMarketAction)}
          >
            <option value="buy">Buy (paper)</option>
            <option value="sell">Sell (paper)</option>
            <option value="hold">Hold</option>
            <option value="allocate">Allocate</option>
            <option value="predict">Predict price direction</option>
            <option value="size_position">Size position</option>
          </select>
        </label>
        {(action === "buy" || action === "sell" || action === "size_position") && (
          <label className="block text-sm font-medium text-stone-700">
            Quantity (shares)
            <input
              type="number"
              min={0}
              className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value) || 0)}
            />
          </label>
        )}
        {(action === "buy" || action === "sell") && (
          <label className="block text-sm font-medium text-stone-700">
            Order type
            <select
              className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2"
              value={orderType}
              onChange={(e) =>
                setOrderType(e.target.value as EducationalMarketOrderType)
              }
            >
              <option value="market">Market</option>
              <option value="limit">Limit</option>
            </select>
          </label>
        )}
        {orderType === "limit" && (action === "buy" || action === "sell") && (
          <label className="block text-sm font-medium text-stone-700">
            Limit price
            <input
              type="number"
              className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2"
              value={limitPrice}
              onChange={(e) => setLimitPrice(Number(e.target.value) || 0)}
            />
          </label>
        )}
        {(action === "predict" ||
          scenarioId.includes("supply") ||
          scenarioId.includes("shock")) && (
          <label className="block text-sm font-medium text-stone-700">
            Predicted price direction
            <select
              className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2"
              value={prediction}
              onChange={(e) =>
                setPrediction(e.target.value as "up" | "down" | "unchanged")
              }
            >
              <option value="up">Up</option>
              <option value="down">Down</option>
              <option value="unchanged">Unchanged</option>
            </select>
          </label>
        )}
      </div>

      {action === "allocate" ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-stone-700">
            Allocations (% — should total ~100)
          </p>
          {symbols.map((s) => (
            <label key={s} className="flex items-center gap-2 text-sm">
              <span className="w-14 font-semibold">{s}</span>
              <input
                type="number"
                min={0}
                max={100}
                className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2"
                value={allocations[s] ?? 0}
                onChange={(e) =>
                  setAllocations((prev) => ({
                    ...prev,
                    [s]: Number(e.target.value) || 0,
                  }))
                }
              />
            </label>
          ))}
        </div>
      ) : null}

      <label className="block text-sm font-medium text-stone-700">
        Reasoning (required — profit alone is not mastery)
        <textarea
          className="mt-1 min-h-[6rem] w-full rounded-xl border border-stone-200 bg-white px-3 py-2"
          value={reasoning}
          onChange={(e) => setReasoning(e.target.value)}
          placeholder="Explain why this decision fits the educational objective…"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-medium text-stone-700">
          Expected outcome (optional journal)
          <input
            className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2"
            value={expectedOutcome}
            onChange={(e) => setExpectedOutcome(e.target.value)}
          />
        </label>
        <label className="block text-sm font-medium text-stone-700">
          Confidence
          <select
            className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2"
            value={confidence}
            onChange={(e) =>
              setConfidence(e.target.value as "low" | "medium" | "high")
            }
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>
      </div>
    </section>
  );
}

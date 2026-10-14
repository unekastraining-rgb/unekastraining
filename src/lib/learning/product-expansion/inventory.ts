/**
 * 2P-14 — Deterministic product-expansion inventory (inspection aid).
 *
 * Mirrors existing Adaptive / capability contracts. Does NOT invent engines,
 * select interventions, or write evidence/mastery.
 */

import {
  ACTIVITY_ADAPTIVE_COMPLETION_CONTRACTS,
  isAdaptiveReadyActivityAdapterKey,
} from "@/lib/learning/sequence/activity-adaptive-completion";
import { listActivityInterventionCapabilities } from "@/lib/learning/orchestrator/activity-intervention-capability";

export type ActivityMaturityBand =
  | "FOUNDATION"
  | "PRODUCT_READY"
  | "ADAPTIVE_READY"
  | "DEEP_PRODUCTION";

export type ActivityInventoryRow = {
  adapterKey: string;
  maturity: ActivityMaturityBand;
  adaptiveReady: boolean;
  notes: string;
};

/** Universal activity keys that are Adaptive-ready today (from completion contracts). */
export function listAdaptiveReadyUniversalActivityKeys(): readonly string[] {
  return ACTIVITY_ADAPTIVE_COMPLETION_CONTRACTS.map((c) => c.adapterKey);
}

/** Product-ready universal keys that are intentionally not Adaptive-ready. */
export function listProductReadyNotAdaptiveActivityKeys(): readonly string[] {
  return listActivityInterventionCapabilities()
    .filter(
      (c) =>
        !c.assessmentOnly &&
        c.launchIntegrated &&
        c.evidenceIntegrated &&
        !c.adaptiveBindIntegrated &&
        (c.role === "intervention_capable" || c.role === "create_only"),
    )
    .map((c) => c.adapterKey)
    .sort();
}

/**
 * Snapshot inventory for expansion planning — derived from live contracts.
 */
export function buildUniversalActivityInventory(): ActivityInventoryRow[] {
  const adaptiveReady = new Set(listAdaptiveReadyUniversalActivityKeys());
  const rows: ActivityInventoryRow[] = [];

  for (const cap of listActivityInterventionCapabilities()) {
    const key = cap.adapterKey;
    if (cap.assessmentOnly) {
      rows.push({
        adapterKey: key,
        maturity: "DEEP_PRODUCTION",
        adaptiveReady: false,
        notes: "Assessment-only; own Adaptive adapter path (not universal bind).",
      });
      continue;
    }
    if (adaptiveReady.has(key) || isAdaptiveReadyActivityAdapterKey(key)) {
      rows.push({
        adapterKey: key,
        maturity: "ADAPTIVE_READY",
        adaptiveReady: true,
        notes: "Universal Adaptive completion contract present.",
      });
      continue;
    }
    if (cap.evidenceIntegrated && cap.launchIntegrated) {
      rows.push({
        adapterKey: key,
        maturity: "PRODUCT_READY",
        adaptiveReady: false,
        notes: "Launch + evidence exist; Adaptive bind intentionally off.",
      });
      continue;
    }
    rows.push({
      adapterKey: key,
      maturity: "FOUNDATION",
      adaptiveReady: false,
      notes: "Capability registered; product path incomplete.",
    });
  }

  return rows.sort((a, b) => a.adapterKey.localeCompare(b.adapterKey));
}

export type FutureExperienceClassification =
  | "EXISTING_ENGINE"
  | "CONTENT_IN_EXISTING"
  | "COMBINATION"
  | "SPECIALIZED_ENGINE";

/**
 * Design-time classification for experiences not yet introduced as product engines.
 * Pure lookup — does not implement any of these.
 */
export function classifyFutureExperienceCandidate(
  id: string,
): FutureExperienceClassification {
  switch (id) {
    case "market-trading-educational-sim":
    case "clinical-scenario":
    case "case-study-decision":
    case "entrepreneurship-business-sim":
    case "automotive-diagnostics":
    case "circuit-electrical-troubleshoot":
      return "CONTENT_IN_EXISTING";
    case "network-topology-sim":
    case "cybersecurity-sandbox":
    case "chemistry-experiment":
    case "physics-experiment":
    case "medical-dosage-calc":
    case "financial-modeling":
    case "historical-source-analysis":
    case "debate-oral-argument":
    case "geography-map":
      return "COMBINATION";
    case "math-workspace":
    case "language-conversation-speaking":
    case "music-practice":
    case "art-drawing-practice":
    case "3d-spatial-anatomy":
    case "cad-spatial-design":
    case "engineering-design":
    case "virtual-equipment-operation":
      return "SPECIALIZED_ENGINE";
    default:
      return "EXISTING_ENGINE";
  }
}

/** Explicit: educational market learning uses fake money / scenarios — not brokerage. */
export function educationalMarketSimulationIsNotBrokerage(): true {
  return true;
}

/** Free-form subjectDomain — no giant subject enum in ULE. */
export function productExpansionRequiresSubjectEnum(): false {
  return false;
}

export function productExpansionTruthSummary(): {
  doesNotCreateSecondOrchestrator: true;
  doesNotCreateSecondMastery: true;
  doesNotCreateSecondEvidence: true;
  doesNotImplementNewEnginesInThisPhase: true;
  educationalMarketIsNotRealMoneyTrading: true;
} {
  return {
    doesNotCreateSecondOrchestrator: true,
    doesNotCreateSecondMastery: true,
    doesNotCreateSecondEvidence: true,
    doesNotImplementNewEnginesInThisPhase: true,
    educationalMarketIsNotRealMoneyTrading: true,
  };
}

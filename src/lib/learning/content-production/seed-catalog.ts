/**
 * 2P-16 — Seed catalog registry (points at existing catalog rows).
 *
 * Not a second content system — identity list for tests + density.
 */

import type { UniversalContentActivityKind } from "@/lib/learning/activities/content-contract";
import { assessAdaptiveReadyCatalogItem } from "./adaptive-ready-contract";

export type SeedCatalogItem = {
  contentId: string;
  activityKind: UniversalContentActivityKind;
  domainFamily:
    | "computer_science"
    | "networking"
    | "nursing"
    | "finance"
    | "electrical"
    | "automotive"
    | "history"
    | "math_science"
    | "general_academic"
    | "business"
    | "cybersecurity";
  /** Representative conceptKey in progression catalog. */
  conceptKey: string;
};

/** Deliberately small seed set proving cross-domain depth. */
export const ADAPTIVE_CATALOG_SEED_ITEMS: readonly SeedCatalogItem[] = [
  {
    contentId: "java-inheritance-subclass",
    activityKind: "coding",
    domainFamily: "computer_science",
    conceptKey: "java-inheritance",
  },
  {
    contentId: "java-exception-try-catch",
    activityKind: "coding",
    domainFamily: "computer_science",
    conceptKey: "java-exception-handling",
  },
  {
    contentId: "js-debug-off-by-one",
    activityKind: "coding",
    domainFamily: "computer_science",
    conceptKey: "programming-debugging",
  },
  {
    contentId: "sql-high-grades",
    activityKind: "sql",
    domainFamily: "computer_science",
    conceptKey: "sql-filtering",
  },
  {
    contentId: "sql-join-enrollments",
    activityKind: "sql",
    domainFamily: "computer_science",
    conceptKey: "sql-joins",
  },
  {
    contentId: "lab-network-connectivity",
    activityKind: "lab",
    domainFamily: "networking",
    conceptKey: "dhcp-troubleshooting",
  },
  {
    contentId: "sim-network-fault",
    activityKind: "simulation",
    domainFamily: "networking",
    conceptKey: "dhcp-troubleshooting",
  },
  {
    contentId: "sim-dns-misconfig",
    activityKind: "simulation",
    domainFamily: "networking",
    conceptKey: "dns-troubleshooting",
  },
  {
    contentId: "sim-patient-triage",
    activityKind: "simulation",
    domainFamily: "nursing",
    conceptKey: "clinical-decision-making",
  },
  {
    contentId: "sim-patient-priority",
    activityKind: "simulation",
    domainFamily: "nursing",
    conceptKey: "clinical-prioritization",
  },
  {
    contentId: "sim-supply-demand",
    activityKind: "simulation",
    domainFamily: "finance",
    conceptKey: "supply-and-demand",
  },
  {
    contentId: "sim-market-order-edu",
    activityKind: "simulation",
    domainFamily: "finance",
    conceptKey: "market-orders",
  },
  {
    contentId: "edu-mkt-limit-order-patience",
    activityKind: "simulation",
    domainFamily: "finance",
    conceptKey: "limit-orders",
  },
  {
    contentId: "edu-mkt-position-sizing-2pct",
    activityKind: "simulation",
    domainFamily: "finance",
    conceptKey: "position-sizing",
  },
  {
    contentId: "edu-mkt-diversify-allocate",
    activityKind: "simulation",
    domainFamily: "finance",
    conceptKey: "diversification",
  },
  {
    contentId: "edu-mkt-event-earnings",
    activityKind: "simulation",
    domainFamily: "finance",
    conceptKey: "market-events",
  },
  {
    contentId: "edu-mkt-volatility-risk",
    activityKind: "simulation",
    domainFamily: "finance",
    conceptKey: "volatility-risk",
  },
  {
    contentId: "lab-circuit-fault",
    activityKind: "lab",
    domainFamily: "electrical",
    conceptKey: "circuit-fault-diagnosis",
  },
  {
    contentId: "sim-vehicle-diagnostic",
    activityKind: "simulation",
    domainFamily: "automotive",
    conceptKey: "vehicle-diagnostics",
  },
  {
    contentId: "presentation-history-sources",
    activityKind: "presentation",
    domainFamily: "history",
    conceptKey: "historical-cause-effect",
  },
  {
    contentId: "write-history-cause-effect",
    activityKind: "writing",
    domainFamily: "history",
    conceptKey: "historical-cause-effect",
  },
  {
    contentId: "write-math-proportional-reasoning",
    activityKind: "writing",
    domainFamily: "math_science",
    conceptKey: "proportional-reasoning",
  },
  {
    contentId: "write-thesis-climate-policy",
    activityKind: "writing",
    domainFamily: "general_academic",
    conceptKey: "academic-thesis",
  },
  {
    contentId: "write-revision-unclear-thesis",
    activityKind: "writing",
    domainFamily: "general_academic",
    conceptKey: "writing-revision",
  },
  {
    contentId: "write-tech-explain-https",
    activityKind: "writing",
    domainFamily: "computer_science",
    conceptKey: "https-explanation",
  },
  {
    contentId: "lab-physics-force-balance",
    activityKind: "lab",
    domainFamily: "math_science",
    conceptKey: "net-force-reasoning",
  },
  {
    contentId: "lab-observe-density",
    activityKind: "lab",
    domainFamily: "math_science",
    conceptKey: "density",
  },
  // 2P-26 representative expansion seeds (keep registry under 40)
  {
    contentId: "java-equals-vs-eq",
    activityKind: "coding",
    domainFamily: "computer_science",
    conceptKey: "java-equals-vs-eq",
  },
  {
    contentId: "sql-group-by-having",
    activityKind: "sql",
    domainFamily: "computer_science",
    conceptKey: "sql-group-having",
  },
  {
    contentId: "lab-subnet-boundary",
    activityKind: "lab",
    domainFamily: "networking",
    conceptKey: "subnet-boundaries",
  },
  {
    contentId: "sim-phishing-cues",
    activityKind: "simulation",
    domainFamily: "cybersecurity",
    conceptKey: "phishing-recognition",
  },
  {
    contentId: "sim-med-safety-five-rights",
    activityKind: "simulation",
    domainFamily: "nursing",
    conceptKey: "medication-safety-rights",
  },
  {
    contentId: "sim-demand-shift-vs-move",
    activityKind: "simulation",
    domainFamily: "business",
    conceptKey: "demand-shift-vs-movement",
  },
  {
    contentId: "lab-electrical-lockout",
    activityKind: "lab",
    domainFamily: "electrical",
    conceptKey: "electrical-lockout",
  },
  {
    contentId: "write-source-bias",
    activityKind: "writing",
    domainFamily: "history",
    conceptKey: "source-bias-analysis",
  },
] as const;

/** Chemistry density lab lacks progression — document as catalog-only seed. */
export function listSeedItems(): SeedCatalogItem[] {
  return [...ADAPTIVE_CATALOG_SEED_ITEMS];
}

export function listAdaptiveReadySeedAssessments() {
  return ADAPTIVE_CATALOG_SEED_ITEMS.map((item) => ({
    ...item,
    assessment: assessAdaptiveReadyCatalogItem({
      activityKind: item.activityKind,
      contentId: item.contentId,
    }),
  }));
}

export function educationalMarketSeedIsNotBrokerage(): true {
  return true;
}

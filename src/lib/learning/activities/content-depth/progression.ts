/**
 * 2P-32 — Progression entries for content-depth pack + CS/SQL variant ladders.
 */

import type { ContentProgressionEntry } from "@/lib/learning/content-progression/types";

function entry(
  partial: Omit<ContentProgressionEntry, "contentVersion" | "authorship"> & {
    authorship?: ContentProgressionEntry["authorship"];
    contentVersion?: string;
    ownerLearnerId?: string | null;
    readiness?: ContentProgressionEntry["readiness"];
  },
): ContentProgressionEntry {
  return {
    ...partial,
    authorship: partial.authorship ?? "system",
    contentVersion: partial.contentVersion ?? `v1:${partial.contentKey}`,
    ownerLearnerId: partial.ownerLearnerId ?? null,
    readiness: partial.readiness ?? "READY",
  };
}

export const CONTENT_DEPTH_PROGRESSION_ENTRIES: ContentProgressionEntry[] = [
  // CS inheritance retain (APPLY/CHALLENGE contentIds updated on main ladder)
  entry({
    contentKey: "cs-inheritance-retain",
    conceptKey: "java-inheritance",
    conceptTitle: "Java inheritance",
    stage: "RETAIN",
    difficulty: 3,
    contextVariant: "delayed retrieval of vehicle hierarchy",
    activityKind: "coding",
    contentId: "java-inheritance-vehicle",
    objective: "Retrieve inheritance relationships in a fresh vehicle sketch.",
    domainContext: "computer science",
  }),

  // SQL JOIN — customers/orders variant + challenge
  entry({
    contentKey: "sql-join-customers-orders",
    conceptKey: "sql-joins",
    conceptTitle: "SQL joins",
    stage: "APPLY",
    difficulty: 3,
    contextVariant: "customers and orders",
    activityKind: "sql",
    contentId: "sql-join-customers-orders",
    objective: "INNER JOIN customers to orders on matching keys.",
    domainContext: "computer science",
  }),
  entry({
    contentKey: "sql-subquery-challenge",
    conceptKey: "sql-joins",
    conceptTitle: "SQL joins",
    stage: "CHALLENGE",
    difficulty: 4,
    contextVariant: "orders above average amount via subquery",
    activityKind: "sql",
    contentId: "sql-subquery-above-avg",
    objective: "Filter with a subquery comparing to an aggregate.",
    domainContext: "computer science",
  }),
  entry({
    contentKey: "sql-filter-retain",
    conceptKey: "sql-filtering",
    conceptTitle: "SQL filtering",
    stage: "RETAIN",
    difficulty: 2,
    contextVariant: "delayed WHERE retrieval on products",
    activityKind: "sql",
    contentId: "sql-filter-products-retain",
    objective: "Retrieve WHERE filtering on a new products table.",
    domainContext: "computer science",
  }),

  // Cybersecurity depth
  entry({
    contentKey: "cyber-authz-challenge",
    conceptKey: "authorization-rbac",
    conceptTitle: "Authorization (RBAC)",
    stage: "CHALLENGE",
    difficulty: 4,
    contextVariant: "reader role 403 on update",
    activityKind: "simulation",
    contentId: "sim-authz-rbac-challenge",
    objective: "Diagnose authorization vs authentication failure.",
    domainContext: "cybersecurity",
  }),
  entry({
    contentKey: "cyber-phishing-retain",
    conceptKey: "phishing-recognition",
    conceptTitle: "Phishing recognition",
    stage: "RETAIN",
    difficulty: 3,
    contextVariant: "bank SMS short-link retrieval",
    activityKind: "simulation",
    contentId: "sim-phishing-retain",
    objective: "Retrieve safe phishing response without re-reading prior scenario.",
    domainContext: "cybersecurity",
  }),

  // Nursing challenge
  entry({
    contentKey: "nurse-sepsis-challenge",
    conceptKey: "clinical-prioritization",
    conceptTitle: "Clinical prioritization",
    stage: "CHALLENGE",
    difficulty: 5,
    contextVariant: "post-op sepsis signs multi-step",
    activityKind: "simulation",
    contentId: "sim-nursing-sepsis-challenge",
    objective: "Prioritize actions for a deteriorating educational patient scenario.",
    domainContext: "nursing",
  }),

  // Business challenge
  entry({
    contentKey: "biz-price-ceiling-challenge",
    conceptKey: "supply-and-demand",
    conceptTitle: "Supply and demand",
    stage: "CHALLENGE",
    difficulty: 4,
    contextVariant: "rent ceiling below equilibrium",
    activityKind: "simulation",
    contentId: "sim-price-ceiling-challenge",
    objective: "Transfer supply/demand reasoning to a binding price ceiling.",
    domainContext: "business",
  }),

  // Writing challenge
  entry({
    contentKey: "write-evidence-transfer-challenge",
    conceptKey: "claim-evidence-reasoning",
    conceptTitle: "Claim-evidence-reasoning",
    stage: "CHALLENGE",
    difficulty: 4,
    contextVariant: "bike lane civic transfer",
    activityKind: "writing",
    contentId: "write-evidence-transfer-challenge",
    objective: "Write CER paragraph in an unfamiliar civic context.",
    domainContext: "english",
  }),

  // Game / Project
  entry({
    contentKey: "game-security-terms-challenge",
    conceptKey: "authentication-basics",
    conceptTitle: "Authentication basics",
    stage: "CHALLENGE",
    difficulty: 3,
    contextVariant: "authn/authz/phishing match",
    activityKind: "game",
    contentId: "game-security-terms-challenge",
    objective: "Match security terms to accurate definitions.",
    domainContext: "cybersecurity",
  }),
  entry({
    contentKey: "project-api-feature-challenge",
    conceptKey: "software-feature-planning",
    conceptTitle: "Software feature planning",
    stage: "CHALLENGE",
    difficulty: 4,
    contextVariant: "rate-limited API with risk",
    activityKind: "project",
    contentId: "project-api-feature-challenge",
    objective: "Plan an API feature with acceptance and risk mitigation.",
    domainContext: "computer science",
  }),
];

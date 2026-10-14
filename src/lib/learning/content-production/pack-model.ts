/**
 * 2P-15 — Conceptual domain / content pack model (design-only).
 *
 * Packs reuse existing Concept + catalog + progression — no pack DB table.
 */

import type { ContentPackDescriptor, PackConceptPlan } from "./types";

/** Design-time pack plans — NOT authored content in this phase. */
export const DESIGN_TIME_CONTENT_PACKS: ContentPackDescriptor[] = [
  {
    packId: "pack-java-cs",
    domainLabel: "Java / Computer Science",
    conceptKeys: ["java-inheritance", "sql-filtering"],
    primaryActivities: ["coding", "sql", "six", "quiz", "tutor"],
    packVersion: "design-v1",
  },
  {
    packId: "pack-nursing-clinical",
    domainLabel: "Nursing / Clinical Reasoning",
    conceptKeys: ["clinical-decision-making"],
    primaryActivities: ["simulation", "lab", "six", "quiz", "flashcard", "tutor"],
    packVersion: "design-v1",
  },
  {
    packId: "pack-electrical-trades",
    domainLabel: "Electrical / Trades",
    conceptKeys: ["circuit-fault-diagnosis"],
    primaryActivities: ["lab", "simulation", "six", "quiz", "tutor"],
    packVersion: "design-v1",
  },
  {
    packId: "pack-history-humanities",
    domainLabel: "History / Humanities",
    conceptKeys: ["source-analysis", "historical-argument"],
    primaryActivities: ["writing", "presentation", "six", "quiz", "tutor"],
    packVersion: "design-v1",
  },
  {
    packId: "pack-language-learning",
    domainLabel: "Language Learning",
    conceptKeys: ["vocabulary", "grammar", "conversation"],
    primaryActivities: ["flashcard", "quiz", "writing", "six", "tutor"],
    packVersion: "design-v1",
  },
  {
    packId: "pack-finance-trading-edu",
    domainLabel: "Finance / Stock Market Education (fake money)",
    conceptKeys: [
      "market-orders",
      "limit-orders",
      "risk-diversification",
      "technical-indicators",
    ],
    primaryActivities: ["simulation", "quiz", "project", "six", "tutor"],
    packVersion: "design-v1",
  },
  {
    packId: "pack-content-depth-2p32",
    domainLabel: "Universal Content Depth (2P-32)",
    conceptKeys: [
      "java-inheritance",
      "sql-joins",
      "phishing-recognition",
      "authorization-rbac",
      "clinical-prioritization",
      "supply-and-demand",
      "claim-evidence-reasoning",
    ],
    primaryActivities: [
      "coding",
      "sql",
      "simulation",
      "writing",
      "game",
      "project",
      "six",
    ],
    packVersion: "depth-v1",
  },
];

export const PACK_CONCEPT_PLANS: Record<string, PackConceptPlan[]> = {
  "pack-java-cs": [
    {
      conceptKey: "java-inheritance",
      conceptTitle: "Java inheritance",
      stages: ["INTRODUCE", "UNDERSTAND", "PRACTICE", "APPLY", "CHALLENGE"],
      difficultyRange: [1, 2, 3, 4],
    },
  ],
  "pack-nursing-clinical": [
    {
      conceptKey: "clinical-decision-making",
      conceptTitle: "Clinical decision making",
      stages: ["UNDERSTAND", "APPLY", "CHALLENGE"],
      difficultyRange: [2, 3, 4],
    },
  ],
  "pack-electrical-trades": [
    {
      conceptKey: "circuit-fault-diagnosis",
      conceptTitle: "Circuit fault diagnosis",
      stages: ["PRACTICE", "APPLY"],
      difficultyRange: [2, 3],
    },
  ],
  "pack-history-humanities": [
    {
      conceptKey: "source-analysis",
      conceptTitle: "Historical source analysis",
      stages: ["UNDERSTAND", "APPLY", "CHALLENGE"],
      difficultyRange: [2, 3, 4],
    },
  ],
  "pack-language-learning": [
    {
      conceptKey: "vocabulary",
      conceptTitle: "Vocabulary retention",
      stages: ["INTRODUCE", "PRACTICE", "RETAIN"],
      difficultyRange: [1, 2, 3],
    },
  ],
  "pack-finance-trading-edu": [
    {
      conceptKey: "market-orders",
      conceptTitle: "Market orders",
      stages: ["UNDERSTAND", "PRACTICE", "APPLY"],
      difficultyRange: [2, 3],
    },
    {
      conceptKey: "risk-diversification",
      conceptTitle: "Risk and diversification",
      stages: ["UNDERSTAND", "APPLY", "CHALLENGE"],
      difficultyRange: [2, 3, 4],
    },
  ],
};

export function getDesignTimeContentPack(
  packId: string,
): ContentPackDescriptor | null {
  return DESIGN_TIME_CONTENT_PACKS.find((p) => p.packId === packId) ?? null;
}

export function listDesignTimeContentPacks(): ContentPackDescriptor[] {
  return [...DESIGN_TIME_CONTENT_PACKS];
}

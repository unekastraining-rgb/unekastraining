/**
 * 2P-8 — Representative pipeline fixtures (not a content library).
 * Proves CS / Networking / Business flows through the same pipeline.
 */

import type { ContentPreparationInput } from "./types";

/** Computer Science — Java inheritance notes → Coding. */
export const FIXTURE_CS_JAVA_INHERITANCE: ContentPreparationInput = {
  source: {
    sourceId: "src-java-inheritance-notes",
    sourceType: "core_note",
    title: "My Java inheritance notes",
    locationRef: "note:fixture-java-inheritance",
    ownerLearnerId: "learner-1",
    excerpt:
      "Inheritance lets a subclass reuse and extend superclass behavior via extends.",
  },
  objective: {
    objectiveId: "obj-java-inheritance",
    conceptTitle: "Java inheritance",
    conceptId: "concept-java-inheritance",
    objective:
      "Implement behavior in a subclass using inherited functionality.",
    domainContext: "computer science",
    requiredCharacteristics: ["application", "construction", "practice"],
    preferredFacet: "PERFORM",
  },
  activityKind: "coding",
  contentId: "java-inheritance-subclass",
  confirmed: true,
};

/** Networking — DHCP troubleshooting material → Simulation. */
export const FIXTURE_NETWORKING_DHCP: ContentPreparationInput = {
  source: {
    sourceId: "src-dhcp-troubleshooting",
    sourceType: "course_material",
    title: "DHCP troubleshooting lab guide",
    locationRef: "material:fixture-dhcp",
    ownerLearnerId: "learner-1",
    excerpt:
      "Clients fail to obtain addresses when DHCP/DNS/gateway configuration is wrong.",
  },
  objective: {
    objectiveId: "obj-dhcp-troubleshoot",
    conceptTitle: "DHCP troubleshooting",
    conceptId: "concept-dhcp",
    objective:
      "Diagnose why a client cannot obtain a valid network configuration.",
    domainContext: "networking",
    requiredCharacteristics: [
      "troubleshooting",
      "decision_making",
      "scenario_reasoning",
    ],
    preferredFacet: "SOLVE",
  },
  activityKind: "simulation",
  contentId: "sim-network-fault",
  confirmed: true,
};

/** Business — supply/demand material → Simulation (or Writing). */
export const FIXTURE_BUSINESS_SUPPLY_DEMAND: ContentPreparationInput = {
  source: {
    sourceId: "src-supply-demand",
    sourceType: "textbook",
    title: "Supply and demand chapter extract",
    locationRef: "extract:fixture-supply-demand",
    ownerLearnerId: "learner-1",
    excerpt:
      "A change in supply shifts equilibrium price and quantity in the market.",
  },
  objective: {
    objectiveId: "obj-supply-demand",
    conceptTitle: "Supply and demand",
    conceptId: "concept-supply-demand",
    objective:
      "Explain how a change in supply affects equilibrium price and quantity.",
    domainContext: "business",
    requiredCharacteristics: ["explanation", "application", "scenario_reasoning"],
    preferredFacet: "APPLY",
  },
  activityKind: "simulation",
  contentId: "sim-supply-demand",
  confirmed: true,
};

/** Lab alternative for networking (same concept, different mechanism). */
export const FIXTURE_NETWORKING_DHCP_LAB: ContentPreparationInput = {
  ...FIXTURE_NETWORKING_DHCP,
  objective: {
    ...FIXTURE_NETWORKING_DHCP.objective,
    objectiveId: "obj-dhcp-lab",
    requiredCharacteristics: [
      "procedural_execution",
      "troubleshooting",
      "practice",
    ],
    preferredFacet: "PERFORM",
  },
  activityKind: "lab",
  contentId: "lab-network-connectivity",
};

export const PIPELINE_FIXTURES = [
  FIXTURE_CS_JAVA_INHERITANCE,
  FIXTURE_NETWORKING_DHCP,
  FIXTURE_BUSINESS_SUPPLY_DEMAND,
  FIXTURE_NETWORKING_DHCP_LAB,
] as const;

/**
 * 2P-9 — Representative progression catalog (fixtures, not a CMS).
 * Multiple stages/variants per Concept; same architecture across domains.
 */

import type { ContentProgressionEntry } from "./types";
import { DOMAIN_EXPANSION_PROGRESSION_ENTRIES } from "@/lib/learning/activities/domain-expansion";
import { CONTENT_DEPTH_PROGRESSION_ENTRIES } from "@/lib/learning/activities/content-depth";
import { DOMAIN_EXPERIENCE_PROGRESSION_ENTRIES } from "@/lib/learning/activities/domain-experience";
import { EXPERIENCE_DEPTH_PROGRESSION_ENTRIES } from "@/lib/learning/activities/experience-depth";
import { ALL_AGES_DEPTH_PROGRESSION_ENTRIES } from "@/lib/learning/activities/all-ages-depth";
import { MATH_WORKSPACE_PROGRESSION_ENTRIES } from "@/lib/learning/activities/math/progression";
import { NETWORK_WORKSPACE_PROGRESSION_ENTRIES } from "@/lib/learning/activities/networking/progression";
import { LANGUAGE_WORKSPACE_PROGRESSION_ENTRIES } from "@/lib/learning/activities/language/progression";
import { CONTENT_EXPANSION_PROGRESSION_ENTRIES } from "@/lib/learning/activities/content-expansion-queue/progression";
import { CONTENT_DEPTH_PRIORITY_PROGRESSION_ENTRIES } from "@/lib/learning/activities/content-expansion-queue/progression-depth-priority";

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

/** Computer Science — Java inheritance progression. */
export const CS_INHERITANCE_ENTRIES: ContentProgressionEntry[] = [
  entry({
    contentKey: "cs-inheritance-introduce",
    conceptKey: "java-inheritance",
    conceptTitle: "Java inheritance",
    stage: "INTRODUCE",
    difficulty: 1,
    contextVariant: "class hierarchy diagram",
    activityKind: "six",
    contentId: null,
    objective: "Recognize how subclasses relate to a superclass.",
    domainContext: "computer science",
  }),
  entry({
    contentKey: "cs-inheritance-understand",
    conceptKey: "java-inheritance",
    conceptTitle: "Java inheritance",
    stage: "UNDERSTAND",
    difficulty: 2,
    contextVariant: "feynman explain inherited members",
    activityKind: "six",
    contentId: null,
    objective: "Explain why a subclass can use inherited members.",
    domainContext: "computer science",
  }),
  entry({
    contentKey: "cs-inheritance-practice",
    conceptKey: "java-inheritance",
    conceptTitle: "Java inheritance",
    stage: "PRACTICE",
    difficulty: 2,
    contextVariant: "dog extends animal",
    activityKind: "coding",
    contentId: "java-inheritance-subclass",
    objective: "Implement subclass behavior using inheritance.",
    domainContext: "computer science",
  }),
  entry({
    contentKey: "cs-inheritance-apply",
    conceptKey: "java-inheritance",
    conceptTitle: "Java inheritance",
    stage: "APPLY",
    difficulty: 3,
    contextVariant: "vehicle hierarchy",
    activityKind: "coding",
    contentId: "java-inheritance-vehicle",
    objective: "Apply inheritance in a second domain scenario (vehicle types).",
    domainContext: "computer science",
  }),
  entry({
    contentKey: "cs-inheritance-challenge",
    conceptKey: "java-inheritance",
    conceptTitle: "Java inheritance",
    stage: "CHALLENGE",
    difficulty: 4,
    contextVariant: "polymorphic speak transfer",
    activityKind: "coding",
    contentId: "java-polymorphism-challenge",
    objective: "Handle a harder inheritance/polymorphism implementation with reduced scaffolding.",
    domainContext: "computer science",
  }),
];

/** Networking — DHCP troubleshooting progression. */
export const NETWORKING_DHCP_ENTRIES: ContentProgressionEntry[] = [
  entry({
    contentKey: "net-dhcp-understand",
    conceptKey: "dhcp-troubleshooting",
    conceptTitle: "DHCP troubleshooting",
    stage: "UNDERSTAND",
    difficulty: 2,
    contextVariant: "guided dhcp lease explanation",
    activityKind: "six",
    contentId: null,
    objective: "Explain how a client obtains a DHCP lease.",
    domainContext: "networking",
  }),
  entry({
    contentKey: "net-dhcp-practice-lab",
    conceptKey: "dhcp-troubleshooting",
    conceptTitle: "DHCP troubleshooting",
    stage: "PRACTICE",
    difficulty: 2,
    contextVariant: "structured connectivity lab",
    activityKind: "lab",
    contentId: "lab-network-connectivity",
    objective: "Perform a structured diagnostic connectivity procedure.",
    domainContext: "networking",
  }),
  entry({
    contentKey: "net-dhcp-apply-sim",
    conceptKey: "dhcp-troubleshooting",
    conceptTitle: "DHCP troubleshooting",
    stage: "APPLY",
    difficulty: 3,
    contextVariant: "client cannot obtain address",
    activityKind: "simulation",
    contentId: "sim-network-fault",
    objective: "Diagnose why a client cannot obtain a valid address.",
    domainContext: "networking",
  }),
  entry({
    contentKey: "net-dhcp-challenge",
    conceptKey: "dhcp-troubleshooting",
    conceptTitle: "DHCP troubleshooting",
    stage: "CHALLENGE",
    difficulty: 4,
    contextVariant: "ambiguous multi-fault scenario",
    activityKind: "simulation",
    contentId: "sim-network-fault",
    objective: "Resolve an ambiguous network failure with incomplete symptoms.",
    domainContext: "networking",
  }),
];

/** Business — Supply and demand progression. */
export const BUSINESS_SUPPLY_DEMAND_ENTRIES: ContentProgressionEntry[] = [
  entry({
    contentKey: "biz-sd-understand",
    conceptKey: "supply-and-demand",
    conceptTitle: "Supply and demand",
    stage: "UNDERSTAND",
    difficulty: 2,
    contextVariant: "coffee market",
    activityKind: "six",
    contentId: null,
    objective: "Explain how supply changes affect equilibrium price.",
    domainContext: "business",
  }),
  entry({
    contentKey: "biz-sd-practice",
    conceptKey: "supply-and-demand",
    conceptTitle: "Supply and demand",
    stage: "PRACTICE",
    difficulty: 2,
    contextVariant: "housing market guided",
    activityKind: "writing",
    contentId: "write-business-proposal",
    objective: "Practice explaining a supply shift in the housing market.",
    domainContext: "business",
  }),
  entry({
    contentKey: "biz-sd-apply",
    conceptKey: "supply-and-demand",
    conceptTitle: "Supply and demand",
    stage: "APPLY",
    difficulty: 3,
    contextVariant: "gasoline market",
    activityKind: "simulation",
    contentId: "sim-supply-demand",
    objective: "Apply supply/demand decisions in a gasoline market scenario.",
    domainContext: "business",
  }),
  entry({
    contentKey: "biz-sd-challenge",
    conceptKey: "supply-and-demand",
    conceptTitle: "Supply and demand",
    stage: "CHALLENGE",
    difficulty: 4,
    contextVariant: "multi-factor shock",
    activityKind: "simulation",
    contentId: "sim-supply-demand",
    objective: "Handle a multi-factor supply and demand shock scenario.",
    domainContext: "business",
  }),
];

/** SQL filtering — same concept, multiple context variants at PRACTICE. */
export const SQL_FILTERING_VARIANTS: ContentProgressionEntry[] = [
  entry({
    contentKey: "sql-filter-students",
    conceptKey: "sql-filtering",
    conceptTitle: "SQL filtering",
    stage: "PRACTICE",
    difficulty: 2,
    contextVariant: "students grades",
    activityKind: "sql",
    contentId: "sql-high-grades",
    objective: "Retrieve records matching filter conditions.",
    domainContext: "computer science",
  }),
  entry({
    contentKey: "sql-filter-select-all",
    conceptKey: "sql-filtering",
    conceptTitle: "SQL filtering",
    stage: "INTRODUCE",
    difficulty: 1,
    contextVariant: "students table scan",
    activityKind: "sql",
    contentId: "sql-select-students",
    objective: "Retrieve all rows before applying filters.",
    domainContext: "computer science",
  }),
];

/** Nursing — clinical decision (Simulation). Domain is context only. */
export const NURSING_CLINICAL_ENTRIES: ContentProgressionEntry[] = [
  entry({
    contentKey: "nursing-triage-understand",
    conceptKey: "clinical-decision-making",
    conceptTitle: "Clinical decision making",
    stage: "UNDERSTAND",
    difficulty: 2,
    contextVariant: "guided triage explanation",
    activityKind: "six",
    contentId: null,
    objective: "Explain how triage priority is determined.",
    domainContext: "nursing",
  }),
  entry({
    contentKey: "nursing-triage-apply",
    conceptKey: "clinical-decision-making",
    conceptTitle: "Clinical decision making",
    stage: "APPLY",
    difficulty: 3,
    contextVariant: "chest pain scenario",
    activityKind: "simulation",
    contentId: "sim-patient-triage",
    objective: "Make a clinical decision in a patient scenario.",
    domainContext: "nursing",
  }),
];

/** Electrical — circuit diagnostic lab. Domain is context only. */
export const ELECTRICAL_CIRCUIT_ENTRIES: ContentProgressionEntry[] = [
  entry({
    contentKey: "elec-circuit-understand",
    conceptKey: "circuit-fault-diagnosis",
    conceptTitle: "Circuit fault diagnosis",
    stage: "UNDERSTAND",
    difficulty: 1,
    contextVariant: "open vs short basics",
    activityKind: "six",
    contentId: null,
    objective: "Explain how an open differs from a short using one observable clue.",
    domainContext: "electrical",
  }),
  entry({
    contentKey: "elec-circuit-practice",
    conceptKey: "circuit-fault-diagnosis",
    conceptTitle: "Circuit fault diagnosis",
    stage: "PRACTICE",
    difficulty: 2,
    contextVariant: "series circuit measurement",
    activityKind: "lab",
    contentId: "lab-circuit-fault",
    objective: "Connect, measure, and diagnose a circuit fault.",
    domainContext: "electrical",
  }),
  entry({
    contentKey: "elec-circuit-apply",
    conceptKey: "circuit-fault-diagnosis",
    conceptTitle: "Circuit fault diagnosis",
    stage: "APPLY",
    difficulty: 3,
    contextVariant: "open vs short diagnosis",
    activityKind: "lab",
    contentId: "lab-circuit-fault",
    objective: "Apply diagnostic procedure to an open/short fault.",
    domainContext: "electrical",
  }),
  entry({
    contentKey: "elec-circuit-retain",
    conceptKey: "circuit-fault-diagnosis",
    conceptTitle: "Circuit fault diagnosis",
    stage: "RETAIN",
    difficulty: 2,
    contextVariant: "recall open vs short from meter clue",
    activityKind: "lab",
    contentId: "lab-circuit-fault",
    objective: "Recall one meter clue that separates an open from a short.",
    domainContext: "electrical",
  }),
];

/** 2P-16 — Java exception handling progression. */
export const CS_EXCEPTION_ENTRIES: ContentProgressionEntry[] = [
  entry({
    contentKey: "cs-exception-understand",
    conceptKey: "java-exception-handling",
    conceptTitle: "Java exception handling",
    stage: "UNDERSTAND",
    difficulty: 2,
    contextVariant: "checked vs unchecked explanation",
    activityKind: "six",
    contentId: null,
    objective: "Explain when try/catch protects a caller from a failing parse.",
    domainContext: "computer science",
  }),
  entry({
    contentKey: "cs-exception-practice",
    conceptKey: "java-exception-handling",
    conceptTitle: "Java exception handling",
    stage: "PRACTICE",
    difficulty: 3,
    contextVariant: "safeParseInt NumberFormatException",
    activityKind: "coding",
    contentId: "java-exception-try-catch",
    objective: "Implement try/catch for a failing integer parse.",
    domainContext: "computer science",
  }),
  entry({
    contentKey: "cs-exception-challenge",
    conceptKey: "java-exception-handling",
    conceptTitle: "Java exception handling",
    stage: "CHALLENGE",
    difficulty: 4,
    contextVariant: "narrow catch vs broad Exception",
    activityKind: "coding",
    contentId: "java-exception-try-catch",
    objective: "Handle parse failure with a specific exception type.",
    domainContext: "computer science",
  }),
];

/** 2P-16 — Debugging progression (same concept, alternate context). */
export const CS_DEBUG_ENTRIES: ContentProgressionEntry[] = [
  entry({
    contentKey: "cs-debug-practice",
    conceptKey: "programming-debugging",
    conceptTitle: "Programming debugging",
    stage: "PRACTICE",
    difficulty: 2,
    contextVariant: "off-by-one loop sum",
    activityKind: "coding",
    contentId: "js-debug-off-by-one",
    objective: "Fix an off-by-one loop so the sum matches expected cases.",
    domainContext: "computer science",
  }),
  entry({
    contentKey: "cs-debug-apply",
    conceptKey: "programming-debugging",
    conceptTitle: "Programming debugging",
    stage: "APPLY",
    difficulty: 3,
    contextVariant: "sum range exclusive of n",
    activityKind: "coding",
    contentId: "js-debug-off-by-one",
    objective: "Apply off-by-one reasoning to a different expected range.",
    domainContext: "computer science",
  }),
];

/** 2P-16 — SQL JOIN progression. */
export const SQL_JOIN_ENTRIES: ContentProgressionEntry[] = [
  entry({
    contentKey: "sql-join-introduce",
    conceptKey: "sql-joins",
    conceptTitle: "SQL joins",
    stage: "INTRODUCE",
    difficulty: 1,
    contextVariant: "why two tables",
    activityKind: "six",
    contentId: null,
    objective: "Recognize when related data lives across two tables.",
    domainContext: "computer science",
  }),
  entry({
    contentKey: "sql-join-practice",
    conceptKey: "sql-joins",
    conceptTitle: "SQL joins",
    stage: "PRACTICE",
    difficulty: 3,
    contextVariant: "students enrollments inner join",
    activityKind: "sql",
    contentId: "sql-join-enrollments",
    objective: "Retrieve related rows with an INNER JOIN.",
    domainContext: "computer science",
  }),
];

/** 2P-16 — Educational market order (fake money). */
export const FINANCE_MARKET_ORDER_ENTRIES: ContentProgressionEntry[] = [
  entry({
    contentKey: "fin-market-order-understand",
    conceptKey: "market-orders",
    conceptTitle: "Market orders",
    stage: "UNDERSTAND",
    difficulty: 2,
    contextVariant: "market vs limit explanation",
    activityKind: "six",
    contentId: null,
    objective: "Explain the trade-off between market and limit orders.",
    domainContext: "finance",
  }),
  entry({
    contentKey: "fin-market-order-apply",
    conceptKey: "market-orders",
    conceptTitle: "Market orders",
    stage: "APPLY",
    difficulty: 3,
    contextVariant: "fake portfolio EDU stock",
    activityKind: "simulation",
    contentId: "sim-market-order-edu",
    objective: "Apply order-type choice in a fake-money paper portfolio.",
    domainContext: "finance",
  }),
  entry({
    contentKey: "fin-market-order-challenge",
    conceptKey: "market-orders",
    conceptTitle: "Market orders",
    stage: "CHALLENGE",
    difficulty: 4,
    contextVariant: "slippage risk under urgency",
    activityKind: "simulation",
    contentId: "sim-market-order-edu",
    objective: "Handle urgency vs price-control trade-offs with fake money.",
    domainContext: "finance",
  }),
];

/** 2P-16 — Clinical prioritization (nursing variant). */
export const NURSING_PRIORITY_ENTRIES: ContentProgressionEntry[] = [
  entry({
    contentKey: "nursing-priority-apply",
    conceptKey: "clinical-prioritization",
    conceptTitle: "Clinical prioritization",
    stage: "APPLY",
    difficulty: 3,
    contextVariant: "headache vs dyspnea",
    activityKind: "simulation",
    contentId: "sim-patient-priority",
    objective: "Prioritize patients by acuity and justify the first action.",
    domainContext: "nursing",
  }),
  entry({
    contentKey: "nursing-priority-challenge",
    conceptKey: "clinical-prioritization",
    conceptTitle: "Clinical prioritization",
    stage: "CHALLENGE",
    difficulty: 4,
    contextVariant: "wrong-order consequence",
    activityKind: "simulation",
    contentId: "sim-patient-priority",
    objective: "Explain consequences of incorrect prioritization.",
    domainContext: "nursing",
  }),
];

/** 2P-16 — History cause/effect + source presentation. */
export const HISTORY_ANALYSIS_ENTRIES: ContentProgressionEntry[] = [
  entry({
    contentKey: "hist-cause-effect-apply",
    conceptKey: "historical-cause-effect",
    conceptTitle: "Historical cause and effect",
    stage: "APPLY",
    difficulty: 3,
    contextVariant: "printing press and reform",
    activityKind: "writing",
    contentId: "write-history-cause-effect",
    objective: "Argue a cause→effect claim with historical evidence.",
    domainContext: "history",
  }),
  entry({
    contentKey: "hist-source-present",
    conceptKey: "historical-cause-effect",
    conceptTitle: "Historical cause and effect",
    stage: "PRACTICE",
    difficulty: 2,
    contextVariant: "source analysis outline",
    activityKind: "presentation",
    contentId: "presentation-history-sources",
    objective: "Present a source-analysis outline for a historical claim.",
    domainContext: "history",
  }),
];

/** 2P-16 — Math proportional reasoning (Writing; not Adaptive-ready). */
export const MATH_PROPORTION_ENTRIES: ContentProgressionEntry[] = [
  entry({
    contentKey: "math-proportion-practice",
    conceptKey: "proportional-reasoning",
    conceptTitle: "Proportional reasoning",
    stage: "PRACTICE",
    difficulty: 2,
    contextVariant: "muffin recipe scale",
    activityKind: "writing",
    contentId: "write-math-proportional-reasoning",
    objective: "Solve a multi-step proportion and explain the steps.",
    domainContext: "mathematics",
  }),
];

/** 2P-16 — Physics force balance lab. */
export const PHYSICS_FORCE_ENTRIES: ContentProgressionEntry[] = [
  entry({
    contentKey: "phys-force-understand",
    conceptKey: "net-force-reasoning",
    conceptTitle: "Net force reasoning",
    stage: "UNDERSTAND",
    difficulty: 1,
    contextVariant: "balanced forces rest",
    activityKind: "six",
    contentId: null,
    objective: "Explain why balanced opposing forces can leave an object at rest.",
    domainContext: "physics",
  }),
  entry({
    contentKey: "phys-force-practice",
    conceptKey: "net-force-reasoning",
    conceptTitle: "Net force reasoning",
    stage: "PRACTICE",
    difficulty: 2,
    contextVariant: "two opposing horizontal forces",
    activityKind: "lab",
    contentId: "lab-physics-force-balance",
    objective: "Compute net force and relate it to motion.",
    domainContext: "physics",
  }),
  entry({
    contentKey: "phys-force-apply",
    conceptKey: "net-force-reasoning",
    conceptTitle: "Net force reasoning",
    stage: "APPLY",
    difficulty: 3,
    contextVariant: "measurement note in lab write-up",
    activityKind: "lab",
    contentId: "lab-physics-force-balance",
    objective: "Apply force-balance reasoning with a measurement plan.",
    domainContext: "physics",
  }),
  entry({
    contentKey: "phys-force-retain",
    conceptKey: "net-force-reasoning",
    conceptTitle: "Net force reasoning",
    stage: "RETAIN",
    difficulty: 2,
    contextVariant: "recall net force zero meaning",
    activityKind: "lab",
    contentId: "lab-physics-force-balance",
    objective: "Recall what zero net force implies about motion change.",
    domainContext: "physics",
  }),
];

/** 2P-16 — DNS misconfig networking variant. */
export const NETWORKING_DNS_ENTRIES: ContentProgressionEntry[] = [
  entry({
    contentKey: "net-dns-apply",
    conceptKey: "dns-troubleshooting",
    conceptTitle: "DNS troubleshooting",
    stage: "APPLY",
    difficulty: 3,
    contextVariant: "ping IP works names fail",
    activityKind: "simulation",
    contentId: "sim-dns-misconfig",
    objective: "Diagnose DNS failure when IP connectivity still works.",
    domainContext: "networking",
  }),
  entry({
    contentKey: "net-dns-challenge",
    conceptKey: "dns-troubleshooting",
    conceptTitle: "DNS troubleshooting",
    stage: "CHALLENGE",
    difficulty: 4,
    contextVariant: "misconception gateway-down",
    activityKind: "simulation",
    contentId: "sim-dns-misconfig",
    objective: "Reject wrong-layer diagnoses when only DNS fails.",
    domainContext: "networking",
  }),
];

/** Automotive — reuse vehicle diagnostic with explicit progression. */
export const AUTOMOTIVE_DIAG_ENTRIES: ContentProgressionEntry[] = [
  entry({
    contentKey: "auto-diag-understand",
    conceptKey: "vehicle-diagnostics",
    conceptTitle: "Vehicle diagnostics",
    stage: "UNDERSTAND",
    difficulty: 1,
    contextVariant: "symptom to system map",
    activityKind: "six",
    contentId: null,
    objective: "Map a rough-idle symptom to a plausible vehicle system before testing.",
    domainContext: "automotive",
  }),
  entry({
    contentKey: "auto-diag-practice",
    conceptKey: "vehicle-diagnostics",
    conceptTitle: "Vehicle diagnostics",
    stage: "PRACTICE",
    difficulty: 2,
    contextVariant: "choose first diagnostic test",
    activityKind: "simulation",
    contentId: "sim-vehicle-diagnostic",
    objective: "Choose a first diagnostic test for rough idle and explain why.",
    domainContext: "automotive",
  }),
  entry({
    contentKey: "auto-diag-apply",
    conceptKey: "vehicle-diagnostics",
    conceptTitle: "Vehicle diagnostics",
    stage: "APPLY",
    difficulty: 3,
    contextVariant: "check-engine rough idle",
    activityKind: "simulation",
    contentId: "sim-vehicle-diagnostic",
    objective: "Choose a diagnostic test and decide on a repair.",
    domainContext: "automotive",
  }),
];

/** 2P-16 — Chemistry density observation. */
export const CHEMISTRY_DENSITY_ENTRIES: ContentProgressionEntry[] = [
  entry({
    contentKey: "chem-density-understand",
    conceptKey: "density",
    conceptTitle: "Density",
    stage: "UNDERSTAND",
    difficulty: 1,
    contextVariant: "mass over volume idea",
    activityKind: "six",
    contentId: null,
    objective: "Explain density as mass per volume in one concrete sentence.",
    domainContext: "chemistry",
  }),
  entry({
    contentKey: "chem-density-practice",
    conceptKey: "density",
    conceptTitle: "Density",
    stage: "PRACTICE",
    difficulty: 2,
    contextVariant: "float sink water observation",
    activityKind: "lab",
    contentId: "lab-observe-density",
    objective: "Observe float/sink behavior and interpret density.",
    domainContext: "chemistry",
  }),
  entry({
    contentKey: "chem-density-apply",
    conceptKey: "density",
    conceptTitle: "Density",
    stage: "APPLY",
    difficulty: 3,
    contextVariant: "compare two materials",
    activityKind: "lab",
    contentId: "lab-observe-density",
    objective: "Compare two materials and justify which is denser from observations.",
    domainContext: "chemistry",
  }),
];

/** HVAC — thermostat / airflow diagnostics on existing lab + simulation types. */
export const HVAC_COMFORT_ENTRIES: ContentProgressionEntry[] = [
  entry({
    contentKey: "hvac-thermo-understand",
    conceptKey: "hvac-thermostat-airflow",
    conceptTitle: "Thermostat and airflow basics",
    stage: "UNDERSTAND",
    difficulty: 1,
    contextVariant: "call for cool vs airflow",
    activityKind: "six",
    contentId: null,
    objective: "Separate a thermostat call-for-cool from an airflow delivery problem.",
    domainContext: "hvac",
  }),
  entry({
    contentKey: "hvac-thermo-practice",
    conceptKey: "hvac-thermostat-airflow",
    conceptTitle: "Thermostat and airflow basics",
    stage: "PRACTICE",
    difficulty: 2,
    contextVariant: "no cool air at registers",
    activityKind: "lab",
    contentId: "lab-hvac-airflow",
    objective: "Record thermostat setting, blower status, and register airflow observations.",
    domainContext: "hvac",
  }),
  entry({
    contentKey: "hvac-thermo-apply",
    conceptKey: "hvac-thermostat-airflow",
    conceptTitle: "Thermostat and airflow basics",
    stage: "APPLY",
    difficulty: 3,
    contextVariant: "setpoint vs room temperature",
    activityKind: "simulation",
    contentId: "sim-hvac-comfort",
    objective: "Diagnose whether the fault is setpoint, call, or delivery.",
    domainContext: "hvac",
  }),
];

/** Humanities — research ethics writing on existing Writing activity. */
export const HUMANITIES_ETHICS_ENTRIES: ContentProgressionEntry[] = [
  entry({
    contentKey: "hum-ethics-understand",
    conceptKey: "research-ethics-basics",
    conceptTitle: "Research ethics basics",
    stage: "UNDERSTAND",
    difficulty: 2,
    contextVariant: "consent vs citation",
    activityKind: "six",
    contentId: null,
    objective: "Distinguish informed consent from citation honesty in one example.",
    domainContext: "humanities",
  }),
  entry({
    contentKey: "hum-ethics-apply",
    conceptKey: "research-ethics-basics",
    conceptTitle: "Research ethics basics",
    stage: "APPLY",
    difficulty: 3,
    contextVariant: "source use scenario",
    activityKind: "writing",
    contentId: "write-research-ethics-scenario",
    objective: "Write a short response that names the ethical issue and a responsible next step.",
    domainContext: "humanities",
  }),
];

/** 2P-17 — Educational market / trading progression ladders. */
export const FINANCE_LIMIT_ORDER_ENTRIES: ContentProgressionEntry[] = [
  entry({
    contentKey: "fin-limit-order-practice",
    conceptKey: "limit-orders",
    conceptTitle: "Limit orders",
    stage: "PRACTICE",
    difficulty: 3,
    contextVariant: "limit below ask",
    activityKind: "simulation",
    contentId: "edu-mkt-limit-order-patience",
    objective: "Place a simulated limit buy and explain non-fill risk.",
    domainContext: "finance",
  }),
];

export const FINANCE_POSITION_SIZING_ENTRIES: ContentProgressionEntry[] = [
  entry({
    contentKey: "fin-size-apply",
    conceptKey: "position-sizing",
    conceptTitle: "Position sizing",
    stage: "APPLY",
    difficulty: 3,
    contextVariant: "2 percent risk budget",
    activityKind: "simulation",
    contentId: "edu-mkt-position-sizing-2pct",
    objective: "Size a paper position within a 2% risk budget.",
    domainContext: "finance",
  }),
  entry({
    contentKey: "fin-size-challenge",
    conceptKey: "position-sizing",
    conceptTitle: "Position sizing",
    stage: "CHALLENGE",
    difficulty: 4,
    contextVariant: "oversize trap",
    activityKind: "simulation",
    contentId: "edu-mkt-position-oversize",
    objective: "Reject an oversized risk proposal on a paper account.",
    domainContext: "finance",
  }),
];

export const FINANCE_DIVERSIFICATION_ENTRIES: ContentProgressionEntry[] = [
  entry({
    contentKey: "fin-div-apply",
    conceptKey: "diversification",
    conceptTitle: "Diversification",
    stage: "APPLY",
    difficulty: 3,
    contextVariant: "three asset allocation",
    activityKind: "simulation",
    contentId: "edu-mkt-diversify-allocate",
    objective: "Allocate fake capital without extreme concentration.",
    domainContext: "finance",
  }),
  entry({
    contentKey: "fin-div-challenge",
    conceptKey: "diversification",
    conceptTitle: "Diversification",
    stage: "CHALLENGE",
    difficulty: 4,
    contextVariant: "90 percent concentration trap",
    activityKind: "simulation",
    contentId: "edu-mkt-diversify-concentration",
    objective: "Identify and correct concentration risk.",
    domainContext: "finance",
  }),
];

export const FINANCE_MARKET_EVENT_ENTRIES: ContentProgressionEntry[] = [
  entry({
    contentKey: "fin-event-earnings",
    conceptKey: "market-events",
    conceptTitle: "Market events",
    stage: "APPLY",
    difficulty: 3,
    contextVariant: "earnings beat gap",
    activityKind: "simulation",
    contentId: "edu-mkt-event-earnings",
    objective: "Respond to a simulated earnings event with reasoned action.",
    domainContext: "finance",
  }),
  entry({
    contentKey: "fin-event-rates",
    conceptKey: "market-events",
    conceptTitle: "Market events",
    stage: "CHALLENGE",
    difficulty: 4,
    contextVariant: "rate hike growth name",
    activityKind: "simulation",
    contentId: "edu-mkt-event-rate-hike",
    objective: "Explain rate-hike pressure on a growth-sensitive paper asset.",
    domainContext: "finance",
  }),
];

export const FINANCE_OPPORTUNITY_VOL_ENTRIES: ContentProgressionEntry[] = [
  entry({
    contentKey: "fin-opp-practice",
    conceptKey: "opportunity-cost",
    conceptTitle: "Opportunity cost",
    stage: "PRACTICE",
    difficulty: 3,
    contextVariant: "chase after run-up",
    activityKind: "simulation",
    contentId: "edu-mkt-hold-vs-chase",
    objective: "Weigh chasing a run-up vs holding cash on paper.",
    domainContext: "finance",
  }),
  entry({
    contentKey: "fin-vol-apply",
    conceptKey: "volatility-risk",
    conceptTitle: "Volatility and risk",
    stage: "APPLY",
    difficulty: 3,
    contextVariant: "high vol low tolerance",
    activityKind: "simulation",
    contentId: "edu-mkt-volatility-risk",
    objective: "Match paper size to low risk tolerance under high volatility.",
    domainContext: "finance",
  }),
];

/** Draft-only fixture — never AVAILABLE (2P-10 readiness). */
export const DRAFT_CONTENT_FIXTURE: ContentProgressionEntry = entry({
  contentKey: "draft-only-practice",
  conceptKey: "draft-only-concept",
  conceptTitle: "Draft only concept",
  stage: "PRACTICE",
  difficulty: 2,
  contextVariant: "unvalidated draft",
  activityKind: "writing",
  contentId: "write-explain-photosynthesis",
  objective: "Draft practice that must not be learner-facing.",
  domainContext: null,
  readiness: "DRAFT",
});

/** 2P-18 — Writing Adaptive progression (small ladder; Orchestrator still decides next). */
export const WRITING_ADAPTIVE_ENTRIES: ContentProgressionEntry[] = [
  entry({
    contentKey: "write-photosynthesis-practice",
    conceptKey: "photosynthesis-explanation",
    conceptTitle: "Photosynthesis explanation",
    stage: "PRACTICE",
    difficulty: 2,
    contextVariant: "energy inputs outputs",
    activityKind: "writing",
    contentId: "write-explain-photosynthesis",
    objective: "Explain photosynthesis with energy, inputs, and outputs.",
    domainContext: "science",
  }),
  entry({
    contentKey: "write-thesis-understand",
    conceptKey: "academic-thesis",
    conceptTitle: "Academic thesis",
    stage: "UNDERSTAND",
    difficulty: 2,
    contextVariant: "urban climate policy prompt",
    activityKind: "writing",
    contentId: "write-thesis-climate-policy",
    objective: "Write a defensible thesis on a policy tradeoff.",
    domainContext: "english",
  }),
  entry({
    contentKey: "write-evidence-para-practice",
    conceptKey: "historical-evidence-paragraph",
    conceptTitle: "Evidence-based paragraph",
    stage: "PRACTICE",
    difficulty: 2,
    contextVariant: "industrial Britain evidence set",
    activityKind: "writing",
    contentId: "write-evidence-paragraph-industrial",
    objective: "Write a paragraph using provided historical evidence.",
    domainContext: "history",
  }),
  entry({
    contentKey: "write-source-analysis-apply",
    conceptKey: "historical-source-analysis",
    conceptTitle: "Source analysis",
    stage: "APPLY",
    difficulty: 3,
    contextVariant: "1913 suffrage pamphlet",
    activityKind: "writing",
    contentId: "write-source-analysis-suffrage",
    objective: "Analyze a source and support a conclusion with textual evidence.",
    domainContext: "history",
  }),
  entry({
    contentKey: "write-paraphrase-practice",
    conceptKey: "scientific-paraphrase",
    conceptTitle: "Scientific paraphrasing",
    stage: "PRACTICE",
    difficulty: 2,
    contextVariant: "cell membrane passage",
    activityKind: "writing",
    contentId: "write-paraphrase-cell-membrane",
    objective: "Paraphrase a science passage accurately in your own words.",
    domainContext: "science",
  }),
  entry({
    contentKey: "write-argument-cer-apply",
    conceptKey: "business-argument-structure",
    conceptTitle: "Argument structure",
    stage: "APPLY",
    difficulty: 3,
    contextVariant: "remote-first engineering policy",
    activityKind: "writing",
    contentId: "write-argument-remote-work",
    objective: "Construct claim → evidence → reasoning for a business prompt.",
    domainContext: "business",
  }),
  entry({
    contentKey: "write-revision-challenge",
    conceptKey: "writing-revision",
    conceptTitle: "Revision",
    stage: "CHALLENGE",
    difficulty: 4,
    contextVariant: "unclear social-media thesis draft",
    activityKind: "writing",
    contentId: "write-revision-unclear-thesis",
    objective: "Revise a weak draft to fix identified structural issues.",
    domainContext: "english",
  }),
  entry({
    contentKey: "write-citation-practice",
    conceptKey: "academic-citation",
    conceptTitle: "Citation practice",
    stage: "PRACTICE",
    difficulty: 2,
    contextVariant: "APA parenthetical sleep study",
    activityKind: "writing",
    contentId: "write-citation-apa-sleep",
    objective: "Integrate a finding with APA-style citation.",
    domainContext: "english",
  }),
  entry({
    contentKey: "write-https-explain-apply",
    conceptKey: "https-explanation",
    conceptTitle: "HTTPS explanation",
    stage: "APPLY",
    difficulty: 3,
    contextVariant: "manager-facing HTTPS rationale",
    activityKind: "writing",
    contentId: "write-tech-explain-https",
    objective: "Explain HTTPS for a non-technical audience.",
    domainContext: "computer science",
  }),
  // Variation: same concept, alternate audience/context for thesis.
  entry({
    contentKey: "write-thesis-challenge-alt",
    conceptKey: "academic-thesis",
    conceptTitle: "Academic thesis",
    stage: "CHALLENGE",
    difficulty: 4,
    contextVariant: "policy thesis without beginner scaffold",
    activityKind: "writing",
    contentId: "write-thesis-climate-policy",
    objective: "Defend a thesis independently with minimal scaffolding.",
    domainContext: "english",
  }),
];

export const CONTENT_PROGRESSION_CATALOG: ContentProgressionEntry[] = [
  ...CS_INHERITANCE_ENTRIES,
  ...NETWORKING_DHCP_ENTRIES,
  ...BUSINESS_SUPPLY_DEMAND_ENTRIES,
  ...SQL_FILTERING_VARIANTS,
  ...NURSING_CLINICAL_ENTRIES,
  ...ELECTRICAL_CIRCUIT_ENTRIES,
  ...CS_EXCEPTION_ENTRIES,
  ...CS_DEBUG_ENTRIES,
  ...SQL_JOIN_ENTRIES,
  ...FINANCE_MARKET_ORDER_ENTRIES,
  ...FINANCE_LIMIT_ORDER_ENTRIES,
  ...FINANCE_POSITION_SIZING_ENTRIES,
  ...FINANCE_DIVERSIFICATION_ENTRIES,
  ...FINANCE_MARKET_EVENT_ENTRIES,
  ...FINANCE_OPPORTUNITY_VOL_ENTRIES,
  ...NURSING_PRIORITY_ENTRIES,
  ...HISTORY_ANALYSIS_ENTRIES,
  ...MATH_PROPORTION_ENTRIES,
  ...PHYSICS_FORCE_ENTRIES,
  ...NETWORKING_DNS_ENTRIES,
  ...AUTOMOTIVE_DIAG_ENTRIES,
  ...CHEMISTRY_DENSITY_ENTRIES,
  ...HVAC_COMFORT_ENTRIES,
  ...HUMANITIES_ETHICS_ENTRIES,
  ...WRITING_ADAPTIVE_ENTRIES,
  ...DOMAIN_EXPANSION_PROGRESSION_ENTRIES,
  ...CONTENT_DEPTH_PROGRESSION_ENTRIES,
  ...DOMAIN_EXPERIENCE_PROGRESSION_ENTRIES,
  ...EXPERIENCE_DEPTH_PROGRESSION_ENTRIES,
  ...ALL_AGES_DEPTH_PROGRESSION_ENTRIES,
  ...MATH_WORKSPACE_PROGRESSION_ENTRIES,
  ...NETWORK_WORKSPACE_PROGRESSION_ENTRIES,
  ...LANGUAGE_WORKSPACE_PROGRESSION_ENTRIES,
  ...CONTENT_EXPANSION_PROGRESSION_ENTRIES,
  ...CONTENT_DEPTH_PRIORITY_PROGRESSION_ENTRIES,
  DRAFT_CONTENT_FIXTURE,
];

export function listProgressionEntriesForConcept(
  conceptKey: string,
): ContentProgressionEntry[] {
  const key = conceptKey.trim().toLowerCase();
  return CONTENT_PROGRESSION_CATALOG.filter((e) => e.conceptKey === key);
}

export function getProgressionEntry(
  contentKey: string,
): ContentProgressionEntry | null {
  return (
    CONTENT_PROGRESSION_CATALOG.find((e) => e.contentKey === contentKey) ?? null
  );
}

/**
 * 2G-71 WS E–J — Writing, Lab, Simulation, Game, Project, Presentation verticals.
 * 2P-7: objective / domainTag / conceptHints for content↔concept alignment.
 */

import type { LearningObjectTypeName, MasteryFacetName } from "@/lib/learning/types";
import type { RubricCriterion } from "@/lib/learning/activities/rubric";
import { evaluateAgainstRubric } from "@/lib/learning/activities/rubric";
import {
  recordAuthoritativeActivityEvidence,
  sanitizeClientActivitySubmission,
} from "@/lib/learning/activities/server-evaluation";
import type { UniversalActivityCompletion } from "@/lib/learning/activities/execution-contract";
import type { UniversalEvaluationResult } from "@/lib/learning/activities/execution-contract";
import type { ContentEnrichmentFields } from "@/lib/learning/content-production/enrichment";
import {
  getEducationalMarketScenario,
  evaluateEducationalMarketSubmission,
  listEducationalMarketScenarios,
  listEducationalMarketStructuredChallenges,
} from "@/lib/learning/activities/simulation/educational-market";
import {
  evaluateWritingWork,
  getWritingAdaptiveMeta,
  listWritingAdaptiveStructuredChallenges,
} from "@/lib/learning/activities/writing";
import { separateAiAssistanceFromEvidence } from "@/lib/learning/creation";
import { listDomainExpansionStructuredChallenges } from "@/lib/learning/activities/domain-expansion";
import { listContentDepthStructuredChallenges } from "@/lib/learning/activities/content-depth";
import { listDomainExperienceStructuredChallenges } from "@/lib/learning/activities/domain-experience";
import { listExperienceDepthStructuredChallenges } from "@/lib/learning/activities/experience-depth";
import { listAllAgesDepthStructuredChallenges } from "@/lib/learning/activities/all-ages-depth";
import { listContentExpansionStructuredChallenges } from "@/lib/learning/activities/content-expansion-queue";

export type StructuredActivityKind =
  | "writing"
  | "lab"
  | "simulation"
  | "game"
  | "project"
  | "presentation";

/** Optional learner scaffolds authored on the challenge (2P-12). */
export type StructuredChallengeScaffold = {
  kind: "HINT" | "STEP" | "EXAMPLE" | "CHECKLIST" | "CONSTRAINT";
  label: string;
  content: string;
  level?: 1 | 2 | 3;
  revealPolicy?: "ON_REQUEST" | "ALWAYS";
  doesNotRevealAnswer?: boolean;
};

export type StructuredChallenge = {
  id: string;
  kind: StructuredActivityKind;
  title: string;
  /** What the learner will demonstrate (2P-7). */
  objective: string;
  prompt: string;
  learningObjectType: LearningObjectTypeName;
  skillFacet: MasteryFacetName;
  asPerform: boolean;
  criteria: RubricCriterion[];
  /** Simulation/game: optional state machine description (opaque). */
  rules?: Record<string, unknown>;
  starter?: string;
  /** Soft depth gate — stub submissions fail before keyword matching. */
  minChars?: number;
  /** Optional free-form domain tag for content packs (not a subject engine). */
  domainTag?: string;
  /** Tokens for deterministic concept↔content matching (2P-7). */
  conceptHints?: readonly string[];
  /** Content-authored learner support — not an answer key (2P-12). */
  scaffolds?: readonly StructuredChallengeScaffold[];
  /** Optional authored success description (2P-12). */
  successLooksLike?: string;
} & ContentEnrichmentFields;

export const STRUCTURED_CHALLENGES_BASE: StructuredChallenge[] = [
  {
    id: "write-explain-photosynthesis",
    kind: "writing",
    title: "Explain photosynthesis",
    objective:
      "Explain photosynthesis with energy, inputs, and outputs in your own words.",
    prompt:
      "Write a short explanation of photosynthesis covering energy, inputs, and outputs.",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "EXPLAIN",
    asPerform: false,
    starter: "",
    minChars: 40,
    domainTag: "english",
    conceptHints: ["photosynthesis", "plants", "argument", "explain", "essay"],
    successLooksLike:
      "Your explanation should cover energy, inputs, and outputs in your own words.",
    scaffolds: [
      {
        kind: "HINT",
        label: "Explain in your own words",
        content:
          "Name the energy source first, then what goes in and what comes out — without copying a textbook paragraph.",
        level: 1,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
    ],
    criteria: [
      {
        id: "energy",
        label: "Energy / sunlight",
        mustIncludeAny: ["sunlight", "light energy", "solar"],
      },
      {
        id: "inputs",
        label: "Inputs",
        mustIncludeAny: ["carbon dioxide", "co2", "water"],
      },
      {
        id: "outputs",
        label: "Outputs",
        mustIncludeAny: ["oxygen", "glucose", "sugar"],
      },
      {
        id: "organization",
        label: "Organization",
        mustIncludeAny: ["because", "process", "plants", "chlorophyll"],
      },
    ],
  },
  {
    id: "write-business-proposal",
    kind: "writing",
    title: "Short business proposal",
    objective:
      "Write a concise business proposal stating problem, solution, and ask.",
    prompt:
      "Draft a short business proposal covering the problem, your proposed solution, and a clear ask (funding, approval, or next step).",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "EXPLAIN",
    asPerform: false,
    starter: "",
    minChars: 40,
    domainTag: "business",
    conceptHints: ["proposal", "business", "pitch", "stakeholder", "plan"],
    criteria: [
      {
        id: "problem",
        label: "Problem",
        mustIncludeAny: ["problem", "challenge", "need", "pain"],
      },
      {
        id: "solution",
        label: "Solution",
        mustIncludeAny: ["solution", "propose", "offer", "approach"],
      },
      {
        id: "ask",
        label: "Ask",
        mustIncludeAny: ["ask", "funding", "approve", "budget", "next step"],
      },
    ],
  },
  {
    id: "lab-observe-density",
    kind: "lab",
    title: "Density observation lab",
    objective:
      "Observe float/sink behavior and interpret it using density (mass/volume).",
    prompt:
      "Record observations: which object floats in water and why (density). Include mass/volume reasoning.",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "chemistry",
    minChars: 40,
    conceptHints: ["density", "titration", "chemistry", "float", "mass", "volume"],
    criteria: [
      {
        id: "observation",
        label: "Observation",
        mustIncludeAny: ["float", "sink", "observed", "observation"],
      },
      {
        id: "density",
        label: "Density concept",
        mustIncludeAny: ["density", "mass", "volume"],
      },
      {
        id: "result",
        label: "Result claim",
        mustIncludeAny: ["because", "therefore", "so "],
      },
    ],
  },
  {
    id: "lab-network-connectivity",
    kind: "lab",
    title: "Network connectivity lab",
    objective:
      "Perform a configure → test → observe → troubleshoot connectivity procedure.",
    prompt:
      "Procedural lab: configure → test → observe → troubleshoot. Document the steps you ran, the ping/test result, and your diagnosis of the connectivity fault.",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "networking",
    minChars: 40,
    conceptHints: [
      "connectivity",
      "network",
      "dhcp",
      "troubleshoot",
      "ping",
      "lab",
    ],
    criteria: [
      {
        id: "configure",
        label: "Configure / setup",
        mustIncludeAny: ["configure", "ip", "gateway", "dns", "cable", "interface"],
      },
      {
        id: "test",
        label: "Test / observe",
        mustIncludeAny: ["ping", "traceroute", "test", "observe", "timeout", "reachable"],
      },
      {
        id: "troubleshoot",
        label: "Troubleshoot",
        mustIncludeAny: ["because", "fault", "misconfigured", "down", "diagnose"],
      },
    ],
  },
  {
    id: "lab-circuit-fault",
    kind: "lab",
    title: "Circuit diagnostic lab",
    objective:
      "Connect, measure, and diagnose a circuit fault from observed readings.",
    prompt:
      "Procedural lab: connect → measure → diagnose. Record what you connected, what you measured (voltage/current/continuity), and your fault diagnosis.",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "electrical",
    minChars: 40,
    conceptHints: ["circuit", "voltage", "electrical", "fault", "multimeter"],
    scaffolds: [
      {
        kind: "HINT",
        label: "Where to start",
        content:
          "Confirm power is isolated if required, then verify the circuit path before measuring.",
        level: 1,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
      {
        kind: "CHECKLIST",
        label: "Measure safely",
        content:
          "Set the meter range · check continuity on suspects · compare expected vs measured voltage.",
        level: 2,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
    ],
    criteria: [
      {
        id: "connect",
        label: "Connect",
        mustIncludeAny: ["connect", "wire", "circuit", "series", "parallel", "probe"],
      },
      {
        id: "measure",
        label: "Measure",
        mustIncludeAny: ["voltage", "current", "ohm", "continuity", "measure", "multimeter"],
      },
      {
        id: "diagnose",
        label: "Diagnose",
        mustIncludeAny: ["open", "short", "fault", "because", "diagnose"],
      },
    ],
  },
  // sim-supply-demand moved to educational-market scenarios (2P-17)
  {
    id: "sim-patient-triage",
    kind: "simulation",
    title: "Clinical decision simulation",
    objective:
      "Assess a symptomatic patient, choose a clinical action, and state the expected outcome.",
    prompt:
      "Scenario: patient with chest pain. State your assessment action, clinical decision, and expected outcome. Decisions must change the scenario outcome.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "nursing",
    minChars: 40,
    conceptHints: ["triage", "clinical", "patient", "nursing", "decision"],
    rules: {
      domains: ["nursing", "clinical"],
      state: ["vitals", "symptoms", "priority"],
      transitions: ["assess → decide → outcome"],
    },
    criteria: [
      {
        id: "assess",
        label: "Assessment",
        mustIncludeAny: ["assess", "vitals", "pain", "abc", "oxygen", "history"],
      },
      {
        id: "decision",
        label: "Decision",
        mustIncludeAny: ["escalate", "monitor", "treat", "call", "priority", "triage"],
      },
      {
        id: "outcome",
        label: "Outcome",
        mustIncludeAny: ["stable", "worsen", "improve", "because", "outcome"],
      },
    ],
  },
  {
    id: "sim-network-fault",
    kind: "simulation",
    title: "Network fault simulation",
    objective:
      "Diagnose why clients cannot obtain connectivity and choose a corrective action.",
    prompt:
      "Scenario: users report no internet. Choose a diagnostic action, apply a fix, and state the resulting network state.",
    learningObjectType: "SIMULATION",
    skillFacet: "SOLVE",
    asPerform: false,
    domainTag: "networking",
    minChars: 40,
    conceptHints: ["dhcp", "dns", "network", "troubleshoot", "connectivity", "fault"],
    rules: {
      domains: ["networking"],
      state: ["link", "dns", "gateway", "users"],
      transitions: ["symptom → diagnose → configure → outcome"],
    },
    criteria: [
      {
        id: "diagnose",
        label: "Diagnosis",
        mustIncludeAny: ["dns", "gateway", "dhcp", "cable", "firewall", "diagnose"],
      },
      {
        id: "action",
        label: "Action",
        mustIncludeAny: ["restart", "reconfigure", "replace", "flush", "fix", "update"],
      },
      {
        id: "result",
        label: "Result state",
        mustIncludeAny: ["restored", "online", "resolved", "still down", "because"],
      },
    ],
  },
  {
    id: "sim-vehicle-diagnostic",
    kind: "simulation",
    title: "Vehicle diagnostic simulation",
    objective:
      "Choose a diagnostic test, interpret the result, and decide on a repair.",
    prompt:
      "Scenario: check-engine light and rough idle. Choose a diagnostic test, interpret the result, and state the repair decision.",
    learningObjectType: "SIMULATION",
    skillFacet: "SOLVE",
    asPerform: false,
    domainTag: "automotive",
    minChars: 40,
    conceptHints: ["obd", "misfire", "automotive", "diagnostic", "engine"],
    rules: {
      domains: ["automotive"],
      state: ["codes", "sensors", "idle"],
      transitions: ["symptom → test → interpret → repair"],
    },
    criteria: [
      {
        id: "test",
        label: "Diagnostic test",
        mustIncludeAny: ["obd", "code", "sensor", "vacuum", "spark", "scan"],
      },
      {
        id: "interpret",
        label: "Interpretation",
        mustIncludeAny: ["misfire", "lean", "rich", "fault", "because", "indicates"],
      },
      {
        id: "repair",
        label: "Repair decision",
        mustIncludeAny: ["replace", "clean", "repair", "adjust", "clear"],
      },
    ],
  },
  {
    id: "game-vocab-match",
    kind: "game",
    title: "Cell biology concept match",
    objective:
      "Match cell biology terms to accurate definitions (points alone are not mastery).",
    prompt:
      "List matched pairs: term → definition for mitochondria, nucleus, and ribosome. Points alone are not mastery — include correct definitions.",
    learningObjectType: "GAME",
    skillFacet: "RECOGNIZE",
    asPerform: false,
    minChars: 30,
    domainTag: "biology",
    conceptHints: ["mitochondria", "nucleus", "ribosome", "cell", "biology"],
    criteria: [
      {
        id: "mito",
        label: "Mitochondria",
        mustIncludeAny: ["energy", "atp", "powerhouse"],
      },
      {
        id: "nucleus",
        label: "Nucleus",
        mustIncludeAny: ["dna", "genetic", "control"],
      },
      {
        id: "ribo",
        label: "Ribosome",
        mustIncludeAny: ["protein", "translate"],
      },
    ],
  },
  {
    id: "game-network-terms",
    kind: "game",
    title: "Networking terms match",
    objective:
      "Match networking terms (DHCP, DNS, gateway) to accurate definitions.",
    prompt:
      "List matched pairs for DHCP, DNS, and default gateway with correct definitions. Points alone are not mastery.",
    learningObjectType: "GAME",
    skillFacet: "RECOGNIZE",
    asPerform: false,
    minChars: 30,
    domainTag: "networking",
    conceptHints: ["dhcp", "dns", "gateway", "network", "vocab"],
    misconceptionTargets: [
      "confusing DNS name resolution with DHCP address assignment",
    ],
    successLooksLike:
      "Each term maps to a correct definition distinguishing DHCP, DNS, and gateway roles.",
    scaffolds: [
      {
        kind: "HINT",
        label: "Three jobs",
        content:
          "One assigns addresses, one resolves names, one is the default exit router.",
        level: 1,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
    ],
    accessibility: {
      altDescription: "Match DHCP, DNS, and gateway to accurate definitions.",
      reducedComplexity: true,
    },
    criteria: [
      {
        id: "dhcp",
        label: "DHCP",
        mustIncludeAny: ["address", "ip", "lease", "assign"],
      },
      {
        id: "dns",
        label: "DNS",
        mustIncludeAny: ["name", "resolve", "domain", "lookup"],
      },
      {
        id: "gateway",
        label: "Gateway",
        mustIncludeAny: ["router", "exit", "default", "forward"],
      },
    ],
  },
  {
    id: "project-study-plan",
    kind: "project",
    title: "Mini study-plan project",
    objective:
      "Create a project plan with objective, milestone, and success criteria.",
    prompt:
      "Submit a project plan with objective, at least one milestone, and success criteria for learning a concept.",
    learningObjectType: "PROJECT_TASK",
    skillFacet: "APPLY",
    asPerform: false,
    minChars: 40,
    domainTag: "general",
    conceptHints: ["study plan", "milestone", "project", "plan"],
    criteria: [
      {
        id: "objective",
        label: "Objective",
        mustIncludeAny: ["objective", "goal", "aim"],
      },
      {
        id: "milestone",
        label: "Milestone",
        mustIncludeAny: ["milestone", "week", "phase", "step 1"],
      },
      {
        id: "criteria",
        label: "Success criteria",
        mustIncludeAny: ["criteria", "success", "measure", "rubric"],
      },
    ],
  },
  {
    id: "project-software-feature",
    kind: "project",
    title: "Software feature project outline",
    objective:
      "Outline a small software feature with requirements, milestone, and acceptance criteria.",
    prompt:
      "Submit a software project outline: feature goal, one implementation milestone, and acceptance criteria.",
    learningObjectType: "PROJECT_TASK",
    skillFacet: "APPLY",
    asPerform: false,
    minChars: 40,
    domainTag: "computer science",
    conceptHints: ["software", "feature", "programming", "application", "api"],
    misconceptionTargets: [
      "describing a feature without acceptance criteria",
    ],
    successLooksLike:
      "Outline includes feature goal, a milestone, and testable acceptance criteria.",
    scaffolds: [
      {
        kind: "STEP",
        label: "Three parts",
        content: "1) Goal 2) Milestone 3) Acceptance — keep each concrete.",
        level: 2,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
    ],
    criteria: [
      {
        id: "goal",
        label: "Feature goal",
        mustIncludeAny: ["feature", "goal", "user", "requirement"],
      },
      {
        id: "milestone",
        label: "Milestone",
        mustIncludeAny: ["milestone", "sprint", "phase", "week"],
      },
      {
        id: "acceptance",
        label: "Acceptance",
        mustIncludeAny: ["acceptance", "criteria", "test", "done"],
      },
    ],
  },
  {
    id: "project-business-plan",
    kind: "project",
    title: "Mini business plan project",
    objective:
      "Produce a mini business plan with market goal, milestone, and success measure.",
    prompt:
      "Submit a mini business plan: market/customer goal, one delivery milestone, and how you will measure success.",
    learningObjectType: "PROJECT_TASK",
    skillFacet: "APPLY",
    asPerform: false,
    minChars: 40,
    domainTag: "business",
    conceptHints: ["business plan", "market", "customer", "revenue", "startup"],
    criteria: [
      {
        id: "market",
        label: "Market goal",
        mustIncludeAny: ["market", "customer", "revenue", "audience"],
      },
      {
        id: "milestone",
        label: "Milestone",
        mustIncludeAny: ["milestone", "quarter", "phase", "week"],
      },
      {
        id: "measure",
        label: "Success measure",
        mustIncludeAny: ["measure", "kpi", "success", "metric"],
      },
    ],
  },
  {
    id: "presentation-outline",
    kind: "presentation",
    title: "Presentation practice outline",
    objective:
      "Deliver a presentation outline with structure, explanation, and audience Q&A.",
    prompt:
      "Submit a presentation outline covering structure, key explanation, and one anticipated audience question with response.",
    learningObjectType: "PRESENTATION_PRACTICE",
    skillFacet: "PERFORM",
    asPerform: true,
    minChars: 40,
    domainTag: "general",
    conceptHints: ["presentation", "outline", "audience", "speak"],
    criteria: [
      {
        id: "structure",
        label: "Structure",
        mustIncludeAny: ["introduction", "outline", "conclusion", "agenda"],
      },
      {
        id: "explanation",
        label: "Explanation",
        mustIncludeAny: ["explain", "because", "means", "concept"],
      },
      {
        id: "accuracy",
        label: "Accuracy cue",
        mustIncludeAny: ["evidence", "example", "fact", "data"],
      },
      {
        id: "qa",
        label: "Audience Q&A",
        mustIncludeAny: ["question", "audience", "ask"],
      },
    ],
  },
  {
    id: "presentation-history-sources",
    kind: "presentation",
    title: "History source-analysis presentation",
    objective:
      "Present a source-analysis argument with structure, evidence from sources, and audience Q&A.",
    prompt:
      "Outline a history presentation: introduction, analysis of at least one primary/secondary source, and one audience question you will address.",
    learningObjectType: "PRESENTATION_PRACTICE",
    skillFacet: "PERFORM",
    asPerform: true,
    minChars: 40,
    domainTag: "history",
    conceptHints: ["history", "source", "primary", "secondary", "argument"],
    criteria: [
      {
        id: "structure",
        label: "Structure",
        mustIncludeAny: ["introduction", "outline", "conclusion", "argument"],
      },
      {
        id: "source",
        label: "Source analysis",
        mustIncludeAny: ["source", "primary", "secondary", "document", "evidence"],
      },
      {
        id: "qa",
        label: "Audience Q&A",
        mustIncludeAny: ["question", "audience", "ask"],
      },
    ],
  },
  {
    id: "presentation-technical-brief",
    kind: "presentation",
    title: "Technical briefing presentation",
    objective:
      "Present a technical briefing with structure, concrete example/data, and audience Q&A.",
    prompt:
      "Outline a technical briefing: agenda, one technical explanation with an example or data point, and one anticipated audience question.",
    learningObjectType: "PRESENTATION_PRACTICE",
    skillFacet: "PERFORM",
    asPerform: true,
    minChars: 40,
    domainTag: "technical",
    conceptHints: ["technical", "briefing", "architecture", "system", "demo"],
    criteria: [
      {
        id: "structure",
        label: "Structure",
        mustIncludeAny: ["agenda", "introduction", "outline", "summary"],
      },
      {
        id: "tech",
        label: "Technical explanation",
        mustIncludeAny: ["example", "data", "system", "architecture", "because"],
      },
      {
        id: "qa",
        label: "Audience Q&A",
        mustIncludeAny: ["question", "audience", "ask"],
      },
    ],
  },
  // —— 2P-16 Adaptive-ready seed depth (additive catalog rows) ——
  // sim-market-order-edu moved to educational-market scenarios (2P-17)
  {
    id: "sim-patient-priority",
    kind: "simulation",
    title: "Clinical prioritization scenario",
    objective:
      "Prioritize two symptomatic patients and justify the first action using acuity cues.",
    prompt:
      "Scenario: You have two patients. Patient A: mild headache, stable vitals. Patient B: sudden shortness of breath and low oxygen saturation. State who you prioritize first, which assessment/action you take, and why acuity drives that choice. Then state the expected short-term outcome if prioritization is wrong.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "nursing",
    minChars: 50,
    conceptHints: [
      "priority",
      "prioritization",
      "acuity",
      "triage",
      "clinical",
      "nursing",
      "airway",
    ],
    misconceptionTargets: [
      "treating the first-arriving patient before the higher-acuity patient",
      "equating pain severity with airway/breathing urgency",
    ],
    successLooksLike:
      "You prioritize the higher-acuity respiratory patient, name an assessment/action, and explain the risk of wrong order.",
    accessibility: {
      altDescription:
        "Choose which of two patients to treat first and justify using acuity.",
      extendedTimeSuggested: true,
    },
    rules: {
      domains: ["nursing", "clinical"],
      state: ["patient_a", "patient_b", "priority"],
      transitions: ["compare_acuity → prioritize → act → outcome"],
    },
    scaffolds: [
      {
        kind: "HINT",
        label: "Acuity cue",
        content:
          "Compare airway/breathing threats before less urgent discomfort — which patient has an immediate physiologic risk?",
        level: 1,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
    ],
    criteria: [
      {
        id: "priority",
        label: "Priority choice",
        mustIncludeAny: [
          "patient b",
          "breath",
          "oxygen",
          "respiratory",
          "airway",
          "shortness",
        ],
      },
      {
        id: "action",
        label: "Action",
        mustIncludeAny: ["assess", "oxygen", "escalate", "monitor", "vitals", "call"],
      },
      {
        id: "why",
        label: "Rationale",
        mustIncludeAny: ["because", "acuity", "priority", "urgent", "risk"],
      },
    ],
  },
  {
    id: "write-history-cause-effect",
    kind: "writing",
    title: "Historical cause-and-effect analysis",
    objective:
      "Argue a cause→effect claim using at least one piece of historical evidence.",
    prompt:
      "Prompt: Did the printing press accelerate the spread of religious reform ideas in early modern Europe? Write a short argument stating your claim, one cause mechanism, one effect, and at least one concrete piece of evidence (named source, document type, or historical fact). Address one counterpoint briefly.",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "EXPLAIN",
    asPerform: false,
    starter: "",
    minChars: 80,
    domainTag: "history",
    conceptHints: [
      "history",
      "cause",
      "effect",
      "printing press",
      "reformation",
      "evidence",
      "argument",
    ],
    misconceptionTargets: [
      "correlation treated as single-cause proof",
      "argument without naming any evidence",
    ],
    successLooksLike:
      "Your paragraph states a claim, links cause to effect, cites evidence, and nods to a counterpoint.",
    accessibility: {
      altDescription:
        "Write a short historical argument linking the printing press to reform ideas with evidence.",
      extendedTimeSuggested: true,
    },
    scaffolds: [
      {
        kind: "STEP",
        label: "Argument frame",
        content:
          "1) Claim 2) Cause mechanism 3) Effect 4) Evidence 5) One counterpoint — keep each sentence purposeful.",
        level: 1,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
    ],
    criteria: [
      {
        id: "claim",
        label: "Claim",
        mustIncludeAny: ["claim", "argue", "because", "accelerat", "spread", "reform"],
      },
      {
        id: "evidence",
        label: "Evidence",
        mustIncludeAny: [
          "source",
          "pamphlet",
          "book",
          "luther",
          "evidence",
          "document",
          "print",
        ],
      },
      {
        id: "counter",
        label: "Counterpoint",
        mustIncludeAny: ["however", "although", "counter", "but", "other"],
      },
    ],
  },
  {
    id: "write-math-proportional-reasoning",
    kind: "writing",
    title: "Multi-step proportional reasoning",
    objective:
      "Solve a multi-step proportion word problem and explain each calculation step.",
    prompt:
      "A recipe uses 3 cups of flour for 12 muffins. You need 20 muffins and also scale sugar at the same ratio (the original uses 2 cups sugar for 12 muffins). Compute flour and sugar needed for 20 muffins. Show the proportion setup, intermediate values, and final amounts with units.",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "SOLVE",
    asPerform: false,
    starter: "",
    minChars: 60,
    domainTag: "mathematics",
    conceptHints: [
      "proportion",
      "ratio",
      "scale",
      "mathematics",
      "multi-step",
      "unit",
    ],
    misconceptionTargets: [
      "adding the same amount instead of scaling by ratio",
      "mixing muffin count with cup counts without a proportion",
    ],
    successLooksLike:
      "You set up proportions, compute scaled flour and sugar, and state final amounts with units.",
    accessibility: {
      altDescription:
        "Scale a muffin recipe using proportions and explain each step in writing.",
      reducedComplexity: true,
      extendedTimeSuggested: true,
    },
    scaffolds: [
      {
        kind: "HINT",
        label: "Scale factor",
        content:
          "Compare 20 muffins to 12 muffins to find the scale factor before multiplying ingredient amounts.",
        level: 1,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
    ],
    criteria: [
      {
        id: "setup",
        label: "Proportion setup",
        mustIncludeAny: ["proportion", "ratio", "scale", "/", "over", "for"],
      },
      {
        id: "flour",
        label: "Flour result",
        mustIncludeAny: ["flour", "5", "cups"],
      },
      {
        id: "sugar",
        label: "Sugar result",
        mustIncludeAny: ["sugar", "cups"],
      },
    ],
  },
  {
    id: "lab-physics-force-balance",
    kind: "lab",
    title: "Force-balance reasoning lab",
    objective:
      "Reason about net force and motion when two horizontal forces act on an object.",
    prompt:
      "Lab reasoning (text procedure): A 5 kg crate on a frictionless surface is pulled right with 20 N and left with 8 N. State each force, compute net force (magnitude and direction), state the resulting acceleration qualitatively or quantitatively, and note one measurement you would record in a real lab.",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "physics",
    minChars: 50,
    conceptHints: [
      "force",
      "net force",
      "newton",
      "acceleration",
      "physics",
      "balance",
    ],
    misconceptionTargets: [
      "larger force means constant speed rather than acceleration",
      "subtracting masses instead of forces",
    ],
    successLooksLike:
      "You identify both forces, compute a rightward net force, relate it to acceleration, and name a measurable quantity.",
    accessibility: {
      altDescription:
        "Calculate net force on a crate and describe acceleration from two opposing forces.",
      reducedComplexity: true,
    },
    scaffolds: [
      {
        kind: "HINT",
        label: "Net force",
        content:
          "Net force is the vector sum — same-line opposite forces subtract.",
        level: 1,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
    ],
    criteria: [
      {
        id: "forces",
        label: "Forces named",
        mustIncludeAny: ["20", "8", "newton", "n ", "force"],
      },
      {
        id: "net",
        label: "Net force",
        mustIncludeAny: ["12", "net", "right", "resultant"],
      },
      {
        id: "motion",
        label: "Motion / measurement",
        mustIncludeAny: [
          "accelerat",
          "measure",
          "velocity",
          "meter",
          "sensor",
          "mass",
        ],
      },
    ],
  },
  {
    id: "sim-dns-misconfig",
    kind: "simulation",
    title: "DNS misconfiguration simulation",
    objective:
      "Diagnose a DNS misconfiguration from symptoms and choose a corrective action.",
    prompt:
      "Scenario: users can ping 8.8.8.8 by IP but cannot resolve www.example.com. State the most likely fault layer, one diagnostic command/check, the corrective configuration change, and the expected result after the fix.",
    learningObjectType: "SIMULATION",
    skillFacet: "SOLVE",
    asPerform: false,
    domainTag: "networking",
    minChars: 45,
    conceptHints: [
      "dns",
      "resolve",
      "name resolution",
      "networking",
      "misconfiguration",
      "troubleshoot",
    ],
    misconceptionTargets: [
      "assuming the gateway is down when IP connectivity still works",
      "flushing ARP when DNS is the failing layer",
    ],
    successLooksLike:
      "You identify DNS as the fault, name a check, apply a DNS-related fix, and state restored name resolution.",
    accessibility: {
      altDescription:
        "Diagnose why name resolution fails while IP ping still works.",
    },
    rules: {
      domains: ["networking"],
      state: ["ip_ok", "dns_fail", "users"],
      transitions: ["symptom → isolate_dns → reconfigure → verify"],
    },
    scaffolds: [
      {
        kind: "HINT",
        label: "Split the stack",
        content:
          "If IP reachability works but names fail, focus on name resolution — not L2 cabling first.",
        level: 1,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
    ],
    criteria: [
      {
        id: "diagnose",
        label: "DNS diagnosis",
        mustIncludeAny: ["dns", "resolve", "resolver", "name"],
      },
      {
        id: "action",
        label: "Fix action",
        mustIncludeAny: [
          "reconfigure",
          "update",
          "fix",
          "dns server",
          "flush",
          "point",
        ],
      },
      {
        id: "result",
        label: "Result",
        mustIncludeAny: ["resolve", "resolved", "works", "restored", "because"],
      },
    ],
  },
  {
    id: "lab-hvac-airflow",
    kind: "lab",
    title: "HVAC airflow check lab",
    objective:
      "Record thermostat call, blower status, and register airflow to locate a delivery fault.",
    prompt:
      "Procedural lab: note the thermostat mode/setpoint, whether the blower is running, and what you feel at the supply registers. State a likely fault category (call vs delivery).",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "hvac",
    minChars: 40,
    conceptHints: ["thermostat", "blower", "register", "airflow", "hvac", "setpoint"],
    scaffolds: [
      {
        kind: "HINT",
        label: "Call vs air",
        content:
          "A thermostat can call for cool while the blower or ducts fail to deliver air.",
        level: 1,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
    ],
    criteria: [
      {
        id: "thermostat",
        label: "Thermostat observation",
        mustIncludeAny: ["thermostat", "setpoint", "cool", "heat", "mode"],
      },
      {
        id: "blower",
        label: "Blower / airflow",
        mustIncludeAny: ["blower", "fan", "register", "airflow", "duct"],
      },
      {
        id: "fault",
        label: "Fault category",
        mustIncludeAny: ["call", "delivery", "airflow", "because", "fault"],
      },
    ],
  },
  {
    id: "sim-hvac-comfort",
    kind: "simulation",
    title: "Comfort setpoint simulation",
    objective:
      "Decide whether the problem is setpoint, thermostat call, or air delivery.",
    prompt:
      "Scenario: room stays warm while the thermostat shows a cool setpoint. Diagnose setpoint vs call vs delivery and state one next check.",
    learningObjectType: "SIMULATION",
    skillFacet: "SOLVE",
    asPerform: false,
    domainTag: "hvac",
    minChars: 40,
    conceptHints: ["setpoint", "thermostat", "delivery", "comfort", "hvac"],
    criteria: [
      {
        id: "diagnosis",
        label: "Diagnosis",
        mustIncludeAny: ["setpoint", "call", "delivery", "airflow", "thermostat"],
      },
      {
        id: "next",
        label: "Next check",
        mustIncludeAny: ["check", "blower", "register", "sensor", "because"],
      },
    ],
  },
  {
    id: "write-research-ethics-scenario",
    kind: "writing",
    title: "Research ethics scenario",
    objective:
      "Name the ethical issue and a responsible next step in a short written response.",
    prompt:
      "A classmate copies paragraphs from a website into a paper without citation. Name the ethical issue and one responsible next step.",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "EXPLAIN",
    asPerform: false,
    domainTag: "humanities",
    minChars: 40,
    conceptHints: ["citation", "plagiarism", "ethics", "consent", "source"],
    criteria: [
      {
        id: "issue",
        label: "Ethical issue",
        mustIncludeAny: ["plagiarism", "citation", "source", "credit", "ethics"],
      },
      {
        id: "next",
        label: "Next step",
        mustIncludeAny: ["cite", "rewrite", "ask", "attribute", "revise"],
      },
    ],
  },
];

/** 2P-17 — Educational market scenarios merged into Simulation catalog. */
const EDUCATIONAL_MARKET_CHALLENGES =
  listEducationalMarketStructuredChallenges(
    listEducationalMarketScenarios(),
  ) as StructuredChallenge[];

/** 2P-18 — Adaptive-ready Writing seeds merged into Writing catalog. */
const WRITING_ADAPTIVE_CHALLENGES =
  listWritingAdaptiveStructuredChallenges() as StructuredChallenge[];

/** 2P-26 — Cross-domain expansion pack (not a subject engine). */
const DOMAIN_EXPANSION_CHALLENGES =
  listDomainExpansionStructuredChallenges() as StructuredChallenge[];

/** 2P-32 — Representative content depth pack (not a subject engine). */
const CONTENT_DEPTH_CHALLENGES =
  listContentDepthStructuredChallenges() as StructuredChallenge[];

/** 2P-36 — Universal domain experience pack (not a subject engine). */
const DOMAIN_EXPERIENCE_CHALLENGES =
  listDomainExperienceStructuredChallenges() as StructuredChallenge[];

/** 2P-37 — Experience depth companions (not a subject engine). */
const EXPERIENCE_DEPTH_CHALLENGES =
  listExperienceDepthStructuredChallenges() as StructuredChallenge[];

/** 2P-48 — All-ages depth ladder (proportional scaling). */
const ALL_AGES_DEPTH_CHALLENGES =
  listAllAgesDepthStructuredChallenges() as StructuredChallenge[];

/** Post-roadmap content expansion queue (breadth pack; not a subject engine). */
const CONTENT_EXPANSION_CHALLENGES =
  listContentExpansionStructuredChallenges() as StructuredChallenge[];

export const STRUCTURED_CHALLENGES: StructuredChallenge[] = [
  ...STRUCTURED_CHALLENGES_BASE,
  ...EDUCATIONAL_MARKET_CHALLENGES,
  ...WRITING_ADAPTIVE_CHALLENGES,
  ...DOMAIN_EXPANSION_CHALLENGES,
  ...CONTENT_DEPTH_CHALLENGES,
  ...DOMAIN_EXPERIENCE_CHALLENGES,
  ...EXPERIENCE_DEPTH_CHALLENGES,
  ...ALL_AGES_DEPTH_CHALLENGES,
  ...CONTENT_EXPANSION_CHALLENGES,
];

export function getStructuredChallenge(id: string): StructuredChallenge | null {
  return STRUCTURED_CHALLENGES.find((c) => c.id === id) ?? null;
}

export function listStructuredChallenges(
  kind?: StructuredActivityKind,
): Array<
  Pick<
    StructuredChallenge,
    "id" | "kind" | "title" | "prompt" | "starter" | "objective" | "domainTag"
  > & {
    requiresRevision?: boolean;
    writingType?: string;
    sourceMaterial?: string;
    revisionIssues?: readonly string[];
    starterDraft?: string;
  }
> {
  return STRUCTURED_CHALLENGES.filter((c) => !kind || c.kind === kind).map(
    (c) => {
      const writingMeta =
        c.kind === "writing" ? getWritingAdaptiveMeta(c.id) : null;
      const rules = c.rules ?? {};
      return {
        id: c.id,
        kind: c.kind,
        title: c.title,
        prompt: c.prompt,
        starter: c.starter ?? "",
        objective: c.objective,
        domainTag: c.domainTag,
        ...(writingMeta
          ? {
              requiresRevision: writingMeta.requiresRevision,
              writingType: writingMeta.writingType,
              sourceMaterial: writingMeta.sourceMaterial,
              revisionIssues: writingMeta.revisionIssues,
              starterDraft: writingMeta.starterDraft,
            }
          : {}),
        ...(typeof rules.requiresRevision === "boolean"
          ? { requiresRevision: rules.requiresRevision as boolean }
          : {}),
      };
    },
  );
}

function extractArtifact(work: Record<string, unknown>): string {
  if (typeof work.text === "string") return work.text;
  if (typeof work.draft === "string") return work.draft;
  if (typeof work.artifact === "string") return work.artifact;
  if (typeof work.observations === "string") return work.observations;
  if (typeof work.outline === "string") return work.outline;
  if (typeof work.decisions === "string") return work.decisions;
  if (typeof work.response === "string") return work.response;
  // 2P-17 educational market decision payload
  if (work.marketDecision && typeof work.marketDecision === "object") {
    return JSON.stringify({
      educationalOnly: true,
      realMoney: false,
      brokerage: false,
      decision: work.marketDecision,
      journal: work.journal ?? null,
    });
  }
  // Simulation: serialize choices
  if (work.choices && typeof work.choices === "object") {
    return JSON.stringify(work.choices);
  }
  return "";
}

export function evaluateStructuredChallenge(
  challenge: StructuredChallenge,
  artifact: string,
  work?: Record<string, unknown>,
): UniversalEvaluationResult {
  const market = getEducationalMarketScenario(challenge.id);
  if (market) {
    return evaluateEducationalMarketSubmission(market, artifact);
  }
  // 2P-18 — Writing uses revision gate + universal rubric (same evidence path).
  if (challenge.kind === "writing") {
    const { evaluation } = evaluateWritingWork({
      challengeId: challenge.id,
      criteria: challenge.criteria,
      skillFacet: challenge.skillFacet,
      minChars: challenge.minChars,
      objective: challenge.objective,
      domainTag: challenge.domainTag ?? null,
      work: work ?? { text: artifact },
    });
    return evaluation;
  }
  // Game: points field alone must not grant mastery — ignore client points.
  return evaluateAgainstRubric({
    text: artifact,
    criteria: challenge.criteria,
    skillFacet: challenge.skillFacet,
    minChars: challenge.minChars,
    details: {
      kind: challenge.kind,
      domainTag: challenge.domainTag ?? null,
      contentId: challenge.id,
      objective: challenge.objective,
      rules: challenge.rules ?? null,
      pointsIgnored: challenge.kind === "game",
    },
  });
}

export async function submitStructuredChallenge(input: {
  learnerId: string;
  conceptId: string;
  challengeId: string;
  clientBody: Record<string, unknown>;
}): Promise<
  | {
      ok: true;
      completion: UniversalActivityCompletion;
      evaluationDetails: Record<string, unknown>;
      rejectedForgeryKeys: string[];
      kind: StructuredActivityKind;
    }
  | { ok: false; reason: string; rejectedForgeryKeys?: string[] }
> {
  const { work, rejectedForgeryKeys } = sanitizeClientActivitySubmission(
    input.clientBody,
  );
  // Explicitly drop points/badges as mastery signals
  delete work.points;
  delete work.badges;
  delete work.score;

  const challenge = getStructuredChallenge(input.challengeId);
  if (!challenge) {
    return { ok: false, reason: "unknown_challenge", rejectedForgeryKeys };
  }

  let artifact = extractArtifact(work);
  let evaluation;
  let writingForgery: string[] = [];
  let aiAssistancePresent = false;

  if (challenge.kind === "writing") {
    const writing = evaluateWritingWork({
      challengeId: challenge.id,
      criteria: challenge.criteria,
      skillFacet: challenge.skillFacet,
      minChars: challenge.minChars,
      objective: challenge.objective,
      domainTag: challenge.domainTag ?? null,
      work,
    });
    evaluation = writing.evaluation;
    artifact = writing.finalText;
    writingForgery = writing.rejectedForgeryKeys;
  } else if (
    challenge.kind === "project" ||
    challenge.kind === "presentation"
  ) {
    // 2P-47 — Same AI boundary as writing: aiAssistance never becomes evidence.
    const rawAi =
      typeof work.aiAssistance === "string"
        ? work.aiAssistance
        : typeof work.aiHelp === "string"
          ? work.aiHelp
          : null;
    const separated = separateAiAssistanceFromEvidence({
      learnerText: artifact,
      aiAssistance: rawAi,
    });
    artifact = separated.evidenceText;
    aiAssistancePresent = Boolean(separated.aiAssistance);
    evaluation = evaluateStructuredChallenge(challenge, artifact, work);
  } else {
    evaluation = evaluateStructuredChallenge(challenge, artifact, work);
  }

  const allRejected = [...rejectedForgeryKeys, ...writingForgery];

  const idempotencyKey =
    typeof work.idempotencyKey === "string"
      ? work.idempotencyKey.trim().slice(0, 128)
      : undefined;

  const recorded = await recordAuthoritativeActivityEvidence({
    learnerId: input.learnerId,
    conceptId: input.conceptId,
    learningObjectType: challenge.learningObjectType,
    skillFacet: challenge.skillFacet,
    title: challenge.title,
    payloadRef: {
      kind: `${challenge.kind}_challenge`,
      id: challenge.id,
      contentId: challenge.id,
      objective: challenge.objective,
      domainTag: challenge.domainTag ?? null,
      ...(idempotencyKey ? { idempotencyKey } : {}),
    },
    successCriteria: {
      criteria: challenge.criteria.map((c) => c.id),
      objective: challenge.objective,
    },
    evaluation,
    sourceKind: `${challenge.kind}_challenge_submit`,
    evidencePayload: {
      artifactPreview: artifact.slice(0, 600),
      learnerAuthored: true,
      contentId: challenge.id,
      ...(aiAssistancePresent ? { aiAssistancePresent: true } : {}),
      ...(challenge.kind === "writing"
        ? {
            writingAdaptive: true,
            writingType: getWritingAdaptiveMeta(challenge.id)?.writingType ?? null,
            requiresRevision:
              getWritingAdaptiveMeta(challenge.id)?.requiresRevision ?? false,
          }
        : {}),
      ...(challenge.kind === "presentation"
        ? {
            presentationHonesty:
              "outline_or_explanation_practice_not_speech_quality",
          }
        : {}),
      ...(challenge.kind === "project"
        ? {
            projectHonesty: "plan_outline_milestone_completion_is_not_mastery",
          }
        : {}),
    },
    asPerform: challenge.asPerform,
  });

  if (!recorded.ok) {
    return { ok: false, reason: recorded.reason, rejectedForgeryKeys: allRejected };
  }

  return {
    ok: true,
    completion: recorded.completion,
    evaluationDetails: evaluation.details,
    rejectedForgeryKeys: allRejected,
    kind: challenge.kind,
  };
}

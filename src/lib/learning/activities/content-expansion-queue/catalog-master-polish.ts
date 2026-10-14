/**
 * Master post-roadmap content polish — finance retain/transfer + Tier-3 career
 * scenarios + one educational game. Additive fixtures only.
 */

import type { StructuredChallenge } from "@/lib/learning/activities/structured/service";
import { hint, step, checklist } from "./helpers";

export const CONTENT_EXPANSION_MASTER_POLISH_CHALLENGES: StructuredChallenge[] = [
  {
    id: "write-diversification-retain",
    kind: "writing",
    title: "Diversification retrieval",
    objective:
      "Retrieve why spreading risk across uncorrelated assets reduces portfolio volatility.",
    prompt:
      "Without notes: In two to four sentences, explain diversification and why owning only one stock is riskier than a mixed basket (educational finance — not advice).",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "RETAIN",
    asPerform: false,
    domainTag: "finance",
    minChars: 45,
    conceptHints: ["diversification", "risk", "portfolio", "volatility", "finance"],
    misconceptionTargets: [
      "confusing diversification with guaranteeing profit",
      "assuming more stocks always means less risk regardless of correlation",
    ],
    successLooksLike:
      "Names spreading risk / uncorrelated assets and contrasts single-stock concentration.",
    scaffolds: [
      hint("Risk idea", "Think about what happens if one company fails vs many."),
    ],
    criteria: [
      {
        id: "spread",
        label: "Spread risk",
        mustIncludeAny: ["diversif", "spread", "mix", "basket", "multiple"],
      },
      {
        id: "single",
        label: "Concentration risk",
        mustIncludeAny: ["one stock", "single", "concentrat", "all in"],
      },
    ],
  },
  {
    id: "sim-volatility-transfer-paycheck",
    kind: "simulation",
    title: "Volatility in a paycheck context",
    objective:
      "Transfer volatility/risk thinking from markets to a household cash-flow scenario.",
    prompt:
      "Transfer: Your freelance income swings 40% month to month. Name the volatility risk, one buffer tactic (savings/expense), and why a single late invoice can cascade — educational only, not personal advice.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "finance",
    minChars: 50,
    conceptHints: ["volatility", "risk", "cash flow", "buffer", "finance"],
    misconceptionTargets: [
      "treating volatile income as the same as guaranteed salary",
    ],
    successLooksLike:
      "Names swing/volatility, a buffer, and a cascade from delayed income.",
    scaffolds: [
      hint("Transfer surface", "Same risk idea — different context (paycheck vs ticker)."),
      step("Buffer", "Emergency savings or flexible expenses are common educational examples."),
    ],
    criteria: [
      {
        id: "vol",
        label: "Volatility",
        mustIncludeAny: ["volatil", "swing", "variable", "unstable", "fluctuat"],
      },
      {
        id: "buffer",
        label: "Buffer",
        mustIncludeAny: ["saving", "buffer", "reserve", "emergency", "cut"],
      },
      {
        id: "cascade",
        label: "Cascade",
        mustIncludeAny: ["invoice", "late", "rent", "bill", "cascade", "miss"],
      },
    ],
  },
  {
    id: "sim-healthcare-admin-hipaa-lite",
    kind: "simulation",
    title: "Healthcare admin privacy triage",
    objective:
      "Apply educational privacy judgment when staff chat about a patient in a hallway.",
    prompt:
      "Simulation (educational, not legal advice): Two clerks discuss a patient's diagnosis loudly near the waiting room. Name the privacy issue, one immediate action, and one policy reminder.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "healthcare administration",
    minChars: 48,
    conceptHints: ["privacy", "hipaa", "phi", "confidential", "healthcare admin"],
    misconceptionTargets: [
      "assuming hallway talk is fine if no names are used when details identify someone",
    ],
    successLooksLike:
      "Cites privacy/PHI/confidentiality, moves conversation or stops it, and references policy/training.",
    scaffolds: [
      hint("Who can hear?", "Waiting rooms often include people who should not hear clinical details."),
    ],
    criteria: [
      {
        id: "issue",
        label: "Privacy issue",
        mustIncludeAny: ["privacy", "phi", "hipaa", "confidential", "overhear"],
      },
      {
        id: "action",
        label: "Immediate action",
        mustIncludeAny: ["stop", "move", "private", "quiet", "remind"],
      },
      {
        id: "policy",
        label: "Policy",
        mustIncludeAny: ["policy", "training", "report", "supervisor", "handbook"],
      },
    ],
  },
  {
    id: "lab-construction-ppe-ladder",
    kind: "lab",
    title: "Construction ladder safety check",
    objective:
      "Perform an educational pre-use ladder and PPE check for a worksite scenario.",
    prompt:
      "Procedural lab (educational): Before climbing an extension ladder outdoors, list PPE you would wear, three ladder checks (feet/angle/top support), and one unsafe shortcut to refuse.",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "construction",
    minChars: 50,
    conceptHints: ["ladder", "ppe", "construction", "safety", "fall"],
    misconceptionTargets: [
      "skipping base checks because the ladder 'looked fine last week'",
    ],
    successLooksLike:
      "Names PPE, three physical checks, and refuses an unsafe shortcut.",
    scaffolds: [
      checklist(
        "Pre-climb",
        "PPE on · feet stable · angle OK · top support · refuse damaged gear",
      ),
    ],
    criteria: [
      {
        id: "ppe",
        label: "PPE",
        mustIncludeAny: ["helmet", "hard hat", "gloves", "boots", "ppe"],
      },
      {
        id: "checks",
        label: "Ladder checks",
        mustIncludeAny: ["feet", "angle", "base", "top", "level", "support"],
      },
      {
        id: "refuse",
        label: "Refuse shortcut",
        mustIncludeAny: ["refuse", "damaged", "unsafe", "not use", "replace"],
      },
    ],
  },
  {
    id: "write-teaching-formative-check",
    kind: "writing",
    title: "Formative check vs grade",
    objective:
      "Explain formative assessment as learning feedback — not the same as a final grade.",
    prompt:
      "Education scenario: A teacher uses a 3-question exit ticket after a lesson. Explain how this is formative (for learning), how it differs from a unit exam grade, and one follow-up if many students miss the same idea.",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "EXPLAIN",
    asPerform: false,
    domainTag: "education",
    minChars: 50,
    conceptHints: ["formative", "assessment", "feedback", "teaching", "exit ticket"],
    misconceptionTargets: [
      "treating every quiz as high-stakes grading instead of learning information",
    ],
    successLooksLike:
      "Defines formative feedback, contrasts with summative/unit grade, and names reteach/adjust.",
    scaffolds: [
      hint("Purpose", "Formative answers 'are they learning yet?' — grades answer 'what did they achieve?'"),
    ],
    criteria: [
      {
        id: "formative",
        label: "Formative",
        mustIncludeAny: ["formative", "feedback", "check", "learning", "exit"],
      },
      {
        id: "contrast",
        label: "Vs grade",
        mustIncludeAny: ["grade", "exam", "summative", "final", "score"],
      },
      {
        id: "follow",
        label: "Follow-up",
        mustIncludeAny: ["reteach", "review", "adjust", "practice", "clarify"],
      },
    ],
  },
  {
    id: "sim-hospitality-complaint-recover",
    kind: "simulation",
    title: "Hospitality service recovery",
    objective:
      "Apply a calm service-recovery sequence for a delayed food order complaint.",
    prompt:
      "Simulation: A guest waited 35 minutes for an entrée and is frustrated. Outline acknowledge → apologize → fix/offer → follow-up. Stay professional; no blame on the guest.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "hospitality",
    minChars: 48,
    conceptHints: ["service recovery", "hospitality", "complaint", "guest", "apology"],
    misconceptionTargets: [
      "arguing about kitchen blame instead of recovering the guest experience",
    ],
    successLooksLike:
      "Acknowledges wait, apologizes, offers a concrete fix, and follows up.",
    scaffolds: [
      step("Sequence", "Listen · apologize · solution · confirm satisfaction."),
    ],
    criteria: [
      {
        id: "ack",
        label: "Acknowledge",
        mustIncludeAny: ["wait", "acknowledge", "hear", "understand", "frustrat"],
      },
      {
        id: "sorry",
        label: "Apology",
        mustIncludeAny: ["sorry", "apolog", "regret"],
      },
      {
        id: "fix",
        label: "Fix",
        mustIncludeAny: ["comp", "discount", "remake", "priority", "offer", "replace"],
      },
    ],
  },
  {
    id: "game-sql-select-match",
    kind: "game",
    title: "SQL keyword match",
    objective:
      "Match SQL clauses to their jobs (educational game — points are not mastery).",
    prompt:
      "Game: Match SELECT, WHERE, ORDER BY, and JOIN to: project columns · filter rows · sort results · combine tables. Write term → role for each. Points alone are not mastery.",
    learningObjectType: "GAME",
    skillFacet: "RECOGNIZE",
    asPerform: false,
    domainTag: "computer science",
    minChars: 40,
    conceptHints: ["sql", "select", "where", "join", "order by", "game"],
    misconceptionTargets: [
      "confusing WHERE filtering with SELECT column projection",
    ],
    successLooksLike:
      "Correctly maps SELECT/WHERE/ORDER BY/JOIN to projection/filter/sort/combine.",
    scaffolds: [
      hint("SELECT vs WHERE", "SELECT chooses columns; WHERE chooses which rows survive."),
    ],
    criteria: [
      {
        id: "select",
        label: "SELECT",
        mustIncludeAny: ["select", "column", "project"],
      },
      {
        id: "where",
        label: "WHERE",
        mustIncludeAny: ["where", "filter", "row"],
      },
      {
        id: "order",
        label: "ORDER BY",
        mustIncludeAny: ["order", "sort"],
      },
      {
        id: "join",
        label: "JOIN",
        mustIncludeAny: ["join", "combin", "table"],
      },
    ],
  },
];

/**
 * 2P-32 — Representative content depth pack (structured challenges).
 * Merges into STRUCTURED_CHALLENGES — not a domain engine or second CMS.
 */

import type { StructuredChallenge } from "@/lib/learning/activities/structured/service";

/**
 * High-quality depth items: distinct stages/variants, actionable misconceptions,
 * removable scaffolds, and activity-specific success criteria.
 */
export const CONTENT_DEPTH_STRUCTURED_CHALLENGES: StructuredChallenge[] = [
  // —— Cybersecurity — authorization challenge + retain ——
  {
    id: "sim-authz-rbac-challenge",
    kind: "simulation",
    title: "RBAC authorization miss",
    objective:
      "Diagnose why a user can read but not update a record under role-based access control.",
    prompt:
      "Simulation: Alex is in role Reader (read:yes, update:no). The UI shows an Edit button that returns 403. Explain which permission is missing, why authentication succeeded, and the least-privilege fix (role change vs granting update to Reader).",
    learningObjectType: "SIMULATION",
    skillFacet: "SOLVE",
    asPerform: false,
    domainTag: "cybersecurity",
    minChars: 55,
    conceptHints: [
      "authorization",
      "authentication",
      "rbac",
      "least privilege",
      "access control",
      "cybersecurity",
    ],
    misconceptionTargets: [
      "treating a 403 as a login failure (authentication vs authorization)",
      "granting admin to fix a single missing permission",
    ],
    successLooksLike:
      "You separate authn from authz, name the missing update permission, and propose a least-privilege role or grant — not blanket admin.",
    accessibility: {
      altDescription:
        "Explain why an authenticated user cannot update a record under RBAC.",
      reducedComplexity: true,
    },
    scaffolds: [
      {
        kind: "HINT",
        label: "Authn vs authz",
        content:
          "If the user is logged in but Edit returns 403, identity was accepted — permission to change the resource was not.",
        level: 1,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
    ],
    criteria: [
      {
        id: "authz",
        label: "Authorization gap",
        mustIncludeAny: ["authoriz", "permission", "update", "role", "rbac"],
      },
      {
        id: "not-login",
        label: "Not a login failure",
        mustIncludeAny: ["authenticat", "logged in", "403", "not login", "identity"],
      },
      {
        id: "least",
        label: "Least privilege fix",
        mustIncludeAny: ["least", "grant update", "writer", "role", "not admin"],
      },
    ],
  },
  {
    id: "sim-phishing-retain",
    kind: "simulation",
    title: "Phishing retrieval check",
    objective:
      "Retrieve phishing-response steps from memory for a new message (delayed retrieval).",
    prompt:
      "Retain: Without rereading the earlier IT-reset scenario, a new SMS says your bank locked the account and includes a short link. In your own words: name two cues, state whether you open the link, and the safe next action.",
    learningObjectType: "SIMULATION",
    skillFacet: "RETAIN",
    asPerform: false,
    domainTag: "cybersecurity",
    minChars: 40,
    conceptHints: [
      "phishing",
      "social engineering",
      "cybersecurity",
      "retrieval",
      "retain",
    ],
    misconceptionTargets: [
      "assuming SMS from a bank is automatically legitimate",
    ],
    successLooksLike:
      "You cite urgency/short-link cues, refuse the link, and verify via a known bank channel — without needing the prior email wording.",
    criteria: [
      {
        id: "cues",
        label: "Cues recalled",
        mustIncludeAny: ["urgent", "link", "short", "sms", "pressure", " unfamiliar"],
      },
      {
        id: "no-open",
        label: "Do not open",
        mustIncludeAny: ["not open", "don't", "do not", "avoid", "refuse"],
      },
      {
        id: "verify",
        label: "Verify safely",
        mustIncludeAny: ["call", "app", "official", "verify", "bank", "known"],
      },
    ],
  },

  // —— Nursing — multi-step challenge ——
  {
    id: "sim-nursing-sepsis-challenge",
    kind: "simulation",
    title: "Sepsis priority challenge",
    objective:
      "Prioritize actions for a deteriorating patient using clinical reasoning (educational scenario).",
    prompt:
      "Challenge: Post-op patient has HR 128, BP 88/50, temp 38.9°C, new confusion, wound drainage. Rank first three actions and justify with prioritization (airway/breathing/circulation and sepsis concern). Educational only — not clinical advice.",
    learningObjectType: "SIMULATION",
    skillFacet: "SOLVE",
    asPerform: false,
    domainTag: "nursing",
    minChars: 60,
    conceptHints: [
      "clinical prioritization",
      "sepsis",
      "assessment",
      "nursing",
      "triage",
    ],
    misconceptionTargets: [
      "documenting first instead of addressing circulation instability",
      "treating fever alone as the highest priority over hypotension",
    ],
    successLooksLike:
      "You prioritize vital instability / sepsis escalation before charting niceties, and name assessment + notify/escalate with rationale.",
    accessibility: {
      altDescription:
        "Rank first actions for a post-op patient with possible sepsis signs.",
      extendedTimeSuggested: true,
    },
    scaffolds: [
      {
        kind: "HINT",
        label: "Unstable first",
        content:
          "Hypotension + tachycardia + new confusion usually outrank non-urgent documentation tasks.",
        level: 1,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
    ],
    criteria: [
      {
        id: "unstable",
        label: "Recognize instability",
        mustIncludeAny: ["hypotens", "shock", "sepsis", "unstable", "vitals", "bp"],
      },
      {
        id: "escalate",
        label: "Escalate / notify",
        mustIncludeAny: ["notify", "escalate", "rapid", "provider", "call", "team"],
      },
      {
        id: "order",
        label: "Priority order",
        mustIncludeAny: ["first", "before", "priority", "then", "assess"],
      },
    ],
  },

  // —— Business — retain / transfer ——
  {
    id: "sim-price-ceiling-challenge",
    kind: "simulation",
    title: "Price ceiling transfer",
    objective:
      "Apply supply/demand reasoning to a price ceiling in an unfamiliar housing scenario.",
    prompt:
      "Challenge: City sets rent ceiling below equilibrium for apartments. Predict shortage vs surplus, who is helped/hurt in the short run, and one unintended consequence (educational economics).",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "business",
    minChars: 50,
    conceptHints: [
      "supply and demand",
      "price ceiling",
      "shortage",
      "equilibrium",
      "market",
    ],
    misconceptionTargets: [
      "claiming a price ceiling above equilibrium creates a shortage",
      "assuming ceilings always help all renters equally",
    ],
    successLooksLike:
      "You state a shortage when ceiling is below equilibrium, name winners/losers carefully, and note an unintended effect (queues, quality drop, black market).",
    scaffolds: [
      {
        kind: "HINT",
        label: "Below vs above",
        content:
          "Binding ceilings sit below equilibrium price; non-binding ceilings sit above it and do not create shortages.",
        level: 1,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
    ],
    criteria: [
      {
        id: "shortage",
        label: "Shortage prediction",
        mustIncludeAny: ["shortage", "excess demand", "qd > qs", "fewer units"],
      },
      {
        id: "binding",
        label: "Below equilibrium",
        mustIncludeAny: ["below", "binding", "equilibrium", "under"],
      },
      {
        id: "unintended",
        label: "Unintended consequence",
        mustIncludeAny: [
          "queue",
          "quality",
          "black market",
          "search",
          "discrimination",
          "maintenance",
        ],
      },
    ],
  },

  // —— Writing — transfer challenge ——
  {
    id: "write-evidence-transfer-challenge",
    kind: "writing",
    title: "Evidence paragraph in new domain",
    objective:
      "Write a claim-evidence-reasoning paragraph on an unfamiliar civic topic.",
    prompt:
      "Challenge: Argue whether cities should expand protected bike lanes. Include a clear claim, one piece of evidence (invented but plausible statistic OK if labeled hypothetical), and reasoning that connects evidence to claim. Avoid slogan-only writing.",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "english",
    minChars: 80,
    conceptHints: ["evidence", "claim", "reasoning", "argument", "thesis", "writing"],
    misconceptionTargets: [
      "stating a claim without linking evidence through reasoning",
    ],
    successLooksLike:
      "Paragraph has claim + evidence + explicit reasoning bridge — not just opinions stacked.",
    accessibility: {
      altDescription:
        "Write a claim-evidence-reasoning paragraph about bike lanes.",
      reducedComplexity: false,
    },
    scaffolds: [
      {
        kind: "HINT",
        label: "CER bridge",
        content:
          "After the evidence sentence, add because/therefore language that shows why the evidence supports the claim.",
        level: 1,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
    ],
    criteria: [
      {
        id: "claim",
        label: "Claim",
        mustIncludeAny: ["should", "must", "ought", "claim", "argue"],
      },
      {
        id: "evidence",
        label: "Evidence",
        mustIncludeAny: ["percent", "study", "data", "evidence", "survey", "rate"],
      },
      {
        id: "reasoning",
        label: "Reasoning",
        mustIncludeAny: ["because", "therefore", "shows", "supports", "means"],
      },
    ],
  },

  // —— Game / Project enrichment depth (same rows upgraded via parallel ids) ——
  {
    id: "game-security-terms-challenge",
    kind: "game",
    title: "Security terms challenge match",
    objective:
      "Match authentication, authorization, and phishing to accurate definitions under time pressure framing.",
    prompt:
      "Challenge match: define authentication, authorization, and phishing in one sentence each. Points alone are not mastery — definitions must be accurate.",
    learningObjectType: "GAME",
    skillFacet: "RECOGNIZE",
    asPerform: false,
    minChars: 40,
    domainTag: "cybersecurity",
    conceptHints: [
      "authentication",
      "authorization",
      "phishing",
      "cybersecurity",
      "game",
    ],
    misconceptionTargets: [
      "using authentication and authorization interchangeably",
    ],
    successLooksLike:
      "Three accurate definitions distinguishing identity check, permission check, and deceptive credential theft.",
    scaffolds: [
      {
        kind: "HINT",
        label: "Authn vs authz",
        content: "Authentication asks who you are; authorization asks what you may do.",
        level: 1,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
    ],
    accessibility: {
      altDescription:
        "Define authentication, authorization, and phishing accurately.",
      reducedComplexity: true,
    },
    criteria: [
      {
        id: "authn",
        label: "Authentication",
        mustIncludeAny: ["identity", "login", "verify who", "credentials"],
      },
      {
        id: "authz",
        label: "Authorization",
        mustIncludeAny: ["permission", "access", "allowed", "role"],
      },
      {
        id: "phish",
        label: "Phishing",
        mustIncludeAny: ["deceive", "fraud", "fake", "steal", "social"],
      },
    ],
  },
  {
    id: "project-api-feature-challenge",
    kind: "project",
    title: "API feature project challenge",
    objective:
      "Outline an API feature with requirements, milestone, acceptance tests, and a risk.",
    prompt:
      "Challenge project: Propose a rate-limited public API endpoint. Include feature goal, one milestone, acceptance criteria, and one security/reliability risk with mitigation.",
    learningObjectType: "PROJECT_TASK",
    skillFacet: "APPLY",
    asPerform: false,
    minChars: 70,
    domainTag: "computer science",
    conceptHints: [
      "api",
      "software",
      "feature",
      "rate limit",
      "project",
      "acceptance",
    ],
    misconceptionTargets: [
      "listing features without acceptance criteria or risk thinking",
    ],
    successLooksLike:
      "Plan names the endpoint goal, a milestone, testable acceptance, and a concrete risk+mitigation.",
    scaffolds: [
      {
        kind: "STEP",
        label: "Outline shape",
        content:
          "1) Goal 2) Milestone 3) Acceptance tests 4) Risk + mitigation — keep each to 1–2 sentences.",
        level: 2,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
    ],
    criteria: [
      {
        id: "goal",
        label: "Feature goal",
        mustIncludeAny: ["api", "endpoint", "rate", "limit", "feature"],
      },
      {
        id: "milestone",
        label: "Milestone",
        mustIncludeAny: ["milestone", "sprint", "phase", "week"],
      },
      {
        id: "acceptance",
        label: "Acceptance",
        mustIncludeAny: ["acceptance", "test", "criteria", "429", "limit"],
      },
      {
        id: "risk",
        label: "Risk",
        mustIncludeAny: ["risk", "abuse", "ddos", "auth", "mitigation", "throttle"],
      },
    ],
  },
];

export function listContentDepthStructuredChallenges(): StructuredChallenge[] {
  return [...CONTENT_DEPTH_STRUCTURED_CHALLENGES];
}

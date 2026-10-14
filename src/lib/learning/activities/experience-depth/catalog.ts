/**
 * 2P-37 — Experience depth companions for thin 2P-36 concepts.
 * Merges into STRUCTURED_CHALLENGES — not a subject engine.
 * Depth = stages + scaffolds + authentic diagnose/decide/justify — not MCQ flood.
 */

import type { StructuredChallenge } from "@/lib/learning/activities/structured/service";

const L1 = {
  level: 1 as const,
  revealPolicy: "ON_REQUEST" as const,
  doesNotRevealAnswer: true as const,
};
const L2 = {
  level: 2 as const,
  revealPolicy: "ON_REQUEST" as const,
  doesNotRevealAnswer: true as const,
};
const L3 = {
  level: 3 as const,
  revealPolicy: "ON_REQUEST" as const,
  doesNotRevealAnswer: true as const,
};

export const EXPERIENCE_DEPTH_CHALLENGES: StructuredChallenge[] = [
  // —— Math: linear solving journey ——
  {
    id: "lab-math-balance-understand",
    kind: "lab",
    title: "Why equations stay true",
    objective:
      "Explain balancing: same operation on both sides keeps equality true.",
    prompt:
      "UNDERSTAND: In your own words, why can you add the same number to both sides of an equation? Give a tiny numeric example (not the final homework answer) and name what would break the equality. No CAS — reasoning only.",
    learningObjectType: "LAB",
    skillFacet: "EXPLAIN",
    asPerform: false,
    domainTag: "mathematics",
    minChars: 45,
    conceptHints: ["equation", "balance", "equality", "both sides", "algebra"],
    misconceptionTargets: [
      "doing an operation to only one side",
      "thinking equations are guesses rather than true statements",
    ],
    successLooksLike:
      "You state both-sides rule, give a small example, and name a one-sided mistake.",
    scaffolds: [
      {
        kind: "STEP",
        label: "Think of a scale",
        content:
          "If both pans of a scale have equal weight, adding the same weight to both pans keeps them equal.",
        ...L1,
      },
      {
        kind: "HINT",
        label: "Name the broken move",
        content:
          "Ask: what happens if you change only the left side?",
        ...L2,
      },
    ],
    criteria: [
      {
        id: "both",
        label: "Both-sides principle",
        mustIncludeAny: ["both sides", "same", "balance", "equal"],
      },
      {
        id: "example",
        label: "Tiny example",
        mustIncludeAny: ["example", "for instance", "e.g", "if"],
      },
      {
        id: "break",
        label: "What breaks equality",
        mustIncludeAny: ["one side", "only", "unequal", "false", "break"],
      },
    ],
  },
  {
    id: "lab-math-solve-challenge",
    kind: "lab",
    title: "Independent linear solve",
    objective:
      "Solve a two-step linear equation with check; minimal scaffolding expected.",
    prompt:
      "CHALLENGE: Solve 5x + 4 = 2x − 8. Show balancing steps in words, state x, and check by substitution. Estimate whether x is negative before finishing. Educational algebra — not a computer algebra system.",
    learningObjectType: "LAB",
    skillFacet: "SOLVE",
    asPerform: false,
    domainTag: "mathematics",
    minChars: 50,
    conceptHints: ["equation", "solve", "linear", "isolate", "algebra"],
    misconceptionTargets: [
      "moving terms without changing signs",
      "combining unlike terms incorrectly",
    ],
    successLooksLike:
      "You gather x terms, isolate x = −4, check substitution, and note negativity.",
    scaffolds: [
      {
        kind: "HINT",
        label: "Gather like terms",
        content:
          "Get all x terms on one side and constants on the other before dividing.",
        ...L3,
      },
    ],
    criteria: [
      {
        id: "value",
        label: "Solution",
        mustIncludeAny: ["x = -4", "x=-4", "−4", "-4"],
      },
      {
        id: "steps",
        label: "Balancing",
        mustIncludeAny: ["subtract", "add", "both sides", "combine", "divide"],
      },
      {
        id: "check",
        label: "Check / estimate",
        mustIncludeAny: ["check", "substitut", "negative", "verify"],
      },
    ],
  },
  {
    id: "write-math-solve-retain",
    kind: "writing",
    title: "Recall the solving process",
    objective:
      "Recall the isolate-and-check process, then solve a fresh one-step equation.",
    prompt:
      "RETAIN: Without looking up notes, list the process (undo operations → isolate → check). Then solve x/3 + 2 = 5 and verify. Educational recall — not timed quiz spam.",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "RETAIN",
    asPerform: false,
    domainTag: "mathematics",
    minChars: 55,
    conceptHints: ["solve", "isolate", "check", "equation", "retain"],
    misconceptionTargets: [
      "skipping the check step after solving",
    ],
    successLooksLike:
      "You name isolate/check process and get x = 9 with verification.",
    scaffolds: [
      {
        kind: "HINT",
        label: "Process first",
        content:
          "Write the process in verbs before plugging in numbers.",
        ...L2,
      },
    ],
    criteria: [
      {
        id: "process",
        label: "Process recalled",
        mustIncludeAny: ["isolate", "undo", "check", "both sides", "substitut"],
      },
      {
        id: "value",
        label: "Solution",
        mustIncludeAny: ["x = 9", "x=9", "9"],
      },
      {
        id: "verify",
        label: "Verification",
        mustIncludeAny: ["check", "verify", "3 + 2", "substitut"],
      },
    ],
  },

  // —— Math probability / geometry depth ——
  {
    id: "lab-math-probability-understand",
    kind: "lab",
    title: "What probability means",
    objective:
      "Explain favorable/total before computing a new probability.",
    prompt:
      "UNDERSTAND: Define probability as favorable outcomes over equally likely total outcomes. Then for a fair six-sided die, state P(rolling an even number) and justify the count. No advanced combinatorics.",
    learningObjectType: "LAB",
    skillFacet: "EXPLAIN",
    asPerform: false,
    domainTag: "mathematics",
    minChars: 40,
    conceptHints: ["probability", "favorable", "total", "equally likely", "die"],
    misconceptionTargets: [
      "treating 'even' as one outcome instead of three faces",
    ],
    successLooksLike:
      "You define favorable/total and report 3/6 or 1/2 for even faces.",
    scaffolds: [
      {
        kind: "STEP",
        label: "List faces",
        content: "Even faces on a die: 2, 4, 6 — count them before dividing.",
        ...L1,
      },
      {
        kind: "HINT",
        label: "Fraction form",
        content: "Probability = (count of matching faces) / 6.",
        ...L2,
      },
    ],
    criteria: [
      {
        id: "def",
        label: "Definition",
        mustIncludeAny: ["favorable", "total", "equally", "out of", "over"],
      },
      {
        id: "prob",
        label: "P(even)",
        mustIncludeAny: ["3/6", "1/2", "0.5", "50%"],
      },
      {
        id: "count",
        label: "Count justification",
        mustIncludeAny: ["2", "4", "6", "three", "3 even"],
      },
    ],
  },
  {
    id: "lab-math-geometry-challenge",
    kind: "lab",
    title: "Find a missing leg",
    objective:
      "Given hypotenuse and one leg, find the other leg with a²+b²=c².",
    prompt:
      "CHALLENGE: Right triangle with hypotenuse 13 and one leg 5. Find the other leg, show the relation, and sanity-check that the missing leg is less than 13.",
    learningObjectType: "LAB",
    skillFacet: "SOLVE",
    asPerform: false,
    domainTag: "mathematics",
    minChars: 40,
    conceptHints: ["pythagorean", "leg", "hypotenuse", "geometry"],
    misconceptionTargets: [
      "using c² − a as if it were c² − a²",
      "getting a leg longer than the hypotenuse",
    ],
    successLooksLike: "You compute √(169−25)=12 and note leg < hypotenuse.",
    scaffolds: [
      {
        kind: "HINT",
        label: "Rearrange",
        content: "If a² + b² = c² and you know a and c, then b² = c² − a².",
        ...L3,
      },
    ],
    criteria: [
      {
        id: "value",
        label: "Missing leg",
        mustIncludeAny: ["12", "b = 12", "leg = 12"],
      },
      {
        id: "formula",
        label: "Relation",
        mustIncludeAny: ["169", "25", "144", "c²", "a²", "pythag"],
      },
      {
        id: "sanity",
        label: "Sanity check",
        mustIncludeAny: ["less", "shorter", "hypotenuse", "13"],
      },
    ],
  },

  // —— Cyber / networking depth ——
  {
    id: "lab-cyber-authz-practice",
    kind: "lab",
    title: "Permission change scenario",
    objective:
      "Practice distinguishing a password issue from a role/permission issue.",
    prompt:
      "PRACTICE: A contractor can log in, open email, but gets 'Access denied' on the finance folder after a project ended. Classify authn vs authz, name the likely control (role/group), and propose a least-privilege fix. Educational security — no real attacks.",
    learningObjectType: "LAB",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "cybersecurity",
    minChars: 50,
    conceptHints: [
      "authorization",
      "authentication",
      "permission",
      "role",
      "least privilege",
    ],
    misconceptionTargets: [
      "resetting the password when login already works",
      "granting admin to 'fix access' permanently",
    ],
    successLooksLike:
      "You call it authorization, cite role/group, and suggest least-privilege grant/revoke — not password reset alone.",
    scaffolds: [
      {
        kind: "STEP",
        label: "Ask two questions",
        content:
          "1) Did identity succeed (login)? 2) Is the resource permitted for this role?",
        ...L1,
      },
      {
        kind: "HINT",
        label: "Least privilege",
        content:
          "Prefer temporary project role over permanent admin.",
        ...L2,
      },
    ],
    criteria: [
      {
        id: "class",
        label: "Classification",
        mustIncludeAny: ["authorization", "authz", "permission"],
      },
      {
        id: "control",
        label: "Control named",
        mustIncludeAny: ["role", "group", "acl", "rbac", "permission"],
      },
      {
        id: "fix",
        label: "Least-privilege fix",
        mustIncludeAny: ["least", "revoke", "grant", "temporary", "project"],
      },
    ],
  },
  {
    id: "lab-net-dns-challenge",
    kind: "lab",
    title: "Mixed DNS/DHCP challenge",
    objective:
      "Diagnose a laptop that has APIPA addressing and cannot resolve names.",
    prompt:
      "CHALLENGE: Laptop shows 169.254.x.x, no default gateway, hostname browse fails, and ping to 8.8.8.8 fails. Rank whether DHCP or DNS is the primary first failure, explain APIPA meaning, and state the first safe educational diagnostic step. No real probing of foreign networks.",
    learningObjectType: "LAB",
    skillFacet: "SOLVE",
    asPerform: false,
    domainTag: "networking",
    minChars: 55,
    conceptHints: ["dhcp", "apipa", "169.254", "dns", "gateway", "lease"],
    misconceptionTargets: [
      "blaming DNS first when the host has no usable IP/gateway",
      "thinking APIPA means successful DHCP",
    ],
    successLooksLike:
      "You prioritize DHCP/addressing (APIPA), explain link-local, and pick renew/lease check before DNS tuning.",
    scaffolds: [
      {
        kind: "HINT",
        label: "APIPA clue",
        content:
          "169.254.x.x usually means the host did not get a DHCP lease.",
        ...L2,
      },
    ],
    criteria: [
      {
        id: "primary",
        label: "Primary failure",
        mustIncludeAny: ["dhcp", "lease", "address", "apipa", "169.254"],
      },
      {
        id: "apipa",
        label: "APIPA meaning",
        mustIncludeAny: ["link-local", "no dhcp", "failed lease", "automatic private"],
      },
      {
        id: "step",
        label: "First diagnostic",
        mustIncludeAny: ["renew", "ipconfig", "lease", "dhcp server", "cable", "wifi"],
      },
    ],
  },

  // —— Nursing depth ——
  {
    id: "sim-nurse-vitals-reassess",
    kind: "simulation",
    title: "Vitals reassessment after intervention",
    objective:
      "Reassess after an educational oxygen/notify action and decide next priority.",
    prompt:
      "CHALLENGE (educational scenario only — not clinical advice): After notifying and applying oxygen per learning simulation, SpO₂ rises 91%→94%, RR 24→20, but BP remains 90/56 and patient is still restless. State what improved, what remains concerning, and one next educational action (reassess perfusion / escalate). Not personalized medical advice.",
    learningObjectType: "SIMULATION",
    skillFacet: "SOLVE",
    asPerform: false,
    domainTag: "nursing",
    minChars: 55,
    conceptHints: [
      "reassess",
      "oxygenation",
      "perfusion",
      "vitals",
      "prioritization",
    ],
    misconceptionTargets: [
      "stopping after one improved number while hypotension persists",
      "documenting only without reassessment language",
    ],
    successLooksLike:
      "You note SpO₂/RR improvement, flag ongoing hypotension/restlessness, and choose reassess/escalate.",
    accessibility: {
      altDescription:
        "Reassess vitals after an educational intervention and choose next priority.",
      reducedComplexity: true,
    },
    scaffolds: [
      {
        kind: "CHECKLIST",
        label: "Reassessment lens",
        content:
          "What improved? What is unchanged/worse? What is the next safe educational action?",
        ...L1,
      },
      {
        kind: "HINT",
        label: "Do not stop at SpO₂ alone",
        content:
          "Blood pressure and mentation/restlessness still speak to perfusion.",
        ...L2,
      },
    ],
    criteria: [
      {
        id: "improved",
        label: "What improved",
        mustIncludeAny: ["spo2", "oxygen", "rr", "respiratory", "94"],
      },
      {
        id: "concern",
        label: "Remaining concern",
        mustIncludeAny: ["bp", "hypotens", "90", "restless", "perfusion"],
      },
      {
        id: "next",
        label: "Next action",
        mustIncludeAny: ["reassess", "escalate", "notify", "perfusion", "monitor"],
      },
    ],
  },

  // —— Business depth ——
  {
    id: "sim-biz-inventory-challenge",
    kind: "simulation",
    title: "Demand surge reorder tradeoff",
    objective:
      "Decide under surge demand with holding-cost vs stockout tradeoff.",
    prompt:
      "CHALLENGE: Forecast jumps from 40→70 units/week, lead time still 2 weeks, on-hand 90, warehouse holding cost is high. Decide reorder size philosophy (cover lead time + buffer vs minimal), name stockout vs holding tradeoff, and state one risk of over-ordering. Educational operations — not ERP.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "business",
    minChars: 55,
    conceptHints: [
      "inventory",
      "demand",
      "lead time",
      "stockout",
      "holding cost",
      "buffer",
    ],
    misconceptionTargets: [
      "ignoring the demand jump when computing cover",
      "ordering infinite stock because stockouts are bad",
    ],
    successLooksLike:
      "You raise cover for 2-week lead at new demand, discuss buffer vs holding cost, and name overstock risk.",
    scaffolds: [
      {
        kind: "HINT",
        label: "Lead-time demand",
        content:
          "Rough need over lead time ≈ new weekly demand × lead weeks (then consider buffer).",
        ...L2,
      },
    ],
    criteria: [
      {
        id: "decision",
        label: "Reorder philosophy",
        mustIncludeAny: ["reorder", "buffer", "cover", "lead", "140", "order"],
      },
      {
        id: "tradeoff",
        label: "Tradeoff",
        mustIncludeAny: ["stockout", "holding", "cost", "risk", "service"],
      },
      {
        id: "over",
        label: "Over-order risk",
        mustIncludeAny: ["overstock", "holding", "waste", "cash", "space", "expire"],
      },
    ],
  },

  // —— Automotive depth ——
  {
    id: "sim-auto-no-start-practice",
    kind: "simulation",
    title: "Strong-crank diagnostic branch",
    objective:
      "Practice symptom→cause branching when cranking is strong.",
    prompt:
      "PRACTICE: Engine cranks strongly, lights stay bright, but it will not start. Rank battery vs fuel vs spark as first focus, name one observation that pushed you away from battery, and state one next educational diagnostic idea (spark/fuel). No live vehicle work required.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "automotive",
    minChars: 45,
    conceptHints: ["cranking", "spark", "fuel", "no-start", "diagnostics"],
    misconceptionTargets: [
      "still replacing the battery first when cranking is strong and lights are bright",
    ],
    successLooksLike:
      "You deprioritize battery, focus spark/fuel, and cite strong crank/bright lights.",
    scaffolds: [
      {
        kind: "STEP",
        label: "Branch rule",
        content:
          "Slow crank + dim lights → electrical first. Strong crank + bright lights → spark/fuel first.",
        ...L1,
      },
      {
        kind: "HINT",
        label: "Next idea",
        content:
          "Name one spark or fuel check without claiming a final repair.",
        ...L2,
      },
    ],
    criteria: [
      {
        id: "focus",
        label: "First focus",
        mustIncludeAny: ["spark", "fuel", "ignition", "injector"],
      },
      {
        id: "why-not-batt",
        label: "Why not battery-first",
        mustIncludeAny: ["strong crank", "bright", "lights", "not battery"],
      },
      {
        id: "next",
        label: "Next diagnostic",
        mustIncludeAny: ["spark", "fuel", "scan", "pressure", "coil", "plug"],
      },
    ],
  },

  // —— Physics / chemistry depth ——
  {
    id: "lab-phys-energy-apply",
    kind: "lab",
    title: "Energy in a falling object",
    objective:
      "Apply PE→KE transfer to a new falling-object context.",
    prompt:
      "APPLY: A book falls from a shelf to the floor (ignore air for the ideal model). Track gravitational potential → kinetic, then explain where energy goes on impact (thermal/sound/deformation). Reject 'energy destroyed'. Educational physics.",
    learningObjectType: "LAB",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "physics",
    minChars: 50,
    conceptHints: ["potential", "kinetic", "impact", "thermal", "energy"],
    misconceptionTargets: [
      "claiming energy disappears at impact",
    ],
    successLooksLike:
      "You track PE→KE→thermal/sound/deformation and deny destruction.",
    scaffolds: [
      {
        kind: "HINT",
        label: "Impact pathway",
        content:
          "When motion stops suddenly, organized kinetic energy spreads into thermal/sound/deformation.",
        ...L2,
      },
    ],
    criteria: [
      {
        id: "forms",
        label: "Forms",
        mustIncludeAny: ["potential", "kinetic"],
      },
      {
        id: "impact",
        label: "Impact",
        mustIncludeAny: ["thermal", "heat", "sound", "deform", "impact"],
      },
      {
        id: "conserved",
        label: "Not destroyed",
        mustIncludeAny: ["not destroy", "conserv", "transform", "convert"],
      },
    ],
  },
  {
    id: "lab-chem-periodic-challenge",
    kind: "lab",
    title: "Trend challenge: K vs Br",
    objective:
      "Apply the same period/group reasoning to a new element pair.",
    prompt:
      "CHALLENGE: Compare K and Br (same period). Which has larger atomic radius? Which is more electronegative? Justify with left↔right trends. Educational chemistry.",
    learningObjectType: "LAB",
    skillFacet: "SOLVE",
    asPerform: false,
    domainTag: "chemistry",
    minChars: 40,
    conceptHints: ["periodic", "radius", "electronegativity", "potassium", "bromine"],
    misconceptionTargets: [
      "reversing the radius trend across a period",
    ],
    successLooksLike:
      "You pick K larger radius, Br more electronegative, citing period trends.",
    scaffolds: [
      {
        kind: "HINT",
        label: "Same period",
        content:
          "Left metals tend to be larger and less electronegative than right nonmetals in a period.",
        ...L3,
      },
    ],
    criteria: [
      {
        id: "radius",
        label: "Larger radius",
        mustIncludeAny: ["k", "potassium", "larger"],
      },
      {
        id: "en",
        label: "More electronegative",
        mustIncludeAny: ["br", "bromine", "electronegativ"],
      },
      {
        id: "trend",
        label: "Trend",
        mustIncludeAny: ["period", "left", "right", "across"],
      },
    ],
  },

  // —— Languages depth (no speaking) ——
  {
    id: "write-lang-cognate-apply",
    kind: "writing",
    title: "Cognate in context",
    objective:
      "Use a Spanish cognate correctly in an English explanation sentence.",
    prompt:
      "APPLY: Explain in English what 'información' means using the cognate pattern, then write one caution about false friends (similar look, different meaning). Reading/writing only — no pronunciation scoring.",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "languages",
    minChars: 45,
    conceptHints: ["cognate", "spanish", "información", "false friend", "vocabulary"],
    misconceptionTargets: [
      "assuming every -ción word maps safely without checking meaning",
    ],
    successLooksLike:
      "You map información→information and warn about false friends.",
    scaffolds: [
      {
        kind: "HINT",
        label: "Pattern",
        content:
          "Many -ción nouns align with English -tion, but verify meaning in context.",
        ...L2,
      },
    ],
    criteria: [
      {
        id: "meaning",
        label: "Meaning",
        mustIncludeAny: ["information", "inform"],
      },
      {
        id: "cognate",
        label: "Cognate awareness",
        mustIncludeAny: ["cognate", "similar", "related", "-tion", "-ción"],
      },
      {
        id: "caution",
        label: "False friend caution",
        mustIncludeAny: ["false friend", "different meaning", "not always", "caution", "careful"],
      },
    ],
  },
];

export function listExperienceDepthStructuredChallenges(): StructuredChallenge[] {
  return EXPERIENCE_DEPTH_CHALLENGES;
}

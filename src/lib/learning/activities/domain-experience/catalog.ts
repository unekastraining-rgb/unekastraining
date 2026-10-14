/**
 * 2P-36 — Universal domain experience pack.
 * Merges into STRUCTURED_CHALLENGES — not a subject engine or second CMS.
 * Depth over count; deterministic rubric evaluation; educational scenarios only.
 */

import type { StructuredChallenge } from "@/lib/learning/activities/structured/service";

export const DOMAIN_EXPERIENCE_CHALLENGES: StructuredChallenge[] = [
  // —— Mathematics (no CAS claim) ——
  {
    id: "lab-math-solve-linear",
    kind: "lab",
    title: "Solve a linear equation",
    objective:
      "Solve a one-variable linear equation and show the balancing steps in words.",
    prompt:
      "Solve for x: 3x − 7 = 11. State the value of x, describe each balancing step (what you add/subtract/divide), and check by substitution. Educational algebra practice — not a computer algebra system.",
    learningObjectType: "LAB",
    skillFacet: "SOLVE",
    asPerform: false,
    domainTag: "mathematics",
    minChars: 40,
    conceptHints: ["equation", "solve", "linear", "algebra", "variable"],
    misconceptionTargets: [
      "adding 7 to only one side",
      "dividing before isolating the variable term",
    ],
    successLooksLike:
      "You isolate x (x = 6), name balancing operations, and verify 3(6)−7 = 11.",
    scaffolds: [
      {
        kind: "HINT",
        label: "Balance both sides",
        content:
          "Whatever you do to one side must happen to the other — undo −7 first, then undo ×3.",
        level: 1,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
    ],
    criteria: [
      {
        id: "value",
        label: "Solution value",
        mustIncludeAny: ["x = 6", "x=6", "6"],
      },
      {
        id: "steps",
        label: "Balancing steps",
        mustIncludeAny: ["add", "subtract", "divide", "both sides", "isolate"],
      },
      {
        id: "check",
        label: "Substitution check",
        mustIncludeAny: ["check", "substitut", "verify", "3(6)", "18 − 7", "18-7"],
      },
    ],
  },
  {
    id: "lab-math-equation-error",
    kind: "lab",
    title: "Diagnose an equation error",
    objective:
      "Find the mistake in a student solution and correct the algebra.",
    prompt:
      "A student solves 2(x + 3) = 10 as: 2x + 3 = 10 → 2x = 7 → x = 3.5. Identify the error (distribution/sign), state the correct steps, and give the correct x. Focus on operation-order / distribution misconceptions.",
    learningObjectType: "LAB",
    skillFacet: "EXPLAIN",
    asPerform: false,
    domainTag: "mathematics",
    minChars: 45,
    conceptHints: ["distribute", "equation", "error", "algebra", "parentheses"],
    misconceptionTargets: [
      "forgetting to distribute to every term inside parentheses",
      "treating 2(x+3) as 2x+3",
    ],
    successLooksLike:
      "You catch the missed distribution (should be 2x+6), correct to x = 2, and name the misconception.",
    scaffolds: [
      {
        kind: "HINT",
        label: "Distribute carefully",
        content: "2(x + 3) means 2·x and 2·3 — both terms inside the parentheses.",
        level: 1,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
    ],
    criteria: [
      {
        id: "error",
        label: "Error named",
        mustIncludeAny: ["distribut", "2x + 6", "2x+6", "forgot", "parentheses"],
      },
      {
        id: "correct",
        label: "Correct solution",
        mustIncludeAny: ["x = 2", "x=2"],
      },
      {
        id: "why",
        label: "Why it was wrong",
        mustIncludeAny: ["both", "each term", "multiply", "3 became", "missed"],
      },
    ],
  },
  {
    id: "sim-math-probability",
    kind: "simulation",
    title: "Simple probability reasoning",
    objective:
      "Compute a basic probability and interpret what it means.",
    prompt:
      "A bag has 3 red and 7 blue marbles (10 total). You draw one at random. State P(red), explain the fraction, and say whether drawing red is more or less likely than blue. No advanced combinatorics required.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "mathematics",
    minChars: 35,
    conceptHints: ["probability", "fraction", "chance", "random", "statistics"],
    misconceptionTargets: [
      "confusing number of red with probability without a denominator",
      "assuming all colors are equally likely regardless of counts",
    ],
    successLooksLike:
      "You report 3/10 (or 0.3), explain favorable/total, and note blue is more likely.",
    scaffolds: [
      {
        kind: "STEP",
        label: "Name the parts",
        content:
          "Write favorable count and total count before simplifying the fraction.",
        level: 1,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
      {
        kind: "HINT",
        label: "Compare colors",
        content:
          "Whichever color has more marbles is more likely on a fair draw.",
        level: 2,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
    ],
    criteria: [
      {
        id: "prob",
        label: "P(red)",
        mustIncludeAny: ["3/10", "0.3", "30%"],
      },
      {
        id: "fraction",
        label: "Favorable over total",
        mustIncludeAny: ["3", "10", "favorable", "total", "out of"],
      },
      {
        id: "compare",
        label: "Compare to blue",
        mustIncludeAny: ["blue", "less", "more likely", "7/10"],
      },
    ],
  },
  {
    id: "lab-math-geometry-pythagoras",
    kind: "lab",
    title: "Right-triangle length reasoning",
    objective:
      "Use the Pythagorean relationship to find a missing side and justify.",
    prompt:
      "A right triangle has legs 6 and 8. Find the hypotenuse, show a² + b² = c² with numbers, and state units as length. Educational geometry — not CAD.",
    learningObjectType: "LAB",
    skillFacet: "SOLVE",
    asPerform: false,
    domainTag: "mathematics",
    minChars: 35,
    conceptHints: ["pythagorean", "triangle", "hypotenuse", "geometry", "right angle"],
    misconceptionTargets: [
      "adding legs instead of summing squares",
      "using the hypotenuse as a leg in a²+b²",
    ],
    successLooksLike: "You compute √(36+64)=10 and cite a²+b²=c².",
    scaffolds: [
      {
        kind: "STEP",
        label: "Square then add",
        content: "Compute each leg squared, add, then take the square root for c.",
        level: 1,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
      {
        kind: "HINT",
        label: "Sanity",
        content: "The hypotenuse must be longer than either leg.",
        level: 2,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
    ],
    criteria: [
      {
        id: "value",
        label: "Hypotenuse",
        mustIncludeAny: ["10", "c = 10", "c=10"],
      },
      {
        id: "formula",
        label: "Pythagorean relation",
        mustIncludeAny: ["a²", "a^2", "36", "64", "100", "pythag"],
      },
      {
        id: "right",
        label: "Right-triangle context",
        mustIncludeAny: ["right", "leg", "hypotenuse", "triangle"],
      },
    ],
  },
  {
    id: "write-math-word-problem",
    kind: "writing",
    title: "Translate a word problem",
    objective:
      "Translate a word problem into an equation and solve with explanation.",
    prompt:
      "A ticket costs $12. After a $5 discount coupon, three friends pay the same total. Write an equation for one person's price after the coupon, solve for that price, and explain each modeling choice in plain language.",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "mathematics",
    minChars: 50,
    conceptHints: ["word problem", "equation", "modeling", "algebra", "discount"],
    misconceptionTargets: [
      "applying the discount after multiplying by three incorrectly",
      "confusing total group cost with per-person cost",
    ],
    successLooksLike:
      "You model per-person as 12−5 = 7 (or equivalent), explain discount then person cost, and avoid inventing CAS steps.",
    criteria: [
      {
        id: "model",
        label: "Equation / model",
        mustIncludeAny: ["12", "5", "7", "discount", "equation", "−", "-"],
      },
      {
        id: "answer",
        label: "Per-person price",
        mustIncludeAny: ["7", "$7"],
      },
      {
        id: "explain",
        label: "Modeling explanation",
        mustIncludeAny: ["because", "subtract", "coupon", "each", "person"],
      },
    ],
  },

  // —— Science ——
  {
    id: "lab-phys-energy-transfer",
    kind: "lab",
    title: "Energy transfer reasoning",
    objective:
      "Trace energy forms in a simple mechanical scenario.",
    prompt:
      "A skateboarder rolls down a hill then across a flat rough path and stops. Name the main energy forms (gravitational potential, kinetic, thermal), describe the transfers, and explain why the board eventually stops (friction → thermal). Educational physics — idealized.",
    learningObjectType: "LAB",
    skillFacet: "EXPLAIN",
    asPerform: false,
    domainTag: "physics",
    minChars: 55,
    conceptHints: ["energy", "kinetic", "potential", "friction", "thermal", "physics"],
    misconceptionTargets: [
      "claiming energy is destroyed when the board stops",
      "ignoring friction as an energy pathway",
    ],
    successLooksLike:
      "You track PE→KE→thermal via friction and reject 'energy disappears'.",
    criteria: [
      {
        id: "forms",
        label: "Energy forms",
        mustIncludeAny: ["potential", "kinetic", "thermal", "heat"],
      },
      {
        id: "transfer",
        label: "Transfer path",
        mustIncludeAny: ["friction", "convert", "transfer", "down"],
      },
      {
        id: "conserved",
        label: "Not destroyed",
        mustIncludeAny: ["not destroy", "conserv", "thermal", "dissipat", "heat"],
      },
    ],
  },
  {
    id: "lab-chem-periodic-trend",
    kind: "lab",
    title: "Periodic trend reasoning",
    objective:
      "Use periodic trends to compare atomic radius or electronegativity qualitatively.",
    prompt:
      "Compare Na and Cl: which has the larger atomic radius, and which is more electronegative? Justify using period trends (same period, left vs right). Educational chemistry — no lab equipment.",
    learningObjectType: "LAB",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "chemistry",
    minChars: 40,
    conceptHints: [
      "periodic",
      "atomic radius",
      "electronegativity",
      "sodium",
      "chlorine",
    ],
    misconceptionTargets: [
      "assuming more protons always means larger radius in a period",
      "confusing ion size with neutral atomic radius without context",
    ],
    successLooksLike:
      "You say Na has larger radius, Cl is more electronegative, citing left→right trends.",
    criteria: [
      {
        id: "radius",
        label: "Larger radius",
        mustIncludeAny: ["na", "sodium", "larger radius", "bigger atom"],
      },
      {
        id: "en",
        label: "More electronegative",
        mustIncludeAny: ["cl", "chlorine", "electronegativ"],
      },
      {
        id: "trend",
        label: "Trend justification",
        mustIncludeAny: ["period", "left", "right", "across", "nuclear"],
      },
    ],
  },
  {
    id: "write-bio-genetics-basics",
    kind: "writing",
    title: "Genetics foundation explanation",
    objective:
      "Explain genotype vs phenotype with a simple inherited trait example.",
    prompt:
      "In your own words, distinguish genotype from phenotype. Give one example trait (e.g., seed color or blood type educational example) and state how alleles relate. Educational biology — not medical advice.",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "EXPLAIN",
    asPerform: false,
    domainTag: "biology",
    minChars: 55,
    conceptHints: ["genotype", "phenotype", "allele", "gene", "genetics", "trait"],
    misconceptionTargets: [
      "treating genotype and phenotype as synonyms",
      "claiming one gene always equals one disease in this intro context",
    ],
    successLooksLike:
      "You define genetic makeup vs observable trait and give a coherent allele example.",
    criteria: [
      {
        id: "geno",
        label: "Genotype",
        mustIncludeAny: ["genotype", "genetic", "allele", "dna", "genes"],
      },
      {
        id: "pheno",
        label: "Phenotype",
        mustIncludeAny: ["phenotype", "observable", "expressed", "appearance", "trait"],
      },
      {
        id: "example",
        label: "Example",
        mustIncludeAny: ["example", "for instance", "such as", "e.g"],
      },
    ],
  },
  {
    id: "sim-bio-homeostasis",
    kind: "simulation",
    title: "Homeostasis scenario",
    objective:
      "Reason about a negative-feedback response to a body-temperature change (educational).",
    prompt:
      "Simulation (text): body temperature rises after exercise. Describe a negative-feedback response (sensors → control → effectors such as sweating), and state the goal of returning toward a set point. Educational physiology — not clinical advice.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "biology",
    minChars: 50,
    conceptHints: [
      "homeostasis",
      "feedback",
      "temperature",
      "physiology",
      "set point",
    ],
    misconceptionTargets: [
      "describing positive feedback as the normal temperature regulator here",
      "claiming the body has no set-point concept in this intro framing",
    ],
    successLooksLike:
      "You describe sweating/vasodilation-style cooling as negative feedback toward a set point.",
    criteria: [
      {
        id: "feedback",
        label: "Negative feedback",
        mustIncludeAny: ["negative", "feedback", "oppose", "counteract"],
      },
      {
        id: "response",
        label: "Cooling response",
        mustIncludeAny: ["sweat", "vasodil", "cool", "heat loss"],
      },
      {
        id: "setpoint",
        label: "Set point",
        mustIncludeAny: ["set point", "setpoint", "normal", "baseline", "return"],
      },
    ],
  },

  // —— Cyber / networking deepen ——
  {
    id: "lab-cyber-authn-vs-authz",
    kind: "lab",
    title: "Authentication vs authorization",
    objective:
      "Distinguish authentication from authorization with a concrete access scenario.",
    prompt:
      "A user logs in successfully but cannot open the payroll report. Explain whether this is primarily an authentication or authorization failure, define both terms, and propose one safe fix (role/permission). Educational security — no real attacks.",
    learningObjectType: "LAB",
    skillFacet: "EXPLAIN",
    asPerform: false,
    domainTag: "cybersecurity",
    minChars: 50,
    conceptHints: [
      "authentication",
      "authorization",
      "rbac",
      "permission",
      "login",
      "access control",
    ],
    misconceptionTargets: [
      "conflating login success with permission to every resource",
      "calling every access problem an authentication failure",
    ],
    successLooksLike:
      "You label it authorization, define authn vs authz, and suggest a role/permission grant — not password reset alone.",
    scaffolds: [
      {
        kind: "STEP",
        label: "Two questions",
        content:
          "Did login succeed? If yes, identity worked — look at permissions next.",
        level: 1,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
      {
        kind: "HINT",
        label: "Payroll clue",
        content:
          "Opening payroll is a resource permission, not proof of a bad password.",
        level: 2,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
      {
        kind: "HINT",
        label: "Fix shape",
        content:
          "Prefer granting a role/permission over resetting credentials that already work.",
        level: 3,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
    ],
    criteria: [
      {
        id: "which",
        label: "Correct classification",
        mustIncludeAny: ["authorization", "authz", "permission"],
      },
      {
        id: "defs",
        label: "Both defined",
        mustIncludeAny: ["authentication", "identity", "login", "who you are"],
      },
      {
        id: "fix",
        label: "Safe fix",
        mustIncludeAny: ["role", "permission", "grant", "rbac", "acl", "group"],
      },
    ],
  },
  {
    id: "lab-net-dns-vs-dhcp",
    kind: "lab",
    title: "DNS vs DHCP diagnosis",
    objective:
      "Separate name resolution from address assignment in a connectivity story.",
    prompt:
      "A laptop has IP 192.168.1.50/24 and gateway 192.168.1.1, but browsing by hostname fails while pinging 8.8.8.8 works. Is the primary issue more likely DNS or DHCP? Justify with what each protocol does. Educational networking — no real probing of foreign networks.",
    learningObjectType: "LAB",
    skillFacet: "SOLVE",
    asPerform: false,
    domainTag: "networking",
    minChars: 45,
    conceptHints: ["dns", "dhcp", "hostname", "ip", "resolver", "name resolution"],
    misconceptionTargets: [
      "blaming DHCP when an IP/gateway already exists and IP ping works",
      "treating DNS as the protocol that assigns IP addresses",
    ],
    successLooksLike:
      "You pick DNS, note DHCP already provided addressing, and contrast name→IP vs lease assignment.",
    criteria: [
      {
        id: "pick",
        label: "Primary issue",
        mustIncludeAny: ["dns", "name resolution", "resolver"],
      },
      {
        id: "dhcp",
        label: "DHCP role",
        mustIncludeAny: ["dhcp", "lease", "assign", "ip address"],
      },
      {
        id: "why",
        label: "Why not DHCP-first",
        mustIncludeAny: ["already has", "ping", "ip works", "gateway", "8.8.8.8"],
      },
    ],
  },

  // —— Nursing (educational only) ——
  {
    id: "sim-nurse-vitals-interpret",
    kind: "simulation",
    title: "Vital signs interpretation scenario",
    objective:
      "Interpret a vital-sign pattern and choose a safe next educational action.",
    prompt:
      "Educational scenario only — not clinical advice or diagnosis. Adult patient: HR 118, BP 92/58, RR 24, SpO₂ 91% on room air, new restlessness. Rank the most urgent concern category (oxygenation/perfusion) and state one immediate assessment/notify action you would take in a learning simulation.",
    learningObjectType: "SIMULATION",
    skillFacet: "SOLVE",
    asPerform: false,
    domainTag: "nursing",
    minChars: 50,
    conceptHints: [
      "vitals",
      "oxygenation",
      "perfusion",
      "prioritization",
      "assessment",
      "nursing",
    ],
    misconceptionTargets: [
      "documenting first while ignoring airway/breathing/circulation urgency",
      "treating tachycardia alone as the only finding",
    ],
    successLooksLike:
      "You prioritize oxygenation/perfusion, mention SpO₂/RR/BP together, and escalate/assess — with educational disclaimer awareness.",
    accessibility: {
      altDescription:
        "Interpret abnormal vitals and choose a safe next educational nursing action.",
      reducedComplexity: true,
    },
    criteria: [
      {
        id: "priority",
        label: "Urgent category",
        mustIncludeAny: [
          "oxygen",
          "spo2",
          "perfusion",
          "airway",
          "breathing",
          "circulation",
          "hypotens",
        ],
      },
      {
        id: "action",
        label: "Next action",
        mustIncludeAny: [
          "assess",
          "notify",
          "escalate",
          "oxygen",
          "rapid response",
          "call",
        ],
      },
    ],
  },

  // —— Business ——
  {
    id: "sim-biz-inventory-reorder",
    kind: "simulation",
    title: "Inventory reorder decision",
    objective:
      "Choose a reorder action using demand, lead time, and stockout risk.",
    prompt:
      "Simulation: weekly demand ≈ 40 units, lead time 2 weeks, on-hand 55, reorder point historically 80. Decide whether to reorder now, compute a simple weeks-of-cover estimate, and explain stockout vs holding-cost tradeoff. Educational operations — not ERP.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "business",
    minChars: 45,
    conceptHints: [
      "inventory",
      "reorder",
      "lead time",
      "stockout",
      "operations",
      "supply",
    ],
    misconceptionTargets: [
      "ignoring lead time when on-hand looks 'enough' for one week",
      "equating revenue with inventory policy quality",
    ],
    successLooksLike:
      "You reorder (below ROP), mention ~1.3 weeks cover, and discuss stockout risk vs holding cost.",
    criteria: [
      {
        id: "decision",
        label: "Reorder decision",
        mustIncludeAny: ["reorder", "order now", "place an order", "below"],
      },
      {
        id: "cover",
        label: "Cover / lead time",
        mustIncludeAny: ["lead", "week", "55", "40", "cover", "demand"],
      },
      {
        id: "tradeoff",
        label: "Tradeoff",
        mustIncludeAny: ["stockout", "holding", "cost", "risk", "service"],
      },
    ],
  },

  // —— Trades ——
  {
    id: "lab-elec-gfci-safety",
    kind: "lab",
    title: "GFCI / electrical safety sequence",
    objective:
      "Order a safe response to a suspected ground-fault situation (educational).",
    prompt:
      "Educational electrical safety: a portable tool trips a GFCI repeatedly in a damp area. List a safe sequence (stop use → unplug → do not bypass GFCI → inspect cord/environment → qualified repair). Emphasize why bypassing protection is unsafe.",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "electrical",
    minChars: 45,
    conceptHints: ["gfci", "ground fault", "safety", "electrical", "lockout"],
    misconceptionTargets: [
      "bypassing or taping over a GFCI to 'get the job done'",
      "continuing to use equipment that repeatedly trips protection",
    ],
    successLooksLike:
      "You stop/unplug, refuse bypass, and escalate to inspection/qualified repair.",
    criteria: [
      {
        id: "stop",
        label: "Stop / unplug",
        mustIncludeAny: ["stop", "unplug", "do not use", "remove power"],
      },
      {
        id: "nobypass",
        label: "No bypass",
        mustIncludeAny: ["bypass", "defeat", "tape", "jumper", "unsafe"],
      },
      {
        id: "next",
        label: "Inspect / qualified help",
        mustIncludeAny: ["inspect", "qualified", "electrician", "repair", "replace"],
      },
    ],
  },
  {
    id: "sim-auto-no-start-intro",
    kind: "simulation",
    title: "No-start diagnostic intro",
    objective:
      "Branch a basic no-start symptom into battery vs fuel vs spark hypotheses.",
    prompt:
      "Simulation intro: vehicle cranks slowly and headlights dim when starting. Rank the most likely first system to test (battery/charging), name one measurement idea (voltage), and state what would push you toward fuel/spark instead. Educational automotive — no live vehicle work required.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "automotive",
    minChars: 40,
    conceptHints: [
      "battery",
      "cranking",
      "no-start",
      "diagnostics",
      "voltage",
      "automotive",
    ],
    misconceptionTargets: [
      "replacing the starter first when dim lights suggest low system voltage",
      "skipping basic battery voltage before complex modules",
    ],
    successLooksLike:
      "You prioritize battery/charging, mention voltage test, and contrast with fuel/spark when cranking is strong.",
    criteria: [
      {
        id: "first",
        label: "First system",
        mustIncludeAny: ["battery", "charging", "voltage", "electrical"],
      },
      {
        id: "test",
        label: "Measurement idea",
        mustIncludeAny: ["volt", "load test", "multimeter", "measure"],
      },
      {
        id: "branch",
        label: "Alternate branch",
        mustIncludeAny: ["fuel", "spark", "ignition", "strong crank"],
      },
    ],
  },

  // —— Languages foundation (no speaking engine) ——
  {
    id: "game-lang-es-cognates",
    kind: "game",
    title: "Spanish cognate match",
    objective:
      "Match high-frequency Spanish↔English cognates and explain one pattern.",
    prompt:
      "Game (text): Match: información, universidad, familia → information, university, family. Then explain what a cognate is in one sentence. Language foundation — reading/writing only (no speaking runtime).",
    learningObjectType: "GAME",
    skillFacet: "RECOGNIZE",
    asPerform: false,
    domainTag: "languages",
    minChars: 30,
    conceptHints: ["spanish", "cognate", "vocabulary", "language", "english"],
    misconceptionTargets: [
      "assuming every similar-looking word is a true cognate (false friends)",
    ],
    successLooksLike:
      "You pair the three cognates correctly and define cognates as shared-origin lookalikes.",
    criteria: [
      {
        id: "pairs",
        label: "Matches",
        mustIncludeAny: ["información", "universidad", "familia", "information", "university", "family"],
      },
      {
        id: "def",
        label: "Cognate definition",
        mustIncludeAny: ["cognate", "similar", "same origin", "related", "look alike"],
      },
    ],
  },
  {
    id: "write-lang-grammar-agreement",
    kind: "writing",
    title: "Subject–verb agreement fix",
    objective:
      "Correct a subject–verb agreement error and explain the rule briefly.",
    prompt:
      "Sentence: \"The list of required readings are on the portal.\" Rewrite correctly and explain why the verb agrees with list (not readings). English language foundation.",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "languages",
    minChars: 35,
    conceptHints: ["grammar", "agreement", "subject", "verb", "english"],
    misconceptionTargets: [
      "agreeing the verb with the nearest plural noun in a prepositional phrase",
    ],
    successLooksLike:
      "You write \"The list … is …\" and cite the head noun list as singular subject.",
    criteria: [
      {
        id: "fix",
        label: "Corrected sentence",
        mustIncludeAny: ["list of required readings is", "list is"],
      },
      {
        id: "rule",
        label: "Rule explanation",
        mustIncludeAny: ["subject", "singular", "list", "not readings", "head noun"],
      },
    ],
  },
];

export function listDomainExperienceStructuredChallenges(): StructuredChallenge[] {
  return DOMAIN_EXPERIENCE_CHALLENGES;
}

/**
 * Content expansion queue — humanities & general-education structured challenges.
 * Staging catalog only; not a subject engine.
 */

import type { StructuredChallenge } from "@/lib/learning/activities/structured/service";
import { hint, step, checklist } from "./helpers";

export const CONTENT_EXPANSION_HUMANITIES_CHALLENGES: StructuredChallenge[] = [
  // —— Nursing (educational — not clinical advice) ——
  {
    id: "sim-vital-signs-trend-escalation",
    kind: "simulation",
    title: "Vital signs trend review",
    objective:
      "Interpret a vital-sign trend and choose an educational escalation step.",
    prompt:
      "Educational simulation (not clinical advice): BP 118/72 → 128/80 → 142/92 over three hours; patient reports new headache. Name the concerning trend, one hypothesis about status change (not a diagnosis), and who/what you notify next in a learning-hospital protocol.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "nursing",
    minChars: 48,
    conceptHints: [
      "vital signs",
      "blood pressure",
      "trend",
      "escalation",
      "nursing",
    ],
    misconceptionTargets: [
      "treating a single reading as equal to a multi-hour trend",
      "documenting the headache without reporting the rising BP pattern",
    ],
    successLooksLike:
      "You name the rising BP trend, link the headache, and escalate to the appropriate nurse/provider channel.",
    accessibility: {
      altDescription:
        "Read a rising blood-pressure trend with a new headache and choose escalation.",
      extendedTimeSuggested: true,
    },
    scaffolds: [
      hint(
        "Compare the series",
        "Look at direction across all three readings, not only the last number.",
      ),
      step(
        "Link symptom to trend",
        "State how the new headache relates to the BP pattern before you escalate.",
      ),
      checklist(
        "Escalation check",
        "Trend named · symptom linked · notify person/role named · educational disclaimer kept in mind",
      ),
    ],
    criteria: [
      {
        id: "trend",
        label: "Rising BP / concern",
        mustIncludeAny: [
          "rising",
          "increasing",
          "upward",
          "142",
          "elevated",
          "hypertension",
        ],
      },
      {
        id: "symptom",
        label: "Linked symptom",
        mustIncludeAny: ["headache", "symptom", "patient report"],
      },
      {
        id: "escalate",
        label: "Escalate",
        mustIncludeAny: [
          "notify",
          "nurse",
          "provider",
          "escalate",
          "report",
          "charge",
        ],
      },
    ],
  },
  {
    id: "lab-infection-control-ppe",
    kind: "lab",
    title: "Infection control PPE sequence",
    objective:
      "Select and order PPE steps for a contact-precaution educational scenario.",
    prompt:
      "Procedural lab (educational only): You will enter a contact-precaution room for a brief assessment. List PPE you don before entry, the doffing order idea (dirty to clean), and one hand-hygiene moment. Not clinical advice for a real facility.",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "nursing",
    minChars: 50,
    conceptHints: [
      "infection control",
      "ppe",
      "contact precautions",
      "hand hygiene",
      "nursing",
    ],
    misconceptionTargets: [
      "removing gloves after touching the face or clean surfaces",
      "skipping hand hygiene because gloves were worn",
    ],
    successLooksLike:
      "You name gown/gloves (as required), a safe doffing idea, and hand hygiene before/after PPE.",
    scaffolds: [
      hint(
        "Contact basics",
        "Contact precautions usually emphasize gown and gloves plus hand hygiene — confirm against the room sign in real settings.",
      ),
      step(
        "Doffing logic",
        "Think most contaminated first; avoid touching your face with used gloves.",
      ),
      checklist(
        "PPE lab checklist",
        "Don items named · doffing order reasoned · hand hygiene moment stated",
      ),
    ],
    criteria: [
      {
        id: "ppe",
        label: "PPE items",
        mustIncludeAny: ["gown", "gloves", "ppe"],
      },
      {
        id: "doff",
        label: "Doffing / order",
        mustIncludeAny: ["doff", "remove", "order", "gloves first", "dirty"],
      },
      {
        id: "hygiene",
        label: "Hand hygiene",
        mustIncludeAny: [
          "hand hygiene",
          "wash",
          "sanitize",
          "alcohol",
          "soap",
        ],
      },
    ],
  },
  {
    id: "write-patient-teach-back",
    kind: "writing",
    title: "Patient teach-back education",
    objective:
      "Draft a teach-back exchange that checks understanding without shaming.",
    prompt:
      "Writing (educational): A patient is starting a once-daily oral medication. Write what you teach in plain language, the teach-back question you ask, and how you respond if they miss a key point. Educational communication practice — not medical advice.",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "EXPLAIN",
    asPerform: false,
    domainTag: "nursing",
    minChars: 52,
    conceptHints: [
      "teach-back",
      "patient education",
      "health literacy",
      "nursing",
      "communication",
    ],
    misconceptionTargets: [
      "asking 'do you understand?' instead of inviting demonstration",
      "using jargon that the patient cannot restate",
    ],
    successLooksLike:
      "Plain teaching, an open teach-back prompt, and a respectful reteach if a point is missed.",
    scaffolds: [
      hint(
        "Teach-back shape",
        "Ask them to show or say it back in their own words — not yes/no.",
      ),
      step(
        "If they miss a point",
        "Retell the missed piece simply, then invite another teach-back.",
      ),
      checklist(
        "Teach-back checklist",
        "Plain teaching · teach-back question · respectful reteach plan",
      ),
    ],
    criteria: [
      {
        id: "teach",
        label: "Plain teaching",
        mustIncludeAny: [
          "once daily",
          "medication",
          "plain",
          "take",
          "dose",
        ],
      },
      {
        id: "teachback",
        label: "Teach-back prompt",
        mustIncludeAny: [
          "teach-back",
          "show me",
          "tell me",
          "own words",
          "demonstrate",
        ],
      },
      {
        id: "reteach",
        label: "If missed",
        mustIncludeAny: ["reteach", "again", "clarify", "missed", "repeat"],
      },
    ],
  },
  {
    id: "sim-sbarr-handoff",
    kind: "simulation",
    title: "SBAR handoff communication",
    objective:
      "Apply SBAR structure to an educational nurse-to-provider handoff.",
    prompt:
      "Simulation (educational): Post-op patient reports increasing wound pain 8/10; dressing saturated; HR 110. Draft an SBAR handoff: Situation, Background, Assessment, Recommendation. Not clinical advice.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "nursing",
    minChars: 55,
    conceptHints: [
      "sbar",
      "handoff",
      "communication",
      "nursing",
      "escalation",
    ],
    misconceptionTargets: [
      "burying the urgent finding after a long background story",
      "omitting a clear recommendation or ask",
    ],
    successLooksLike:
      "Concise S-B-A-R with current concern, relevant history, assessment cues, and a clear ask.",
    scaffolds: [
      hint(
        "Lead with Situation",
        "Open with who/what/now before the full history.",
      ),
      step(
        "Close with Recommendation",
        "End with what you need: evaluate wound, pain plan, bedside review, etc.",
      ),
      checklist(
        "SBAR checklist",
        "Situation · Background · Assessment · Recommendation each present",
      ),
    ],
    criteria: [
      {
        id: "situation",
        label: "Situation",
        mustIncludeAny: ["situation", "pain", "wound", "saturating", "hr"],
      },
      {
        id: "background",
        label: "Background",
        mustIncludeAny: ["background", "post-op", "surgery", "history"],
      },
      {
        id: "recommend",
        label: "Recommendation",
        mustIncludeAny: [
          "recommend",
          "request",
          "assess",
          "evaluate",
          "please",
        ],
      },
    ],
  },

  // —— Business ——
  {
    id: "sim-porter-forces-lite",
    kind: "simulation",
    title: "Porter five forces lite",
    objective:
      "Apply a simplified five-forces lens to a local competitive scenario.",
    prompt:
      "Simulation: A new meal-kit delivery service enters your mid-size city. Name two forces that intensify (e.g., rivalry, buyer power, substitutes), one force that may stay moderate, and one strategic implication for an incumbent grocery.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "business",
    minChars: 50,
    conceptHints: [
      "porter",
      "five forces",
      "competition",
      "strategy",
      "business",
    ],
    misconceptionTargets: [
      "treating all five forces as equally intense in every industry",
      "confusing internal SWOT strengths with industry structure forces",
    ],
    successLooksLike:
      "You map entry effects to specific forces and state one coherent incumbent response.",
    scaffolds: [
      hint(
        "Force list",
        "Rivalry, new entrants, substitutes, buyer power, supplier power.",
      ),
      step(
        "Implication",
        "Tie your implication to price, convenience, or differentiation — not a slogan.",
      ),
      checklist(
        "Forces checklist",
        "Two intensified · one moderate · one implication",
      ),
    ],
    criteria: [
      {
        id: "forces",
        label: "Named forces",
        mustIncludeAny: [
          "rivalry",
          "entrant",
          "substitute",
          "buyer",
          "supplier",
        ],
      },
      {
        id: "intensity",
        label: "Intensity change",
        mustIncludeAny: [
          "intensify",
          "increase",
          "stronger",
          "moderate",
          "pressure",
        ],
      },
      {
        id: "implication",
        label: "Strategic implication",
        mustIncludeAny: [
          "price",
          "differentiate",
          "loyalty",
          "delivery",
          "incumbent",
          "compete",
        ],
      },
    ],
  },
  {
    id: "lab-inventory-eoq-intuition",
    kind: "lab",
    title: "EOQ reorder intuition",
    objective:
      "Reason about order quantity tradeoffs without memorizing formulas.",
    prompt:
      "Lab: Annual demand is steady; ordering cost is high; holding cost is low. Do you lean toward fewer large orders or many small ones? Explain the EOQ intuition (ordering vs holding cost tradeoff) and one risk of ordering too large.",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "business",
    minChars: 48,
    conceptHints: [
      "eoq",
      "inventory",
      "reorder",
      "holding cost",
      "ordering cost",
      "business",
    ],
    misconceptionTargets: [
      "always ordering the smallest quantity to 'save money'",
      "ignoring holding cost when order size grows",
    ],
    successLooksLike:
      "You favor larger, fewer orders when ordering cost dominates, and name a holding/obsolescence risk.",
    scaffolds: [
      hint(
        "Tradeoff",
        "EOQ balances cost per order against cost of carrying stock.",
      ),
      step(
        "Direction check",
        "High order cost + low hold cost → larger batches tend to win.",
      ),
      checklist(
        "EOQ checklist",
        "Direction chosen · tradeoff named · oversized-order risk named",
      ),
    ],
    criteria: [
      {
        id: "direction",
        label: "Order size direction",
        mustIncludeAny: [
          "fewer",
          "larger",
          "big orders",
          "less frequent",
          "batch",
        ],
      },
      {
        id: "tradeoff",
        label: "Ordering vs holding",
        mustIncludeAny: [
          "ordering cost",
          "holding cost",
          "tradeoff",
          "carry",
          "eoq",
        ],
      },
      {
        id: "risk",
        label: "Risk of too large",
        mustIncludeAny: [
          "spoil",
          "obsolete",
          "space",
          "cash",
          "holding",
          "waste",
        ],
      },
    ],
  },
  {
    id: "write-business-ethics-dilemma",
    kind: "writing",
    title: "Business ethics dilemma",
    objective:
      "Explain stakeholder impacts and a principled choice in a sales dilemma.",
    prompt:
      "Writing: Your team can hit quarterly numbers by bundling an unnecessary add-on that most customers will not notice. Identify two stakeholders harmed or benefited, state your decision, and justify it with one ethics principle (honesty, fairness, or long-term trust).",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "EXPLAIN",
    asPerform: false,
    domainTag: "business",
    minChars: 52,
    conceptHints: [
      "business ethics",
      "stakeholders",
      "honesty",
      "trust",
      "sales",
    ],
    misconceptionTargets: [
      "equating legality alone with ethical sufficiency",
      "ignoring customer trust as a stakeholder interest",
    ],
    successLooksLike:
      "Clear stakeholders, a decision, and a principle-based justification — not only 'because quota'.",
    scaffolds: [
      hint(
        "Stakeholders",
        "Consider customers, the company brand, teammates, and yourself.",
      ),
      step(
        "Name a principle",
        "Honesty, fairness, or long-term trust — pick one and apply it.",
      ),
      checklist(
        "Ethics checklist",
        "Two stakeholders · decision · principle named",
      ),
    ],
    criteria: [
      {
        id: "stakeholders",
        label: "Stakeholders",
        mustIncludeAny: [
          "customer",
          "company",
          "team",
          "stakeholder",
          "brand",
        ],
      },
      {
        id: "decision",
        label: "Decision",
        mustIncludeAny: [
          "will not",
          "refuse",
          "decline",
          "disclose",
          "decide",
          "choose",
        ],
      },
      {
        id: "principle",
        label: "Ethics principle",
        mustIncludeAny: [
          "honesty",
          "fairness",
          "trust",
          "transparency",
          "integrity",
        ],
      },
    ],
  },
  {
    id: "sim-ops-bottleneck-line",
    kind: "simulation",
    title: "Operations bottleneck line",
    objective:
      "Locate a process bottleneck and propose a capacity or flow fix.",
    prompt:
      "Simulation: Station A packs 40 units/hour, Station B seals 25/hour, Station C labels 45/hour. Identify the bottleneck, explain why WIP piles before it, and propose one fix (add capacity, reduce setup, or rebalance) with a brief rationale.",
    learningObjectType: "SIMULATION",
    skillFacet: "SOLVE",
    asPerform: false,
    domainTag: "business",
    minChars: 45,
    conceptHints: [
      "bottleneck",
      "throughput",
      "operations",
      "capacity",
      "wip",
      "business",
    ],
    misconceptionTargets: [
      "speeding up a non-bottleneck to raise end-to-end throughput",
      "assuming the first station is always the constraint",
    ],
    successLooksLike:
      "You identify B at 25/hour, explain upstream WIP, and propose a constraint-focused fix.",
    scaffolds: [
      hint(
        "Slowest wins",
        "System throughput cannot exceed the slowest station.",
      ),
      step(
        "WIP clue",
        "Inventory accumulates immediately before the constrained step.",
      ),
      checklist(
        "Bottleneck checklist",
        "Bottleneck named · WIP explained · one fix proposed",
      ),
    ],
    criteria: [
      {
        id: "bottleneck",
        label: "Bottleneck station",
        mustIncludeAny: ["b", "seal", "25"],
      },
      {
        id: "wip",
        label: "WIP reason",
        mustIncludeAny: ["wip", "pile", "queue", "before", "backlog"],
      },
      {
        id: "fix",
        label: "Fix",
        mustIncludeAny: [
          "capacity",
          "add",
          "rebalance",
          "setup",
          "parallel",
          "speed",
        ],
      },
    ],
  },

  // —— Accounting ——
  {
    id: "lab-accounting-equation",
    kind: "lab",
    title: "Accounting equation balance",
    objective:
      "Apply Assets = Liabilities + Equity to a small transaction set.",
    prompt:
      "Lab: Starting assets $10,000; liabilities $4,000; equity $6,000. Owner invests $1,000 cash. Restate the equation after the investment and explain which side(s) changed. Show that both sides still equal.",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "accounting",
    minChars: 45,
    conceptHints: [
      "accounting equation",
      "assets",
      "liabilities",
      "equity",
      "accounting",
    ],
    misconceptionTargets: [
      "increasing assets without updating equity for an owner investment",
      "treating liabilities and equity as the same claim",
    ],
    successLooksLike:
      "Assets and equity both rise by $1,000; equation remains balanced at $11,000 = $4,000 + $7,000.",
    scaffolds: [
      hint(
        "Owner cash in",
        "Cash (asset) up; owner's equity up — liabilities unchanged.",
      ),
      step(
        "Rewrite both sides",
        "Compute new totals and verify equality.",
      ),
      checklist(
        "Equation checklist",
        "New assets · new equity · equality shown",
      ),
    ],
    criteria: [
      {
        id: "assets",
        label: "Assets after",
        mustIncludeAny: ["11000", "11,000", "$11000", "assets"],
      },
      {
        id: "equity",
        label: "Equity after",
        mustIncludeAny: ["7000", "7,000", "equity"],
      },
      {
        id: "balance",
        label: "Equation holds",
        mustIncludeAny: ["equal", "balance", "both sides", "a = l + e"],
      },
    ],
  },
  {
    id: "sim-journal-entry-cash-sale",
    kind: "simulation",
    title: "Cash sale journal entry",
    objective:
      "Record a simple cash sale with debit and credit accounts.",
    prompt:
      "Simulation: Sold $200 of inventory for cash (ignore COGS for this entry). Name the debit account and credit account, amounts, and why cash increases on the debit side in this educational double-entry view.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "accounting",
    minChars: 42,
    conceptHints: [
      "journal entry",
      "debit",
      "credit",
      "cash sale",
      "revenue",
      "accounting",
    ],
    misconceptionTargets: [
      "crediting cash for a cash receipt",
      "omitting revenue when recording the sale",
    ],
    successLooksLike:
      "Debit Cash $200, credit Sales/Revenue $200, with a brief debit-normal explanation.",
    scaffolds: [
      hint(
        "Asset increase",
        "Assets like cash normally increase with debits.",
      ),
      step(
        "Revenue side",
        "Revenue usually increases with a credit.",
      ),
      checklist(
        "Entry checklist",
        "Debit named · credit named · amounts · brief why",
      ),
    ],
    criteria: [
      {
        id: "debit",
        label: "Debit cash",
        mustIncludeAny: ["debit cash", "debit", "cash"],
      },
      {
        id: "credit",
        label: "Credit revenue",
        mustIncludeAny: ["credit", "revenue", "sales"],
      },
      {
        id: "amount",
        label: "Amount",
        mustIncludeAny: ["200", "$200"],
      },
    ],
  },
  {
    id: "write-income-vs-balance",
    kind: "writing",
    title: "Income statement vs balance sheet",
    objective:
      "Distinguish period performance from point-in-time financial position.",
    prompt:
      "Writing: In your own words, what question does the income statement answer vs the balance sheet? Give one example account/line for each and explain why mixing them confuses users.",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "EXPLAIN",
    asPerform: false,
    domainTag: "accounting",
    minChars: 50,
    conceptHints: [
      "income statement",
      "balance sheet",
      "financial statements",
      "accounting",
      "period",
    ],
    misconceptionTargets: [
      "treating cash on the balance sheet as the same as net income",
      "thinking the income statement shows assets owed",
    ],
    successLooksLike:
      "Period profit/loss vs snapshot assets/liabilities/equity, with examples and a confusion warning.",
    scaffolds: [
      hint(
        "Time frame",
        "Income statement covers a period; balance sheet is a date snapshot.",
      ),
      step(
        "Example lines",
        "Revenue/expense vs cash/accounts payable/equity.",
      ),
      checklist(
        "Statements checklist",
        "Two questions · one example each · confusion named",
      ),
    ],
    criteria: [
      {
        id: "income",
        label: "Income statement role",
        mustIncludeAny: [
          "period",
          "profit",
          "loss",
          "revenue",
          "expense",
          "performance",
        ],
      },
      {
        id: "balance",
        label: "Balance sheet role",
        mustIncludeAny: [
          "snapshot",
          "assets",
          "liabilities",
          "equity",
          "position",
          "point in time",
        ],
      },
      {
        id: "confusion",
        label: "Why mixing confuses",
        mustIncludeAny: [
          "confuse",
          "different",
          "not the same",
          "mix",
          "misread",
        ],
      },
    ],
  },

  // —— Economics ——
  {
    id: "sim-supply-demand-shift",
    kind: "simulation",
    title: "Supply and demand shift",
    objective:
      "Predict price and quantity direction after a demand or supply shift.",
    prompt:
      "Simulation: A freeze destroys orange crops (supply shock). Separately, a viral smoothie trend raises orange demand. For the freeze only: which curve shifts which way, and what happens to equilibrium price and quantity?",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "economics",
    minChars: 45,
    conceptHints: [
      "supply",
      "demand",
      "shift",
      "equilibrium",
      "economics",
    ],
    misconceptionTargets: [
      "calling a price change itself a demand shift",
      "shifting demand when a weather shock hits producers",
    ],
    successLooksLike:
      "Supply shifts left; equilibrium price rises and quantity falls.",
    scaffolds: [
      hint(
        "Who is shocked?",
        "Crop damage hits producers → supply curve, not demand.",
      ),
      step(
        "Price-quantity pair",
        "Leftward supply → higher P, lower Q at the new intersection.",
      ),
      checklist(
        "Shift checklist",
        "Curve named · direction · price · quantity",
      ),
    ],
    criteria: [
      {
        id: "curve",
        label: "Supply shift",
        mustIncludeAny: ["supply", "left", "decrease in supply"],
      },
      {
        id: "price",
        label: "Price direction",
        mustIncludeAny: ["price rises", "higher price", "increase", "up"],
      },
      {
        id: "quantity",
        label: "Quantity direction",
        mustIncludeAny: [
          "quantity falls",
          "lower quantity",
          "decrease",
          "down",
          "fewer",
        ],
      },
    ],
  },
  {
    id: "lab-opportunity-cost-choice",
    kind: "lab",
    title: "Opportunity cost choice",
    objective:
      "Compute opportunity cost for a concrete time-allocation choice.",
    prompt:
      "Lab: You can work a 4-hour shift earning $15/hour or study for an exam expected to raise your grade. State the money opportunity cost of studying, what non-money cost you still weigh, and why 'free time' is not free.",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "economics",
    minChars: 45,
    conceptHints: [
      "opportunity cost",
      "tradeoff",
      "scarce time",
      "economics",
      "choice",
    ],
    misconceptionTargets: [
      "treating only out-of-pocket cash as cost",
      "calling something free when an alternative is forgone",
    ],
    successLooksLike:
      "You cite $60 forgone wages, name a non-money tradeoff, and reject 'free' framing.",
    scaffolds: [
      hint(
        "Best alternative",
        "Opportunity cost is the value of the next-best option you give up.",
      ),
      step(
        "Arithmetic",
        "4 × $15 = forgone wage if you study instead.",
      ),
      checklist(
        "Opportunity-cost checklist",
        "Money cost · non-money factor · why not free",
      ),
    ],
    criteria: [
      {
        id: "money",
        label: "Money opportunity cost",
        mustIncludeAny: ["60", "$60", "forgone", "wages", "earn"],
      },
      {
        id: "nonmoney",
        label: "Non-money factor",
        mustIncludeAny: [
          "grade",
          "stress",
          "sleep",
          "learning",
          "future",
          "exam",
        ],
      },
      {
        id: "not-free",
        label: "Not free",
        mustIncludeAny: ["not free", "forgo", "tradeoff", "alternative", "cost"],
      },
    ],
  },
  {
    id: "write-inflation-purchasing-power",
    kind: "writing",
    title: "Inflation and purchasing power",
    objective:
      "Explain how inflation erodes purchasing power with a simple example.",
    prompt:
      "Writing: Define inflation in one sentence, explain purchasing power, and give a mini example where the same nominal wage buys fewer goods after prices rise. Avoid partisan claims — focus on the mechanism.",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "EXPLAIN",
    asPerform: false,
    domainTag: "economics",
    minChars: 50,
    conceptHints: [
      "inflation",
      "purchasing power",
      "nominal",
      "price level",
      "economics",
    ],
    misconceptionTargets: [
      "equating any single price rise with economy-wide inflation",
      "assuming nominal wage increases always preserve real purchasing power",
    ],
    successLooksLike:
      "Clear inflation definition, purchasing-power link, and a concrete wage/goods example.",
    scaffolds: [
      hint(
        "General prices",
        "Inflation is a sustained rise in the general price level — not one item alone.",
      ),
      step(
        "Real vs nominal",
        "If prices rise faster than your wage, real buying power falls.",
      ),
      checklist(
        "Inflation checklist",
        "Definition · purchasing power · mini example",
      ),
    ],
    criteria: [
      {
        id: "define",
        label: "Inflation definition",
        mustIncludeAny: [
          "price level",
          "prices rise",
          "general prices",
          "inflation",
        ],
      },
      {
        id: "power",
        label: "Purchasing power",
        mustIncludeAny: [
          "purchasing power",
          "buy less",
          "fewer goods",
          "real",
        ],
      },
      {
        id: "example",
        label: "Example",
        mustIncludeAny: ["wage", "example", "for instance", "same money"],
      },
    ],
  },
  {
    id: "sim-elasticity-price-cut",
    kind: "simulation",
    title: "Price elasticity and a cut",
    objective:
      "Apply elasticity intuition to predict revenue after a price cut.",
    prompt:
      "Simulation: A cafe cuts latte price 10%. If demand is elastic, does total revenue likely rise or fall? Explain the % quantity response idea and one reason coffee at this shop might be elastic or inelastic.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "economics",
    minChars: 48,
    conceptHints: [
      "elasticity",
      "price cut",
      "revenue",
      "demand",
      "economics",
    ],
    misconceptionTargets: [
      "assuming any price cut always raises revenue",
      "confusing elasticity with the slope number alone without % changes",
    ],
    successLooksLike:
      "Elastic demand → revenue likely rises after a cut; quantity % rise outweighs price % fall; cite substitutes or habit.",
    scaffolds: [
      hint(
        "Elastic meaning",
        "Elastic: quantity responds more than proportionally to price.",
      ),
      step(
        "Revenue link",
        "If |%ΔQ| > |%ΔP|, a price cut can raise revenue.",
      ),
      checklist(
        "Elasticity checklist",
        "Revenue direction · % response idea · elastic/inelastic reason",
      ),
    ],
    criteria: [
      {
        id: "revenue",
        label: "Revenue direction",
        mustIncludeAny: ["rise", "increase", "higher revenue", "up"],
      },
      {
        id: "percent",
        label: "Percent response",
        mustIncludeAny: [
          "percent",
          "%",
          "more than",
          "proportion",
          "quantity",
        ],
      },
      {
        id: "reason",
        label: "Elastic/inelastic reason",
        mustIncludeAny: [
          "substitute",
          "habit",
          "brand",
          "nearby",
          "inelastic",
          "elastic",
        ],
      },
    ],
  },

  // —— Psychology (educational, non-diagnostic) ——
  {
    id: "write-classical-vs-operant",
    kind: "writing",
    title: "Classical vs operant learning",
    objective:
      "Explain the difference between classical and operant conditioning.",
    prompt:
      "Writing (educational psychology — not diagnosis): Contrast classical conditioning (association of stimuli) with operant conditioning (behavior shaped by consequences). Give one everyday example of each.",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "EXPLAIN",
    asPerform: false,
    domainTag: "psychology",
    minChars: 52,
    conceptHints: [
      "classical conditioning",
      "operant conditioning",
      "learning",
      "reinforcement",
      "psychology",
    ],
    misconceptionTargets: [
      "treating all learning as reward/punishment only",
      "calling any habit classical conditioning without a CS–US pairing idea",
    ],
    successLooksLike:
      "Clear contrast plus one classical and one operant everyday example.",
    scaffolds: [
      hint(
        "Pairing vs consequence",
        "Classical pairs stimuli; operant links actions to outcomes.",
      ),
      step(
        "Examples",
        "Bell→food style pairing vs study→praise / chore→privilege.",
      ),
      checklist(
        "Learning checklist",
        "Classical defined · operant defined · example each",
      ),
    ],
    criteria: [
      {
        id: "classical",
        label: "Classical",
        mustIncludeAny: [
          "classical",
          "association",
          "stimulus",
          "pairing",
          "conditioned",
        ],
      },
      {
        id: "operant",
        label: "Operant",
        mustIncludeAny: [
          "operant",
          "reinforcement",
          "consequence",
          "reward",
          "punishment",
        ],
      },
      {
        id: "examples",
        label: "Examples",
        mustIncludeAny: ["example", "for instance", "everyday", "e.g"],
      },
    ],
  },
  {
    id: "sim-memory-encoding-fail",
    kind: "simulation",
    title: "Memory encoding failure",
    objective:
      "Diagnose why a study method fails at encoding versus retrieval.",
    prompt:
      "Simulation: A student rereads highlighted notes the night before and blanks on short-answer items. Argue whether the main failure is shallow encoding, retrieval practice gap, or both, and propose one evidence-aligned study change.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "psychology",
    minChars: 48,
    conceptHints: [
      "encoding",
      "retrieval",
      "memory",
      "spaced practice",
      "psychology",
    ],
    misconceptionTargets: [
      "assuming rereading equals deep encoding",
      "blaming only 'bad memory' without strategy change",
    ],
    successLooksLike:
      "You name shallow encoding and/or missing retrieval practice, then propose free-recall or spaced self-testing.",
    scaffolds: [
      hint(
        "Rereading trap",
        "Familiarity while rereading can feel like learning without durable encoding.",
      ),
      step(
        "Fix direction",
        "Prefer active recall and spacing over another passive pass.",
      ),
      checklist(
        "Memory checklist",
        "Failure mode named · why · one study change",
      ),
    ],
    criteria: [
      {
        id: "fail",
        label: "Failure mode",
        mustIncludeAny: [
          "encoding",
          "retrieval",
          "shallow",
          "reread",
          "passive",
        ],
      },
      {
        id: "why",
        label: "Why it fails",
        mustIncludeAny: [
          "familiarity",
          "fluency",
          "not retrieve",
          "highlight",
          "passive",
        ],
      },
      {
        id: "fix",
        label: "Study change",
        mustIncludeAny: [
          "retrieval",
          "self-test",
          "flashcard",
          "spaced",
          "free recall",
          "practice",
        ],
      },
    ],
  },
  {
    id: "lab-confirmation-bias-spot",
    kind: "lab",
    title: "Spot confirmation bias",
    objective:
      "Identify confirmation bias in a reasoning vignette and propose a check.",
    prompt:
      "Lab: A fan only reads articles that support their team’s 'rigged refs' claim and dismisses contrary stats as fake. Name the bias, quote the biased move, and propose one debiasing step (seek disconfirming evidence or precommit to criteria).",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "psychology",
    minChars: 45,
    conceptHints: [
      "confirmation bias",
      "cognition",
      "critical thinking",
      "psychology",
      "evidence",
    ],
    misconceptionTargets: [
      "calling any disagreement confirmation bias",
      "thinking bias only happens to 'other people'",
    ],
    successLooksLike:
      "You label confirmation bias, cite selective exposure/dismissal, and propose a concrete check.",
    scaffolds: [
      hint(
        "Bias name",
        "Favoring confirming info and discounting challenges is confirmation bias.",
      ),
      step(
        "Debias",
        "Actively search for what would prove you wrong; set criteria before looking.",
      ),
      checklist(
        "Bias checklist",
        "Bias named · move cited · debias step",
      ),
    ],
    criteria: [
      {
        id: "bias",
        label: "Bias named",
        mustIncludeAny: ["confirmation", "confirming"],
      },
      {
        id: "move",
        label: "Biased move",
        mustIncludeAny: [
          "only reads",
          "dismiss",
          "selective",
          "ignore",
          "contrary",
        ],
      },
      {
        id: "debias",
        label: "Debias step",
        mustIncludeAny: [
          "disconfirm",
          "contrary",
          "criteria",
          "both sides",
          "seek",
          "challenge",
        ],
      },
    ],
  },

  // —— Sociology ——
  {
    id: "write-socialization-agents",
    kind: "writing",
    title: "Agents of socialization",
    objective:
      "Explain how major agents shape norms and identity over time.",
    prompt:
      "Writing: Define socialization briefly. Describe how family and peers each teach norms differently, and give one example of a norm that school or media reinforces.",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "EXPLAIN",
    asPerform: false,
    domainTag: "sociology",
    minChars: 50,
    conceptHints: [
      "socialization",
      "agents",
      "norms",
      "family",
      "peers",
      "sociology",
    ],
    misconceptionTargets: [
      "treating socialization as only childhood parenting",
      "assuming peers and family always teach identical norms",
    ],
    successLooksLike:
      "Clear definition, family vs peer contrast, and one school/media norm example.",
    scaffolds: [
      hint(
        "Agents",
        "Family, peers, school, and media are common agents of socialization.",
      ),
      step(
        "Contrast",
        "Family often early/intimate; peers emphasize belonging and status.",
      ),
      checklist(
        "Socialization checklist",
        "Definition · family · peers · school/media example",
      ),
    ],
    criteria: [
      {
        id: "define",
        label: "Definition",
        mustIncludeAny: [
          "socialization",
          "norms",
          "values",
          "learn",
          "society",
        ],
      },
      {
        id: "agents",
        label: "Family and peers",
        mustIncludeAny: ["family", "peer"],
      },
      {
        id: "example",
        label: "School or media",
        mustIncludeAny: ["school", "media", "teacher", "online", "curriculum"],
      },
    ],
  },
  {
    id: "sim-in-group-out-group",
    kind: "simulation",
    title: "In-group and out-group dynamics",
    objective:
      "Apply in-group/out-group concepts to a school-club scenario.",
    prompt:
      "Simulation: A club starts using an inside joke and ice-cold greeting for newcomers. Identify in-group vs out-group signals, one risk to cohesion/fairness, and one inclusive practice that keeps belonging without hostility.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "sociology",
    minChars: 48,
    conceptHints: [
      "in-group",
      "out-group",
      "belonging",
      "sociology",
      "groups",
    ],
    misconceptionTargets: [
      "assuming strong belonging requires excluding others",
      "treating all group identity as automatically harmful",
    ],
    successLooksLike:
      "You label signals, name a fairness/exclusion risk, and propose a welcoming practice.",
    scaffolds: [
      hint(
        "Signals",
        "Language, greetings, and access to jokes often mark boundaries.",
      ),
      step(
        "Inclusive keep",
        "Shared rituals can invite newcomers instead of icing them out.",
      ),
      checklist(
        "Group checklist",
        "Signals · risk · inclusive practice",
      ),
    ],
    criteria: [
      {
        id: "signals",
        label: "Boundary signals",
        mustIncludeAny: [
          "in-group",
          "out-group",
          "joke",
          "greeting",
          "newcomer",
          "exclude",
        ],
      },
      {
        id: "risk",
        label: "Risk",
        mustIncludeAny: [
          "exclude",
          "hostile",
          "unfair",
          "clique",
          "bullying",
          "isolation",
        ],
      },
      {
        id: "inclusive",
        label: "Inclusive practice",
        mustIncludeAny: [
          "welcome",
          "introduce",
          "invite",
          "mentor",
          "include",
          "orient",
        ],
      },
    ],
  },

  // —— History ——
  {
    id: "lab-cause-effect-industrial",
    kind: "lab",
    title: "Industrialization cause and effect",
    objective:
      "Trace one cause–effect chain in early industrialization.",
    prompt:
      "Lab: Choose one technological or organizational change of early industrialization (e.g., mechanized textile production, steam power, factory discipline). State a cause, an immediate effect, and a longer-term social or economic effect. Avoid monocausal slogans.",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "history",
    minChars: 50,
    conceptHints: [
      "industrialization",
      "cause and effect",
      "factory",
      "steam",
      "history",
    ],
    misconceptionTargets: [
      "claiming a single invention alone 'caused' modernity",
      "listing events without linking mechanisms",
    ],
    successLooksLike:
      "A specific change, a near-term effect, and a longer-term effect with causal language.",
    scaffolds: [
      hint(
        "Mechanism",
        "Connect how the change altered cost, speed, labor, or urban life.",
      ),
      step(
        "Two time scales",
        "Immediate (shop floor/output) vs longer-term (cities, class, environment).",
      ),
      checklist(
        "Cause-effect checklist",
        "Cause · immediate effect · longer-term effect",
      ),
    ],
    criteria: [
      {
        id: "cause",
        label: "Cause",
        mustIncludeAny: [
          "steam",
          "factory",
          "mechan",
          "textile",
          "machine",
          "rail",
        ],
      },
      {
        id: "immediate",
        label: "Immediate effect",
        mustIncludeAny: [
          "output",
          "productivity",
          "labor",
          "wage",
          "urban",
          "speed",
        ],
      },
      {
        id: "long",
        label: "Longer-term effect",
        mustIncludeAny: [
          "class",
          "city",
          "pollution",
          "union",
          "migration",
          "society",
          "economy",
        ],
      },
    ],
  },
  {
    id: "sim-source-reliability",
    kind: "simulation",
    title: "Source reliability check",
    objective:
      "Evaluate a historical source’s reliability using origin and purpose.",
    prompt:
      "Simulation: You have a wartime government poster urging citizens to buy bonds, and a private soldier’s diary entry from the same month. For each, note audience/purpose and one reliability strength or limit for learning about civilian morale.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "history",
    minChars: 55,
    conceptHints: [
      "primary source",
      "reliability",
      "bias",
      "audience",
      "history",
    ],
    misconceptionTargets: [
      "treating official posters as neutral facts about morale",
      "assuming diaries are always fully accurate and unbiased",
    ],
    successLooksLike:
      "You contrast propaganda purpose vs personal perspective and state strengths/limits for morale questions.",
    scaffolds: [
      hint(
        "Ask purpose",
        "Who made it, for whom, and to make them do/feel what?",
      ),
      step(
        "Morale question",
        "Posters show messaging goals; diaries show one lived view — neither is complete.",
      ),
      checklist(
        "Source checklist",
        "Poster purpose · diary limit/strength · morale use",
      ),
    ],
    criteria: [
      {
        id: "poster",
        label: "Poster purpose",
        mustIncludeAny: [
          "propaganda",
          "persuade",
          "government",
          "bonds",
          "audience",
        ],
      },
      {
        id: "diary",
        label: "Diary lens",
        mustIncludeAny: [
          "diary",
          "personal",
          "perspective",
          "limited",
          "one soldier",
        ],
      },
      {
        id: "morale",
        label: "Morale use",
        mustIncludeAny: [
          "morale",
          "bias",
          "limit",
          "reliable",
          "corroborat",
        ],
      },
    ],
  },
  {
    id: "write-compare-revolutions",
    kind: "writing",
    title: "Compare two revolutions",
    objective:
      "Compare and contrast political revolutions with evidence-based claims.",
    prompt:
      "Writing: Compare the American and French Revolutions on one similarity and one difference (goals, social base, or outcomes). Use careful historical language — avoid modern partisan framing.",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "EXPLAIN",
    asPerform: false,
    domainTag: "history",
    minChars: 52,
    conceptHints: [
      "revolution",
      "compare contrast",
      "american revolution",
      "french revolution",
      "history",
    ],
    misconceptionTargets: [
      "treating both revolutions as identical in social outcomes",
      "importing modern party labels into 18th-century contexts",
    ],
    successLooksLike:
      "One clear similarity, one clear difference, with historically grounded wording.",
    scaffolds: [
      hint(
        "Axes",
        "Try goals (rights/republic), violence/scale, or social transformation.",
      ),
      step(
        "Balanced pair",
        "State similarity, then difference, each with a concrete anchor.",
      ),
      checklist(
        "Compare checklist",
        "Similarity · difference · careful language",
      ),
    ],
    criteria: [
      {
        id: "similar",
        label: "Similarity",
        mustIncludeAny: [
          "similar",
          "both",
          "shared",
          "rights",
          "republic",
          "monarchy",
        ],
      },
      {
        id: "different",
        label: "Difference",
        mustIncludeAny: [
          "differ",
          "unlike",
          "whereas",
          "however",
          "more",
          "less",
        ],
      },
      {
        id: "anchor",
        label: "Historical anchor",
        mustIncludeAny: [
          "france",
          "america",
          "colon",
          "louis",
          "declaration",
          "terror",
          "constitution",
        ],
      },
    ],
  },

  // —— Civics (nonpartisan factual) ——
  {
    id: "lab-checks-balances",
    kind: "lab",
    title: "Checks and balances map",
    objective:
      "Map how U.S. branches check one another with concrete examples.",
    prompt:
      "Lab (nonpartisan civics): Name the three branches. Give one check the legislative branch has on the executive, and one check the judicial branch has on legislation. Stick to structural facts.",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "civics",
    minChars: 45,
    conceptHints: [
      "checks and balances",
      "separation of powers",
      "branches",
      "civics",
      "constitution",
    ],
    misconceptionTargets: [
      "collapsing all federal power into a single branch",
      "confusing political preference with constitutional structure",
    ],
    successLooksLike:
      "Three branches named plus concrete checks (e.g., override/impeach/advise-consent; judicial review).",
    scaffolds: [
      hint(
        "Three branches",
        "Legislative makes law, executive carries out, judicial interprets.",
      ),
      step(
        "Examples",
        "Veto override, advice and consent, impeachment; courts reviewing statutes.",
      ),
      checklist(
        "Checks checklist",
        "Three branches · legislative check · judicial check",
      ),
    ],
    criteria: [
      {
        id: "branches",
        label: "Three branches",
        mustIncludeAny: [
          "legislative",
          "executive",
          "judicial",
          "congress",
          "president",
          "court",
        ],
      },
      {
        id: "leg-check",
        label: "Legislative check",
        mustIncludeAny: [
          "override",
          "impeach",
          "advise",
          "consent",
          "confirm",
          "fund",
        ],
      },
      {
        id: "jud-check",
        label: "Judicial check",
        mustIncludeAny: [
          "judicial review",
          "unconstitutional",
          "strike down",
          "interpret",
          "court",
        ],
      },
    ],
  },
  {
    id: "sim-bill-becomes-law",
    kind: "simulation",
    title: "How a bill becomes law",
    objective:
      "Sequence major steps for a bill becoming federal law.",
    prompt:
      "Simulation (nonpartisan): A bill passes one chamber. List the next major steps through the other chamber and the president, including what a veto and an override mean. Focus on process, not party strategy.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "civics",
    minChars: 50,
    conceptHints: [
      "legislation",
      "bill",
      "veto",
      "congress",
      "civics",
      "lawmaking",
    ],
    misconceptionTargets: [
      "assuming presidential signature is the only path to law",
      "skipping the second chamber after one house passes a bill",
    ],
    successLooksLike:
      "Second chamber → enrollment → presentment → sign or veto → possible override.",
    scaffolds: [
      hint(
        "Two chambers",
        "Both House and Senate must pass the same text (or reconcile via conference).",
      ),
      step(
        "Presentment",
        "After bicameral passage, the president may sign or veto; Congress may override.",
      ),
      checklist(
        "Process checklist",
        "Second chamber · presentment · veto/override",
      ),
    ],
    criteria: [
      {
        id: "chambers",
        label: "Second chamber",
        mustIncludeAny: [
          "senate",
          "house",
          "other chamber",
          "both",
          "conference",
        ],
      },
      {
        id: "president",
        label: "Presentment",
        mustIncludeAny: ["president", "sign", "veto", "present"],
      },
      {
        id: "override",
        label: "Override idea",
        mustIncludeAny: [
          "override",
          "two-thirds",
          "supermajority",
          "congress overrides",
        ],
      },
    ],
  },
  {
    id: "write-federalism-powers",
    kind: "writing",
    title: "Federalism and divided powers",
    objective:
      "Explain federalism with examples of national and state powers.",
    prompt:
      "Writing (nonpartisan factual): Define federalism. Give one example of a power typically exercised by the national government and one typically reserved to states. Note why concurrent powers can create overlap.",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "EXPLAIN",
    asPerform: false,
    domainTag: "civics",
    minChars: 50,
    conceptHints: [
      "federalism",
      "enumerated powers",
      "reserved powers",
      "states",
      "civics",
    ],
    misconceptionTargets: [
      "claiming states have no independent authority",
      "treating all policy disputes as purely federal questions",
    ],
    successLooksLike:
      "Clear federalism definition, national vs state examples, and concurrent-overlap note.",
    scaffolds: [
      hint(
        "Definition",
        "Federalism divides power between national and state governments.",
      ),
      step(
        "Examples",
        "National: coin money, declare war, regulate interstate commerce. States: many police powers, elections administration details, schooling structures (varies).",
      ),
      checklist(
        "Federalism checklist",
        "Definition · national example · state example · overlap",
      ),
    ],
    criteria: [
      {
        id: "define",
        label: "Federalism defined",
        mustIncludeAny: [
          "federalism",
          "divide",
          "shared",
          "national and state",
          "levels",
        ],
      },
      {
        id: "national",
        label: "National power example",
        mustIncludeAny: [
          "war",
          "commerce",
          "currency",
          "coin",
          "treaty",
          "federal",
        ],
      },
      {
        id: "state",
        label: "State power example",
        mustIncludeAny: [
          "state",
          "police",
          "education",
          "election",
          "license",
          "reserved",
        ],
      },
    ],
  },

  // —— Geography ——
  {
    id: "lab-map-scale-distance",
    kind: "lab",
    title: "Map scale distance",
    objective:
      "Use map scale to estimate real-world distance.",
    prompt:
      "Lab: A map scale is 1 cm = 5 km. Two towns are 6 cm apart on the map. Compute real distance, show the proportion idea, and state one reason scale matters for route planning.",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "geography",
    minChars: 40,
    conceptHints: [
      "map scale",
      "distance",
      "proportion",
      "geography",
      "spatial",
    ],
    misconceptionTargets: [
      "reading map cm as real km without scaling",
      "ignoring that scale differs across map types",
    ],
    successLooksLike:
      "6 × 5 = 30 km with proportion reasoning and a planning use case.",
    scaffolds: [
      hint(
        "Multiply by scale",
        "Map length × real units per map unit.",
      ),
      step(
        "Why it matters",
        "Travel time and fuel estimates depend on true distance, not page centimeters.",
      ),
      checklist(
        "Scale checklist",
        "Distance computed · proportion shown · planning reason",
      ),
    ],
    criteria: [
      {
        id: "distance",
        label: "Real distance",
        mustIncludeAny: ["30", "30 km"],
      },
      {
        id: "proportion",
        label: "Proportion",
        mustIncludeAny: ["scale", "proportion", "1 cm", "5 km", "multiply"],
      },
      {
        id: "why",
        label: "Why scale matters",
        mustIncludeAny: [
          "route",
          "travel",
          "time",
          "plan",
          "distance",
          "fuel",
        ],
      },
    ],
  },
  {
    id: "sim-push-pull-migration",
    kind: "simulation",
    title: "Push and pull migration",
    objective:
      "Classify migration drivers as push or pull factors.",
    prompt:
      "Simulation: A family leaves a drought-hit farming region for a coastal city with factory jobs and relatives already there. Identify one push factor, one pull factor, and one intervening obstacle they might face.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "geography",
    minChars: 45,
    conceptHints: [
      "migration",
      "push factor",
      "pull factor",
      "geography",
      "urbanization",
    ],
    misconceptionTargets: [
      "labeling every destination feature as a push factor",
      "ignoring obstacles between origin and destination",
    ],
    successLooksLike:
      "Drought as push, jobs/family as pull, plus a realistic obstacle (cost, borders, housing).",
    scaffolds: [
      hint(
        "Push vs pull",
        "Push drives people away; pull attracts them to a destination.",
      ),
      step(
        "Obstacles",
        "Cost, distance, legal barriers, or housing shortages can intervene.",
      ),
      checklist(
        "Migration checklist",
        "Push · pull · obstacle",
      ),
    ],
    criteria: [
      {
        id: "push",
        label: "Push factor",
        mustIncludeAny: ["drought", "push", "farm", "leave", "hardship"],
      },
      {
        id: "pull",
        label: "Pull factor",
        mustIncludeAny: ["job", "pull", "factory", "relative", "city"],
      },
      {
        id: "obstacle",
        label: "Obstacle",
        mustIncludeAny: [
          "cost",
          "border",
          "housing",
          "distance",
          "visa",
          "obstacle",
          "barrier",
        ],
      },
    ],
  },

  // —— English / writing ——
  {
    id: "lab-comma-splice-fix",
    kind: "lab",
    title: "Fix a comma splice",
    objective:
      "Identify and repair a comma splice with a correct boundary.",
    prompt:
      "Lab: Sentence: 'The draft was late, the team still submitted it.' Name the error, then rewrite correctly using a period, semicolon, or coordinating conjunction. Explain why the comma alone failed.",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "english",
    minChars: 42,
    conceptHints: [
      "comma splice",
      "independent clause",
      "grammar",
      "punctuation",
      "english",
    ],
    misconceptionTargets: [
      "treating a comma as sufficient between two full sentences",
      "fixing only by deleting necessary words",
    ],
    successLooksLike:
      "You name comma splice and rewrite with a legal boundary plus a brief why.",
    scaffolds: [
      hint(
        "Two sentences",
        "Each half can stand alone — that is the splice clue.",
      ),
      step(
        "Legal joins",
        "Period, semicolon, or comma + coordinating conjunction (FANBOYS).",
      ),
      checklist(
        "Grammar checklist",
        "Error named · rewrite · why comma failed",
      ),
    ],
    criteria: [
      {
        id: "error",
        label: "Error named",
        mustIncludeAny: ["comma splice", "splice", "run-on"],
      },
      {
        id: "fix",
        label: "Correct rewrite",
        mustIncludeAny: [
          "period",
          "semicolon",
          "because",
          "but",
          "and",
          "yet",
          "so",
        ],
      },
      {
        id: "why",
        label: "Why comma failed",
        mustIncludeAny: [
          "independent",
          "two sentences",
          "complete",
          "clause",
          "cannot join",
        ],
      },
    ],
  },
  {
    id: "write-thesis-revision-pass",
    kind: "writing",
    title: "Thesis revision pass",
    objective:
      "Revise a vague thesis into an arguable, specific claim.",
    prompt:
      "Writing: Vague thesis: 'Social media is bad for teens.' Rewrite a stronger thesis that takes a clear position, narrows scope, and previews a reason. Then explain what made the original weak.",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "EXPLAIN",
    asPerform: false,
    domainTag: "english",
    minChars: 50,
    conceptHints: [
      "thesis",
      "revision",
      "argument",
      "claim",
      "english",
      "writing",
    ],
    misconceptionTargets: [
      "equating a topic label with a thesis claim",
      "using only evaluative adjectives without reasons",
    ],
    successLooksLike:
      "Specific arguable thesis plus a clear diagnosis of the vague original.",
    scaffolds: [
      hint(
        "Arguable",
        "A thesis should be debatable — not a dictionary fact or empty insult.",
      ),
      step(
        "Narrow",
        "Specify which teens, which platform use, and what harm/benefit mechanism.",
      ),
      checklist(
        "Thesis checklist",
        "Revised claim · narrowed scope · weakness of original",
      ),
    ],
    criteria: [
      {
        id: "claim",
        label: "Revised claim",
        mustIncludeAny: [
          "because",
          "should",
          "limits",
          "harms",
          "improves",
          "when",
        ],
      },
      {
        id: "specific",
        label: "Specificity",
        mustIncludeAny: [
          "sleep",
          "attention",
          "cyber",
          "hours",
          "platform",
          "specific",
          "teens who",
        ],
      },
      {
        id: "weakness",
        label: "Original weakness",
        mustIncludeAny: [
          "vague",
          "broad",
          "not arguable",
          "topic",
          "unclear",
          "weak",
        ],
      },
    ],
  },
  {
    id: "sim-citation-paraphrase-boundary",
    kind: "simulation",
    title: "Paraphrase vs plagiarism boundary",
    objective:
      "Distinguish ethical paraphrase from patchwriting plagiarism.",
    prompt:
      "Simulation: Source sentence about climate migration. Version A swaps synonyms but keeps structure; Version B restates ideas in new structure and cites the source. Which is acceptable paraphrase, why Version A fails, and what citation still requires.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "english",
    minChars: 48,
    conceptHints: [
      "paraphrase",
      "plagiarism",
      "citation",
      "academic integrity",
      "english",
    ],
    misconceptionTargets: [
      "believing synonym swaps alone make paraphrase ethical",
      "thinking citation makes copied structure acceptable",
    ],
    successLooksLike:
      "You accept Version B, reject patchwriting A, and note citation of ideas remains required.",
    scaffolds: [
      hint(
        "Structure matters",
        "Paraphrase changes wording and sentence architecture — not just synonyms.",
      ),
      step(
        "Still cite",
        "Even good paraphrase of someone else’s idea needs a citation.",
      ),
      checklist(
        "Integrity checklist",
        "Acceptable version · why A fails · citation note",
      ),
    ],
    criteria: [
      {
        id: "accept",
        label: "Acceptable version",
        mustIncludeAny: ["b", "version b", "restate", "new structure"],
      },
      {
        id: "fail",
        label: "Why A fails",
        mustIncludeAny: [
          "synonym",
          "structure",
          "patchwrit",
          "too close",
          "plagiar",
        ],
      },
      {
        id: "cite",
        label: "Citation still needed",
        mustIncludeAny: ["cite", "citation", "credit", "source", "attribute"],
      },
    ],
  },

  // —— Literature ——
  {
    id: "write-theme-from-passage",
    kind: "writing",
    title: "Theme from textual evidence",
    objective:
      "State a theme claim supported by evidence from a short passage.",
    prompt:
      "Writing: Passage idea: a character repeatedly returns a lost wallet despite needing money. State a theme (not a topic word), cite two textual details that support it, and explain the link. Avoid moralizing slogans without evidence.",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "EXPLAIN",
    asPerform: false,
    domainTag: "literature",
    minChars: 52,
    conceptHints: [
      "theme",
      "evidence",
      "literary analysis",
      "literature",
      "claim",
    ],
    misconceptionTargets: [
      "stating a topic ('honesty') as if it were a full theme claim",
      "quoting without explaining how details support the theme",
    ],
    successLooksLike:
      "A full theme sentence, two details, and reasoning that connects them.",
    scaffolds: [
      hint(
        "Theme shape",
        "Theme is a complete idea about life/human nature — not a single noun.",
      ),
      step(
        "Evidence bridge",
        "Detail → inference → theme statement.",
      ),
      checklist(
        "Theme checklist",
        "Theme claim · two details · link explained",
      ),
    ],
    criteria: [
      {
        id: "theme",
        label: "Theme claim",
        mustIncludeAny: [
          "integrity",
          "honesty",
          "values",
          "temptation",
          "character",
          "theme",
        ],
      },
      {
        id: "evidence",
        label: "Textual details",
        mustIncludeAny: [
          "wallet",
          "returns",
          "money",
          "detail",
          "passage",
          "repeatedly",
        ],
      },
      {
        id: "link",
        label: "Evidence link",
        mustIncludeAny: [
          "shows",
          "suggests",
          "because",
          "supports",
          "illustrates",
        ],
      },
    ],
  },
  {
    id: "lab-symbolism-spot",
    kind: "lab",
    title: "Spot symbolism",
    objective:
      "Identify a symbol and explain its figurative function in context.",
    prompt:
      "Lab: In a story, a cracked pocket watch stops at the hour a parent left. Identify the likely symbol, what abstract idea it may stand for, and one detail that prevents a purely literal reading.",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "literature",
    minChars: 45,
    conceptHints: [
      "symbolism",
      "figurative language",
      "literature",
      "motif",
      "interpretation",
    ],
    misconceptionTargets: [
      "forcing every object to be a symbol without textual cues",
      "ignoring literal function entirely when discussing symbols",
    ],
    successLooksLike:
      "Watch as symbol of stalled time/loss/memory, with a cue beyond mere object presence.",
    scaffolds: [
      hint(
        "More than object",
        "Symbols accumulate meaning through repetition, emphasis, or charged context.",
      ),
      step(
        "Abstract link",
        "Connect the stopped time to absence, grief, or memory — grounded in the tip.",
      ),
      checklist(
        "Symbol checklist",
        "Symbol named · abstract idea · anti-literal cue",
      ),
    ],
    criteria: [
      {
        id: "symbol",
        label: "Symbol identified",
        mustIncludeAny: ["watch", "clock", "time"],
      },
      {
        id: "idea",
        label: "Abstract idea",
        mustIncludeAny: [
          "loss",
          "memory",
          "absence",
          "grief",
          "frozen",
          "past",
        ],
      },
      {
        id: "cue",
        label: "Non-literal cue",
        mustIncludeAny: [
          "stopped",
          "cracked",
          "hour",
          "left",
          "emphasis",
          "symbol",
        ],
      },
    ],
  },
  {
    id: "sim-pov-shift-effect",
    kind: "simulation",
    title: "Point-of-view shift effect",
    objective:
      "Explain how changing narrator POV alters reader knowledge and sympathy.",
    prompt:
      "Simulation: Scene of a missing bike told first in first-person by the owner, then rewritten in limited third-person from a neighbor who saw nothing. What knowledge changes, how sympathy may shift, and why authors choose POV deliberately.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "literature",
    minChars: 50,
    conceptHints: [
      "point of view",
      "narrator",
      "first person",
      "third person",
      "literature",
    ],
    misconceptionTargets: [
      "assuming POV changes only pronouns without affecting information",
      "equating third-person with knowing everything (omniscience)",
    ],
    successLooksLike:
      "You contrast access to feelings/facts, note sympathy effects, and state authorial purpose.",
    scaffolds: [
      hint(
        "Information access",
        "First-person grants interiority; limited third may withhold it.",
      ),
      step(
        "Sympathy",
        "Readers often align with whose thoughts they share.",
      ),
      checklist(
        "POV checklist",
        "Knowledge change · sympathy · author purpose",
      ),
    ],
    criteria: [
      {
        id: "knowledge",
        label: "Knowledge change",
        mustIncludeAny: [
          "know",
          "access",
          "interior",
          "thoughts",
          "limited",
          "cannot see",
        ],
      },
      {
        id: "sympathy",
        label: "Sympathy shift",
        mustIncludeAny: [
          "sympathy",
          "empathy",
          "side with",
          "align",
          "feel for",
        ],
      },
      {
        id: "purpose",
        label: "Author purpose",
        mustIncludeAny: [
          "author",
          "choose",
          "control",
          "focus",
          "perspective",
          "deliberate",
        ],
      },
    ],
  },

  // —— Communication ——
  {
    id: "present-audience-adapt",
    kind: "presentation",
    title: "Adapt a talk to the audience",
    objective:
      "Adapt presentation content and language to a defined audience.",
    prompt:
      "Presentation practice: You have 3 minutes on password managers. Outline how your opening, vocabulary, and one example would differ for (A) middle-school students vs (B) busy hospital clerks. Include one slide-intent note per audience.",
    learningObjectType: "PRESENTATION_PRACTICE",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "communication",
    minChars: 55,
    conceptHints: [
      "audience analysis",
      "presentation",
      "adaptation",
      "communication",
      "rhetoric",
    ],
    misconceptionTargets: [
      "using identical jargon for every audience",
      "treating slides as a script dump instead of audience support",
    ],
    successLooksLike:
      "Clear A vs B adaptations for opening, wording, example, and slide intent.",
    scaffolds: [
      hint(
        "Audience first",
        "Ask what they already know and what they must do after the talk.",
      ),
      step(
        "Swap example",
        "School lockers vs shared clinical workstations — pick concrete worlds.",
      ),
      checklist(
        "Audience checklist",
        "Opening A/B · vocab A/B · example A/B · slide intent",
      ),
    ],
    criteria: [
      {
        id: "audiences",
        label: "Both audiences",
        mustIncludeAny: [
          "student",
          "clerk",
          "middle-school",
          "hospital",
          "audience",
        ],
      },
      {
        id: "adapt",
        label: "Adaptation",
        mustIncludeAny: [
          "vocabulary",
          "example",
          "opening",
          "simpler",
          "jargon",
          "adapt",
        ],
      },
      {
        id: "slide",
        label: "Slide intent",
        mustIncludeAny: ["slide", "visual", "bullet", "diagram", "title"],
      },
    ],
  },
  {
    id: "sim-active-listening-cues",
    kind: "simulation",
    title: "Active listening cues",
    objective:
      "Apply active-listening behaviors in a short conflict vignette.",
    prompt:
      "Simulation: A teammate says the deadline feels impossible. List two verbal listening cues, one nonverbal cue, and a paraphrase you would use before offering solutions.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "communication",
    minChars: 45,
    conceptHints: [
      "active listening",
      "paraphrase",
      "nonverbal",
      "communication",
      "empathy",
    ],
    misconceptionTargets: [
      "jumping to advice before reflecting the speaker’s meaning",
      "equating silence alone with active listening",
    ],
    successLooksLike:
      "Verbal + nonverbal cues and a paraphrase that precedes problem-solving.",
    scaffolds: [
      hint(
        "Reflect first",
        "Show you heard the feeling/content before fixing.",
      ),
      step(
        "Paraphrase stem",
        "'What I’m hearing is… Is that right?'",
      ),
      checklist(
        "Listening checklist",
        "Two verbal · one nonverbal · paraphrase before advice",
      ),
    ],
    criteria: [
      {
        id: "verbal",
        label: "Verbal cues",
        mustIncludeAny: [
          "clarify",
          "question",
          "uh-huh",
          "go on",
          "summarize",
          "reflect",
        ],
      },
      {
        id: "nonverbal",
        label: "Nonverbal cue",
        mustIncludeAny: [
          "eye contact",
          "nod",
          "posture",
          "lean",
          "face",
          "attentive",
        ],
      },
      {
        id: "paraphrase",
        label: "Paraphrase",
        mustIncludeAny: [
          "paraphrase",
          "hearing",
          "sounds like",
          "you feel",
          "so you’re",
        ],
      },
    ],
  },
  {
    id: "write-conflict-i-statements",
    kind: "writing",
    title: "Conflict I-statements",
    objective:
      "Rewrite blame language into constructive I-statements.",
    prompt:
      "Writing: Rewrite 'You never listen in meetings' into an I-statement covering observation, feeling, and request. Explain why the original invites defensiveness.",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "EXPLAIN",
    asPerform: false,
    domainTag: "communication",
    minChars: 48,
    conceptHints: [
      "i-statement",
      "conflict",
      "feedback",
      "communication",
      "assertiveness",
    ],
    misconceptionTargets: [
      "disguising accusations as I-statements ('I feel you are lazy')",
      "omitting a clear actionable request",
    ],
    successLooksLike:
      "Observation + feeling + request I-statement, plus a defensiveness explanation.",
    scaffolds: [
      hint(
        "Formula",
        "When [observable], I feel [emotion] because [impact]. I request [specific].",
      ),
      step(
        "Avoid fake I",
        "Don’t smuggle a 'you' attack after 'I feel'.",
      ),
      checklist(
        "I-statement checklist",
        "Rewrite · feeling · request · why original fails",
      ),
    ],
    criteria: [
      {
        id: "i",
        label: "I-statement",
        mustIncludeAny: ["i feel", "i notice", "i need", "when i"],
      },
      {
        id: "request",
        label: "Request",
        mustIncludeAny: [
          "request",
          "please",
          "would you",
          "can we",
          "ask",
        ],
      },
      {
        id: "defensive",
        label: "Defensiveness reason",
        mustIncludeAny: [
          "defensive",
          "blame",
          "attack",
          "always/never",
          "accuse",
        ],
      },
    ],
  },

  // —— Languages ——
  {
    id: "lab-spanish-ser-estar",
    kind: "lab",
    title: "Spanish ser vs estar",
    objective:
      "Choose ser or estar with reasoned contrasts in context.",
    prompt:
      "Lab: For each, pick ser or estar and justify: (1) identity/profession 'She is a doctor'; (2) temporary location 'We are at school'; (3) condition 'The soup is hot'. Write the verb choice and a short reason each.",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "languages",
    minChars: 50,
    conceptHints: [
      "ser",
      "estar",
      "spanish",
      "copula",
      "languages",
    ],
    misconceptionTargets: [
      "using one verb for all 'to be' meanings",
      "treating location as ser by default",
    ],
    successLooksLike:
      "Ser for profession/identity; estar for location and temporary condition, with reasons.",
    scaffolds: [
      hint(
        "DOCTOR / PLACE / FEEL",
        "Identity often ser; location/conditions often estar.",
      ),
      step(
        "Justify each",
        "Name the rule category, not only the verb.",
      ),
      checklist(
        "Ser/estar checklist",
        "Profession · location · condition each justified",
      ),
    ],
    criteria: [
      {
        id: "profession",
        label: "Profession / ser",
        mustIncludeAny: ["ser", "es doctora", "profession", "identity"],
      },
      {
        id: "location",
        label: "Location / estar",
        mustIncludeAny: ["estar", "estamos", "location", "at school"],
      },
      {
        id: "condition",
        label: "Condition / estar",
        mustIncludeAny: ["estar", "está", "hot", "condition", "temporary"],
      },
    ],
  },
  {
    id: "sim-french-gender-article",
    kind: "simulation",
    title: "French article gender",
    objective:
      "Apply French definite articles to noun gender in context.",
    prompt:
      "Simulation: Choose le/la/l’ for: livre (m.), école (f.), ami (m. before vowel sound). State each article+noun and the gender rule or elision reason you used.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "languages",
    minChars: 42,
    conceptHints: [
      "french",
      "gender",
      "article",
      "elision",
      "languages",
    ],
    misconceptionTargets: [
      "assuming spelling ending alone always determines gender without learning nouns",
      "forgetting elision before vowel sounds",
    ],
    successLooksLike:
      "le livre, l’école, l’ami with gender/elision reasons.",
    scaffolds: [
      hint(
        "Articles",
        "le (m.), la (f.), l’ before vowel or mute h.",
      ),
      step(
        "Memorize with article",
        "Learn nouns as article+noun pairs.",
      ),
      checklist(
        "Article checklist",
        "livre · école · ami each with reason",
      ),
    ],
    criteria: [
      {
        id: "livre",
        label: "le livre",
        mustIncludeAny: ["le livre", "le"],
      },
      {
        id: "ecole",
        label: "l’école",
        mustIncludeAny: ["l'école", "l’école", "la école", "elision"],
      },
      {
        id: "ami",
        label: "l’ami",
        mustIncludeAny: ["l'ami", "l’ami", "vowel"],
      },
    ],
  },
  {
    id: "write-german-word-order",
    kind: "writing",
    title: "German word-order basics",
    objective:
      "Explain verb-second and subordinate-clause verb-final patterns.",
    prompt:
      "Writing: In beginner German, explain the verb-second (V2) idea in main clauses and what often happens to the conjugated verb in a weil-subordinate clause. Give one tiny example pattern for each (glossed is fine).",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "EXPLAIN",
    asPerform: false,
    domainTag: "languages",
    minChars: 50,
    conceptHints: [
      "german",
      "word order",
      "verb second",
      "subordinate clause",
      "languages",
    ],
    misconceptionTargets: [
      "assuming German word order matches English slot-for-slot",
      "leaving the verb in second position inside weil-clauses",
    ],
    successLooksLike:
      "V2 explained, weil verb-final noted, with miniature examples.",
    scaffolds: [
      hint(
        "V2",
        "In many main clauses the finite verb is the second constituent.",
      ),
      step(
        "weil",
        "Subordinating weil often sends the conjugated verb to the end.",
      ),
      checklist(
        "Word-order checklist",
        "V2 explained · weil pattern · examples",
      ),
    ],
    criteria: [
      {
        id: "v2",
        label: "Verb second",
        mustIncludeAny: [
          "verb second",
          "v2",
          "second position",
          "finite verb",
        ],
      },
      {
        id: "weil",
        label: "Subordinate order",
        mustIncludeAny: ["weil", "end", "final", "subordinate"],
      },
      {
        id: "example",
        label: "Example",
        mustIncludeAny: ["example", "ich", "ist", "geht", "e.g"],
      },
    ],
  },
  {
    id: "lab-mandarin-tone-awareness",
    kind: "lab",
    title: "Mandarin tone awareness",
    objective:
      "Demonstrate awareness of Mandarin tone contrasts without pronunciation scoring.",
    prompt:
      "Lab (awareness only — no fake pronunciation scoring): Explain why tones matter using mā/má/mǎ/mà style contrasts. Identify which tone number is typically 'falling', and give one study strategy for noticing tone (listen-compare, tone marks, minimal pairs) — not a graded oral performance.",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "languages",
    minChars: 48,
    conceptHints: [
      "mandarin",
      "tones",
      "pitch",
      "minimal pairs",
      "languages",
      "awareness",
    ],
    misconceptionTargets: [
      "treating romanization without tones as sufficient for meaning",
      "confusing tone awareness tasks with scored pronunciation engines",
    ],
    successLooksLike:
      "You explain meaning changes across tones, name the falling tone, and cite an awareness strategy.",
    scaffolds: [
      hint(
        "Meaning hinge",
        "Same segmental sounds can be different words when tone changes.",
      ),
      step(
        "Falling tone",
        "Tone 4 is commonly described as falling (mà).",
      ),
      checklist(
        "Tone awareness checklist",
        "Why tones matter · falling tone · awareness strategy (no scoring)",
      ),
    ],
    criteria: [
      {
        id: "matter",
        label: "Why tones matter",
        mustIncludeAny: [
          "meaning",
          "different word",
          "contrast",
          "minimal",
          "tone",
        ],
      },
      {
        id: "falling",
        label: "Falling tone",
        mustIncludeAny: ["4", "fourth", "falling", "mà"],
      },
      {
        id: "strategy",
        label: "Awareness strategy",
        mustIncludeAny: [
          "listen",
          "minimal pair",
          "tone mark",
          "compare",
          "pinyin",
        ],
      },
    ],
  },

  // —— Art ——
  {
    id: "lab-elements-line-value",
    kind: "lab",
    title: "Elements: line and value",
    objective:
      "Identify line and value and apply them in a brief study note.",
    prompt:
      "Lab: Look at a simple still-life sketch (imagine strong contour lines and a shaded side). Define line and value as elements of art, point to where each appears, and state one expressive effect (e.g., weight, depth, focus).",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "art",
    minChars: 45,
    conceptHints: [
      "elements of art",
      "line",
      "value",
      "shading",
      "art",
    ],
    misconceptionTargets: [
      "confusing value (light/dark) with color hue",
      "treating line as only decorative outline with no structure role",
    ],
    successLooksLike:
      "Clear definitions, located examples, and one expressive effect.",
    scaffolds: [
      hint(
        "Value = light/dark",
        "Value is the lightness or darkness of a tone, independent of hue.",
      ),
      step(
        "Point then effect",
        "Name where you see contour vs shading, then what it does for the viewer.",
      ),
      checklist(
        "Elements checklist",
        "Line defined · value defined · effect named",
      ),
    ],
    criteria: [
      {
        id: "line",
        label: "Line",
        mustIncludeAny: ["line", "contour", "outline", "edge"],
      },
      {
        id: "value",
        label: "Value",
        mustIncludeAny: ["value", "light", "dark", "shade", "tone"],
      },
      {
        id: "effect",
        label: "Expressive effect",
        mustIncludeAny: [
          "depth",
          "weight",
          "focus",
          "form",
          "volume",
          "contrast",
        ],
      },
    ],
  },
  {
    id: "write-critique-describe-analyze",
    kind: "writing",
    title: "Critique: describe then analyze",
    objective:
      "Separate description from analysis in an art critique paragraph.",
    prompt:
      "Writing: Critique a mural with bold complementary colors and oversized hands. Write 2–3 sentences of neutral description, then 2–3 sentences of analysis interpreting emphasis or mood. Avoid empty praise ('amazing') without visual evidence.",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "EXPLAIN",
    asPerform: false,
    domainTag: "art",
    minChars: 55,
    conceptHints: [
      "critique",
      "describe",
      "analyze",
      "art criticism",
      "formal elements",
    ],
    misconceptionTargets: [
      "jumping to judgment without observable description",
      "using only adjectives with no link to visual evidence",
    ],
    successLooksLike:
      "Observable description first, then interpretation tied to color/scale choices.",
    scaffolds: [
      hint(
        "Describe first",
        "What is literally visible before what it 'means'.",
      ),
      step(
        "Analyze link",
        "Connect complementary contrast or scale to emphasis/mood.",
      ),
      checklist(
        "Critique checklist",
        "Description · analysis · evidence words",
      ),
    ],
    criteria: [
      {
        id: "describe",
        label: "Description",
        mustIncludeAny: [
          "color",
          "hand",
          "mural",
          "complementary",
          "oversized",
          "visible",
        ],
      },
      {
        id: "analyze",
        label: "Analysis",
        mustIncludeAny: [
          "emphas",
          "mood",
          "suggest",
          "contrast",
          "scale",
          "focus",
        ],
      },
      {
        id: "evidence",
        label: "Evidence link",
        mustIncludeAny: [
          "because",
          "shows",
          "creates",
          "by using",
          "through",
        ],
      },
    ],
  },
  {
    id: "sim-color-harmony-choice",
    kind: "simulation",
    title: "Color harmony choice",
    objective:
      "Choose a color harmony strategy for a design goal.",
    prompt:
      "Simulation: Design a calm wellness app header. Choose complementary, analogous, or monochromatic harmony. Justify why it fits 'calm', name two hues/tones you would use, and one risk of the rejected louder option.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "art",
    minChars: 45,
    conceptHints: [
      "color harmony",
      "analogous",
      "complementary",
      "monochromatic",
      "art",
      "design",
    ],
    misconceptionTargets: [
      "assuming complementary schemes are always calming",
      "picking colors without linking to the communication goal",
    ],
    successLooksLike:
      "Analogous or monochromatic choice for calm, named hues, and a risk of high-contrast complements.",
    scaffolds: [
      hint(
        "Calm cues",
        "Analogous/mono often feel quieter than strong complements.",
      ),
      step(
        "Name hues",
        "e.g., soft blues/greens; avoid neon clash unless intentional.",
      ),
      checklist(
        "Harmony checklist",
        "Harmony type · hues · rejected risk",
      ),
    ],
    criteria: [
      {
        id: "harmony",
        label: "Harmony type",
        mustIncludeAny: [
          "analogous",
          "monochromatic",
          "complementary",
          "harmony",
        ],
      },
      {
        id: "hues",
        label: "Hues/tones",
        mustIncludeAny: [
          "blue",
          "green",
          "teal",
          "gray",
          "soft",
          "hue",
          "tone",
        ],
      },
      {
        id: "risk",
        label: "Risk of louder option",
        mustIncludeAny: [
          "complement",
          "loud",
          "clash",
          "tension",
          "contrast",
          "vibrate",
        ],
      },
    ],
  },

  // —— Music ——
  {
    id: "lab-rhythm-count-measure",
    kind: "lab",
    title: "Count a measure of rhythm",
    objective:
      "Count beats in a simple meter and place note values.",
    prompt:
      "Lab: In 4/4 time, a measure has a half note then two quarter notes. Count aloud in writing (1-2-3-4), show which beats each note covers, and explain why the measure is complete.",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "music",
    minChars: 42,
    conceptHints: [
      "rhythm",
      "meter",
      "4/4",
      "note values",
      "music",
      "beat",
    ],
    misconceptionTargets: [
      "treating a half note as one beat in 4/4",
      "leaving unused beats without noticing incompleteness",
    ],
    successLooksLike:
      "Half on 1–2, quarters on 3 and 4; four beats filled.",
    scaffolds: [
      hint(
        "4/4",
        "Four quarter-note beats per measure.",
      ),
      step(
        "Half note",
        "A half note lasts two beats in this meter.",
      ),
      checklist(
        "Rhythm checklist",
        "Count written · note placement · completeness",
      ),
    ],
    criteria: [
      {
        id: "count",
        label: "Count",
        mustIncludeAny: ["1", "2", "3", "4", "count"],
      },
      {
        id: "half",
        label: "Half note beats",
        mustIncludeAny: ["half", "two beats", "1-2", "beats 1"],
      },
      {
        id: "complete",
        label: "Measure complete",
        mustIncludeAny: [
          "four",
          "complete",
          "full",
          "4/4",
          "measure",
        ],
      },
    ],
  },
  {
    id: "write-melody-vs-harmony",
    kind: "writing",
    title: "Melody vs harmony",
    objective:
      "Explain the difference between melody and harmony with examples.",
    prompt:
      "Writing: Define melody and harmony in accessible language. Give one example of a tune (melody) and how chords/support underneath illustrate harmony. Note how they work together.",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "EXPLAIN",
    asPerform: false,
    domainTag: "music",
    minChars: 48,
    conceptHints: [
      "melody",
      "harmony",
      "chord",
      "music theory",
      "music",
    ],
    misconceptionTargets: [
      "calling any simultaneous sound 'melody'",
      "treating harmony as only 'backup singers' without vertical pitch idea",
    ],
    successLooksLike:
      "Clear definitions, tune vs chord examples, and a togetherness note.",
    scaffolds: [
      hint(
        "Horizontal vs vertical",
        "Melody moves through time as a tune; harmony stacks pitches.",
      ),
      step(
        "Familiar tune",
        "Hum a song line, then imagine guitar chords underneath.",
      ),
      checklist(
        "Melody/harmony checklist",
        "Definitions · examples · together",
      ),
    ],
    criteria: [
      {
        id: "melody",
        label: "Melody",
        mustIncludeAny: ["melody", "tune", "horizontal", "single line"],
      },
      {
        id: "harmony",
        label: "Harmony",
        mustIncludeAny: ["harmony", "chord", "vertical", "support", "together"],
      },
      {
        id: "together",
        label: "How they work together",
        mustIncludeAny: [
          "together",
          "support",
          "accompany",
          "enrich",
          "underneath",
        ],
      },
    ],
  },
  {
    id: "sim-scale-major-pattern",
    kind: "simulation",
    title: "Major scale pattern",
    objective:
      "Apply the major-scale whole/half-step pattern from a tonic.",
    prompt:
      "Simulation: Starting on C, state the W-W-H-W-W-W-H pattern in words, list the resulting note names for a C major scale, and explain what the half steps between E–F and B–C accomplish.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "music",
    minChars: 45,
    conceptHints: [
      "major scale",
      "whole step",
      "half step",
      "tonic",
      "music",
    ],
    misconceptionTargets: [
      "placing half steps in the wrong scale degrees",
      "assuming all adjacent letter names are equal distances",
    ],
    successLooksLike:
      "Pattern stated, C–D–E–F–G–A–B–C listed, half-step roles noted.",
    scaffolds: [
      hint(
        "Pattern",
        "Major: whole whole half, whole whole whole half.",
      ),
      step(
        "C major naturals",
        "No sharps/flats: white keys if you picture a piano.",
      ),
      checklist(
        "Scale checklist",
        "Pattern · note list · half-step role",
      ),
    ],
    criteria: [
      {
        id: "pattern",
        label: "W/H pattern",
        mustIncludeAny: [
          "whole",
          "half",
          "w-w-h",
          "pattern",
        ],
      },
      {
        id: "notes",
        label: "C major notes",
        mustIncludeAny: ["c", "d", "e", "f", "g", "a", "b"],
      },
      {
        id: "half",
        label: "Half-step role",
        mustIncludeAny: [
          "e-f",
          "b-c",
          "half step",
          "leading",
          "resolve",
        ],
      },
    ],
  },

  // —— General education ——
  {
    id: "lab-percent-of-whole",
    kind: "lab",
    title: "Percent of a whole",
    objective:
      "Compute a percent of a whole and interpret the result.",
    prompt:
      "Lab: A test has 40 questions; you answered 30 correctly. Compute the percent correct, show the part/whole setup, and state one reason percent is useful for comparing different-sized tests.",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "general education",
    minChars: 40,
    conceptHints: [
      "percent",
      "part whole",
      "arithmetic",
      "proportion",
      "general education",
    ],
    misconceptionTargets: [
      "dividing whole by part instead of part by whole",
      "forgetting to multiply the decimal by 100",
    ],
    successLooksLike:
      "30/40 = 0.75 = 75% with a comparison rationale.",
    scaffolds: [
      hint(
        "Part ÷ whole",
        "Percent correct = correct ÷ total × 100.",
      ),
      step(
        "Compare fairly",
        "Percents let you compare 30/40 vs 18/20 on one scale.",
      ),
      checklist(
        "Percent checklist",
        "Setup · percent · comparison reason",
      ),
    ],
    criteria: [
      {
        id: "percent",
        label: "Percent correct",
        mustIncludeAny: ["75", "75%"],
      },
      {
        id: "setup",
        label: "Part/whole",
        mustIncludeAny: ["30/40", "part", "whole", "divide"],
      },
      {
        id: "compare",
        label: "Why percent helps",
        mustIncludeAny: [
          "compare",
          "different",
          "fair",
          "same scale",
          "out of 100",
        ],
      },
    ],
  },
  {
    id: "sim-budget-needs-wants",
    kind: "simulation",
    title: "Budget needs vs wants",
    objective:
      "Categorize expenses and adjust a simple student budget.",
    prompt:
      "Simulation: Monthly cash $800. Needs: rent share $400, transit $60, groceries $150. Wants: games $80, eating out $100. Identify one need vs one want, compute leftover after listed items, and propose one cut if an emergency fund is the goal.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "general education",
    minChars: 48,
    conceptHints: [
      "budget",
      "needs",
      "wants",
      "financial literacy",
      "general education",
    ],
    misconceptionTargets: [
      "labeling all spending as equally necessary",
      "ignoring leftover/cash-flow when planning savings",
    ],
    successLooksLike:
      "Need/want examples, leftover math (~$10), and a wants-side cut for savings.",
    scaffolds: [
      hint(
        "Needs first",
        "Needs keep you housed, fed, and able to get to school/work.",
      ),
      step(
        "Add then subtract",
        "Sum listed costs, subtract from $800, then choose a cut.",
      ),
      checklist(
        "Budget checklist",
        "Need · want · leftover · cut for emergency fund",
      ),
    ],
    criteria: [
      {
        id: "need-want",
        label: "Need vs want",
        mustIncludeAny: ["need", "want", "rent", "games", "eating out"],
      },
      {
        id: "leftover",
        label: "Leftover",
        mustIncludeAny: ["10", "$10", "leftover", "remain", "left"],
      },
      {
        id: "cut",
        label: "Cut for savings",
        mustIncludeAny: [
          "cut",
          "reduce",
          "games",
          "eating",
          "save",
          "emergency",
        ],
      },
    ],
  },
  {
    id: "write-study-spaced-practice",
    kind: "writing",
    title: "Spaced practice study plan",
    objective:
      "Explain why spaced practice beats cramming and outline a plan.",
    prompt:
      "Writing: Explain spaced practice in your own words, contrast it with cramming, and outline a 5-day mini plan for a vocabulary quiz (what you do each day in one line).",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "EXPLAIN",
    asPerform: false,
    domainTag: "general education",
    minChars: 52,
    conceptHints: [
      "spaced practice",
      "study skills",
      "retrieval",
      "cramming",
      "general education",
    ],
    misconceptionTargets: [
      "equating long single sessions with better retention",
      "planning only rereading without retrieval",
    ],
    successLooksLike:
      "Clear spacing rationale, cramming contrast, and a concrete multi-day plan.",
    scaffolds: [
      hint(
        "Spacing",
        "Short sessions across days beat one marathon for long-term memory.",
      ),
      step(
        "Plan shape",
        "Include self-testing, not only rereading, on most days.",
      ),
      checklist(
        "Study checklist",
        "Spaced explained · vs cramming · 5-day outline",
      ),
    ],
    criteria: [
      {
        id: "spaced",
        label: "Spaced practice",
        mustIncludeAny: [
          "spaced",
          "across days",
          "distribute",
          "spacing",
          "intervals",
        ],
      },
      {
        id: "cram",
        label: "Vs cramming",
        mustIncludeAny: [
          "cram",
          "last minute",
          "one night",
          "marathon",
          "massed",
        ],
      },
      {
        id: "plan",
        label: "Multi-day plan",
        mustIncludeAny: [
          "day 1",
          "day 2",
          "five-day",
          "monday",
          "quiz",
          "each day",
        ],
      },
    ],
  },
  {
    id: "lab-digital-source-evaluate",
    kind: "lab",
    title: "Evaluate a digital source",
    objective:
      "Evaluate a web source using authorship, evidence, and purpose cues.",
    prompt:
      "Lab: A viral post cites 'scientists say' with no named author, no date, and a shop link. Rate credibility (low/medium/high), list two red flags, and state one verification step before sharing.",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "general education",
    minChars: 45,
    conceptHints: [
      "digital literacy",
      "source evaluation",
      "credibility",
      "misinformation",
      "general education",
    ],
    misconceptionTargets: [
      "trusting viral reach as a credibility signal",
      "sharing before checking author and evidence",
    ],
    successLooksLike:
      "Low credibility rating, concrete red flags, and a verify-before-share step.",
    scaffolds: [
      hint(
        "Who / evidence / why",
        "Author, citations/data, and motive (inform vs sell).",
      ),
      step(
        "Verify",
        "Find the original study or a reputable outlet before resharing.",
      ),
      checklist(
        "Digital source checklist",
        "Rating · two red flags · verification step",
      ),
    ],
    criteria: [
      {
        id: "rating",
        label: "Credibility rating",
        mustIncludeAny: ["low", "not credible", "weak", "unreliable"],
      },
      {
        id: "flags",
        label: "Red flags",
        mustIncludeAny: [
          "no author",
          "no date",
          "shop",
          "scientists say",
          "viral",
          "link",
        ],
      },
      {
        id: "verify",
        label: "Verification step",
        mustIncludeAny: [
          "verify",
          "check",
          "source",
          "reputable",
          "before sharing",
          "fact",
        ],
      },
    ],
  },
];

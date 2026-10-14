/**
 * 2P-26 — Cross-domain Universal Activity expansion pack.
 * Merges into STRUCTURED_CHALLENGES — not a subject engine or second CMS.
 */

import type { StructuredChallenge } from "@/lib/learning/activities/structured/service";

/**
 * High-quality Adaptive-ready structured challenges across sparse domains.
 * Each item has objective, criteria, conceptHints, and enrichment where useful.
 */
export const DOMAIN_EXPANSION_CHALLENGES: StructuredChallenge[] = [
  // —— Networking ——
  {
    id: "lab-subnet-boundary",
    kind: "lab",
    title: "Subnet boundary check",
    objective:
      "Determine whether two hosts are in the same subnet and explain the boundary.",
    prompt:
      "Procedural lab: given 192.168.10.40/24 and 192.168.11.40/24, state whether they share a subnet, cite the network prefix you used, and diagnose why a ping between them would fail without a router.",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "networking",
    minChars: 50,
    conceptHints: ["subnet", "cidr", "prefix", "routing", "ip addressing", "network"],
    misconceptionTargets: [
      "assuming same first three octets always means same subnet",
      "confusing IP address with MAC address",
    ],
    successLooksLike:
      "You compare prefixes, conclude they are different /24 networks, and explain that traffic needs a router/gateway.",
    accessibility: {
      altDescription:
        "Decide if two IPv4 addresses are in the same subnet and explain the boundary.",
      reducedComplexity: true,
    },
    scaffolds: [
      {
        kind: "HINT",
        label: "Look at the prefix",
        content:
          "A /24 means the first three octets identify the network — compare those before talking about hosts.",
        level: 1,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
    ],
    criteria: [
      {
        id: "prefix",
        label: "Prefix / network id",
        mustIncludeAny: ["192.168.10", "192.168.11", "/24", "prefix", "network"],
      },
      {
        id: "same-or-not",
        label: "Same-subnet judgment",
        mustIncludeAny: ["different", "not the same", "separate", "another subnet"],
      },
      {
        id: "router",
        label: "Why ping fails",
        mustIncludeAny: ["router", "gateway", "route", "layer 3"],
      },
    ],
  },
  {
    id: "sim-routing-decision",
    kind: "simulation",
    title: "Choose the next hop",
    objective:
      "Select the correct next hop for a destination using a simple routing table.",
    prompt:
      "Simulation: destination 10.2.5.9. Routes: 10.2.0.0/16 → R1, 10.2.5.0/24 → R2, 0.0.0.0/0 → R3. State which next hop you choose, why the longest prefix wins, and what happens if R2 is down.",
    learningObjectType: "SIMULATION",
    skillFacet: "SOLVE",
    asPerform: false,
    domainTag: "networking",
    minChars: 45,
    conceptHints: ["routing", "next hop", "longest prefix", "default route", "router"],
    misconceptionTargets: [
      "always using the default route first",
      "confusing DNS resolution with packet forwarding",
    ],
    successLooksLike:
      "You pick R2 via /24 longest-match, mention longest prefix match, and describe failover to a less-specific route or default.",
    scaffolds: [
      {
        kind: "HINT",
        label: "Longest match",
        content:
          "When multiple routes match, routers prefer the most specific (longest) prefix — not the default route.",
        level: 1,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
    ],
    criteria: [
      {
        id: "nexthop",
        label: "Chosen next hop",
        mustIncludeAny: ["r2", "10.2.5.0", "/24"],
      },
      {
        id: "lpm",
        label: "Longest prefix",
        mustIncludeAny: ["longest", "most specific", "prefix match"],
      },
      {
        id: "failover",
        label: "If R2 down",
        mustIncludeAny: ["r1", "r3", "default", "fallback", "fail"],
      },
    ],
  },
  {
    id: "sim-firewall-allow-miss",
    kind: "simulation",
    title: "Firewall rule miss",
    objective:
      "Diagnose why a legitimate service is blocked by rule order.",
    prompt:
      "Simulation: HTTPS to 203.0.113.10 is blocked. Rules top-to-bottom: (1) deny any to 203.0.113.0/24, (2) allow tcp/443 to 203.0.113.10. Explain which rule matches first, why allow never runs, and how to fix order without opening the whole subnet.",
    learningObjectType: "SIMULATION",
    skillFacet: "SOLVE",
    asPerform: false,
    domainTag: "networking",
    minChars: 50,
    conceptHints: [
      "firewall",
      "acl",
      "rule order",
      "network security",
      "https",
      "deny",
    ],
    misconceptionTargets: ["assuming later allow overrides earlier deny"],
    successLooksLike:
      "You identify first-match deny, explain allow is unreachable, and propose placing a specific allow above the broad deny.",
    criteria: [
      {
        id: "first-match",
        label: "First matching rule",
        mustIncludeAny: ["deny", "first", "top", "before"],
      },
      {
        id: "allow-skip",
        label: "Allow never evaluated",
        mustIncludeAny: ["never", "unreachable", "skipped", "after deny"],
      },
      {
        id: "fix",
        label: "Reorder fix",
        mustIncludeAny: ["reorder", "above", "before deny", "specific allow", "move"],
      },
    ],
  },
  {
    id: "sim-phishing-cues",
    kind: "simulation",
    title: "Phishing cue triage",
    objective:
      "Identify phishing indicators and choose a safe response (educational security).",
    prompt:
      "Simulation: email claims IT reset is required, link goes to http://it-helpdesk-secure.example.ru/login, sender is helpdesk@company-mail.net. List two suspicious cues, state whether you click the link, and what safe action you take instead.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "cybersecurity",
    minChars: 45,
    conceptHints: [
      "phishing",
      "social engineering",
      "security",
      "cybersecurity",
      "email",
    ],
    misconceptionTargets: ["trusting display name over domain"],
    successLooksLike:
      "You cite domain/URL/http cues, refuse the link, and report/verify via known IT channel.",
    accessibility: {
      altDescription:
        "Evaluate a suspicious password-reset email and choose a safe response.",
      reducedComplexity: true,
    },
    criteria: [
      {
        id: "cues",
        label: "Suspicious cues",
        mustIncludeAny: ["domain", "http", ".ru", "sender", "urgent", "mismatch"],
      },
      {
        id: "no-click",
        label: "Do not click",
        mustIncludeAny: ["not click", "don't click", "do not open", "avoid", "refuse"],
      },
      {
        id: "safe",
        label: "Safe action",
        mustIncludeAny: ["report", "verify", "it helpdesk", "official", "delete", "forward"],
      },
    ],
  },
  {
    id: "lab-password-policy",
    kind: "lab",
    title: "Password policy check",
    objective:
      "Apply a password policy checklist and reject a weak credential set.",
    prompt:
      "Procedural lab: policy requires length ≥ 12, mixed case, a digit, and a symbol; reuse across systems is forbidden. Candidate password: Summer2024. State which rules fail, why reuse is risky, and propose one stronger pattern without writing the full password.",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "cybersecurity",
    minChars: 40,
    conceptHints: ["password", "authentication", "security policy", "cybersecurity"],
    criteria: [
      {
        id: "fail-rules",
        label: "Failed rules",
        mustIncludeAny: ["length", "symbol", "12", "special"],
      },
      {
        id: "reuse",
        label: "Reuse risk",
        mustIncludeAny: ["reuse", "breach", "credential stuffing", "same password"],
      },
      {
        id: "stronger",
        label: "Stronger approach",
        mustIncludeAny: ["passphrase", "manager", "unique", "longer", "random"],
      },
    ],
  },

  // —— Nursing / health education (no diagnosis claims) ——
  {
    id: "sim-med-safety-five-rights",
    kind: "simulation",
    title: "Medication safety check",
    objective:
      "Apply the five rights of medication administration in an educational scenario.",
    prompt:
      "Educational simulation (not clinical advice): MAR says Patient A, metoprolol 25 mg oral now. You have a cup labeled Patient B, metoprolol 50 mg. Which rights fail, what do you do before giving anything, and why skipping the check is unsafe?",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "nursing",
    minChars: 50,
    conceptHints: [
      "medication safety",
      "five rights",
      "patient safety",
      "nursing",
      "mar",
    ],
    misconceptionTargets: ["assuming similar names mean the same patient"],
    successLooksLike:
      "You flag wrong patient and wrong dose, hold the med, and re-verify against MAR/identity.",
    accessibility: {
      altDescription:
        "Compare a medication cup to the MAR and identify safety mismatches.",
      extendedTimeSuggested: true,
    },
    criteria: [
      {
        id: "rights",
        label: "Failed rights",
        mustIncludeAny: ["patient", "dose", "right patient", "right dose", "wrong"],
      },
      {
        id: "hold",
        label: "Safe action",
        mustIncludeAny: ["hold", "do not give", "verify", "check mar", "recheck"],
      },
      {
        id: "why",
        label: "Why unsafe",
        mustIncludeAny: ["harm", "error", "unsafe", "because", "risk"],
      },
    ],
  },
  {
    id: "sim-vital-signs-trend",
    kind: "simulation",
    title: "Vital signs trend review",
    objective:
      "Interpret a vital-sign trend and escalate appropriately in an educational case.",
    prompt:
      "Educational simulation: BP trend 118/72 → 128/80 → 142/92 over three hours; patient reports new headache. State the concerning trend, one hypothesis about status change (not a diagnosis), and who/what you notify next in a learning hospital protocol.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "nursing",
    minChars: 45,
    conceptHints: ["vital signs", "blood pressure", "trend", "escalation", "nursing"],
    criteria: [
      {
        id: "trend",
        label: "Rising BP / concern",
        mustIncludeAny: ["rising", "increasing", "upward", "142", "hypertension", "elevated"],
      },
      {
        id: "symptom",
        label: "Linked symptom",
        mustIncludeAny: ["headache", "symptom", "patient report"],
      },
      {
        id: "escalate",
        label: "Escalate",
        mustIncludeAny: ["notify", "nurse", "provider", "escalate", "report", "charge"],
      },
    ],
  },
  {
    id: "sim-fall-risk-priority",
    kind: "simulation",
    title: "Fall-risk prioritization",
    objective:
      "Prioritize fall-prevention actions for an at-risk educational patient case.",
    prompt:
      "Educational simulation: older adult, first night after surgery, dizzy when standing, call light out of reach. Rank the first two actions you take, explain why environment comes before documentation, and name one ongoing prevention step.",
    learningObjectType: "SIMULATION",
    skillFacet: "SOLVE",
    asPerform: false,
    domainTag: "nursing",
    minChars: 45,
    conceptHints: ["fall risk", "patient safety", "prioritization", "nursing"],
    criteria: [
      {
        id: "immediate",
        label: "Immediate safety",
        mustIncludeAny: ["call light", "bed", "assist", "sit", "stay with", "lower"],
      },
      {
        id: "before-doc",
        label: "Environment before paperwork",
        mustIncludeAny: ["before", "first", "environment", "safety first", "then document"],
      },
      {
        id: "ongoing",
        label: "Ongoing prevention",
        mustIncludeAny: ["non-slip", "night light", "bed alarm", "hourly", "assist"],
      },
    ],
  },

  // —— Business ——
  {
    id: "sim-demand-shift-vs-move",
    kind: "simulation",
    title: "Demand shift vs movement",
    objective:
      "Distinguish a movement along the demand curve from a demand shift.",
    prompt:
      "Simulation: coffee price rises and cups sold fall. Separately, a health study increases preference for coffee at every price. For each event, say shift vs movement, which curve/direction, and one real-world signal you would watch.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "business",
    minChars: 55,
    conceptHints: [
      "supply and demand",
      "demand curve",
      "shift",
      "economics",
      "business",
    ],
    misconceptionTargets: [
      "calling a price-driven quantity change a demand shift",
    ],
    successLooksLike:
      "Price rise → movement along demand; preference shock → rightward demand shift; cite observable signals.",
    criteria: [
      {
        id: "movement",
        label: "Price event = movement",
        mustIncludeAny: ["movement", "along", "quantity demanded"],
      },
      {
        id: "shift",
        label: "Preference = shift",
        mustIncludeAny: ["shift", "right", "increase in demand"],
      },
      {
        id: "signal",
        label: "Observable signal",
        mustIncludeAny: ["sales", "survey", "search", "inventory", "orders"],
      },
    ],
  },
  {
    id: "sim-revenue-vs-profit",
    kind: "simulation",
    title: "Revenue vs profit",
    objective:
      "Separate revenue from profit using a simple operations scenario.",
    prompt:
      "Simulation: café sells 200 lattes at $4; beans/milk/cups cost $1.50 each; fixed rent $200 for the period. Compute revenue, total variable cost, and profit. State which metric managers confuse most often and why.",
    learningObjectType: "SIMULATION",
    skillFacet: "SOLVE",
    asPerform: false,
    domainTag: "business",
    minChars: 40,
    conceptHints: ["revenue", "profit", "cost", "operations", "business", "margin"],
    misconceptionTargets: ["treating revenue as profit"],
    criteria: [
      {
        id: "revenue",
        label: "Revenue",
        mustIncludeAny: ["800", "$800", "revenue"],
      },
      {
        id: "profit",
        label: "Profit",
        mustIncludeAny: ["300", "$300", "profit"],
      },
      {
        id: "confusion",
        label: "Common confusion",
        mustIncludeAny: ["confuse", "not the same", "costs", "expenses"],
      },
    ],
  },
  {
    id: "lab-ops-bottleneck",
    kind: "lab",
    title: "Operations bottleneck lab",
    objective:
      "Identify the bottleneck step in a simple process and propose one fix.",
    prompt:
      "Procedural lab: order → prep (2 min) → cook (8 min) → plate (1 min) → serve. Throughput is limited; queues form at cook. Name the bottleneck, one capacity action, and one quality risk if you only speed plating.",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "business",
    minChars: 40,
    conceptHints: ["bottleneck", "operations", "throughput", "process", "management"],
    criteria: [
      {
        id: "bottleneck",
        label: "Bottleneck step",
        mustIncludeAny: ["cook", "cooking", "8 min"],
      },
      {
        id: "capacity",
        label: "Capacity action",
        mustIncludeAny: ["second", "parallel", "staff", "equipment", "capacity"],
      },
      {
        id: "quality",
        label: "Quality risk",
        mustIncludeAny: ["quality", "error", "cold", "wrong", "rush"],
      },
    ],
  },
  {
    id: "write-leadership-tradeoff",
    kind: "writing",
    title: "Leadership tradeoff memo",
    objective:
      "Explain a leadership tradeoff with stakeholders and a reasoned recommendation.",
    prompt:
      "Write a short memo: ship a feature this Friday with known bugs vs delay one week for quality. Name two stakeholders, one risk of each option, and your recommendation with because-reasoning.",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "EXPLAIN",
    asPerform: false,
    domainTag: "business",
    minChars: 60,
    conceptHints: ["leadership", "management", "tradeoff", "stakeholder", "decision"],
    criteria: [
      {
        id: "stakeholders",
        label: "Stakeholders",
        mustIncludeAny: ["customer", "team", "support", "manager", "user"],
      },
      {
        id: "risks",
        label: "Risks both sides",
        mustIncludeAny: ["bug", "delay", "trust", "revenue", "burnout"],
      },
      {
        id: "recommend",
        label: "Recommendation",
        mustIncludeAny: ["recommend", "because", "therefore", "should"],
      },
    ],
  },

  // —— Math / science ——
  {
    id: "lab-proportional-scale",
    kind: "lab",
    title: "Proportional scaling lab",
    objective:
      "Scale a recipe using proportional reasoning and check consistency.",
    prompt:
      "Procedural lab: recipe for 4 servings uses 6 cups broth. Scale to 10 servings. Show the proportion, compute broth needed, and explain one common sign/scale error to avoid.",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "mathematics",
    minChars: 40,
    conceptHints: [
      "proportion",
      "proportional reasoning",
      "ratio",
      "scale",
      "math",
    ],
    misconceptionTargets: ["adding 6 instead of scaling by 10/4"],
    successLooksLike:
      "You form 6/4 = x/10 (or equivalent), get 15 cups, and warn against additive mistakes.",
    criteria: [
      {
        id: "setup",
        label: "Proportion setup",
        mustIncludeAny: ["6/4", "10/4", "ratio", "proportion", "cross"],
      },
      {
        id: "result",
        label: "Scaled amount",
        mustIncludeAny: ["15", "15 cups"],
      },
      {
        id: "error",
        label: "Common error",
        mustIncludeAny: ["add", "additive", "forget", "scale", "multiply"],
      },
    ],
  },
  {
    id: "lab-stoichiometry-mole-ratio",
    kind: "lab",
    title: "Mole-ratio stoichiometry lab",
    objective:
      "Use a balanced equation mole ratio to find product amount (educational).",
    prompt:
      "Procedural lab: 2 H₂ + O₂ → 2 H₂O. Starting with 4 mol H₂ and excess O₂, how many moles of water form? Show the ratio used and one unit you must keep consistent.",
    learningObjectType: "LAB",
    skillFacet: "SOLVE",
    asPerform: true,
    domainTag: "chemistry",
    minChars: 35,
    conceptHints: ["stoichiometry", "mole ratio", "chemistry", "balanced equation"],
    misconceptionTargets: ["using mass ratios without converting to moles"],
    criteria: [
      {
        id: "ratio",
        label: "Mole ratio",
        mustIncludeAny: ["2:2", "1:1", "mole", "ratio"],
      },
      {
        id: "answer",
        label: "Moles water",
        mustIncludeAny: ["4 mol", "4 moles", "4"],
      },
      {
        id: "unit",
        label: "Consistent unit",
        mustIncludeAny: ["mole", "mol", "not grams", "consistent"],
      },
    ],
  },
  {
    id: "sim-linear-vs-nonlinear",
    kind: "simulation",
    title: "Linear vs nonlinear growth",
    objective:
      "Decide whether a relationship is linear from table values and justify.",
    prompt:
      "Simulation: x=1,2,3,4 → y=2,4,8,16. Is y linear in x? What pattern do you see, why treating it as linear fails for prediction at x=5, and what family of growth fits better?",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "mathematics",
    minChars: 40,
    conceptHints: ["linear", "nonlinear", "exponential", "proportional", "math"],
    misconceptionTargets: ["forcing a linear model on exponential data"],
    criteria: [
      {
        id: "not-linear",
        label: "Not linear",
        mustIncludeAny: ["not linear", "nonlinear", "exponential", "doubling"],
      },
      {
        id: "pattern",
        label: "Pattern",
        mustIncludeAny: ["double", "×2", "*2", "multiply", "geometric"],
      },
      {
        id: "predict",
        label: "Prediction caution",
        mustIncludeAny: ["32", "fail", "wrong", "underestimate", "linear would"],
      },
    ],
  },
  {
    id: "write-claim-evidence-science",
    kind: "writing",
    title: "Scientific claim with evidence",
    objective:
      "Write a claim-evidence-reasoning paragraph about an experimental result.",
    prompt:
      "A plant under red light grew 3 cm more than under green light in two weeks (n=10 each). Write CER: claim, cite the evidence numbers, and reasoning linking light quality to growth — avoid overclaiming causation beyond the study.",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "EXPLAIN",
    asPerform: false,
    domainTag: "science",
    minChars: 55,
    conceptHints: [
      "claim evidence reasoning",
      "scientific reasoning",
      "biology",
      "experiment",
    ],
    criteria: [
      {
        id: "claim",
        label: "Claim",
        mustIncludeAny: ["claim", "grew more", "red light", "higher growth"],
      },
      {
        id: "evidence",
        label: "Evidence",
        mustIncludeAny: ["3 cm", "n=10", "two weeks", "green"],
      },
      {
        id: "limit",
        label: "Cautious reasoning",
        mustIncludeAny: ["because", "suggest", "may", "correlate", "limit"],
      },
    ],
  },

  // —— Trades / technical ——
  {
    id: "lab-electrical-lockout",
    kind: "lab",
    title: "Lockout/tagout sequence",
    objective:
      "Order lockout/tagout steps before electrical work (safety education).",
    prompt:
      "Procedural lab: you must service a 240 V panel feeder. List the lockout sequence (notify → isolate → lock/tag → verify zero energy), state what you verify with a meter, and one mistake that re-energizes hazard.",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "electrical",
    minChars: 50,
    conceptHints: [
      "lockout",
      "tagout",
      "electrical safety",
      "loto",
      "zero energy",
    ],
    misconceptionTargets: ["testing after unlocking"],
    successLooksLike:
      "You order LOTO steps, verify absence of voltage, and warn against removing lock early.",
    criteria: [
      {
        id: "sequence",
        label: "LOTO sequence",
        mustIncludeAny: ["lock", "tag", "isolate", "notify", "verify"],
      },
      {
        id: "meter",
        label: "Verify zero",
        mustIncludeAny: ["meter", "voltage", "zero", "dead", "test"],
      },
      {
        id: "mistake",
        label: "Hazardous mistake",
        mustIncludeAny: ["remove lock", "assume off", "skip", "energize"],
      },
    ],
  },
  {
    id: "lab-multimeter-continuity",
    kind: "lab",
    title: "Continuity troubleshooting",
    objective:
      "Use continuity ideas to locate an open in a simple series circuit.",
    prompt:
      "Procedural lab: lamp out; fuse ok; switch closed. You measure continuity across the lamp filament (open) and across the switch (closed). Where is the fault, what reading pattern supports it, and what do you replace/check next?",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "electrical",
    minChars: 40,
    conceptHints: [
      "continuity",
      "open circuit",
      "multimeter",
      "troubleshooting",
      "electrical",
    ],
    criteria: [
      {
        id: "fault",
        label: "Fault location",
        mustIncludeAny: ["lamp", "filament", "bulb", "open"],
      },
      {
        id: "reading",
        label: "Reading pattern",
        mustIncludeAny: ["open", "no continuity", "infinite", "switch closed"],
      },
      {
        id: "next",
        label: "Next action",
        mustIncludeAny: ["replace", "lamp", "bulb", "retest"],
      },
    ],
  },
  {
    id: "sim-obd-misfire",
    kind: "simulation",
    title: "OBD misfire triage",
    objective:
      "Interpret an educational OBD misfire code and choose the next test.",
    prompt:
      "Educational simulation: code P0302 (cylinder 2 misfire), rough idle, recent spark plug service on cylinders 1/3/4 only. List the likely focus cylinder, one non-invasive next test, and why guessing injectors first is weak.",
    learningObjectType: "SIMULATION",
    skillFacet: "SOLVE",
    asPerform: false,
    domainTag: "automotive",
    minChars: 45,
    conceptHints: [
      "obd",
      "misfire",
      "diagnostics",
      "automotive",
      "cylinder",
      "p0302",
    ],
    criteria: [
      {
        id: "cylinder",
        label: "Cylinder focus",
        mustIncludeAny: ["cylinder 2", "cyl 2", "#2"],
      },
      {
        id: "test",
        label: "Next test",
        mustIncludeAny: ["spark", "plug", "coil", "compression", "swap"],
      },
      {
        id: "avoid-guess",
        label: "Avoid blind guess",
        mustIncludeAny: ["evidence", "test first", "not guess", "because", "data"],
      },
    ],
  },
  {
    id: "sim-brake-symptom",
    kind: "simulation",
    title: "Brake symptom branch",
    objective:
      "Branch a brake symptom to a safe next inspection (educational).",
    prompt:
      "Educational simulation: pedal sinks slowly at stops; fluid level low; no warning lamp. Name the primary safety concern, one inspection target, and whether the vehicle should be driven to class — justify.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "automotive",
    minChars: 40,
    conceptHints: ["brakes", "hydraulics", "diagnostics", "automotive", "safety"],
    criteria: [
      {
        id: "concern",
        label: "Safety concern",
        mustIncludeAny: ["leak", "pressure", "fail", "unsafe", "fluid"],
      },
      {
        id: "inspect",
        label: "Inspection",
        mustIncludeAny: ["line", "caliper", "master", "hose", "leak"],
      },
      {
        id: "drive",
        label: "Drive decision",
        mustIncludeAny: ["not drive", "tow", "unsafe to drive", "do not drive"],
      },
    ],
  },

  // —— History / humanities ——
  {
    id: "write-source-bias",
    kind: "writing",
    title: "Source bias analysis",
    objective:
      "Evaluate a historical source for purpose, audience, and limitation.",
    prompt:
      "A 1917 factory poster urges workers to increase output for the war. Write: author/purpose, intended audience, one limitation for using it as evidence of workers’ private opinions, and one corroboration strategy.",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "EXPLAIN",
    asPerform: false,
    domainTag: "history",
    minChars: 60,
    conceptHints: [
      "source analysis",
      "bias",
      "primary source",
      "history",
      "corroboration",
    ],
    misconceptionTargets: ["treating propaganda as neutral description"],
    criteria: [
      {
        id: "purpose",
        label: "Purpose",
        mustIncludeAny: ["purpose", "persuade", "propaganda", "encourage"],
      },
      {
        id: "limit",
        label: "Limitation",
        mustIncludeAny: ["bias", "limit", "not private", "one-sided", "agenda"],
      },
      {
        id: "corroborate",
        label: "Corroboration",
        mustIncludeAny: ["diary", "letter", "newspaper", "corroborat", "compare"],
      },
    ],
  },
  {
    id: "write-cause-effect-claim",
    kind: "writing",
    title: "Cause and effect with caution",
    objective:
      "Argue a historical cause-effect claim without equating correlation to causation.",
    prompt:
      "City A expands rail lines (1890–1910); population and factories rise. Write a claim that rail expansion contributed to growth, cite the coincidence carefully, and name one alternative/confounding factor.",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "EXPLAIN",
    asPerform: false,
    domainTag: "history",
    minChars: 55,
    conceptHints: [
      "cause and effect",
      "causation",
      "correlation",
      "history",
      "evidence",
    ],
    misconceptionTargets: ["correlation equals causation"],
    criteria: [
      {
        id: "claim",
        label: "Causal claim (careful)",
        mustIncludeAny: ["contributed", "helped", "because", "led to"],
      },
      {
        id: "evidence",
        label: "Timing evidence",
        mustIncludeAny: ["1890", "1910", "rail", "population", "factories"],
      },
      {
        id: "confound",
        label: "Alternative factor",
        mustIncludeAny: ["immigration", "policy", "port", "other", "confound", "also"],
      },
    ],
  },
  {
    id: "presentation-primary-source-talk",
    kind: "presentation",
    title: "Primary source briefing",
    objective:
      "Outline a short presentation that situates a primary source in context.",
    prompt:
      "Outline a 3-slide briefing on a wartime letter home: (1) context/who, (2) what it claims, (3) how historians should use it carefully. Include one speaker note on bias.",
    learningObjectType: "PRESENTATION_PRACTICE",
    skillFacet: "EXPLAIN",
    asPerform: false,
    domainTag: "history",
    minChars: 50,
    conceptHints: [
      "presentation",
      "primary source",
      "history",
      "context",
      "bias",
    ],
    criteria: [
      {
        id: "slides",
        label: "Structure",
        mustIncludeAny: ["slide", "context", "claim", "use", "1)", "2)", "3)"],
      },
      {
        id: "bias-note",
        label: "Bias note",
        mustIncludeAny: ["bias", "perspective", "limited", "caution"],
      },
      {
        id: "audience",
        label: "Audience awareness",
        mustIncludeAny: ["historian", "audience", "student", "class"],
      },
    ],
  },

  // —— Writing craft ——
  {
    id: "write-topic-sentence-control",
    kind: "writing",
    title: "Topic sentence control",
    objective:
      "Write a paragraph with a controlling topic sentence and two supporting points.",
    prompt:
      "Topic: why spaced practice beats cramming for retention. Write one topic sentence, two evidence/reason sentences, and a closing sentence that does not introduce a new claim.",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "EXPLAIN",
    asPerform: false,
    domainTag: "english",
    minChars: 70,
    conceptHints: [
      "topic sentence",
      "paragraph",
      "writing",
      "spaced practice",
      "argument",
    ],
    criteria: [
      {
        id: "topic",
        label: "Topic sentence",
        mustIncludeAny: ["spaced", "cramming", "retention", "memory"],
      },
      {
        id: "support",
        label: "Support",
        mustIncludeAny: ["because", "for example", "research", "practice"],
      },
      {
        id: "close",
        label: "Close without new claim",
        mustIncludeAny: ["therefore", "overall", "in short", "thus"],
      },
    ],
  },
  {
    id: "write-counterargument",
    kind: "writing",
    title: "Counterargument and rebuttal",
    objective:
      "Steelman an opposing view, then rebut with evidence-focused reasoning.",
    prompt:
      "Claim: schools should start later. Write the strongest counterargument (about daycare/jobs/sports), then a rebuttal that grants a point and still defends a later start with because-reasoning.",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "EXPLAIN",
    asPerform: false,
    domainTag: "english",
    minChars: 70,
    conceptHints: [
      "counterargument",
      "rebuttal",
      "argument",
      "writing",
      "thesis",
    ],
    criteria: [
      {
        id: "counter",
        label: "Counterargument",
        mustIncludeAny: ["however", "opponents", "counter", "against", "jobs", "sports"],
      },
      {
        id: "rebut",
        label: "Rebuttal",
        mustIncludeAny: ["although", "still", "because", "rebut", "respond"],
      },
      {
        id: "sleep",
        label: "Core claim retained",
        mustIncludeAny: ["sleep", "later start", "adolescent", "attention"],
      },
    ],
  },
  {
    id: "write-revision-clarity",
    kind: "writing",
    title: "Revision for clarity",
    objective:
      "Revise a muddy sentence into a clear, specific claim.",
    prompt:
      "Original: \"Things about the economy got weird which impacted stuff for people.\" Rewrite with a precise subject, concrete change, and who was affected. Then name one clarity principle you applied.",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "english",
    minChars: 40,
    conceptHints: ["revision", "clarity", "editing", "writing", "precise"],
    misconceptionTargets: ["equating longer sentences with better writing"],
    criteria: [
      {
        id: "precise",
        label: "Precise rewrite",
        mustIncludeAny: ["inflation", "unemployment", "prices", "wages", "household"],
      },
      {
        id: "principle",
        label: "Clarity principle",
        mustIncludeAny: ["specific", "concrete", "precise", "replace vague", "clear"],
      },
      {
        id: "actor",
        label: "Clear actor",
        mustIncludeAny: ["workers", "families", "consumers", "businesses", "people who"],
      },
    ],
  },
];

export function listDomainExpansionStructuredChallenges(): StructuredChallenge[] {
  return DOMAIN_EXPANSION_CHALLENGES;
}

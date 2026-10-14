/**
 * Content expansion queue — trades & applied-tech structured challenges.
 * Staging catalog only; not a subject engine.
 */

import type { StructuredChallenge } from "@/lib/learning/activities/structured/service";
import { hint, step, checklist } from "./helpers";

export const CONTENT_EXPANSION_TRADES_CHALLENGES: StructuredChallenge[] = [
  // —— HVAC ——
  {
    id: "lab-hvac-safety-ppe",
    kind: "lab",
    title: "HVAC safety and PPE",
    objective:
      "Select PPE and safety controls for a residential service call.",
    prompt:
      "Lab: You will recover refrigerant outdoors on a rooftop unit, then open an electrical panel. List required PPE/eye protection, one electrical lockout idea, and one refrigerant-handling safety rule (educational shop practice — follow local codes).",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "hvac",
    minChars: 50,
    conceptHints: [
      "hvac",
      "ppe",
      "lockout",
      "refrigerant",
      "safety",
    ],
    misconceptionTargets: [
      "treating refrigerant work as glove-optional because it 'just feels cold'",
      "opening a live panel without verifying zero energy",
    ],
    successLooksLike:
      "Eye/hand PPE, LOTO/verify idea, and a recovery/venting safety rule.",
    scaffolds: [
      hint(
        "Two hazards",
        "Chemical/pressure hazards and electrical hazards often appear on one call.",
      ),
      step(
        "Before conductors",
        "Lock/tag and verify de-energized before probing live parts.",
      ),
      checklist(
        "HVAC safety checklist",
        "PPE · electrical control · refrigerant rule",
      ),
    ],
    criteria: [
      {
        id: "ppe",
        label: "PPE",
        mustIncludeAny: [
          "gloves",
          "goggles",
          "eye",
          "ppe",
          "safety glasses",
        ],
      },
      {
        id: "electrical",
        label: "Electrical safety",
        mustIncludeAny: [
          "lockout",
          "loto",
          "de-energ",
          "verify",
          "disconnect",
        ],
      },
      {
        id: "refrigerant",
        label: "Refrigerant rule",
        mustIncludeAny: [
          "recover",
          "vent",
          "epa",
          "cylinder",
          "pressure",
          "refrigerant",
        ],
      },
    ],
  },
  {
    id: "sim-refrigeration-cycle-order",
    kind: "simulation",
    title: "Refrigeration cycle order",
    objective:
      "Order the basic vapor-compression cycle components and states.",
    prompt:
      "Simulation: Place compressor, condenser, metering device, and evaporator in cycle order. For each, state whether refrigerant is mostly rejecting heat, absorbing heat, or raising pressure. Keep it educational basics.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "hvac",
    minChars: 52,
    conceptHints: [
      "refrigeration cycle",
      "compressor",
      "condenser",
      "evaporator",
      "hvac",
    ],
    misconceptionTargets: [
      "swapping condenser and evaporator heat roles",
      "thinking the metering device raises pressure like a compressor",
    ],
    successLooksLike:
      "Compressor → condenser → metering → evaporator with correct heat/pressure roles.",
    scaffolds: [
      hint(
        "Pressure raiser",
        "Only the compressor significantly raises refrigerant pressure.",
      ),
      step(
        "Heat story",
        "Condenser rejects heat outdoors; evaporator absorbs heat indoors (cooling mode).",
      ),
      checklist(
        "Cycle checklist",
        "Order · heat reject · heat absorb · pressure rise",
      ),
    ],
    criteria: [
      {
        id: "order",
        label: "Component order",
        mustIncludeAny: [
          "compressor",
          "condenser",
          "metering",
          "expansion",
          "evaporator",
        ],
      },
      {
        id: "reject",
        label: "Heat rejection",
        mustIncludeAny: ["condenser", "reject", "outdoor", "heat out"],
      },
      {
        id: "absorb",
        label: "Heat absorption",
        mustIncludeAny: ["evaporator", "absorb", "indoor", "picks up heat"],
      },
    ],
  },
  {
    id: "lab-hvac-superheat-intuition",
    kind: "lab",
    title: "Superheat intuition",
    objective:
      "Reason about high/low superheat without claiming field certification.",
    prompt:
      "Lab (diagnostics basics): Superheat is temperature above saturation at the evaporator outlet/suction. If measured superheat is much higher than target on a fixed-orifice system, propose whether the coil may be underfed or overfed and one safe next check (airflow, charge symptoms) — educational reasoning only.",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "hvac",
    minChars: 50,
    conceptHints: [
      "superheat",
      "evaporator",
      "diagnostics",
      "hvac",
      "refrigerant charge",
    ],
    misconceptionTargets: [
      "adding charge blindly without airflow or heat-load context",
      "confusing superheat with subcooling roles",
    ],
    successLooksLike:
      "High superheat → likely underfed evaporator; name a check like airflow or charge procedure context.",
    scaffolds: [
      hint(
        "High SH meaning",
        "High superheat often means vapor is overheating because liquid feed is insufficient.",
      ),
      step(
        "Don’t skip airflow",
        "Dirty filters/coils change heat load and readings — check airflow context.",
      ),
      checklist(
        "Superheat checklist",
        "High/low call · under/overfed idea · next check",
      ),
    ],
    criteria: [
      {
        id: "high",
        label: "High superheat implication",
        mustIncludeAny: [
          "underfed",
          "low charge",
          "starv",
          "insufficient",
          "high superheat",
        ],
      },
      {
        id: "definition",
        label: "Superheat idea",
        mustIncludeAny: [
          "above saturation",
          "superheat",
          "suction",
          "evaporator",
        ],
      },
      {
        id: "check",
        label: "Next check",
        mustIncludeAny: [
          "airflow",
          "filter",
          "charge",
          "coil",
          "restriction",
        ],
      },
    ],
  },
  {
    id: "sim-heat-pump-defrost",
    kind: "simulation",
    title: "Heat pump defrost scenario",
    objective:
      "Solve a heating-mode frost scenario with defrost logic.",
    prompt:
      "Simulation: Outdoor heat-pump coil is heavily frosted in heating mode; indoor supply air feels cool. Explain why frost hurts capacity, what defrost mode roughly does (temporary cooling/reverse idea), and one observation that distinguishes normal defrost from a failed outdoor fan.",
    learningObjectType: "SIMULATION",
    skillFacet: "SOLVE",
    asPerform: false,
    domainTag: "hvac",
    minChars: 55,
    conceptHints: [
      "heat pump",
      "defrost",
      "frost",
      "heating mode",
      "hvac",
    ],
    misconceptionTargets: [
      "assuming frost always means the unit is out of refrigerant",
      "confusing defrost operation with a permanent cooling call",
    ],
    successLooksLike:
      "Frost blocks heat transfer; defrost clears ice (often reverse-cycle); contrast with no-fan symptoms.",
    scaffolds: [
      hint(
        "Ice is insulation",
        "Frost reduces outdoor coil heat absorption in heating.",
      ),
      step(
        "Defrost job",
        "System temporarily prioritizes melting ice — indoor air may feel cooler briefly.",
      ),
      checklist(
        "Defrost checklist",
        "Why frost hurts · defrost action · vs failed fan clue",
      ),
    ],
    criteria: [
      {
        id: "frost",
        label: "Frost impact",
        mustIncludeAny: [
          "frost",
          "ice",
          "capacity",
          "heat transfer",
          "insulat",
        ],
      },
      {
        id: "defrost",
        label: "Defrost action",
        mustIncludeAny: [
          "defrost",
          "reverse",
          "melt",
          "temporary",
          "cooling",
        ],
      },
      {
        id: "fan",
        label: "Vs failed fan",
        mustIncludeAny: [
          "fan",
          "airflow",
          "not spinning",
          "normal defrost",
          "observe",
        ],
      },
    ],
  },

  // —— Electrical ——
  {
    id: "lab-ohms-law-calc-reason",
    kind: "lab",
    title: "Ohm's law calculate and reason",
    objective:
      "Apply V = IR to find current and interpret the result.",
    prompt:
      "Lab: A resistive heater is 24 Ω across 120 V (ideal DC/ resistive model). Compute current, show Ohm’s law setup, and state what happens to current if resistance falls with the same voltage (safety intuition).",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "electrical",
    minChars: 45,
    conceptHints: [
      "ohm's law",
      "voltage",
      "current",
      "resistance",
      "electrical",
    ],
    misconceptionTargets: [
      "rearranging Ohm’s law incorrectly (I = R/V)",
      "assuming lower resistance always means safer current",
    ],
    successLooksLike:
      "I = 5 A from 120/24; lower R → higher I at fixed V.",
    scaffolds: [
      hint(
        "I = V/R",
        "Current equals voltage divided by resistance.",
      ),
      step(
        "Safety intuition",
        "If R drops (fault/short path), current climbs — overcurrent risk.",
      ),
      checklist(
        "Ohm checklist",
        "Setup · current value · lower-R effect",
      ),
    ],
    criteria: [
      {
        id: "current",
        label: "Current value",
        mustIncludeAny: ["5", "5 a", "5 amp"],
      },
      {
        id: "law",
        label: "Ohm setup",
        mustIncludeAny: ["v/r", "120/24", "ohm", "i ="],
      },
      {
        id: "lower-r",
        label: "Lower R effect",
        mustIncludeAny: [
          "current increases",
          "higher current",
          "more current",
          "rises",
        ],
      },
    ],
  },
  {
    id: "sim-series-parallel-current",
    kind: "simulation",
    title: "Series vs parallel current",
    objective:
      "Compare current behavior in series and parallel lamp circuits.",
    prompt:
      "Simulation: Two identical lamps. In series on a supply, what is true about current through each? In parallel, what is true about voltage across each? Predict which configuration keeps one lamp lit if the other burns open.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "electrical",
    minChars: 48,
    conceptHints: [
      "series",
      "parallel",
      "current",
      "voltage",
      "electrical",
    ],
    misconceptionTargets: [
      "assuming series lamps each get full supply voltage",
      "thinking an open lamp in parallel kills the whole circuit",
    ],
    successLooksLike:
      "Same current in series; same voltage in parallel; parallel keeps the other lamp lit.",
    scaffolds: [
      hint(
        "Series current",
        "One path → same current through each series element.",
      ),
      step(
        "Parallel voltage",
        "Parallel branches share the supply voltage.",
      ),
      checklist(
        "Circuit checklist",
        "Series current · parallel voltage · open-lamp survivor",
      ),
    ],
    criteria: [
      {
        id: "series",
        label: "Series current",
        mustIncludeAny: [
          "same current",
          "equal current",
          "series current",
          "one path",
        ],
      },
      {
        id: "parallel",
        label: "Parallel voltage",
        mustIncludeAny: [
          "same voltage",
          "equal voltage",
          "parallel voltage",
          "across each",
        ],
      },
      {
        id: "open",
        label: "Open lamp result",
        mustIncludeAny: [
          "parallel",
          "still lit",
          "other lamp",
          "remains on",
          "branch",
        ],
      },
    ],
  },
  {
    id: "lab-gfci-trip-scenario",
    kind: "lab",
    title: "GFCI trip scenario",
    objective:
      "Explain why a GFCI trips and how to respond safely.",
    prompt:
      "Lab: A bathroom GFCI trips when a hair dryer is used. Explain what imbalance a GFCI watches for (hot vs neutral), why that protects people, and the safe first checks (reset once, inspect cord/moisture) before bypassing.",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "electrical",
    minChars: 50,
    conceptHints: [
      "gfci",
      "ground fault",
      "imbalance",
      "electrical safety",
      "electrical",
    ],
    misconceptionTargets: [
      "assuming GFCI is only an overcurrent breaker",
      "permanently bypassing GFCI protection to 'fix' trips",
    ],
    successLooksLike:
      "Current imbalance explanation, shock-protection why, and safe inspect/reset steps — no bypass.",
    scaffolds: [
      hint(
        "Not just amps",
        "GFCI senses leakage imbalance, not only overload amps.",
      ),
      step(
        "People protection",
        "Trip aims to interrupt current seeking a path through a person/ground.",
      ),
      checklist(
        "GFCI checklist",
        "Imbalance · why safe · first checks · no bypass",
      ),
    ],
    criteria: [
      {
        id: "imbalance",
        label: "Imbalance",
        mustIncludeAny: [
          "imbalance",
          "hot",
          "neutral",
          "leak",
          "difference",
          "gfci",
        ],
      },
      {
        id: "protect",
        label: "Protection why",
        mustIncludeAny: [
          "shock",
          "person",
          "ground fault",
          "protect",
          "leakage",
        ],
      },
      {
        id: "checks",
        label: "Safe checks",
        mustIncludeAny: [
          "reset",
          "cord",
          "moisture",
          "inspect",
          "dry",
          "not bypass",
        ],
      },
    ],
  },
  {
    id: "sim-breaker-overload",
    kind: "simulation",
    title: "Breaker overload diagnosis",
    objective:
      "Solve a repeated breaker trip using load reasoning.",
    prompt:
      "Simulation: A 15 A kitchen breaker trips when microwave (12 A) and toaster (10 A) run together, but not alone. Explain overload vs short clues, compute combined load vs breaker rating, and propose a safe corrective approach (not oversizing the breaker casually).",
    learningObjectType: "SIMULATION",
    skillFacet: "SOLVE",
    asPerform: false,
    domainTag: "electrical",
    minChars: 52,
    conceptHints: [
      "breaker",
      "overload",
      "circuit load",
      "electrical",
      "branch circuit",
    ],
    misconceptionTargets: [
      "upsizing a breaker without verifying conductor ampacity",
      "calling every trip a short circuit",
    ],
    successLooksLike:
      "22 A combined > 15 A → overload; stagger loads or dedicated circuit — not casual breaker upsize.",
    scaffolds: [
      hint(
        "Add the amps",
        "Simultaneous loads on one breaker add.",
      ),
      step(
        "Short vs overload",
        "Instant trip with bang/smell differs from delayed trip under heavy load.",
      ),
      checklist(
        "Breaker checklist",
        "Load math · overload vs short · safe fix",
      ),
    ],
    criteria: [
      {
        id: "math",
        label: "Combined load",
        mustIncludeAny: ["22", "12", "10", "15"],
      },
      {
        id: "type",
        label: "Overload",
        mustIncludeAny: ["overload", "too much load", "exceed"],
      },
      {
        id: "fix",
        label: "Safe fix",
        mustIncludeAny: [
          "dedicated",
          "stagger",
          "not upsize",
          "separate circuit",
          "reduce load",
          "ampacity",
        ],
      },
    ],
  },

  // —— Automotive ——
  {
    id: "lab-battery-load-test-reason",
    kind: "lab",
    title: "Battery load test reasoning",
    objective:
      "Interpret a basic battery load-test result in context.",
    prompt:
      "Lab: A 12 V battery reads 12.6 V open-circuit but collapses under load test below spec while cranking is slow. Explain why open-circuit voltage alone misleads, what the load test stresses, and one safe next step (clean connections vs replace consideration).",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "automotive",
    minChars: 50,
    conceptHints: [
      "battery",
      "load test",
      "cranking",
      "automotive",
      "voltage",
    ],
    misconceptionTargets: [
      "passing a battery on resting voltage alone",
      "ignoring corroded cable drops that mimic a weak battery",
    ],
    successLooksLike:
      "Resting V ≠ capacity under load; load test reveals weak cells; check connections before condemning.",
    scaffolds: [
      hint(
        "Surface charge",
        "A rested battery can look healthy until current is demanded.",
      ),
      step(
        "Connections first",
        "Corrosion and loose clamps add resistance — verify before replacement.",
      ),
      checklist(
        "Battery checklist",
        "Why OCV misleads · load meaning · next step",
      ),
    ],
    criteria: [
      {
        id: "ocv",
        label: "OCV limit",
        mustIncludeAny: [
          "open-circuit",
          "resting",
          "alone",
          "misleading",
          "12.6",
        ],
      },
      {
        id: "load",
        label: "Load test",
        mustIncludeAny: [
          "load",
          "collapse",
          "under load",
          "capacity",
          "crank",
        ],
      },
      {
        id: "next",
        label: "Next step",
        mustIncludeAny: [
          "connection",
          "corrosion",
          "clean",
          "replace",
          "clamp",
        ],
      },
    ],
  },
  {
    id: "sim-no-crank-branch",
    kind: "simulation",
    title: "No-crank diagnostic branch",
    objective:
      "Branch a no-crank diagnosis between power, starter, and safety switches.",
    prompt:
      "Simulation: Key to START — lights are bright, but no starter sound. Rank first checks (battery/connections vs starter click vs neutral/clutch safety). Explain why bright lights reduce 'dead battery' likelihood and what a single loud click may suggest.",
    learningObjectType: "SIMULATION",
    skillFacet: "SOLVE",
    asPerform: false,
    domainTag: "automotive",
    minChars: 55,
    conceptHints: [
      "no crank",
      "starter",
      "battery",
      "safety switch",
      "automotive",
    ],
    misconceptionTargets: [
      "replacing the starter first when lights are dim",
      "ignoring park/neutral or clutch safety interlocks",
    ],
    successLooksLike:
      "Bright lights → focus past dead battery; check interlocks/click vs silent; orderly branch.",
    scaffolds: [
      hint(
        "Lights clue",
        "Bright exterior/dash lights suggest available voltage for accessories.",
      ),
      step(
        "Click meaning",
        "A single click can point to solenoid/engagement or weak available cranking current at the starter.",
      ),
      checklist(
        "No-crank checklist",
        "Branch order · lights implication · click interpretation",
      ),
    ],
    criteria: [
      {
        id: "lights",
        label: "Bright lights clue",
        mustIncludeAny: [
          "bright",
          "not dead",
          "battery likely",
          "voltage",
          "accessories",
        ],
      },
      {
        id: "interlock",
        label: "Safety interlock",
        mustIncludeAny: [
          "neutral",
          "park",
          "clutch",
          "safety",
          "interlock",
          "inhibit",
        ],
      },
      {
        id: "click",
        label: "Click meaning",
        mustIncludeAny: [
          "click",
          "solenoid",
          "starter",
          "engage",
          "relay",
        ],
      },
    ],
  },
  {
    id: "lab-brake-pad-wear-signs",
    kind: "lab",
    title: "Brake pad wear signs",
    objective:
      "Recognize common brake pad wear indicators and safe response.",
    prompt:
      "Lab: Customer reports squeal at low speed and a visible wear indicator tab near the rotor. List two wear/warning signs, explain why metal-on-metal is urgent, and state the educational next step (inspect thickness/hardware — not a DIY guarantee).",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "automotive",
    minChars: 48,
    conceptHints: [
      "brake pads",
      "wear indicator",
      "squeal",
      "automotive",
      "brakes",
    ],
    misconceptionTargets: [
      "ignoring squeal as only cosmetic noise",
      "continuing to drive on grinding metal-on-metal",
    ],
    successLooksLike:
      "Squeal/indicator/thin pad signs, urgency of rotor damage/safety, inspect/replace path.",
    scaffolds: [
      hint(
        "Indicator tab",
        "Many pads squeal on purpose when material is low.",
      ),
      step(
        "Grinding risk",
        "Pad backing on rotor damages rotors and lengthens stopping distance.",
      ),
      checklist(
        "Brake checklist",
        "Two signs · urgency · inspect next step",
      ),
    ],
    criteria: [
      {
        id: "signs",
        label: "Wear signs",
        mustIncludeAny: [
          "squeal",
          "indicator",
          "thin",
          "grind",
          "wear tab",
        ],
      },
      {
        id: "urgent",
        label: "Metal-on-metal urgency",
        mustIncludeAny: [
          "rotor",
          "damage",
          "stopping",
          "unsafe",
          "metal",
          "urgent",
        ],
      },
      {
        id: "next",
        label: "Next step",
        mustIncludeAny: [
          "inspect",
          "replace",
          "thickness",
          "pads",
          "measure",
        ],
      },
    ],
  },
  {
    id: "sim-coolant-overheat-triage",
    kind: "simulation",
    title: "Coolant overheat triage",
    objective:
      "Triage an overheating symptom without opening a hot system unsafely.",
    prompt:
      "Simulation: Temperature gauge climbs in traffic; cabin heat still gets hot. Prioritize safe actions (pull over, do not cap a hot radiator), interpret 'heat still works' as a clue about water pump/airflow vs empty system, and name one likely follow-up check when cool.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "automotive",
    minChars: 52,
    conceptHints: [
      "overheat",
      "coolant",
      "radiator",
      "thermostat",
      "automotive",
    ],
    misconceptionTargets: [
      "opening a hot radiator cap",
      "assuming heater heat always means the engine cannot be overheating",
    ],
    successLooksLike:
      "Safe stop/no hot cap; heater-hot clue interpreted carefully; cool-system check named.",
    scaffolds: [
      hint(
        "Cap danger",
        "Pressurized hot coolant can scald — wait until cool.",
      ),
      step(
        "Heater clue",
        "Hot heater often means some coolant is circulating — still verify level/fan/thermostat when safe.",
      ),
      checklist(
        "Overheat checklist",
        "Safe action · heater clue · cool follow-up",
      ),
    ],
    criteria: [
      {
        id: "safe",
        label: "Safe action",
        mustIncludeAny: [
          "pull over",
          "stop",
          "not open",
          "hot cap",
          "cool",
          "scald",
        ],
      },
      {
        id: "heater",
        label: "Heater clue",
        mustIncludeAny: [
          "heater",
          "circulat",
          "coolant flowing",
          "water pump",
          "airflow",
        ],
      },
      {
        id: "followup",
        label: "Follow-up when cool",
        mustIncludeAny: [
          "level",
          "fan",
          "thermostat",
          "leak",
          "hose",
          "reservoir",
        ],
      },
    ],
  },

  // —— Manufacturing ——
  {
    id: "lab-5s-sort-shine",
    kind: "lab",
    title: "5S sort and shine",
    objective:
      "Perform Sort and Shine steps on a cluttered workcell scenario.",
    prompt:
      "Lab: Bench has broken fixtures, unlabeled chemicals, and metal chips on the floor. Apply Sort (keep/red-tag/remove) and Shine (clean to inspect). List actions for each and one safety win.",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "manufacturing",
    minChars: 48,
    conceptHints: [
      "5s",
      "sort",
      "shine",
      "lean",
      "manufacturing",
      "workplace organization",
    ],
    misconceptionTargets: [
      "treating 5S as only cleaning without decision rules",
      "leaving unlabeled chemicals because 'everyone knows'",
    ],
    successLooksLike:
      "Red-tag/remove broken items, clean chips to expose issues, safety win named.",
    scaffolds: [
      hint(
        "Sort first",
        "Decide keep vs remove before cosmetic cleaning alone.",
      ),
      step(
        "Shine reveals",
        "Cleaning exposes leaks, cracks, and missing guards.",
      ),
      checklist(
        "5S checklist",
        "Sort actions · Shine actions · safety win",
      ),
    ],
    criteria: [
      {
        id: "sort",
        label: "Sort",
        mustIncludeAny: [
          "red-tag",
          "remove",
          "broken",
          "keep",
          "unlabeled",
          "sort",
        ],
      },
      {
        id: "shine",
        label: "Shine",
        mustIncludeAny: ["shine", "clean", "chips", "sweep", "wipe"],
      },
      {
        id: "safety",
        label: "Safety win",
        mustIncludeAny: [
          "slip",
          "chemical",
          "label",
          "injury",
          "hazard",
          "guard",
        ],
      },
    ],
  },
  {
    id: "sim-root-cause-5whys",
    kind: "simulation",
    title: "Five whys root cause",
    objective:
      "Apply five-whys to move from symptom to actionable cause.",
    prompt:
      "Simulation: Scrap rate spiked on Station 3. First answer 'operator error' feels shallow. Write a 4–5 why chain that reaches a process/tooling cause (e.g., worn fixture, missing poke-yoke) and one corrective action that is not 'try harder'.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "manufacturing",
    minChars: 55,
    conceptHints: [
      "five whys",
      "root cause",
      "scrap",
      "manufacturing",
      "corrective action",
    ],
    misconceptionTargets: [
      "stopping at operator blame as root cause",
      "corrective actions that only exhort people to be careful",
    ],
    successLooksLike:
      "Why-chain beyond blame, process/tooling cause, systemic fix.",
    scaffolds: [
      hint(
        "Past blame",
        "Ask what allowed the error — tooling, standard, training, detection.",
      ),
      step(
        "Action test",
        "A good fix changes the system so the error is harder to repeat.",
      ),
      checklist(
        "5-Whys checklist",
        "Why chain · process cause · systemic action",
      ),
    ],
    criteria: [
      {
        id: "whys",
        label: "Why chain",
        mustIncludeAny: ["why", "because", "then"],
      },
      {
        id: "cause",
        label: "Process/tooling cause",
        mustIncludeAny: [
          "fixture",
          "tool",
          "worn",
          "standard",
          "poke-yoke",
          "setup",
          "process",
        ],
      },
      {
        id: "action",
        label: "Corrective action",
        mustIncludeAny: [
          "replace",
          "fixture",
          "checklist",
          "sensor",
          "standardize",
          "error-proof",
          "train with aid",
        ],
      },
    ],
  },
  {
    id: "write-lean-waste-types",
    kind: "writing",
    title: "Lean waste types",
    objective:
      "Explain key lean wastes with shop-floor examples.",
    prompt:
      "Writing: Define lean waste briefly. Explain waiting, transportation, and defects with one concrete manufacturing example each. Note why inventory can hide problems.",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "EXPLAIN",
    asPerform: false,
    domainTag: "manufacturing",
    minChars: 52,
    conceptHints: [
      "lean",
      "waste",
      "muda",
      "waiting",
      "defects",
      "manufacturing",
    ],
    misconceptionTargets: [
      "thinking lean only means cutting headcount",
      "treating large buffers as free safety without cost",
    ],
    successLooksLike:
      "Clear muda idea, three wastes with examples, inventory-hiding note.",
    scaffolds: [
      hint(
        "TIMWOOD etc.",
        "Common wastes include transport, inventory, motion, waiting, overproduction, overprocessing, defects.",
      ),
      step(
        "Inventory veil",
        "Extra stock can hide uneven flow and quality escapes.",
      ),
      checklist(
        "Lean checklist",
        "Definition · three wastes · inventory note",
      ),
    ],
    criteria: [
      {
        id: "define",
        label: "Waste defined",
        mustIncludeAny: [
          "waste",
          "non-value",
          "muda",
          "customer",
          "lean",
        ],
      },
      {
        id: "examples",
        label: "Three wastes",
        mustIncludeAny: [
          "waiting",
          "transport",
          "defect",
          "inventory",
        ],
      },
      {
        id: "inventory",
        label: "Inventory hides",
        mustIncludeAny: [
          "hide",
          "buffer",
          "mask",
          "inventory",
          "problem",
        ],
      },
    ],
  },

  // —— Logistics ——
  {
    id: "sim-reorder-point-stockout",
    kind: "simulation",
    title: "Reorder point and stockout",
    objective:
      "Apply reorder-point intuition to avoid stockouts under lead time.",
    prompt:
      "Simulation: Daily demand ≈ 20 units; lead time 5 days; you want safety stock of 30. Estimate a reorder point (demand during lead time + safety). Explain what happens if you reorder only when the bin looks empty.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "logistics",
    minChars: 48,
    conceptHints: [
      "reorder point",
      "safety stock",
      "lead time",
      "stockout",
      "logistics",
    ],
    misconceptionTargets: [
      "reordering only at zero on-hand when lead time is positive",
      "ignoring safety stock under demand uncertainty",
    ],
    successLooksLike:
      "ROP ≈ 100 + 30 = 130; empty-bin reorder causes stockout during lead time.",
    scaffolds: [
      hint(
        "Cover lead time",
        "Reorder early enough to cover demand while the order is traveling.",
      ),
      step(
        "Add safety",
        "Safety stock buffers variability above average lead-time demand.",
      ),
      checklist(
        "ROP checklist",
        "Lead-time demand · safety · empty-bin risk",
      ),
    ],
    criteria: [
      {
        id: "rop",
        label: "Reorder point",
        mustIncludeAny: ["130", "100", "20", "5", "30"],
      },
      {
        id: "lead",
        label: "Lead-time demand",
        mustIncludeAny: [
          "lead time",
          "during lead",
          "5 days",
          "100",
        ],
      },
      {
        id: "empty",
        label: "Empty-bin risk",
        mustIncludeAny: [
          "stockout",
          "empty",
          "too late",
          "run out",
          "shortage",
        ],
      },
    ],
  },
  {
    id: "lab-pick-path-efficiency",
    kind: "lab",
    title: "Warehouse pick path efficiency",
    objective:
      "Improve a pick path to reduce travel without skipping accuracy.",
    prompt:
      "Lab: Pick list hits A1, Z9, A2, Z8 in that order in a long aisle warehouse. Propose a better sequence idea (cluster by zone/aisle), estimate why travel falls, and name one accuracy control you must keep (scan/confirm).",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "logistics",
    minChars: 45,
    conceptHints: [
      "picking",
      "warehouse",
      "travel time",
      "path",
      "logistics",
    ],
    misconceptionTargets: [
      "optimizing speed by skipping scan confirmation",
      "zigzagging distant locations without clustering",
    ],
    successLooksLike:
      "A-aisle then Z-aisle clustering, less backtracking, scan accuracy retained.",
    scaffolds: [
      hint(
        "Cluster",
        "Group nearby locations before crossing the warehouse.",
      ),
      step(
        "Accuracy",
        "Path efficiency must not remove barcode/location confirmation.",
      ),
      checklist(
        "Pick-path checklist",
        "Better sequence · travel reason · accuracy control",
      ),
    ],
    criteria: [
      {
        id: "sequence",
        label: "Better sequence",
        mustIncludeAny: [
          "cluster",
          "aisle",
          "a1",
          "a2",
          "zone",
          "together",
        ],
      },
      {
        id: "travel",
        label: "Less travel",
        mustIncludeAny: [
          "travel",
          "backtrack",
          "distance",
          "walking",
          "fewer",
        ],
      },
      {
        id: "accuracy",
        label: "Accuracy control",
        mustIncludeAny: [
          "scan",
          "confirm",
          "barcode",
          "check digit",
          "verify",
        ],
      },
    ],
  },
  {
    id: "write-kpi-otif",
    kind: "writing",
    title: "Explain OTIF KPI",
    objective:
      "Explain On-Time In-Full as a logistics performance KPI.",
    prompt:
      "Writing: Define OTIF. Give an example shipment that is on time but not in full, and explain why both dimensions matter to the customer. Suggest one improvement lever (forecast, picking accuracy, carrier).",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "EXPLAIN",
    asPerform: false,
    domainTag: "logistics",
    minChars: 48,
    conceptHints: [
      "otif",
      "kpi",
      "on time",
      "in full",
      "logistics",
      "service level",
    ],
    misconceptionTargets: [
      "treating on-time alone as complete customer success",
      "ignoring quantity accuracy when measuring delivery performance",
    ],
    successLooksLike:
      "OTIF defined, partial-fill example, customer impact, one lever.",
    scaffolds: [
      hint(
        "Two parts",
        "On-time and in-full — both required for OTIF credit in many scorecards.",
      ),
      step(
        "Customer lens",
        "Late full orders and on-time short orders both disrupt operations.",
      ),
      checklist(
        "OTIF checklist",
        "Definition · partial example · why both · lever",
      ),
    ],
    criteria: [
      {
        id: "define",
        label: "OTIF defined",
        mustIncludeAny: [
          "on time",
          "in full",
          "otif",
          "complete",
          "quantity",
        ],
      },
      {
        id: "example",
        label: "Partial example",
        mustIncludeAny: [
          "short",
          "partial",
          "missing",
          "not full",
          "incomplete",
        ],
      },
      {
        id: "lever",
        label: "Improvement lever",
        mustIncludeAny: [
          "forecast",
          "pick",
          "accuracy",
          "carrier",
          "inventory",
          "slotting",
        ],
      },
    ],
  },

  // —— IT support ——
  {
    id: "sim-ticket-triage-priority",
    kind: "simulation",
    title: "Ticket triage priority",
    objective:
      "Prioritize support tickets by impact and urgency.",
    prompt:
      "Simulation: Tickets arrive: (1) CEO laptop Wi-Fi flaky at home, (2) payroll file share down for all HR, (3) one user wants font install. Rank P1→P3 with brief impact/urgency rationale and the first clarifying question for your P1.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "it support",
    minChars: 50,
    conceptHints: [
      "ticket triage",
      "priority",
      "impact",
      "urgency",
      "it support",
    ],
    misconceptionTargets: [
      "prioritizing by requester title alone over business impact",
      "treating single-user cosmetic requests as equal to outages",
    ],
    successLooksLike:
      "Payroll outage first, then CEO Wi-Fi, font last — with impact reasoning and a P1 clarifying question.",
    scaffolds: [
      hint(
        "Impact × urgency",
        "How many users / which critical process, and how time-sensitive?",
      ),
      step(
        "Clarify P1",
        "Ask scope: all HR vs one folder, error message, recent change.",
      ),
      checklist(
        "Triage checklist",
        "Rank three · rationales · P1 question",
      ),
    ],
    criteria: [
      {
        id: "p1",
        label: "P1 choice",
        mustIncludeAny: ["payroll", "hr", "file share", "all"],
      },
      {
        id: "rank",
        label: "Lower priorities",
        mustIncludeAny: ["font", "wifi", "ceo", "p2", "p3"],
      },
      {
        id: "question",
        label: "Clarifying question",
        mustIncludeAny: [
          "who",
          "error",
          "when",
          "scope",
          "all hr",
          "message",
        ],
      },
    ],
  },
  {
    id: "lab-os-safe-mode-boot",
    kind: "lab",
    title: "OS safe mode troubleshooting",
    objective:
      "Use Safe Mode reasoning to isolate driver/startup issues.",
    prompt:
      "Lab: Windows PC bluescreens after login since a new GPU driver. State what Safe Mode limits, why it helps isolate third-party drivers/startup apps, and one careful next action inside Safe Mode (roll back driver / clean boot idea).",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "it support",
    minChars: 48,
    conceptHints: [
      "safe mode",
      "driver",
      "troubleshooting",
      "windows",
      "it support",
    ],
    misconceptionTargets: [
      "reimaging immediately without isolating the recent change",
      "assuming Safe Mode proves hardware failure by itself",
    ],
    successLooksLike:
      "Safe Mode = minimal drivers/startup; isolates third-party; roll back GPU driver.",
    scaffolds: [
      hint(
        "Minimal stack",
        "Safe Mode loads a limited set of drivers and startup items.",
      ),
      step(
        "Recent change",
        "New GPU driver timing is a prime rollback candidate.",
      ),
      checklist(
        "Safe Mode checklist",
        "What it limits · why isolate · next action",
      ),
    ],
    criteria: [
      {
        id: "limits",
        label: "What Safe Mode limits",
        mustIncludeAny: [
          "minimal",
          "limited",
          "drivers",
          "startup",
          "safe mode",
        ],
      },
      {
        id: "isolate",
        label: "Isolation value",
        mustIncludeAny: [
          "isolate",
          "third-party",
          "driver",
          "startup",
          "conflict",
        ],
      },
      {
        id: "action",
        label: "Next action",
        mustIncludeAny: [
          "roll back",
          "uninstall",
          "driver",
          "clean boot",
          "device manager",
        ],
      },
    ],
  },
  {
    id: "sim-permission-denied-acl",
    kind: "simulation",
    title: "Permission denied ACL solve",
    objective:
      "Solve an access-denied issue using least-privilege ACL reasoning.",
    prompt:
      "Simulation: User can read \\\\files\\hr but gets Access Denied writing a new hire folder. Group HR_Read is allowed Modify on parent but a deny ACE exists for that user on the folder. Explain deny-vs-allow precedence idea, the least-privilege fix, and why granting Domain Admins is wrong here.",
    learningObjectType: "SIMULATION",
    skillFacet: "SOLVE",
    asPerform: false,
    domainTag: "it support",
    minChars: 55,
    conceptHints: [
      "acl",
      "ntfs",
      "permissions",
      "deny",
      "least privilege",
      "it support",
    ],
    misconceptionTargets: [
      "granting admin rights to bypass a single folder deny",
      "ignoring explicit deny entries when allow groups look correct",
    ],
    successLooksLike:
      "Deny can override allow; remove/adjust deny or membership carefully; no Domain Admin grant.",
    scaffolds: [
      hint(
        "Check effective access",
        "Explicit deny often wins over allow — inspect the ACL.",
      ),
      step(
        "Least privilege",
        "Fix the specific ACE/group — don’t escalate to admin.",
      ),
      checklist(
        "ACL checklist",
        "Deny precedence · least-privilege fix · why not Domain Admin",
      ),
    ],
    criteria: [
      {
        id: "deny",
        label: "Deny precedence",
        mustIncludeAny: [
          "deny",
          "override",
          "takes precedence",
          "wins",
          "explicit deny",
        ],
      },
      {
        id: "fix",
        label: "Least-privilege fix",
        mustIncludeAny: [
          "remove deny",
          "adjust",
          "group",
          "modify",
          "ace",
          "permission",
        ],
      },
      {
        id: "not-admin",
        label: "Not Domain Admin",
        mustIncludeAny: [
          "not admin",
          "domain admin",
          "least privilege",
          "over-privileg",
          "too broad",
        ],
      },
    ],
  },
  {
    id: "write-backup-3-2-1",
    kind: "writing",
    title: "Explain 3-2-1 backups",
    objective:
      "Explain the 3-2-1 backup rule and why restores must be tested.",
    prompt:
      "Writing: Define the 3-2-1 backup rule (3 copies, 2 media types, 1 offsite). Give a small-business example layout and explain why untested backups are a false comfort.",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "EXPLAIN",
    asPerform: false,
    domainTag: "it support",
    minChars: 50,
    conceptHints: [
      "backup",
      "3-2-1",
      "disaster recovery",
      "restore test",
      "it support",
    ],
    misconceptionTargets: [
      "treating a single external drive as complete backup strategy",
      "assuming backups work without restore tests",
    ],
    successLooksLike:
      "3-2-1 defined, concrete example, restore-test rationale.",
    scaffolds: [
      hint(
        "Three numbers",
        "Three copies, two different media, one offsite/offline.",
      ),
      step(
        "Test restores",
        "A backup you never restore is an unverified hope.",
      ),
      checklist(
        "Backup checklist",
        "Rule · example · restore testing",
      ),
    ],
    criteria: [
      {
        id: "rule",
        label: "3-2-1 rule",
        mustIncludeAny: [
          "3 copies",
          "three copies",
          "2 media",
          "two media",
          "offsite",
          "3-2-1",
        ],
      },
      {
        id: "example",
        label: "Example layout",
        mustIncludeAny: [
          "nas",
          "cloud",
          "external",
          "disk",
          "tape",
          "server",
        ],
      },
      {
        id: "test",
        label: "Restore test",
        mustIncludeAny: [
          "restore",
          "test",
          "verify",
          "untested",
          "false",
        ],
      },
    ],
  },

  // —— Cloud ——
  {
    id: "write-iaas-paas-saas",
    kind: "writing",
    title: "IaaS vs PaaS vs SaaS",
    objective:
      "Explain cloud service models by shared management boundaries.",
    prompt:
      "Writing: Contrast IaaS, PaaS, and SaaS with one example each (e.g., VMs, managed app platform, email suite). State what the customer still manages in IaaS vs SaaS.",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "EXPLAIN",
    asPerform: false,
    domainTag: "cloud",
    minChars: 52,
    conceptHints: [
      "iaas",
      "paas",
      "saas",
      "cloud",
      "shared responsibility",
    ],
    misconceptionTargets: [
      "assuming SaaS means the customer manages guest OS patches",
      "collapsing all cloud offerings into 'someone else’s computer' without model differences",
    ],
    successLooksLike:
      "Clear contrasts, examples, and management boundary differences.",
    scaffolds: [
      hint(
        "Who patches what",
        "IaaS: you manage OS/apps more; SaaS: vendor runs the app.",
      ),
      step(
        "Examples",
        "EC2-like VMs; Heroku/App Service-like PaaS; Google Workspace-like SaaS.",
      ),
      checklist(
        "Service model checklist",
        "Three models · examples · management contrast",
      ),
    ],
    criteria: [
      {
        id: "models",
        label: "Three models",
        mustIncludeAny: ["iaas", "paas", "saas"],
      },
      {
        id: "examples",
        label: "Examples",
        mustIncludeAny: [
          "vm",
          "virtual",
          "platform",
          "email",
          "office",
          "managed",
        ],
      },
      {
        id: "manage",
        label: "Management boundary",
        mustIncludeAny: [
          "os",
          "patch",
          "customer manages",
          "vendor",
          "responsible",
        ],
      },
    ],
  },
  {
    id: "sim-scale-out-vs-up",
    kind: "simulation",
    title: "Scale out vs scale up",
    objective:
      "Choose horizontal vs vertical scaling for a load scenario.",
    prompt:
      "Simulation: A web API spikes to 10× traffic during a sale. Contrast scale-up (bigger VM) vs scale-out (more instances behind a load balancer). Pick a preference for elastic spike traffic and one risk of only scaling up.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "cloud",
    minChars: 48,
    conceptHints: [
      "scale out",
      "scale up",
      "horizontal",
      "vertical",
      "cloud",
      "load balancer",
    ],
    misconceptionTargets: [
      "assuming a single giant VM is always simpler and safer",
      "ignoring single-instance failure risk when only scaling up",
    ],
    successLooksLike:
      "Prefer scale-out for elastic spikes; name upsize limits/single point of failure.",
    scaffolds: [
      hint(
        "Out = more nodes",
        "Scale-out adds instances; scale-up enlarges one box.",
      ),
      step(
        "Spike fit",
        "Elastic horizontal capacity often matches short sales spikes better.",
      ),
      checklist(
        "Scaling checklist",
        "Contrast · preference · scale-up risk",
      ),
    ],
    criteria: [
      {
        id: "contrast",
        label: "Out vs up",
        mustIncludeAny: [
          "scale out",
          "scale up",
          "horizontal",
          "vertical",
          "instances",
        ],
      },
      {
        id: "prefer",
        label: "Preference for spike",
        mustIncludeAny: [
          "scale out",
          "horizontal",
          "more instances",
          "load balancer",
          "elastic",
        ],
      },
      {
        id: "risk",
        label: "Scale-up risk",
        mustIncludeAny: [
          "single",
          "limit",
          "ceiling",
          "downtime",
          "vertical limit",
          "one vm",
        ],
      },
    ],
  },
  {
    id: "lab-shared-responsibility",
    kind: "lab",
    title: "Cloud shared responsibility",
    objective:
      "Map security tasks to customer vs provider under a shared model.",
    prompt:
      "Lab: For IaaS VMs, assign who typically handles: physical datacenter security, guest OS patching, and identity access to your app data. Explain why 'the cloud is secure' is incomplete without customer controls.",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "cloud",
    minChars: 50,
    conceptHints: [
      "shared responsibility",
      "cloud security",
      "iaas",
      "patching",
      "cloud",
    ],
    misconceptionTargets: [
      "assuming the provider patches your guest OS on IaaS by default",
      "outsourcing all identity/data access decisions to the vendor",
    ],
    successLooksLike:
      "Provider: physical; customer: guest OS + data/IAM; incomplete slogan explained.",
    scaffolds: [
      hint(
        "IaaS split",
        "Provider secures cloud; you secure what you put in / configure.",
      ),
      step(
        "Guest OS",
        "On IaaS, OS updates are usually your responsibility.",
      ),
      checklist(
        "Shared model checklist",
        "Physical · guest OS · data/IAM · slogan flaw",
      ),
    ],
    criteria: [
      {
        id: "physical",
        label: "Physical security",
        mustIncludeAny: [
          "provider",
          "datacenter",
          "physical",
          "facility",
        ],
      },
      {
        id: "guest",
        label: "Guest OS",
        mustIncludeAny: [
          "customer",
          "guest os",
          "patch",
          "you",
          "tenant",
        ],
      },
      {
        id: "incomplete",
        label: "Slogan incomplete",
        mustIncludeAny: [
          "customer",
          "configure",
          "iam",
          "misconfig",
          "shared",
          "still responsible",
        ],
      },
    ],
  },

  // —— Data analytics ——
  {
    id: "lab-clean-missing-values",
    kind: "lab",
    title: "Clean missing values",
    objective:
      "Choose a missing-value strategy and justify the tradeoff.",
    prompt:
      "Lab: A survey dataset has 8% missing age and 40% missing income. Propose a handling strategy for each (drop, impute, flag), justify why they differ, and state one bias risk of naive mean imputation on income.",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "data analytics",
    minChars: 52,
    conceptHints: [
      "missing values",
      "imputation",
      "data cleaning",
      "bias",
      "data analytics",
    ],
    misconceptionTargets: [
      "always dropping every row with any missing field",
      "mean-imputing heavily missing income without bias awareness",
    ],
    successLooksLike:
      "Different strategies by missingness rate; bias risk of mean imputation named.",
    scaffolds: [
      hint(
        "Rate matters",
        "Light missingness ≠ heavy missingness for drop vs impute choices.",
      ),
      step(
        "Income caution",
        "Mean imputation can shrink variance and distort relationships.",
      ),
      checklist(
        "Cleaning checklist",
        "Age strategy · income strategy · bias risk",
      ),
    ],
    criteria: [
      {
        id: "age",
        label: "Age strategy",
        mustIncludeAny: [
          "impute",
          "drop",
          "flag",
          "8%",
          "age",
        ],
      },
      {
        id: "income",
        label: "Income strategy",
        mustIncludeAny: [
          "income",
          "40%",
          "flag",
          "model",
          "careful",
          "not mean only",
        ],
      },
      {
        id: "bias",
        label: "Imputation bias risk",
        mustIncludeAny: [
          "bias",
          "variance",
          "distort",
          "understate",
          "mean imputation",
        ],
      },
    ],
  },
  {
    id: "sim-chart-lie-axis",
    kind: "simulation",
    title: "Chart axis misuse",
    objective:
      "Detect misleading visualization from truncated or dual axes.",
    prompt:
      "Simulation: A bar chart of on-time % shows Site A 94% and Site B 96% but the y-axis starts at 90%, making a tiny gap look huge. Explain the lie factor, how you’d redraw the axis, and one question you’d ask before acting on the chart.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "data analytics",
    minChars: 48,
    conceptHints: [
      "visualization",
      "axis",
      "misleading chart",
      "data analytics",
      "literacy",
    ],
    misconceptionTargets: [
      "trusting visual gap size without reading axis scale",
      "acting on truncated-axis drama without base rates",
    ],
    successLooksLike:
      "Truncated axis called out, start-at-zero or full-range redraw, skeptical question asked.",
    scaffolds: [
      hint(
        "Read the scale",
        "Axis minimums change how big differences appear.",
      ),
      step(
        "Redraw",
        "Prefer 0–100% for percentage bars unless a zoom is clearly labeled.",
      ),
      checklist(
        "Chart-lie checklist",
        "Mislead named · redraw · decision question",
      ),
    ],
    criteria: [
      {
        id: "lie",
        label: "Misleading tactic",
        mustIncludeAny: [
          "truncat",
          "axis",
          "90%",
          "exaggerat",
          "scale",
        ],
      },
      {
        id: "redraw",
        label: "Redraw",
        mustIncludeAny: [
          "zero",
          "0",
          "full range",
          "100%",
          "relabel",
          "start at",
        ],
      },
      {
        id: "question",
        label: "Skeptical question",
        mustIncludeAny: [
          "sample",
          "volume",
          "significant",
          "context",
          "how many",
          "baseline",
        ],
      },
    ],
  },
  {
    id: "write-metric-vs-kpi",
    kind: "writing",
    title: "Metric vs KPI",
    objective:
      "Distinguish metrics from KPIs and interpret with a goal.",
    prompt:
      "Writing: Define metric vs KPI. Give an example where pageviews is a metric but not the KPI, and conversion rate is the KPI for a campaign goal. Explain the risk of optimizing a vanity metric.",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "EXPLAIN",
    asPerform: false,
    domainTag: "data analytics",
    minChars: 50,
    conceptHints: [
      "kpi",
      "metric",
      "vanity metric",
      "interpretation",
      "data analytics",
    ],
    misconceptionTargets: [
      "treating every tracked number as a KPI",
      "optimizing pageviews while conversion falls",
    ],
    successLooksLike:
      "Clear distinction, campaign example, vanity-metric risk.",
    scaffolds: [
      hint(
        "KPI link to goal",
        "KPIs are metrics chosen because they indicate goal success.",
      ),
      step(
        "Vanity trap",
        "Easy-to-move numbers may not equal business outcomes.",
      ),
      checklist(
        "KPI checklist",
        "Definitions · example pair · vanity risk",
      ),
    ],
    criteria: [
      {
        id: "define",
        label: "Definitions",
        mustIncludeAny: ["metric", "kpi", "goal", "indicator"],
      },
      {
        id: "example",
        label: "Example pair",
        mustIncludeAny: [
          "pageview",
          "conversion",
          "vanity",
          "campaign",
        ],
      },
      {
        id: "risk",
        label: "Vanity risk",
        mustIncludeAny: [
          "vanity",
          "optimize",
          "misleading",
          "not outcome",
          "wrong goal",
        ],
      },
    ],
  },

  // —— Project management ——
  {
    id: "lab-scope-creep-spot",
    kind: "lab",
    title: "Spot scope creep",
    objective:
      "Identify scope creep and propose a controlled change response.",
    prompt:
      "Lab: Mid-sprint, a stakeholder asks to 'just add' three unplanned reports to a website redesign committed to a fixed launch date. Name the scope-creep signal, impact on time/cost/quality, and one change-control response (defer, swap, or formal change request).",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "project management",
    minChars: 50,
    conceptHints: [
      "scope creep",
      "change control",
      "triple constraint",
      "project management",
    ],
    misconceptionTargets: [
      "accepting all stakeholder adds to 'be helpful' without replanning",
      "assuming date stays fixed when scope expands with no tradeoff",
    ],
    successLooksLike:
      "Creep named, constraint impact, and a controlled change response.",
    scaffolds: [
      hint(
        "Unplanned adds",
        "Work outside the agreed scope without tradeoffs is classic creep.",
      ),
      step(
        "Tradeoff talk",
        "More scope needs time, cost, or reduced other scope.",
      ),
      checklist(
        "Scope checklist",
        "Creep signal · impact · change-control response",
      ),
    ],
    criteria: [
      {
        id: "creep",
        label: "Scope creep signal",
        mustIncludeAny: [
          "scope creep",
          "unplanned",
          "just add",
          "extra",
          "out of scope",
        ],
      },
      {
        id: "impact",
        label: "Impact",
        mustIncludeAny: [
          "time",
          "schedule",
          "cost",
          "quality",
          "delay",
          "risk",
        ],
      },
      {
        id: "control",
        label: "Change control",
        mustIncludeAny: [
          "change request",
          "defer",
          "swap",
          "tradeoff",
          "backlog",
          "approve",
        ],
      },
    ],
  },
  {
    id: "sim-critical-path-delay",
    kind: "simulation",
    title: "Critical path delay",
    objective:
      "Apply critical-path thinking to a schedule delay.",
    prompt:
      "Simulation: Tasks: Design 5d → Build 8d → Test 4d on the critical path; a parallel Docs task is 6d with 3d slack. Build slips 2 days. What happens to project end date, why Docs slack may absorb nothing, and one recovery option?",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "project management",
    minChars: 48,
    conceptHints: [
      "critical path",
      "float",
      "slack",
      "schedule",
      "project management",
    ],
    misconceptionTargets: [
      "assuming slack on a parallel task protects the critical path",
      "ignoring that critical-path slips move the end date",
    ],
    successLooksLike:
      "End date slips ~2 days; Docs slack doesn’t help Build; crash/resequence/overtime option named.",
    scaffolds: [
      hint(
        "Zero float",
        "Critical path tasks have no slack — delays push the finish.",
      ),
      step(
        "Parallel myth",
        "Slack elsewhere doesn’t absorb a critical-path slip automatically.",
      ),
      checklist(
        "Critical-path checklist",
        "End-date effect · why Docs slack fails · recovery",
      ),
    ],
    criteria: [
      {
        id: "slip",
        label: "End date slip",
        mustIncludeAny: [
          "2 day",
          "delay",
          "later",
          "slip",
          "end date",
        ],
      },
      {
        id: "slack",
        label: "Docs slack limit",
        mustIncludeAny: [
          "slack",
          "float",
          "parallel",
          "not on critical",
          "does not",
          "won't help",
        ],
      },
      {
        id: "recovery",
        label: "Recovery option",
        mustIncludeAny: [
          "crash",
          "fast-track",
          "overtime",
          "resequence",
          "add resource",
          "reduce scope",
        ],
      },
    ],
  },
  {
    id: "write-risk-register-entry",
    kind: "writing",
    title: "Write a risk register entry",
    objective:
      "Author a clear risk register row with response strategy.",
    prompt:
      "Writing: For a vendor API dependency, write a risk statement (if/then), rate impact/probability qualitatively, choose a response (avoid/mitigate/transfer/accept), and one trigger to watch.",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "EXPLAIN",
    asPerform: false,
    domainTag: "project management",
    minChars: 52,
    conceptHints: [
      "risk register",
      "mitigation",
      "probability",
      "impact",
      "project management",
    ],
    misconceptionTargets: [
      "listing issues that already happened as future risks without distinction",
      "choosing 'accept' without stating residual exposure",
    ],
    successLooksLike:
      "If/then risk, qualitative ratings, named strategy, monitoring trigger.",
    scaffolds: [
      hint(
        "If/then",
        "If [cause], then [impact on objectives].",
      ),
      step(
        "Response verbs",
        "Avoid, mitigate, transfer, or accept — pick deliberately.",
      ),
      checklist(
        "Risk checklist",
        "Statement · ratings · response · trigger",
      ),
    ],
    criteria: [
      {
        id: "statement",
        label: "Risk statement",
        mustIncludeAny: ["if", "then", "vendor", "api", "delay"],
      },
      {
        id: "response",
        label: "Response strategy",
        mustIncludeAny: [
          "mitigate",
          "avoid",
          "transfer",
          "accept",
          "contingency",
        ],
      },
      {
        id: "trigger",
        label: "Trigger",
        mustIncludeAny: [
          "trigger",
          "watch",
          "sla",
          "latency",
          "outage",
          "indicator",
        ],
      },
    ],
  },
  {
    id: "sim-scrum-sprint-goal",
    kind: "simulation",
    title: "Scrum sprint goal focus",
    objective:
      "Apply Scrum sprint-goal thinking when mid-sprint requests arrive.",
    prompt:
      "Simulation: Sprint goal is 'shoppers can complete checkout.' Mid-sprint, marketing wants a new homepage banner unrelated to checkout. Explain the sprint goal’s purpose, what the Development Team should do with the request, and how the Product Owner might replan without silently expanding scope.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "project management",
    minChars: 52,
    conceptHints: [
      "scrum",
      "sprint goal",
      "product owner",
      "agile",
      "project management",
    ],
    misconceptionTargets: [
      "treating the sprint backlog as infinitely malleable without PO negotiation",
      "abandoning the sprint goal for every stakeholder whim",
    ],
    successLooksLike:
      "Goal protects focus; route to PO/backlog; negotiate swap or next sprint — no silent creep.",
    scaffolds: [
      hint(
        "Goal as commitment",
        "Sprint goal focuses why the increment matters this sprint.",
      ),
      step(
        "PO owns backlog",
        "New work enters via Product Owner ordering — not silent adds.",
      ),
      checklist(
        "Scrum checklist",
        "Goal purpose · team response · PO replan",
      ),
    ],
    criteria: [
      {
        id: "goal",
        label: "Sprint goal purpose",
        mustIncludeAny: [
          "focus",
          "checkout",
          "sprint goal",
          "commitment",
          "increment",
        ],
      },
      {
        id: "team",
        label: "Team response",
        mustIncludeAny: [
          "product owner",
          "backlog",
          "not silently",
          "defer",
          "negotiate",
        ],
      },
      {
        id: "po",
        label: "PO replan",
        mustIncludeAny: [
          "swap",
          "next sprint",
          "order",
          "tradeoff",
          "scope",
          "priority",
        ],
      },
    ],
  },
];

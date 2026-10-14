/**
 * Content expansion queue — depth Priority B challenges
 * (art, music, sociology, geography, literature, communication, earth science).
 * Staging catalog only; not a subject engine.
 */

import type { StructuredChallenge } from "@/lib/learning/activities/structured/service";
import { hint, step, checklist } from "./helpers";

export const CONTENT_DEPTH_PRIORITY_B_CHALLENGES: StructuredChallenge[] = [
  // —— Art ——
  {
    id: "write-art-principles-balance",
    kind: "writing",
    title: "Principles: balance and contrast",
    objective:
      "Explain how balance and contrast work as principles of design.",
    prompt:
      "Writing: Explain balance (symmetrical vs asymmetrical) and contrast as principles of design. Give one visual example of each and state how they affect where a viewer looks.",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "EXPLAIN",
    asPerform: false,
    domainTag: "art",
    minChars: 52,
    conceptHints: [
      "principles of design",
      "balance",
      "contrast",
      "symmetry",
      "art",
    ],
    misconceptionTargets: [
      "treating balance as only perfect left-right mirroring",
      "confusing contrast with random bright colors without purpose",
    ],
    successLooksLike:
      "Defines balance types and contrast, with examples tied to viewer attention.",
    accessibility: {
      altDescription:
        "Explain design balance and contrast with visual examples.",
    },
    scaffolds: [
      hint(
        "Balance kinds",
        "Symmetrical mirrors weight; asymmetrical balances unequal parts.",
      ),
      step(
        "Contrast job",
        "Say what differs (value, size, hue) and what that difference emphasizes.",
      ),
      checklist(
        "Principles checklist",
        "Balance defined · contrast defined · examples · viewer effect",
      ),
    ],
    criteria: [
      {
        id: "balance",
        label: "Balance",
        mustIncludeAny: [
          "balance",
          "symmetr",
          "asymmetr",
          "visual weight",
        ],
      },
      {
        id: "contrast",
        label: "Contrast",
        mustIncludeAny: ["contrast", "difference", "oppose", "juxtapos"],
      },
      {
        id: "viewer",
        label: "Viewer effect",
        mustIncludeAny: [
          "look",
          "focus",
          "attention",
          "eye",
          "emphas",
        ],
      },
    ],
  },
  {
    id: "lab-art-perspective-horizon",
    kind: "lab",
    title: "One-point perspective lab",
    objective:
      "Describe horizon line and vanishing point in one-point perspective.",
    prompt:
      "Lab: Imagine a hallway drawn in one-point perspective. Name where the horizon line sits relative to the viewer’s eye level, where the vanishing point belongs, and how parallel hallway edges behave as they recede. Educational drawing practice.",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "art",
    minChars: 50,
    conceptHints: [
      "one-point perspective",
      "horizon",
      "vanishing point",
      "receding lines",
      "art",
    ],
    misconceptionTargets: [
      "placing the vanishing point randomly off the horizon",
      "thinking parallel edges stay parallel on the picture plane forever",
    ],
    successLooksLike:
      "Horizon ≈ eye level, vanishing point on that line, edges converge toward it.",
    scaffolds: [
      hint(
        "Eye level cue",
        "Horizon usually matches the viewer’s eye level in standard setups.",
      ),
      step(
        "Edges converge",
        "Edges that are parallel in space and go away from you meet at the VP.",
      ),
      checklist(
        "Perspective checklist",
        "Horizon · vanishing point · converging edges",
      ),
    ],
    criteria: [
      {
        id: "horizon",
        label: "Horizon / eye level",
        mustIncludeAny: ["horizon", "eye level", "eye-level"],
      },
      {
        id: "vp",
        label: "Vanishing point",
        mustIncludeAny: ["vanishing", "vp", "converge"],
      },
      {
        id: "edges",
        label: "Receding edges",
        mustIncludeAny: [
          "parallel",
          "reced",
          "converge",
          "hallway",
          "edge",
        ],
      },
    ],
  },
  {
    id: "sim-art-composition-rule-thirds",
    kind: "simulation",
    title: "Rule of thirds composition",
    objective:
      "Apply a rule-of-thirds placement choice for a stated photo goal.",
    prompt:
      "Simulation: You photograph a lone tree on a ridge for a travel poster that should feel spacious, not centered and static. Choose a rule-of-thirds placement for the tree, name which intersection you use, and explain why dead-center would weaken the composition.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "art",
    minChars: 48,
    conceptHints: [
      "rule of thirds",
      "composition",
      "focal point",
      "intersection",
      "art",
    ],
    misconceptionTargets: [
      "assuming the subject must always sit exactly in the frame center",
      "using thirds without linking placement to negative space or mood",
    ],
    successLooksLike:
      "Off-center thirds placement named; center critiqued for static feel.",
    scaffolds: [
      hint(
        "Grid idea",
        "Divide the frame into nine cells; strong points sit on intersections.",
      ),
      step(
        "Space left",
        "Leaving open sky/ground on one side can increase spaciousness.",
      ),
      checklist(
        "Composition checklist",
        "Placement · intersection · center risk",
      ),
    ],
    criteria: [
      {
        id: "thirds",
        label: "Rule of thirds",
        mustIncludeAny: [
          "thirds",
          "intersection",
          "off-center",
          "grid",
        ],
      },
      {
        id: "placement",
        label: "Placement choice",
        mustIncludeAny: [
          "left",
          "right",
          "upper",
          "lower",
          "third",
          "corner",
        ],
      },
      {
        id: "center",
        label: "Center critique",
        mustIncludeAny: [
          "center",
          "static",
          "balanced too much",
          "less dynamic",
          "dead",
        ],
      },
    ],
  },
  {
    id: "write-art-history-period-retain",
    kind: "writing",
    title: "Renaissance vs Impressionism traits",
    objective:
      "Retrieve distinguishing traits of Renaissance vs Impressionism.",
    prompt:
      "Without notes (educational art history): Distinguish Renaissance painting from Impressionism. Name two typical traits for each (e.g., perspective/ideal form vs broken color/outdoor light) and one sentence on what each period valued visually.",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "RETAIN",
    asPerform: false,
    domainTag: "art",
    minChars: 50,
    conceptHints: [
      "renaissance",
      "impressionism",
      "art history",
      "perspective",
      "light",
    ],
    misconceptionTargets: [
      "collapsing both into 'realistic painting' without period differences",
      "treating Impressionism as unfinished sketches without light/color intent",
    ],
    successLooksLike:
      "Contrasting traits for both periods plus a value/priority sentence each.",
    scaffolds: [
      hint(
        "Renaissance cue",
        "Think linear perspective, modeled form, classical/ideal subjects.",
      ),
      step(
        "Impressionism cue",
        "Think fleeting light, visible brushwork, outdoor scenes, color broken into strokes.",
      ),
      checklist(
        "Period checklist",
        "Renaissance traits · Impressionism traits · values stated",
      ),
    ],
    criteria: [
      {
        id: "renaissance",
        label: "Renaissance traits",
        mustIncludeAny: [
          "renaissance",
          "perspective",
          "ideal",
          "classical",
          "modeled",
          "anatomy",
        ],
      },
      {
        id: "impressionism",
        label: "Impressionism traits",
        mustIncludeAny: [
          "impression",
          "light",
          "brush",
          "outdoor",
          "plein",
          "broken color",
        ],
      },
      {
        id: "contrast",
        label: "Period contrast",
        mustIncludeAny: [
          "unlike",
          "whereas",
          "while",
          "differ",
          "contrast",
          "vs",
        ],
      },
    ],
  },

  // —— Music ——
  {
    id: "lab-music-notation-note-values",
    kind: "lab",
    title: "Note-value relationships",
    objective:
      "Perform relationships among whole, half, and quarter note values.",
    prompt:
      "Lab (notation literacy — no audio scoring): In common time, state how many half notes equal one whole note, how many quarter notes equal one half note, and write one short rhythm pattern using only those three values that fills one measure.",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "music",
    minChars: 45,
    conceptHints: [
      "note values",
      "whole note",
      "half note",
      "quarter note",
      "music notation",
    ],
    misconceptionTargets: [
      "treating a half note as twice a whole note",
      "ignoring that values nest by halves in common simple meter",
    ],
    successLooksLike:
      "2 halves = 1 whole; 2 quarters = 1 half; one valid one-measure pattern.",
    scaffolds: [
      hint(
        "Halving rule",
        "Each step down the tree usually halves duration (whole → half → quarter).",
      ),
      step(
        "Fill the bar",
        "In 4/4, total duration should equal four quarter-note beats.",
      ),
      checklist(
        "Note-value checklist",
        "Whole/half · half/quarter · one-measure pattern",
      ),
    ],
    criteria: [
      {
        id: "whole-half",
        label: "Whole vs half",
        mustIncludeAny: ["2", "two", "whole", "half"],
      },
      {
        id: "half-quarter",
        label: "Half vs quarter",
        mustIncludeAny: ["quarter", "half", "2", "two"],
      },
      {
        id: "pattern",
        label: "Measure pattern",
        mustIncludeAny: [
          "measure",
          "bar",
          "pattern",
          "rhythm",
          "4/4",
          "beats",
        ],
      },
    ],
  },
  {
    id: "write-music-dynamics-terms",
    kind: "writing",
    title: "Dynamics: forte, piano, crescendo",
    objective:
      "Explain common dynamic terms and how they shape musical expression.",
    prompt:
      "Writing: Define forte, piano, and crescendo in plain language. Give one performance or listening scenario where switching from piano to forte (or adding a crescendo) changes the expressive effect. Educational music literacy — no audio upload required.",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "EXPLAIN",
    asPerform: false,
    domainTag: "music",
    minChars: 48,
    conceptHints: [
      "dynamics",
      "forte",
      "piano",
      "crescendo",
      "music",
    ],
    misconceptionTargets: [
      "confusing piano (soft) with the keyboard instrument only",
      "treating crescendo as a sudden jump instead of a gradual change",
    ],
    successLooksLike:
      "Clear definitions plus a scenario where volume change alters expression.",
    scaffolds: [
      hint(
        "Italian roots",
        "Forte ≈ loud; piano ≈ soft; crescendo ≈ gradually louder.",
      ),
      step(
        "Expressive why",
        "Link the dynamic change to tension, arrival, or surprise.",
      ),
      checklist(
        "Dynamics checklist",
        "Forte · piano · crescendo · expressive scenario",
      ),
    ],
    criteria: [
      {
        id: "forte",
        label: "Forte",
        mustIncludeAny: ["forte", "loud", "strong"],
      },
      {
        id: "piano",
        label: "Piano (soft)",
        mustIncludeAny: ["piano", "soft", "quiet"],
      },
      {
        id: "crescendo",
        label: "Crescendo",
        mustIncludeAny: [
          "crescendo",
          "gradual",
          "getting louder",
          "increase",
        ],
      },
    ],
  },
  {
    id: "sim-music-form-aba",
    kind: "simulation",
    title: "Identify ABA form",
    objective:
      "Apply ABA formal listening by mapping described sections.",
    prompt:
      "Simulation: A piece has Section A (bright march theme), Section B (slower lyrical contrast), then a return of the march theme. Label the form, explain what makes the return an 'A' again, and name one listening cue that signals the B section.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "music",
    minChars: 45,
    conceptHints: [
      "aba form",
      "ternary",
      "theme return",
      "contrast",
      "music form",
    ],
    misconceptionTargets: [
      "calling any three sections ABA without a true return of A",
      "ignoring contrast cues that mark the middle section",
    ],
    successLooksLike:
      "Labels ABA/ternary, justifies A return, and names a B contrast cue.",
    scaffolds: [
      hint(
        "Return = A",
        "The third section matches the first theme — that closes the ABA arch.",
      ),
      step(
        "B contrast",
        "Tempo, mood, or texture shifts often mark the middle section.",
      ),
      checklist(
        "ABA checklist",
        "Form label · A return · B cue",
      ),
    ],
    criteria: [
      {
        id: "form",
        label: "ABA / ternary",
        mustIncludeAny: ["aba", "ternary", "a-b-a", "return"],
      },
      {
        id: "return",
        label: "A return",
        mustIncludeAny: [
          "return",
          "same theme",
          "march",
          "again",
          "comes back",
        ],
      },
      {
        id: "contrast",
        label: "B contrast cue",
        mustIncludeAny: [
          "slower",
          "lyrical",
          "contrast",
          "middle",
          "section b",
        ],
      },
    ],
  },
  {
    id: "write-music-tempo-retain",
    kind: "writing",
    title: "Tempo terms retrieval",
    objective:
      "Retrieve meanings of allegro, adagio, and andante.",
    prompt:
      "Without notes: Define allegro, adagio, and andante as tempo terms. Rank them from slowest to fastest and give one everyday analogy for each pace (educational music literacy).",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "RETAIN",
    asPerform: false,
    domainTag: "music",
    minChars: 45,
    conceptHints: [
      "tempo",
      "allegro",
      "adagio",
      "andante",
      "music",
    ],
    misconceptionTargets: [
      "swapping allegro and adagio speeds",
      "treating andante as the fastest of the three",
    ],
    successLooksLike:
      "Correct definitions, slow→fast order (adagio → andante → allegro), analogies.",
    scaffolds: [
      hint(
        "Speed map",
        "Adagio is slow; andante is a walking pace; allegro is lively/fast.",
      ),
      step(
        "Rank then analogize",
        "Order the three, then match each to a familiar movement speed.",
      ),
      checklist(
        "Tempo checklist",
        "Three definitions · order · analogies",
      ),
    ],
    criteria: [
      {
        id: "terms",
        label: "Tempo terms",
        mustIncludeAny: ["allegro", "adagio", "andante"],
      },
      {
        id: "order",
        label: "Slow to fast",
        mustIncludeAny: [
          "slow",
          "fast",
          "walking",
          "lively",
          "order",
        ],
      },
      {
        id: "meaning",
        label: "Meanings / pace",
        mustIncludeAny: [
          "slow",
          "fast",
          "moderate",
          "walk",
          "quick",
          "lively",
        ],
      },
    ],
  },

  // —— Sociology ——
  {
    id: "write-sociology-norms-vs-values",
    kind: "writing",
    title: "Norms versus values",
    objective:
      "Explain the difference between social norms and values.",
    prompt:
      "Writing (neutral educational sociology): Explain norms vs values. Give one classroom-friendly example of each and state how a norm can express an underlying value without being identical to it.",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "EXPLAIN",
    asPerform: false,
    domainTag: "sociology",
    minChars: 50,
    conceptHints: [
      "norms",
      "values",
      "social expectations",
      "sociology",
      "culture",
    ],
    misconceptionTargets: [
      "using norms and values as interchangeable synonyms",
      "treating every personal preference as a social norm",
    ],
    successLooksLike:
      "Values as ideals; norms as expected behaviors; linked example pair.",
    scaffolds: [
      hint(
        "Ideals vs rules-in-practice",
        "Values are shared ideas of what is good/important; norms are expected behaviors.",
      ),
      step(
        "Link them",
        "Show how a behavior rule (norm) can rest on a broader ideal (value).",
      ),
      checklist(
        "Norms/values checklist",
        "Norms defined · values defined · example link",
      ),
    ],
    criteria: [
      {
        id: "norms",
        label: "Norms",
        mustIncludeAny: [
          "norm",
          "expectation",
          "behavior",
          "rule",
          "should",
        ],
      },
      {
        id: "values",
        label: "Values",
        mustIncludeAny: [
          "value",
          "ideal",
          "important",
          "belief",
          "principle",
        ],
      },
      {
        id: "link",
        label: "How they relate",
        mustIncludeAny: [
          "express",
          "reflect",
          "underlying",
          "because",
          "based on",
          "example",
        ],
      },
    ],
  },
  {
    id: "sim-sociology-role-conflict",
    kind: "simulation",
    title: "Student–worker role conflict",
    objective:
      "Apply role-conflict analysis to a student-worker scenario.",
    prompt:
      "Simulation (educational, nonpartisan): You have an exam at 8 a.m. and a shift that ends at 2 a.m. Name the two roles in conflict, one concrete demand from each, and one coping strategy that reduces the clash without blaming either role.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "sociology",
    minChars: 48,
    conceptHints: [
      "role conflict",
      "student",
      "worker",
      "competing demands",
      "sociology",
    ],
    misconceptionTargets: [
      "treating role conflict as personal failure rather than competing expectations",
      "naming only one role when two status positions pull in different directions",
    ],
    successLooksLike:
      "Student + worker roles, opposing demands, and a workable coping strategy.",
    scaffolds: [
      hint(
        "Two hats",
        "Role conflict = incompatible expectations from different positions you hold.",
      ),
      step(
        "Coping ideas",
        "Schedule negotiation, sleep/study tradeoff planning, or temporary role prioritization are educational examples.",
      ),
      checklist(
        "Role-conflict checklist",
        "Two roles · demands · coping strategy",
      ),
    ],
    criteria: [
      {
        id: "roles",
        label: "Two roles",
        mustIncludeAny: ["student", "worker", "employee", "job", "shift"],
      },
      {
        id: "demands",
        label: "Competing demands",
        mustIncludeAny: [
          "exam",
          "shift",
          "sleep",
          "study",
          "work",
          "conflict",
        ],
      },
      {
        id: "cope",
        label: "Coping strategy",
        mustIncludeAny: [
          "schedule",
          "negotiate",
          "priorit",
          "plan",
          "ask",
          "swap",
          "rest",
        ],
      },
    ],
  },
  {
    id: "lab-sociology-research-method",
    kind: "lab",
    title: "Survey vs interview choice",
    objective:
      "Perform method selection between survey and interview for a research question.",
    prompt:
      "Lab (educational methods): Research question — 'How do first-year students describe feeling welcome in the dining hall?' Choose survey or interview as the better primary method, justify with one strength of that method, and name one limitation you accept.",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "sociology",
    minChars: 50,
    conceptHints: [
      "survey",
      "interview",
      "research methods",
      "qualitative",
      "sociology",
    ],
    misconceptionTargets: [
      "picking a method without linking to the kind of data the question needs",
      "assuming surveys always capture rich lived description better than interviews",
    ],
    successLooksLike:
      "Method chosen with a fit reason (likely interview for rich description) and a limitation.",
    scaffolds: [
      hint(
        "Question type",
        "'How do they describe…' often needs open narrative depth.",
      ),
      step(
        "Tradeoff",
        "Interviews: depth, fewer people; surveys: breadth, less nuance.",
      ),
      checklist(
        "Method checklist",
        "Choice · strength · limitation",
      ),
    ],
    criteria: [
      {
        id: "method",
        label: "Method choice",
        mustIncludeAny: ["survey", "interview"],
      },
      {
        id: "strength",
        label: "Strength / fit",
        mustIncludeAny: [
          "depth",
          "breadth",
          "describe",
          "open",
          "nuance",
          "many",
          "scale",
        ],
      },
      {
        id: "limit",
        label: "Limitation",
        mustIncludeAny: [
          "limit",
          "bias",
          "sample",
          "time",
          "generaliz",
          "fewer",
          "shallow",
        ],
      },
    ],
  },
  {
    id: "write-sociology-institution-retain",
    kind: "writing",
    title: "Major social institutions",
    objective:
      "Retrieve major social institutions in educational terms.",
    prompt:
      "Without notes (neutral educational sociology): Name at least four major social institutions (e.g., family, education, economy, government, religion, media). For two of them, state one function they typically serve for a society.",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "RETAIN",
    asPerform: false,
    domainTag: "sociology",
    minChars: 48,
    conceptHints: [
      "social institutions",
      "family",
      "education",
      "economy",
      "government",
      "sociology",
    ],
    misconceptionTargets: [
      "listing only informal friend groups as institutions",
      "naming institutions without any societal function",
    ],
    successLooksLike:
      "Four+ institutions listed; two functions stated educationally.",
    scaffolds: [
      hint(
        "Stable structures",
        "Institutions are enduring patterned ways societies organize key needs.",
      ),
      step(
        "Function examples",
        "Education: skill transmission; government: public order/rules; family: care/socialization (educational framing).",
      ),
      checklist(
        "Institutions checklist",
        "Four named · two functions",
      ),
    ],
    criteria: [
      {
        id: "list",
        label: "Institutions named",
        mustIncludeAny: [
          "family",
          "education",
          "economy",
          "government",
          "religion",
          "media",
        ],
      },
      {
        id: "count",
        label: "Multiple institutions",
        mustIncludeAny: [
          "family",
          "education",
          "government",
          "economy",
        ],
      },
      {
        id: "function",
        label: "Functions",
        mustIncludeAny: [
          "function",
          "serve",
          "provide",
          "socializ",
          "order",
          "teach",
          "care",
        ],
      },
    ],
  },

  // —— Geography ——
  {
    id: "write-geography-lat-long",
    kind: "writing",
    title: "Latitude versus longitude",
    objective:
      "Explain latitude vs longitude and how they locate places.",
    prompt:
      "Writing: Explain latitude and longitude. State which measures north–south from the equator, which measures east–west from the prime meridian, and give one example coordinate pair idea (approximate) for a familiar city or region.",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "EXPLAIN",
    asPerform: false,
    domainTag: "geography",
    minChars: 48,
    conceptHints: [
      "latitude",
      "longitude",
      "equator",
      "prime meridian",
      "coordinates",
      "geography",
    ],
    misconceptionTargets: [
      "swapping which gridline set runs north–south vs east–west measurement",
      "thinking coordinates work without a reference (equator/prime meridian)",
    ],
    successLooksLike:
      "Lat = N/S from equator; long = E/W from prime meridian; example pair.",
    scaffolds: [
      hint(
        "Ladder vs long ways",
        "Latitude lines are like rungs (parallels); longitude lines run pole to pole.",
      ),
      step(
        "References",
        "0° latitude = equator; 0° longitude = prime meridian.",
      ),
      checklist(
        "Lat/long checklist",
        "Latitude · longitude · example",
      ),
    ],
    criteria: [
      {
        id: "lat",
        label: "Latitude",
        mustIncludeAny: [
          "latitude",
          "equator",
          "north",
          "south",
          "parallel",
        ],
      },
      {
        id: "long",
        label: "Longitude",
        mustIncludeAny: [
          "longitude",
          "prime meridian",
          "east",
          "west",
          "meridian",
        ],
      },
      {
        id: "example",
        label: "Example / use",
        mustIncludeAny: [
          "coordinate",
          "example",
          "city",
          "degrees",
          "locate",
        ],
      },
    ],
  },
  {
    id: "sim-geography-urbanization-tradeoff",
    kind: "simulation",
    title: "Urbanization benefits and costs",
    objective:
      "Apply a balanced benefits/costs analysis of urbanization.",
    prompt:
      "Simulation: A mid-size region is rapidly urbanizing. Name two benefits of urbanization, two costs/challenges, and one planning response that tries to keep a benefit while reducing a cost (educational geography — not a policy endorsement).",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "geography",
    minChars: 52,
    conceptHints: [
      "urbanization",
      "cities",
      "tradeoff",
      "infrastructure",
      "geography",
    ],
    misconceptionTargets: [
      "listing only benefits or only harms",
      "proposing a response that ignores the named cost",
    ],
    successLooksLike:
      "Two benefits, two costs, and a planning response linking both sides.",
    scaffolds: [
      hint(
        "Both sides",
        "Jobs/services often rise with density; congestion/housing stress can rise too.",
      ),
      step(
        "Response link",
        "Transit, zoning, or green space are educational examples of balancing moves.",
      ),
      checklist(
        "Urbanization checklist",
        "Benefits · costs · planning response",
      ),
    ],
    criteria: [
      {
        id: "benefits",
        label: "Benefits",
        mustIncludeAny: [
          "job",
          "service",
          "econom",
          "access",
          "cultur",
          "opportun",
        ],
      },
      {
        id: "costs",
        label: "Costs",
        mustIncludeAny: [
          "congest",
          "pollut",
          "housing",
          "sprawl",
          "cost",
          "crowd",
          "inequal",
        ],
      },
      {
        id: "response",
        label: "Planning response",
        mustIncludeAny: [
          "transit",
          "plan",
          "zoning",
          "infrastructure",
          "green",
          "policy",
          "housing",
        ],
      },
    ],
  },
  {
    id: "lab-geography-climate-zone",
    kind: "lab",
    title: "Match climate clues to zone",
    objective:
      "Perform matching of climate clues to a climate-zone type.",
    prompt:
      "Lab: Clues — year-round high temperatures, heavy rainfall most months, dense broadleaf evergreen vegetation. Name the climate-zone type this best matches (e.g., tropical rainforest), cite two clues that drove your match, and name one zone it is not (with a reason).",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "geography",
    minChars: 48,
    conceptHints: [
      "climate zones",
      "tropical",
      "rainfall",
      "vegetation",
      "geography",
    ],
    misconceptionTargets: [
      "matching only on temperature while ignoring precipitation/vegetation",
      "confusing tropical rainforest with desert heat alone",
    ],
    successLooksLike:
      "Tropical rainforest (or equivalent), two supporting clues, one rejected zone.",
    scaffolds: [
      hint(
        "Hot + wet + dense forest",
        "High heat plus abundant rain points away from deserts or polar zones.",
      ),
      step(
        "Reject a near miss",
        "Savanna/monsoon patterns often have a strong dry season — check the clues.",
      ),
      checklist(
        "Climate-zone checklist",
        "Zone named · two clues · rejected zone",
      ),
    ],
    criteria: [
      {
        id: "zone",
        label: "Zone type",
        mustIncludeAny: [
          "tropical",
          "rainforest",
          "equatorial",
          "af",
        ],
      },
      {
        id: "clues",
        label: "Supporting clues",
        mustIncludeAny: [
          "rain",
          "hot",
          "temperature",
          "vegetation",
          "evergreen",
        ],
      },
      {
        id: "not",
        label: "Rejected zone",
        mustIncludeAny: [
          "desert",
          "polar",
          "tundra",
          "not",
          "unlike",
          "savanna",
        ],
      },
    ],
  },
  {
    id: "sim-geography-resource-conflict-edu",
    kind: "simulation",
    title: "Water allocation between towns",
    objective:
      "Apply a neutral educational analysis of shared water allocation.",
    prompt:
      "Simulation (neutral educational): Upstream Town A and Downstream Town B share one river. A wants more irrigation; B needs reliable drinking supply. Name the resource tension, one fair-process idea (data sharing, caps, or rotation), and one unintended effect if A takes unchecked volume.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "geography",
    minChars: 50,
    conceptHints: [
      "water resources",
      "allocation",
      "upstream",
      "downstream",
      "geography",
    ],
    misconceptionTargets: [
      "assuming unlimited river supply with no downstream impact",
      "framing the scenario as a partisan contest rather than a resource tradeoff",
    ],
    successLooksLike:
      "Names shared-scarce water tension, a process idea, and a downstream harm.",
    scaffolds: [
      hint(
        "Connected system",
        "What A withdraws reduces what reaches B unless managed.",
      ),
      step(
        "Process over winners",
        "Focus on transparent rules and monitoring, not blaming towns.",
      ),
      checklist(
        "Allocation checklist",
        "Tension · process idea · unintended effect",
      ),
    ],
    criteria: [
      {
        id: "tension",
        label: "Resource tension",
        mustIncludeAny: [
          "water",
          "scarce",
          "share",
          "upstream",
          "downstream",
          "conflict",
          "allocation",
        ],
      },
      {
        id: "process",
        label: "Fair process",
        mustIncludeAny: [
          "share",
          "cap",
          "rotation",
          "monitor",
          "data",
          "agreement",
          "quota",
          "negotiate",
        ],
      },
      {
        id: "effect",
        label: "Unintended effect",
        mustIncludeAny: [
          "downstream",
          "shortag",
          "drinking",
          "dry",
          "reduce",
          "flow",
        ],
      },
    ],
  },

  // —— Literature ——
  {
    id: "write-literature-tone-vs-mood",
    kind: "writing",
    title: "Tone versus mood",
    objective:
      "Explain tone vs mood with evidence placeholders, not one fixed reading.",
    prompt:
      "Writing (evidence-based, not one true interpretation): Explain tone (author/narrator attitude) vs mood (reader feeling). Using placeholders like [word choice] and [image], show how you would cite evidence for each without claiming a single correct reading of a whole text.",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "EXPLAIN",
    asPerform: false,
    domainTag: "literature",
    minChars: 52,
    conceptHints: [
      "tone",
      "mood",
      "diction",
      "evidence",
      "literature",
    ],
    misconceptionTargets: [
      "using tone and mood as synonyms",
      "asserting mood without pointing to textual cues",
    ],
    successLooksLike:
      "Clear tone/mood split plus evidence-placeholder citations for each.",
    scaffolds: [
      hint(
        "Who feels what",
        "Tone ≈ attitude in the voice; mood ≈ atmosphere you experience.",
      ),
      step(
        "Evidence slots",
        "Point to diction, imagery, or punctuation as support — keep claims provisional.",
      ),
      checklist(
        "Tone/mood checklist",
        "Tone defined · mood defined · evidence placeholders",
      ),
    ],
    criteria: [
      {
        id: "tone",
        label: "Tone",
        mustIncludeAny: [
          "tone",
          "attitude",
          "narrator",
          "author",
          "voice",
        ],
      },
      {
        id: "mood",
        label: "Mood",
        mustIncludeAny: [
          "mood",
          "feeling",
          "atmosphere",
          "reader",
          "emotion",
        ],
      },
      {
        id: "evidence",
        label: "Evidence",
        mustIncludeAny: [
          "evidence",
          "diction",
          "word choice",
          "image",
          "because",
          "cite",
        ],
      },
    ],
  },
  {
    id: "lab-literature-plot-structure",
    kind: "lab",
    title: "Plot structure in a synopsis",
    objective:
      "Perform identification of exposition, climax, and resolution in a short synopsis.",
    prompt:
      "Lab: Synopsis — Maya moves to a new school (nervous). Midyear she confronts a rumor at a packed assembly (peak tension). Later she and a former rival start a peer-support club (aftermath). Label exposition, climax, and resolution and quote a phrase cue for each.",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "literature",
    minChars: 50,
    conceptHints: [
      "plot structure",
      "exposition",
      "climax",
      "resolution",
      "literature",
    ],
    misconceptionTargets: [
      "calling the first exciting moment the climax without peak conflict",
      "omitting resolution as anything after the peak",
    ],
    successLooksLike:
      "Exposition = move/nervous; climax = assembly confrontation; resolution = club aftermath.",
    scaffolds: [
      hint(
        "Setup → peak → aftermath",
        "Exposition sets situation; climax is the turning peak; resolution settles aftermath.",
      ),
      step(
        "Phrase cues",
        "Pull short phrases from the synopsis for each label.",
      ),
      checklist(
        "Plot checklist",
        "Exposition · climax · resolution · cues",
      ),
    ],
    criteria: [
      {
        id: "exposition",
        label: "Exposition",
        mustIncludeAny: [
          "exposition",
          "moves",
          "new school",
          "nervous",
          "setup",
        ],
      },
      {
        id: "climax",
        label: "Climax",
        mustIncludeAny: [
          "climax",
          "assembly",
          "rumor",
          "confront",
          "peak",
        ],
      },
      {
        id: "resolution",
        label: "Resolution",
        mustIncludeAny: [
          "resolution",
          "club",
          "aftermath",
          "peer-support",
          "later",
        ],
      },
    ],
  },
  {
    id: "sim-literature-unreliable-narrator",
    kind: "simulation",
    title: "Cues of unreliable narration",
    objective:
      "Apply detection of unreliable-narrator cues in a vignette.",
    prompt:
      "Simulation: A narrator insists 'everyone loves me' while describing friends who avoid eye contact and cancel plans. Name two cues that the narration may be unreliable, one alternative reading of events, and why evidence matters more than the narrator’s self-claim.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "literature",
    minChars: 50,
    conceptHints: [
      "unreliable narrator",
      "narrative bias",
      "textual evidence",
      "literature",
      "point of view",
    ],
    misconceptionTargets: [
      "trusting narrator claims over contradictory details",
      "calling a narrator unreliable with no textual mismatch",
    ],
    successLooksLike:
      "Two mismatch cues, an alternate reading, and an evidence-over-claim point.",
    scaffolds: [
      hint(
        "Claim vs detail",
        "Look for gaps between what is said and what is shown.",
      ),
      step(
        "Other reading",
        "Friends’ avoidance may signal dislike or discomfort — provisional.",
      ),
      checklist(
        "Unreliable-narrator checklist",
        "Two cues · alternate reading · evidence priority",
      ),
    ],
    criteria: [
      {
        id: "cues",
        label: "Unreliability cues",
        mustIncludeAny: [
          "avoid",
          "cancel",
          "contradict",
          "mismatch",
          "claim",
          "eye contact",
        ],
      },
      {
        id: "alternate",
        label: "Alternate reading",
        mustIncludeAny: [
          "dislike",
          "uncomfortable",
          "not loved",
          "alternative",
          "maybe",
          "instead",
        ],
      },
      {
        id: "evidence",
        label: "Evidence over claim",
        mustIncludeAny: [
          "evidence",
          "detail",
          "show",
          "rather than",
          "claim",
          "actions",
        ],
      },
    ],
  },
  {
    id: "write-literature-close-read-retain",
    kind: "writing",
    title: "Close-reading steps retrieval",
    objective:
      "Retrieve the notice → evidence → claim close-reading sequence.",
    prompt:
      "Without notes: Retrieve the close-reading steps notice → evidence → claim. Define each step in one sentence and explain why claim comes last (evidence-based reading — not one true interpretation).",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "RETAIN",
    asPerform: false,
    domainTag: "literature",
    minChars: 48,
    conceptHints: [
      "close reading",
      "notice",
      "evidence",
      "claim",
      "literature",
    ],
    misconceptionTargets: [
      "starting with a big claim before noticing details",
      "skipping textual evidence between notice and claim",
    ],
    successLooksLike:
      "All three steps defined in order; claim justified as last.",
    scaffolds: [
      hint(
        "Order matters",
        "Notice details → gather evidence → only then stake a claim.",
      ),
      step(
        "Why last",
        "Claims without evidence become opinions floating free of the text.",
      ),
      checklist(
        "Close-read checklist",
        "Notice · evidence · claim · order reason",
      ),
    ],
    criteria: [
      {
        id: "notice",
        label: "Notice",
        mustIncludeAny: ["notice", "observe", "detail", "spot"],
      },
      {
        id: "evidence",
        label: "Evidence",
        mustIncludeAny: ["evidence", "quote", "textual", "support"],
      },
      {
        id: "claim",
        label: "Claim last",
        mustIncludeAny: [
          "claim",
          "last",
          "after",
          "then",
          "interpret",
        ],
      },
    ],
  },

  // —— Communication ——
  {
    id: "sim-communication-channel-fail",
    kind: "simulation",
    title: "Wrong channel diagnosis",
    objective:
      "Apply channel selection judgment when email fails an urgent safety need.",
    prompt:
      "Simulation: A lab smell of gas is reported by email to a general inbox that is checked twice daily. Diagnose why the channel fails, name a better channel for urgent safety, and state one follow-up confirmation step.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "communication",
    minChars: 48,
    conceptHints: [
      "communication channel",
      "urgency",
      "safety",
      "medium richness",
      "communication",
    ],
    misconceptionTargets: [
      "treating email as always fine because a message was 'sent'",
      "skipping confirmation that the urgent message was received",
    ],
    successLooksLike:
      "Email too slow/async for gas smell; call/radio/in-person; confirm receipt.",
    scaffolds: [
      hint(
        "Match speed to risk",
        "Safety hazards need immediate, interruptive channels.",
      ),
      step(
        "Close the loop",
        "Sending is not enough — confirm someone is acting.",
      ),
      checklist(
        "Channel checklist",
        "Failure reason · better channel · confirmation",
      ),
    ],
    criteria: [
      {
        id: "fail",
        label: "Channel failure",
        mustIncludeAny: [
          "email",
          "slow",
          "delay",
          "inbox",
          "async",
          "not checked",
        ],
      },
      {
        id: "better",
        label: "Better channel",
        mustIncludeAny: [
          "call",
          "phone",
          "radio",
          "in person",
          "alarm",
          "emergency",
          "intercom",
        ],
      },
      {
        id: "confirm",
        label: "Confirmation",
        mustIncludeAny: [
          "confirm",
          "acknowledge",
          "follow",
          "heard",
          "respond",
          "receipt",
        ],
      },
    ],
  },
  {
    id: "write-communication-tone-rewrite",
    kind: "writing",
    title: "Professional tone rewrite",
    objective:
      "Explain and practice rewriting a harsh message professionally.",
    prompt:
      "Writing/practice: Original — 'Your report is useless and you wasted everyone’s time.' Rewrite it professionally: keep the need for clearer data, remove insult, and add one specific next step. Briefly explain what tone change you made.",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "EXPLAIN",
    asPerform: false,
    domainTag: "communication",
    minChars: 52,
    conceptHints: [
      "professional tone",
      "rewrite",
      "feedback",
      "respect",
      "communication",
    ],
    misconceptionTargets: [
      "softening so much that the performance need disappears",
      "keeping blame words while adding a polite greeting",
    ],
    successLooksLike:
      "Respectful rewrite with clear data need, next step, and tone note.",
    scaffolds: [
      hint(
        "Behavior not identity",
        "Critique the deliverable/gap, not the person.",
      ),
      step(
        "Add a path",
        "Name what 'clearer data' looks like and when it is due.",
      ),
      checklist(
        "Rewrite checklist",
        "Rewrite · need kept · next step · tone explanation",
      ),
    ],
    criteria: [
      {
        id: "rewrite",
        label: "Professional rewrite",
        mustIncludeAny: [
          "report",
          "data",
          "please",
          "could",
          "clarify",
          "revise",
        ],
      },
      {
        id: "next",
        label: "Next step",
        mustIncludeAny: [
          "next",
          "by",
          "deadline",
          "revise",
          "include",
          "send",
        ],
      },
      {
        id: "tone",
        label: "Tone change",
        mustIncludeAny: [
          "tone",
          "respect",
          "professional",
          "removed",
          "insult",
          "harsh",
        ],
      },
    ],
  },
  {
    id: "lab-communication-elevator-pitch",
    kind: "lab",
    title: "30-second elevator pitch",
    objective:
      "Perform structuring a 30-second elevator pitch.",
    prompt:
      "Lab: Build a 30-second pitch for a campus tutoring app. Include hook, who it helps, one concrete benefit, and a closing ask. Keep it speakable in about 30 seconds (educational practice).",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "communication",
    minChars: 50,
    conceptHints: [
      "elevator pitch",
      "hook",
      "benefit",
      "ask",
      "communication",
    ],
    misconceptionTargets: [
      "listing every feature instead of one clear benefit",
      "ending without an ask or next step",
    ],
    successLooksLike:
      "Hook + audience + benefit + ask in a brief speakable structure.",
    scaffolds: [
      hint(
        "Four beats",
        "Hook → audience → benefit → ask.",
      ),
      step(
        "Speakable length",
        "Aim for a few short sentences, not a paragraph dump.",
      ),
      checklist(
        "Pitch checklist",
        "Hook · who · benefit · ask",
      ),
    ],
    criteria: [
      {
        id: "hook",
        label: "Hook",
        mustIncludeAny: [
          "hook",
          "imagine",
          "what if",
          "problem",
          "students",
        ],
      },
      {
        id: "benefit",
        label: "Benefit",
        mustIncludeAny: [
          "benefit",
          "help",
          "save",
          "faster",
          "tutor",
          "learn",
        ],
      },
      {
        id: "ask",
        label: "Closing ask",
        mustIncludeAny: [
          "ask",
          "demo",
          "try",
          "meet",
          "pilot",
          "sign up",
        ],
      },
    ],
  },
  {
    id: "present-communication-status-update",
    kind: "presentation",
    title: "Status update for mixed stakeholders",
    objective:
      "Perform a status-update outline for mixed technical and non-technical stakeholders.",
    prompt:
      "Presentation practice: Outline a 4-minute project status update for mixed stakeholders (engineers + sponsors). Include: progress since last update, one risk/blocker, one decision needed, and how you will adjust language for each audience. Educational presentation practice.",
    learningObjectType: "PRESENTATION_PRACTICE",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "communication",
    minChars: 55,
    conceptHints: [
      "status update",
      "stakeholders",
      "risk",
      "decision",
      "presentation",
      "communication",
    ],
    misconceptionTargets: [
      "burying the decision ask under raw task lists",
      "using identical jargon for sponsors and engineers",
    ],
    successLooksLike:
      "Progress, risk, decision ask, and audience language adaptations.",
    scaffolds: [
      hint(
        "Lead with need",
        "Sponsors often need the decision; engineers need the blocker detail.",
      ),
      step(
        "Split language",
        "Plain outcome language for sponsors; specifics for engineers.",
      ),
      checklist(
        "Status-update checklist",
        "Progress · risk · decision · audience adapt",
      ),
    ],
    criteria: [
      {
        id: "progress",
        label: "Progress",
        mustIncludeAny: [
          "progress",
          "completed",
          "since",
          "done",
          "update",
        ],
      },
      {
        id: "risk",
        label: "Risk / blocker",
        mustIncludeAny: [
          "risk",
          "blocker",
          "delay",
          "issue",
          "blocked",
        ],
      },
      {
        id: "decision",
        label: "Decision / audience",
        mustIncludeAny: [
          "decision",
          "need",
          "sponsor",
          "engineer",
          "audience",
          "jargon",
        ],
      },
    ],
  },

  // —— Earth science ——
  {
    id: "lab-earth-rock-cycle",
    kind: "lab",
    title: "Rock cycle path lab",
    objective:
      "Perform tracing a sedimentary → metamorphic path in the rock cycle.",
    prompt:
      "Lab: Trace a path from sedimentary rock to metamorphic rock. Name the key processes (burial, heat, pressure), one observable clue of metamorphism, and what would be needed to melt the rock toward igneous instead.",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "earth science",
    minChars: 50,
    conceptHints: [
      "rock cycle",
      "sedimentary",
      "metamorphic",
      "heat",
      "pressure",
      "earth science",
    ],
    misconceptionTargets: [
      "skipping heat/pressure and jumping straight to melting for metamorphism",
      "thinking sedimentary rock cannot change without becoming sediment again first",
    ],
    successLooksLike:
      "Burial + heat/pressure → metamorphic; melt needed for igneous path.",
    scaffolds: [
      hint(
        "Change without melt",
        "Metamorphism transforms rock in the solid state under heat/pressure.",
      ),
      step(
        "Igneous fork",
        "Melting + cooling/crystallization opens the igneous branch.",
      ),
      checklist(
        "Rock-cycle checklist",
        "Path · processes · metamorphic clue · melt condition",
      ),
    ],
    criteria: [
      {
        id: "path",
        label: "Sedimentary to metamorphic",
        mustIncludeAny: [
          "sedimentary",
          "metamorphic",
          "burial",
          "heat",
          "pressure",
        ],
      },
      {
        id: "clue",
        label: "Metamorphic clue",
        mustIncludeAny: [
          "foliat",
          "band",
          "recrystall",
          "texture",
          "mineral",
        ],
      },
      {
        id: "melt",
        label: "Melt toward igneous",
        mustIncludeAny: [
          "melt",
          "magma",
          "igneous",
          "cool",
          "crystal",
        ],
      },
    ],
  },
  {
    id: "sim-earth-plate-boundary",
    kind: "simulation",
    title: "Plate boundary and hazard",
    objective:
      "Apply matching of plate-boundary type to a typical hazard.",
    prompt:
      "Simulation: Match boundary types to hazards — (1) two plates slide past each other, (2) oceanic plate sinks beneath another, (3) plates pull apart. For each, name the boundary type and one associated hazard (earthquake, volcano, rift-related activity). Educational earth science.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "earth science",
    minChars: 52,
    conceptHints: [
      "plate boundaries",
      "transform",
      "convergent",
      "divergent",
      "earthquake",
      "volcano",
    ],
    misconceptionTargets: [
      "assuming all boundaries produce identical hazards",
      "placing subduction volcanoes on transform boundaries only",
    ],
    successLooksLike:
      "Transform→quakes; convergent/subduction→volcanoes/quakes; divergent→rift/volcanism.",
    scaffolds: [
      hint(
        "Three motions",
        "Slide past = transform; collide/sink = convergent; pull apart = divergent.",
      ),
      step(
        "Hazard link",
        "Subduction often builds magma; transform focuses shear quakes.",
      ),
      checklist(
        "Boundary checklist",
        "Three types · three hazards",
      ),
    ],
    criteria: [
      {
        id: "transform",
        label: "Transform",
        mustIncludeAny: [
          "transform",
          "slide",
          "earthquake",
          "strike-slip",
        ],
      },
      {
        id: "convergent",
        label: "Convergent / subduction",
        mustIncludeAny: [
          "convergent",
          "subduct",
          "volcano",
          "sink",
        ],
      },
      {
        id: "divergent",
        label: "Divergent",
        mustIncludeAny: [
          "divergent",
          "rift",
          "pull apart",
          "spreading",
          "volcan",
        ],
      },
    ],
  },
  {
    id: "write-earth-weather-vs-climate-retain",
    kind: "writing",
    title: "Weather vs climate (30-year normals)",
    objective:
      "Retain the weather vs climate distinction using 30-year climate normals.",
    prompt:
      "Without notes (new angle): Distinguish weather from climate using the idea of ~30-year climate normals. Explain why one extreme week does not redefine a region’s climate normal, and what kind of record would speak to climate.",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "RETAIN",
    asPerform: false,
    domainTag: "earth science",
    minChars: 48,
    conceptHints: [
      "weather",
      "climate",
      "30-year normals",
      "long-term average",
      "earth science",
    ],
    misconceptionTargets: [
      "treating a single storm week as a new climate classification",
      "ignoring multi-decade averages when defining climate",
    ],
    successLooksLike:
      "Weather = short-term; climate ≈ long-term normals (~30 years); extremes ≠ redefine alone.",
    scaffolds: [
      hint(
        "Normals idea",
        "Climate normals often summarize roughly three decades of conditions.",
      ),
      step(
        "Week vs decades",
        "An extreme week is weather; climate needs long-term patterns.",
      ),
      checklist(
        "Weather/climate checklist",
        "Weather · climate/normals · long-term evidence",
      ),
    ],
    criteria: [
      {
        id: "weather",
        label: "Weather",
        mustIncludeAny: [
          "weather",
          "short",
          "day",
          "week",
          "now",
        ],
      },
      {
        id: "climate",
        label: "Climate / normals",
        mustIncludeAny: [
          "climate",
          "30",
          "normal",
          "long-term",
          "average",
          "decade",
        ],
      },
      {
        id: "extreme",
        label: "Extreme week not redefine",
        mustIncludeAny: [
          "not",
          "single",
          "week",
          "extreme",
          "redefin",
          "alone",
        ],
      },
    ],
  },
  {
    id: "sim-earth-natural-hazard-prep",
    kind: "simulation",
    title: "Family hazard prep plan",
    objective:
      "Apply educational family preparedness planning for a stated natural hazard.",
    prompt:
      "Simulation (educational preparedness — not emergency advice for a real event): Hazard = strong earthquake in a school region. Outline a family plan with: meet location, communication backup if cell networks fail, and one go-bag item category. Keep it general and educational.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "earth science",
    minChars: 48,
    conceptHints: [
      "natural hazards",
      "earthquake",
      "preparedness",
      "emergency plan",
      "earth science",
    ],
    misconceptionTargets: [
      "relying only on cell phones with no backup contact method",
      "skipping a meeting place because 'we will just find each other'",
    ],
    successLooksLike:
      "Meet place, backup communication, and a go-bag category named.",
    accessibility: {
      altDescription:
        "Outline an educational earthquake family prep plan.",
      extendedTimeSuggested: true,
    },
    scaffolds: [
      hint(
        "Three pillars",
        "Where to meet, how to message if networks fail, what essentials to stage.",
      ),
      step(
        "Backup contact",
        "Out-of-area contact, radio, or written numbers are educational examples.",
      ),
      checklist(
        "Prep checklist",
        "Meet location · communication backup · go-bag item",
      ),
    ],
    criteria: [
      {
        id: "meet",
        label: "Meet location",
        mustIncludeAny: [
          "meet",
          "location",
          "place",
          "park",
          "school",
          "outside",
        ],
      },
      {
        id: "comm",
        label: "Communication backup",
        mustIncludeAny: [
          "text",
          "out-of-area",
          "radio",
          "backup",
          "contact",
          "phone tree",
        ],
      },
      {
        id: "bag",
        label: "Go-bag category",
        mustIncludeAny: [
          "water",
          "food",
          "first aid",
          "flashlight",
          "go-bag",
          "medic",
          "battery",
        ],
      },
    ],
  },
];

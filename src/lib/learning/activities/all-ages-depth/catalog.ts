/**
 * 2P-48 — Representative all-ages depth pack: proportional scaling.
 * Same concept · multiple difficulties/stages · existing lab activity kind.
 * Not a GradeSchoolEngine — additive catalog rows only.
 */

import type { RubricCriterion } from "@/lib/learning/activities/rubric";
import type { LearningObjectTypeName, MasteryFacetName } from "@/lib/learning/types";

export type AllAgesStructuredChallenge = {
  id: string;
  kind: "lab" | "writing";
  title: string;
  objective: string;
  prompt: string;
  learningObjectType: LearningObjectTypeName;
  skillFacet: MasteryFacetName;
  asPerform: boolean;
  domainTag: string;
  minChars: number;
  conceptHints: string[];
  misconceptionTargets?: string[];
  successLooksLike?: string;
  criteria: RubricCriterion[];
  starter?: string;
};

/**
 * Concrete → abstract ladder for proportional-scaling.
 * Difficulty 1 uses everyday objects; 4 uses rate/unit conversion transfer.
 */
export const ALL_AGES_DEPTH_CHALLENGES: AllAgesStructuredChallenge[] = [
  {
    id: "lab-proportional-scale-blocks",
    kind: "lab",
    title: "Scale with picture blocks",
    objective:
      "Use a simple picture-scale: if 2 blocks make 1 tower, how many blocks for 3 towers?",
    prompt:
      "Guided lab (concrete): Each tower needs 2 blocks. You want 3 towers. Write how many blocks you need in total, show a short count or drawing description (e.g. 2+2+2), and say one way someone might mistype the total.",
    learningObjectType: "LAB",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "mathematics",
    minChars: 25,
    conceptHints: [
      "proportion",
      "proportional",
      "scale",
      "ratio",
      "math",
      "blocks",
    ],
    misconceptionTargets: ["adding towers instead of multiplying blocks"],
    successLooksLike: "You get 6 blocks and explain repeated groups of 2.",
    criteria: [
      {
        id: "total",
        label: "Total blocks",
        mustIncludeAny: ["6", "six"],
      },
      {
        id: "groups",
        label: "Repeated groups",
        mustIncludeAny: ["2", "tower", "group", "times", "×", "*"],
      },
      {
        id: "mistake",
        label: "Common mistake",
        mustIncludeAny: ["add", "3+2", "forget", "wrong", "mistake"],
      },
    ],
  },
  {
    id: "lab-proportional-scale-map",
    kind: "lab",
    title: "Map scale distance",
    objective:
      "Apply a map scale (1 cm = 4 km) to find a real distance from a map length.",
    prompt:
      "Apply lab: Map scale is 1 cm represents 4 km. A road measures 7 cm on the map. Compute the real distance in km, show the proportion or multiply step, and name one unit mistake to avoid.",
    learningObjectType: "LAB",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "mathematics",
    minChars: 35,
    conceptHints: [
      "proportion",
      "proportional",
      "scale",
      "ratio",
      "map",
      "math",
    ],
    misconceptionTargets: ["treating cm as km without scaling"],
    successLooksLike: "You compute 28 km and warn about unit mix-ups.",
    criteria: [
      {
        id: "distance",
        label: "Real distance",
        mustIncludeAny: ["28", "28 km"],
      },
      {
        id: "method",
        label: "Scale method",
        mustIncludeAny: ["4", "7", "multiply", "proportion", "×", "*"],
      },
      {
        id: "units",
        label: "Unit caution",
        mustIncludeAny: ["unit", "km", "cm", "mix", "forget"],
      },
    ],
  },
  {
    id: "lab-proportional-scale-rate",
    kind: "lab",
    title: "Rate transfer challenge",
    objective:
      "Transfer proportional reasoning to a rate problem with a different surface form.",
    prompt:
      "Challenge: A printer makes 45 pages in 9 minutes at constant rate. How many pages in 14 minutes? Set up a proportion or unit rate, compute pages (allow rounding note if exact), and state one transfer pitfall (e.g. assuming rate changes).",
    learningObjectType: "LAB",
    skillFacet: "SOLVE",
    asPerform: false,
    domainTag: "mathematics",
    minChars: 45,
    conceptHints: [
      "proportion",
      "proportional",
      "rate",
      "unit rate",
      "scale",
      "math",
    ],
    misconceptionTargets: ["adding minutes to pages instead of scaling"],
    successLooksLike: "You find 70 pages via 5 pages/min × 14.",
    criteria: [
      {
        id: "pages",
        label: "Pages result",
        mustIncludeAny: ["70", "70 pages"],
      },
      {
        id: "rate",
        label: "Rate or proportion",
        mustIncludeAny: ["5", "45/9", "proportion", "rate", "per minute"],
      },
      {
        id: "pitfall",
        label: "Transfer pitfall",
        mustIncludeAny: ["constant", "change", "add", "assume", "pitfall", "same rate"],
      },
    ],
  },
  {
    id: "lab-proportional-scale-retain",
    kind: "lab",
    title: "Quick proportion check",
    objective:
      "Retrieve proportional setup on a fresh number set without the recipe context.",
    prompt:
      "Retain: If 8 pencils cost $6, what do 12 pencils cost at the same rate? Show proportion or unit price and the dollar amount. Name one slip that would break the proportion.",
    learningObjectType: "LAB",
    skillFacet: "RETAIN",
    asPerform: false,
    domainTag: "mathematics",
    minChars: 20,
    conceptHints: [
      "proportion",
      "proportional",
      "ratio",
      "unit price",
      "math",
    ],
    misconceptionTargets: ["scaling only one quantity"],
    successLooksLike:
      "You form 8/6 = 12/x (or unit price $0.75), get $9, and warn against scaling only one side.",
    criteria: [
      {
        id: "cost",
        label: "Cost",
        mustIncludeAny: ["9", "$9", "9 dollars"],
      },
      {
        id: "setup",
        label: "Setup",
        mustIncludeAny: ["8", "12", "6", "proportion", "unit", "3/4", "0.75"],
      },
      {
        id: "slip",
        label: "Proportion slip",
        mustIncludeAny: ["one side", "only", "forget", "scale", "ratio", "break"],
      },
    ],
  },
];

export function listAllAgesDepthStructuredChallenges(): AllAgesStructuredChallenge[] {
  return ALL_AGES_DEPTH_CHALLENGES;
}

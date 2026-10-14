/**
 * Content expansion queue — merged structured challenge catalog.
 * Additive fixtures only; not a subject engine or second CMS.
 */

import type { StructuredChallenge } from "@/lib/learning/activities/structured/service";
import { CONTENT_EXPANSION_STEM_CHALLENGES } from "./catalog-stem";
import { CONTENT_EXPANSION_HUMANITIES_CHALLENGES } from "./catalog-humanities";
import { CONTENT_EXPANSION_TRADES_CHALLENGES } from "./catalog-trades";
import { CONTENT_EXPANSION_MASTER_POLISH_CHALLENGES } from "./catalog-master-polish";
import { CONTENT_DEPTH_PRIORITY_A_CHALLENGES } from "./catalog-depth-priority-a";
import { CONTENT_DEPTH_PRIORITY_B_CHALLENGES } from "./catalog-depth-priority-b";
import { CONTENT_DEPTH_PRIORITY_C_CHALLENGES } from "./catalog-depth-priority-c";

export const CONTENT_EXPANSION_CHALLENGES: StructuredChallenge[] = [
  ...CONTENT_EXPANSION_STEM_CHALLENGES,
  ...CONTENT_EXPANSION_HUMANITIES_CHALLENGES,
  ...CONTENT_EXPANSION_TRADES_CHALLENGES,
  ...CONTENT_EXPANSION_MASTER_POLISH_CHALLENGES,
  ...CONTENT_DEPTH_PRIORITY_A_CHALLENGES,
  ...CONTENT_DEPTH_PRIORITY_B_CHALLENGES,
  ...CONTENT_DEPTH_PRIORITY_C_CHALLENGES,
];

export function listContentExpansionStructuredChallenges(): StructuredChallenge[] {
  return CONTENT_EXPANSION_CHALLENGES;
}

export { CONTENT_EXPANSION_PROGRESSION_ENTRIES } from "./progression";

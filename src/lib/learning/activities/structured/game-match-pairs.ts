/**
 * Bundle N — Authored match pairs for structured game challenges.
 * Uses challenge criteria + educational definitions (not stub placeholders).
 */

import { getStructuredChallenge } from "@/lib/learning/activities/structured/service";

export type GameMatchPair = {
  term: string;
  definition: string;
};

const TERM_DEFINITIONS: Record<string, string> = {
  mitochondria:
    "Organelle that produces ATP / cellular energy (often called the cell's powerhouse).",
  nucleus: "Contains DNA and directs cell activities / genetic control center.",
  ribosome: "Site of protein synthesis (translation).",
  mito: "Organelle that produces ATP / cellular energy (often called the cell's powerhouse).",
  ribo: "Site of protein synthesis (translation).",
  dhcp: "Assigns IP addresses (and related config) dynamically to hosts.",
  dns: "Resolves domain names to IP addresses (name lookup).",
  gateway: "Router used as the default exit path from a local network.",
  "default gateway":
    "Router used as the default exit path from a local network.",
};

function definitionForCriterion(input: {
  id: string;
  label: string;
  mustIncludeAny?: string[];
}): string {
  const keys = [
    input.label,
    input.id,
    ...(input.mustIncludeAny ?? []).slice(0, 1),
  ].map((k) => k.trim().toLowerCase());
  for (const key of keys) {
    if (TERM_DEFINITIONS[key]) return TERM_DEFINITIONS[key]!;
  }
  const hints = (input.mustIncludeAny ?? []).slice(0, 3).join(", ");
  if (hints) {
    return `Accurate definition of ${input.label} (key ideas: ${hints}).`;
  }
  return `Accurate definition of ${input.label}.`;
}

/** Authored pairs for a game challenge id, or null when not a game / too thin. */
export function matchPairsForGameChallenge(
  challengeId: string,
): GameMatchPair[] | null {
  const challenge = getStructuredChallenge(challengeId);
  if (!challenge || challenge.kind !== "game") return null;
  const pairs = challenge.criteria
    .filter((c) => c.label?.trim())
    .map((c) => ({
      term: c.label.trim(),
      definition: definitionForCriterion(c),
    }));
  return pairs.length >= 2 ? pairs : null;
}

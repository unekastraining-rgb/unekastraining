/**
 * Bundle J/K — Bridge between KL concept ids and real challenge catalogs.
 * Only returns ids that exist in coding / sql / math / structured catalogs.
 * Does not invent challenges or expose phantom ids.
 */

import { getCodingChallenge } from "@/lib/learning/activities/coding/challenges";
import { getMathChallenge } from "@/lib/learning/activities/math/challenges";
import { getSqlChallenge } from "@/lib/learning/activities/sql/challenges";
import { getStructuredChallenge } from "@/lib/learning/activities/structured/service";
import { findInstructionalConceptById } from "@/lib/learning/knowledge/instructional-library";

/** Candidate mappings — filtered by existence before return. */
const CONCEPT_TO_CHALLENGE_CANDIDATES: Record<string, string[]> = {
  "java-inheritance": [
    "java-inheritance-subclass",
    "java-inheritance-vehicle",
  ],
  "java-arraylist": ["java-add"],
  "sql-joins": [
    "sql-join-enrollments",
    "sql-inner-join-orders",
    "sql-left-join-missing",
  ],
  "math-equations": ["math-linear-basic"],
  "math-linear-equations": ["math-linear-basic", "math-linear-both-sides"],
  "economics-supply-demand": ["sim-supply-demand"],
  "biology-photosynthesis": [
    "write-explain-photosynthesis",
    "game-vocab-match",
  ],
  "python-variables": ["py-add"],
  "writing-thesis": ["write-business-proposal"],
};

function challengeExists(id: string): boolean {
  return Boolean(
    getStructuredChallenge(id) ||
      getCodingChallenge(id) ||
      getSqlChallenge(id) ||
      getMathChallenge(id),
  );
}

/**
 * Challenge ids suggested for a KL concept (may be empty).
 * Every returned id is verified present in a real catalog.
 */
export function structuredChallengeIdsForConcept(conceptId: string): string[] {
  if (!findInstructionalConceptById(conceptId)) return [];
  const candidates = CONCEPT_TO_CHALLENGE_CANDIDATES[conceptId] ?? [];
  return candidates.filter(challengeExists);
}

/** Reverse lookup — which KL concept a challenge id is associated with. */
export function conceptIdForStructuredChallenge(
  challengeId: string,
): string | null {
  if (!challengeExists(challengeId)) return null;
  for (const [conceptId, ids] of Object.entries(CONCEPT_TO_CHALLENGE_CANDIDATES)) {
    if (ids.includes(challengeId)) return conceptId;
  }
  return null;
}

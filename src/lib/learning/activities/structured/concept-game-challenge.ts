/**
 * Bundle M — Lightweight concept → game challenge id map for Learning launches.
 * Mirrors kl-concept-bridge game candidates without importing challenge catalogs
 * (keeps client capability strips from pulling the full activity catalogs).
 */

/** Concept ids that have an authored game challenge in the structured catalog. */
const CONCEPT_GAME_CHALLENGE: Record<string, string> = {
  "biology-photosynthesis": "game-vocab-match",
};

/** Preferred game challenge for a KL concept, if one is authored. */
export function preferredGameChallengeIdForConcept(
  conceptId: string | null | undefined,
): string | null {
  if (!conceptId?.trim()) return null;
  return CONCEPT_GAME_CHALLENGE[conceptId.trim()] ?? null;
}

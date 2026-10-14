/**
 * Feature flag for Phase 2E-2 Concept↔Concept relationship foundation.
 * Default OFF preserves existing Knowledge Model / Concept behavior.
 *
 * Enable with: STUDY_HAUL_CONCEPT_RELATIONSHIPS=1 (or true/on/yes)
 */
export function isConceptRelationshipsEnabled(): boolean {
  const raw = process.env.STUDY_HAUL_CONCEPT_RELATIONSHIPS?.trim().toLowerCase();
  if (!raw) return false;
  return raw === "1" || raw === "true" || raw === "on" || raw === "yes";
}

/**
 * Feature flag for Phase 2E-3 Orchestrator prerequisite awareness.
 * Separate from STUDY_HAUL_CONCEPT_RELATIONSHIPS (storage/readers).
 * Default OFF preserves existing Orchestrator behavior exactly.
 *
 * Enable with: STUDY_HAUL_ORCHESTRATOR_PREREQUISITES=1 (or true/on/yes)
 */
export function isOrchestratorPrerequisitesEnabled(): boolean {
  const raw =
    process.env.STUDY_HAUL_ORCHESTRATOR_PREREQUISITES?.trim().toLowerCase();
  if (!raw) return false;
  return raw === "1" || raw === "true" || raw === "on" || raw === "yes";
}

/**
 * Feature flag for Phase 2D-2 SIX Tutor → Unified Tutor migration.
 * Default OFF preserves the legacy SIX Tutor path exactly.
 *
 * Enable with: STUDY_HAUL_SIX_TUTOR_UNIFIED=1 (or true/on/yes)
 */
export function isSixTutorUnifiedEnabled(): boolean {
  const raw = process.env.STUDY_HAUL_SIX_TUTOR_UNIFIED?.trim().toLowerCase();
  if (!raw) return false;
  return raw === "1" || raw === "true" || raw === "on" || raw === "yes";
}

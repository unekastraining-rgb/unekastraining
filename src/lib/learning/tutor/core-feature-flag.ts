/**
 * Feature flag for Phase 2D-3 CORE Assist → Unified Tutor migration.
 * Default OFF preserves the legacy CORE Assist path exactly.
 *
 * Enable with: STUDY_HAUL_CORE_ASSIST_UNIFIED=1 (or true/on/yes)
 */
export function isCoreAssistUnifiedEnabled(): boolean {
  const raw = process.env.STUDY_HAUL_CORE_ASSIST_UNIFIED?.trim().toLowerCase();
  if (!raw) return false;
  return raw === "1" || raw === "true" || raw === "on" || raw === "yes";
}

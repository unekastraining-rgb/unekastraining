/**
 * Feature flag for Phase 2D-4 Teach Me → Unified Tutor migration.
 * Default OFF preserves the legacy Teach Me evaluate path exactly.
 *
 * Enable with: STUDY_HAUL_TEACH_ME_UNIFIED=1 (or true/on/yes)
 *
 * Scope: mode === "teach-me" on /api/study/evaluate only.
 * Blurting and Six evaluate paths are unaffected.
 */
export function isTeachMeUnifiedEnabled(): boolean {
  const raw = process.env.STUDY_HAUL_TEACH_ME_UNIFIED?.trim().toLowerCase();
  if (!raw) return false;
  return raw === "1" || raw === "true" || raw === "on" || raw === "yes";
}

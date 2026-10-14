/**
 * Feature flag for Phase 2E-1 CORE → Knowledge Model grounding.
 * Default OFF preserves existing CORE behavior exactly.
 *
 * Enable with: STUDY_HAUL_CORE_KNOWLEDGE_BRIDGE=1 (or true/on/yes)
 * E2E_MODE=1 also enables the bridge so material→concept journeys can run
 * without mutating production defaults.
 */
export function isCoreKnowledgeBridgeEnabled(): boolean {
  const e2e = process.env.E2E_MODE?.trim().toLowerCase();
  if (e2e === "1" || e2e === "true" || e2e === "on" || e2e === "yes") {
    return true;
  }
  const raw = process.env.STUDY_HAUL_CORE_KNOWLEDGE_BRIDGE?.trim().toLowerCase();
  if (!raw) return false;
  return raw === "1" || raw === "true" || raw === "on" || raw === "yes";
}

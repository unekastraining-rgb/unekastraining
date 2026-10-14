/**
 * Feature flag for Phase 2F-2 evidence aggregation / Learner Model signals.
 * Default OFF preserves existing Learner Model and Orchestrator behavior.
 *
 * Enable with: STUDY_HAUL_EVIDENCE_INTELLIGENCE=1 (or true/on/yes)
 */
export function isEvidenceIntelligenceEnabled(): boolean {
  const raw =
    process.env.STUDY_HAUL_EVIDENCE_INTELLIGENCE?.trim().toLowerCase();
  if (!raw) return false;
  return raw === "1" || raw === "true" || raw === "on" || raw === "yes";
}

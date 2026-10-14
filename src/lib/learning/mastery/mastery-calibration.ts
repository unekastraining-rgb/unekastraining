/**
 * 2P-44 — Mastery claim calibration (presentation / soft Orchestrator only).
 *
 * Downgrades overconfident "demonstrated" / "no intervention" claims when
 * evidence sufficiency is thin. Does not rewrite ConceptMastery storage,
 * applyFacetDelta, or introduce mastery decay.
 */

import type { OrchestratorDiagnosis } from "@/lib/learning/orchestrator/diagnose";
import {
  classifyEvidenceSufficiency,
  evidenceSufficiencyIsThin,
  evidenceSufficiencySupportsStrongClaims,
  type EvidenceSufficiencyInput,
  type EvidenceSufficiencyLevel,
} from "@/lib/learning/evidence/evidence-sufficiency";

/** Mirrors ConceptProgressDimensionStatus — local to avoid import cycles. */
export type CalibratedFacetStatus =
  | "not_yet_evidenced"
  | "needs_more_practice"
  | "developing"
  | "demonstrated";

/**
 * Calibrate a facet presentation status using evidence sufficiency.
 * Thin evidence cannot claim "demonstrated" — becomes "developing".
 */
export function calibrateFacetStatus(
  raw: CalibratedFacetStatus,
  sufficiency: EvidenceSufficiencyLevel,
): CalibratedFacetStatus {
  if (raw === "demonstrated" && evidenceSufficiencyIsThin(sufficiency)) {
    return "developing";
  }
  return raw;
}

export function calibrateFacetLearnerLine(
  facetLabel: string,
  status: CalibratedFacetStatus,
  sufficiency: EvidenceSufficiencyLevel,
): string {
  const label = facetLabel.trim() || "This skill";
  switch (status) {
    case "not_yet_evidenced":
      return `We do not yet have evidence for ${label.toLowerCase()}.`;
    case "needs_more_practice":
      return `${label} needs more practice.`;
    case "developing":
      if (evidenceSufficiencyIsThin(sufficiency)) {
        return `${label} has early evidence — still building toward demonstrated progress.`;
      }
      return `${label} is developing.`;
    case "demonstrated":
      if (sufficiency === "rich") {
        return `Strong evidence shows demonstrated ${label.toLowerCase()}.`;
      }
      if (sufficiency === "adequate") {
        return `Repeated evidence supports demonstrated ${label.toLowerCase()}.`;
      }
      return `You have demonstrated ${label.toLowerCase()}.`;
  }
}

/**
 * Soft Orchestrator gate: do not claim NO_INTERVENTION ("looks strong")
 * when evidence is still thin/emerging. Gap diagnoses remain (they gather
 * evidence); confidence stays LOW via existing helper for thin reviews.
 */
export function calibrateOrchestratorDiagnosis(input: {
  diagnosis: OrchestratorDiagnosis;
  sufficiency: EvidenceSufficiencyLevel;
}): {
  diagnosis: OrchestratorDiagnosis;
  softened: boolean;
  reasonSuffix: string | null;
} {
  const { diagnosis, sufficiency } = input;

  if (
    diagnosis === "NO_INTERVENTION" &&
    !evidenceSufficiencySupportsStrongClaims(sufficiency)
  ) {
    return {
      diagnosis: "INSUFFICIENT_EVIDENCE",
      softened: true,
      reasonSuffix:
        "Evidence is still limited, so Study Haul will not claim this concept is fully demonstrated yet. A short evidence-building pass is safer than stopping.",
    };
  }

  if (
    evidenceSufficiencyIsThin(sufficiency) &&
    diagnosis !== "INSUFFICIENT_EVIDENCE" &&
    diagnosis !== "NO_INTERVENTION"
  ) {
    return {
      diagnosis,
      softened: true,
      reasonSuffix:
        "Evidence is still thin, so this is a cautious next step rather than a firm mastery claim.",
    };
  }

  return { diagnosis, softened: false, reasonSuffix: null };
}

export function resolveSufficiencyForMasterySnapshot(
  input: EvidenceSufficiencyInput,
): EvidenceSufficiencyLevel {
  return classifyEvidenceSufficiency(input);
}

export function masteryCalibrationTruthSummary(): {
  createsSecondMasteryEngine: false;
  createsMasteryPlanner: false;
  inventsMasteryDecay: false;
  rewritesApplyFacetDelta: false;
  changesDiagnosisEnums: false;
  presentationAndSoftOrchestratorOnly: true;
} {
  return {
    createsSecondMasteryEngine: false,
    createsMasteryPlanner: false,
    inventsMasteryDecay: false,
    rewritesApplyFacetDelta: false,
    changesDiagnosisEnums: false,
    presentationAndSoftOrchestratorOnly: true,
  };
}

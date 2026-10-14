/**
 * 2P-30 — Project Adaptive lifecycle / artifact integrity (declarative).
 * Project remains structured rubric activity — no ProjectEngine.
 */

export const PROJECT_ADAPTIVE_CONTRACT = {
  activityLaunchedIsNotCompletion: true,
  openIsNotEvidence: true,
  evidenceUsesAuthoritativePath: true,
  noProjectMasterySystem: true,
  noProjectEvidenceWriter: true,
  adaptiveBindUsesCoordinator: true,
  luckyRemainsDownstream: true,
  aiAssistanceIsNotLearnerEvidence: true,
  learnerAuthoredRequired: true,
  resumeMidProjectNotSupported: true,
} as const;

export type ProjectLifecyclePhase =
  | "launched"
  | "drafting"
  | "evaluated"
  | "evidence_recorded"
  | "adaptive_bound";

export type ProjectLearnerArtifact = {
  learnerAuthored: boolean;
  finalSubmission: string;
  aiAssistance?: string | null;
};

export function inferProjectLifecyclePhase(input: {
  launched: boolean;
  beganDrafting: boolean;
  evaluated: boolean;
  evidenceRecorded: boolean;
  adaptiveBound: boolean;
}): ProjectLifecyclePhase {
  if (input.adaptiveBound) return "adaptive_bound";
  if (input.evidenceRecorded) return "evidence_recorded";
  if (input.evaluated) return "evaluated";
  if (input.beganDrafting) return "drafting";
  if (input.launched) return "launched";
  return "launched";
}

export function projectInteractionIsNotCompletion(
  phase: ProjectLifecyclePhase,
): boolean {
  return phase === "launched" || phase === "drafting";
}

export function projectArtifactIntegrityOk(
  artifact: ProjectLearnerArtifact,
): { ok: boolean; reason?: string } {
  if (!artifact.learnerAuthored) {
    return { ok: false, reason: "not_learner_authored" };
  }
  if (!artifact.finalSubmission.trim()) {
    return { ok: false, reason: "empty_final" };
  }
  return { ok: true };
}

export function projectAdaptiveContractTruthSummary() {
  return PROJECT_ADAPTIVE_CONTRACT;
}

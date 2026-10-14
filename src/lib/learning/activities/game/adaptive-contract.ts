/**
 * 2P-30 — Game Adaptive lifecycle / integrity helpers (declarative).
 * Game remains structured rubric activity — no GameEngine.
 */

export const GAME_ADAPTIVE_CONTRACT = {
  activityLaunchedIsNotCompletion: true,
  pointsAloneAreNotMastery: true,
  openIsNotEvidence: true,
  evidenceUsesAuthoritativePath: true,
  noGameMasterySystem: true,
  noGameEvidenceWriter: true,
  adaptiveBindUsesCoordinator: true,
  luckyRemainsDownstream: true,
  resumeMidGameNotSupported: true,
} as const;

export type GameLifecyclePhase =
  | "launched"
  | "interacting"
  | "evaluated"
  | "evidence_recorded"
  | "adaptive_bound";

export function inferGameLifecyclePhase(input: {
  launched: boolean;
  beganInteraction: boolean;
  evaluated: boolean;
  evidenceRecorded: boolean;
  adaptiveBound: boolean;
}): GameLifecyclePhase {
  if (input.adaptiveBound) return "adaptive_bound";
  if (input.evidenceRecorded) return "evidence_recorded";
  if (input.evaluated) return "evaluated";
  if (input.beganInteraction) return "interacting";
  if (input.launched) return "launched";
  return "launched";
}

export function gameInteractionIsNotCompletion(
  phase: GameLifecyclePhase,
): boolean {
  return phase === "launched" || phase === "interacting";
}

export function gameAdaptiveContractTruthSummary() {
  return GAME_ADAPTIVE_CONTRACT;
}

export { MATH_WORKSPACE_PROGRESSION_ENTRIES } from "./progression";
export type {
  MathChallenge,
  MathChallengeScaffold,
  MathErrorCategory,
  MathStep,
  MathWorkspaceState,
} from "./types";
export {
  getMathChallenge,
  listMathChallenges,
  MATH_CHALLENGES,
} from "./challenges";
export {
  checkMathStep,
  evaluateMathWorkspace,
  type MathWorkspaceSubmission,
} from "./evaluate";
export { submitMathChallenge } from "./service";
export {
  classifyStepError,
  equationsEquivalent,
  parseLinearEquation,
  solveLinearEquation,
} from "./algebra";

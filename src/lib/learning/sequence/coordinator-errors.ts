export type AdaptiveSequenceCoordinatorErrorCode =
  | "RUN_NOT_FOUND"
  | "RUN_NOT_OWNED"
  | "RUN_COMPLETED"
  | "RUN_ABANDONED"
  | "CONCEPT_NOT_OWNED"
  | "CONCEPT_MISMATCH"
  | "TERMINAL_RUN"
  | "INACTIVE_RUN"
  | "INVALID_CURRENT_STEP"
  | "STALE_STEP"
  | "ATTEMPT_NOT_FOUND"
  | "ATTEMPT_OWNERSHIP_MISMATCH"
  | "ATTEMPT_CONCEPT_MISMATCH"
  | "ATTEMPT_LEARNING_OBJECT_MISMATCH"
  | "ATTEMPT_ALREADY_PROCESSED"
  | "MAX_STEPS_REACHED"
  | "DUPLICATE_COMPLETION"
  | "NO_INTERVENTION"
  | "IMMEDIATE_REPEAT"
  | "ORCHESTRATOR_UNAVAILABLE"
  | "CONCURRENT_MODIFICATION";

export class AdaptiveSequenceCoordinatorError extends Error {
  readonly code: AdaptiveSequenceCoordinatorErrorCode;

  constructor(code: AdaptiveSequenceCoordinatorErrorCode, message: string) {
    super(message);
    this.name = "AdaptiveSequenceCoordinatorError";
    this.code = code;
  }
}

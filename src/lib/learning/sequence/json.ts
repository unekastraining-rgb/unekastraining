import type {
  AdaptiveSequenceHistoryEntry,
  AdaptiveSequenceStep,
} from "@/lib/learning/sequence/types";
import { AdaptiveSequenceRunError } from "@/lib/learning/sequence/errors";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isOptionalId(value: unknown): value is string | null | undefined {
  return value === undefined || value === null || typeof value === "string";
}

/**
 * Parse stepsJson into typed steps. Throws AdaptiveSequenceRunError on malformed data.
 */
export function parseStepsJson(raw: string): AdaptiveSequenceStep[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new AdaptiveSequenceRunError("stepsJson is not valid JSON.");
  }
  if (!Array.isArray(parsed)) {
    throw new AdaptiveSequenceRunError("stepsJson must be a JSON array.");
  }
  return parsed.map((item, index) => normalizeStep(item, index));
}

export function serializeSteps(steps: AdaptiveSequenceStep[]): string {
  return JSON.stringify(steps.map(toStoredStep));
}

/**
 * Parse interventionHistoryJson. Throws on malformed data.
 */
export function parseInterventionHistoryJson(
  raw: string,
): AdaptiveSequenceHistoryEntry[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new AdaptiveSequenceRunError(
      "interventionHistoryJson is not valid JSON.",
    );
  }
  if (!Array.isArray(parsed)) {
    throw new AdaptiveSequenceRunError(
      "interventionHistoryJson must be a JSON array.",
    );
  }
  return parsed.map((item, index) => normalizeHistoryEntry(item, index));
}

export function serializeInterventionHistory(
  history: AdaptiveSequenceHistoryEntry[],
): string {
  return JSON.stringify(history.map(toStoredHistoryEntry));
}

export function normalizeStep(
  item: unknown,
  index: number,
): AdaptiveSequenceStep {
  if (!item || typeof item !== "object" || Array.isArray(item)) {
    throw new AdaptiveSequenceRunError(
      `steps[${index}] must be an object.`,
    );
  }
  const record = item as Record<string, unknown>;
  if (!isNonEmptyString(record.intervention)) {
    throw new AdaptiveSequenceRunError(
      `steps[${index}].intervention must be a non-empty string.`,
    );
  }
  if (!isOptionalId(record.learningObjectId)) {
    throw new AdaptiveSequenceRunError(
      `steps[${index}].learningObjectId must be a string, null, or omitted.`,
    );
  }
  // Reject duplicated payload blobs — only identity refs allowed.
  if ("payload" in record || "payloadRef" in record || "payloadJson" in record) {
    throw new AdaptiveSequenceRunError(
      `steps[${index}] must not embed LearningObject payload data.`,
    );
  }
  return {
    intervention: record.intervention.trim(),
    learningObjectId:
      record.learningObjectId === undefined || record.learningObjectId === ""
        ? null
        : (record.learningObjectId as string | null),
  };
}

export function normalizeHistoryEntry(
  item: unknown,
  index: number,
): AdaptiveSequenceHistoryEntry {
  if (!item || typeof item !== "object" || Array.isArray(item)) {
    throw new AdaptiveSequenceRunError(
      `interventionHistory[${index}] must be an object.`,
    );
  }
  const record = item as Record<string, unknown>;
  if (
    typeof record.stepIndex !== "number" ||
    !Number.isInteger(record.stepIndex) ||
    record.stepIndex < 0
  ) {
    throw new AdaptiveSequenceRunError(
      `interventionHistory[${index}].stepIndex must be a non-negative integer.`,
    );
  }
  if (!isNonEmptyString(record.intervention)) {
    throw new AdaptiveSequenceRunError(
      `interventionHistory[${index}].intervention must be a non-empty string.`,
    );
  }
  if (!isOptionalId(record.learningObjectId)) {
    throw new AdaptiveSequenceRunError(
      `interventionHistory[${index}].learningObjectId must be a string, null, or omitted.`,
    );
  }
  if (!isOptionalId(record.attemptId)) {
    throw new AdaptiveSequenceRunError(
      `interventionHistory[${index}].attemptId must be a string, null, or omitted.`,
    );
  }
  return {
    stepIndex: record.stepIndex,
    intervention: record.intervention.trim(),
    learningObjectId:
      record.learningObjectId === undefined || record.learningObjectId === ""
        ? null
        : (record.learningObjectId as string | null),
    attemptId:
      record.attemptId === undefined || record.attemptId === ""
        ? null
        : (record.attemptId as string | null),
  };
}

function toStoredStep(step: AdaptiveSequenceStep) {
  return {
    intervention: step.intervention,
    learningObjectId: step.learningObjectId ?? null,
  };
}

function toStoredHistoryEntry(entry: AdaptiveSequenceHistoryEntry) {
  return {
    stepIndex: entry.stepIndex,
    intervention: entry.intervention,
    learningObjectId: entry.learningObjectId ?? null,
    attemptId: entry.attemptId ?? null,
  };
}

/**
 * Validate currentStepIndex against a step list.
 * Empty lists are invalid for ACTIVE runs (no draft-empty support in 2G-2).
 *
 * Phase 2G-3: `currentStepIndex === stepCount` is allowed as an "awaiting next"
 * cursor after the last step is completed (history recorded, no new step yet).
 * Values greater than stepCount remain invalid.
 */
export function assertValidCurrentStepIndex(
  currentStepIndex: number,
  stepCount: number,
): void {
  if (!Number.isInteger(currentStepIndex)) {
    throw new AdaptiveSequenceRunError(
      "currentStepIndex must be an integer.",
    );
  }
  if (currentStepIndex < 0) {
    throw new AdaptiveSequenceRunError(
      "currentStepIndex cannot be negative.",
    );
  }
  if (stepCount === 0) {
    throw new AdaptiveSequenceRunError(
      "steps must contain at least one step for an active run.",
    );
  }
  if (currentStepIndex > stepCount) {
    throw new AdaptiveSequenceRunError(
      `currentStepIndex ${currentStepIndex} is out of range for ${stepCount} step(s).`,
    );
  }
}

/** True when the cursor sits past the last step (awaiting next intervention). */
export function isAwaitingNextStep(
  currentStepIndex: number,
  stepCount: number,
): boolean {
  return stepCount > 0 && currentStepIndex === stepCount;
}

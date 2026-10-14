import {
  LEARNING_INTENT_PROVENANCES,
  LEARNING_INTENT_PURPOSES,
  LEARNING_INTENT_SCOPES,
  LEARNING_INTENT_SOURCES,
  type LearningIntent,
  type LearningIntentProvenance,
  type LearningIntentPurpose,
  type LearningIntentScope,
  type LearningIntentSource,
} from "@/lib/learning/intent/types";

function isPurpose(value: unknown): value is LearningIntentPurpose {
  return (
    typeof value === "string" &&
    (LEARNING_INTENT_PURPOSES as readonly string[]).includes(value)
  );
}

function isSource(value: unknown): value is LearningIntentSource {
  return (
    typeof value === "string" &&
    (LEARNING_INTENT_SOURCES as readonly string[]).includes(value)
  );
}

function isScope(value: unknown): value is LearningIntentScope {
  return (
    typeof value === "string" &&
    (LEARNING_INTENT_SCOPES as readonly string[]).includes(value)
  );
}

function isProvenance(value: unknown): value is LearningIntentProvenance {
  return (
    typeof value === "string" &&
    (LEARNING_INTENT_PROVENANCES as readonly string[]).includes(value)
  );
}

function optionalId(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Parse unknown input into a LearningIntent.
 * Returns null for absent or malformed input — never throws.
 * Does not invent INFERRED ASSESS from ambiguous wording.
 */
export function parseLearningIntent(raw: unknown): LearningIntent | null {
  if (raw === undefined || raw === null) return null;
  if (typeof raw !== "object" || Array.isArray(raw)) return null;

  const obj = raw as Record<string, unknown>;

  if (!isPurpose(obj.purpose)) return null;
  if (!isSource(obj.source)) return null;
  if (!isScope(obj.scope)) return null;

  if (
    obj.provenance !== undefined &&
    obj.provenance !== null &&
    !isProvenance(obj.provenance)
  ) {
    return null;
  }

  // Reject non-string / empty optional ids by omitting them (malformed id alone
  // does not invalidate an otherwise valid intent object).
  const conceptId = optionalId(obj.conceptId);
  const learningSpaceId = optionalId(obj.learningSpaceId);

  // If caller supplied conceptId/learningSpaceId as wrong type, treat as malformed.
  if (obj.conceptId !== undefined && obj.conceptId !== null && conceptId === undefined) {
    return null;
  }
  if (
    obj.learningSpaceId !== undefined &&
    obj.learningSpaceId !== null &&
    learningSpaceId === undefined
  ) {
    return null;
  }

  const intent: LearningIntent = {
    purpose: obj.purpose,
    source: obj.source,
    scope: obj.scope,
  };

  if (obj.provenance !== undefined && obj.provenance !== null) {
    intent.provenance = obj.provenance as LearningIntentProvenance;
  }
  if (conceptId !== undefined) intent.conceptId = conceptId;
  if (learningSpaceId !== undefined) intent.learningSpaceId = learningSpaceId;

  return intent;
}

/** True when value is a fully valid LearningIntent object. */
export function isLearningIntent(value: unknown): value is LearningIntent {
  return parseLearningIntent(value) !== null;
}

export function isLearningIntentPurpose(
  value: unknown,
): value is LearningIntentPurpose {
  return isPurpose(value);
}

export function isLearningIntentSource(
  value: unknown,
): value is LearningIntentSource {
  return isSource(value);
}

export function isLearningIntentScope(
  value: unknown,
): value is LearningIntentScope {
  return isScope(value);
}

export function isLearningIntentProvenance(
  value: unknown,
): value is LearningIntentProvenance {
  return isProvenance(value);
}

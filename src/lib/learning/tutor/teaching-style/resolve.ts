/**
 * 2P-19 — Teaching Style parse / resolve / boundary helpers.
 */

import type {
  TeachingStyle,
  TeachingStyleBoundarySummary,
  TeachingStyleResolution,
} from "./types";
import { TEACHING_STYLES, TEACH_ME_LIKE_IM_5_STYLE } from "./types";

export function isTeachingStyle(value: unknown): value is TeachingStyle {
  return (
    typeof value === "string" &&
    (TEACHING_STYLES as readonly string[]).includes(value)
  );
}

/**
 * Parse optional teaching style from client/API input.
 * - undefined / null / "" → undefined (preserve existing Tutor behavior)
 * - valid style → style
 * - "TEACH_ME_LIKE_IM_5" alias → SIMPLIFIED
 * - invalid → null (caller should reject)
 */
export function parseTeachingStyle(
  raw: unknown,
): TeachingStyle | undefined | null {
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const upper = trimmed.toUpperCase().replace(/[\s-]+/g, "_");
  if (
    upper === "TEACH_ME_LIKE_IM_5" ||
    upper === "LIKE_IM_5" ||
    upper === "LIKE_I_AM_5"
  ) {
    return TEACH_ME_LIKE_IM_5_STYLE;
  }
  if (isTeachingStyle(upper)) return upper;
  // Accept already-correct casing from TEACHING_STYLES
  if (isTeachingStyle(trimmed)) return trimmed;
  return null;
}

/**
 * Deterministic precedence:
 * explicit request → session-held → stored preference → message hint → absent.
 * Never infers age or intelligence from evidence/struggles.
 */
export function resolveTeachingStyle(input: {
  explicit?: TeachingStyle | null | undefined;
  sessionHeld?: TeachingStyle | null | undefined;
  preference?: TeachingStyle | null | undefined;
  /** Explicit phrase in the learner message (e.g. "like I'm 5") — not struggle inference. */
  messageHint?: TeachingStyle | null | undefined;
}): TeachingStyleResolution {
  if (input.explicit != null && isTeachingStyle(input.explicit)) {
    return { style: input.explicit, source: "explicit" };
  }
  if (input.sessionHeld != null && isTeachingStyle(input.sessionHeld)) {
    return { style: input.sessionHeld, source: "session" };
  }
  if (input.preference != null && isTeachingStyle(input.preference)) {
    return { style: input.preference, source: "preference" };
  }
  if (input.messageHint != null && isTeachingStyle(input.messageHint)) {
    return { style: input.messageHint, source: "explicit" };
  }
  return { style: undefined, source: "default_absent" };
}

/** Switching style must not reset concept/intent/mode — pure presentation field swap. */
export function applyTeachingStyleSwitch(input: {
  conceptIds?: string[];
  mode: string;
  intentPurpose?: string | null;
  historyLength: number;
  previousStyle: TeachingStyle | undefined;
  nextStyle: TeachingStyle | undefined;
}): {
  conceptIds: string[] | undefined;
  mode: string;
  intentPurpose: string | null | undefined;
  historyLength: number;
  teachingStyle: TeachingStyle | undefined;
  sessionReset: false;
} {
  void input.previousStyle;
  return {
    conceptIds: input.conceptIds,
    mode: input.mode,
    intentPurpose: input.intentPurpose,
    historyLength: input.historyLength,
    teachingStyle: input.nextStyle,
    sessionReset: false,
  };
}

export function teachingStyleBoundaryTruthSummary(): TeachingStyleBoundarySummary {
  return {
    optional: true,
    doesNotAlterDiagnosis: true,
    doesNotAlterMastery: true,
    doesNotAlterEvidence: true,
    doesNotAlterLearningAttemptOutcome: true,
    doesNotAlterAdaptiveCompletion: true,
    doesNotAlterLearningIntent: true,
    doesNotInferAge: true,
    doesNotInferIntelligence: true,
    isNotLearnerPersona: true,
    isNotGradeLevel: true,
    aiTextIsNotLearnerEvidence: true,
    noSeparateTeachingStyleEngine: true,
    teachMeLikeIm5IsNotAge: true,
  };
}

/** Style coexists with accessibility/persona — separate axes. */
export function teachingStyleCoexistsWithAccessibility(input: {
  teachingStyle?: TeachingStyle;
  preferSimplifiedCopy?: boolean;
  preferLargerTargets?: boolean;
}): {
  teachingStyle: TeachingStyle | undefined;
  accessibility: {
    preferSimplifiedCopy: boolean;
    preferLargerTargets: boolean;
  };
  axesIndependent: true;
} {
  return {
    teachingStyle: input.teachingStyle,
    accessibility: {
      preferSimplifiedCopy: input.preferSimplifiedCopy === true,
      preferLargerTargets: input.preferLargerTargets === true,
    },
    axesIndependent: true,
  };
}

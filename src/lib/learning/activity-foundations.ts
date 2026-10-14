/**
 * 2G-70 WS10–17 — Universal activity foundation contracts.
 *
 * Shared shape for future Coding / SQL / Lab / Simulation / Game /
 * Writing / Project / Presentation activities.
 *
 * Maturity: FOUNDATION only — type/contract + validator helpers.
 * No IDE, no SQL platform, no fabricated evidence from open/launch.
 * Server-side evaluation must be authoritative; client cannot claim SUCCESS.
 */

import type {
  EvidenceOutcomeName,
  LearningObjectTypeName,
  MasteryFacetName,
} from "@/lib/learning/types";

export const ACTIVITY_FOUNDATION_TYPES = [
  "CODING_CHALLENGE",
  "SQL_CHALLENGE",
  "LAB",
  "SIMULATION",
  "GAME",
  "WRITING_EXERCISE",
  "PROJECT_TASK",
  "PRESENTATION_PRACTICE",
] as const;

export type ActivityFoundationType = (typeof ACTIVITY_FOUNDATION_TYPES)[number];

export type ActivityFoundationMaturity =
  | "FOUNDATION"
  | "PARTIAL"
  | "INTEGRATED"
  | "EVIDENCE-CLOSED"
  | "ADAPTIVE-READY"
  | "PRODUCT-COMPLETE";

/** Opaque activity payload — activity-owned, not ULE core. */
export type ActivityPayloadRef = {
  kind: string;
  id: string;
  [key: string]: unknown;
};

/**
 * Universal foundation for a challenge/exercise activity.
 * Does not write evidence by itself.
 */
export type UniversalActivityFoundation = {
  learningObjectType: ActivityFoundationType;
  /** Default facet claim when objective evaluation succeeds — often PERFORM. */
  defaultSkillFacet: MasteryFacetName;
  conceptId: string;
  payloadRef: ActivityPayloadRef;
  /** Opaque success criteria authored by the activity, not ULE math. */
  successCriteria?: Record<string, unknown>;
  /** True only after server-side objective evaluation. */
  evaluationAuthoritative: true;
  /** Opening/launching alone must never produce evidence. */
  launchIsNotEvidence: true;
  /** Points/badges alone are not mastery. */
  pointsAreNotMastery: true;
};

export type ActivityEvaluationResult = {
  outcome: EvidenceOutcomeName;
  score?: number | null;
  /** Opaque evaluator detail — never trust client SUCCESS alone. */
  evaluatorRef: Record<string, unknown>;
  serverAuthoritative: true;
};

export function isActivityFoundationType(
  type: string,
): type is ActivityFoundationType {
  return (ACTIVITY_FOUNDATION_TYPES as readonly string[]).includes(type);
}

export function assertServerAuthoritativeEvaluation(
  result: ActivityEvaluationResult,
): void {
  if (!result.serverAuthoritative) {
    throw new Error("Activity evaluation must be server-authoritative");
  }
}

/** Reject client-claimed SUCCESS without server evaluation. */
export function rejectClientClaimedSuccess(input: {
  clientClaimedSuccess?: boolean;
  serverEvaluated: boolean;
}): { accepted: boolean; reason?: string } {
  if (input.clientClaimedSuccess && !input.serverEvaluated) {
    return {
      accepted: false,
      reason: "Client cannot claim SUCCESS without server evaluation.",
    };
  }
  return { accepted: true };
}

export function activityFoundationStatus(
  type: ActivityFoundationType,
): {
  type: ActivityFoundationType;
  maturity: ActivityFoundationMaturity;
  realEvaluatingActivity: false;
  evidenceClosed: false;
  adaptiveReady: false;
  productComplete: false;
} {
  return {
    type,
    maturity: "FOUNDATION",
    realEvaluatingActivity: false,
    evidenceClosed: false,
    adaptiveReady: false,
    productComplete: false,
  };
}

export function codingActivityFoundation(): UniversalActivityFoundation {
  return {
    learningObjectType: "CODING_CHALLENGE",
    defaultSkillFacet: "PERFORM",
    conceptId: "",
    payloadRef: { kind: "coding_challenge", id: "" },
    evaluationAuthoritative: true,
    launchIsNotEvidence: true,
    pointsAreNotMastery: true,
  };
}

export function sqlActivityFoundation(): UniversalActivityFoundation {
  return {
    learningObjectType: "SQL_CHALLENGE",
    defaultSkillFacet: "PERFORM",
    conceptId: "",
    payloadRef: { kind: "sql_challenge", id: "" },
    evaluationAuthoritative: true,
    launchIsNotEvidence: true,
    pointsAreNotMastery: true,
  };
}

export function labActivityFoundation(): UniversalActivityFoundation {
  return {
    learningObjectType: "LAB",
    defaultSkillFacet: "PERFORM",
    conceptId: "",
    payloadRef: { kind: "lab", id: "" },
    evaluationAuthoritative: true,
    launchIsNotEvidence: true,
    pointsAreNotMastery: true,
  };
}

export function simulationActivityFoundation(): UniversalActivityFoundation {
  return {
    learningObjectType: "SIMULATION",
    defaultSkillFacet: "PERFORM",
    conceptId: "",
    payloadRef: { kind: "simulation", id: "" },
    evaluationAuthoritative: true,
    launchIsNotEvidence: true,
    pointsAreNotMastery: true,
  };
}

export function gameActivityFoundation(): UniversalActivityFoundation {
  return {
    learningObjectType: "GAME",
    defaultSkillFacet: "PERFORM",
    conceptId: "",
    payloadRef: { kind: "learning_game", id: "" },
    evaluationAuthoritative: true,
    launchIsNotEvidence: true,
    pointsAreNotMastery: true,
  };
}

export function writingActivityFoundation(): UniversalActivityFoundation {
  return {
    learningObjectType: "WRITING_EXERCISE",
    defaultSkillFacet: "EXPLAIN",
    conceptId: "",
    payloadRef: { kind: "writing_exercise", id: "" },
    evaluationAuthoritative: true,
    launchIsNotEvidence: true,
    pointsAreNotMastery: true,
  };
}

export function projectActivityFoundation(): UniversalActivityFoundation {
  return {
    learningObjectType: "PROJECT_TASK",
    defaultSkillFacet: "APPLY",
    conceptId: "",
    payloadRef: { kind: "project_task", id: "" },
    evaluationAuthoritative: true,
    launchIsNotEvidence: true,
    pointsAreNotMastery: true,
  };
}

export function presentationActivityFoundation(): UniversalActivityFoundation {
  return {
    learningObjectType: "PRESENTATION_PRACTICE",
    defaultSkillFacet: "PERFORM",
    conceptId: "",
    payloadRef: { kind: "presentation_practice", id: "" },
    evaluationAuthoritative: true,
    launchIsNotEvidence: true,
    pointsAreNotMastery: true,
  };
}

/** Prove reserved LO types align with type catalog. */
export function foundationTypesAreLearningObjectTypes(
  catalog: readonly LearningObjectTypeName[],
): boolean {
  return ACTIVITY_FOUNDATION_TYPES.every((t) =>
    (catalog as readonly string[]).includes(t),
  );
}

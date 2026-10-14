/**
 * Facade/adapter helpers for future migration of existing AI experiences.
 * Phase 2D-1: Facade helpers for later migration. SIX / CORE Assist / Teach Me
 * are wired behind their own feature flags in later 2D phases — not forced here.
 */

import type { TutorMode, TutorRequest } from "@/lib/learning/tutor/types";

export type LegacyAiSurface =
  | "core_assist"
  | "teach_me"
  | "hub_chat"
  | "six_tutor"
  | "study_ai"
  | "other";

const SURFACE_DEFAULT_MODE: Record<LegacyAiSurface, TutorMode> = {
  core_assist: "TEACH_ME",
  teach_me: "TEACH_ME",
  hub_chat: "BEGINNER",
  six_tutor: "GUIDED",
  study_ai: "TEACH_ME",
  other: "GUIDED",
};

/**
 * Build a TutorRequest from a legacy chat-style payload.
 * Does not invoke the Tutor — callers may adopt runTutor later.
 */
export function toTutorRequestFromLegacyChat(input: {
  learnerId: string;
  message: string;
  surface?: LegacyAiSurface;
  mode?: TutorMode;
  conceptIds?: string[];
  learningSpaceId?: string | null;
  subjectDomain?: string | null;
  history?: TutorRequest["history"];
  includeOpenAIPro?: boolean;
  /** 2P-20 — optional Teaching Style. */
  teachingStyle?: TutorRequest["teachingStyle"];
}): TutorRequest {
  const surface = input.surface ?? "other";
  return {
    learnerId: input.learnerId,
    mode: input.mode ?? SURFACE_DEFAULT_MODE[surface],
    message: input.message,
    conceptIds: input.conceptIds,
    learningSpaceId: input.learningSpaceId,
    subjectDomain: input.subjectDomain,
    history: input.history,
    modality: "text",
    evidenceIntent: "none",
    evidenceAuthorizedByServer: false,
    includeOpenAIPro: input.includeOpenAIPro,
    ...(input.teachingStyle ? { teachingStyle: input.teachingStyle } : {}),
  };
}

/**
 * Map Study Evaluate / Teach-Me style demonstration onto evidence-capable request.
 * Phase 2G-67: marks evidence as server-authorized (trusted constructor only).
 * Still unused by UI in 2D-1 — available for later phases.
 */
export function toTutorRequestFromDemonstration(input: {
  learnerId: string;
  message: string;
  learnerDemonstration: string;
  mode?: TutorMode;
  conceptIds?: string[];
  learningSpaceId?: string | null;
  subjectDomain?: string | null;
  evidenceIntent?: TutorRequest["evidenceIntent"];
  /** 2P-20 — optional Teaching Style (presentation only). */
  teachingStyle?: TutorRequest["teachingStyle"];
}): TutorRequest {
  return {
    learnerId: input.learnerId,
    mode: input.mode ?? "PRACTICE",
    message: input.message,
    learnerDemonstration: input.learnerDemonstration,
    conceptIds: input.conceptIds,
    learningSpaceId: input.learningSpaceId,
    subjectDomain: input.subjectDomain,
    modality: "text",
    evidenceIntent: input.evidenceIntent ?? "practice_answer",
    evidenceAuthorizedByServer: true,
    ...(input.teachingStyle ? { teachingStyle: input.teachingStyle } : {}),
  };
}

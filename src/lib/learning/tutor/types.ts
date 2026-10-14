/**
 * Unified Tutor foundation contracts (Phase 2D-1).
 * One Tutor service; modes are policy profiles, not separate brains.
 */

import type { LearningIntent } from "@/lib/learning/intent/types";
import type { TeachingStyle } from "@/lib/learning/tutor/teaching-style";

export const TUTOR_MODES = [
  "BEGINNER",
  "TEACH_ME",
  "SOCRATIC",
  "GUIDED",
  "PRACTICE",
  "CHALLENGE",
  "EXAM",
  "ADVANCED",
] as const;

export type TutorMode = (typeof TUTOR_MODES)[number];

export type TutorModality = "text" | "voice";

/**
 * Optional modality hint on TutorRequest.
 * Runtime path today is **text**. `"voice"` is accepted for forward-compatible
 * clients but does **not** enable Tutor STT/TTS I/O (Language Workspace has
 * optional browser speech separately). Do not treat modality as evidence.
 */
/**
 * When set, the Tutor may record standardized ULE evidence after the turn.
 * Ordinary Q&A without demonstration should leave this unset/false.
 */
export type TutorEvidenceIntent =
  | "none"
  | "explain"
  | "practice_answer"
  | "guided_task"
  | "apply"
  | "solve";

export interface TutorRequest {
  learnerId: string;
  mode: TutorMode;
  /** Primary learner utterance / prompt. */
  message: string;
  conceptIds?: string[];
  learningSpaceId?: string | null;
  /** Free-form subject/domain label — not Course-required. */
  subjectDomain?: string | null;
  learningObjectId?: string | null;
  activityId?: string | null;
  /** Soft learning signal, e.g. "i_dont_understand", "practice". */
  signal?: string | null;
  modality?: TutorModality;
  /**
   * Prior turns for this conversation (optional).
   * Does not become mastery truth.
   */
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  /**
   * Server-approved evidence kind for this turn (write path).
   * Client foundation requests must leave this `"none"` / unset.
   * Only server-built adapters (e.g. demonstration facade) may set a
   * recordable value together with `evidenceAuthorizedByServer: true`.
   */
  evidenceIntent?: TutorEvidenceIntent;
  /**
   * Phase 2G-67 — optional client-requested evidence kind (contextual only).
   * Never authorizes LearningAttempt / ConceptMastery by itself.
   */
  clientEvidenceIntentRequest?: TutorEvidenceIntent | null;
  /**
   * Phase 2G-67 — server must explicitly authorize evidence writes.
   * Omitted / false → untrusted (foundation API, ordinary chat).
   * True only on trusted server-built TutorRequest constructors.
   */
  evidenceAuthorizedByServer?: boolean;
  /** Optional learner answer/artifact for practice grading-style evidence. */
  learnerDemonstration?: string | null;
  includeOpenAIPro?: boolean;
  /**
   * Experience-specific instructional strategy (e.g. SIX technique rules).
   * Appended to the mode policy — does not create a separate Tutor brain.
   */
  instructionalContext?: string | null;
  /** Optional completion overrides when an experience needs parity with its legacy path. */
  temperature?: number;
  maxTokens?: number;
  /** Ask the provider for JSON when the experience requires structured output. */
  jsonMode?: boolean;
  /**
   * Phase 2G-24 — optional ephemeral LearningIntent (why the learner is engaging).
   * Independent of TutorMode (how to teach) and TutorEvidenceIntent (evidence kind).
   * Undefined → resolved from TutorMode projection when possible; null → omit.
   */
  intent?: LearningIntent | null;
  /**
   * True when the learner explicitly chose TutorMode in UI.
   * Affects LearningIntent source/provenance only — not Tutor policy.
   */
  modeLearnerSelected?: boolean;
  /**
   * 2P-19 — optional Teaching Style (HOW to communicate).
   * Independent of TutorMode (WHAT interaction) and LearningIntent (WHY).
   * Undefined → existing Tutor presentation behavior.
   * Soft preference only — never diagnosis, evidence, mastery, or Adaptive completion.
   */
  teachingStyle?: TeachingStyle;
}

export interface TutorSuggestedAction {
  /** Learner-facing suggestion only — not an auto-launch. */
  label: string;
  kind?: "six" | "practice" | "recall" | "continue" | "other";
  /** Existing route when known (e.g. six guide href). */
  href?: string | null;
}

export interface TutorResponse {
  text: string;
  mode: TutorMode;
  /** Learner-facing concept titles (not raw IDs). */
  conceptTitles: string[];
  suggestedAction?: TutorSuggestedAction | null;
  /** Opaque metadata for callers — not for direct learner display. */
  meta: {
    provider?: string;
    model?: string;
    usedLearnerModel: boolean;
    usedKnowledgeModel: boolean;
    conceptIds: string[];
    evidenceRecorded: boolean;
    learningAttemptId?: string | null;
    /**
     * Phase 2G-24 — ephemeral LearningIntent carried for this turn (opaque).
     * Not learner-facing copy. Does not alter TutorMode or evidence.
     */
    learningIntent?: LearningIntent | null;
    /**
     * 2P-19 — resolved Teaching Style for this turn (presentation only).
     * Undefined when absent — existing Tutor behavior.
     */
    teachingStyle?: TeachingStyle;
  };
}

export function isTutorMode(value: string): value is TutorMode {
  return (TUTOR_MODES as readonly string[]).includes(value);
}

/**
 * Bundle G — Instructional Experience (presentation + lesson enrichment).
 * Consumes existing SixWorkedLesson / Teach path / KL — not a second engine.
 */

import type { TeachingDepthSection } from "@/lib/learning/teach/depth";

/** Visible learning states in the Learning Studio (not room navigation). */
export type LearningStudioStage =
  | "understand"
  | "explore"
  | "try"
  | "check"
  | "apply"
  | "transfer"
  | "recall"
  | "complete";

export type LearningInteractionKind =
  | "select"
  | "short-answer"
  | "explain"
  | "apply"
  | "transfer"
  | "recall";

/**
 * Structured interaction attached to a teaching moment (Studio lesson layer).
 * Bundle L boundary: LearningInteraction = chunk/moment formative from the lesson.
 * InteractiveActivity (activity/runtime) = KL/LAF-backed forms in ActivityRuntime.
 * Keep both — do not merge; they sit at different layers.
 */
export type LearningInteraction = {
  kind: LearningInteractionKind;
  prompt: string;
  /** Select / recognition choices (learner-facing). */
  choices?: string[];
  /** Index of the correct choice when select is used. */
  correctIndex?: number;
  /** Teaching rationale shown after an incorrect select. */
  rationale?: string;
  /** Soft label for UI (Recognition / Application / Transfer). */
  label?: string;
};

export type ConceptRelationEdge = {
  from: string;
  to: string;
  relation: "prerequisite" | "leads-to" | "related" | "contrasts";
};

export type ConceptRelationshipMap = {
  nodes: string[];
  edges: ConceptRelationEdge[];
  /** ASCII / prose map for Stage visual block. */
  visual: string;
};

export type CurriculumSection = {
  id: string;
  title: string;
  items: Array<{
    id: string;
    title: string;
    /** Canonical path position — not mastery. */
    status: "visited" | "current" | "next" | "available";
    pathIndex: number;
  }>;
};

export type InstructionalMoment = {
  id: string;
  /** Index into lesson.chunks */
  chunkIndex: number;
  depthSection?: TeachingDepthSection;
  studioStage: LearningStudioStage;
  title: string;
  interaction?: LearningInteraction | null;
};

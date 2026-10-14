/**
 * Phase 2G-62 — Mastery truth boundary.
 *
 * Canonical ULE mastery = ConceptMastery (LearningAttempt → Evidence → Mastery).
 * Legacy topic/course progress = TopicMastery.
 *
 * These paths may coexist. They MUST NOT be averaged, merged, blended,
 * or silently substituted for each other in learner-facing ULE mastery claims.
 *
 * Does not create a second mastery system or persisted model.
 */

import type { FacetedMasteryScores } from "@/lib/learning/types";
import { emptyFacetScores } from "@/lib/learning/mastery/facets";

/** Persisted / contract source names — documentation + guards. */
export const CANONICAL_ULE_MASTERY_SOURCE = "ConceptMastery" as const;
export const LEGACY_TOPIC_PROGRESS_SOURCE = "TopicMastery" as const;

export type MasteryTruthSource =
  | typeof CANONICAL_ULE_MASTERY_SOURCE
  | typeof LEGACY_TOPIC_PROGRESS_SOURCE;

/** Soft learner-facing copy for TopicMastery curriculum surfaces. */
export const TOPIC_PROGRESS_LEARNER_COPY = {
  shortLabel: "Topic progress",
  treeHeading: "Topic progress map",
  treeSubtitle:
    "Course topic practice signals from quizzes, flashcards, and Lucky — topic/course progress, not Universal Learning Engine concept mastery.",
  loading: "Loading topic progress…",
  empty: "No topic progress yet. Study with Lucky, quizzes, or flashcards to populate this map.",
  sixPanelBlurb:
    "Based on weak topic progress — each topic gets a matched Six technique with AI coaching.",
  sixPanelLoading: "Analyzing topic progress…",
  sixPanelEmptyHint:
    "No weak topics detected. Add courses with topics, or take a quiz to build topic progress data.",
  /** Hub / dashboard metric pills that still aggregate TopicMastery. */
  dashboardMetricLabel: "Topic progress",
} as const;

/** Soft learner-facing copy for ULE ConceptMastery (when surfaced). */
export const ULE_MASTERY_LEARNER_COPY = {
  shortLabel: "Concept mastery",
  unavailable: "Concept mastery is not available yet for this concept.",
  insufficientEvidence:
    "Not enough learning evidence yet to show concept mastery for this concept.",
} as const;

export type ConceptMasterySnapshot = {
  recognize: number;
  explain: number;
  apply: number;
  solve: number;
  perform: number;
  retain: number;
  confidence: number;
  reviewCount: number;
};

export type LearnerFacingUleMastery =
  | {
      status: "available";
      source: typeof CANONICAL_ULE_MASTERY_SOURCE;
      facets: FacetedMasteryScores;
      reviewCount: number;
    }
  | {
      status: "unavailable";
      source: typeof CANONICAL_ULE_MASTERY_SOURCE;
      reason: "missing_concept_mastery" | "no_ule_reviews";
      message: string;
    };

export type TopicCourseProgress =
  | {
      status: "available";
      source: typeof LEGACY_TOPIC_PROGRESS_SOURCE;
      proficiency: number;
      understanding: number;
      recall: number;
      application: number;
      confidence: number;
      reviewCount: number;
    }
  | {
      status: "unavailable";
      source: typeof LEGACY_TOPIC_PROGRESS_SOURCE;
      reason: "missing_topic_mastery";
    };

/**
 * Learner-facing ULE mastery from ConceptMastery only.
 * Never reads TopicMastery. Never fabricates facets from topic progress.
 */
export function resolveLearnerFacingUleMastery(
  conceptMastery: ConceptMasterySnapshot | null | undefined,
): LearnerFacingUleMastery {
  if (conceptMastery == null) {
    return {
      status: "unavailable",
      source: CANONICAL_ULE_MASTERY_SOURCE,
      reason: "missing_concept_mastery",
      message: ULE_MASTERY_LEARNER_COPY.unavailable,
    };
  }

  if (conceptMastery.reviewCount <= 0) {
    return {
      status: "unavailable",
      source: CANONICAL_ULE_MASTERY_SOURCE,
      reason: "no_ule_reviews",
      message: ULE_MASTERY_LEARNER_COPY.insufficientEvidence,
    };
  }

  return {
    status: "available",
    source: CANONICAL_ULE_MASTERY_SOURCE,
    reviewCount: conceptMastery.reviewCount,
    facets: {
      recognize: conceptMastery.recognize,
      explain: conceptMastery.explain,
      apply: conceptMastery.apply,
      solve: conceptMastery.solve,
      perform: conceptMastery.perform,
      retain: conceptMastery.retain,
      confidence: conceptMastery.confidence,
    },
  };
}

/**
 * Explicit legacy path for Topic/course progress surfaces (MasteryTree, etc.).
 * Not valid as ULE mastery truth.
 */
export function resolveTopicCourseProgress(
  topicMastery: {
    proficiency: number;
    understanding: number;
    recall: number;
    application: number;
    confidence: number;
    reviewCount: number;
  } | null | undefined,
): TopicCourseProgress {
  if (topicMastery == null) {
    return {
      status: "unavailable",
      source: LEGACY_TOPIC_PROGRESS_SOURCE,
      reason: "missing_topic_mastery",
    };
  }

  return {
    status: "available",
    source: LEGACY_TOPIC_PROGRESS_SOURCE,
    proficiency: topicMastery.proficiency,
    understanding: topicMastery.understanding,
    recall: topicMastery.recall,
    application: topicMastery.application,
    confidence: topicMastery.confidence,
    reviewCount: topicMastery.reviewCount,
  };
}

/** Hard guard — never combine the two stores into one score. */
export function assertNoMasteryMerge(): void {
  // Intentional no-op documentation point for tests / callers.
  // There is no merge API by design.
}

/**
 * Rejects any attempt to treat TopicMastery as ULE mastery input.
 * Returns unavailable rather than substituting topic progress.
 */
export function resolveLearnerFacingUleMasteryIgnoringTopicProgress(input: {
  conceptMastery: ConceptMasterySnapshot | null | undefined;
  /** Ignored — accepted only so callers cannot accidentally "use" it as fallback. */
  topicMastery?: unknown;
}): LearnerFacingUleMastery {
  void input.topicMastery;
  return resolveLearnerFacingUleMastery(input.conceptMastery);
}

export function isCanonicalUleMasterySource(
  source: string,
): source is typeof CANONICAL_ULE_MASTERY_SOURCE {
  return source === CANONICAL_ULE_MASTERY_SOURCE;
}

export function isLegacyTopicProgressSource(
  source: string,
): source is typeof LEGACY_TOPIC_PROGRESS_SOURCE {
  return source === LEGACY_TOPIC_PROGRESS_SOURCE;
}

/** Empty facets for UI placeholders — not derived from TopicMastery. */
export function emptyUleMasteryFacets(): FacetedMasteryScores {
  return emptyFacetScores();
}

export function masteryTruthBoundarySummary(): {
  uleMastery: typeof CANONICAL_ULE_MASTERY_SOURCE;
  topicProgress: typeof LEGACY_TOPIC_PROGRESS_SOURCE;
  mayCoexist: true;
  mayMerge: false;
  learnerFacingUleFallsBackToTopicMastery: false;
} {
  return {
    uleMastery: CANONICAL_ULE_MASTERY_SOURCE,
    topicProgress: LEGACY_TOPIC_PROGRESS_SOURCE,
    mayCoexist: true,
    mayMerge: false,
    learnerFacingUleFallsBackToTopicMastery: false,
  };
}

import type { LearningIntent } from "@/lib/learning/intent/types";
import {
  normalizeLearningDecisionContext,
  type LearningDecisionContext,
  type LearningDecisionContextInput,
} from "@/lib/learning/orchestrator/context";
import {
  resolveAssessmentWorkflowHandoff,
  type AssessmentWorkflowHandoff,
} from "@/lib/learning/orchestrator/assessment-handoff";
import type {
  OrchestratorDiagnosis,
  OrchestratorResult,
} from "@/lib/learning/orchestrator/diagnose";
import {
  buildOrchestratorMasterySummary,
  type OrchestratorMasterySummary,
} from "@/lib/learning/orchestrator/present-mastery-summary";
import {
  presentConceptProgress,
  type ConceptProgressView,
} from "@/lib/learning/mastery/present-concept-progress";
import type { OrchestratorActivityIntervention } from "@/lib/learning/orchestrator/activity-intervention-policy";

export type { OrchestratorMasterySummary } from "@/lib/learning/orchestrator/present-mastery-summary";
export type { ConceptProgressView } from "@/lib/learning/mastery/present-concept-progress";

/** Learner-facing suggestion states (no internal diagnosis codes). */
export type OrchestratorSuggestionState =
  | "recommendation"
  | "insufficient"
  | "none";

/**
 * Phase 2G-28 / 2G-29 — optional contextual options for presentation/suggest.
 * Top-level `intent` preserved for 2G-28 callers.
 * Nested `context` is the formal LearningDecisionContext input (2G-29).
 * Does not affect diagnosis or intervention.
 */
export type PresentOrchestratorOptions = LearningDecisionContextInput & {
  /**
   * Formal decision context. Merged with top-level fields;
   * top-level `intent` / ids override nested values when both are set.
   */
  context?: LearningDecisionContextInput | null;
};

export interface OrchestratorSuggestionView {
  state: OrchestratorSuggestionState;
  conceptTitle: string;
  /**
   * Opaque Concept id for Adaptive Study start/resume.
   * Not shown as diagnostic text; not a mastery/evidence signal.
   */
  conceptId: string;
  /**
   * Most recently updated ACTIVE AdaptiveSequenceRun for this concept, if any.
   * Suggestion load never creates a run.
   */
  activeRunId: string | null;
  /** What the system noticed (natural language). */
  notice: string;
  /** e.g. "Try Hands-on Practice" */
  recommendationLabel: string | null;
  reason: string;
  actionLabel: string | null;
  /** Existing SIX deep link — learner must choose to open. */
  href: string | null;
  /** Soften certainty (LOW confidence or insufficient evidence). */
  softWording: boolean;
  /**
   * Phase 2G-63 — presentation-only ConceptMastery learning-state line.
   * Never TopicMastery. Does not change diagnosis or CTAs.
   */
  masterySummary?: OrchestratorMasterySummary;
  /**
   * Phase 2G-70 WS1 — additive Concept Progress dimensions (presentation only).
   * Does not replace masterySummary. Never TopicMastery.
   */
  conceptProgress?: ConceptProgressView;
  /**
   * Phase 2G-28 — ephemeral LearningIntent metadata only.
   * undefined = not provided; null = explicit null / invalid parse.
   * Never drives diagnosis, intervention, copy, CTA, or href.
   */
  learningIntent?: LearningIntent | null;
  /**
   * Phase 2G-29 — formal LearningDecisionContext metadata only.
   * Never drives diagnosis, intervention, copy, CTA, or href.
   */
  decisionContext?: LearningDecisionContext;
  /**
   * Phase 2G-34 — Assessment Workflow handoff (metadata only).
   * Present when intent purpose is ASSESS. Does not launch Quiz or adapters.
   */
  assessmentHandoff?: AssessmentWorkflowHandoff;
  /**
   * Phase 2G-72 — optional activity practice suggestion (does not replace SIX CTA).
   */
  activityIntervention?: OrchestratorActivityIntervention;
}

function noticeForDiagnosis(
  diagnosis: OrchestratorDiagnosis,
  conceptTitle: string,
): string {
  switch (diagnosis) {
    case "UNDERSTANDING_GAP":
      return `Your recent evidence suggests a recognition or understanding gap on “${conceptTitle}.”`;
    case "APPLICATION_GAP":
      return `Your recent evidence suggests you could use more practice applying “${conceptTitle}.”`;
    case "RECALL_GAP":
      return `Your recent evidence suggests understanding of “${conceptTitle}” is ahead of recall.`;
    case "RETENTION_GAP":
      return `Your recent evidence suggests “${conceptTitle}” may need more retention practice.`;
    case "INSUFFICIENT_EVIDENCE":
      return "We don't have enough evidence yet to make a strong recommendation.";
    case "NO_INTERVENTION":
      return "";
  }
}

/**
 * Resolve PresentOrchestratorOptions into a formal LearningDecisionContext.
 * undefined = no contextual options (2G-28 absent path).
 * Top-level fields override nested `context` when both are present.
 */
export function resolvePresentDecisionContext(
  options?: PresentOrchestratorOptions,
): LearningDecisionContext | undefined {
  if (options === undefined) return undefined;

  const hasNested = "context" in options && options.context !== undefined;
  const hasTopIntent = "intent" in options;
  const hasTopConcept = "conceptId" in options;
  const hasTopSpace = "learningSpaceId" in options;
  const hasTop = hasTopIntent || hasTopConcept || hasTopSpace;

  if (!hasTop && !hasNested) return undefined;

  const fromNested = hasNested
    ? normalizeLearningDecisionContext(options.context)
    : {};

  const topInput: LearningDecisionContextInput = {};
  if (hasTopIntent) topInput.intent = options.intent;
  if (hasTopConcept) topInput.conceptId = options.conceptId;
  if (hasTopSpace) topInput.learningSpaceId = options.learningSpaceId;

  const fromTop = hasTop ? normalizeLearningDecisionContext(topInput) : {};

  return { ...fromNested, ...fromTop };
}

/**
 * Resolve optional present-layer intent (2G-28 compatibility).
 * undefined = absent; null = explicit omit or invalid payload.
 */
export function resolvePresentLearningIntent(
  options?: PresentOrchestratorOptions,
): LearningIntent | null | undefined {
  const ctx = resolvePresentDecisionContext(options);
  if (ctx === undefined) return undefined;
  if (!("intent" in ctx)) return undefined;
  return ctx.intent;
}

function withDecisionContext<T extends OrchestratorSuggestionView>(
  view: T,
  result: OrchestratorResult,
  options?: PresentOrchestratorOptions,
): T {
  // Present-layer options override; else use canonical result.decisionContext (2G-30).
  const fromOptions = resolvePresentDecisionContext(options);
  const decisionContext =
    fromOptions !== undefined ? fromOptions : result.decisionContext;
  if (decisionContext === undefined) {
    // Result may still carry a handoff when options omit context.
    if (result.assessmentHandoff) {
      return { ...view, assessmentHandoff: result.assessmentHandoff };
    }
    return view;
  }

  const next: T = { ...view, decisionContext };
  if ("intent" in decisionContext) {
    next.learningIntent = decisionContext.intent;
  }
  const assessmentHandoff =
    resolveAssessmentWorkflowHandoff(decisionContext) ??
    result.assessmentHandoff;
  if (assessmentHandoff) {
    next.assessmentHandoff = assessmentHandoff;
  }
  return next;
}

/**
 * Map OrchestratorResult → safe learner-facing copy.
 * Exposes opaque conceptId for Adaptive Study; does not expose diagnosis enums
 * or internal confidence/evidence labels in learner-facing text.
 * Phase 2G-28/29/30: optional LearningIntent / LearningDecisionContext are metadata only.
 * Phase 2G-34: ASSESS may expose assessmentHandoff metadata without launching assessment.
 * Phase 2G-63: optional masterySummary from ConceptMastery signals only (presentation).
 * Phase 2G-70 WS1: optional conceptProgress dimensions (additive; does not alter masterySummary).
 * Prefer present options when provided; else carry result.decisionContext.
 */
function buildConceptProgressFromResult(
  result: OrchestratorResult,
): ConceptProgressView {
  // TopicMastery-derived facet projections are not ULE truth — treat as missing.
  const conceptMastery =
    result.signals.usedTopicMasteryFallback || result.signals.reviewCount <= 0
      ? result.signals.reviewCount <= 0 && !result.signals.usedTopicMasteryFallback
        ? {
            ...result.signals.facets,
            confidence: 0,
            reviewCount: 0,
          }
        : null
      : {
          ...result.signals.facets,
          confidence: 0,
          reviewCount: result.signals.reviewCount,
        };

  return presentConceptProgress({
    conceptId: result.conceptId,
    conceptTitle: result.conceptTitle,
    conceptMastery,
  });
}

export function presentOrchestratorSuggestion(
  result: OrchestratorResult,
  options?: PresentOrchestratorOptions,
): OrchestratorSuggestionView | null {
  if (result.diagnosis === "NO_INTERVENTION") {
    return null;
  }

  const masterySummary = buildOrchestratorMasterySummary(result);
  const conceptProgress = buildConceptProgressFromResult(result);

  const softWording =
    result.confidence === "LOW" ||
    result.diagnosis === "INSUFFICIENT_EVIDENCE";

  const interventionLabel = result.intervention
    ? softWording
      ? `A possible next step: ${result.intervention.title}`
      : `Try ${result.intervention.title}`
    : null;

  if (result.diagnosis === "INSUFFICIENT_EVIDENCE") {
    return withDecisionContext(
      {
        state: "insufficient",
        conceptTitle: result.conceptTitle,
        conceptId: result.conceptId,
        activeRunId: null,
        notice:
          "We don't have enough evidence yet to make a strong recommendation. You can keep practicing or choose a study technique.",
        recommendationLabel: interventionLabel,
        reason: result.reason,
        actionLabel: result.intervention ? "Try it" : null,
        href: result.intervention?.href ?? null,
        softWording: true,
        masterySummary,
        conceptProgress,
        ...(result.activityIntervention
          ? { activityIntervention: result.activityIntervention }
          : {}),
      },
      result,
      options,
    );
  }

  const notice = softWording
    ? `A possible next step for “${result.conceptTitle}” based on limited evidence:`
    : noticeForDiagnosis(result.diagnosis, result.conceptTitle);

  const hasPrerequisiteHint = Boolean(result.prerequisiteHints?.length);
  const hasEvidenceHint = Boolean(result.evidenceHints?.length);

  return withDecisionContext(
    {
      state: "recommendation",
      conceptTitle: result.conceptTitle,
      conceptId: result.conceptId,
      activeRunId: null,
      notice,
      recommendationLabel: interventionLabel,
      reason: result.reason,
      actionLabel: result.intervention ? "Try it" : null,
      href: result.intervention?.href ?? null,
      softWording: softWording || hasPrerequisiteHint || hasEvidenceHint,
      masterySummary,
      conceptProgress,
      ...(result.activityIntervention
        ? { activityIntervention: result.activityIntervention }
        : {}),
    },
    result,
    options,
  );
}

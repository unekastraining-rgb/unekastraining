import type { SixComponent } from "@/lib/csl/six";
import { SIX_ACTIVITIES } from "@/lib/csl/six";
import { sixGuideHref } from "@/lib/csl/six-guides";
import {
  withOrchestratorDecisionContext,
  resolveOrchestrateDecisionContext,
  type LearningDecisionContext,
  type OrchestrateDecisionContextOptions,
} from "@/lib/learning/orchestrator/context";
import {
  withAssessmentWorkflowHandoff,
  type AssessmentWorkflowHandoff,
} from "@/lib/learning/orchestrator/assessment-handoff";
import { preferSixWithIntent } from "@/lib/learning/orchestrator/intent-preference";
import { withActivityInterventionSuggestion } from "@/lib/learning/orchestrator/activity-intervention-policy";
import type { OrchestratorActivityIntervention } from "@/lib/learning/orchestrator/activity-intervention-policy";
import type {
  FacetedMasteryScores,
  LearnerConceptMasterySummary,
} from "@/lib/learning/types";
import { classifyEvidenceSufficiency } from "@/lib/learning/evidence/evidence-sufficiency";
import { calibrateOrchestratorDiagnosis } from "@/lib/learning/mastery/mastery-calibration";

export type OrchestratorDiagnosis =
  | "UNDERSTANDING_GAP"
  | "APPLICATION_GAP"
  | "RECALL_GAP"
  | "RETENTION_GAP"
  | "INSUFFICIENT_EVIDENCE"
  | "NO_INTERVENTION";

export type OrchestratorConfidence = "HIGH" | "MEDIUM" | "LOW";

export interface OrchestratorIntervention {
  /** Existing SIX technique id — never a parallel catalog. */
  kind: "six";
  sixComponent: SixComponent;
  title: string;
  emoji: string;
  /** Deep link into existing SIX route (optional course/topic context). */
  href: string;
}

/**
 * 2G-72 — Additive activity suggestion after diagnosis.
 * Never replaces SIX `intervention`. Never created by diagnosis rules.
 */
export type { OrchestratorActivityIntervention };

export interface OrchestratorResult {
  learnerId: string;
  conceptId: string;
  conceptTitle: string;
  diagnosis: OrchestratorDiagnosis;
  intervention: OrchestratorIntervention | null;
  reason: string;
  confidence: OrchestratorConfidence;
  /** Grounding signals (for tests/debug — not learner-facing DB dumps). */
  signals: {
    facets: FacetedMasteryScores;
    evidenceSourceCounts: LearnerConceptMasterySummary["evidenceSourceCounts"];
    reviewCount: number;
    evidenceSourceKinds: number;
    usedTopicMasteryFallback: boolean;
  };
  /**
   * Phase 2E-3 — optional secondary prerequisite hints (additive).
   * Never replaces diagnosis. Absent when flag OFF or no strong signal.
   */
  prerequisiteHints?: Array<{
    conceptId: string;
    conceptTitle: string;
    reason: string;
  }>;
  /**
   * Phase 2F-2 — optional secondary evidence-intelligence hints (additive).
   * Never replaces diagnosis. Absent when flag OFF or no signal.
   */
  evidenceHints?: Array<{
    kind: "repeated_failure" | "misconception" | "facet_failure";
    reason: string;
  }>;
  /**
   * Phase 2G-30 — optional LearningDecisionContext metadata.
   * Canonical contextual source of truth on the result.
   * Never drives diagnosis (intent-blind). Soft preference may use UNDERSTAND/PRACTICE only.
   */
  decisionContext?: LearningDecisionContext;
  /**
   * Phase 2G-34 — Assessment Workflow handoff seam (metadata only).
   * Present only when decisionContext carries an ASSESS purpose intent.
   * Does not select Quiz or any assessment adapter.
   */
  assessmentHandoff?: AssessmentWorkflowHandoff;
  /**
   * Phase 2G-72 — optional activity intervention suggestion (post-diagnosis).
   * Does not replace SIX `intervention`. Does not write evidence/mastery.
   */
  activityIntervention?: OrchestratorActivityIntervention;
}

/**
 * Route options (SIX href) plus optional decision-context input (2G-30).
 * Context fields are metadata only — never inspected by diagnosis rules.
 */
export type OrchestrateOptions = {
  courseId?: string | null;
  topicId?: string | null;
  topicName?: string | null;
  /**
   * 2G-74 — authoritative Concept/LearningSpace subjectDomain for activity
   * compatibility. Never inspected by diagnosis rules.
   */
  subjectDomain?: string | null;
  /**
   * 2P-42 — Recent Adaptive activity adapter keys for soft demotion in ranking.
   * Never inspected by diagnosis rules. Never forces variety alone.
   */
  recentActivityAdapterKeys?: readonly string[] | null;
} & OrchestrateDecisionContextOptions;

/** Strip context fields so intervention href building never sees them. */
function routeOptionsFrom(
  options?: OrchestrateOptions,
  topicNameFallback?: string | null,
): Pick<OrchestrateOptions, "courseId" | "topicId" | "topicName"> {
  return {
    courseId: options?.courseId,
    topicId: options?.topicId,
    topicName: options?.topicName ?? topicNameFallback,
  };
}

/** Canonical Orchestrator facet bands — reused by learner-facing presentation (2G-63). */
export const ORCHESTRATOR_FACET_WEAK = 0.45;
export const ORCHESTRATOR_FACET_STRONG = 0.55;

const WEAK = ORCHESTRATOR_FACET_WEAK;
const STRONG = ORCHESTRATOR_FACET_STRONG;

/**
 * Phase 2G-18 — Deterministic "substantially lower" using existing WEAK/STRONG bands.
 * Lower is weak (< WEAK) while higher is acceptable/strong (>= STRONG).
 */
export function isFacetSubstantiallyLower(
  lower: number,
  higher: number,
): boolean {
  return lower < WEAK && higher >= STRONG;
}

/**
 * True when Recognize/Explain split locks a single justified technique (2G-18 rules 1–2).
 * Soft intent preference must not override that lock.
 */
export function isUnderstandingFacetLocked(
  facets: FacetedMasteryScores,
  usedTopicMasteryFallback: boolean,
): boolean {
  const distinguishable = canDistinguishRecognizeFromExplain({
    usedTopicMasteryFallback,
    recognize: facets.recognize,
    explain: facets.explain,
  });
  if (!distinguishable) return false;
  if (isFacetSubstantiallyLower(facets.explain, facets.recognize)) return true;
  if (isFacetSubstantiallyLower(facets.recognize, facets.explain)) return true;
  return false;
}

/**
 * TopicMastery fallback copies understanding into both recognize and explain.
 * When values are indistinguishable, do not claim a Recognize-vs-Explain split.
 */
export function canDistinguishRecognizeFromExplain(input: {
  usedTopicMasteryFallback: boolean;
  recognize: number;
  explain: number;
}): boolean {
  if (input.usedTopicMasteryFallback) return false;
  if (input.recognize === input.explain) return false;
  return true;
}

function sixMeta(component: SixComponent) {
  const activity = SIX_ACTIVITIES.find((item) => item.id === component);
  return {
    title: activity?.title ?? component,
    emoji: activity?.emoji ?? "📚",
  };
}

function buildIntervention(
  component: SixComponent,
  options?: Pick<OrchestrateOptions, "courseId" | "topicId" | "topicName">,
): OrchestratorIntervention {
  const meta = sixMeta(component);
  return {
    kind: "six",
    sixComponent: component,
    title: meta.title,
    emoji: meta.emoji,
    href: sixGuideHref(component, {
      courseId: options?.courseId ?? undefined,
      topicId: options?.topicId ?? undefined,
      topicName: options?.topicName ?? undefined,
    }),
  };
}

function totalEvidenceEvents(summary: LearnerConceptMasterySummary): number {
  const c = summary.evidenceSourceCounts;
  return c.quiz + c.flashcard + c.study_evaluate + c.other;
}

function evidenceSourceKinds(summary: LearnerConceptMasterySummary): number {
  const c = summary.evidenceSourceCounts;
  return [c.quiz, c.flashcard, c.study_evaluate, c.other].filter((n) => n > 0)
    .length;
}

/**
 * Prefer ULE ConceptMastery facets. If no ULE evidence yet but TopicMastery
 * exists, use it as a LOW-confidence fallback (does not invent Concepts).
 */
export function effectiveFacetsForOrchestration(
  summary: LearnerConceptMasterySummary,
): { facets: FacetedMasteryScores; usedTopicMasteryFallback: boolean } {
  const hasUleEvidence =
    summary.reviewCount > 0 || totalEvidenceEvents(summary) > 0;

  if (hasUleEvidence) {
    return { facets: summary.facets, usedTopicMasteryFallback: false };
  }

  const tm = summary.topicMastery;
  if (tm) {
    return {
      usedTopicMasteryFallback: true,
      facets: {
        recognize: tm.understanding,
        explain: tm.understanding,
        apply: tm.application,
        solve: 0,
        perform: 0,
        retain: tm.recall,
        confidence: tm.confidence,
      },
    };
  }

  return { facets: summary.facets, usedTopicMasteryFallback: false };
}

export function computeOrchestratorConfidence(input: {
  reviewCount: number;
  evidenceEvents: number;
  sourceKinds: number;
  usedTopicMasteryFallback: boolean;
  diagnosis: OrchestratorDiagnosis;
}): OrchestratorConfidence {
  if (input.diagnosis === "INSUFFICIENT_EVIDENCE") return "LOW";
  if (input.usedTopicMasteryFallback) return "LOW";

  if (
    input.reviewCount >= 3 &&
    (input.sourceKinds >= 2 || input.evidenceEvents >= 4)
  ) {
    return "HIGH";
  }
  if (input.reviewCount >= 2 || input.evidenceEvents >= 2 || input.sourceKinds >= 2) {
    return "MEDIUM";
  }
  return "LOW";
}

/**
 * Phase 2G-18 — UNDERSTANDING_GAP stays the diagnosis; SIX technique reflects
 * Recognize vs Explain when that split is trustworthy (not TopicMastery-collapsed).
 * Never emits Quiz.
 */
export function pickUnderstandingIntervention(
  facets: FacetedMasteryScores,
  usedTopicMasteryFallback = false,
): SixComponent {
  const distinguishable = canDistinguishRecognizeFromExplain({
    usedTopicMasteryFallback,
    recognize: facets.recognize,
    explain: facets.explain,
  });

  if (distinguishable) {
    // Rule 1 — Explain substantially weaker than Recognize → explanation practice
    if (isFacetSubstantiallyLower(facets.explain, facets.recognize)) {
      return "feynman";
    }
    // Rule 2 — Recognize substantially weaker than Explain → retrieval (existing SIX)
    if (isFacetSubstantiallyLower(facets.recognize, facets.explain)) {
      return "active-recall";
    }
  }

  // Rule 3 / legacy — both weak, mid-band, or indistinguishable: existing selection
  if (facets.explain + 0.05 < facets.recognize) return "feynman";
  if (facets.recognize < WEAK && facets.explain < WEAK) {
    return "detailed-explanation";
  }
  if (facets.recognize < WEAK) return "detailed-explanation";
  if (facets.explain < WEAK) return "feynman";
  return "visualization";
}

function understandingReason(
  component: SixComponent,
  facets: FacetedMasteryScores,
  usedTopicMasteryFallback: boolean,
): string {
  const distinguishable = canDistinguishRecognizeFromExplain({
    usedTopicMasteryFallback,
    recognize: facets.recognize,
    explain: facets.explain,
  });

  if (
    distinguishable &&
    component === "feynman" &&
    isFacetSubstantiallyLower(facets.explain, facets.recognize)
  ) {
    return "Recent evidence suggests recognition is stronger than explanation for this concept. Let's strengthen how you explain it with the Feynman technique.";
  }
  if (
    distinguishable &&
    component === "active-recall" &&
    isFacetSubstantiallyLower(facets.recognize, facets.explain)
  ) {
    return "Recent evidence suggests explanation is stronger than recognition for this concept. Active Recall can strengthen retrieving it when you see it again.";
  }
  if (component === "feynman") {
    return "Recent evidence suggests a recognition/understanding gap: you may recognize parts of this concept, but explanation evidence is weaker. Let's work on explaining it.";
  }
  if (component === "visualization") {
    return "Recent evidence suggests an understanding gap. Mapping the idea visually can help clarify how the pieces relate.";
  }
  if (component === "active-recall") {
    return "Recent evidence suggests an understanding gap focused on retrieving the concept. Active Recall is a good next step.";
  }
  return "Recent evidence suggests a recognition/understanding gap. Let's walk through the concept step by step.";
}

/**
 * Pure decision layer: learner state → diagnosis + SIX recommendation.
 * Recommendation-only — does not launch sessions or mutate scheduling.
 *
 * Phase 2G-30: optional LearningDecisionContext on options is normalized and
 * attached to the result.
 * Phase 2G-32: UNDERSTAND / PRACTICE may soft-prefer within already-legal SIX
 * candidates AFTER diagnosis. ASSESS / CREATE remain context-only.
 * Phase 2G-72: optional activityIntervention after diagnosis + decision context;
 * never mutates diagnosis or replaces SIX intervention.
 * Phase 2G-74: activity selection uses capability → compatibility → availability
 * → ranking; subjectDomain is selection metadata only (never diagnosis input).
 * Diagnosis rules remain intent-blind.
 */
export function orchestrateFromLearnerState(
  summary: LearnerConceptMasterySummary,
  options?: OrchestrateOptions,
): OrchestratorResult {
  const route = routeOptionsFrom(options, summary.conceptTitle);
  const decisionContext = resolveOrchestrateDecisionContext(options);
  const intentPurpose =
    decisionContext && "intent" in decisionContext
      ? decisionContext.intent?.purpose
      : undefined;

  const { facets, usedTopicMasteryFallback } = effectiveFacetsForOrchestration(
    summary,
  );
  const events = totalEvidenceEvents(summary);
  const kinds = evidenceSourceKinds(summary);
  const facetSignal =
    facets.recognize +
    facets.explain +
    facets.apply +
    facets.solve +
    facets.perform +
    facets.retain;

  const baseSignals = {
    facets,
    evidenceSourceCounts: summary.evidenceSourceCounts,
    reviewCount: summary.reviewCount,
    evidenceSourceKinds: kinds,
    usedTopicMasteryFallback,
  };

  const finish = (result: OrchestratorResult): OrchestratorResult =>
    withAssessmentWorkflowHandoff(
      withActivityInterventionSuggestion(
        withOrchestratorDecisionContext(result, options),
        {
          topicName: route.topicName,
          subjectDomain: options?.subjectDomain ?? null,
          recentAdapterKeys: options?.recentActivityAdapterKeys ?? null,
          preferSolveProducers:
            result.diagnosis === "APPLICATION_GAP" && facets.solve < WEAK,
          preferPerformProducers:
            result.diagnosis === "APPLICATION_GAP" && facets.perform < WEAK,
          preferCreationProducers:
            result.diagnosis === "APPLICATION_GAP" && facets.apply < WEAK,
        },
      ),
    );

  const applyIntentToComponent = (
    diagnosis: OrchestratorDiagnosis,
    baseline: SixComponent,
  ): SixComponent => {
    const preferred = preferSixWithIntent({
      diagnosis,
      baseline,
      facetLocked: isUnderstandingFacetLocked(
        facets,
        usedTopicMasteryFallback,
      ),
      purpose: intentPurpose ?? null,
    });
    return preferred ?? baseline;
  };

  // Insufficient evidence — do not claim a specific gap.
  // Intent must not bypass evidence-gathering (singleton Chunking).
  if (summary.reviewCount === 0 && events === 0 && facetSignal < 0.01) {
    const component = applyIntentToComponent(
      "INSUFFICIENT_EVIDENCE",
      "chunking",
    );
    return finish({
      learnerId: summary.learnerId,
      conceptId: summary.conceptId,
      conceptTitle: summary.conceptTitle,
      diagnosis: "INSUFFICIENT_EVIDENCE",
      intervention: buildIntervention(component, route),
      reason:
        "We don't have enough learning evidence yet to diagnose a specific gap. Starting with Chunking is a safe way to organize this concept.",
      confidence: "LOW",
      signals: baseSignals,
    });
  }

  let diagnosis: OrchestratorDiagnosis;
  let intervention: OrchestratorIntervention | null;
  let reason: string;

  const understandWeak = facets.recognize < WEAK || facets.explain < WEAK;
  const understandOk = facets.recognize >= STRONG && facets.explain >= STRONG;
  const applyWeak = facets.apply < WEAK;
  const applyOk = facets.apply >= STRONG;
  const retainWeak = facets.retain < WEAK;

  if (understandWeak) {
    diagnosis = "UNDERSTANDING_GAP";
    const baseline = pickUnderstandingIntervention(
      facets,
      usedTopicMasteryFallback,
    );
    const component = applyIntentToComponent(diagnosis, baseline);
    intervention = buildIntervention(component, route);
    reason = understandingReason(component, facets, usedTopicMasteryFallback);
  } else if (understandOk && applyWeak) {
    diagnosis = "APPLICATION_GAP";
    const component = applyIntentToComponent(
      diagnosis,
      "hands-on-practice",
    );
    intervention = buildIntervention(component, route);
    reason =
      "Your recent evidence shows stronger recognition/explanation than application. Let's practice using the concept.";
  } else if (
    facets.recognize >= STRONG &&
    facets.explain >= STRONG &&
    applyOk &&
    retainWeak
  ) {
    // Prior competence across understand+apply with weak retain → retention.
    const likelyRetention =
      summary.reviewCount >= 3 ||
      summary.evidenceSourceCounts.flashcard >= 1 ||
      usedTopicMasteryFallback;
    diagnosis = likelyRetention ? "RETENTION_GAP" : "RECALL_GAP";
    const component = applyIntentToComponent(diagnosis, "active-recall");
    intervention = buildIntervention(component, route);
    reason = likelyRetention
      ? "Your recent evidence shows solid understanding and application, but retention looks weaker. Active Recall can strengthen what you need to remember (Lucky review remains available when you choose it — this does not change Lucky)."
      : "Your recent evidence shows solid understanding, but recall evidence is weaker. Let's strengthen recall with Active Recall.";
  } else if (
    facets.recognize >= STRONG &&
    facets.explain >= STRONG &&
    retainWeak
  ) {
    diagnosis = "RECALL_GAP";
    const component = applyIntentToComponent(diagnosis, "active-recall");
    intervention = buildIntervention(component, route);
    reason =
      "Your recent evidence shows solid understanding, but recall/retention evidence is weaker. Active Recall is a good next step.";
  } else if (understandOk && applyOk && facets.perform < WEAK) {
    // 2P-45 — performance demonstration need without inventing a new diagnosis enum.
    // Reuses APPLICATION_GAP so performCapable activities remain legal.
    diagnosis = "APPLICATION_GAP";
    const component = applyIntentToComponent(
      diagnosis,
      "hands-on-practice",
    );
    intervention = buildIntervention(component, route);
    reason =
      "Your recent evidence shows understanding and application answers, but not enough demonstrated performance of the skill. Let's practice carrying out a meaningful task.";
  } else if (
    facets.recognize >= STRONG &&
    facets.explain >= STRONG &&
    facets.apply >= STRONG &&
    facets.retain >= STRONG
  ) {
    diagnosis = "NO_INTERVENTION";
    intervention = null;
    reason =
      "Current evidence looks strong across recognition, explanation, application, and retention. No specific SIX intervention is needed right now — keep practicing when you want.";
  } else if (applyWeak && facets.recognize >= WEAK && facets.explain >= WEAK) {
    diagnosis = "APPLICATION_GAP";
    const component = applyIntentToComponent(
      diagnosis,
      "hands-on-practice",
    );
    intervention = buildIntervention(component, route);
    reason =
      "Your recent evidence is stronger on understanding than on application. Hands-on Practice is a good next step.";
  } else if (retainWeak && facets.recognize >= WEAK && facets.explain >= WEAK) {
    diagnosis = "RECALL_GAP";
    const component = applyIntentToComponent(diagnosis, "active-recall");
    intervention = buildIntervention(component, route);
    reason =
      "Your recent evidence suggests understanding is ahead of recall. Active Recall can help close that gap.";
  } else {
    // Ambiguous mid-band — do not overdiagnose.
    // Intent must not bypass evidence-gathering Detailed Explanation.
    diagnosis = "INSUFFICIENT_EVIDENCE";
    const component = applyIntentToComponent(
      diagnosis,
      "detailed-explanation",
    );
    intervention = buildIntervention(component, route);
    reason =
      "Evidence is mixed or limited, so this is a low-confidence suggestion rather than a firm diagnosis. A short Detailed Explanation pass is a safe next step if you want one.";
  }

  if (usedTopicMasteryFallback && intervention) {
    reason = `${reason} (Based on limited legacy topic signals until more Study Haul evidence accumulates.)`;
  }

  // 2P-44 — soft evidence-sufficiency calibration (no new diagnosis enums).
  const sufficiency = classifyEvidenceSufficiency({
    reviewCount: summary.reviewCount,
    evidenceEvents: events,
    sourceKinds: kinds,
  });
  const calibrated = calibrateOrchestratorDiagnosis({
    diagnosis,
    sufficiency,
  });
  if (calibrated.softened && calibrated.diagnosis === "INSUFFICIENT_EVIDENCE") {
    diagnosis = "INSUFFICIENT_EVIDENCE";
    const component = applyIntentToComponent(
      "INSUFFICIENT_EVIDENCE",
      "detailed-explanation",
    );
    intervention = buildIntervention(component, route);
    reason = calibrated.reasonSuffix ?? reason;
  } else if (calibrated.reasonSuffix) {
    reason = `${reason} ${calibrated.reasonSuffix}`;
  }

  const confidence = computeOrchestratorConfidence({
    reviewCount: summary.reviewCount,
    evidenceEvents: events,
    sourceKinds: kinds,
    usedTopicMasteryFallback,
    diagnosis,
  });

  return finish({
    learnerId: summary.learnerId,
    conceptId: summary.conceptId,
    conceptTitle: summary.conceptTitle,
    diagnosis,
    intervention,
    reason,
    confidence,
    signals: baseSignals,
  });
}

/**
 * Phase 4C — Deterministic Knowledge Library loop decision engine.
 *
 * Priority (documented decision table):
 *
 * | Evidence state                                      | Decision   | Reason            |
 * |-----------------------------------------------------|------------|-------------------|
 * | No Knowledge Library context                        | complete*  | unknown-target    |
 * | Focus: exposure=0, attempts=0                       | teach      | new-concept       |
 * | Focus: lastOutcome=incorrect                        | reteach    | recent-incorrect  |
 * | Focus: exposure>0, attempts=0                       | practice   | needs-practice    |
 * | Focus: attempts>0, no recall evidence, not incorrect| recall     | needs-recall      |
 * | Focus ready + path has next untouched concept       | advance    | ready-to-advance  |
 * | Focus ready + no next concept                       | complete   | no-next-concept   |
 * | Path: prior ready, next concept unseen              | advance    | ready-to-advance  |
 * | Otherwise (needs more successful practice/check)    | practice   | needs-practice    |
 *
 * *unknown returns action "complete" with conceptId null — callers use existing
 * honest unknown lesson failure; Orchestrator does not invent concepts.
 *
 * Ready-to-advance (observable evidence only — not a mastery score):
 *   exposureCount >= 1
 *   AND attemptCount >= 1
 *   AND correctCount >= 1
 *   AND lastOutcome === "correct"
 *   AND hasRecallEvidence
 *
 * AI is never consulted.
 */

import type {
  LearningEvidence,
  LearnerConceptState,
} from "@/lib/learning/learner-state/types";
import type {
  KnowledgeOrchestratorDecision,
  KnowledgeOrchestratorInput,
  KnowledgeOrchestratorTrace,
} from "@/lib/learning/orchestrator/knowledge-loop/types";

export type ConceptEvidenceSummary = {
  conceptId: string;
  exposureCount: number;
  attemptCount: number;
  correctCount: number;
  incorrectCount: number;
  lastOutcome?: string;
  hasPracticeEvidence: boolean;
  hasCheckEvidence: boolean;
  hasRecallEvidence: boolean;
};

export function summarizeConceptEvidence(
  conceptId: string,
  state: LearnerConceptState | null | undefined,
  evidence: readonly LearningEvidence[],
): ConceptEvidenceSummary {
  const relevant = evidence.filter((e) => e.conceptId === conceptId);
  return {
    conceptId,
    exposureCount: state?.exposureCount ?? 0,
    attemptCount: state?.attemptCount ?? 0,
    correctCount: state?.correctCount ?? 0,
    incorrectCount: state?.incorrectCount ?? 0,
    lastOutcome: state?.lastOutcome,
    hasPracticeEvidence: relevant.some(
      (e) =>
        e.type === "practice_attempt" || e.type === "application_attempt",
    ),
    hasCheckEvidence: relevant.some(
      (e) =>
        e.type === "check_attempt" ||
        e.type === "explanation_attempt" ||
        e.type === "visualization_attempt",
    ),
    hasRecallEvidence: relevant.some((e) => e.type === "recall_result"),
  };
}

/** Observable readiness — not a mastery percentage. */
export function isConceptReadyToAdvance(
  summary: ConceptEvidenceSummary,
): boolean {
  return (
    summary.exposureCount >= 1 &&
    summary.attemptCount >= 1 &&
    summary.correctCount >= 1 &&
    summary.lastOutcome === "correct" &&
    summary.hasRecallEvidence
  );
}

function emptyTrace(target: string): KnowledgeOrchestratorTrace {
  return {
    target,
    focusConceptId: null,
    exposureCount: 0,
    attemptCount: 0,
    correctCount: 0,
    incorrectCount: 0,
    hasPracticeEvidence: false,
    hasCheckEvidence: false,
    hasRecallEvidence: false,
  };
}

function traceFromSummary(
  target: string,
  summary: ConceptEvidenceSummary,
  path?: { pathId?: string; pathConceptIds?: string[] },
): KnowledgeOrchestratorTrace {
  return {
    target,
    focusConceptId: summary.conceptId,
    pathId: path?.pathId,
    pathConceptIds: path?.pathConceptIds,
    exposureCount: summary.exposureCount,
    attemptCount: summary.attemptCount,
    correctCount: summary.correctCount,
    incorrectCount: summary.incorrectCount,
    lastOutcome: summary.lastOutcome,
    hasPracticeEvidence: summary.hasPracticeEvidence,
    hasCheckEvidence: summary.hasCheckEvidence,
    hasRecallEvidence: summary.hasRecallEvidence,
  };
}

/**
 * Pure deterministic decision. Does not read/write DB or mutate learner state.
 */
export function decideKnowledgeLoop(
  input: KnowledgeOrchestratorInput,
): KnowledgeOrchestratorDecision {
  const target = input.target.trim();

  if (!input.knowledge) {
    return {
      action: "complete",
      conceptId: null,
      reasonCode: "unknown-target",
      reason: "No Knowledge Library context for this target.",
      confidence: "high",
      trace: emptyTrace(target),
    };
  }

  const conceptIds = input.knowledge.concepts.map((c) => c.id);
  if (conceptIds.length === 0) {
    return {
      action: "complete",
      conceptId: null,
      reasonCode: "unknown-target",
      reason: "Knowledge context has no concepts.",
      confidence: "high",
      trace: emptyTrace(target),
    };
  }

  // Bundle D — any multi-concept teaching context is a path for progression.
  const pathMeta =
    conceptIds.length > 1 ||
    input.knowledge.resolution === "learning-path" ||
    input.knowledge.resolution === "general-retrieval"
      ? {
          pathId: input.knowledge.learningPathId,
          pathConceptIds: conceptIds,
        }
      : undefined;

  const summaries = conceptIds.map((id) =>
    summarizeConceptEvidence(
      id,
      input.statesByConceptId.get(id),
      input.evidence,
    ),
  );

  // Path focus: first concept not ready to advance; else last (all ready).
  let focusIndex = summaries.findIndex((s) => !isConceptReadyToAdvance(s));
  if (focusIndex < 0) focusIndex = summaries.length - 1;
  const focus = summaries[focusIndex]!;

  const nextConceptId =
    focusIndex + 1 < conceptIds.length ? conceptIds[focusIndex + 1]! : null;

  // Path advance signal: prior concept(s) ready, focus is the next untouched concept.
  if (
    focusIndex > 0 &&
    focus.exposureCount === 0 &&
    focus.attemptCount === 0 &&
    summaries.slice(0, focusIndex).every(isConceptReadyToAdvance)
  ) {
    const prior = summaries[focusIndex - 1]!;
    return {
      action: "advance",
      conceptId: prior.conceptId,
      nextConceptId: focus.conceptId,
      reasonCode: "ready-to-advance",
      reason: `Demonstrated required evidence for ${prior.conceptId}; advance to ${focus.conceptId}.`,
      confidence: "high",
      trace: traceFromSummary(target, prior, pathMeta),
    };
  }

  // --- Priority rules (on focus concept) ---

  // 1. New concept
  if (focus.exposureCount === 0 && focus.attemptCount === 0) {
    return {
      action: "teach",
      conceptId: focus.conceptId,
      reasonCode: "new-concept",
      reason: "No exposure or attempts yet — teach first.",
      confidence: "high",
      presentationHint: "foundational_definition",
      trace: traceFromSummary(target, focus, pathMeta),
    };
  }

  // 2. Recent incorrect → re-teach
  if (focus.lastOutcome === "incorrect") {
    return {
      action: "reteach",
      conceptId: focus.conceptId,
      reasonCode: "recent-incorrect",
      reason: "Last outcome was incorrect — re-teach with clarification.",
      confidence: "high",
      presentationHint: "misconception_contrast",
      trace: traceFromSummary(target, focus, pathMeta),
    };
  }

  // 3. Exposed but no practice/check attempts
  if (focus.exposureCount > 0 && focus.attemptCount === 0) {
    return {
      action: "practice",
      conceptId: focus.conceptId,
      reasonCode: "needs-practice",
      reason: "Concept introduced; practice is needed next.",
      confidence: "high",
      presentationHint: "application_emphasis",
      trace: traceFromSummary(target, focus, pathMeta),
    };
  }

  // 4. Has attempts but no recall evidence yet
  if (
    focus.attemptCount > 0 &&
    !focus.hasRecallEvidence &&
    focus.lastOutcome !== "incorrect"
  ) {
    return {
      action: "recall",
      conceptId: focus.conceptId,
      reasonCode: "needs-recall",
      reason: "Practice/check evidence exists; recall retention is next.",
      confidence: "medium",
      trace: traceFromSummary(target, focus, pathMeta),
    };
  }

  // 5. Ready to advance along path
  if (isConceptReadyToAdvance(focus)) {
    if (nextConceptId) {
      return {
        action: "advance",
        conceptId: focus.conceptId,
        nextConceptId,
        reasonCode: "ready-to-advance",
        reason: `Demonstrated required evidence for ${focus.conceptId}; next is ${nextConceptId}.`,
        confidence: "high",
        trace: traceFromSummary(target, focus, pathMeta),
      };
    }
    return {
      action: "complete",
      conceptId: focus.conceptId,
      nextConceptId: null,
      reasonCode: "no-next-concept",
      reason: "Demonstrated required evidence; no further path concept.",
      confidence: "high",
      trace: traceFromSummary(target, focus, pathMeta),
    };
  }

  // 6. Default — more practice/check
  return {
    action: "practice",
    conceptId: focus.conceptId,
    reasonCode:
      pathMeta && focusIndex > 0 ? "path-continue" : "needs-practice",
    reason: "More practice or check evidence is needed before advance.",
    confidence: "medium",
    presentationHint: "application_emphasis",
    trace: traceFromSummary(target, focus, pathMeta),
  };
}

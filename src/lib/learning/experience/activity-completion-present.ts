/**
 * 2P-25 — Activity completion / Adaptive return presentation (no evidence writes).
 */

import { LEARNING_ACTION_CONTINUE_LABEL } from "./learning-action";

export type ActivityCompletionPresentation = {
  headline: string;
  body: string;
  /** Opaque run id for navigation only — never show to learners. */
  adaptiveRunId: string | null;
  continueAdaptiveHref: string | null;
  continueAdaptiveLabel: string;
  growthCenterHref: string;
  hubHref: string;
  /** Explicit: this presenter never creates LearningAttempt / ConceptMastery. */
  createsEvidence: false;
};

export function presentActivityCompletion(input: {
  outcomeLabel?: string | null;
  adaptiveRunId?: string | null;
  notice?: string | null;
}): ActivityCompletionPresentation {
  const runId =
    typeof input.adaptiveRunId === "string" ? input.adaptiveRunId.trim() : "";
  const notice =
    typeof input.notice === "string" && input.notice.trim()
      ? `?notice=${encodeURIComponent(input.notice.trim())}`
      : "";
  const outcome =
    typeof input.outcomeLabel === "string" && input.outcomeLabel.trim()
      ? input.outcomeLabel.trim()
      : null;

  return {
    headline: outcome ? `Result: ${outcome}` : "Activity complete",
    body: runId
      ? "Study Haul recorded this attempt for your concept. Continue to see your next learning step."
      : "Study Haul recorded this attempt for your concept.",
    adaptiveRunId: runId || null,
    continueAdaptiveHref: runId
      ? `/study/adaptive/${runId}${notice}`
      : null,
    continueAdaptiveLabel: LEARNING_ACTION_CONTINUE_LABEL,
    growthCenterHref: "/study/learner-model",
    hubHref: "/study",
    createsEvidence: false,
  };
}

/** Concise learner-safe “why this activity” line. */
export function presentWhyThisActivity(input: {
  whyReason?: string | null;
  purpose?: string | null;
  conceptTitle?: string | null;
  /** 2P-28 — optional material provenance label (does not change diagnosis). */
  sourceProvenanceLabel?: string | null;
}): string | null {
  const why =
    (typeof input.whyReason === "string" && input.whyReason.trim()) ||
    (typeof input.purpose === "string" && input.purpose.trim()) ||
    "";
  const source =
    typeof input.sourceProvenanceLabel === "string"
      ? input.sourceProvenanceLabel.trim()
      : "";
  if (why) {
    return source ? `${why}\n\n${source}` : why;
  }
  const title =
    typeof input.conceptTitle === "string" ? input.conceptTitle.trim() : "";
  if (title) {
    const base = `Practice that builds skill with ${title}.`;
    return source ? `${base}\n\n${source}` : base;
  }
  return source || null;
}

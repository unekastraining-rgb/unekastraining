/**
 * Bundle E — Learner-facing copy for Six HOW + activity labels.
 * Never exposes internal reason codes (recent-incorrect, weak, mastered, …).
 */

import type { KnowledgeSixRecommendationApiView } from "@/lib/learning/orchestrator/knowledge-loop/types";
import type { KnowledgeLearningAction } from "@/lib/learning/orchestrator/knowledge-loop/types";

/** Friendly HOW line from Six technique — advisory presentation only. */
export function sixHowMessageForLearner(
  six: KnowledgeSixRecommendationApiView | null | undefined,
): string | null {
  if (!six?.technique) return null;
  const t = six.technique.toLowerCase();
  if (t.includes("detailed") || t.includes("explanation") || t.includes("chunk")) {
    return "Let's break this down more clearly.";
  }
  if (t.includes("hands") || t.includes("practice") || t.includes("coding")) {
    return "Let's apply this.";
  }
  if (t.includes("recall") || t.includes("active")) {
    return "Let's see what you remember without looking.";
  }
  if (t.includes("feynman")) {
    return "Let's explain this in your own words.";
  }
  if (t.includes("visual")) {
    return "Let's picture how this works.";
  }
  // Soft generic — do not dump reasonCode.
  return "Here's a helpful way to learn this next.";
}

/** Activity doing-label for the current Orchestrator action. */
export function activityDoingLabel(
  action: KnowledgeLearningAction | string | null | undefined,
): string {
  switch (action) {
    case "teach":
      return "Learning";
    case "reteach":
      return "Reviewing again";
    case "practice":
      return "Practicing";
    case "recall":
      return "Recalling";
    case "advance":
      return "Moving to the next concept";
    case "complete":
      return "Completed";
    default:
      return "Learning";
  }
}

/** Continue CTA label — consumes Orchestrator, does not re-decide. */
export function continueLabelForAction(
  action: KnowledgeLearningAction | string | null | undefined,
  fallback = "Continue",
): string {
  switch (action) {
    case "reteach":
      return "Reteach";
    case "practice":
      return "Practice";
    case "recall":
      return "Recall";
    case "advance":
      return "Next concept";
    case "complete":
      return "Done";
    case "teach":
      return "Continue";
    default:
      return fallback;
  }
}

/** Explicit disclaimer for path position UI. */
export const PATH_POSITION_DISCLAIMER =
  "Path position shows where you are in the sequence — not how many concepts you've mastered.";

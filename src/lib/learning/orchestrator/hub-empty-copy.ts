/**
 * Phase 2P-3 — Study Hub empty / fallback presentation copy.
 * Presentation only. Does not diagnose, recommend, or invent mastery.
 * Pass 4 — learner language (Suggested for you / Start Studying / Progress).
 */

export const HUB_ORCHESTRATOR_EMPTY_COPY = {
  /** Soft empty when Orchestrator has no presentable suggestion. */
  noSuggestionTitle: "Nothing personalized right now",
  noSuggestionBody:
    "When Study Haul notices something that may help, it shows up here. Until then, use Your Study Haul above, Start Studying, or open Progress.",
  loadingLabel: "Looking for a gentle next step…",
  /** Hierarchy label when a suggestion is present — aligns with Suggested for you. */
  whatNowEyebrow: "Suggested for you",
  whyEyebrow: "Why this may help",
  startErrorFallback:
    "That study path could not start. You can still use Practice, Quiz, Flashcards, or Start Studying.",
} as const;

export function hubOrchestratorEmptyIsSilent(renderedNull: boolean): boolean {
  return renderedNull;
}

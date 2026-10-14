/**
 * Phase 4B — Format LEARNER CONTEXT for the AI Teaching Engine prompt.
 * Separate from CANONICAL TARGET, KNOWLEDGE LIBRARY, and instructional source.
 */

import type { PersonalizedTeachingContext } from "@/lib/learning/personalized-teaching/types";

/**
 * Concise learner-context block for AI prompts.
 * Instructs adaptation of presentation only — no mastery claims.
 */
export function formatLearnerContextPromptBlock(
  ctx: PersonalizedTeachingContext,
): string {
  const lines: string[] = [
    "## LEARNER CONTEXT",
    "The learner has prior interaction with these concepts (evidence-backed counts).",
    "Use this information only to adapt instructional presentation.",
    "Do not claim mastery. Do not invent learner characteristics.",
    "Do not skip required conceptual foundations.",
    "Do not reveal internal learner-state metadata to the learner.",
    "Do not invent psychological labels or claim the learner has finished learning the concept.",
    "",
  ];

  for (const binding of ctx.conceptBindings.slice(0, 8)) {
    const p = binding.personalization;
    lines.push(`Concept: ${p.conceptId}`);
    lines.push(`Familiarity: ${p.familiarity}`);
    lines.push(`Prior exposures: ${p.priorExposure}`);
    lines.push(`Prior attempts: ${p.priorAttempts}`);
    lines.push(`Correct: ${p.correctAttempts}`);
    lines.push(`Incorrect: ${p.incorrectAttempts}`);
    if (p.lastOutcome) {
      lines.push(`Last outcome: ${p.lastOutcome}`);
    }
    if (p.presentationHints.length) {
      lines.push(`Presentation hints: ${p.presentationHints.join(", ")}`);
    }
    lines.push("");
  }

  return lines.join("\n").trim();
}

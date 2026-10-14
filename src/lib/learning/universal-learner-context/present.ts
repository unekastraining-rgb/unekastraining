/**
 * 2P-29 — Learner-facing presentation of Universal Learner Context.
 * Human language only — no diagnosis enums or DB ids.
 */

import type { UniversalLearnerContext } from "./types";

export type LearnerContextPresentation = {
  lines: string[];
  /** Creates no LearningAttempt. */
  createsEvidence: false;
};

export function presentUniversalLearnerContext(
  ctx: UniversalLearnerContext | null | undefined,
): LearnerContextPresentation {
  if (!ctx?.learnerId) {
    return { lines: [], createsEvidence: false };
  }

  const lines: string[] = [];

  if (ctx.learningSpace?.title?.trim()) {
    lines.push(
      `You're working in ${ctx.learningSpace.title.trim()}.`,
    );
  }

  if (ctx.material?.provenance?.label) {
    lines.push(ctx.material.provenance.label);
  }

  if (ctx.concept?.conceptTitle?.trim()) {
    const title = ctx.concept.conceptTitle.trim();
    const mastery = ctx.concept.mastery;
    if (mastery.status === "available") {
      lines.push(`You're building skill with ${title}.`);
    } else {
      lines.push(
        `Concept: ${title} — not enough practice evidence yet.`,
      );
    }
  }

  if (ctx.recentActivitySummary?.label) {
    lines.push(ctx.recentActivitySummary.label);
  }

  if (ctx.activeLearning?.runId) {
    lines.push("You have an active Adaptive study run you can continue.");
  }

  if (ctx.teachingStyle) {
    lines.push(`Teaching style: ${formatTeachingStyle(ctx.teachingStyle)}.`);
  }

  if (ctx.intent?.purpose) {
    lines.push(`Learning focus: ${formatPurpose(ctx.intent.purpose)}.`);
  }

  return { lines, createsEvidence: false };
}

function formatTeachingStyle(style: string): string {
  return style
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

function formatPurpose(purpose: string): string {
  return purpose
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

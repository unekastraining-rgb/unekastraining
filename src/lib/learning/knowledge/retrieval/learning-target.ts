/**
 * Phase 10 — Learning Target Understanding.
 * Extends Phase 7 normalization with activity, scope, preference, and ambiguity.
 * Does not invent interpretations for materially ambiguous requests.
 */

import type { InstructionalDomain } from "@/lib/learning/knowledge/instructional-library";
import {
  isProtectedSpecializedTopic,
  normalizeLearningTarget,
  stripTeachFraming,
} from "@/lib/learning/knowledge/retrieval/normalize-target";
import type { KnowledgeSourceKind } from "@/lib/learning/knowledge/retrieval/types";
import {
  detectTeachScope,
  type TeachScope,
} from "@/lib/learning/teach/scope";

export type { TeachScope };

export type LearningActivityIntent =
  | "teach"
  | "explain"
  | "practice"
  | "review"
  | "recall"
  | "apply";

export type LearningTargetResolution =
  | "resolved"
  | "needs-clarification"
  | "low-confidence"
  | "protected-specialized";

export type LearningTargetSourcePreference =
  | "knowledge-library"
  | "course-material"
  | "user-note"
  | "external"
  | "general"
  | "mixed";

/**
 * Phase 10 understanding result — additive over Phase 7 NormalizedLearningTarget.
 */
export type UnderstoodLearningTarget = {
  rawRequest: string;
  topic: string;
  slug: string;
  subject?: string;
  domain?: InstructionalDomain;
  concepts?: string[];
  activity: LearningActivityIntent;
  /** Bundle D — teach scope (focused / family / broad / …). */
  scope?: TeachScope | string;
  learnerLevel?: string;
  sourcePreference?: LearningTargetSourcePreference;
  resolution: LearningTargetResolution;
  clarificationPrompt?: string;
  /** Phase 7 compatibility fields. */
  normalizedTitle: string;
  original: string;
};

const PRACTICE_RE =
  /\b(practice|quiz|exercise|problems?|drill|apply|application|hands[- ]?on)\b/i;
const RECALL_RE =
  /\b(remember|recall|flashcard|review later|spaced|retain|memorize)\b/i;
const EXPLAIN_RE =
  /\b(explain(?:\s+why|\s+how)?|why does|why is|what does .+ mean)\b/i;
const REVIEW_RE = /\b(review|go over|recap|revise)\b/i;
const APPLY_RE = /\b(apply|use this|walk through|debug|fix)\b/i;

const NOTES_PREF =
  /\b(from my notes|using my notes|my notes|lecture notes)\b/i;
const COURSE_PREF =
  /\b(from my (course|textbook|pdf|material)|using my (course|textbook|chapter)|this chapter)\b/i;
const EXTERNAL_PREF = /\b(from the web|online sources|external sources)\b/i;

/**
 * Materially ambiguous requests that should not be silently interpreted.
 * Broad but teachable topics (e.g. "psychology") stay resolved.
 */
export function isMateriallyAmbiguousTopic(topic: string): boolean {
  const t = topic.trim().toLowerCase();
  if (!t) return true;
  // Multiple conflicting eras/domains without enough specificity.
  if (
    /\b(1900s|20th century)\b/.test(t) &&
    /\b(biblical|bible|scripture)\b/.test(t)
  ) {
    return true;
  }
  if (/\b(or|versus|vs\.?)\b/.test(t) && t.split(/\bor\b|\bversus\b|\bvs\.?\b/i).length >= 2) {
    const parts = t.split(/\bor\b|\bversus\b|\bvs\.?\b/i).map((p) => p.trim());
    if (parts.filter((p) => p.length > 2).length >= 2) return true;
  }
  // Extremely vague single tokens that aren't known subjects.
  if (/^(stuff|things|this|that|it|something|whatever)$/i.test(t)) return true;
  return false;
}

export function detectLearningActivity(raw: string): LearningActivityIntent {
  const s = raw.trim();
  if (RECALL_RE.test(s) && !PRACTICE_RE.test(s)) return "recall";
  if (PRACTICE_RE.test(s)) return "practice";
  if (APPLY_RE.test(s)) return "apply";
  if (REVIEW_RE.test(s) && !EXPLAIN_RE.test(s)) return "review";
  if (EXPLAIN_RE.test(s)) return "explain";
  return "teach";
}

export function detectSourcePreference(
  raw: string,
): LearningTargetSourcePreference | undefined {
  if (NOTES_PREF.test(raw)) return "user-note";
  if (COURSE_PREF.test(raw)) return "course-material";
  if (EXTERNAL_PREF.test(raw)) return "external";
  if (/\bmixed\b|\bboth\b/i.test(raw)) return "mixed";
  return undefined;
}

/**
 * Strip activity / source-preference framing so the topic is teachable.
 * Phase 7 stripTeachFraming remains the base; this is additive.
 */
export function stripActivityFraming(raw: string): string {
  let t = stripTeachFraming(raw);
  t = t.replace(
    /^(?:give\s+me|i\s+need|i\s+want)\s+(?:some\s+)?(?:practice\s+)?(?:problems?|exercises?|quizzes?|flashcards?)\s+(?:on|for|about)\s+/i,
    "",
  );
  t = t.replace(
    /^(?:practice|quiz|drill|review|recall|remember|apply|explain)\s+(?:problems?\s+)?(?:on|for|about|why|how)?\s*/i,
    "",
  );
  t = t.replace(
    /^(?:help\s+me\s+)?(?:remember|recall|review|practice)\s+/i,
    "",
  );
  t = t.replace(/\bfrom\s+my\s+(?:notes|course|textbook|pdf|material)\b/gi, "");
  t = t.replace(/\busing\s+my\s+(?:notes|course|textbook|chapter)\b/gi, "");
  t = t.replace(/\s+/g, " ").replace(/[.?!]+$/g, "").trim();
  return t || stripTeachFraming(raw);
}

/**
 * Understand a free-form learning request.
 * Preserves Phase 7 normalization; adds activity / ambiguity / preference.
 */
export function understandLearningTarget(
  raw: string,
): UnderstoodLearningTarget | null {
  const original = raw.trim();
  if (!original) return null;

  const activity = detectLearningActivity(original);
  const sourcePreference = detectSourcePreference(original);
  const topicCandidate = stripActivityFraming(original);

  if (
    isProtectedSpecializedTopic(original) ||
    isProtectedSpecializedTopic(topicCandidate)
  ) {
    const n = normalizeLearningTarget(topicCandidate) ??
      normalizeLearningTarget(original);
    return {
      rawRequest: original,
      topic: n?.normalizedTitle ?? topicCandidate,
      slug: n?.slug ?? "protected",
      subject: n?.subject,
      domain: n?.domain,
      activity,
      learnerLevel: n?.requestedLevel,
      sourcePreference,
      resolution: "protected-specialized",
      normalizedTitle: n?.normalizedTitle ?? topicCandidate,
      original,
    };
  }

  const base =
    normalizeLearningTarget(topicCandidate) ??
    normalizeLearningTarget(original);
  if (!base) return null;

  const ambiguous = isMateriallyAmbiguousTopic(base.normalizedTitle);

  if (ambiguous) {
    return {
      rawRequest: original,
      topic: base.normalizedTitle,
      slug: base.slug,
      subject: base.subject,
      domain: base.domain,
      activity,
      learnerLevel: base.requestedLevel,
      sourcePreference,
      resolution: "needs-clarification",
      clarificationPrompt:
        "That request could mean more than one topic. Which specific subject or era should we teach first?",
      normalizedTitle: base.normalizedTitle,
      original: base.original,
    };
  }

  const partial = {
    rawRequest: original,
    topic: base.normalizedTitle,
    slug: base.slug,
    subject: base.subject,
    domain: base.domain,
    activity,
    learnerLevel: base.requestedLevel,
    sourcePreference,
    resolution: "resolved" as const,
    normalizedTitle: base.normalizedTitle,
    original: base.original,
  };

  return {
    ...partial,
    // Bundle D — scope from activity + topic shape (not a second activity router).
    scope: detectTeachScope(partial),
  };
}

/** Map activity intent toward Knowledge Loop actions (hint only — not a decision). */
export function activityToOrchestratorHint(
  activity: LearningActivityIntent,
): "teach" | "practice" | "recall" | "reteach" {
  switch (activity) {
    case "practice":
    case "apply":
      return "practice";
    case "recall":
    case "review":
      return "recall";
    case "explain":
      return "teach";
    default:
      return "teach";
  }
}

export function sourcePreferenceToKinds(
  pref?: LearningTargetSourcePreference,
): KnowledgeSourceKind[] | undefined {
  if (!pref) return undefined;
  switch (pref) {
    case "knowledge-library":
      return ["knowledge-library"];
    case "course-material":
      return ["course-material"];
    case "user-note":
      return ["user-note"];
    case "external":
      return ["retrieved-web"];
    case "general":
      return ["general-ai"];
    case "mixed":
      return ["combined"];
  }
}

/**
 * Bundle D — Teach scope detection.
 * Distinguishes focused concepts from concept families and broad subjects.
 * Does not invent a second activity router — activity still comes from Learning Target.
 */

import type {
  LearningActivityIntent,
  UnderstoodLearningTarget,
} from "@/lib/learning/knowledge/retrieval/learning-target";

export type TeachScope =
  | "focused-concept"
  | "concept-family"
  | "broad-subject"
  | "course-section"
  | "review";

/** Disciplines that should open an introductory sequence, not one definition. */
const BROAD_SUBJECTS = new Set([
  "psychology",
  "biology",
  "history",
  "chemistry",
  "sociology",
  "anatomy",
  "calculus",
  "physics",
  "philosophy",
  "astronomy",
  "geology",
  "anthropology",
  "linguistics",
  "statistics",
  "economics",
  "algebra",
  "marketing",
  "business",
  "accounting",
  "finance",
  "management",
  "programming",
  "computer science",
  "java",
  "python",
  "sql",
]);

const CHAPTER_RE =
  /\b(?:chapter|unit|module|section|week)\s+\d+\b/i;

/**
 * Detect teach scope from an understood learning target.
 * Activity distinctions (quiz/practice/recall) remain authoritative.
 */
export function detectTeachScope(
  understood: Pick<
    UnderstoodLearningTarget,
    "activity" | "topic" | "rawRequest" | "normalizedTitle"
  >,
): TeachScope {
  const activity = understood.activity;
  const topic = (understood.topic || understood.normalizedTitle || "")
    .trim()
    .toLowerCase();
  const raw = understood.rawRequest.trim().toLowerCase();

  if (activity === "review" || activity === "recall") return "review";
  if (CHAPTER_RE.test(raw) || CHAPTER_RE.test(topic)) return "course-section";

  if (activity === "explain" || activity === "practice" || activity === "apply") {
    return "focused-concept";
  }

  if (activity === "teach") {
    if (isBroadSubjectTopic(topic)) return "broad-subject";
    // Intro framing → structured multi-concept teaching.
    if (/\bintro(?:duction)?\s+to\b/i.test(raw)) return "concept-family";
    if (isLikelyAtomicTeachTopic(topic, raw)) return "focused-concept";
    return "concept-family";
  }

  return "focused-concept";
}

export function isBroadSubjectTopic(topic: string): boolean {
  const t = topic.trim().toLowerCase().replace(/[.?!]+$/g, "");
  if (!t) return false;
  if (BROAD_SUBJECTS.has(t)) return true;
  // "intro to psychology" / "introduction to biology"
  const intro = t.replace(/^intro(?:duction)?\s+to\s+/i, "").trim();
  if (intro !== t && BROAD_SUBJECTS.has(intro)) return true;
  return false;
}

/**
 * Very specific single-mechanism requests that should not balloon into a course.
 * Teach still defaults to concept-family; this is the narrow exception.
 */
function isLikelyAtomicTeachTopic(topic: string, raw: string): boolean {
  // "the X of Y" with a short X (e.g. "the 4 Ps of marketing" as explain-like teach)
  if (/\bthe\s+\d+\s*[a-z]s?\s+of\b/i.test(raw)) return true;
  const tokens = topic
    .split(/[^a-z0-9]+/i)
    .map((x) => x.trim())
    .filter((x) => x.length >= 2);
  // Single highly specific token that isn't a broad subject.
  if (tokens.length === 1 && !BROAD_SUBJECTS.has(tokens[0]!.toLowerCase())) {
    // mitochondria, polymorphism, elasticity — still often deserve a short family;
    // only treat as atomic when the user said "explain" (handled above) or
    // used a pinpoint phrasing.
    return /\bjust\b|\bonly\b|\bbriefly\b|\bquick\b/i.test(raw);
  }
  return false;
}

/** Minimum concepts expected for a teach path at this scope (soft floor). */
export function minConceptsForTeachScope(scope: TeachScope): number {
  switch (scope) {
    case "broad-subject":
      return 4;
    case "concept-family":
      return 3;
    case "course-section":
      return 3;
    case "review":
      return 1;
    case "focused-concept":
    default:
      return 1;
  }
}

/** Whether this activity should expand into a multi-concept teach path. */
export function shouldExpandTeachPath(
  activity: LearningActivityIntent,
  scope: TeachScope,
): boolean {
  if (activity !== "teach") return false;
  return (
    scope === "concept-family" ||
    scope === "broad-subject" ||
    scope === "course-section"
  );
}

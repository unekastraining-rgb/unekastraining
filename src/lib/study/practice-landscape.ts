/**
 * Pass 3 — Learner-facing Practice landscape (presentation only).
 * Reuses ADAPTIVE_READY_ACTIVITY_KEYS + intervention capability metadata.
 * Does not create a second activity registry or evidence path.
 */

import { ADAPTIVE_READY_ACTIVITY_KEYS } from "@/lib/learning/decision-loop";
import { getActivityInterventionCapability } from "@/lib/learning/orchestrator/activity-intervention-capability";
import { withLearningFocus } from "@/lib/study/learning-focus";
import { withColdStartTopic, withCourseContext } from "@/lib/study/loop-hrefs";

export type PracticeLandscapeItem = {
  /** Stable id for tests / keys */
  id: string;
  /** Universal activity kind, or null for SIX hands-on */
  activityKey: (typeof ADAPTIVE_READY_ACTIVITY_KEYS)[number] | null;
  learnerTitle: string;
  description: string;
  /** Soft topic-match hints from capability registry (empty = always general) */
  contextHints: readonly string[];
};

/** Short “what will I do?” copy — additive presentation, not a new engine. */
const PRACTICE_DESCRIPTIONS: Record<
  (typeof ADAPTIVE_READY_ACTIVITY_KEYS)[number],
  string
> = {
  coding: "Write and test code for this idea.",
  sql: "Write and check SQL queries.",
  math: "Solve problems in a guided math workspace.",
  networking: "Troubleshoot a network scenario or topology.",
  language: "Practice speaking, listening, or conversation.",
  lab: "Complete a structured hands-on lab.",
  simulation: "Work through a realistic scenario.",
  presentation: "Practice presenting or explaining out loud.",
  writing: "Write a response and get structured feedback.",
  game: "Learn through a short learning game.",
  project: "Build a small project that applies the idea.",
};

const HANDS_ON: PracticeLandscapeItem = {
  id: "six-hands-on",
  activityKey: null,
  learnerTitle: "Hands-on Practice",
  description: "Apply the idea to a small worked problem, then try one yourself.",
  contextHints: [],
};

/**
 * All practice options that actually exist in the product today.
 * UML and other unimplemented kinds are intentionally absent.
 */
export function listSupportedPracticeLandscape(): PracticeLandscapeItem[] {
  const universal: PracticeLandscapeItem[] = ADAPTIVE_READY_ACTIVITY_KEYS.map(
    (key) => {
      const cap = getActivityInterventionCapability(key);
      return {
        id: key,
        activityKey: key,
        learnerTitle: cap?.learnerTitle ?? key,
        description: PRACTICE_DESCRIPTIONS[key],
        contextHints: cap?.contextHints ?? [],
      };
    },
  );
  return [HANDS_ON, ...universal];
}

/** Soft topic/course match — never hides unsupported-looking options. */
export function scorePracticeForContext(
  item: PracticeLandscapeItem,
  topicOrCourse?: string | null,
): number {
  const hay = (topicOrCourse ?? "").toLowerCase();
  if (!hay.trim() || item.contextHints.length === 0) return 0;
  let score = 0;
  for (const hint of item.contextHints) {
    if (hay.includes(hint.toLowerCase())) score += 1;
  }
  return score;
}

/**
 * Prefer landscape items that align with Knowledge Library practiceForms.
 * Additive boost — does not invent unsupported activity kinds.
 */
export function scorePracticeForConceptForms(
  item: PracticeLandscapeItem,
  practiceForms?: readonly string[] | null,
): number {
  if (!practiceForms?.length) return 0;
  const forms = practiceForms.map((f) => f.toLowerCase());
  let score = 0;
  if (item.activityKey === "coding" && forms.some((f) => /code|debug|implement/.test(f))) {
    score += 3;
  }
  if (item.activityKey === "sql" && forms.some((f) => /sql|query|schema|join/.test(f))) {
    score += 3;
  }
  if (item.activityKey === "math" && forms.some((f) => /solve|compute|graph|calculate/.test(f))) {
    score += 3;
  }
  if (
    item.id === "six-hands-on" &&
    forms.some((f) => /explain|scenario|apply|identify|predict|compare/.test(f))
  ) {
    score += 2;
  }
  return score;
}

export function orderPracticeForContext(
  items: readonly PracticeLandscapeItem[],
  topicOrCourse?: string | null,
  practiceForms?: readonly string[] | null,
): {
  suggested: PracticeLandscapeItem[];
  more: PracticeLandscapeItem[];
} {
  const scored = items.map((item) => ({
    item,
    score:
      scorePracticeForContext(item, topicOrCourse) +
      scorePracticeForConceptForms(item, practiceForms),
  }));
  const suggested = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.item);
  const suggestedIds = new Set(suggested.map((s) => s.id));
  const more = scored
    .filter((s) => !suggestedIds.has(s.item.id))
    .map((s) => s.item);
  return { suggested, more };
}

/**
 * Pick the practice experience for the current instructional context.
 * Specialized activity when hints match; otherwise SIX hands-on.
 * Learner never chooses from a capability catalog (SQL / Math / Network…).
 */
export function resolveContextualPractice(
  topicOrCourse?: string | null,
  practiceForms?: readonly string[] | null,
): PracticeLandscapeItem {
  const all = listSupportedPracticeLandscape();
  const handsOn =
    all.find((item) => item.id === "six-hands-on") ?? HANDS_ON;
  const { suggested } = orderPracticeForContext(
    all,
    topicOrCourse,
    practiceForms,
  );
  const specialized = suggested.find((item) => item.activityKey != null);
  return specialized ?? handsOn;
}

/**
 * Learner-facing practice choices for a scoped topic — matched only.
 * Never returns the full Adaptive-ready catalog as a menu.
 */
export function listContextualPracticeChoices(
  topicOrCourse?: string | null,
  practiceForms?: readonly string[] | null,
): PracticeLandscapeItem[] {
  const all = listSupportedPracticeLandscape();
  const handsOn =
    all.find((item) => item.id === "six-hands-on") ?? HANDS_ON;
  const hay = (topicOrCourse ?? "").trim();
  if (!hay && !practiceForms?.length) return [handsOn];
  const { suggested } = orderPracticeForContext(all, hay, practiceForms);
  const specialized = suggested.filter((item) => item.activityKey != null);
  if (specialized.length === 0) return [handsOn];
  // Top match only — Study Haul picks; learner practices the topic.
  return [specialized[0]!, handsOn].filter(
    (item, index, arr) => arr.findIndex((x) => x.id === item.id) === index,
  );
}

export function buildPracticeItemHref(
  item: PracticeLandscapeItem,
  ctx: {
    courseId?: string | null;
    topic?: string | null;
    materialId?: string | null;
    conceptId?: string | null;
  },
): string {
  const courseId = ctx.courseId?.trim() || null;
  const topic = ctx.topic?.trim() || null;
  const materialId = ctx.materialId?.trim() || null;
  const conceptId = ctx.conceptId?.trim() || null;

  if (item.activityKey) {
    const params = new URLSearchParams();
    if (courseId) params.set("courseId", courseId);
    if (topic) params.set("topic", topic);
    if (materialId) params.set("materialId", materialId);
    if (conceptId) params.set("conceptId", conceptId);
    const qs = params.toString();
    return `/study/activities/${item.activityKey}${qs ? `?${qs}` : ""}`;
  }

  // SIX hands-on — preserve course/topic/material context
  let href = `/study/six/hands-on-practice?focus=practice`;
  href = withCourseContext(href, courseId);
  href = withColdStartTopic(href, topic);
  if (materialId && !href.includes("materialId=")) {
    href = `${href}${href.includes("?") ? "&" : "?"}materialId=${encodeURIComponent(materialId)}`;
  }
  if (conceptId && !href.includes("conceptId=")) {
    href = `${href}${href.includes("?") ? "&" : "?"}conceptId=${encodeURIComponent(conceptId)}`;
  }
  return withLearningFocus(href, "practice");
}

/** Known unimplemented practice kinds — must never appear in the landscape. */
export const UNSUPPORTED_PRACTICE_KINDS = ["uml"] as const;

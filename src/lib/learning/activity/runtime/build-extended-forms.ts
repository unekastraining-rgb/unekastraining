/**
 * Bundle J — Extended interactive forms from authored KL fields only.
 * true/false, multi-select, matching — no fabricated content.
 */

import { findInstructionalConceptById } from "@/lib/learning/knowledge/instructional-library";
import type {
  InteractiveActivity,
  InteractiveForm,
} from "@/lib/learning/activity/runtime/types";

function firstMisconception(concept: {
  misconceptionDetails?: Array<{
    misconception: string;
    correction?: string;
    contrast?: string;
  }>;
  misconception?: string;
  misconceptions?: string[];
}): InteractiveActivity["authoredMisconception"] | undefined {
  const d = concept.misconceptionDetails?.[0];
  if (d?.misconception) {
    return {
      misconception: d.misconception,
      correction: d.correction,
      contrast: d.contrast,
    };
  }
  const m = concept.misconception ?? concept.misconceptions?.[0];
  if (m) return { misconception: m };
  return undefined;
}

/**
 * True/false from authored misconception claim (correct = False).
 */
export function buildTrueFalseFromConcept(
  conceptId: string,
): InteractiveActivity | null {
  const hit = findInstructionalConceptById(conceptId);
  if (!hit) return null;
  const c = hit.concept;
  const claim =
    c.misconceptionDetails?.[0]?.misconception ??
    c.misconception ??
    c.misconceptions?.[0];
  if (!claim?.trim()) return null;

  return {
    id: `${c.id}:true-false`,
    conceptId: c.id,
    conceptTitle: c.title,
    subject: hit.pack.subject,
    domain: hit.pack.domain,
    form: "true_false",
    activityType: "practice",
    prompt: `True or false?\n\n“${claim.trim()}”`,
    label: "True / False",
    choices: ["True", "False"],
    correctIndex: 1,
    relatedConceptIds: (c.relatedConcepts ?? []).slice(0, 4),
    authoredMisconception: firstMisconception(c),
    revealAnswerPolicy: "never_auto",
  };
}

/**
 * Multi-select: select all related concept titles (authored relatedConcepts).
 */
export function buildMultiSelectFromConcept(
  conceptId: string,
): InteractiveActivity | null {
  const hit = findInstructionalConceptById(conceptId);
  if (!hit) return null;
  const c = hit.concept;
  const related = (c.relatedConcepts ?? [])
    .map((id) => findInstructionalConceptById(id)?.concept.title)
    .filter((t): t is string => Boolean(t));
  if (related.length < 2) return null;

  const distractors = (c.nonExamples ?? [])
    .map((n) => (n.length > 60 ? `${n.slice(0, 50)}…` : n))
    .filter(Boolean)
    .slice(0, 2);
  if (distractors.length < 1) distractors.push("An unrelated study tip");

  const correctChoices = related.slice(0, 3);
  const choices = [...correctChoices, ...distractors].slice(0, 5);
  const correctIndices = choices
    .map((ch, i) => (correctChoices.includes(ch) ? i : -1))
    .filter((i) => i >= 0);

  return {
    id: `${c.id}:multi-select`,
    conceptId: c.id,
    conceptTitle: c.title,
    subject: hit.pack.subject,
    domain: hit.pack.domain,
    form: "multi_select",
    activityType: "practice",
    prompt: `Select all ideas that connect to ${c.title}.`,
    label: "Multi-select",
    choices,
    correctIndices,
    relatedConceptIds: (c.relatedConcepts ?? []).slice(0, 6),
    authoredMisconception: firstMisconception(c),
    revealAnswerPolicy: "never_auto",
  };
}

/**
 * Matching: concept titles ↔ authored definitions (primary + related).
 */
export function buildMatchingFromConcept(
  conceptId: string,
): InteractiveActivity | null {
  const hit = findInstructionalConceptById(conceptId);
  if (!hit) return null;
  const c = hit.concept;
  const pairs: Array<{ left: string; right: string; id: string }> = [];

  if (c.definition?.trim()) {
    pairs.push({
      left: c.title,
      right: c.definition.trim().slice(0, 120),
      id: c.id,
    });
  }
  for (const rid of (c.relatedConcepts ?? []).slice(0, 3)) {
    const other = findInstructionalConceptById(rid)?.concept;
    if (!other?.definition?.trim()) continue;
    pairs.push({
      left: other.title,
      right: other.definition.trim().slice(0, 120),
      id: other.id,
    });
  }
  if (pairs.length < 2) return null;

  const matchLeft = pairs.map((p) => p.left);
  const matchRight = [...pairs.map((p) => p.right)];
  for (let i = matchRight.length - 1; i > 0; i--) {
    let h = 0;
    const seed = `${c.id}:match:${i}`;
    for (let k = 0; k < seed.length; k++) h = (h * 31 + seed.charCodeAt(k)) | 0;
    const j = Math.abs(h) % (i + 1);
    const tmp = matchRight[i]!;
    matchRight[i] = matchRight[j]!;
    matchRight[j] = tmp;
  }

  const matchAnswer: Record<string, string> = {};
  for (const p of pairs) matchAnswer[p.left] = p.right;

  return {
    id: `${c.id}:matching`,
    conceptId: c.id,
    conceptTitle: c.title,
    subject: hit.pack.subject,
    domain: hit.pack.domain,
    form: "matching",
    activityType: "practice",
    prompt: `Match each idea to its definition.`,
    label: "Matching",
    matchLeft,
    matchRight,
    matchAnswer,
    relatedConceptIds: pairs.map((p) => p.id),
    authoredMisconception: firstMisconception(c),
    revealAnswerPolicy: "never_auto",
  };
}

export function buildExtendedInteractiveForm(
  conceptId: string,
  preferredForm: InteractiveForm,
): InteractiveActivity | null {
  if (preferredForm === "true_false") {
    return buildTrueFalseFromConcept(conceptId);
  }
  if (preferredForm === "multi_select") {
    return buildMultiSelectFromConcept(conceptId);
  }
  if (preferredForm === "matching") {
    return buildMatchingFromConcept(conceptId);
  }
  return null;
}

/**
 * Bundle G — Enrich SixWorkedLesson for Learning Studio depth.
 * Additive post-processing on existing payloads — no second teaching engine.
 */

import type { SixComponent } from "@/lib/csl/six";
import type { SixWorkedLesson } from "@/lib/csl/six-worked-lesson";
import type {
  InstructionalConceptKnowledge,
  InstructionalDomain,
} from "@/lib/learning/knowledge/instructional-library";
import type { TeachScope } from "@/lib/learning/teach/scope";
import { deepenConceptToChunks } from "@/lib/learning/studio/deepen-concept";
import { buildConceptRelationshipMap } from "@/lib/learning/studio/deepen-concept";

export type EnrichLessonStudioInput = {
  lesson: SixWorkedLesson;
  scope: TeachScope;
  /** Focused concept when path was collapsed to one unit. */
  focusConcept?: InstructionalConceptKnowledge | null;
  pathTitles?: string[];
  pathIndex?: number;
  domain?: InstructionalDomain;
  /** When true, expand thin single-chunk lessons into depth sections. */
  deepenIfThin?: boolean;
};

function lessonLooksThin(lesson: SixWorkedLesson): boolean {
  if (lesson.chunks.length <= 1) return true;
  if (lesson.chunks.length <= 2) {
    const totalChars = lesson.chunks.reduce(
      (n, c) => n + c.explanation.length + (c.example?.length ?? 0),
      0,
    );
    return totalChars < 600;
  }
  return false;
}

function ensureTransferPracticePrompt(
  lesson: SixWorkedLesson,
  conceptTitle: string,
  focusConcept?: InstructionalConceptKnowledge | null,
): SixWorkedLesson {
  const hasTransfer = lesson.practicePrompts.some((p) =>
    /transfer|new situation/i.test(`${p.title} ${p.prompt}`),
  );
  if (hasTransfer) return lesson;

  const authoredTransfer = focusConcept?.transferPrompts?.[0];
  const transfer = {
    title: "Transfer",
    prompt:
      authoredTransfer ??
      `New situation (the concept is not named for you): A decision-maker faces a choice that looks different from the lesson example. Identify which idea from “${conceptTitle}” should guide the decision, and justify how you would apply it.`,
    tip: "Do not only restate the definition — show the transfer.",
  };
  const forms = focusConcept?.practiceForms ?? [];
  const recognize = {
    title: "Recognize",
    prompt: forms.includes("identify") || forms.includes("recognize")
      ? `Which example best matches “${conceptTitle}”? Explain why the others do not.`
      : `Which of these best matches “${conceptTitle}”? Explain why the others do not.`,
    tip: "Use the distinction from the misconception contrast.",
  };
  const prompts = [...lesson.practicePrompts];
  if (!prompts.some((p) => /recogn/i.test(p.title))) {
    prompts.unshift(recognize);
  }
  prompts.push(transfer);
  return {
    ...lesson,
    practicePrompts: prompts.slice(0, 4),
  };
}

function injectRelationshipVisual(
  lesson: SixWorkedLesson,
  pathTitles: string[],
  pathIndex: number,
  focusConcept?: InstructionalConceptKnowledge | null,
): SixWorkedLesson {
  if (pathTitles.length < 2) return lesson;
  const map = buildConceptRelationshipMap({
    conceptTitles: pathTitles,
    currentIndex: pathIndex,
    prerequisites: focusConcept?.prerequisites,
    relatedTitles: focusConcept?.relatedConcepts?.slice(0, 3),
  });
  const chunks = lesson.chunks.map((c, i) => {
    if (c.representation?.trim()) return c;
    // Inject on first visualize/concept chunk
    if (
      i === 0 ||
      c.role === "visualize" ||
      c.role === "concept" ||
      /connect/i.test(c.title)
    ) {
      return { ...c, representation: map.visual };
    }
    return c;
  });
  return { ...lesson, chunks };
}

/**
 * Enrich a generated or library lesson for Studio instructional depth.
 */
export function enrichLessonForStudio(
  input: EnrichLessonStudioInput,
): SixWorkedLesson {
  let lesson = input.lesson;
  const conceptTitle =
    input.focusConcept?.title ??
    lesson.chunks[0]?.title ??
    lesson.topic;
  const deepen =
    input.deepenIfThin !== false &&
    input.focusConcept &&
    lessonLooksThin(lesson);

  if (deepen && input.focusConcept) {
    const chunks = deepenConceptToChunks({
      concept: input.focusConcept,
      scope: input.scope,
      pathTitles: input.pathTitles,
      pathIndex: input.pathIndex,
      domain: input.domain,
    });
    lesson = {
      ...lesson,
      learningFrame:
        lesson.learningFrame ||
        `By the end, you should understand, recognize, apply, and transfer ${conceptTitle}.`,
      roadmap: chunks.map((c) => c.title),
      chunks,
      cheatSheet:
        lesson.cheatSheet ||
        (input.pathTitles && input.pathTitles.length > 1
          ? input.pathTitles.join(" → ")
          : chunks.map((c) => c.title).join(" → ")),
    };
  }

  lesson = injectRelationshipVisual(
    lesson,
    input.pathTitles ?? [],
    input.pathIndex ?? 0,
    input.focusConcept,
  );
  lesson = ensureTransferPracticePrompt(
    lesson,
    conceptTitle,
    input.focusConcept,
  );
  return lesson;
}

/** Helper for pack adapter: build a deepened lesson from one concept. */
export function lessonFromDeepenedConcept(input: {
  component: SixComponent;
  topic: string;
  concept: InstructionalConceptKnowledge;
  scope: TeachScope;
  pathTitles?: string[];
  pathIndex?: number;
  domain?: InstructionalDomain;
  learningFrame?: string;
  cheatSheet?: string;
}): SixWorkedLesson {
  const chunks = deepenConceptToChunks({
    concept: input.concept,
    scope: input.scope,
    pathTitles: input.pathTitles,
    pathIndex: input.pathIndex,
    domain: input.domain,
  });
  const base: SixWorkedLesson = {
    component: input.component,
    topic: input.topic,
    learningFrame:
      input.learningFrame ??
      `By the end, you should understand, recognize, apply, and transfer ${input.concept.title}.`,
    roadmap: chunks.map((c) => c.title),
    chunks,
    cheatSheet:
      input.cheatSheet ??
      (input.pathTitles && input.pathTitles.length > 1
        ? input.pathTitles.join(" → ")
        : chunks.map((c) => c.title).join(" → ")),
    practicePrompts: [],
  };
  return enrichLessonForStudio({
    lesson: base,
    scope: input.scope,
    focusConcept: input.concept,
    pathTitles: input.pathTitles,
    pathIndex: input.pathIndex,
    domain: input.domain,
    deepenIfThin: false,
  });
}

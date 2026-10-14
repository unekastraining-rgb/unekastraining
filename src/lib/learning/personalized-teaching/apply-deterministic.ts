/**
 * Phase 4B — Apply personalization to deterministic Knowledge Library lessons.
 *
 * Adjusts presentation only. Same underlying knowledge; no new architecture.
 * Does not touch specialized OOD lessons (caller must skip those).
 */

import type { SixWorkedLesson } from "@/lib/csl/six-worked-lesson";
import type { PersonalizedTeachingContext } from "@/lib/learning/personalized-teaching/types";

function frameForFamiliarity(
  familiarity: string,
  base: string,
  hasIncorrect: boolean,
): string {
  let frame = base.trim();
  switch (familiarity) {
    case "unseen":
      if (!/foundation|first look|start with/i.test(frame)) {
        frame = `Start with a clear foundation for this concept. ${frame}`;
      }
      break;
    case "introduced":
      frame = `Brief recap, then move into application. ${frame}`;
      break;
    case "practiced":
      frame = `Emphasize application and worked use — less redundant definition. ${frame}`;
      break;
    case "repeated":
      frame = `Reduce unnecessary repetition; focus on application and contrast. ${frame}`;
      break;
  }
  if (hasIncorrect) {
    frame = `${frame} Clarify common misconceptions with contrasting examples.`;
  }
  return frame;
}

/**
 * Light presentation adaptation for library-derived lessons.
 * Returns a new lesson object; does not mutate knowledge packs.
 */
export function applyPersonalizationToLibraryLesson(
  lesson: SixWorkedLesson,
  personalized: PersonalizedTeachingContext | null | undefined,
  options?: {
    /** Phase 5 — Orchestrator reteach: emphasize misconception contrast. */
    reteachEmphasis?: boolean;
  },
): SixWorkedLesson {
  if (!personalized || personalized.conceptBindings.length === 0) {
    return lesson;
  }

  const primary = personalized.primary;
  const hasIncorrect =
    options?.reteachEmphasis ||
    personalized.conceptBindings.some(
      (b) => b.personalization.incorrectAttempts > 0,
    );

  const learningFrame = frameForFamiliarity(
    primary.familiarity,
    lesson.learningFrame,
    hasIncorrect,
  );

  const emphasizeMisconception =
    hasIncorrect ||
    primary.presentationHints.includes("misconception_contrast");

  const emphasizeApplication =
    primary.presentationHints.includes("application_emphasis") ||
    primary.familiarity === "practiced" ||
    primary.familiarity === "repeated";

  // Rotate which misconception/example surfaces on reteach so the same
  // lesson structure is not repeated verbatim after incorrect evidence.
  const variationSeed =
    primary.incorrectAttempts + (options?.reteachEmphasis ? 1 : 0);

  const chunks = lesson.chunks.map((chunk, index) => {
    let explanation = chunk.explanation;
    let misconception = chunk.misconception;
    let example = chunk.example;

    const concept =
      personalized.knowledge.concepts[index] ??
      personalized.knowledge.primaryConcept ??
      null;

    if (emphasizeMisconception && concept) {
      const missPool = [
        ...(concept.misconceptions ?? []),
        ...(concept.misconception ? [concept.misconception] : []),
        ...(concept.nonExamples ?? []),
        ...(concept.nonExample ? [concept.nonExample] : []),
      ].filter(Boolean);
      if (missPool.length > 0) {
        misconception =
          missPool[variationSeed % missPool.length] ?? misconception;
      }
    }

    if (
      options?.reteachEmphasis &&
      concept &&
      (concept.examples?.length || concept.example)
    ) {
      const exPool = [
        ...(concept.examples ?? []),
        ...(concept.example ? [concept.example] : []),
        ...(concept.workedExamples ?? []),
      ].filter(Boolean);
      if (exPool.length > 1) {
        example = exPool[(variationSeed + 1) % exPool.length] ?? example;
      }
    }

    if (
      emphasizeMisconception &&
      misconception &&
      !/common mistake|misconception|contrast/i.test(explanation)
    ) {
      explanation = options?.reteachEmphasis
        ? `${explanation} Let's clarify this carefully: ${misconception}`
        : `${explanation} Watch for this contrast: ${misconception}`;
    }

    if (
      emphasizeApplication &&
      index === lesson.chunks.length - 1 &&
      !/apply|practice|try|use /i.test(explanation)
    ) {
      explanation = `${explanation} Focus on applying this idea in a concrete situation.`;
    }

    return {
      ...chunk,
      explanation,
      example,
      misconception,
    };
  });

  return {
    ...lesson,
    learningFrame,
    chunks,
  };
}

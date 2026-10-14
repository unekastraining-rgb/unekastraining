import type { ChapterStudyExtract, ExtractQuizItem } from "@/lib/core/chapter-study-extract";
import { isMetaSyllabusTopic } from "@/lib/csl/six-worked-lesson";
import {
  prioritizeQuizTopics,
  quizQuestionsFromTopics,
  type QuizTopicSeed,
} from "@/lib/quizzes/from-topics";
import { chapterSubtopicsFromText } from "@/lib/syllabus/enrich-course-from-syllabus";

type OutlineTopic = { name: string; description: string };

function resolveOutlineTopics(input: {
  sourceText: string;
  topics?: Array<{ name: string; description?: string | null }>;
  topicFocus?: string;
}): OutlineTopic[] {
  let resolved: OutlineTopic[] = [];
  if (input.topics && input.topics.length > 0) {
    resolved = input.topics
      .map((item) => ({
        name: item.name.trim(),
        description:
          item.description?.trim() ||
          `Study material from your course modules: ${item.name.trim()}`,
      }))
      .filter((item) => item.name.length >= 2 && !isMetaSyllabusTopic(item.name));
  } else {
    resolved = chapterSubtopicsFromText(input.sourceText).filter(
      (item) => !isMetaSyllabusTopic(item.name),
    );
  }

  const prioritized = prioritizeQuizTopics(resolved, input.topicFocus);
  return prioritized.map((item) => ({
    name: item.name.trim(),
    description:
      item.description?.trim() ||
      `Study material from your course modules: ${item.name.trim()}`,
  }));
}

/** Syllabus outline or LMS module topics ready for instant cold-start packs. */
export function canBuildDeterministicColdStart(
  sourceText: string,
  topics?: Array<{ name: string }>,
): boolean {
  const fromTopics =
    topics?.filter(
      (t) => t.name.trim() && !/^general$/i.test(t.name) && !isMetaSyllabusTopic(t.name),
    ).length ?? 0;
  // One real content topic is enough for a focused pack (with topicFocus weighting).
  if (fromTopics >= 1) return true;
  return (
    chapterSubtopicsFromText(sourceText).filter((t) => !isMetaSyllabusTopic(t.name))
      .length >= 1
  );
}

/**
 * Build a Core chapter-study extract from LMS/syllabus topics — no AI round-trip.
 * Powers "Study from topics" and Moodle/Canvas cold start before full chapter uploads.
 */
export function buildDeterministicColdStartExtract(input: {
  sourceText: string;
  courseTitle: string;
  topicFocus?: string;
  /** Prefer DB topics (Moodle modules) over parsing source text. */
  topics?: Array<{ name: string; description?: string | null }>;
}): ChapterStudyExtract {
  const subtopics = resolveOutlineTopics(input);
  const topics: QuizTopicSeed[] = subtopics.map((item) => ({
    name: item.name,
    description: item.description,
  }));

  const focusTopic = input.topicFocus?.trim();
  const title = focusTopic
    ? `${focusTopic} — ${input.courseTitle}`
    : `${input.courseTitle} — course topics`;

  const learningObjectives = subtopics.map((item, index) => ({
    code: `LO ${index + 1}`,
    statement: `Explain ${item.name} as covered in this course.`,
    keyPoints: [
      item.description.replace(/^Study material from your (syllabus|course modules): /, ""),
      `How ${item.name} connects to other modules in ${input.courseTitle}`,
    ],
  }));

  const definitions = subtopics.map((item) => ({
    term: item.name,
    definition: item.description.replace(
      /^Study material from your (syllabus|course modules): /,
      "",
    ),
  }));

  const quizItems = quizQuestionsFromTopics(input.courseTitle, topics, 12, {
    focusTopic: focusTopic || null,
  });
  const testYourself: ExtractQuizItem[] = quizItems.map((item) => ({
    question: item.prompt,
    answer:
      typeof item.correctAnswer === "string"
        ? item.correctAnswer
        : Array.isArray(item.correctAnswer)
          ? item.correctAnswer.join(", ")
          : String(item.correctAnswer ?? ""),
    type: item.type,
    options: item.options,
    explanation: item.explanation,
  }));

  const fromLmsTopics = Boolean(
    input.topics &&
      input.topics.filter(
        (item) => item.name.trim() && !isMetaSyllabusTopic(item.name),
      ).length >= 1,
  );

  return {
    title,
    chapterOverview: fromLmsTopics
      ? `Cold-start study pack from your LMS modules for ${input.courseTitle}. Each topic is a real course module — use Six and Lucky to practice before you upload full chapters.`
      : `Cold-start study pack from your syllabus outline for ${input.courseTitle}. Each topic maps to a module you will see on exams — use Six (Feynman) and Lucky quizzes to fill gaps before you upload full chapters.`,
    learningObjectives,
    definitions,
    frameworks: [
      {
        name: fromLmsTopics
          ? "Course modules (from LMS)"
          : "Course modules (from syllabus)",
        items: subtopics.map((item) => item.name),
      },
    ],
    comparisons: [],
    mustKnow: subtopics.map((item) => {
      const clean = item.description.replace(
        /^Study material from your (syllabus|course modules): /,
        "",
      );
      return clean.length > 24 && clean.toLowerCase() !== item.name.toLowerCase()
        ? `${item.name}: ${clean.slice(0, 140)}`
        : `Be able to define and give one example of ${item.name}`;
    }),
    studyToRemember: [
      "Teach each topic back without notes (Six Feynman)",
      "Run a Lucky quiz after each module",
      "Upload chapter PDFs in Core when you have them for deeper AI packs",
    ],
    testYourself,
    processesOrSteps: [
      {
        name: "Core → Six → Lucky loop",
        steps: [
          "Study from topics in Core (this pack)",
          "Explain simply in Six Feynman",
          "Retrieval practice in Lucky Blurt / quiz",
        ],
      },
    ],
    workedExamples: subtopics.slice(0, 4).map((item, index) => {
      const clean = item.description.replace(
        /^Study material from your (syllabus|course modules): /,
        "",
      );
      return {
        title: `Worked focus ${index + 1}: ${item.name}`,
        purpose: `Build a clear mental model of “${item.name}” before Lucky retrieval.`,
        setup: `You have notes or a syllabus bullet for ${item.name}${
          clean.length > 20 ? ` (“${clean.slice(0, 100)}”)` : ""
        }.`,
        steps: [
          `Define ${item.name} in one sentence without looking.`,
          "Contrast it with one neighboring module from this pack.",
          "Give one concrete example you would write on an exam.",
        ],
        result:
          clean.length > 20
            ? `You can explain ${item.name} from: ${clean.slice(0, 160)}`
            : `You can teach ${item.name} back and spot it on a Lucky quiz.`,
      };
    }),
    recommendedFormats: ["OUTLINE", "CONCEPT_DEFINITION", "CORNELL"],
    coverageNotes: fromLmsTopics
      ? "Built from LMS module topics (no full chapter upload). Add readings in Core for richer AI packs."
      : "Built from syllabus chapter/unit bullets (no full chapter upload). Add readings in Core for richer AI packs.",
  };
}

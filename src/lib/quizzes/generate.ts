import { MaterialType } from "@/generated/prisma";

import { aiService } from "@/lib/ai";
import { loadChapterStudySourceText } from "@/lib/ai/course-source";
import { isAIConfigured } from "@/lib/ai/is-configured";
import { friendlyUserFacingAiError, parseAiJson } from "@/lib/ai/parse-json-response";
import { isMetaSyllabusTopic } from "@/lib/csl/six-worked-lesson";
import { db } from "@/lib/db";
import type { ChapterStudyExtract } from "@/lib/core/chapter-study-extract";
import { packBalancedStudySource } from "@/lib/core/pack-study-source";
import {
  formatStudyExtractContext,
  loadPersistedStudyExtract,
} from "@/lib/core/study-extract-store";
import { quizQuestionsFromExtract } from "@/lib/quizzes/from-extract";
import { quizQuestionsFromSourceText } from "@/lib/quizzes/from-source";
import {
  buildTopicsSourceBlock,
  quizQuestionsFromTopics,
} from "@/lib/quizzes/from-topics";
import {
  clampQuizQuestionCount,
  QUIZ_QUESTION_MAX,
} from "@/lib/quizzes/limits";
import {
  normalizeGeneratedQuestions,
  serializeAnswer,
  type GeneratedQuizQuestion,
} from "@/lib/quizzes/types";
import { preferMcAndWriteIns, sanitizeQuizQuestions } from "@/lib/quizzes/sanitize-questions";
import { aiSourceInstruction, getUserAppSettings } from "@/lib/settings/app-settings";
import { backfillCourseTopicsIfEmpty } from "@/lib/syllabus/enrich-course-from-syllabus";
import { pickColdStartTopic } from "@/lib/study/cold-start-topic";
import { getOrCreateDefaultTopic } from "@/lib/topics";

export function formatLuckyQuizDescription(input: {
  difficulty: string;
  questionCount: number;
  aiProvider?: string | null;
}): string {
  const sourceTag = input.aiProvider?.trim()
    ? `via ${input.aiProvider.trim()}`
    : "offline bank";
  return `Lucky quiz · ${input.difficulty} · ${input.questionCount} questions · ${sourceTag}`;
}

export type LuckyQuizSourceBadge =
  | { kind: "ai"; provider: string }
  | { kind: "offline" };

/** Parse Lucky quiz description for free-tier provider vs offline topic-bank UI badges. */
export function parseLuckyQuizSourceBadge(
  description: string | null | undefined,
): LuckyQuizSourceBadge | null {
  if (!description?.trim()) return null;
  const aiMatch = description.match(/\bvia\s+(gemini|groq|openrouter|openai)\b/i);
  if (aiMatch) {
    return { kind: "ai", provider: aiMatch[1]!.toLowerCase() };
  }
  if (description.includes("offline bank")) {
    return { kind: "offline" };
  }
  return null;
}

function mergeQuestions(
  base: GeneratedQuizQuestion[],
  extra: GeneratedQuizQuestion[],
  limit: number,
): GeneratedQuizQuestion[] {
  const seen = new Set(base.map((item) => item.prompt.toLowerCase()));
  const merged = [...base];
  for (const item of extra) {
    if (merged.length >= limit) break;
    const key = item.prompt.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }
  return merged;
}

export { sanitizeQuizQuestions, preferMcAndWriteIns } from "@/lib/quizzes/sanitize-questions";

function sanitizeQuestions(questions: GeneratedQuizQuestion[]): GeneratedQuizQuestion[] {
  return sanitizeQuizQuestions(questions);
}

/** True when sanitize would gut the bank — trigger free-tier quality retry. */
export function needsAiQuizQualityRetry(
  questions: GeneratedQuizQuestion[],
  questionCount: number,
): boolean {
  const cleaned = preferMcAndWriteIns(sanitizeQuestions(questions));
  return cleaned.length < Math.ceil(questionCount * 0.7);
}

function fallbackQuestionsFromTitle(title: string): GeneratedQuizQuestion[] {
  const name = title.trim() || "this material";
  return [
    {
      type: "SHORT_ANSWER",
      prompt: `What is the main topic of “${name}”?`,
      correctAnswer: name,
    },
    {
      type: "SHORT_ANSWER",
      prompt: `Name one idea you should remember from “${name}”.`,
      correctAnswer: `Key ideas from ${name}`,
    },
    {
      type: "FILL_IN_BLANK",
      prompt: `A useful study focus for this quiz is ____.`,
      correctAnswer: name,
    },
  ];
}

/** Whether free-tier AI can run for this quiz (incl. topic-outline cold start). */
export function quizAiEligibility(input: {
  aiConfigured: boolean;
  combinedSourceLength: number;
  topicsBlockLength: number;
  hasTopicSeeds: boolean;
}): boolean {
  const minSourceForAi = input.hasTopicSeeds ? 40 : 200;
  return (
    input.aiConfigured &&
    (input.combinedSourceLength >= minSourceForAi ||
      (input.hasTopicSeeds && input.topicsBlockLength >= 120))
  );
}

export async function generateQuizForCourse(
  userId: string,
  courseId: string | undefined,
  options?: {
    difficulty?: string;
    questionCount?: number;
    topicName?: string;
    materialId?: string;
    extract?: ChapterStudyExtract;
    /** Notebook / pasted reading text from Core */
    sourceText?: string;
  },
) {
  let resolvedCourseId = courseId;

  if (options?.materialId) {
    const material = await db.courseMaterial.findFirst({
      where: { id: options.materialId, course: { userId } },
      select: { id: true, courseId: true, title: true, extractedText: true },
    });
    if (!material) {
      throw new Error("Material not found. Open the course again and try Make quiz.");
    }
    resolvedCourseId = material.courseId;
  }

  if (!resolvedCourseId) {
    throw new Error("Pick a course or a material first, then try Make quiz.");
  }

  await backfillCourseTopicsIfEmpty(resolvedCourseId);

  const course = await db.course.findFirst({
    where: { id: resolvedCourseId, userId },
    include: {
      materials: {
        where: {
          OR: [
            { type: MaterialType.SYLLABUS },
            { type: MaterialType.LECTURE_SLIDES },
            { type: MaterialType.TEXTBOOK },
            { type: MaterialType.DOCUMENT },
            { type: MaterialType.OTHER },
            { type: MaterialType.ARTICLE },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 8,
      },
      topics: { orderBy: { sortOrder: "asc" }, take: 24 },
    },
  });

  if (!course) {
    throw new Error("Course not found for your account. Open the course page and try again.");
  }

  const studyExtract =
    options?.extract ??
    (await loadPersistedStudyExtract({
      userId,
      courseId: resolvedCourseId,
      materialId: options?.materialId,
    }));
  const studyBlock = studyExtract
    ? formatStudyExtractContext(
        { ...studyExtract, workedExamples: [] },
        { maxChars: 14000 },
      )
    : "";

  const questionCount = clampQuizQuestionCount(options?.questionCount);
  const difficulty = options?.difficulty ?? "MEDIUM";
  const topic = await getOrCreateDefaultTopic(resolvedCourseId);

  let questions: GeneratedQuizQuestion[] = [];
  let title = `${course.title} Quiz`;

  const materialText = await loadRawQuizSource(
    userId,
    course,
    options?.materialId,
    studyBlock,
  );
  const notebookText = (options?.sourceText ?? "").trim();
  const contentTopics = course.topics.filter(
    (item) => item.name.trim() && !/^general$/i.test(item.name) && !isMetaSyllabusTopic(item.name),
  );
  const focusTopic =
    options?.topicName?.trim() && !isMetaSyllabusTopic(options.topicName)
      ? options.topicName.trim()
      : pickColdStartTopic(contentTopics);
  const topicsBlock = buildTopicsSourceBlock(course.title, contentTopics, {
    courseDescription: course.description,
    focusTopic: focusTopic ?? undefined,
  });
  const combinedSource = [notebookText, studyBlock, materialText, topicsBlock]
    .filter(Boolean)
    .join("\n\n")
    .trim();

  const fromExtract = studyExtract ? quizQuestionsFromExtract(studyExtract) : [];
  if (studyExtract?.title?.trim()) {
    title = `${studyExtract.title.trim()} quiz`;
  } else if (focusTopic) {
    title = `${focusTopic} quiz`;
  }

  const hasTopicSeeds = contentTopics.length > 0;
  const canUseAi = quizAiEligibility({
    aiConfigured: isAIConfigured(),
    combinedSourceLength: combinedSource.length,
    topicsBlockLength: topicsBlock.length,
    hasTopicSeeds,
  });

  // 1) AI-first when configured: chapter review OR topic-outline cold start
  let aiProviderLabel: string | null = null;
  if (canUseAi) {
    const runAiQuiz = async (
      temperature: number,
      fillHint: string,
      skipProviders?: string[],
    ) => {
      const appSettings = await getUserAppSettings(userId);
      const coldStart = materialText.trim().length < 200 && !notebookText && !studyBlock;
      const result = await aiService.complete(
        [
          {
            role: "system",
            content: `You create college chapter review quizzes at ChatGPT-tutor quality.
Cover ALL main concepts in the material (definitions, comparisons, lists, processes, applications) — not just the first few terms.
Use ONLY these item types:
- MULTIPLE_CHOICE (exactly 4 options; correctAnswer must be the exact option text — never a bare letter like "B"; distractors must be plausible near-misses, not silly)
- SHORT_ANSWER (write-in; expect a precise phrase or 1–2 sentences)
- FILL_IN_BLANK (write-in; prompt uses ____)
Do NOT use TRUE_FALSE, MULTIPLE_RESPONSE, or SCENARIO.
Never use option labels like "option A" / "A)" as the option text itself.
Never ask about page numbers, table of contents, "Sources", "Part 1" headings, or echo source code listings.
Only quiz real course concepts — never section titles, bibliography labels, or syllabus admin headings (Important Dates, Course Policies, Instructor Information, Grading Policy, Attendance).
Vary question stems: define, distinguish, apply, "which is NOT", example-of, cause/effect.
${
  coldStart
    ? "When only a topic outline is provided (no full chapter text), write exam-ready conceptual questions from standard college knowledge for those topics — accurate definitions, distinctions, and applications (ChatGPT-tutor bar). Mark explanations as typical course coverage. Weight ~half the bank toward the Primary focus topic when given."
    : "Ground every item in the provided material; do not invent facts that contradict it."
}
${fillHint}
Respond with JSON only.`,
          },
          {
            role: "user",
            content: `Create exactly ${questionCount} quiz questions for a full chapter review.

Difficulty: ${difficulty}
Course: ${course.title}
${focusTopic ? `Focus topic: ${focusTopic}` : ""}
${studyExtract?.title ? `Chapter/material title: ${studyExtract.title}` : ""}
${coldStart ? "Mode: cold start from course topic outline (student has not pasted a chapter yet)." : ""}

Required mix (strict):
- About ${Math.round(questionCount * 0.7)} MULTIPLE_CHOICE (definitions, examples, distinctions, applications)
- About ${Math.round(questionCount * 0.3)} write-ins: SHORT_ANSWER and FILL_IN_BLANK
- No true/false items
- Ban junk prompts like "Define: Sources", "Define: Part 1 Business Trends", or anything from TOC/headers
- Prefer the actual vocabulary and frameworks in the material (do not force unrelated business terms)
- Explanations: one short sentence citing the chapter idea

${aiSourceInstruction(appSettings.aiSourceMode)}

Gold-standard examples (match this quality — real options, exact-text answers):
{
  "title": "Cell membrane review",
  "questions": [
    {
      "type": "MULTIPLE_CHOICE",
      "prompt": "Which process moves water across a selectively permeable membrane?",
      "options": ["Osmosis", "Phagocytosis", "Active transport of ions", "Exocytosis of proteins"],
      "correctAnswer": "Osmosis",
      "explanation": "Osmosis is diffusion of water through a selectively permeable membrane."
    },
    {
      "type": "SHORT_ANSWER",
      "prompt": "In one sentence, what is a selectively permeable membrane?",
      "correctAnswer": "A membrane that lets some substances pass while blocking others",
      "explanation": "Selective permeability controls what enters and leaves the cell."
    },
    {
      "type": "FILL_IN_BLANK",
      "prompt": "The diffusion of water through a selectively permeable membrane is called ____.",
      "correctAnswer": "osmosis",
      "explanation": "Osmosis is water diffusion across a membrane."
    }
  ]
}

Return ONLY JSON in that shape (title + questions). Never put bare letters as options or answers.

Material:
${combinedSource.slice(0, 28000)}`,
          },
        ],
        {
          temperature,
          maxTokens: 14000,
          jsonMode: true,
          includeOpenAIPro: appSettings.aiUseOpenAIPro,
          skipProviders,
        },
      );

      const parsed = parseAiJson<{ title?: string; questions: unknown }>(
        result.content,
        "Could not parse AI quiz JSON.",
      );
      const generated = normalizeGeneratedQuestions(parsed.questions, QUIZ_QUESTION_MAX);
      return {
        questions: generated,
        title: parsed.title?.trim() || null,
        provider: result.provider ?? null,
      };
    };

    try {
      const first = await runAiQuiz(0.32, "");
      if (first.questions.length > 0) {
        questions = first.questions.slice(0, questionCount);
        if (first.title) title = first.title;
        if (first.provider) aiProviderLabel = first.provider;
      }

      // If sanitize would gut a weak bank, retry colder on the *next* free provider.
      if (needsAiQuizQualityRetry(questions, questionCount)) {
        try {
          const skipProviders = first.provider ? [first.provider] : undefined;
          const cleanedEarly = preferMcAndWriteIns(sanitizeQuestions(questions));
          const retry = await runAiQuiz(
            0.18,
            "Prior attempt under-delivered after quality filters. Fill only missing high-value concept slots. Ban TOC/header/bibliography junk. Prefer MULTIPLE_CHOICE + write-ins grounded in the material. correctAnswer must be exact option text, never a letter.",
            skipProviders,
          );
          if (retry.questions.length > 0) {
            questions = mergeQuestions(cleanedEarly, retry.questions, questionCount);
            if (retry.title && !first.title) title = retry.title;
            if (retry.provider) aiProviderLabel = retry.provider;
          }
        } catch (retryError) {
          console.error("AI quiz quality retry failed; continuing with first bank.", retryError);
        }
      }
    } catch (error) {
      console.error("AI chapter quiz generation failed; using local bank.", error);
    }
  }

  // 2) Fill gaps — skip weak local banks when free-tier AI already hit the quality bar.
  const cleanedAfterAi = preferMcAndWriteIns(sanitizeQuestions(questions));
  const aiSatisfied =
    Boolean(aiProviderLabel) &&
    cleanedAfterAi.length >= Math.ceil(questionCount * 0.7);
  if (aiSatisfied) {
    questions = cleanedAfterAi;
  } else {
    questions = cleanedAfterAi;

    if (questions.length < questionCount && fromExtract.length > 0) {
      questions = mergeQuestions(questions, fromExtract, questionCount);
      if (!title.toLowerCase().includes("quiz") && studyExtract?.title) {
        title = `${studyExtract.title} quiz`;
      }
    }

    if (questions.length < questionCount && combinedSource) {
      questions = mergeQuestions(
        questions,
        quizQuestionsFromSourceText(combinedSource, questionCount),
        questionCount,
      );
    }

    if (questions.length < questionCount && hasTopicSeeds) {
      questions = mergeQuestions(
        questions,
        quizQuestionsFromTopics(course.title, contentTopics, questionCount, {
          focusTopic,
        }),
        questionCount,
      );
      if (questions.length > 0 && !studyExtract?.title) {
        title = `${course.title} topics quiz`;
      }
    }
  }

  if (questions.length === 0) {
    const materialTitle =
      options?.materialId != null
        ? (
            await db.courseMaterial.findFirst({
              where: { id: options.materialId },
              select: { title: true },
            })
          )?.title
        : course.title;
    questions = fallbackQuestionsFromTitle(materialTitle || course.title);
    title = `${materialTitle || course.title} quiz`;
  }

  questions = preferMcAndWriteIns(sanitizeQuestions(questions)).slice(0, questionCount);

  if (questions.length === 0) {
    throw new Error(
      "Could not build quiz questions. Add course topics, a syllabus, or paste a chapter reading.",
    );
  }

  try {
    return await persistGeneratedQuiz({
      userId,
      courseId: resolvedCourseId,
      topicId: topic.id,
      title: title.slice(0, 200),
      description: formatLuckyQuizDescription({
        difficulty,
        questionCount: questions.length,
        aiProvider: aiProviderLabel,
      }),
      difficulty,
      questions,
    });
  } catch (error) {
    console.error("Quiz persist failed:", error);
    const detail =
      error instanceof Error && !/Invalid `prisma|prisma\./i.test(error.message)
        ? error.message
        : null;
    throw new Error(
      detail ||
        friendlyUserFacingAiError(
          error,
          "Could not save that quiz. Try again — if it keeps failing, refresh the course page.",
        ),
    );
  }
}

async function loadRawQuizSource(
  userId: string,
  course: {
    title: string;
    description: string | null;
    materials: Array<{ id: string; title: string; extractedText: string | null }>;
  },
  materialId: string | undefined,
  studyBlock: string,
): Promise<string> {
  if (materialId) {
    const packed = await loadChapterStudySourceText(userId, materialId, 28000);
    if (packed?.text?.trim()) return packed.text;

    const direct = course.materials.find((material) => material.id === materialId);
    if (direct?.extractedText?.trim()) {
      return packBalancedStudySource(direct.extractedText, 28000).text;
    }

    // Material may be OTHER / not in the included list — fetch directly
    const row = await db.courseMaterial.findFirst({
      where: { id: materialId, course: { userId } },
      select: { title: true, extractedText: true, type: true },
    });
    if (row?.extractedText?.trim()) {
      return packBalancedStudySource(row.extractedText, 28000).text;
    }
    if (row) {
      return `${row.title} (${row.type})`;
    }
  }
  const joined =
    course.materials
      .map((material) => material.extractedText?.trim())
      .filter(Boolean)
      .join("\n\n") ||
    studyBlock ||
    `${course.title} ${course.description ?? ""}`.trim();
  return packBalancedStudySource(joined, 28000).text;
}

async function persistGeneratedQuiz(input: {
  userId: string;
  courseId: string;
  topicId: string;
  title: string;
  description: string;
  difficulty: string;
  questions: GeneratedQuizQuestion[];
}) {
  return db.quiz.create({
    data: {
      userId: input.userId,
      courseId: input.courseId,
      topicId: input.topicId,
      title: input.title,
      description: input.description,
      difficulty: input.difficulty,
      questionCount: input.questions.length,
      questions: {
        create: input.questions.map((question, index) => ({
          sortOrder: index,
          type: question.type,
          prompt: question.prompt,
          options: question.options ? JSON.stringify(question.options) : null,
          correctAnswer: serializeAnswer(question.correctAnswer),
          explanation: question.explanation ?? null,
        })),
      },
    },
    include: { questions: { orderBy: { sortOrder: "asc" } } },
  });
}

export async function generateQuizFromMissedQuestions(
  userId: string,
  courseId?: string,
) {
  const missed = await db.missedQuestion.findMany({
    where: {
      userId,
      mastered: false,
      ...(courseId ? { courseId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  if (missed.length === 0) {
    throw new Error("No missed questions to review yet. Take a quiz first!");
  }

  const quiz = await db.quiz.create({
    data: {
      userId,
      courseId: courseId ?? missed[0]?.courseId,
      topicId: missed[0]?.topicId,
      title: "Missed Question Review",
      description: "Lucky recycle — questions you missed before",
      source: "MISSED_RECYCLE",
      difficulty: "MEDIUM",
      questionCount: missed.length,
      questions: {
        create: missed.map((item, index) => ({
          sortOrder: index,
          type: item.questionType,
          prompt: item.prompt,
          options: item.options,
          correctAnswer: item.correctAnswer,
          explanation: item.explanation,
        })),
      },
    },
    include: { questions: { orderBy: { sortOrder: "asc" } } },
  });

  return quiz;
}

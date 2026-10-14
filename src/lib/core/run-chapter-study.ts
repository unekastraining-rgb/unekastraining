import { aiService } from "@/lib/ai";
import {
  attachPackedCoverage,
  mergeChapterExtracts,
  missingCoverageHeadings,
  normalizeChapterStudyExtract,
  type ChapterStudyExtract,
} from "@/lib/core/chapter-study-extract";
import type { PackedStudySource } from "@/lib/core/pack-study-source";
import { QUIZ_QUESTION_DEFAULT, QUIZ_QUESTION_MAX, QUIZ_QUESTION_MIN } from "@/lib/quizzes/limits";
import {
  preferMcAndWriteIns,
  sanitizeQuizQuestions,
} from "@/lib/quizzes/sanitize-questions";
import { normalizeQuestionType, type GeneratedQuizQuestion } from "@/lib/quizzes/types";

function parseJson(content: string) {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  return JSON.parse((fenced?.[1] ?? content).trim());
}

const NOTES_JSON_SCHEMA = `{
  "title": "Chapter or reading title",
  "chapterOverview": "2-4 sentences: what this chapter is about and how the LOs fit together",
  "learningObjectives": [{"code":"LO 1-2","statement":"...","keyPoints":["exam-ready point"]}],
  "definitions": [{"term":"...","definition":"..."}],
  "frameworks": [{"name":"...","items":["..."]}],
  "comparisons": [{"topic":"...","positives":["..."],"negatives":["..."]}],
  "mustKnow": ["Short exam-ready bullets"],
  "studyToRemember": ["Optional memory hooks"],
  "processesOrSteps": [{"name":"Fetch-decode-execute","steps":["fetch","decode","execute"]}],
  "workedExamples": [{"title":"...","purpose":"...","setup":"...","steps":["..."],"result":"..."}],
  "recommendedFormats": ["OUTLINE","CONCEPT_DEFINITION","CHARTING","TWO_COLUMN"],
  "coverageNotes": "Which SOURCE COVERAGE headings you captured, and any you could not fill"
}`;

const NOTES_SYSTEM = `You sort a textbook chapter or lecture reading into exam-ready study notes — the same way you would if a student pasted the whole chapter and asked for study notes.

Hard rules:
1. Sort the WHOLE source. Every major numbered section in SOURCE COVERAGE must appear in definitions, processesOrSteps, comparisons, frameworks, or workedExamples.
2. Teaching procedures, conversions, cycles, and in-text walkthroughs ARE required (binary conversion, fetch-decode-execute, using IDLE). Skip only bios, motivational filler, and page numbers.
3. Capture ALL named comparisons and ALL processes. Do not keep only the first of each.
4. Do not write the quiz here — notes only.
5. Never invent fake page citations. Respond JSON only.`;

const QUIZ_BANK_SYSTEM = `You write a chapter quiz from study notes plus the source reading at ChatGPT-tutor quality. Respond JSON only.

Use ONLY these item types (Lucky / free-tier Gemini→Groq→OpenRouter bar):
- MULTIPLE_CHOICE (exactly 4 options; correctAnswer / answer must be the exact option text — never a bare letter like "B"; distractors must be plausible near-misses)
- SHORT_ANSWER (write-in; precise phrase or 1–2 sentences)
- FILL_IN_BLANK (prompt uses ____)

Do NOT use TRUE_FALSE, MULTIPLE_RESPONSE, or SCENARIO.
Never use option labels like "option A" / "A)" as the option text itself.
Never ask about page numbers, TOC headings, "Sources", or bibliography labels.
Cover definitions, comparisons, processes, and walkthroughs — not just the opening section.`;

export async function runChapterStudyPipeline(options: {
  sourceText: string;
  topic: string;
  grounding: string;
  coverage?: PackedStudySource;
  studyGuide?: boolean;
  includeOpenAIPro?: boolean;
}): Promise<ChapterStudyExtract> {
  const notesSystem = options.studyGuide
    ? `${NOTES_SYSTEM}

Also organize as a concept-based study guide (not a paragraph-by-paragraph summary). Prefer KEY CONCEPTS, KEY TERMS, IMPORTANT DISTINCTIONS, PROCESSES when they fit.`
    : NOTES_SYSTEM;

  const notesResult = await aiService.complete(
    [
      { role: "system", content: notesSystem + options.grounding },
      {
        role: "user",
        content: `Chapter / topic focus: ${options.topic || "Entire provided chapter or reading"}

SOURCE:
${options.sourceText}

Sort this into study notes a student could pass a chapter quiz with. Return ONLY JSON:
${NOTES_JSON_SCHEMA}`,
      },
    ],
    { temperature: 0.15, maxTokens: 16384, jsonMode: true, includeOpenAIPro: options.includeOpenAIPro },
  );

  let extract = attachPackedCoverage(
    normalizeChapterStudyExtract(parseJson(notesResult.content) as Record<string, unknown>),
    options.coverage,
  );

  const missing = missingCoverageHeadings(extract, extract.coverage);
  const thinNotes =
    extract.definitions.length < 6 ||
    extract.comparisons.length + extract.processesOrSteps.length + (extract.workedExamples?.length ?? 0) < 3;

  if (missing.length > 0 || thinNotes) {
    extract = await fillExtractGaps(extract, options.sourceText, missing, options.includeOpenAIPro);
  }

  extract = await attachChapterQuizBank(extract, options.sourceText, options.includeOpenAIPro);
  return extract;
}

async function fillExtractGaps(
  extract: ChapterStudyExtract,
  sourceText: string,
  missing: string[],
  includeOpenAIPro?: boolean,
): Promise<ChapterStudyExtract> {
  try {
    const result = await aiService.complete(
      [
        {
          role: "system",
          content: `${NOTES_SYSTEM}

You are filling GAPS in a first-pass extract. Return the SAME notes JSON schema with ONLY the missing material (you may repeat title).`,
        },
        {
          role: "user",
          content: `Missing or thin SOURCE COVERAGE headings:
${missing.length > 0 ? missing.join("\n") : "(none listed — expand comparisons, processes, and walkthroughs that were skipped)"}

FIRST EXTRACT:
${JSON.stringify({
  title: extract.title,
  definitions: extract.definitions.map((item) => item.term),
  comparisons: extract.comparisons.map((item) => item.topic),
  processesOrSteps: extract.processesOrSteps.map((item) => item.name),
  workedExamples: (extract.workedExamples ?? []).map((item) => item.title),
})}

SOURCE:
${sourceText}

Return ONLY JSON:
${NOTES_JSON_SCHEMA}`,
        },
      ],
      { temperature: 0.1, maxTokens: 8192, jsonMode: true, includeOpenAIPro },
    );
    const extra = normalizeChapterStudyExtract(parseJson(result.content) as Record<string, unknown>);
    return mergeChapterExtracts(extract, extra);
  } catch {
    return extract;
  }
}

async function attachChapterQuizBank(
  extract: ChapterStudyExtract,
  sourceText: string,
  includeOpenAIPro?: boolean,
): Promise<ChapterStudyExtract> {
  try {
    const result = await aiService.complete(
      [
        { role: "system", content: QUIZ_BANK_SYSTEM },
        {
          role: "user",
          content: `Write ${QUIZ_QUESTION_DEFAULT} quiz questions (minimum ${QUIZ_QUESTION_MIN}, maximum ${QUIZ_QUESTION_MAX}) from this chapter.

Required mix:
- About 70% MULTIPLE_CHOICE (exactly 4 full-text options; answer = exact option text; include some "which is NOT" items)
- About 30% write-ins: SHORT_ANSWER and FILL_IN_BLANK
- No TRUE_FALSE or MULTIPLE_RESPONSE
Do not write 6 similar definition questions. Spread items across every major section.

STUDY NOTES:
${JSON.stringify({
  title: extract.title,
  chapterOverview: extract.chapterOverview,
  learningObjectives: extract.learningObjectives,
  definitions: extract.definitions,
  frameworks: extract.frameworks,
  comparisons: extract.comparisons,
  processesOrSteps: extract.processesOrSteps,
  workedExamples: extract.workedExamples,
  mustKnow: extract.mustKnow,
})}

SOURCE (for details the notes may have compressed):
${sourceText.slice(0, 24000)}

Return ONLY JSON:
{
  "testYourself": [
    {
      "type": "MULTIPLE_CHOICE",
      "question": "Which process moves water across a selectively permeable membrane?",
      "options": ["Osmosis", "Phagocytosis", "Active transport of ions", "Exocytosis of proteins"],
      "answer": "Osmosis",
      "explanation": "Osmosis is diffusion of water through a selectively permeable membrane."
    },
    {
      "type": "SHORT_ANSWER",
      "question": "In one sentence, what is a selectively permeable membrane?",
      "answer": "A membrane that lets some substances pass while blocking others",
      "explanation": "Selective permeability controls what enters and leaves the cell."
    },
    {
      "type": "FILL_IN_BLANK",
      "question": "The diffusion of water through a selectively permeable membrane is called ____.",
      "answer": "osmosis",
      "explanation": "Osmosis is water diffusion across a membrane."
    }
  ]
}`,
        },
      ],
      { temperature: 0.3, maxTokens: 8192, jsonMode: true, includeOpenAIPro },
    );
    const rawItems =
      (parseJson(result.content) as { testYourself?: unknown }).testYourself;
    const asGenerated: GeneratedQuizQuestion[] = Array.isArray(rawItems)
      ? rawItems.map((item) => {
          const row = item as Record<string, unknown>;
          return {
            type: normalizeQuestionType(String(row.type ?? "SHORT_ANSWER")),
            prompt: String(row.question ?? row.prompt ?? ""),
            options: Array.isArray(row.options)
              ? row.options.map((option) => String(option))
              : undefined,
            correctAnswer: (row.answer ?? row.correctAnswer) as
              | string
              | string[]
              | boolean,
            explanation:
              typeof row.explanation === "string" ? row.explanation : undefined,
          };
        })
      : [];
    const cleaned = preferMcAndWriteIns(sanitizeQuizQuestions(asGenerated));
    if (cleaned.length === 0) return extract;

    return {
      ...extract,
      testYourself: cleaned.slice(0, QUIZ_QUESTION_MAX).map((item) => ({
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
      })),
    };
  } catch {
    return extract;
  }
}

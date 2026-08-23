import { aiService } from "@/lib/ai";
import { parseAiJson } from "@/lib/ai/parse-json-response";

import type { GradeSchoolLearningStep } from "@/lib/syllabus/types";

import { detectSubjectKind, type LessonWidget, type SubjectKind } from "./subjects";

export interface InteractiveLessonStep {
  title: string;
  instruction: string;
  example?: string | null;
  prompt?: string | null;
  hint?: string | null;
  widget?: LessonWidget | null;
}

export interface InteractiveLesson {
  greeting: string;
  encouragement: string;
  subjectKind: SubjectKind;
  steps: InteractiveLessonStep[];
}

function widgetInstructions(kind: SubjectKind): string {
  switch (kind) {
    case "reading":
      return `Use widget type "reading" on 2 steps max:
{ "type": "reading", "passage": "max 60 words", "question": "one short Q", "highlightPhrase": "phrase or null" }`;
    case "math":
      return `Use widget type "math" on 2 steps max:
{ "type": "math", "problem": "one problem", "answer": "answer", "unit": "optional or null", "steps": ["hint 1","hint 2"] }`;
    case "science":
      return `Use widget type "science" on 2 steps max:
{ "type": "science", "scenario": "max 40 words", "question": "Q", "choices": ["A","B","C"], "correctIndex": 0, "explanation": "brief" }`;
    case "writing":
      return `Use widget type "writing" on 2 steps max:
{ "type": "writing", "prompt": "task", "wordBank": ["w1","w2","w3"], "sampleAnswer": "optional" }`;
    default:
      return `Use widget type "reflect" on 1 step:
{ "type": "reflect", "prompt": "short reflection" }`;
  }
}

const LESSON_RULES = `Rules:
- Exactly 4 steps.
- Keep every string short (under 120 characters). No line breaks inside strings.
- Use plain quotes in JSON — escape any inner double quotes.
- Focus on skill-building, NOT homework.
- Only 2 steps should include a widget; other steps use widget: null.`;

const LESSON_PROMPT = `You create short, interactive grade-school lessons for Study Haul.

Return ONLY valid JSON:
{
  "greeting": "string",
  "encouragement": "string",
  "subjectKind": "reading | math | science | writing | general",
  "steps": [
    {
      "title": "string",
      "instruction": "string",
      "example": "string or null",
      "prompt": "string or null",
      "hint": "string or null",
      "widget": { ... or null }
    }
  ]
}

${LESSON_RULES}`;

const COMPACT_LESSON_PROMPT = `Create a very short grade-school lesson as JSON only:
{ "greeting": "...", "encouragement": "...", "subjectKind": "...", "steps": [4 items with title, instruction, example, prompt, hint, widget] }
${LESSON_RULES}
Use widget: null on steps without interactives.`;

function parseLessonContent(content: string): InteractiveLesson {
  const parsed = parseAiJson<InteractiveLesson>(
    content,
    "We couldn't load this lesson. Please try again.",
  );

  if (!parsed.greeting || !Array.isArray(parsed.steps) || parsed.steps.length === 0) {
    throw new Error("Lesson format was invalid.");
  }

  return {
    ...parsed,
    steps: parsed.steps.slice(0, 6),
    subjectKind: parsed.subjectKind ?? "general",
  };
}

async function requestLesson(
  userPrompt: string,
  systemContent: string,
  compact: boolean,
): Promise<string> {
  const result = await aiService.complete(
    [
      { role: "system", content: systemContent },
      {
        role: "user",
        content: `${compact ? COMPACT_LESSON_PROMPT : LESSON_PROMPT}\n\n${userPrompt}`,
      },
    ],
    {
      temperature: compact ? 0.3 : 0.45,
      maxTokens: compact ? 4096 : 8192,
      jsonMode: true,
    },
  );

  return result.content;
}

export async function generateInteractiveLesson(input: {
  gradeLevel: string;
  subject: string;
  focusTopic?: string | null;
  strugglingWith?: string | null;
  learningStep: GradeSchoolLearningStep;
  courseSummary?: string | null;
  learnerSummary?: string | null;
}): Promise<InteractiveLesson> {
  const subjectKind = detectSubjectKind(input.subject);

  const userPrompt = [
    `Grade: ${input.gradeLevel}`,
    `Subject: ${input.subject}`,
    `Subject kind: ${subjectKind}`,
    input.focusTopic ? `Focus: ${input.focusTopic}` : "",
    input.strugglingWith ? `Student struggles with: ${input.strugglingWith}` : "",
    input.learnerSummary ? `Learner profile: ${input.learnerSummary}` : "",
    input.courseSummary ? `Course context: ${input.courseSummary}` : "",
    `Activity: ${input.learningStep.title}`,
    `Skill track: ${input.learningStep.skillTrack ?? input.learningStep.skillFocus}`,
    `Skill focus: ${input.learningStep.skillFocus}`,
    input.learningStep.domain ? `Domain: ${input.learningStep.domain}` : "",
    `Goal: ${input.learningStep.goal}`,
    widgetInstructions(subjectKind),
    input.learningStep.steps.length
      ? `Outline:\n${input.learningStep.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const content = await requestLesson(
      userPrompt,
      "You design kid-friendly interactive lessons. Respond with valid JSON only.",
      false,
    );
    const lesson = parseLessonContent(content);
    return { ...lesson, subjectKind: lesson.subjectKind ?? subjectKind };
  } catch (firstError) {
    console.warn("Lesson generation retry after:", firstError);

    const content = await requestLesson(
      userPrompt,
      "You design kid-friendly interactive lessons. Respond with compact valid JSON only.",
      true,
    );
    const lesson = parseLessonContent(content);
    return { ...lesson, subjectKind: lesson.subjectKind ?? subjectKind };
  }
}

import type { ChapterStudyExtract, ExtractQuizItem } from "@/lib/core/chapter-study-extract";
import type { GeneratedQuizQuestion } from "@/lib/quizzes/types";
import { normalizeQuestionType } from "@/lib/quizzes/types";
import { QUIZ_QUESTION_MAX } from "@/lib/quizzes/limits";
import { isJunkPrompt, isJunkQuizTerm } from "@/lib/quizzes/from-source";

function inferExtractQuizType(item: ExtractQuizItem): string {
  if (item.type) return item.type;
  if (item.options && item.options.length >= 2) {
    const prompt = item.question.toLowerCase();
    if (/\bnot true\b|\bexcept\b|\bfalse about\b/.test(prompt)) return "MULTIPLE_CHOICE";
    if (item.options.length > 4 || /,/.test(item.answer)) return "MULTIPLE_RESPONSE";
    return "MULTIPLE_CHOICE";
  }
  const answer = item.answer.trim().toLowerCase();
  if (answer === "true" || answer === "false") return "TRUE_FALSE";
  if (/_{3,}|\[blank\]/i.test(item.question)) return "FILL_IN_BLANK";
  return "SHORT_ANSWER";
}

function parseCorrectAnswer(
  type: GeneratedQuizQuestion["type"],
  item: ExtractQuizItem,
): string | string[] | boolean {
  if (type === "TRUE_FALSE") {
    const raw = item.answer.trim().toLowerCase();
    return raw === "true" || raw === "t" || raw === "yes";
  }
  if (type === "MULTIPLE_RESPONSE") {
    if (item.answer.includes(",")) {
      return item.answer
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);
    }
    return (
      item.options?.filter((option) =>
        item.answer.toLowerCase().includes(option.toLowerCase()),
      ) ?? [item.answer]
    );
  }
  if (type === "MULTIPLE_CHOICE" && item.options && item.options.length > 0) {
    const match = item.options.find(
      (option) => option.trim().toLowerCase() === item.answer.trim().toLowerCase(),
    );
    return match ?? item.answer;
  }
  return item.answer;
}

function toQuestion(item: ExtractQuizItem): GeneratedQuizQuestion | null {
  if (!item.question.trim() || !item.answer.trim()) return null;
  if (isJunkPrompt(item.question)) return null;
  const defineTerm = item.question.match(/^define:?\s*(.+)$/i)?.[1];
  if (defineTerm && isJunkQuizTerm(defineTerm)) return null;
  const type = normalizeQuestionType(inferExtractQuizType(item));
  return {
    type,
    prompt: item.question.trim(),
    options:
      type === "TRUE_FALSE" ||
      type === "SHORT_ANSWER" ||
      type === "SCENARIO" ||
      type === "FILL_IN_BLANK"
        ? undefined
        : item.options,
    correctAnswer: parseCorrectAnswer(type, item),
    explanation: item.explanation,
  };
}

function pushUnique(
  list: GeneratedQuizQuestion[],
  seen: Set<string>,
  item: ExtractQuizItem,
) {
  const question = toQuestion(item);
  if (!question) return;
  const key = question.prompt.toLowerCase();
  if (seen.has(key)) return;
  seen.add(key);
  list.push(question);
}

/** Build Lucky quiz items from the whole study extract — not only testYourself. */
export function quizQuestionsFromExtract(
  extract: ChapterStudyExtract,
): GeneratedQuizQuestion[] {
  const questions: GeneratedQuizQuestion[] = [];
  const seen = new Set<string>();

  for (const item of extract.testYourself ?? []) {
    pushUnique(questions, seen, item);
  }

  for (const def of extract.definitions ?? []) {
    if (!def.term?.trim() || !def.definition?.trim()) continue;
    if (isJunkQuizTerm(def.term)) continue;
    pushUnique(questions, seen, {
      question: `Define ${def.term.trim()}.`,
      answer: def.definition.trim(),
      type: "SHORT_ANSWER",
    });
    pushUnique(questions, seen, {
      question: `${def.term.trim()} is a ____.`,
      answer: def.definition.trim().split(/[.!?]/)[0]?.trim() || def.definition.trim(),
      type: "FILL_IN_BLANK",
    });
  }

  for (const lo of extract.learningObjectives ?? []) {
    if (!lo.statement?.trim()) continue;
    const points = (lo.keyPoints ?? []).filter((point) => point.trim());
    if (points.length > 0) {
      pushUnique(questions, seen, {
        question: `${lo.code ? `${lo.code}: ` : ""}${lo.statement.trim()}`,
        answer: points.join("; "),
        type: "SHORT_ANSWER",
        explanation: points.join(" · "),
      });
    } else {
      pushUnique(questions, seen, {
        question: `Explain: ${lo.statement.trim()}`,
        answer: lo.statement.trim(),
        type: "SHORT_ANSWER",
      });
    }
  }

  for (const framework of extract.frameworks ?? []) {
    if (!framework.name?.trim() || !framework.items?.length) continue;
    pushUnique(questions, seen, {
      question: `List the parts of: ${framework.name.trim()}`,
      answer: framework.items.join(", "),
      type: "SHORT_ANSWER",
    });
    if (framework.items.length >= 2) {
      pushUnique(questions, seen, {
        question: `Which of the following is part of ${framework.name.trim()}?`,
        options: [
          framework.items[0]!,
          "None of these",
          "Unrelated detail",
          "Page number",
        ].slice(0, 4),
        answer: framework.items[0]!,
        type: "MULTIPLE_CHOICE",
      });
    }
  }

  for (const comparison of extract.comparisons ?? []) {
    if (!comparison.topic?.trim()) continue;
    const positives = (comparison.positives ?? []).filter(Boolean);
    const negatives = (comparison.negatives ?? []).filter(Boolean);
    if (positives.length > 0) {
      pushUnique(questions, seen, {
        question: `Name a positive / advantage for: ${comparison.topic.trim()}`,
        answer: positives.join("; "),
        type: "SHORT_ANSWER",
      });
    }
    if (negatives.length > 0) {
      pushUnique(questions, seen, {
        question: `Name a negative / drawback for: ${comparison.topic.trim()}`,
        answer: negatives.join("; "),
        type: "SHORT_ANSWER",
      });
    }
  }

  for (const process of extract.processesOrSteps ?? []) {
    if (!process.name?.trim() || !process.steps?.length) continue;
    pushUnique(questions, seen, {
      question: `List the steps of: ${process.name.trim()}`,
      answer: process.steps.join(" → "),
      type: "SHORT_ANSWER",
    });
  }

  for (const bullet of extract.mustKnow ?? []) {
    if (!bullet.trim()) continue;
    pushUnique(questions, seen, {
      question: `Why does this matter for the exam? ${bullet.trim()}`,
      answer: bullet.trim(),
      type: "SHORT_ANSWER",
    });
  }

  for (const example of extract.workedExamples ?? []) {
    if (!example.title?.trim()) continue;
    const result = example.result?.trim();
    const steps = (example.steps ?? []).filter(Boolean);
    if (result) {
      pushUnique(questions, seen, {
        question: `What is the result of: ${example.title.trim()}?`,
        answer: result,
        type: "SHORT_ANSWER",
        explanation: steps.join(" → ") || example.purpose,
      });
    } else if (steps.length > 0) {
      pushUnique(questions, seen, {
        question: `Walk through: ${example.title.trim()}`,
        answer: steps.join(" → "),
        type: "SHORT_ANSWER",
      });
    }
  }

  return questions.slice(0, QUIZ_QUESTION_MAX);
}

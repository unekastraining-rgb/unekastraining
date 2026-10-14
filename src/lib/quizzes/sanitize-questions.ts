import { isJunkPrompt } from "@/lib/quizzes/from-source";
import {
  normalizeQuestionType,
  type GeneratedQuizQuestion,
} from "@/lib/quizzes/types";

const WEAK_OPTION =
  /^(none of (the )?these|all of the above|page number|unrelated term|not\s|option\s*[a-d])$/i;

function stripOptionLetterPrefix(option: string): string {
  return option.replace(/^[A-D][).:\-\s]+/i, "").trim();
}

function isBareLetterOption(option: string): boolean {
  return /^[A-D]$/i.test(option.trim());
}

function isWeakMcOption(option: string): boolean {
  const trimmed = option.trim();
  if (trimmed.length < 2) return true;
  if (isBareLetterOption(trimmed)) return true;
  if (WEAK_OPTION.test(trimmed)) return true;
  return false;
}

/**
 * Map letter answers ("B") or matching option text onto a concrete option.
 * Returns null when the answer cannot be grounded in the option list.
 */
export function resolveMultipleChoiceAnswer(
  correctAnswer: unknown,
  options: string[],
): string | null {
  if (options.length === 0) return null;

  if (typeof correctAnswer === "number" && Number.isInteger(correctAnswer)) {
    const byIndex = options[correctAnswer];
    return byIndex ?? null;
  }

  const raw = String(correctAnswer ?? "").trim();
  if (!raw) return null;

  const letter = raw.match(/^[A-D]$/i)?.[0];
  if (letter) {
    const mapped = options[letter.toUpperCase().charCodeAt(0) - 65];
    return mapped ?? null;
  }

  const exact = options.find((option) => option.trim() === raw);
  if (exact) return exact;

  const caseInsensitive = options.find(
    (option) => option.trim().toLowerCase() === raw.toLowerCase(),
  );
  return caseInsensitive ?? null;
}

/** Drop TOC junk, weak MC, and empty prompts before persist. */
export function sanitizeQuizQuestions(
  questions: GeneratedQuizQuestion[],
): GeneratedQuizQuestion[] {
  const out: GeneratedQuizQuestion[] = [];
  for (const question of questions) {
    const prompt = String(question.prompt ?? "")
      .replace(/\u0000/g, "")
      .trim()
      .slice(0, 4000);
    if (prompt.length < 4 || isJunkPrompt(prompt)) continue;
    const type = normalizeQuestionType(String(question.type ?? "SHORT_ANSWER"));

    if (type === "MULTIPLE_CHOICE" || type === "MULTIPLE_RESPONSE") {
      const options = (Array.isArray(question.options) ? question.options : [])
        .map((option) =>
          stripOptionLetterPrefix(String(option).replace(/\u0000/g, "").trim()).slice(
            0,
            500,
          ),
        )
        .filter((option) => option.length > 0);

      const unique = [...new Set(options)];
      if (unique.length < 4) continue;
      if (unique.slice(0, 4).every(isBareLetterOption)) continue;
      if (unique.slice(0, 4).filter((option) => !isWeakMcOption(option)).length < 3) {
        continue;
      }

      const trimmedOptions = unique.slice(0, type === "MULTIPLE_CHOICE" ? 4 : 8);
      const resolved = resolveMultipleChoiceAnswer(question.correctAnswer, trimmedOptions);
      // Prefer exact option text — reject unresolved bare letters after strip.
      if (!resolved || isJunkPrompt(resolved) || isWeakMcOption(resolved)) continue;

      out.push({
        type,
        prompt,
        options: trimmedOptions,
        correctAnswer: resolved,
        explanation: question.explanation
          ? String(question.explanation).replace(/\u0000/g, "").slice(0, 2000)
          : undefined,
      });
      continue;
    }

    const correctAnswer = question.correctAnswer;
    if (
      correctAnswer === undefined ||
      correctAnswer === null ||
      (typeof correctAnswer === "string" && !correctAnswer.trim())
    ) {
      // Write-ins need a real key; skip empty placeholders that pollute Lucky banks.
      continue;
    }
    if (typeof correctAnswer === "string" && isJunkPrompt(correctAnswer)) {
      continue;
    }
    if (
      typeof correctAnswer === "string" &&
      correctAnswer.trim().toLowerCase() === "see material"
    ) {
      continue;
    }

    out.push({
      type,
      prompt,
      options: undefined,
      correctAnswer,
      explanation: question.explanation
        ? String(question.explanation).replace(/\u0000/g, "").slice(0, 2000)
        : undefined,
    });
  }
  return out;
}

/** Prefer MC + write-ins; never keep true/false or MR/scenario in the final Lucky bank. */
export function preferMcAndWriteIns(
  questions: GeneratedQuizQuestion[],
): GeneratedQuizQuestion[] {
  return questions.filter(
    (item) =>
      item.type === "MULTIPLE_CHOICE" ||
      item.type === "SHORT_ANSWER" ||
      item.type === "FILL_IN_BLANK",
  );
}

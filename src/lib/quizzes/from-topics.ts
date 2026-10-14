import { isMetaSyllabusTopic } from "@/lib/csl/six-worked-lesson";
import type { GeneratedQuizQuestion } from "@/lib/quizzes/types";
import { QUIZ_QUESTION_MAX } from "@/lib/quizzes/limits";

export interface QuizTopicSeed {
  name: string;
  description?: string | null;
}

function usableTopicSeeds(topics: QuizTopicSeed[]): QuizTopicSeed[] {
  return topics.filter(
    (topic) =>
      topic.name.trim().length >= 2 &&
      !/^general$/i.test(topic.name) &&
      !isMetaSyllabusTopic(topic.name),
  );
}

/** Prefer the cold-start / focus topic first so offline banks and AI outlines lead with it. */
export function prioritizeQuizTopics(
  topics: QuizTopicSeed[],
  focusTopic?: string | null,
): QuizTopicSeed[] {
  const usable = usableTopicSeeds(topics);
  const focus = focusTopic?.trim();
  if (!focus || isMetaSyllabusTopic(focus)) return usable;
  const matchIndex = usable.findIndex(
    (topic) => topic.name.trim().toLowerCase() === focus.toLowerCase(),
  );
  if (matchIndex <= 0) {
    if (matchIndex === -1) {
      return [{ name: focus }, ...usable];
    }
    return usable;
  }
  const copy = [...usable];
  const [matched] = copy.splice(matchIndex, 1);
  return matched ? [matched, ...copy] : usable;
}

/** Pack course topics into source text so quizzes work without pasted chapters. */
export function buildTopicsSourceBlock(
  courseTitle: string,
  topics: QuizTopicSeed[],
  options?: { courseDescription?: string | null; focusTopic?: string },
): string {
  const lines: string[] = [
    `Course: ${courseTitle.trim() || "Course"}`,
    "Study focus: use these course topics as the chapter outline. Create conceptual quiz items (definitions, distinctions, examples) a college student would see on an exam.",
    "Never quiz syllabus admin headings (Important Dates, Course Policies, Instructor Information, Grading Policy).",
  ];
  if (options?.courseDescription?.trim()) {
    lines.push(`Course description: ${options.courseDescription.trim().slice(0, 800)}`);
  }
  if (options?.focusTopic?.trim() && !isMetaSyllabusTopic(options.focusTopic)) {
    lines.push(`Primary focus topic: ${options.focusTopic.trim()}`);
    lines.push(
      "Weight roughly half the items toward the primary focus topic; still cover neighboring outline topics.",
    );
  }
  const usable = prioritizeQuizTopics(topics, options?.focusTopic);
  if (usable.length === 0) return lines.join("\n");

  lines.push("", "Course topics:");
  for (const topic of usable.slice(0, 24)) {
    const name = topic.name.trim();
    const detail = topic.description?.trim();
    lines.push(detail ? `- ${name}: ${detail.slice(0, 240)}` : `- ${name}`);
  }
  return lines.join("\n");
}

function rotateOptions(options: string[], seed: number): string[] {
  if (options.length === 0) return options;
  const offset = seed % options.length;
  return [...options.slice(offset), ...options.slice(0, offset)];
}

/**
 * Local bank when there is no chapter paste — conceptual MC + write-ins from topics.
 * Prefer definition / distinguish / apply / “which is NOT” stems (tutor-style),
 * not meta “which topic” items.
 */
export function quizQuestionsFromTopics(
  courseTitle: string,
  topics: QuizTopicSeed[],
  maxQuestions = QUIZ_QUESTION_MAX,
  options?: { focusTopic?: string | null },
): GeneratedQuizQuestion[] {
  const usable = prioritizeQuizTopics(topics, options?.focusTopic)
    .map((topic) => ({
      name: topic.name.trim(),
      description: topic.description?.trim() || "",
    }))
    .slice(0, 20);

  if (usable.length === 0) return [];

  const questions: GeneratedQuizQuestion[] = [];
  const course = courseTitle.trim() || "this course";
  const names = usable.map((item) => item.name);

  for (let index = 0; index < usable.length && questions.length < maxQuestions; index += 1) {
    const topic = usable[index]!;
    const others = usable.filter((_, i) => i !== index);

    // Definition MC when we have a real description
    if (topic.description.length >= 18 && questions.length < maxQuestions) {
      const distractors = others
        .filter((item) => item.description.length >= 12)
        .map((item) => item.description.slice(0, 120))
        .slice(0, 3);
      while (distractors.length < 3) {
        const peer = others[distractors.length % Math.max(1, others.length)];
        distractors.push(
          peer?.description?.length
            ? peer.description.slice(0, 120)
            : peer
              ? `A concept from “${peer.name}” rather than “${topic.name}”`
              : `A neighboring idea in ${course}, not “${topic.name}”`,
        );
      }
      const correct = topic.description.slice(0, 120);
      const options = rotateOptions([correct, ...distractors].slice(0, 4), index);
      questions.push({
        type: "MULTIPLE_CHOICE",
        prompt: `What best describes “${topic.name}” in ${course}?`,
        options,
        correctAnswer: correct,
        explanation: `From the course topic description for ${topic.name}.`,
      });
    }

    // Distinguish from a neighboring topic (exam-style association, not TOC meta)
    if (others.length > 0 && questions.length < maxQuestions) {
      const other = others[index % others.length]!;
      const options = rotateOptions(
        [topic.name, other.name, ...names.filter((n) => n !== topic.name && n !== other.name)].slice(
          0,
          4,
        ),
        index + 1,
      );
      while (options.length < 4) {
        const filler = names.find((name) => !options.includes(name));
        if (!filler) break;
        options.push(filler);
      }
      if (options.length >= 4) {
        questions.push({
          type: "MULTIPLE_CHOICE",
          prompt: `Which idea is most closely associated with “${topic.name}” (not “${other.name}”)?`,
          options: options.slice(0, 4),
          correctAnswer: topic.name,
          explanation: `${topic.name} and ${other.name} are different course topics — know how they differ.`,
        });
      }
    }

    // Which is NOT — forces discrimination between neighboring modules
    if (others.length >= 2 && questions.length < maxQuestions) {
      const wrong = others.map((item) => item.name).slice(0, 3);
      while (wrong.length < 3) {
        const filler = names.find((name) => name !== topic.name && !wrong.includes(name));
        if (!filler) break;
        wrong.push(filler);
      }
      if (wrong.length >= 3) {
        const options = rotateOptions([topic.name, ...wrong].slice(0, 4), index + 7);
        questions.push({
          type: "MULTIPLE_CHOICE",
          prompt: `Which of the following is NOT primarily about “${topic.name}”?`,
          options,
          correctAnswer: wrong[0]!,
          explanation: `${wrong[0]} is a different module; the other options relate to ${topic.name}.`,
        });
      }
    }

    if (questions.length >= maxQuestions) break;
    questions.push({
      type: "SHORT_ANSWER",
      prompt: topic.description
        ? `In one or two sentences, explain “${topic.name}”.`
        : `Explain “${topic.name}” as it is used in ${course}.`,
      correctAnswer: topic.description || `Key ideas about ${topic.name} in ${course}`,
      explanation: topic.description || undefined,
    });

    if (questions.length >= maxQuestions) break;
    questions.push({
      type: "FILL_IN_BLANK",
      prompt: `In ${course}, ____ is the module where you study ideas around “${topic.name}”.`,
      correctAnswer: topic.name,
    });

    // Apply stem when we have description
    if (topic.description.length >= 18 && questions.length < maxQuestions) {
      const wrong = others.map((item) => item.name).slice(0, 3);
      while (wrong.length < 3) {
        const filler = names.find((name) => name !== topic.name && !wrong.includes(name));
        if (!filler) break;
        wrong.push(filler);
      }
      if (wrong.length >= 3) {
        const options = rotateOptions([topic.name, ...wrong].slice(0, 4), index + 3);
        questions.push({
          type: "MULTIPLE_CHOICE",
          prompt: `A classmate asks for an example tied to: “${topic.description.slice(0, 90)}${topic.description.length > 90 ? "…" : ""}” Which topic is that?`,
          options,
          correctAnswer: topic.name,
          explanation: topic.description.slice(0, 160),
        });
      }
    }
  }

  return questions.slice(0, maxQuestions);
}

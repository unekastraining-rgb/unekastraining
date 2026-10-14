/**
 * Bundle G — Learning interactions derived from existing lesson/concept fields.
 * Recognition / transfer / explain — evaluated via existing evaluate or local select check.
 */

import type { SixLessonChunk, SixWorkedLesson } from "@/lib/csl/six-worked-lesson";
import type {
  LearningInteraction,
  LearningInteractionKind,
} from "@/lib/learning/studio/types";

function hashPick(seed: string, size: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h) % Math.max(size, 1);
}

/**
 * Build a recognition (select) interaction for the active chunk.
 * Uses misconception / neighboring titles as distractors — no new quiz engine.
 */
export function buildRecognitionInteraction(input: {
  chunk: SixLessonChunk;
  conceptTitle: string;
  neighborTitles?: string[];
  topic?: string;
}): LearningInteraction | null {
  const { chunk, conceptTitle } = input;
  const correct =
    conceptTitle.trim() ||
    chunk.title.replace(/^(Understand|Example|Apply|Check|Watch for|Break down|How)\s+/i, "").trim() ||
    chunk.title;

  const distractors = new Set<string>();
  if (chunk.misconception?.trim()) {
    // Shorten misconception into a false label if possible
    const miss = chunk.misconception.trim();
    if (miss.length < 80) distractors.add(miss);
  }
  for (const n of input.neighborTitles ?? []) {
    if (n && n.toLowerCase() !== correct.toLowerCase()) distractors.add(n);
  }
  // Generic subject-safe distractors when thin
  if (distractors.size < 2) {
    for (const d of [
      "A related but different idea",
      "An outcome, not the concept itself",
      "A study tip (not the subject idea)",
    ]) {
      if (distractors.size >= 3) break;
      distractors.add(d);
    }
  }

  const wrong = Array.from(distractors).slice(0, 3);
  const choices = [correct, ...wrong];
  // Stable shuffle from chunk title
  const seed = `${chunk.title}|${correct}`;
  for (let i = choices.length - 1; i > 0; i--) {
    const j = hashPick(`${seed}:${i}`, i + 1);
    const tmp = choices[i]!;
    choices[i] = choices[j]!;
    choices[j] = tmp;
  }
  const correctIndex = choices.findIndex(
    (c) => c.toLowerCase() === correct.toLowerCase(),
  );

  const prompt =
    chunk.role === "apply" || chunk.role === "guided"
      ? `Which concept best fits this situation?\n\n${chunk.example.slice(0, 280)}`
      : `Which idea did you just learn?`;

  return {
    kind: "select",
    label: "Recognition",
    prompt,
    choices,
    correctIndex: correctIndex >= 0 ? correctIndex : 0,
    rationale: `The teaching focused on ${correct}. The other options describe nearby or incorrect ideas.`,
  };
}

/**
 * Transfer: new situation without naming the concept in the stem.
 */
export function buildTransferInteraction(input: {
  chunk: SixLessonChunk;
  conceptTitle: string;
  lesson?: SixWorkedLesson | null;
  neighborTitles?: string[];
}): LearningInteraction {
  const { chunk, conceptTitle, lesson } = input;
  const transferFromLesson = lesson?.practicePrompts?.find((p) =>
    /transfer|new situation|without (looking|notes)|apply what/i.test(
      `${p.title} ${p.prompt}`,
    ),
  );

  if (transferFromLesson) {
    const hasChoices = Boolean(
      input.neighborTitles && input.neighborTitles.length >= 2,
    );
    if (hasChoices) {
      const choices = Array.from(
        new Set([conceptTitle, ...(input.neighborTitles ?? [])]),
      ).slice(0, 4);
      const seed = transferFromLesson.prompt;
      for (let i = choices.length - 1; i > 0; i--) {
        const j = hashPick(`${seed}:${i}`, i + 1);
        const tmp = choices[i]!;
        choices[i] = choices[j]!;
        choices[j] = tmp;
      }
      return {
        kind: "transfer",
        label: "Transfer",
        prompt: transferFromLesson.prompt,
        choices,
        correctIndex: choices.findIndex(
          (c) => c.toLowerCase() === conceptTitle.toLowerCase(),
        ),
        rationale: `This new situation is best analyzed with ${conceptTitle}.`,
      };
    }
    return {
      kind: "transfer",
      label: "Transfer",
      prompt: transferFromLesson.prompt,
    };
  }

  const scenario =
    chunk.example?.trim() ||
    `A new situation appears that seems different from the worked example.`;

  // Flip framing: ask which concept applies without saying the answer in the stem.
  const neighbors = (input.neighborTitles ?? []).filter(
    (t) => t.toLowerCase() !== conceptTitle.toLowerCase(),
  );
  if (neighbors.length >= 1) {
    const choices = [conceptTitle, ...neighbors].slice(0, 4);
    const seed = `${conceptTitle}|transfer`;
    for (let i = choices.length - 1; i > 0; i--) {
      const j = hashPick(`${seed}:${i}`, i + 1);
      const tmp = choices[i]!;
      choices[i] = choices[j]!;
      choices[j] = tmp;
    }
    return {
      kind: "transfer",
      label: "Transfer",
      prompt: `New situation (do not assume the label):\n\n${scenario.slice(0, 320)}\n\nWhich concept should guide your decision?`,
      choices,
      correctIndex: choices.findIndex(
        (c) => c.toLowerCase() === conceptTitle.toLowerCase(),
      ),
      rationale: `Even in a new framing, the governing idea is ${conceptTitle}.`,
    };
  }

  return {
    kind: "transfer",
    label: "Transfer",
    prompt: `New situation:\n\n${scenario.slice(0, 320)}\n\nExplain which idea applies and how you would use it. Do not only restate a definition.`,
  };
}

export function buildExplainInteraction(input: {
  chunk: SixLessonChunk;
  topic: string;
}): LearningInteraction {
  const prompt =
    input.chunk.checkPrompt?.trim() ||
    `In your own words, explain ${input.chunk.title} and give one concrete example.`;
  return {
    kind: "explain",
    label: "Explain",
    prompt,
  };
}

export function buildApplyInteraction(input: {
  chunk: SixLessonChunk;
  conceptTitle: string;
  lesson?: SixWorkedLesson | null;
}): LearningInteraction {
  const fromPractice = input.lesson?.practicePrompts?.find((p) =>
    /apply|practice|use/i.test(p.title),
  );
  return {
    kind: "apply",
    label: "Apply",
    prompt:
      fromPractice?.prompt ||
      input.chunk.checkPrompt?.trim() ||
      `Apply ${input.conceptTitle} to a realistic situation. State your decision and why.`,
  };
}

/**
 * Choose the primary interaction for a chunk based on role + lesson prompts.
 */
export function resolveChunkInteraction(input: {
  chunk: SixLessonChunk;
  conceptTitle: string;
  topic: string;
  neighborTitles?: string[];
  lesson?: SixWorkedLesson | null;
  momentKind?: "recognize" | "explain" | "apply" | "transfer" | "auto";
}): LearningInteraction {
  const kind = input.momentKind ?? "auto";
  if (kind === "recognize") {
    return (
      buildRecognitionInteraction(input) ??
      buildExplainInteraction(input)
    );
  }
  if (kind === "transfer") {
    return buildTransferInteraction(input);
  }
  if (kind === "apply") {
    return buildApplyInteraction(input);
  }
  if (kind === "explain") {
    return buildExplainInteraction(input);
  }

  // auto
  if (input.chunk.role === "apply") {
    return buildTransferInteraction(input);
  }
  if (input.chunk.role === "check" || input.chunk.role === "guided") {
    return (
      buildRecognitionInteraction(input) ?? buildExplainInteraction(input)
    );
  }
  if (input.chunk.role === "clarify") {
    return (
      buildRecognitionInteraction(input) ?? buildExplainInteraction(input)
    );
  }
  if (input.chunk.checkPrompt?.trim()) {
    // Prefer recognition mid-path; explain on last-style checks
    if (
      /own words|explain|describe/i.test(input.chunk.checkPrompt) ||
      input.chunk.role === "concept" ||
      input.chunk.role === "explain"
    ) {
      return buildExplainInteraction(input);
    }
    return (
      buildRecognitionInteraction(input) ?? buildExplainInteraction(input)
    );
  }
  return buildExplainInteraction(input);
}

export function evaluateSelectInteraction(
  interaction: LearningInteraction,
  selectedIndex: number,
): {
  correct: boolean;
  score: number;
  summary: string;
  strengths: string[];
  gaps: string[];
  misconceptions: string[];
  nextSteps: string[];
} {
  const correct =
    typeof interaction.correctIndex === "number" &&
    selectedIndex === interaction.correctIndex;
  const chosen = interaction.choices?.[selectedIndex] ?? "your choice";
  const right =
    typeof interaction.correctIndex === "number"
      ? interaction.choices?.[interaction.correctIndex]
      : undefined;

  if (correct) {
    return {
      correct: true,
      score: 100,
      summary: "That matches the idea you just learned.",
      strengths: [
        interaction.rationale ??
          `${chosen} is the concept that fits this teaching moment.`,
      ],
      gaps: [],
      misconceptions: [],
      nextSteps: ["Continue to the next instructional step."],
    };
  }

  return {
    correct: false,
    score: 35,
    summary: "Not quite.",
    strengths: [],
    gaps: [
      right
        ? `Your answer focused on “${chosen}.” The key idea here is “${right}.”`
        : `Revisit the core idea, then try again.`,
    ],
    misconceptions: interaction.rationale ? [interaction.rationale] : [],
    nextSteps: ["Try again after re-reading the core idea and example."],
  };
}

export function isSelectInteraction(
  interaction: LearningInteraction | null | undefined,
): interaction is LearningInteraction & {
  kind: LearningInteractionKind;
  choices: string[];
} {
  return Boolean(
    interaction &&
      interaction.choices &&
      interaction.choices.length >= 2 &&
      typeof interaction.correctIndex === "number",
  );
}

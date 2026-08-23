import type { LuckyActivity } from "./lucky";
import type { StudyBlock } from "./study-now";

export interface LuckyEngineContext {
  missedQuestions: number;
  dueFlashcards: number;
  weakTopics: number;
  lowUnderstanding: number;
  lowRecall: number;
}

export interface LuckySessionPlan {
  summary: string;
  totalMinutes: 30 | 45 | 60;
  blocks: Array<StudyBlock & { phase: string }>;
}

function block(
  id: string,
  phase: string,
  minutes: number,
  label: string,
  activity: LuckyActivity | "missed-review",
  href: string,
): StudyBlock & { phase: string } {
  return { id, phase, minutes, label, activity, href };
}

export function buildLuckySession(context: LuckyEngineContext): LuckySessionPlan {
  const steps: Array<StudyBlock & { phase: string }> = [];

  steps.push(
    block("learn", "Learn", 5, "Learn — review Core notes", "teach-me", "/core"),
  );

  if (context.lowUnderstanding > 0) {
    steps.push(
      block(
        "understand",
        "Understand",
        8,
        "Understand — explain with Teach Me",
        "teach-me",
        "/study/teach-me",
      ),
    );
  } else {
    steps.push(
      block(
        "understand",
        "Understand",
        5,
        "Understand — chunk one concept",
        "teach-me",
        "/study/six/chunking",
      ),
    );
  }

  steps.push(
    block("recall", "Recall", 7, "Recall — blurt without notes", "blurting", "/study/blurting"),
  );

  steps.push(
    block("challenge", "Challenge", 10, "Challenge — adaptive quiz", "quiz", "/quizzes"),
  );

  if (context.missedQuestions > 0) {
    steps.push(
      block(
        "gaps",
        "Identify gaps",
        5,
        "Identify gaps — missed questions",
        "missed-review",
        "/quizzes?filter=missed",
      ),
      block(
        "correct",
        "Correct",
        8,
        "Correct — fix misconceptions",
        "missed-review",
        "/quizzes?filter=missed",
      ),
    );
  } else if (context.weakTopics > 0) {
    steps.push(
      block(
        "gaps",
        "Identify gaps",
        5,
        "Identify gaps — weak topics",
        "mixed-review",
        "/study/mixed",
      ),
    );
  }

  if (context.dueFlashcards > 0) {
    steps.push(
      block(
        "space",
        "Space",
        8,
        "Space — due flashcards",
        "flashcards",
        "/flashcards",
      ),
    );
  } else {
    steps.push(
      block(
        "space",
        "Space",
        5,
        "Space — schedule next review",
        "spaced-review",
        "/flashcards",
      ),
    );
  }

  steps.push(
    block(
      "rerecall",
      "Re-recall",
      5,
      "Re-recall — quick blurting",
      "blurting",
      "/study/blurting",
    ),
    block("master", "Master", 5, "Master — final quiz check", "quiz", "/quizzes"),
  );

  const totalMinutes = steps.reduce((sum, step) => sum + step.minutes, 0);
  const bucket: 30 | 45 | 60 =
    totalMinutes <= 35 ? 30 : totalMinutes <= 50 ? 45 : 60;

  const trimmed =
    bucket === 30
      ? steps.filter((step) => !["gaps", "rerecall"].includes(step.id)).slice(0, 5)
      : bucket === 45
        ? steps.filter((step) => step.id !== "gaps" || context.missedQuestions > 0).slice(0, 7)
        : steps;

  return {
    summary: `Full Lucky loop: ${trimmed.map((s) => s.phase).join(" → ")}.`,
    totalMinutes: bucket,
    blocks: trimmed,
  };
}

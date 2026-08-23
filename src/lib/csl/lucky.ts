export type LuckyActivity =
  | "quiz"
  | "flashcards"
  | "blurting"
  | "teach-me"
  | "practice"
  | "mixed-review"
  | "quick-mixed-review"
  | "spaced-review";

export interface LuckyStudyOption {
  id: LuckyActivity;
  title: string;
  emoji: string;
  description: string;
  href: string;
}

export const LUCKY_PROCESS = [
  "Learn",
  "Understand",
  "Recall",
  "Challenge",
  "Identify gaps",
  "Correct",
  "Space",
  "Re-recall",
  "Master",
] as const;

export const LUCKY_ACTIVITIES: LuckyStudyOption[] = [
  {
    id: "mixed-review",
    title: "Lucky Engine",
    emoji: "🍀",
    description: "Full retention loop: learn → recall → challenge → correct → master.",
    href: "/study/lucky",
  },
  {
    id: "quiz",
    title: "Quiz",
    emoji: "📝",
    description: "Multiple choice, true/false, short answer, and scenario questions.",
    href: "/quizzes",
  },
  {
    id: "flashcards",
    title: "Flashcards",
    emoji: "🃏",
    description: "Spaced repetition with Again / Good / Easy ratings.",
    href: "/flashcards",
  },
  {
    id: "blurting",
    title: "Blurting",
    emoji: "💭",
    description: "Write everything you remember, then compare against your notes.",
    href: "/study/blurting",
  },
  {
    id: "teach-me",
    title: "Teach Me",
    emoji: "🎓",
    description: "Feynman-style teach-back — explain it and get feedback.",
    href: "/study/teach-me",
  },
  {
    id: "practice",
    title: "Practice",
    emoji: "⚡",
    description: "Hands-on problems, coding exercises, and scenarios.",
    href: "/study/practice",
  },
  {
    id: "quick-mixed-review",
    title: "Quick Mixed Review",
    emoji: "🔀",
    description: "Shorter adaptive combo based on your mastery gaps.",
    href: "/study/mixed",
  },
  {
    id: "spaced-review",
    title: "Spaced Review",
    emoji: "📅",
    description: "Review topics on your retention schedule.",
    href: "/flashcards",
  },
];

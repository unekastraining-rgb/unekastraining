export interface StudyTechnique {
  id: string;
  title: string;
  emoji: string;
  description: string;
  durationMinutes: number;
  href: string;
}

export interface RecommendedSession {
  id: string;
  title: string;
  emoji: string;
  description: string;
  durationMinutes: number;
  timeOfDay: "morning" | "afternoon" | "evening";
  href: string;
}

export const ELEMENTARY_TECHNIQUES: StudyTechnique[] = [
  {
    id: "pomodoro",
    title: "Pomodoro Power",
    emoji: "🍅",
    description: "Study for 25 minutes, then take a 5-minute break.",
    durationMinutes: 25,
    href: "/study",
  },
  {
    id: "teach-back",
    title: "Teach It Back",
    emoji: "🗣️",
    description: "Explain what you learned to a stuffed animal or family member.",
    durationMinutes: 15,
    href: "/study/teach-me",
  },
  {
    id: "flashcards",
    title: "Flashcard Flip",
    emoji: "🃏",
    description: "Make cards with a question on one side and answer on the other.",
    durationMinutes: 20,
    href: "/flashcards",
  },
  {
    id: "draw-it",
    title: "Draw It Out",
    emoji: "🎨",
    description: "Turn hard ideas into pictures or diagrams.",
    durationMinutes: 20,
    href: "/core",
  },
  {
    id: "read-aloud",
    title: "Read Aloud",
    emoji: "📖",
    description: "Read your notes out loud to help them stick.",
    durationMinutes: 15,
    href: "/core",
  },
];

export function getRecommendedSessions(date = new Date()): RecommendedSession[] {
  const day = date.getDay();
  const isWeekend = day === 0 || day === 6;

  if (isWeekend) {
    return [
      {
        id: "weekend-review",
        title: "Weekend Review",
        emoji: "🌈",
        description: "Look over what you learned this week and celebrate wins!",
        durationMinutes: 20,
        timeOfDay: "morning",
        href: "/study/lucky",
      },
      {
        id: "fun-flashcards",
        title: "Fun Flashcards",
        emoji: "⭐",
        description: "Quiz yourself with colorful cards or a family helper.",
        durationMinutes: 15,
        timeOfDay: "afternoon",
        href: "/flashcards",
      },
    ];
  }

  return [
    {
      id: "morning-warmup",
      title: "Morning Warm-up",
      emoji: "☀️",
      description: "Spend 10 minutes reviewing yesterday's notes.",
      durationMinutes: 10,
      timeOfDay: "morning",
      href: "/flashcards",
    },
    {
      id: "homework-focus",
      title: "Homework Focus",
      emoji: "✏️",
      description: "Pick one assignment and work on it with no distractions.",
      durationMinutes: 30,
      timeOfDay: "afternoon",
      href: "/dashboard",
    },
    {
      id: "bedtime-recap",
      title: "Bedtime Recap",
      emoji: "🌙",
      description: "Say three things you learned today before bed.",
      durationMinutes: 5,
      timeOfDay: "evening",
      href: "/study/teach-me",
    },
  ];
}

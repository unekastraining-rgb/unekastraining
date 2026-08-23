export type SixComponent =
  | "chunking"
  | "detailed-explanation"
  | "feynman"
  | "visualization"
  | "hands-on-practice"
  | "active-recall";

export interface SixActivity {
  id: SixComponent;
  title: string;
  emoji: string;
  description: string;
  whenToUse: string;
}

export const SIX_ACTIVITIES: SixActivity[] = [
  {
    id: "chunking",
    title: "Chunking",
    emoji: "🧩",
    description: "Break complex material into smaller, manageable pieces.",
    whenToUse: "Complex concepts with many moving parts",
  },
  {
    id: "detailed-explanation",
    title: "Detailed Explanation",
    emoji: "📖",
    description: "Walk through the concept step by step until it clicks.",
    whenToUse: "You feel confused or lost",
  },
  {
    id: "feynman",
    title: "Feynman Technique",
    emoji: "🗣️",
    description: "Explain the idea in plain language like you're teaching a friend.",
    whenToUse: "You can't explain it simply yet",
  },
  {
    id: "visualization",
    title: "Visualization",
    emoji: "🎨",
    description: "Draw diagrams, maps, or mental pictures of the concept.",
    whenToUse: "Abstract or relational ideas",
  },
  {
    id: "hands-on-practice",
    title: "Hands-on Practice",
    emoji: "⌨️",
    description: "Apply the concept through problems, code, or scenarios.",
    whenToUse: "Programming, math, or application-heavy topics",
  },
  {
    id: "active-recall",
    title: "Active Recall",
    emoji: "🧠",
    description: "Test yourself without looking at notes.",
    whenToUse: "You're ready to check what you actually remember",
  },
];

export function recommendSixComponent(signals: {
  confused?: boolean;
  complex?: boolean;
  abstract?: boolean;
  practical?: boolean;
  readyToTest?: boolean;
}): SixComponent {
  if (signals.readyToTest) return "active-recall";
  if (signals.confused) return "detailed-explanation";
  if (signals.complex) return "chunking";
  if (signals.abstract) return "visualization";
  if (signals.practical) return "hands-on-practice";
  return "feynman";
}

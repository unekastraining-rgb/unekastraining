import type { SixComponent } from "./six";

export interface SixGuideStep {
  title: string;
  prompt: string;
  tip: string;
}

export interface SixGuide {
  component: SixComponent;
  intro: string;
  steps: SixGuideStep[];
  activityHref: string;
  activityLabel: string;
}

export const SIX_GUIDES: Record<SixComponent, SixGuide> = {
  chunking: {
    component: "chunking",
    intro: "Break the material into bite-sized pieces you can explain one at a time.",
    steps: [
      {
        title: "List the big pieces",
        prompt: "Write 3–5 major chunks of today's topic without looking at notes.",
        tip: "Each chunk should be something you could teach in 2 minutes.",
      },
      {
        title: "Order them",
        prompt: "Put chunks in learning order — what must come first?",
        tip: "Use Core Notes outline mode to nest sub-chunks.",
      },
      {
        title: "Name each chunk",
        prompt: "Give each chunk a one-line label you'd remember on an exam.",
        tip: "If a label is vague, the chunk is still too big.",
      },
    ],
    activityHref: "/core",
    activityLabel: "Organize in Core Notes",
  },
  "detailed-explanation": {
    component: "detailed-explanation",
    intro: "Walk through the concept step by step until each step makes sense.",
    steps: [
      {
        title: "State the goal",
        prompt: "In one sentence, what is this concept trying to accomplish?",
        tip: "Start with why before how.",
      },
      {
        title: "Step through",
        prompt: "List each step of the process or argument in order.",
        tip: "Number steps — gaps in numbering reveal gaps in understanding.",
      },
      {
        title: "Check each step",
        prompt: "For each step, ask: could I explain this to someone else?",
        tip: "Flag any step you'd skip when explaining — that's your focus.",
      },
    ],
    activityHref: "/study/teach-me",
    activityLabel: "Explain with Teach Me",
  },
  feynman: {
    component: "feynman",
    intro: "Explain it simply, as if teaching a friend who knows nothing about the topic.",
    steps: [
      {
        title: "Plain language",
        prompt: "Explain the topic with no jargon for 3–5 sentences.",
        tip: "Every jargon word is a concept you haven't simplified yet.",
      },
      {
        title: "Analogy",
        prompt: "Pick one real-world analogy that maps to the core idea.",
        tip: "If the analogy breaks, note where — that's a misconception risk.",
      },
      {
        title: "Teach back",
        prompt: "Record or write a full teach-back and submit for AI feedback.",
        tip: "Use course materials only if you want syllabus-aligned grading.",
      },
    ],
    activityHref: "/study/teach-me",
    activityLabel: "Open Teach Me",
  },
  visualization: {
    component: "visualization",
    intro: "Turn abstract ideas into diagrams, maps, or mental pictures.",
    steps: [
      {
        title: "Central concept",
        prompt: "Put the main idea in the center of a mind map.",
        tip: "Core Notes → Mind map template works great here.",
      },
      {
        title: "Branch relationships",
        prompt: "Add branches for causes, effects, comparisons, and examples.",
        tip: "Double-click nodes to connect related ideas.",
      },
      {
        title: "Sketch it",
        prompt: "Draw a quick diagram without words — labels only after.",
        tip: "Switch to Sketch tool to add arrows and highlights.",
      },
    ],
    activityHref: "/core",
    activityLabel: "Open Core mind map",
  },
  "hands-on-practice": {
    component: "hands-on-practice",
    intro: "Apply the concept through problems, code, or scenarios.",
    steps: [
      {
        title: "Pick a problem",
        prompt: "Choose one practice problem at the edge of your comfort zone.",
        tip: "Quizzes can generate scenario questions from your course.",
      },
      {
        title: "Work without notes",
        prompt: "Attempt the full solution before checking references.",
        tip: "Blurting what you tried counts — write your approach first.",
      },
      {
        title: "Review mistakes",
        prompt: "After checking, list what you'd do differently next time.",
        tip: "Missed questions recycle into future Lucky sessions.",
      },
    ],
    activityHref: "/study/practice",
    activityLabel: "Go to Practice",
  },
  "active-recall": {
    component: "active-recall",
    intro: "Test yourself without looking at notes — retrieval strengthens memory.",
    steps: [
      {
        title: "Close the book",
        prompt: "Hide all materials. List everything you remember about the topic.",
        tip: "Blurting mode is built for this exact step.",
      },
      {
        title: "Flashcard sprint",
        prompt: "Run through due flashcards — Again / Good / Easy.",
        tip: "Cards you mark Again come back sooner automatically.",
      },
      {
        title: "Quick quiz",
        prompt: "Take a short quiz to verify recall under pressure.",
        tip: "Filter missed questions if you want to fix specific gaps.",
      },
    ],
    activityHref: "/flashcards",
    activityLabel: "Review flashcards",
  },
};

export function sixGuideHref(
  component: SixComponent,
  params?: {
    courseId?: string;
    topicId?: string;
    topicName?: string;
  },
) {
  const base = `/study/six/${component}`;
  if (!params) return base;

  const search = new URLSearchParams();
  if (params.courseId) search.set("courseId", params.courseId);
  if (params.topicId) search.set("topicId", params.topicId);
  if (params.topicName) search.set("topic", params.topicName);

  const query = search.toString();
  return query ? `${base}?${query}` : base;
}

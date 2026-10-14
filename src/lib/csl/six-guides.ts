import type { SixComponent } from "./six";
import { SIX_ACTIVITIES } from "./six";

export interface SixGuideStep {
  title: string;
  prompt: string;
  tip: string;
}

export interface SixGuide {
  component: SixComponent;
  /** Short name shown in sessions */
  title: string;
  /** What this technique is */
  whatItMeans: string;
  /** One-line intro for the guided page */
  intro: string;
  /** Do-this-now directives */
  howTo: string[];
  /** Concrete examples (use {topic} placeholder) */
  examples: string[];
  steps: SixGuideStep[];
  activityHref: string;
  activityLabel: string;
}

export const SIX_GUIDES: Record<SixComponent, SixGuide> = {
  chunking: {
    component: "chunking",
    title: "Chunking",
    whatItMeans:
      "Chunking means breaking a big idea into small labeled pieces that build on each other — then learning one piece at a time (not rereading the whole chapter).",
    intro:
      "First get a taught map of chunks for your topic, then cover it and reconstruct from memory.",
    howTo: [
      "Build a worked example for {topic} — Study Haul teaches 4–6 progressive chunks with examples.",
      "Read the map once: titles, explanations, one concrete example each.",
      "Cover the lesson. List the chunk titles of {topic} in order from memory.",
      "Explain one chunk with an example without looking.",
      "Teach the whole idea of {topic} using your chunks as the outline.",
    ],
    examples: [
      "For Object-Oriented Design, strong chunks look like: (1) Classes & Objects, (2) Fields, (3) Methods, (4) Encapsulation, (5) Inheritance / Polymorphism / Abstraction, (6) Design a tiny program — not “Chapter 1 stuff.”",
      "Weak prompt: “Chunk Instructor & Course Information.” Strong: “Chunk Object-Oriented Design into teachable 2-minute pieces.”",
      "For {topic}: you should finish able to say what chunking is AND explain the topic using your chunk titles.",
    ],
    steps: [
      {
        title: "Recall the map",
        prompt:
          "Cover the worked example. List 3–5 major chunks of {topic} in learning order from memory.",
        tip: "If a chunk needs more than ~2 minutes to explain, it should have been split.",
      },
      {
        title: "Explain one chunk",
        prompt:
          "Pick one chunk of {topic} and explain it with a concrete example — no notes.",
        tip: "Use the lesson’s example style, then invent one of your own.",
      },
      {
        title: "Teach the whole idea",
        prompt:
          "In 6–8 sentences, teach {topic} using your chunks as the outline.",
        tip: "End with the mental model from the cheat sheet.",
      },
    ],
    activityHref: "/core",
    activityLabel: "Organize in Core Notes",
  },
  "detailed-explanation": {
    component: "detailed-explanation",
    title: "Detailed explanation",
    whatItMeans:
      "Walk the idea step by step until every step makes sense — like writing a mini how-to for yourself.",
    intro: "Walk through the concept step by step until each step makes sense.",
    howTo: [
      "Write one sentence: what is {topic} trying to explain or accomplish?",
      "List the steps or parts in order (1, 2, 3…).",
      "Under each step, add a short “why this matters” note.",
      "Mark any step you would skip when explaining — that is your weak spot.",
      "Re-explain the marked steps without looking at the textbook.",
    ],
    examples: [
      "For profit: (1) Revenue comes in, (2) Expenses go out, (3) What’s left is profit — or a loss if expenses win.",
      "For {topic}: number the steps on paper, then cover the book and recreate the list.",
    ],
    steps: [
      {
        title: "State the goal",
        prompt: "In one sentence, what is {topic} trying to accomplish?",
        tip: "Start with why before how.",
      },
      {
        title: "Step through",
        prompt: "List each step of the process or argument for {topic} in order.",
        tip: "Gaps in numbering reveal gaps in understanding.",
      },
      {
        title: "Check each step",
        prompt: "For each step of {topic}, ask: could I explain this to someone else?",
        tip: "Flag any step you’d skip — study that one next.",
      },
    ],
    activityHref: "/study/teach-me",
    activityLabel: "Explain with Teach Me",
  },
  feynman: {
    component: "feynman",
    title: "Feynman technique",
    whatItMeans:
      "Explain the idea in plain words as if teaching a friend who knows nothing about it. Jargon you can’t simplify is a gap.",
    intro: "Explain it simply, as if teaching a friend who knows nothing about the topic.",
    howTo: [
      "Close the book. Explain {topic} in 4–6 plain sentences.",
      "Circle every jargon word you used — define each in everyday language.",
      "Add one real-world analogy that maps to the core idea.",
      "Where the analogy breaks, write what the textbook actually means.",
      "Re-teach once more without notes.",
    ],
    examples: [
      "Stakeholders → “Everyone who can be helped or hurt by what the business does — workers, customers, suppliers, community.”",
      "For {topic}: teach it out loud for 60 seconds, then rewrite any word you couldn’t say simply.",
    ],
    steps: [
      {
        title: "Plain language",
        prompt: "Explain {topic} with no jargon for 3–5 sentences.",
        tip: "Every jargon word is a concept you haven’t simplified yet.",
      },
      {
        title: "Analogy",
        prompt: "Pick one real-world analogy that maps to the core idea of {topic}.",
        tip: "If the analogy breaks, note where — that’s a misconception risk.",
      },
      {
        title: "Teach back",
        prompt: "Write a full teach-back of {topic} and get coaching on it.",
        tip: "Use course materials if you want syllabus-aligned feedback.",
      },
    ],
    activityHref: "/study/teach-me",
    activityLabel: "Open Teach Me",
  },
  visualization: {
    component: "visualization",
    title: "Visualization",
    whatItMeans:
      "Turn ideas into a diagram or map so relationships are visible — boxes, arrows, comparisons.",
    intro: "Turn abstract ideas into diagrams, maps, or mental pictures.",
    howTo: [
      "Put the main idea of {topic} in the center of a page.",
      "Add branches for definitions, examples, causes/effects, and contrasts.",
      "Draw arrows that show “leads to,” “vs,” or “includes.”",
      "Cover labels and redraw from memory.",
    ],
    examples: [
      "Business map: Business → Goods / Services → Revenue − Expenses → Profit or Loss; side branch: Stakeholders.",
      "For {topic}: one center node + at least 4 branches with an example on each.",
    ],
    steps: [
      {
        title: "Central concept",
        prompt: "Put the main idea of {topic} in the center of a mind map.",
        tip: "Core Notes → Mind map works well here.",
      },
      {
        title: "Branch relationships",
        prompt: "Add branches for causes, effects, comparisons, and examples of {topic}.",
        tip: "Connect related ideas with arrows.",
      },
      {
        title: "Sketch it",
        prompt: "Draw a quick diagram of {topic} with few words — labels only after.",
        tip: "Use Sketch in Core for arrows and highlights.",
      },
    ],
    activityHref: "/core",
    activityLabel: "Open Core mind map",
  },
  "hands-on-practice": {
    component: "hands-on-practice",
    title: "Hands-on practice",
    whatItMeans:
      "Apply the idea to a problem, scenario, or example — don’t just reread definitions.",
    intro: "Apply the concept through problems, code, or scenarios.",
    howTo: [
      "Pick one practice question or scenario about {topic}.",
      "Solve or answer it without looking at notes first.",
      "Check the answer, then write what you’d do differently.",
      "Do one more similar item while the correction is fresh.",
    ],
    examples: [
      "Scenario: A café’s expenses beat its revenue this month — is that profit or loss? Name two stakeholder groups affected.",
      "For {topic}: invent one exam-style scenario and answer it in 4–6 sentences.",
    ],
    steps: [
      {
        title: "Pick a problem",
        prompt: "Choose one practice problem at the edge of your comfort zone for {topic}.",
        tip: "Quizzes can generate scenario questions from your course.",
      },
      {
        title: "Work without notes",
        prompt: "Attempt the full solution for {topic} before checking references.",
        tip: "Write your approach first — even if incomplete.",
      },
      {
        title: "Review mistakes",
        prompt: "After checking, list what you’d do differently next time on {topic}.",
        tip: "Missed questions recycle into future Lucky sessions.",
      },
    ],
    activityHref: "/study/practice",
    activityLabel: "Go to Practice",
  },
  "active-recall": {
    component: "active-recall",
    title: "Active recall",
    whatItMeans:
      "Test yourself from memory — closing the book forces your brain to retrieve, which strengthens learning.",
    intro: "Test yourself without looking at notes — retrieval strengthens memory.",
    howTo: [
      "Hide all materials. Blurt everything you remember about {topic} for 3 minutes.",
      "Check notes and mark what you missed in a different color.",
      "Turn missed items into flashcards or quiz questions.",
      "Retest those missed items once more before you stop.",
    ],
    examples: [
      "Close the book and define: business, profit, loss, risk, stakeholders, outsourcing — then check.",
      "For {topic}: write 5 questions you think could be on the exam, answer them from memory, then verify.",
    ],
    steps: [
      {
        title: "Close the book",
        prompt: "Hide all materials. List everything you remember about {topic}.",
        tip: "Blurting mode is built for this exact step.",
      },
      {
        title: "Flashcard sprint",
        prompt: "Run through due flashcards for {topic} — Again / Good / Easy.",
        tip: "Cards you mark Again come back sooner automatically.",
      },
      {
        title: "Quick quiz",
        prompt: "Take a short quiz to verify recall on {topic}.",
        tip: "Filter missed questions if you want to fix specific gaps.",
      },
    ],
    activityHref: "/flashcards",
    activityLabel: "Review flashcards",
  },
};

function fillTopic(text: string, topic: string) {
  return text.replaceAll("{topic}", topic);
}

export function personalizeSixGuide(
  component: SixComponent,
  options?: { topicName?: string; courseTitle?: string },
): SixGuide {
  const base = SIX_GUIDES[component];
  const topic =
    options?.topicName?.trim() ||
    options?.courseTitle?.trim() ||
    "this topic";

  return {
    ...base,
    whatItMeans: fillTopic(base.whatItMeans, topic),
    intro: fillTopic(base.intro, topic),
    howTo: base.howTo.map((item) => fillTopic(item, topic)),
    examples: base.examples.map((item) => fillTopic(item, topic)),
    steps: base.steps.map((step) => ({
      ...step,
      prompt: fillTopic(step.prompt, topic),
      tip: fillTopic(step.tip, topic),
    })),
  };
}

export function isSixGuideComponent(value: string): value is SixComponent {
  return Object.prototype.hasOwnProperty.call(SIX_GUIDES, value);
}

export function sixGuideHref(
  component: SixComponent,
  params?: {
    courseId?: string;
    topicId?: string;
    topicName?: string;
    materialId?: string;
    /** Opaque AdaptiveSequenceRun id — optional caller context only. */
    adaptiveRunId?: string;
    /** Adaptive sequence currentStepIndex — validated server-side. */
    adaptiveStep?: number;
  },
) {
  const base = `/study/six/${component}`;
  if (!params) return base;

  const search = new URLSearchParams();
  if (params.courseId) search.set("courseId", params.courseId);
  if (params.topicId) search.set("topicId", params.topicId);
  if (params.topicName) search.set("topic", params.topicName);
  if (params.materialId) search.set("materialId", params.materialId);
  if (params.adaptiveRunId) search.set("adaptiveRunId", params.adaptiveRunId);
  if (
    typeof params.adaptiveStep === "number" &&
    Number.isFinite(params.adaptiveStep) &&
    params.adaptiveStep >= 0
  ) {
    search.set("adaptiveStep", String(Math.floor(params.adaptiveStep)));
  }

  const query = search.toString();
  return query ? `${base}?${query}` : base;
}

/**
 * Contextualize static guide.activityHref with course/material so Six → Core/Lucky
 * stays inside the Study Haul loop (not a naked /core or /flashcards dump).
 */
export function resolveSixActivityHref(
  guide: SixGuide,
  params: {
    courseId?: string;
    materialId?: string | null;
    topicName?: string;
  },
): string {
  const href = guide.activityHref;
  const courseId = params.courseId?.trim();
  const materialId = params.materialId?.trim();
  const topic = params.topicName?.trim();

  if (href === "/core" || href.startsWith("/core?")) {
    if (!courseId) return "/core";
    const search = new URLSearchParams();
    search.set("courseId", courseId);
    if (materialId) search.set("materialId", materialId);
    return `/core?${search.toString()}`;
  }

  if (href.startsWith("/flashcards")) {
    if (!courseId) return href;
    const search = new URLSearchParams();
    search.set("courseId", courseId);
    if (materialId) search.set("materialId", materialId);
    if (topic) search.set("topic", topic);
    return `/flashcards?${search.toString()}`;
  }

  if (href.startsWith("/study/teach-me")) {
    if (!courseId) return href;
    const search = new URLSearchParams({ courseId });
    if (topic) search.set("topic", topic);
    if (materialId) search.set("materialId", materialId);
    return `/study/teach-me?${search.toString()}`;
  }

  if (href.startsWith("/study/practice") || href.startsWith("/study/blurting")) {
    if (!courseId) return href;
    const search = new URLSearchParams({ courseId });
    if (topic) search.set("topic", topic);
    if (materialId) search.set("materialId", materialId);
    return `${href.split("?")[0]}?${search.toString()}`;
  }

  if (!courseId) return href;
  if (href.includes("courseId=")) return href;
  return `${href}${href.includes("?") ? "&" : "?"}courseId=${encodeURIComponent(courseId)}`;
}

export function sixActivityTitle(component: SixComponent) {
  return (
    SIX_ACTIVITIES.find((item) => item.id === component)?.title ??
    SIX_GUIDES[component].title
  );
}

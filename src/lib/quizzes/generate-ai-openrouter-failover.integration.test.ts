import { beforeEach, describe, expect, it, vi } from "vitest";

import type { GeneratedQuizQuestion } from "@/lib/quizzes/types";

const { mockComplete, mockQuizCreate, mockCourseFindFirst } = vi.hoisted(() => ({
  mockComplete: vi.fn(),
  mockQuizCreate: vi.fn(),
  mockCourseFindFirst: vi.fn(),
}));

vi.mock("@/lib/ai", () => ({
  aiService: { complete: mockComplete },
}));

vi.mock("@/lib/ai/is-configured", () => ({
  isAIConfigured: () => true,
}));

vi.mock("@/lib/db", () => ({
  db: {
    course: { findFirst: mockCourseFindFirst },
    courseMaterial: { findFirst: vi.fn() },
    quiz: { create: mockQuizCreate },
  },
}));

vi.mock("@/lib/syllabus/enrich-course-from-syllabus", () => ({
  backfillCourseTopicsIfEmpty: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/core/study-extract-store", () => ({
  loadPersistedStudyExtract: vi.fn().mockResolvedValue(null),
  formatStudyExtractContext: vi.fn().mockReturnValue(""),
}));

vi.mock("@/lib/settings/app-settings", () => ({
  getUserAppSettings: vi.fn().mockResolvedValue({ aiUseOpenAIPro: false }),
  aiSourceInstruction: vi.fn().mockReturnValue(""),
}));

vi.mock("@/lib/topics", () => ({
  getOrCreateDefaultTopic: vi.fn().mockResolvedValue({ id: "topic-1", name: "Osmosis" }),
}));

import { generateQuizForCourse } from "@/lib/quizzes/generate";

const goodQuestions: GeneratedQuizQuestion[] = [
  {
    type: "MULTIPLE_CHOICE",
    prompt: "Which process moves water across a selectively permeable membrane?",
    options: ["Osmosis", "Phagocytosis", "Active transport", "Exocytosis"],
    correctAnswer: "Osmosis",
    explanation: "Osmosis is diffusion of water.",
  },
  {
    type: "MULTIPLE_CHOICE",
    prompt: "Which structure controls what enters and leaves the cell?",
    options: ["Nucleus", "Plasma membrane", "Ribosome", "Golgi"],
    correctAnswer: "Plasma membrane",
  },
  {
    type: "SHORT_ANSWER",
    prompt: "Define selectively permeable membrane in one sentence.",
    correctAnswer: "A membrane that lets some substances pass while blocking others",
  },
  {
    type: "FILL_IN_BLANK",
    prompt: "Water diffusion through a membrane is called ____.",
    correctAnswer: "osmosis",
  },
  {
    type: "MULTIPLE_CHOICE",
    prompt: "Which is NOT passive transport?",
    options: ["Diffusion", "Osmosis", "Facilitated diffusion", "Sodium-potassium pump"],
    correctAnswer: "Sodium-potassium pump",
  },
  {
    type: "MULTIPLE_CHOICE",
    prompt: "Hypertonic solution has ____ solute than the cell.",
    options: ["more", "less", "equal", "no"],
    correctAnswer: "more",
  },
  {
    type: "SHORT_ANSWER",
    prompt: "Name one molecule that often needs a transport protein.",
    correctAnswer: "Glucose",
  },
  {
    type: "MULTIPLE_CHOICE",
    prompt: "Facilitated diffusion requires which of the following?",
    options: ["A transport protein", "ATP hydrolysis", "A sodium-potassium pump", "Endocytosis"],
    correctAnswer: "A transport protein",
  },
  {
    type: "FILL_IN_BLANK",
    prompt: "Movement down a concentration gradient without ATP is ____ transport.",
    correctAnswer: "passive",
  },
  {
    type: "SHORT_ANSWER",
    prompt: "What happens to a plant cell in a hypotonic solution?",
    correctAnswer: "It becomes turgid as water enters",
  },
];

describe("generateQuizForCourse OpenRouter failover", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCourseFindFirst.mockResolvedValue({
      id: "course-bio",
      title: "Bio 101",
      description: null,
      materials: [],
      topics: [
        { name: "Osmosis", sortOrder: 0 },
        { name: "Membranes", sortOrder: 1 },
        { name: "Cell transport", sortOrder: 2 },
      ],
    });
    mockQuizCreate.mockImplementation(async (input) => ({
      id: "quiz-openrouter-1",
      ...input.data,
      questions: input.data.questions.create,
    }));
  });

  it("labels quiz when FallbackAIService routes to OpenRouter", async () => {
    mockComplete
      .mockResolvedValueOnce({
        content: JSON.stringify({ title: "Membranes Quiz", questions: goodQuestions }),
        provider: "openrouter",
        model: "free-model",
      })
      .mockResolvedValueOnce({
        content: JSON.stringify({ title: "Membranes Quiz", questions: goodQuestions }),
        provider: "openrouter",
        model: "free-model",
      });

    const quiz = await generateQuizForCourse("user-1", "course-bio", {
      questionCount: 10,
      topicName: "Osmosis",
    });

    expect(mockComplete).toHaveBeenCalled();
    expect(quiz.description).toMatch(/via openrouter/i);
    expect(quiz.questionCount).toBeGreaterThanOrEqual(7);
    expect(mockQuizCreate).toHaveBeenCalledOnce();
  });
});

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
  getOrCreateDefaultTopic: vi.fn().mockResolvedValue({ id: "topic-1", name: "General" }),
}));

import { generateQuizForCourse } from "@/lib/quizzes/generate";

const junkQuestions: GeneratedQuizQuestion[] = Array.from({ length: 10 }, (_, i) => ({
  type: "MULTIPLE_CHOICE" as const,
  prompt: `What is concept ${i + 1}?`,
  options: ["A", "B", "C", "D"],
  correctAnswer: "B",
}));

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
];

describe("generateQuizForCourse AI quality retry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCourseFindFirst.mockResolvedValue({
      id: "course-1",
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
      id: "quiz-1",
      ...input.data,
      questions: input.data.questions.create,
    }));
  });

  it("retries on next free provider when first AI bank fails quality filters", async () => {
    mockComplete
      .mockResolvedValueOnce({
        content: JSON.stringify({ title: "Junk Quiz", questions: junkQuestions }),
        provider: "gemini",
        model: "gemini-test",
      })
      .mockResolvedValueOnce({
        content: JSON.stringify({ title: "Membranes Quiz", questions: goodQuestions }),
        provider: "groq",
        model: "llama-test",
      });

    const quiz = await generateQuizForCourse("user-1", "course-1", {
      questionCount: 10,
    });

    expect(mockComplete).toHaveBeenCalledTimes(2);
    const retryOptions = mockComplete.mock.calls[1]?.[1];
    expect(retryOptions?.skipProviders).toEqual(["gemini"]);
    expect(quiz.description).toMatch(/via groq/i);
    expect(mockQuizCreate).toHaveBeenCalledOnce();
    const created = mockQuizCreate.mock.calls[0]?.[0]?.data;
    expect(created.questionCount).toBeGreaterThanOrEqual(7);
  });
});

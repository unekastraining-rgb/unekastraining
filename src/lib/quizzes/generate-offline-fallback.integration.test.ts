import { beforeEach, describe, expect, it, vi } from "vitest";

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

describe("generateQuizForCourse offline fallback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockComplete.mockRejectedValue(
      new Error("Gemini free tier quota exceeded. Add GROQ_API_KEY for failover."),
    );
    mockCourseFindFirst.mockResolvedValue({
      id: "course-bio",
      title: "Bio 101",
      description: null,
      materials: [],
      topics: [
        { name: "Osmosis", sortOrder: 0 },
        { name: "Cell membrane transport", sortOrder: 1 },
        { name: "Active transport", sortOrder: 2 },
      ],
    });
    mockQuizCreate.mockImplementation(async (input) => ({
      id: "quiz-offline-1",
      ...input.data,
      questions: input.data.questions.create,
    }));
  });

  it("uses topic-bank offline quiz when free-tier AI is exhausted", async () => {
    const quiz = await generateQuizForCourse("user-1", "course-bio", {
      questionCount: 8,
      topicName: "Osmosis",
    });

    expect(mockComplete).toHaveBeenCalled();
    expect(quiz.description).toContain("offline bank");
    expect(quiz.questionCount).toBeGreaterThanOrEqual(5);
    expect(mockQuizCreate).toHaveBeenCalledOnce();
    const created = mockQuizCreate.mock.calls[0]?.[0]?.data;
    expect(created.questions.create.length).toBeGreaterThanOrEqual(5);
    const prompts = created.questions.create.map(
      (item: { prompt: string }) => item.prompt,
    );
    expect(prompts.some((prompt: string) => /osmosis/i.test(prompt))).toBe(true);
  });
});

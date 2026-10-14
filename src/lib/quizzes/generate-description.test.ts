import { describe, expect, it } from "vitest";

import { formatLuckyQuizDescription, parseLuckyQuizSourceBadge } from "@/lib/quizzes/generate";

describe("formatLuckyQuizDescription", () => {
  it("attributes free-tier provider used for ChatGPT-level path", () => {
    expect(
      formatLuckyQuizDescription({
        difficulty: "MEDIUM",
        questionCount: 30,
        aiProvider: "groq",
      }),
    ).toBe("Lucky quiz · MEDIUM · 30 questions · via groq");
  });

  it("labels offline bank when AI did not produce items", () => {
    expect(
      formatLuckyQuizDescription({
        difficulty: "EASY",
        questionCount: 12,
        aiProvider: null,
      }),
    ).toBe("Lucky quiz · EASY · 12 questions · offline bank");
  });
});

describe("parseLuckyQuizSourceBadge", () => {
  it("detects free-tier AI provider", () => {
    expect(
      parseLuckyQuizSourceBadge("Lucky quiz · MEDIUM · 30 questions · via groq"),
    ).toEqual({ kind: "ai", provider: "groq" });
  });

  it("detects offline topic bank", () => {
    expect(
      parseLuckyQuizSourceBadge("Lucky quiz · EASY · 12 questions · offline bank"),
    ).toEqual({ kind: "offline" });
  });

  it("returns null for unrelated descriptions", () => {
    expect(parseLuckyQuizSourceBadge("Chapter 3 review")).toBeNull();
  });
});

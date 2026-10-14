import { describe, expect, it } from "vitest";

import { detectCoreStudyIntent } from "@/lib/core/study-intent";

describe("detectCoreStudyIntent", () => {
  it("lays out a study guide for create/study-this phrases", () => {
    expect(detectCoreStudyIntent("Create study guide")).toBe("study-guide");
    expect(detectCoreStudyIntent("Help me study this")).toBe("study-guide");
    expect(detectCoreStudyIntent("Study chapter 1")).toBe("study-guide");
  });

  it("does not steal conversational quiz-me into a layout action", () => {
    expect(detectCoreStudyIntent("Quiz me on chapter 1")).toBeNull();
  });

  it("detects generate/create quiz and flashcards", () => {
    expect(detectCoreStudyIntent("Generate a quiz")).toBe("quiz");
    expect(detectCoreStudyIntent("Make flashcards from this")).toBe("flashcards");
  });
});

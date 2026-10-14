import { describe, expect, it } from "vitest";

import { clampQuizQuestionCount, QUIZ_QUESTION_DEFAULT } from "@/lib/quizzes/limits";
import { quizQuestionsFromExtract } from "@/lib/quizzes/from-extract";
import {
  gradeObjectiveQuestion,
  normalizeGeneratedQuestions,
  normalizeQuestionType,
} from "@/lib/quizzes/types";
import type { ChapterStudyExtract } from "@/lib/core/chapter-study-extract";

describe("clampQuizQuestionCount", () => {
  it("keeps chapter quizzes between 20 and 30", () => {
    expect(clampQuizQuestionCount(6)).toBe(20);
    expect(clampQuizQuestionCount(24)).toBe(24);
    expect(clampQuizQuestionCount(80)).toBe(30);
    expect(clampQuizQuestionCount(undefined)).toBe(QUIZ_QUESTION_DEFAULT);
  });
});

describe("normalizeGeneratedQuestions", () => {
  it("keeps up to 30 mixed items including fill-in and which-is-not-true", () => {
    const questions = Array.from({ length: 24 }, (_, index) => ({
      type: index % 5 === 0 ? "WHICH_IS_NOT_TRUE" : index % 5 === 1 ? "FILL_IN_BLANK" : "MULTIPLE_CHOICE",
      prompt: `Q${index + 1} ${index % 5 === 1 ? "A bit is a ____." : "Which is not true?"}`,
      options: ["A", "B", "C", "D"],
      correctAnswer: index % 5 === 1 ? "binary" : "B",
    }));
    const parsed = normalizeGeneratedQuestions(questions, 30);
    expect(parsed).toHaveLength(24);
    expect(parsed.some((item) => item.type === "FILL_IN_BLANK")).toBe(true);
    expect(parsed.some((item) => item.type === "MULTIPLE_CHOICE")).toBe(true);
  });

  it("maps which-is-not-true to multiple choice", () => {
    expect(normalizeQuestionType("WHICH_IS_NOT_TRUE")).toBe("MULTIPLE_CHOICE");
    expect(normalizeQuestionType("fill in blank")).toBe("FILL_IN_BLANK");
  });
});

describe("gradeObjectiveQuestion", () => {
  it("grades true/false when the stored answer is the string false", () => {
    expect(gradeObjectiveQuestion("TRUE_FALSE", JSON.stringify("false"), false)).toBe(true);
    expect(gradeObjectiveQuestion("TRUE_FALSE", JSON.stringify("false"), true)).toBe(false);
  });
});

describe("quizQuestionsFromExtract", () => {
  it("turns typed extract items into Lucky questions", () => {
    const extract: ChapterStudyExtract = {
      title: "Chapter 1",
      chapterOverview: "",
      learningObjectives: [],
      definitions: [],
      frameworks: [],
      comparisons: [],
      mustKnow: [],
      studyToRemember: [],
      processesOrSteps: [],
      recommendedFormats: [],
      testYourself: [
        {
          type: "TRUE_FALSE",
          question: "RAM is volatile.",
          answer: "true",
        },
        {
          type: "WHICH_IS_NOT_TRUE",
          question: "Which of the following is NOT true of a compiler?",
          options: ["Translates the whole program", "Runs line by line", "Produces an executable"],
          answer: "Runs line by line",
        },
        {
          type: "FILL_IN_BLANK",
          question: "A bit is a ____ digit.",
          answer: "binary",
        },
      ],
    };
    const questions = quizQuestionsFromExtract(extract);
    expect(questions).toHaveLength(3);
    expect(questions[0]?.type).toBe("TRUE_FALSE");
    expect(questions[0]?.correctAnswer).toBe(true);
    expect(questions[1]?.type).toBe("MULTIPLE_CHOICE");
    expect(questions[2]?.type).toBe("FILL_IN_BLANK");
  });

  it("builds quiz items from definitions and LOs when testYourself is thin", () => {
    const extract: ChapterStudyExtract = {
      title: "Welcome to Java",
      chapterOverview: "Introduces a first Java program.",
      learningObjectives: [
        {
          code: "LO 1-1",
          statement: "Explain what a Java class contains.",
          keyPoints: ["class body", "main method"],
        },
      ],
      definitions: [
        { term: "main method", definition: "The entry point of a Java application." },
        { term: "System.out.println", definition: "Prints a line to the console." },
      ],
      frameworks: [{ name: "Welcome program parts", items: ["class", "main", "println"] }],
      comparisons: [],
      mustKnow: ["Java is case-sensitive."],
      studyToRemember: [],
      processesOrSteps: [
        { name: "Run a Java program", steps: ["Write", "Compile", "Run"] },
      ],
      workedExamples: [],
      recommendedFormats: [],
      testYourself: [
        { question: "What does Welcome print?", answer: "Welcome to Java!" },
      ],
    };
    const questions = quizQuestionsFromExtract(extract);
    expect(questions.length).toBeGreaterThanOrEqual(6);
    expect(questions.some((item) => /main method/i.test(item.prompt))).toBe(true);
    expect(questions.some((item) => /Welcome print/i.test(item.prompt))).toBe(true);
  });
});

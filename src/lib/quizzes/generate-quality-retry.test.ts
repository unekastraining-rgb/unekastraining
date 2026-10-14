import { describe, expect, it } from "vitest";

import { needsAiQuizQualityRetry } from "@/lib/quizzes/generate";
import type { GeneratedQuizQuestion } from "@/lib/quizzes/types";

describe("needsAiQuizQualityRetry", () => {
  it("retries when MC answers are bare letters (sanitize guts the bank)", () => {
    const junk: GeneratedQuizQuestion[] = Array.from({ length: 10 }, (_, i) => ({
      type: "MULTIPLE_CHOICE" as const,
      prompt: `What is concept ${i + 1}?`,
      options: ["A", "B", "C", "D"],
      correctAnswer: "B",
      explanation: "Letter-only options are junk.",
    }));
    expect(needsAiQuizQualityRetry(junk, 10)).toBe(true);
  });

  it("does not retry a solid ChatGPT-tutor style bank", () => {
    const solid: GeneratedQuizQuestion[] = [
      {
        type: "MULTIPLE_CHOICE",
        prompt: "Which process moves water across a selectively permeable membrane?",
        options: [
          "Osmosis",
          "Phagocytosis",
          "Active transport of ions",
          "Exocytosis of proteins",
        ],
        correctAnswer: "Osmosis",
        explanation: "Osmosis is diffusion of water through a membrane.",
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "Which structure controls what enters and leaves the cell?",
        options: [
          "Nucleus",
          "Plasma membrane",
          "Ribosome",
          "Cytoskeleton fiber",
        ],
        correctAnswer: "Plasma membrane",
        explanation: "The plasma membrane is selectively permeable.",
      },
      {
        type: "SHORT_ANSWER",
        prompt: "In one sentence, what is a selectively permeable membrane?",
        correctAnswer: "A membrane that lets some substances pass while blocking others",
      },
      {
        type: "FILL_IN_BLANK",
        prompt: "The diffusion of water through a selectively permeable membrane is called ____.",
        correctAnswer: "osmosis",
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "Which is NOT a form of passive transport?",
        options: [
          "Simple diffusion",
          "Facilitated diffusion",
          "Osmosis",
          "Sodium-potassium pump",
        ],
        correctAnswer: "Sodium-potassium pump",
        explanation: "The pump uses ATP (active transport).",
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "What is the main solvent in living cells?",
        options: ["Water", "Glucose", "Oxygen", "Cholesterol"],
        correctAnswer: "Water",
        explanation: "Cytoplasm is mostly water.",
      },
      {
        type: "SHORT_ANSWER",
        prompt: "Name one molecule that often needs a membrane protein to cross.",
        correctAnswer: "Glucose (or ions / charged molecules)",
      },
    ];
    expect(needsAiQuizQualityRetry(solid, 10)).toBe(false);
  });

  it("retries when too few items survive after filters", () => {
    const thin: GeneratedQuizQuestion[] = [
      {
        type: "TRUE_FALSE",
        prompt: "Define: Sources",
        correctAnswer: "true",
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "Part 1 Business Trends",
        options: ["A)", "B)", "C)", "D)"],
        correctAnswer: "A",
      },
    ];
    expect(needsAiQuizQualityRetry(thin, 10)).toBe(true);
  });
});

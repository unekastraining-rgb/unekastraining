import { describe, expect, it } from "vitest";

import {
  preferMcAndWriteIns,
  resolveMultipleChoiceAnswer,
  sanitizeQuizQuestions,
} from "@/lib/quizzes/sanitize-questions";

describe("resolveMultipleChoiceAnswer", () => {
  it("maps letter answers onto option text", () => {
    expect(
      resolveMultipleChoiceAnswer("B", [
        "Revenue",
        "Profit",
        "Cost",
        "Inventory",
      ]),
    ).toBe("Profit");
  });
});

describe("sanitizeQuizQuestions", () => {
  it("drops TOC junk and bare-letter MC options", () => {
    const cleaned = sanitizeQuizQuestions([
      {
        type: "SHORT_ANSWER",
        prompt: "What is Sources?",
        correctAnswer: "Sources",
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "What is a business?",
        options: ["A", "B", "C", "D"],
        correctAnswer: "A",
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "What is profit?",
        options: [
          "Money earned above expenses",
          "Total revenue before costs",
          "A fixed cost of goods",
          "Unsold inventory value",
        ],
        correctAnswer: "B",
      },
      {
        type: "SHORT_ANSWER",
        prompt: "Define: Part 1 Business Trends",
        correctAnswer: "Trends",
      },
    ]);
    expect(cleaned).toHaveLength(1);
    expect(cleaned[0]?.prompt).toBe("What is profit?");
    expect(cleaned[0]?.correctAnswer).toBe("Total revenue before costs");
  });

  it("rejects MC with silly distractors and empty write-ins", () => {
    const cleaned = sanitizeQuizQuestions([
      {
        type: "MULTIPLE_CHOICE",
        prompt: "What is outsourcing?",
        options: ["Hiring another firm", "None of these", "Page number", "Unrelated term 2"],
        correctAnswer: "Hiring another firm",
      },
      {
        type: "SHORT_ANSWER",
        prompt: "Define profit.",
        correctAnswer: "See material",
      },
    ]);
    expect(cleaned).toHaveLength(0);
  });
});

describe("preferMcAndWriteIns", () => {
  it("keeps only MC + write-ins (drops TF / MR / scenario)", () => {
    const next = preferMcAndWriteIns([
      {
        type: "TRUE_FALSE",
        prompt: "Businesses make money.",
        correctAnswer: true,
      },
      {
        type: "MULTIPLE_RESPONSE",
        prompt: "Pick all that apply.",
        options: ["A", "B", "C", "D"],
        correctAnswer: "A",
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "What is profit?",
        options: [
          "Money earned above expenses",
          "Total revenue",
          "A fixed cost",
          "Inventory",
        ],
        correctAnswer: "Money earned above expenses",
      },
      {
        type: "SHORT_ANSWER",
        prompt: "Define outsourcing.",
        correctAnswer: "Hiring another company",
      },
    ]);
    expect(next.every((item) => item.type !== "TRUE_FALSE")).toBe(true);
    expect(next.every((item) => item.type !== "MULTIPLE_RESPONSE")).toBe(true);
    expect(next.length).toBe(2);
  });
});

describe("sanitizeQuizQuestions letter prefixes", () => {
  it("strips A) prefixes from options before resolving", () => {
    const cleaned = sanitizeQuizQuestions([
      {
        type: "MULTIPLE_CHOICE",
        prompt: "What is osmosis?",
        options: [
          "A) Water diffusion across a membrane",
          "B) Protein synthesis",
          "C) DNA replication",
          "D) Cell wall building",
        ],
        correctAnswer: "A",
      },
    ]);
    expect(cleaned).toHaveLength(1);
    expect(cleaned[0]?.correctAnswer).toBe("Water diffusion across a membrane");
    expect(cleaned[0]?.options?.[0]).toBe("Water diffusion across a membrane");
  });
});

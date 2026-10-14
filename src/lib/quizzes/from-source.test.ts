import { describe, expect, it } from "vitest";

import {
  isJunkPrompt,
  isJunkQuizTerm,
  quizQuestionsFromSourceText,
} from "@/lib/quizzes/from-source";
import { QUIZ_QUESTION_DEFAULT } from "@/lib/quizzes/limits";

describe("quizQuestionsFromSourceText", () => {
  it("builds quiz items from a Java Welcome program", () => {
    const source = `
public class Welcome {
  public static void main(String[] args) {
    // Display message Welcome to Java! on the console
    System.out.println("Welcome to Java!");
  }
}
`;
    const questions = quizQuestionsFromSourceText(source);
    expect(questions.length).toBeGreaterThanOrEqual(3);
    expect(questions.some((item) => /Welcome/i.test(String(item.correctAnswer)))).toBe(true);
    expect(questions.some((item) => item.type === "MULTIPLE_CHOICE" || item.type === "SHORT_ANSWER")).toBe(
      true,
    );
  });

  it("builds a chapter-style bank from business definitions", () => {
    const source = `
A business is any activity that seeks to provide goods and services to others while operating at a profit.
Profit is the amount of money a business earns above and beyond what it spends.
A loss occurs when a business's expenses are more than its revenues.
Risk is the chance an entrepreneur takes of losing time and money on a business that may not prove profitable.
Stakeholders are all the people who stand to gain or lose by the policies and activities of a business.
Outsourcing means contracting with other companies to do some of the functions of a firm.
Insourcing occurs when foreign companies establish design and production facilities in the United States.
A nonprofit organization is an organization whose goals do not include making a personal profit for its owners.
Standard of living refers to the amount of goods and services people can buy with the money they have.
Quality of life refers to the general well-being of a society in terms of political freedom, safety, and health.
`;
    const questions = quizQuestionsFromSourceText(source, 30);
    expect(questions.length).toBeGreaterThanOrEqual(12);
    expect(questions.some((item) => item.type === "MULTIPLE_CHOICE")).toBe(true);
    expect(
      questions.some(
        (item) => item.type === "SHORT_ANSWER" || item.type === "FILL_IN_BLANK",
      ),
    ).toBe(true);
    expect(questions.every((item) => item.type !== "TRUE_FALSE")).toBe(true);
    expect(questions.some((item) => /business|profit|stakeholder/i.test(item.prompt))).toBe(true);
  });

  it("ignores TOC headings like Sources and Part 1 Business Trends", () => {
    const source = `
Part 1 Business Trends: An overview of the unit
Sources: Nickels et al.
Source: Course pack
A business is any activity that seeks to provide goods and services to others while operating at a profit.
Profit is the amount of money a business earns above and beyond what it spends for salaries and other expenses.
Stakeholders are all the people who stand to gain or lose by the policies and activities of a business.
`;
    const questions = quizQuestionsFromSourceText(source, 20);
    expect(questions.every((item) => !/define:?\s*(sources?|part\s+1)/i.test(item.prompt))).toBe(
      true,
    );
    expect(questions.some((item) => /business|profit|stakeholder/i.test(item.prompt))).toBe(true);
  });
});

describe("isJunkPrompt", () => {
  it("rejects TOC-style and structural prompts", () => {
    expect(isJunkPrompt("Define: Sources")).toBe(true);
    expect(isJunkPrompt("Define: Part 1 Business Trends")).toBe(true);
    expect(isJunkPrompt("What is Sources?")).toBe(true);
    expect(isJunkPrompt("What is a business?")).toBe(false);
    expect(isJunkPrompt("Define profit.")).toBe(false);
  });
});

describe("chapter review quality bar", () => {
  it("defaults to a full ~30 question review size", () => {
    expect(QUIZ_QUESTION_DEFAULT).toBe(30);
  });

  it("keeps MC + write-ins dominant with no true/false junk from heuristics", () => {
    const source = `
A business is any activity that seeks to provide goods and services to others while operating at a profit.
Profit is the amount of money a business earns above and beyond what it spends.
Stakeholders are all the people who stand to gain or lose by the policies and activities of a business.
Outsourcing means contracting with other companies to do some of the functions of a firm.
Risk is the chance an entrepreneur takes of losing time and money on a business that may not prove profitable.
Entrepreneurs are people who risk time and money to start and manage a business.
Factors of production are the resources used to create wealth: land, labor, capital, entrepreneurship, and knowledge.
`;
    const questions = quizQuestionsFromSourceText(source, QUIZ_QUESTION_DEFAULT);
    const mc = questions.filter((item) => item.type === "MULTIPLE_CHOICE").length;
    const writeIns = questions.filter(
      (item) => item.type === "SHORT_ANSWER" || item.type === "FILL_IN_BLANK",
    ).length;
    expect(questions.length).toBeGreaterThanOrEqual(10);
    expect(mc).toBeGreaterThan(0);
    expect(writeIns).toBeGreaterThan(0);
    expect(questions.every((item) => item.type !== "TRUE_FALSE")).toBe(true);
    expect(questions.every((item) => !isJunkPrompt(item.prompt))).toBe(true);
  });
});

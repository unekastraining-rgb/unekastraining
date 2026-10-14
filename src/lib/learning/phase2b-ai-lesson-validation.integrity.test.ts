/**
 * Phase 2B — AI lesson validation gate.
 * Parsed JSON ≠ automatically accepted Learn lesson.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import type { SixWorkedLesson } from "@/lib/csl/six-worked-lesson";
import {
  buildSubjectAwareFallbackLesson,
  isMetaStudySkillOutlineLesson,
} from "@/lib/csl/six-worked-lesson";
import { validateAiLesson } from "@/lib/csl/validate-ai-lesson";
import {
  isPlaceholderScaffoldLesson,
  synthesizeInstructionalLesson,
} from "@/lib/learning/knowledge/instructional-library";
import "@/lib/learning/knowledge/packs";

function read(rel: string) {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

function baseLesson(
  topic: string,
  chunks: SixWorkedLesson["chunks"],
): SixWorkedLesson {
  return {
    component: "detailed-explanation",
    topic,
    learningFrame: `You're learning ${topic}.`,
    roadmap: chunks.map((c) => c.title),
    chunks,
    cheatSheet: chunks.map((c) => c.title).join(" → "),
    practicePrompts: [
      {
        title: "Explain",
        prompt: `Explain ${topic} in your own words.`,
        tip: "Cover first.",
      },
      {
        title: "Apply",
        prompt: `Apply one idea from ${topic}.`,
        tip: "Use an example.",
      },
    ],
  };
}

describe("Phase 2B AI lesson validation", () => {
  it("Test A — Valid Stocks lesson accepted", () => {
    const lesson = baseLesson("Stocks", [
      {
        title: "Why stocks exist",
        role: "context",
        explanation:
          "Companies raise money by selling ownership shares called stocks. Buyers become shareholders who share in profits and risk.",
        example:
          "Buying 10 shares of a company means you own a tiny slice of that business.",
        checkPrompt: "What does a share represent?",
      },
      {
        title: "Price and markets",
        role: "concept",
        explanation:
          "Stock prices move on exchanges as buyers and sellers agree on value. Supply, demand, and news about the firm shift the market price.",
        example: "Good earnings news can push a stock price higher as demand rises.",
        representation: "Buyers ↔ Exchange ↔ Sellers → price",
      },
      {
        title: "Risk and return",
        role: "explain",
        explanation:
          "Stocks can grow your money faster than cash, but prices can also fall. Diversifying a portfolio spreads risk across many shares.",
        example: "A portfolio of many stocks is usually less risky than one single share.",
        misconception: "A rising stock is never a guarantee of future gains.",
      },
      {
        title: "Worked decision",
        role: "worked",
        explanation:
          "Compare two stocks: one pays a dividend, one reinvests for growth. Choose based on income needs versus long-term growth.",
        example: "Dividend stock vs growth stock tradeoff for a new investor.",
        breakdown: "1) Goal 2) Horizon 3) Risk tolerance 4) Choose",
        checkPrompt: "Which investor prefers dividends?",
      },
    ]);

    const result = validateAiLesson({
      lesson,
      canonicalTarget: "Stocks",
    });
    expect(result.accepted).toBe(true);
    expect(result.checks.targetAligned).toBe(true);
  });

  it("Test B — Wrong subject (Stocks taught as Python) rejected", () => {
    const lesson = baseLesson("Stocks", [
      {
        title: "Variables",
        role: "concept",
        explanation:
          "In Python a variable stores a value in memory so you can reuse it later in the program.",
        example: "x = 5",
      },
      {
        title: "Loops",
        role: "explain",
        explanation:
          "A for-loop repeats a block of Python code for each item in a list or range.",
        example: "for i in range(3): print(i)",
      },
      {
        title: "Functions",
        role: "worked",
        explanation:
          "Define a Python function with def so you can call reusable logic with parameters and return values.",
        example: "def add(a, b): return a + b",
      },
    ]);

    const result = validateAiLesson({
      lesson,
      canonicalTarget: "Stocks",
    });
    expect(result.accepted).toBe(false);
    expect(result.checks.targetAligned).toBe(false);
    expect(result.reasons.join(" ")).toMatch(/aligned|target/i);
  });

  it("Test C — Generic study advice rejected for Python", () => {
    const lesson = baseLesson("Python Programming fundamentals", [
      {
        title: "Take notes",
        role: "context",
        explanation:
          "Take notes while you study so you remember what you read later in the week.",
        example: "Write key points in a notebook after each chapter.",
      },
      {
        title: "Review your notes",
        role: "explain",
        explanation:
          "Review your notes regularly using active recall instead of rereading passively.",
        example: "Cover the page and try to recite the main ideas.",
      },
      {
        title: "Study regularly",
        role: "apply",
        explanation:
          "Study regularly with spaced repetition and flashcards to keep ideas fresh over time.",
        example: "Use a pomodoro timer and flashcards every other day.",
      },
    ]);

    const result = validateAiLesson({
      lesson,
      canonicalTarget: "Python Programming fundamentals",
    });
    expect(result.accepted).toBe(false);
    expect(result.checks.isNotMetaStudySkill).toBe(false);
  });

  it("Test D — Placeholder scaffold rejected", () => {
    const scaffold = synthesizeInstructionalLesson(
      "detailed-explanation",
      "Stocks",
    );
    expect(isPlaceholderScaffoldLesson(scaffold)).toBe(true);

    const result = validateAiLesson({
      lesson: scaffold,
      canonicalTarget: "Stocks",
    });
    expect(result.accepted).toBe(false);
    expect(result.checks.isNotPlaceholder).toBe(false);
  });

  it("Test E — OCR heading dump rejected", () => {
    const grounding = `
CHAPTER 1 TAKING RISKS AND MAKING PROFITS WITHIN THE DYNAMIC BUSINESS ENVIRONMENT
CHAPTER 2 UNDERSTANDING ECONOMICS AND HOW IT AFFECTS BUSINESS
CHAPTER 3 COMPETING IN GLOBAL MARKETS
`.trim();

    const lesson = baseLesson("How Economics Affects Business", [
      {
        title: "TAKING RISKS AND MAKING PROFITS WITHIN THE DYNAMIC BUSINESS ENVIRONMENT",
        role: "context",
        explanation: "TAKING RISKS AND MAKING PROFITS WITHIN THE DYNAMIC BUSINESS ENVIRONMENT.",
        example: "See chapter 1.",
      },
      {
        title: "UNDERSTANDING ECONOMICS AND HOW IT AFFECTS BUSINESS",
        role: "concept",
        explanation: "UNDERSTANDING ECONOMICS AND HOW IT AFFECTS BUSINESS.",
        example: "See chapter 2.",
      },
      {
        title: "COMPETING IN GLOBAL MARKETS",
        role: "explain",
        explanation: "COMPETING IN GLOBAL MARKETS as listed in the table of contents.",
        example: "See chapter 3.",
      },
    ]);

    const result = validateAiLesson({
      lesson,
      canonicalTarget: "How Economics Affects Business",
      grounding,
      courseTitle: "Introduction to Business",
    });
    expect(result.accepted).toBe(false);
    expect(result.checks.notSourceHeadingDominated).toBe(false);
  });

  it("Test F — Legitimate Business lesson accepted", () => {
    const grounding = `
CHAPTER 1 TAKING RISKS AND MAKING PROFITS WITHIN THE DYNAMIC BUSINESS ENVIRONMENT
Economics shapes pricing and firm decisions.
`.trim();

    const lesson = baseLesson("How Economics Affects Business", [
      {
        title: "Why economics matters to firms",
        role: "context",
        explanation:
          "Businesses operate under scarcity. Economics explains how prices, incentives, and competition shape what firms produce and sell.",
        example:
          "A coffee shop raises prices when bean costs rise — an economic response to cost and demand.",
        checkPrompt: "What problem does economics help a manager see?",
      },
      {
        title: "Supply and demand",
        role: "concept",
        explanation:
          "Supply and demand interact to set market prices. When demand rises and supply is fixed, prices tend to increase.",
        example: "Concert tickets sell out and resale prices climb.",
        representation: "Demand ↑ + Supply fixed → Price ↑",
      },
      {
        title: "Incentives and decisions",
        role: "explain",
        explanation:
          "Managers use economic thinking to allocate resources: hire, price, expand, or cut. Tradeoffs appear whenever capital is limited.",
        example: "Expand one store vs open a second location — opportunity cost.",
        misconception: "Profit alone ignores risk and opportunity cost.",
      },
      {
        title: "Apply to strategy",
        role: "apply",
        explanation:
          "Walk a firm decision using economics: identify market, estimate demand, compare costs, choose the action that improves expected profit under risk.",
        example: "A retailer chooses inventory levels before a holiday surge.",
        breakdown: "Market → Demand → Cost → Decision",
        checkPrompt: "Name one economic signal that would change the decision.",
      },
    ]);

    const result = validateAiLesson({
      lesson,
      canonicalTarget: "How Economics Affects Business",
      grounding,
      courseTitle: "Introduction to Business",
    });
    expect(result.accepted).toBe(true);
    expect(result.checks.targetAligned).toBe(true);
    expect(result.checks.notSourceHeadingDominated).toBe(true);
  });

  it("Test G — Python fundamentals lesson accepted", () => {
    const lesson = baseLesson("Python Programming fundamentals", [
      {
        title: "Why Python programs need structure",
        role: "context",
        explanation:
          "Python programs store data, make decisions, and repeat work. Fundamentals give you the building blocks before larger apps.",
        example: "A script that asks for a name and prints a greeting.",
      },
      {
        title: "Variables and data types",
        role: "concept",
        explanation:
          "Variables hold values. Common Python data types include int, float, str, and bool. Choosing the right type keeps operations correct.",
        example: 'age = 20\nname = "Ada"\nready = True',
        representation: "name → value (typed)",
      },
      {
        title: "Conditionals and loops",
        role: "explain",
        explanation:
          "Conditionals branch with if/elif/else. Loops repeat with for or while so you do not copy-paste the same lines.",
        example: "for n in range(3):\n  print(n)",
        breakdown: "if → branch · for → repeat",
      },
      {
        title: "Functions",
        role: "worked",
        explanation:
          "Functions package reusable logic. Define with def, pass arguments, and return a result so callers stay simple.",
        example: "def square(n):\n  return n * n",
        checkPrompt: "What does return do?",
      },
    ]);

    const result = validateAiLesson({
      lesson,
      canonicalTarget: "Python Programming fundamentals",
    });
    expect(result.accepted).toBe(true);
    expect(result.checks.targetAligned).toBe(true);
  });

  it("Test H — OOD specialized dealership path still works", () => {
    const lesson = buildSubjectAwareFallbackLesson(
      "detailed-explanation",
      "Classes & Objects",
    );
    expect(lesson).not.toBeNull();
    expect(isMetaStudySkillOutlineLesson(lesson!)).toBe(false);
    expect(lesson!.chunks[0]?.explanation.toLowerCase()).toMatch(
      /dealership|imagine|hundreds of cars|why/,
    );
    // Specialized lessons are not gated as AI success; if validated, they pass.
    const result = validateAiLesson({
      lesson: lesson!,
      canonicalTarget: "Classes & Objects",
    });
    expect(result.accepted).toBe(true);
  });

  it("Test I — six-lesson still uses existing fallback ladder on AI failure", () => {
    const route = read("app/api/study/six-lesson/route.ts");
    expect(route).toContain("buildSubjectAwareFallbackLesson");
    expect(route).toContain('component === "detailed-explanation"');
    expect(route).toContain("success: false");
    expect(route).not.toContain("synthesizeInstructionalLesson");
    expect(route).not.toContain("fallback-knowledge");
  });

  it("Test J — AI validation failure throws into existing catch/fallback path", () => {
    const route = read("app/api/study/six-lesson/route.ts");
    expect(route).toContain("validateAiLesson");
    expect(route).toContain("validation.accepted");
    expect(route).toContain("canonicalTarget: teachingTopic");
    // Rejected AI must not return success before the catch block.
    const successIdx = route.indexOf("validateAiLesson");
    const catchIdx = route.indexOf("Six worked lesson AI failed");
    expect(successIdx).toBeGreaterThan(-1);
    expect(catchIdx).toBeGreaterThan(successIdx);
    expect(route).toContain("sourceText: groundingSource");
  });
});
